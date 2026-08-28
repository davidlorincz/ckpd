import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { normalizeCode } from "./lib/code";
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

async function log(
  ctx: MutationCtx,
  result: Doc<"verificationLog">["result"],
  codeLookup: string,
  partnerKeyId?: Id<"partnerKeys">,
  memberId?: Id<"members">,
) {
  await ctx.db.insert("verificationLog", {
    partnerKeyId,
    codeLookup,
    memberId,
    result,
    at: Date.now(),
  });
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
  args: { keyHash: v.string(), code: v.string() },
  handler: async (ctx, args): Promise<VerifyResult> => {
    // 1) Partnerský klíč
    const key = await ctx.db
      .query("partnerKeys")
      .withIndex("by_hash", (q) => q.eq("keyHash", args.keyHash))
      .unique();

    if (!key || !key.active) {
      await log(ctx, "unauthorized", "", key?._id);
      return {
        status: 401,
        body: { error: "unauthorized", message: "Neplatný nebo zrušený klíč." },
      };
    }

    // 2) Rate limit
    const rl = await takeToken(ctx, key._id, key.rateLimitPerMin);
    if (!rl.ok) {
      await log(ctx, "rate_limited", "", key._id);
      return {
        status: 429,
        body: { error: "rate_limited", message: "Překročen limit dotazů." },
        rateLimit: { limit: key.rateLimitPerMin, ...rl },
      };
    }

    const meta = {
      rateLimit: { limit: key.rateLimitPerMin, ...rl },
    };
    await ctx.db.patch(key._id, { lastUsedAt: Date.now() });

    // 3) Tvar kódu. Špatný tvar se navenek tváří stejně jako neznámý kód.
    const lookup = normalizeCode(args.code);
    if (!lookup) {
      await log(ctx, "bad_format", args.code.slice(0, 40), key._id);
      return { ...NOT_VALID, ...meta };
    }

    // 4) Vyhledání
    const member = await ctx.db
      .query("members")
      .withIndex("by_code", (q) => q.eq("verificationCodeLookup", lookup))
      .unique();

    if (!member) {
      await log(ctx, "not_found", lookup, key._id);
      return { ...NOT_VALID, ...meta };
    }

    const expired =
      member.currentPeriodEnd !== undefined &&
      member.currentPeriodEnd < Date.now();

    if (member.status !== "active" || expired) {
      await log(ctx, "inactive", lookup, key._id, member._id);
      return { ...NOT_VALID, ...meta };
    }

    // 5) Platné členství
    const tier = member.tier ?? "zakladni";
    const t = TIERS[tier];
    await log(ctx, "valid", lookup, key._id, member._id);

    return {
      status: 200,
      body: {
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
      },
      ...meta,
    };
  },
});
