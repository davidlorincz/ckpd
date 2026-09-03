import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/** Retence auditu ověřovacího API. Uvedeno v zásadách ochrany údajů. */
const LOG_RETENTION_DAYS = 90;

/**
 * Jak dlouho se u OSTRÝCH dotazů drží odeslaný kód a tělo odpovědi.
 *
 * Payload je v auditu kvůli ladění integrací, ale u ostrého dotazu obsahuje
 * jméno a členské číslo skutečného člena. K ladění stačí dny; samotný
 * záznam „kdo, kdy, s jakým výsledkem" zůstává celých 90 dní, protože ten
 * odhaluje hádání kódů. Testovací dotazy se nečistí — fiktivní členové
 * žádné osobní údaje nemají a partner se k nim potřebuje vracet.
 */
const PAYLOAD_RETENTION_DAYS = 7;

export const cleanup = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Vyčerpaná okna rate limitu — po minutě už nic neznamenají.
    const stale = await ctx.db
      .query("rateLimits")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .take(1000);
    for (const row of stale) await ctx.db.delete(row._id);

    // Audit starší než retenční lhůta.
    const cutoff = now - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const old = await ctx.db
      .query("verificationLog")
      .withIndex("by_at", (q) => q.lt("at", cutoff))
      .take(1000);
    for (const row of old) await ctx.db.delete(row._id);

    // Payload u ostrých dotazů — dřív než celý záznam.
    const payloadCutoff = now - PAYLOAD_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const withPayload = await ctx.db
      .query("verificationLog")
      .withIndex("by_mode_at", (q) => q.eq("mode", "live").lt("at", payloadCutoff))
      .take(1000);
    let stripped = 0;
    for (const row of withPayload) {
      if (row.requestCode === undefined && row.responseBody === undefined) continue;
      await ctx.db.patch(row._id, {
        requestCode: undefined,
        httpStatus: undefined,
        responseBody: undefined,
      });
      stripped += 1;
    }

    // Evidence vydaných podpisů k videu — stejná retenční lhůta.
    const tokens = await ctx.db
      .query("playbackTokens")
      .withIndex("by_issued", (q) => q.lt("issuedAt", cutoff))
      .take(1000);
    for (const row of tokens) await ctx.db.delete(row._id);

    return {
      rateLimits: stale.length,
      logs: old.length,
      payloads: stripped,
      tokens: tokens.length,
    };
  },
});

const crons = cronJobs();
crons.daily(
  "cleanup rate limits and audit log",
  { hourUTC: 2, minuteUTC: 30 },
  internal.crons.cleanup,
);

export default crons;
