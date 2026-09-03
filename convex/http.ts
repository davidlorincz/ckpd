import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { hashKey } from "./lib/code";

/**
 * Veřejné HTTP rozhraní. Ven se vystavuje pod `https://ckpd.cz/api/v1/*`
 * přes rewrite v next.config.ts — partnerům se dokumentuje ta adresa.
 *
 * Logika běží tady, a ne v Next route handleru, protože rate limit, vyhledání
 * a zápis do auditu tak proběhnou atomicky v jedné Convex mutaci.
 *
 * Ověřování má dvě cesty se shodným chováním i tvarem odpovědi:
 *  - `/api/v1/verify`         — ostrý provoz nad evidencí členů
 *  - `/api/v1/sandbox/verify` — pískoviště nad fixturami (lib/sandbox.ts)
 *
 * Odděleny jsou schválně adresou, ne jen klíčem: v ostré cestě tak nemůže
 * uvíznout testovací kód ani omylem. Handler je jeden, liší se jen předaný
 * režim — rozdílné implementace by se dřív nebo později rozešly.
 */
const http = httpRouter();

/** Záměrně BEZ CORS hlaviček — je to server-to-server rozhraní. */
function json(
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Stav členství se mění a odvolaný souhlas se musí projevit hned.
      "cache-control": "no-store",
      ...extra,
    },
  });
}

const makeVerifyHandler = (mode: "live" | "test") =>
  httpAction(async (ctx, request) => {
    const auth = request.headers.get("authorization") ?? "";
    const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1]?.trim();

    if (!bearer) {
      return json(
        {
          error: "unauthorized",
          message: "Chybí hlavička Authorization: Bearer <klíč>.",
        },
        401,
      );
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return json(
        { error: "missing_code", message: "Chybí parametr `code`." },
        400,
      );
    }

    // Hash se počítá tady, do mutace jde jen otisk — plaintext klíče se nikam
    // neukládá ani neloguje.
    const result = await ctx.runMutation(internal.verification.verify, {
      keyHash: await hashKey(bearer),
      code,
      mode,
    });

    const headers: Record<string, string> = {};
    if (result.rateLimit) {
      headers["x-ratelimit-limit"] = String(result.rateLimit.limit);
      headers["x-ratelimit-remaining"] = String(result.rateLimit.remaining);
      headers["x-ratelimit-reset"] = String(
        Math.floor(result.rateLimit.resetAt / 1000),
      );
    }
    if (result.status === 429) headers["retry-after"] = "60";

    return json(result.body, result.status, headers);
  });

http.route({
  path: "/api/v1/verify",
  method: "GET",
  handler: makeVerifyHandler("live"),
});
http.route({
  path: "/api/v1/sandbox/verify",
  method: "GET",
  handler: makeVerifyHandler("test"),
});

/**
 * Dopsání pozice ve videu při odchodu ze stránky.
 *
 * PROČ VLASTNÍ HTTP CESTA A NE OBYČEJNÁ MUTACE: když divák zavře kartu,
 * Convex mutace přes websocket už nemusí odejít. Klient sem proto posílá
 * `fetch(..., { keepalive: true })`, který zavření stránky přežije.
 * Záměrně ne `sendBeacon` — ten neumí nastavit hlavičky, takže by neprošla
 * autentizace, a `beforeunload` je prokazatelně nespolehlivý.
 *
 * Autorizaci i ořez délky úseku řeší `progress.heartbeat` — tahle cesta
 * nesmí být volnější než běžný zápis.
 */
const beaconHandler = httpAction(async (ctx, request) => {
  let payload: { lessonId?: string; from?: number; to?: number };
  try {
    payload = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const { lessonId, from, to } = payload;
  if (typeof lessonId !== "string" || typeof from !== "number" || typeof to !== "number") {
    return new Response(null, { status: 400 });
  }

  await ctx.runMutation(api.progress.heartbeat, {
    lessonId: lessonId as Id<"lessons">,
    from,
    to,
  });

  // Klient odpověď nečte — stránka už je pryč.
  return new Response(null, { status: 204, headers: corsHeaders(request) });
});

/** Beacon jde z prohlížeče, takže na rozdíl od partnerského API CORS potřebuje. */
function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin");
  return origin
    ? {
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "content-type, authorization",
        "access-control-allow-methods": "POST, OPTIONS",
        vary: "origin",
      }
    : {};
}

http.route({ path: "/api/progress/beacon", method: "POST", handler: beaconHandler });
http.route({
  path: "/api/progress/beacon",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, request) =>
    new Response(null, { status: 204, headers: corsHeaders(request) }),
  ),
});

/**
 * Webhook z Muxu.
 *
 * Enkódování běží asynchronně, takže `videoAssetId` doplní až tenhle
 * callback. Lekci pozná podle `passthrough`, které se nastavuje při
 * zakládání uploadu ve tvaru `kurz/lekce`.
 *
 * Podpis se ověřuje vždy — bez něj by kdokoli mohl přepsat, které video
 * se u lekce přehrává.
 */
const muxWebhook = httpAction(async (ctx, request) => {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return new Response("webhook není nastavený", { status: 503 });

  const signature = request.headers.get("mux-signature") ?? "";
  const raw = await request.text();

  // `Mux-Signature: t=<unix>,v1=<hmac sha256 nad "t.raw">`
  const parts = Object.fromEntries(
    signature.split(",").map((p) => {
      const [k, ...rest] = p.split("=");
      return [k.trim(), rest.join("=")];
    }),
  );
  if (!parts.t || !parts.v1) return new Response(null, { status: 400 });

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${parts.t}.${raw}`),
  );
  const expected = [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // porovnání v konstantním čase — délky se nejdřív srovnají
  if (
    expected.length !== parts.v1.length ||
    expected.split("").reduce((acc, ch, i) => acc | (ch.charCodeAt(0) ^ parts.v1.charCodeAt(i)), 0) !== 0
  ) {
    return new Response(null, { status: 401 });
  }

  const event = JSON.parse(raw) as {
    type?: string;
    data?: {
      passthrough?: string;
      duration?: number;
      playback_ids?: { id: string; policy: string }[];
    };
  };

  if (event.type !== "video.asset.ready") return new Response(null, { status: 204 });

  const passthrough = event.data?.passthrough ?? "";
  const [courseSlug, lessonSlug] = passthrough.split("/");
  const playbackId = event.data?.playback_ids?.[0]?.id;
  if (!courseSlug || !lessonSlug || !playbackId) {
    return new Response(null, { status: 204 });
  }

  await ctx.runMutation(internal.digiuniverzita.attachVideo, {
    courseSlug,
    lessonSlug,
    videoProvider: "mux",
    videoAssetId: playbackId,
    durationSeconds: event.data?.duration
      ? Math.round(event.data.duration)
      : undefined,
  });

  return new Response(null, { status: 204 });
});

http.route({ path: "/api/mux/webhook", method: "POST", handler: muxWebhook });

export default http;
