"use node";

/**
 * Podepsané přehrávání videa.
 *
 * PROČ TO JE V CONVEXU A NE V NEXT.JS:
 * podpis se smí vydat až po kontrole členství, a ta žije tady. Kdyby se
 * podepisovalo na frontendu, existovaly by dvě místa, kde se rozhoduje
 * o přístupu — a jedno z nich by dřív nebo později zapomnělo zeptat se.
 *
 * PROČ ABSTRAKCE NAD PROVIDEREM:
 * ven jde obyčejná HLS adresa. Frontend neví, kdo ji servíruje, takže
 * výměna providera je změna dvou polí u lekce, ne přepis přehrávače.
 * Aktuálně jede Mux (rozhodnuto 28. 8. 2026, viz plán) — `bunny` větev
 * zůstává jen jako tvar, kdyby se rozhodnutí měnilo.
 */
import jwt from "jsonwebtoken";
import { v } from "convex/values";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Jak dlouho platí podpis.
 *
 * Půl hodiny je kompromis: nejdelší lekce má 8 minut, takže se do okna vejde
 * i s pauzami, a zkopírovaná adresa je zároveň za chvíli k ničemu. Kdyby
 * token přesto vypršel uprostřed, přehrávač si po chybě vyžádá nový a naváže
 * na stejné sekundě (viz LessonView).
 */
const TOKEN_TTL_SECONDS = 30 * 60;

/** Strop rozlišení. Bez něj Mux účtuje vyšší tier, i když ho nikdo nepotřebuje. */
const MAX_RESOLUTION = "1080p";

type Playback = {
  src: string;
  type: "application/x-mpegurl";
  /** Náhledy při přetahování časové osy. Null, když je přehrávání nepodepsané. */
  storyboardUrl: string | null;
  posterUrl: string | null;
  expiresAt: number;
  /** Vývojová pojistka — na produkci nesmí být nikdy true. */
  unsigned: boolean;
};

/**
 * Mux podepisuje RS256 JWT. `aud` rozlišuje, k čemu token opravňuje:
 * `v` playback, `t` poster, `s` storyboard. Každý zdroj chce vlastní token.
 */
function signMux(playbackId: string, audience: "v" | "t" | "s", expSeconds: number) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keyBase64 = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !keyBase64) return null;

  /**
   * Playback Restriction — druhá vrstva nad podpisem.
   *
   * Samotný podpis říká „tenhle token je pravý", ale ne „přehrává se tam,
   * kde má". Restrikce k tomu přidá kontrolu hlavičky Referer proti seznamu
   * domén a odmítne požadavky bez ní nebo s rizikovým User-Agentem.
   * Prakticky to znamená, že zkopírovaná adresa v VLC, curlu, yt-dlp ani
   * na cizím webu nehraje — a to i dokud token ještě platí.
   */
  const restriction = process.env.MUX_PLAYBACK_RESTRICTION_ID;

  const privateKey = Buffer.from(keyBase64, "base64").toString("utf8");
  return jwt.sign(
    {
      sub: playbackId,
      aud: audience,
      exp: expSeconds,
      kid: keyId,
      ...(restriction ? { playback_restriction_id: restriction } : {}),
    },
    privateKey,
    { algorithm: "RS256" },
  );
}

function muxPlayback(assetId: string): Playback {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const playbackToken = signMux(assetId, "v", exp);

  if (!playbackToken) {
    // Bez podpisových klíčů se dá vyvíjet, ale nesmí se to dostat na produkci.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Chybí MUX_SIGNING_KEY_ID / MUX_SIGNING_PRIVATE_KEY — nepodepsané přehrávání na produkci není přípustné.",
      );
    }
    return {
      src: `https://stream.mux.com/${assetId}.m3u8?max_resolution=${MAX_RESOLUTION}`,
      type: "application/x-mpegurl",
      storyboardUrl: null,
      posterUrl: `https://image.mux.com/${assetId}/thumbnail.webp`,
      expiresAt: exp * 1000,
      unsigned: true,
    };
  }

  const storyboardToken = signMux(assetId, "s", exp);
  const thumbToken = signMux(assetId, "t", exp);

  return {
    src: `https://stream.mux.com/${assetId}.m3u8?max_resolution=${MAX_RESOLUTION}&token=${playbackToken}`,
    type: "application/x-mpegurl",
    storyboardUrl: storyboardToken
      ? `https://image.mux.com/${assetId}/storyboard.vtt?token=${storyboardToken}`
      : null,
    posterUrl: thumbToken
      ? `https://image.mux.com/${assetId}/thumbnail.webp?token=${thumbToken}`
      : null,
    expiresAt: exp * 1000,
    unsigned: false,
  };
}

/**
 * Bunny nepodepisujeme. Jejich token auth je per-path a segmenty ho nedědí
 * (potvrzeno napříč 2021–2026), takže podepsaná adresa by manifest pustila
 * a video ne. Kdyby se sem provider vracel, ochrana musí stát na jejich
 * iframe embedu nebo na DRM — ne na téhle funkci.
 */
function bunnyPlayback(assetId: string): Playback {
  const host = process.env.BUNNY_CDN_HOSTNAME;
  if (!host) throw new Error("Chybí BUNNY_CDN_HOSTNAME.");
  return {
    src: `https://${host}/${assetId}/playlist.m3u8`,
    type: "application/x-mpegurl",
    storyboardUrl: null,
    posterUrl: `https://${host}/${assetId}/thumbnail.jpg`,
    expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000,
    unsigned: true,
  };
}

/**
 * Vydá adresu k přehrání lekce. Vrací `null`, když na ni volající nemá nárok —
 * záměrně bez rozlišení „neexistuje" a „nesmíš", aby se přes tuhle funkci
 * nedal zjistit katalog placeného obsahu.
 */
export const signedPlayback = action({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }): Promise<Playback | null> => {
    const target = await ctx.runQuery(
      internal.digiuniverzita.playbackTarget,
      { lessonId },
    );
    if (!target) return null;

    return target.provider === "mux"
      ? muxPlayback(target.assetId)
      : bunnyPlayback(target.assetId);
  },
});

/**
 * Vydá adresu pro přímé nahrání videa z prohlížeče.
 *
 * Soubor jde rovnou k Muxu, ne přes náš server — sto megabajtů přes Convex
 * akci by nedávalo smysl. `passthrough` nese, ke které lekci video patří;
 * napojení pak udělá webhook, až enkódování doběhne.
 */
export const createDirectUpload = action({
  args: { courseSlug: v.string(), lessonSlug: v.string() },
  handler: async (ctx, { courseSlug, lessonSlug }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.role !== "admin") {
      throw new Error("Jen pro adminy.");
    }

    const id = process.env.MUX_TOKEN_ID;
    const secret = process.env.MUX_TOKEN_SECRET;
    if (!id || !secret) throw new Error("Chybí MUX_TOKEN_ID / MUX_TOKEN_SECRET.");

    const res = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        authorization:
          "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: {
          video_quality: "basic",
          playback_policies: ["signed"],
          passthrough: `${courseSlug}/${lessonSlug}`,
        },
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(
        `Mux upload → ${res.status}: ${body?.error?.messages?.join("; ") ?? res.statusText}`,
      );
    }
    return { uploadUrl: body.data.url as string, uploadId: body.data.id as string };
  },
});
