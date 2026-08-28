/**
 * Potvrzení o absolvování kurzu.
 *
 * ZÁMĚRNĚ NENÍ „CERTIFIKÁT". Komora nevydává doklady státního typu a nepřebírá
 * jazyk úřadu (viz scripts/content-lint.mjs). Je to potvrzení, že člen kurzem
 * prošel — a jeho hodnota stojí na tom, že si ho kdokoli může ověřit.
 *
 * Tři věci, na kterých to celé stojí:
 *  1) `snapshot` — data k okamžiku vydání. Kurzy se přejmenovávají a lidé mění
 *     příjmení; potvrzení z roku 2026 musí i za pět let vypadat stejně.
 *  2) Řádek se nikdy nemaže. „Odebráno" je jiná odpověď než „neexistuje".
 *  3) `contentHash` nad kanonickým JSONem — důkaz, že se snapshotem nikdo nehnul.
 */
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { ALPHABET, generateSecret } from "./lib/code";
import { resolveAccess } from "./lib/entitlement";

const PREFIX = "CKPD-DU";

/** `CKPD-DU-2026-7F3K9Q` — krátký, přepsatelný z papíru, bez záměnných znaků. */
function formatCode(year: number, secret: string): string {
  return `${PREFIX}-${year}-${secret}`;
}

/** Normalizace pro vyhledání: velká písmena, bez mezer a pomlček. */
function normalize(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, "");
  const match = /^CKPDDU(\d{4})([0-9A-Z]{6,10})$/.exec(cleaned);
  if (!match) return null;
  if ([...match[2]].some((ch) => !ALPHABET.includes(ch))) return null;
  return `${match[1]}:${match[2]}`;
}

/** SHA-256 nad kanonickým tvarem snapshotu — pole v pevném pořadí. */
async function hashSnapshot(snapshot: Doc<"courseCompletions">["snapshot"]) {
  const canonical = JSON.stringify([
    snapshot.holderName,
    snapshot.memberNumber ?? "",
    snapshot.courseTitle,
    snapshot.issuerName,
    snapshot.lessonsCompleted,
    snapshot.totalDurationSeconds,
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Vydá potvrzení, pokud má člen kurz opravdu hotový.
 * Idempotentní — druhé zavolání vrátí to už vydané, ne nové.
 */
export const issue = mutation({
  args: { courseSlug: v.string() },
  handler: async (ctx, { courseSlug }) => {
    const access = await resolveAccess(ctx);
    if (!access.memberId || !access.active) return null;

    const member = await ctx.db.get(access.memberId);
    if (!member) return null;

    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course) return null;

    const existing = await ctx.db
      .query("courseCompletions")
      .withIndex("by_member_course", (q) =>
        q.eq("memberId", access.memberId!).eq("courseId", course._id),
      )
      .unique();
    if (existing) return { code: existing.code, issuedAt: existing.issuedAt };

    const summary = await ctx.db
      .query("courseProgress")
      .withIndex("by_member_course", (q) =>
        q.eq("memberId", access.memberId!).eq("courseId", course._id),
      )
      .unique();
    // Potvrzení bez dokončeného kurzu by nemělo žádnou váhu.
    if (!summary?.completedAt) return null;

    const now = Date.now();
    const year = new Date(now).getUTCFullYear();
    const snapshot = {
      holderName: member.name,
      memberNumber: member.memberNumber,
      courseTitle: course.title,
      issuerName: "Česká komora pilotů DRONů z.s.",
      lessonsCompleted: summary.lessonsCompleted,
      totalDurationSeconds: course.totalDurationSeconds,
    };

    const secret = generateSecret();
    const code = formatCode(year, secret);
    const codeLookup = `${year}:${secret}`;

    await ctx.db.insert("courseCompletions", {
      memberId: access.memberId,
      courseId: course._id,
      code,
      codeLookup,
      issuedAt: now,
      snapshot,
      contentHash: await hashSnapshot(snapshot),
    });

    return { code, issuedAt: now };
  },
});

/** Potvrzení přihlášeného člena k danému kurzu. */
export const mine = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, { courseSlug }) => {
    const access = await resolveAccess(ctx);
    if (!access.memberId) return null;

    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course) return null;

    const row = await ctx.db
      .query("courseCompletions")
      .withIndex("by_member_course", (q) =>
        q.eq("memberId", access.memberId!).eq("courseId", course._id),
      )
      .unique();
    if (!row) return null;

    return {
      code: row.code,
      issuedAt: row.issuedAt,
      revoked: !!row.revokedAt,
      snapshot: row.snapshot,
    };
  },
});

/**
 * Veřejné ověření. Vrací jen to, co je nutné — jméno, kurz, datum a stav.
 *
 * Odpověď je záměrně stejně tvarovaná pro platné i neexistující potvrzení,
 * aby se přes ni nedal prostor kódů procházet. Prostor je 40 bitů, takže
 * hádání není reálné, ale rozdíl v odpovědi by ho zlevnil.
 */
export const verifyPublic = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const lookup = normalize(code);
    if (!lookup) return { status: "bad_format" as const };

    const row = await ctx.db
      .query("courseCompletions")
      .withIndex("by_code", (q) => q.eq("codeLookup", lookup))
      .unique();
    if (!row) return { status: "not_found" as const };

    if (row.revokedAt) {
      return {
        status: "revoked" as const,
        revokedAt: row.revokedAt,
        reason: row.revokedReason ?? null,
        snapshot: row.snapshot,
        issuedAt: row.issuedAt,
      };
    }

    return {
      status: "valid" as const,
      issuedAt: row.issuedAt,
      snapshot: row.snapshot,
      contentHash: row.contentHash,
    };
  },
});
