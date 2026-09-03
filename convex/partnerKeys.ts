import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, subjectOf } from "./lib/auth";
import { generatePartnerKey, hashKey, keyModeOf, keyPrefixOf } from "./lib/code";

/**
 * Klíče partnerů pro ověřovací API. Každý partner má vlastní — revokace
 * jednoho neshodí ostatní a v auditu je vidět, kdo se ptal.
 *
 * V DB je jen SHA-256 otisk. Plaintext existuje jedinou vteřinu při vydání,
 * vrátí se adminovi a nikde se neukládá; ztracený klíč se nedá obnovit,
 * jen vydat nový.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const keys = await ctx.db.query("partnerKeys").order("desc").collect();

    // Počet dotazů za posledních 30 dní na klíč — základní přehled o využití.
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return await Promise.all(
      keys.map(async (k) => {
        const calls = await ctx.db
          .query("verificationLog")
          .withIndex("by_partner_at", (q) =>
            q.eq("partnerKeyId", k._id).gte("at", since),
          )
          .collect();
        return {
          _id: k._id,
          partnerName: k.partnerName,
          contactEmail: k.contactEmail,
          keyPrefix: k.keyPrefix,
          mode: keyModeOf(k),
          active: k.active,
          rateLimitPerMin: k.rateLimitPerMin,
          createdAt: k.createdAt,
          lastUsedAt: k.lastUsedAt,
          revokedAt: k.revokedAt,
          calls30d: calls.length,
        };
      }),
    );
  },
});

/** Vydá nový klíč. Plaintext se vrací JEN TEĎ — pak už je nedohledatelný. */
export const issue = mutation({
  args: {
    partnerName: v.string(),
    contactEmail: v.string(),
    rateLimitPerMin: v.optional(v.number()),
    mode: v.optional(v.union(v.literal("live"), v.literal("test"))),
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);

    const mode = args.mode ?? "live";
    const key = generatePartnerKey(mode);
    await ctx.db.insert("partnerKeys", {
      partnerName: args.partnerName,
      contactEmail: args.contactEmail,
      keyHash: await hashKey(key),
      keyPrefix: keyPrefixOf(key),
      mode,
      scopes: ["verify"],
      active: true,
      rateLimitPerMin: args.rateLimitPerMin ?? 60,
      createdBy: subjectOf(identity),
      createdAt: Date.now(),
    });

    return { key };
  },
});

export const setActive = mutation({
  args: { id: v.id("partnerKeys"), active: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, {
      active: args.active,
      revokedAt: args.active ? undefined : Date.now(),
    });
  },
});

export const setRateLimit = mutation({
  args: { id: v.id("partnerKeys"), rateLimitPerMin: v.number() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.rateLimitPerMin < 1 || args.rateLimitPerMin > 6000) {
      throw new Error("Limit musí být mezi 1 a 6000 dotazy za minutu.");
    }
    await ctx.db.patch(args.id, { rateLimitPerMin: args.rateLimitPerMin });
  },
});

/** Posledních 100 dotazů na ověřovací API — i neúspěšných. */
export const recentCalls = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("verificationLog")
      .withIndex("by_at")
      .order("desc")
      .take(100);

    const names = new Map<string, string>();
    return await Promise.all(
      rows.map(async (r) => {
        let partner = "—";
        if (r.partnerKeyId) {
          const cached = names.get(r.partnerKeyId);
          if (cached) partner = cached;
          else {
            const k = await ctx.db.get(r.partnerKeyId);
            partner = k?.partnerName ?? "smazaný klíč";
            names.set(r.partnerKeyId, partner);
          }
        }
        return {
          _id: r._id,
          at: r.at,
          partner,
          result: r.result,
          codeLookup: r.codeLookup,
          mode: r.mode ?? "live",
          requestCode: r.requestCode,
          httpStatus: r.httpStatus,
          responseBody: r.responseBody,
        };
      }),
    );
  },
});
