import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { keyModeOf, normalizeCode } from "./lib/code";
import { findSandboxMember, resolveSandbox } from "./lib/sandbox";
import { apiModeValidator } from "./schema";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/**
 * Ověření členství pro partnery (slevové programy).
 *
 * Bezpečnostní pravidla, která se nesmí rozvolnit:
 *  - lookup jde VÝHRADNĚ podle ověřovacího kódu; podle e-mailu ani jména ne,
 *    jinak by šlo zjišťovat, kdo je členem
 *  - neexistující kód a zrušené členství vracejí BAJT PO BAJTU stejnou
 *    odpověď, jinak by kód šlo enumerovat
 *  - jméno jen se souhlasem se zveřejněním (`publicListing`)
 *  - každý dotaz včetně neúspěšného jde do `verificationLog`
 *
 * DVA SVĚTY, JEDNA CESTA KÓDU: ostrý provoz (`/api/v1/verify`) se ptá do
 * evidence členů, pískoviště (`/api/v1/sandbox/verify`) pevné sady fixtur
 * v `lib/sandbox.ts`. Rozvětvuje se jen zdroj dat — kontrola stavu členství
 * i sestavení odpovědi jsou pro oba stejné, aby se payloady nemohly rozejít.
 * Klíč platí vždy jen ve svém světě: testovacím klíčem reálného člena
 * nedohledáš a ostrým klíčem testovací kód taky ne.
 */

/** Ceník variant. Drží se stejný jako `membershipTiers` v lib/site.ts. */
const TIERS = {
  zakladni: { label: "Základní", price: 199, period: "měsíc" },
  pro: { label: "PRO", price: 499, period: "měsíc" },
  cestne: { label: "Čestné", price: 0, period: "" },
} as const;

export type VerifyResult = {
  status: number;
  body: Record<string, unknown>;
  rateLimit?: { limit: number; remaining: number; resetAt: number };
};

/** Jediné místo, kde vzniká záporná odpověď — proto je vždy identická. */
const NOT_VALID: VerifyResult = { status: 200, body: { valid: false } };

/**
 * Co ověřování o členovi potřebuje. Strukturální typ, ne `Doc<"members">` —
 * `Doc` do něj sedne beze změny a fixtura z pískoviště taky, takže obě
 * větve procházejí týmž `buildBody`.
 */
export type MemberLike = {
  tier?: "zakladni" | "pro" | "cestne";
  status: "none" | "pending" | "active" | "past_due" | "canceled";
  memberSince?: number;
  currentPeriodEnd?: number;
  memberNumber?: string;
  name: string;
  publicListing: boolean;
};

/** Tělo kladné odpovědi, nebo `null` když členství neplatí. */
function buildBody(
  member: MemberLike,
  now: number,
): Record<string, unknown> | null {
  const expired =
    member.currentPeriodEnd !== undefined && member.currentPeriodEnd < now;

  if (member.status !== "active" || expired) return null;

  const tier = member.tier ?? "zakladni";
  const t = TIERS[tier];

  return {
    valid: true,
    memberNumber: member.memberNumber,
    tier,
    tierLabel: t.label,
    price: t.price,
    currency: "CZK",
    period: t.period,
    memberSince: member.memberSince
      ? new Date(member.memberSince).toISOString().slice(0, 10)
      : null,
    paidUntil: member.currentPeriodEnd
      ? new Date(member.currentPeriodEnd).toISOString().slice(0, 10)
      : null,
    // Jméno jen se souhlasem se zveřejněním. Odvolání souhlasu se
    // projeví okamžitě — odpověď se nikde necachuje.
    name: member.publicListing ? member.name : null,
  };
}

/**
 * Fixed-window čítač po minutách. Drží se v DB — Convex mutace je transakční,
 * takže čtení a zvýšení nemůže dva souběžné dotazy pustit přes limit.
 */
