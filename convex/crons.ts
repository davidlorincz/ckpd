import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/** Retence auditu ověřovacího API. Uvedeno v zásadách ochrany údajů. */
const LOG_RETENTION_DAYS = 90;

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

    return { rateLimits: stale.length, logs: old.length };
  },
});

const crons = cronJobs();
crons.daily(
  "cleanup rate limits and audit log",
  { hourUTC: 2, minuteUTC: 30 },
  internal.crons.cleanup,
);

export default crons;
