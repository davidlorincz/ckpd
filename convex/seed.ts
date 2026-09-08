/**
 * Naplnění veřejného seznamu členů testovacími daty.
 *
 * Interní mutace, ne veřejné: CLI má přístup k nasazení, ale ne ke Clerk
 * identitě, takže `requireAdmin` by ho odmítl — a zároveň se na to nedá
 * sáhnout z prohlížeče. Stejný vzor jako `digiuniverzita:seedCourse`
 * a `sandbox:seedTestKeys`.
 *
 *   pnpm seed:members
 *   pnpm seed:members --reset
 */
import { internalMutation } from "./_generated/server";
import { issueCredential } from "./credentials";
import { formatMemberNumber, formatVerificationCode, lookupKey } from "./lib/code";
import { SEED_MEMBERS, SEED_PREFIX } from "./lib/seedMembers";

const DAY = 24 * 60 * 60 * 1000;
const YEAR = 2026;

/** Idempotentní podle členského čísla — opakované spuštění jen aktualizuje. */
export const seedMembers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let inserted = 0;
    let updated = 0;
    let credentials = 0;

    for (const seed of SEED_MEMBERS) {
      const memberNumber = formatMemberNumber(YEAR, seed.seq);
      const verificationCode = formatVerificationCode(memberNumber, seed.secret);

      const fields = {
        clerkUserId: `${SEED_PREFIX}${seed.seq}`,
        email: seed.email,
        name: seed.name,
        focus: seed.focus,
        profile: seed.profile,
        region: seed.region,
        tier: seed.tier,
        status: "active" as const,
        memberSince: now - seed.memberSinceDaysAgo * DAY,
        // Testovací členství drží rok dopředu, ať seed nezhasne sám od sebe.
        currentPeriodEnd: now + 365 * DAY,
        cancelAtPeriodEnd: false,
        memberNumber,
        memberNumberYear: YEAR,
        memberNumberSeq: seed.seq,
        verificationCode,
        verificationCodeLookup: lookupKey(YEAR, seed.seq, seed.secret),
        verificationCodeIssuedAt: now - seed.memberSinceDaysAgo * DAY,
        publicListing: true,
        billingProvider: "mock" as const,
        updatedAt: now,
      };

      const existing = await ctx.db
        .query("members")
        .withIndex("by_number", (q) => q.eq("memberNumber", memberNumber))
        .unique();

      let memberId;
      if (existing) {
        await ctx.db.patch(existing._id, fields);
        memberId = existing._id;
        updated += 1;
      } else {
        memberId = await ctx.db.insert("members", { ...fields, createdAt: now });
        inserted += 1;
      }

      for (const c of seed.credentials) {
        const result = await issueCredential(
          ctx,
          {
            memberId,
            skill: c.skill,
            basis: c.basis,
            issuedAt: now - c.issuedDaysAgo * DAY,
          },
          "seed",
        );
        if (!result.reused) credentials += 1;
      }
    }

    return { inserted, updated, credentials };
  },
});

/**
 * Smaže všechno, co seed vytvořil — poznává to podle prefixu `seed_`
 * v `clerkUserId`. Jinak by testovací členy nešlo z evidence dostat,
 * mazací mutaci pro členy ani certifikace totiž nikde jinde nemáme.
 */
export const seedMembersReset = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("members").collect();
    const seeded = all.filter((m) => m.clerkUserId.startsWith(SEED_PREFIX));

    let credentials = 0;
    for (const member of seeded) {
      const rows = await ctx.db
        .query("credentials")
        .withIndex("by_member", (q) => q.eq("memberId", member._id))
        .collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
        credentials += 1;
      }
      await ctx.db.delete(member._id);
    }

    return { members: seeded.length, credentials };
  },
});