async function takeToken(
  ctx: MutationCtx,
  keyId: Id<"partnerKeys">,
  limit: number,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = Math.floor(now / 60_000);
  const bucket = `${keyId}:${windowStart}`;
  const resetAt = (windowStart + 1) * 60_000;

  const row = await ctx.db
    .query("rateLimits")
    .withIndex("by_bucket", (q) => q.eq("bucket", bucket))
    .unique();

  const count = (row?.count ?? 0) + 1;
  if (row) await ctx.db.patch(row._id, { count });
  else await ctx.db.insert("rateLimits", { bucket, count, expiresAt: resetAt });

  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

export const verify = internalMutation({
  args: { keyHash: v.string(), code: v.string(), mode: apiModeValidator },
  handler: async (ctx, args): Promise<VerifyResult> => {
    const now = Date.now();

    /**
     * Zapíše dotaz do auditu a vrátí odpověď. Loguje se i tělo, aby šlo
     * v adminu doložit, co partner opravdu dostal.
     *
     * Odeslaný kód se v ostrém režimu u `unauthorized` a `rate_limited`
     * schválně neukládá: kód poslaný s cizím nebo zrušeným klíčem se u nás
     * nemá kde usadit. V pískovišti jsou kódy veřejné, tam to neplatí.
     */
    const remember = async (
      result: Doc<"verificationLog">["result"],
      out: VerifyResult,
      opts: {
        codeLookup?: string;
        partnerKeyId?: Id<"partnerKeys">;
        memberId?: Id<"members">;
      } = {},
    ): Promise<VerifyResult> => {
      const keepCode =
        args.mode === "test" ||
        (result !== "unauthorized" && result !== "rate_limited");

      await ctx.db.insert("verificationLog", {
        partnerKeyId: opts.partnerKeyId,
        codeLookup: opts.codeLookup ?? "",
        memberId: opts.memberId,
        result,
        at: now,
        mode: args.mode,
        requestCode: keepCode ? args.code.slice(0, 80) : undefined,
        httpStatus: out.status,
        responseBody: JSON.stringify(out.body),
      });
      return out;
    };

    // 1) Partnerský klíč. Klíč z druhého světa je stejně neplatný jako
    //    neexistující — odpověď je záměrně identická, žádná nápověda.
    const key = await ctx.db
      .query("partnerKeys")
      .withIndex("by_hash", (q) => q.eq("keyHash", args.keyHash))
      .unique();

    if (!key || !key.active || keyModeOf(key) !== args.mode) {
      return await remember(
        "unauthorized",
        {
          status: 401,
          body: { error: "unauthorized", message: "Neplatný nebo zrušený klíč." },
        },
        { partnerKeyId: key?._id },
      );
    }

    // 2) Rate limit
    const rl = await takeToken(ctx, key._id, key.rateLimitPerMin);
    if (!rl.ok) {
      return await remember(
        "rate_limited",
        {
          status: 429,
          body: { error: "rate_limited", message: "Překročen limit dotazů." },
          rateLimit: { limit: key.rateLimitPerMin, ...rl },
        },
        { partnerKeyId: key._id },
      );
    }

    const meta = {
      rateLimit: { limit: key.rateLimitPerMin, ...rl },
    };
    await ctx.db.patch(key._id, { lastUsedAt: now });

    // 3) Tvar kódu. Špatný tvar se navenek tváří stejně jako neznámý kód.
    const lookup = normalizeCode(args.code);
    if (!lookup) {
      return await remember(
        "bad_format",
        { ...NOT_VALID, ...meta },
        { codeLookup: args.code.slice(0, 40), partnerKeyId: key._id },
      );
    }

    // 4) Vyhledání — jediné místo, kde se oba světy liší.
    let member: MemberLike | undefined;
    let memberId: Id<"members"> | undefined;

    if (args.mode === "test") {
      const fixture = findSandboxMember(lookup);
      if (fixture) member = resolveSandbox(fixture, now);
    } else {
      const doc = await ctx.db
        .query("members")
        .withIndex("by_code", (q) => q.eq("verificationCodeLookup", lookup))
        .unique();
      if (doc) {
        member = doc;
        memberId = doc._id;
      }
    }

    if (!member) {
      return await remember(
        "not_found",
        { ...NOT_VALID, ...meta },
        { codeLookup: lookup, partnerKeyId: key._id },
      );
    }

    // 5) Stav členství a odpověď — společné pro ostrý provoz i pískoviště
    const body = buildBody(member, now);
    if (!body) {
      return await remember(
        "inactive",
        { ...NOT_VALID, ...meta },
        { codeLookup: lookup, partnerKeyId: key._id, memberId },
      );
    }

    return await remember(
      "valid",
      { status: 200, body, ...meta },
      { codeLookup: lookup, partnerKeyId: key._id, memberId },
    );
  },
});
