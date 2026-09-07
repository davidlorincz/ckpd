/**
 * Certifikace komory na konkrétní dovednost.
 *
 * Vydává je administrace po složené zkoušce (nebo doloženém portfoliu),
 * platí omezenou dobu a prodlužují se. Veřejné ověření žije v
 * `convex/publicVerify.ts` — tenhle soubor je členská sekce a administrace.
 *
 * Stav se nikdy neukládá, počítá se ze `validUntil` a `revokedAt`
 * (convex/lib/skills.ts → `credentialState`).
 */
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { credentialLookupKey, formatCredentialCode, generateSecret } from "./lib/code";
import { requireAdmin, requireIdentity, subjectOf } from "./lib/auth";
import {
  EXPIRING_SOON_DAYS,
  credentialState,
  skillByKey,
  validUntilFor,
} from "./lib/skills";

const ISSUER = "Česká komora pilotů DRONů z.s.";

/** SHA-256 nad kanonickým tvarem snapshotu — pole v pevném pořadí.
    `validUntil` do hashe nepatří: mění ho prodloužení. */
async function hashSnapshot(
  snapshot: Doc<"credentials">["snapshot"],
  skill: string,
  issuedAt: number,
): Promise<string> {
  const canonical = JSON.stringify([
    snapshot.holderName,
    snapshot.memberNumber ?? "",
    snapshot.skillLabel,
    snapshot.issuerName,
    skill,
    issuedAt,
  ]);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Tvar řádku pro UI — bez interních polí. */
function toRow(c: Doc<"credentials">, now: number) {
  return {
    _id: c._id,
    skill: c.skill,
    label: c.snapshot.skillLabel,
    code: c.code,
    basis: c.basis,
    note: c.note ?? null,
    issuedAt: c.issuedAt,
    validUntil: c.validUntil,
    state: credentialState(c, now),
    renewedAt: c.renewals.at(-1)?.at ?? null,
    revokedAt: c.revokedAt ?? null,
    revokedReason: c.revokedReason ?? null,
  };
}

/* ------------------------------------------------------- členská sekce */

/**
 * Certifikace přihlášeného člena. Vrací i vypršelé a odebrané — člen musí
 * vidět, že mu platnost skončila, jinak se o prodloužení nedozví.
 */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const member = await ctx.db
      .query("members")
      .withIndex("by_clerk_user", (q) =>
        q.eq("clerkUserId", subjectOf(identity)),
      )
      .unique();
    if (!member) return [];

    const now = Date.now();
    const rows = await ctx.db
      .query("credentials")
      .withIndex("by_member", (q) => q.eq("memberId", member._id))
      .collect();

    return rows
      .map((c) => toRow(c, now))
      .sort((a, b) => b.issuedAt - a.issuedAt);
  },
});

/* --------------------------------------------------------- administrace */

/**
 * Hledání člena podle čísla, e-mailu nebo jména. ADMIN ONLY — přesně tohle
 * je ve veřejném ověření zakázané, aby nešlo zjišťovat, kdo je členem.
 */
export const adminFindMembers = query({
  args: { q: v.string() },
  handler: async (ctx, { q }) => {
    await requireAdmin(ctx);
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];

    const rows = await ctx.db.query("members").take(500);
    return rows
      .filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.email.toLowerCase().includes(needle) ||
          (m.memberNumber ?? "").toLowerCase().includes(needle),
      )
      .slice(0, 20)
      .map((m) => ({
        _id: m._id,
        name: m.name,
        email: m.email,
        memberNumber: m.memberNumber ?? null,
        status: m.status,
        tier: m.tier ?? null,
        publicListing: m.publicListing,
      }));
  },
});

export const adminListForMember = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, { memberId }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const rows = await ctx.db
      .query("credentials")
      .withIndex("by_member", (q) => q.eq("memberId", memberId))
      .collect();
    return rows
      .map((c) => toRow(c, now))
      .sort((a, b) => b.issuedAt - a.issuedAt);
  },
});

/** Certifikace, kterým do 90 dní končí platnost. Tohle admin otevírá nejčastěji. */
export const adminExpiringSoon = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const until = now + EXPIRING_SOON_DAYS * 86_400_000;

    const rows = await ctx.db
      .query("credentials")
      .withIndex("by_valid_until", (q) =>
        q.gte("validUntil", now).lte("validUntil", until),
      )
      .collect();

    const live = rows.filter((c) => c.revokedAt === undefined);
    return live
      .map((c) => ({
        ...toRow(c, now),
        memberId: c.memberId,
        holderName: c.snapshot.holderName,
        memberNumber: c.snapshot.memberNumber ?? null,
      }))
      .sort((a, b) => a.validUntil - b.validUntil);
  },
});

/* -------------------------------------------------------------- mutace */

/** Kód s kontrolou kolize. 40 bitů kolizi prakticky vylučuje, ale ověření
    stojí jeden indexovaný read a odstraní celou třídu záhad. */
async function freshCode(
  ctx: MutationCtx,
  year: number,
): Promise<{ code: string; codeLookup: string }> {
  for (let i = 0; i < 5; i++) {
    const secret = generateSecret();
    const codeLookup = credentialLookupKey(year, secret);
    const clash = await ctx.db
      .query("credentials")
      .withIndex("by_code", (q) => q.eq("codeLookup", codeLookup))
      .unique();
    if (!clash) return { code: formatCredentialCode(year, secret), codeLookup };
  }
  throw new Error("Nepodařilo se vygenerovat kód certifikace.");
}

export const issue = mutation({
  args: {
    memberId: v.id("members"),
    skill: v.string(),
    basis: v.union(
      v.literal("zkouska"),
      v.literal("portfolio"),
      v.literal("kurz"),
      v.literal("praxe"),
    ),
    note: v.optional(v.string()),
    /** Zpětné vydání, když se certifikovalo mimo systém. Výchozí = teď. */
    issuedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireAdmin(ctx);

    const skill = skillByKey(args.skill);
    if (!skill) throw new Error("Neznámý obor certifikace.");

    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Člen neexistuje.");
    if (member.status !== "active") {
      throw new Error("Certifikaci lze vydat jen aktivnímu členovi.");
    }
    if (!member.memberNumber) {
      throw new Error("Člen zatím nemá členské číslo.");
    }

    const now = Date.now();
    const issuedAt = args.issuedAt ?? now;

    // Duplicitní certifikace na tutéž dovednost je datový smog — vrať tu platnou.
    const existing = await ctx.db
      .query("credentials")
      .withIndex("by_member", (q) =>
        q.eq("memberId", args.memberId).eq("skill", args.skill),
      )
      .collect();
    const live = existing.find(
      (c) => c.revokedAt === undefined && c.validUntil >= now,
    );
    if (live) return { code: live.code, validUntil: live.validUntil, reused: true };

    const validUntil = validUntilFor(issuedAt, skill.validityYears);
    const { code, codeLookup } = await freshCode(
      ctx,
      new Date(issuedAt).getUTCFullYear(),
    );

    const snapshot = {
      holderName: member.name,
      memberNumber: member.memberNumber,
      skillLabel: skill.label,
      issuerName: ISSUER,
    };

    await ctx.db.insert("credentials", {
      memberId: args.memberId,
      skill: args.skill,
      code,
      codeLookup,
      issuedAt,
      validUntil,
      validityYears: skill.validityYears,
      basis: args.basis,
      note: args.note,
      snapshot,
      contentHash: await hashSnapshot(snapshot, args.skill, issuedAt),
      renewals: [],
      issuedBy: subjectOf(identity),
      createdAt: now,
      updatedAt: now,
    });

    return { code, validUntil, reused: false };
  },
});

/**
 * Prodloužení. Kód i řádek zůstávají — je to pořád tentýž doklad.
 * U platné certifikace navazuje na konec, u prošlé běží od dneška.
 * Počet let se bere z aktuálního číselníku, ne z řádku.
 */
export const renew = mutation({
  args: { id: v.id("credentials") },
  handler: async (ctx, { id }) => {
    const identity = await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Certifikace neexistuje.");
    if (row.revokedAt !== undefined) {
      throw new Error("Odebranou certifikaci nelze prodloužit.");
    }

    const skill = skillByKey(row.skill);
    const years = skill?.validityYears ?? row.validityYears;

    const now = Date.now();
    const from = Math.max(now, row.validUntil);
    const newUntil = validUntilFor(from, years);

    await ctx.db.patch(id, {
      validUntil: newUntil,
      validityYears: years,
      renewals: [
        ...row.renewals,
        {
          at: now,
          previousUntil: row.validUntil,
          newUntil,
          by: subjectOf(identity),
        },
      ],
      updatedAt: now,
    });

    return { validUntil: newUntil };
  },
});

export const revoke = mutation({
  args: { id: v.id("credentials"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    await requireAdmin(ctx);
    const trimmed = reason.trim();
    // důvod jde do veřejné odpovědi — prázdný by ověřovatele nechal tápat
    if (!trimmed) throw new Error("Důvod odebrání je povinný.");

    const row = await ctx.db.get(id);
    if (!row) throw new Error("Certifikace neexistuje.");

    await ctx.db.patch(id, {
      revokedAt: Date.now(),
      revokedReason: trimmed,
      updatedAt: Date.now(),
    });
  },
});

/** Ruční korekce data platnosti (překlep, individuální rozhodnutí Rady).
    Zvlášť od `renew`, které se řídí číselníkem. */
export const setValidUntil = mutation({
  args: { id: v.id("credentials"), validUntil: v.number() },
  handler: async (ctx, { id, validUntil }) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(id);
    if (!row) throw new Error("Certifikace neexistuje.");
    await ctx.db.patch(id, { validUntil, updatedAt: Date.now() });
  },
});
