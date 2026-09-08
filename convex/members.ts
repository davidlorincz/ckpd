import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  emailOf,
  nameOf,
  requireAdmin,
  requireIdentity,
  subjectOf,
} from "./lib/auth";
import {
  formatMemberNumber,
  formatVerificationCode,
  generateSecret,
  lookupKey,
} from "./lib/code";
import { isMembershipActive } from "./lib/membershipState";

/**
 * Evidence členů. Stav členství sem zapisuje výhradně `convex/billing.ts`
 * (platební brána) — tyhle funkce řeší profil a čtení.
 */

/** Vlastní členský záznam. `null` = nepřihlášený nebo řádek ještě nevznikl. */
export const getSelf = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("members")
      .withIndex("by_clerk_user", (q) =>
        q.eq("clerkUserId", subjectOf(identity)),
      )
      .unique();
  },
});

/**
 * Zkrácený vlastní záznam pro hlavičku a zámek DIGI univerzity.
 *
 * Záměrně NE `getSelf`: ten vrací celý dokument včetně `verificationCode`,
 * tedy sdíleného tajemství pro partnerské ověřování. Posílat ho na každé
 * stránce webu jen kvůli odznaku varianty by zbytečně rozšiřovalo plochu.
 *
 * `digiAccess` je jediné místo, kde se počítá „smí do univerzity" — čte ho
 * layout univerzity i hlavička, aby se odkaz a skutečný přístup nemohly
 * rozejít.
 */
export const getSelfSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const admin = identity.role === "admin";
    const member = await ctx.db
      .query("members")
      .withIndex("by_clerk_user", (q) =>
        q.eq("clerkUserId", subjectOf(identity)),
      )
      .unique();

    if (!member) {
      return {
        tier: undefined,
        status: "none" as const,
        active: false,
        admin,
        digiAccess: admin,
      };
    }

    const active = isMembershipActive(member, Date.now());
    return {
      tier: member.tier,
      status: member.status,
      active,
      admin,
      digiAccess: active || admin,
    };
  },
});

/**
 * Založí členský řádek při prvním vstupu do členské sekce. Idempotentní —
 * volá se z `components/member/EnsureMember.tsx` při každém mountu.
 *
 * Záměrně lazy místo Clerk webhooku: webhook by chtěl `svix`, signing secret
 * a tunel na dev. Webhook má smysl doplnit až pro `user.deleted` (GDPR).
 */
export const ensureSelf = mutation({
  // E-mail i jméno se berou VÝHRADNĚ z ověřeného Clerk JWT (šablona „convex"
  // vystavuje claimy `email` a `name`). Do evidence členů se tak nedá zapsat
  // cizí ani vymyšlený e-mail. Kdyby claimy z šablony zmizely, vznikne
  // prázdný profil — bezpečné selhání, člen si ho doplní sám.
  //
  // `agreements` je jediná výjimka a smí přijít od klienta: souhlas se
  // stanovami a se zpracováním údajů je tvrzení samotného uživatele, ne
  // oprávnění. Zaškrtnutí proběhlo v registraci a `EnsureMember` ho sem
  // přinese z Clerk `unsafeMetadata` — webhook, který by to udělal serverově,
  // v ČKPD neexistuje. Razítka staví server a už je nikdy nepřepisuje.
  args: {
    agreements: v.optional(
      v.object({ statutes: v.boolean(), gdpr: v.boolean() }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const clerkUserId = subjectOf(identity);
    const email = emailOf(identity);
    const name = nameOf(identity);

    const existing = await ctx.db
      .query("members")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .unique();

    const now = Date.now();
    const agreed = {
      statutes: args.agreements?.statutes ? now : undefined,
      gdpr: args.agreements?.gdpr ? now : undefined,
    };

    if (existing) {
      // E-mail v Clerku se mohl změnit — držíme ho v synchronu.
      const patch: {
        email?: string;
        name?: string;
        agreeStatutesAt?: number;
        agreeGdprAt?: number;
        updatedAt: number;
      } = { updatedAt: now };
      if (email && email !== existing.email) patch.email = email;
      // Jméno jen doplňujeme, nikdy nepřepisujeme — člen si ho mohl upravit.
      if (name && !existing.name) patch.name = name;
      // Souhlas se datuje jednou. Druhé načtení účtu ho nesmí přerazítkovat,
      // jinak by se ztratilo, kdy k němu doopravdy došlo.
      if (agreed.statutes && !existing.agreeStatutesAt) {
        patch.agreeStatutesAt = agreed.statutes;
      }
      if (agreed.gdpr && !existing.agreeGdprAt) {
        patch.agreeGdprAt = agreed.gdpr;
      }
      if (Object.keys(patch).length > 1) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("members", {
      clerkUserId,
      email,
      name,
      agreeStatutesAt: agreed.statutes,
      agreeGdprAt: agreed.gdpr,
      focus: [],
      status: "none",
      cancelAtPeriodEnd: false,
      publicListing: false,
      billingProvider: "mock",
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Úprava vlastního profilu. Stav členství ani kód se odsud měnit nedá. */
export const updateProfile = mutation({
  args: {
    name: v.string(),
    ico: v.optional(v.string()),
    phone: v.optional(v.string()),
    uclOperator: v.optional(v.string()),
    region: v.optional(v.string()),
    focus: v.array(v.string()),
    profile: v.optional(v.string()),
    publicListing: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const member = await ctx.db
      .query("members")
      .withIndex("by_clerk_user", (q) =>
        q.eq("clerkUserId", subjectOf(identity)),
      )
      .unique();
    if (!member) throw new Error("Členský záznam nenalezen.");

    await ctx.db.patch(member._id, { ...args, updatedAt: Date.now() });
  },
});

/**
 * Přegenerování ověřovacího kódu — když členovi unikne. Starý kód okamžitě
 * přestane platit, protože lookup jede přes index `by_code`.
 */
export const rotateVerificationCode = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const member = await ctx.db
      .query("members")
      .withIndex("by_clerk_user", (q) =>
        q.eq("clerkUserId", subjectOf(identity)),
      )
      .unique();
    if (!member) throw new Error("Členský záznam nenalezen.");
    if (member.status !== "active") {
      throw new Error("Kód má jen aktivní člen.");
    }

    if (!member.memberNumber || member.memberNumberYear === undefined ||
        member.memberNumberSeq === undefined) {
      throw new Error("Členské číslo ještě nebylo přiděleno.");
    }

    const { code, lookup } = issueVerificationCode(
      member.memberNumber,
      member.memberNumberYear,
      member.memberNumberSeq,
    );
    await ctx.db.patch(member._id, {
      verificationCode: code,
      verificationCodeLookup: lookup,
      verificationCodeIssuedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return code;
  },
});

/**
 * Veřejný seznam členů (/clenove). Jen aktivní členové, kteří dali souhlas
 * se zveřejněním — § 236 obč. zák. a GDPR. Nikdy nevrací e-mail ani telefon.
 */
export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Certifikace jedním dotazem a mapou — ne dotaz na každého člena zvlášť.
    // Ve výpisu jen platné: vypršelý doklad není odpověď na „co ten člověk umí".
    const now = Date.now();
    const live = await ctx.db
      .query("credentials")
      .withIndex("by_valid_until", (q) => q.gte("validUntil", now))
      .collect();

    const byMember = new Map<
      string,
      { skill: string; label: string; validUntil: number }[]
    >();
    for (const c of live) {
      if (c.revokedAt !== undefined) continue;
      const list = byMember.get(c.memberId) ?? [];
      list.push({
        skill: c.skill,
        label: c.snapshot.skillLabel,
        validUntil: c.validUntil,
      });
      byMember.set(c.memberId, list);
    }

    return rows
      // `status: "active"` samo nestačí — členovi mohlo propadnout období,
      // aniž by se stav překlopil. Stejné pravidlo jako u veřejného ověření.
      .filter((m) => m.publicListing && m.name && isMembershipActive(m, now))
      .map((m) => ({
        name: m.name,
        memberNumber: m.memberNumber,
        tier: m.tier ?? "zakladni",
        region: m.region,
        profile: m.profile,
        since: m.memberSince,
        credentials: (byMember.get(m._id) ?? []).sort((a, b) =>
          a.label.localeCompare(b.label, "cs"),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "cs"));
  },
});

/** Přehled členů pro administraci. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("members").order("desc").take(200);
    return rows.map((m) => ({
      _id: m._id,
      email: m.email,
      name: m.name,
      tier: m.tier,
      status: m.status,
      memberSince: m.memberSince,
      currentPeriodEnd: m.currentPeriodEnd,
      publicListing: m.publicListing,
      memberNumber: m.memberNumber,
    }));
  },
});

/**
 * Přidělí další členské číslo v pořadí. Convex mutace jsou transakční,
 * takže dva souběžné vstupy nemůžou dostat stejné číslo.
 */
export async function nextMemberNumber(
  ctx: MutationCtx,
): Promise<{ memberNumber: string; year: number; seq: number }> {
  const year = new Date().getFullYear();
  const key = `memberNumber:${year}`;

  const counter = await ctx.db
    .query("counters")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();

  const seq = (counter?.value ?? 0) + 1;
  if (counter) await ctx.db.patch(counter._id, { value: seq });
  else await ctx.db.insert("counters", { key, value: seq });

  return { memberNumber: formatMemberNumber(year, seq), year, seq };
}

/**
 * Ověřovací kód ke členskému číslu. Tajná část je nová při každém volání,
 * takže přegenerování okamžitě zneplatní ten starý — členské číslo zůstává.
 */
export function issueVerificationCode(
  memberNumber: string,
  year: number,
  seq: number,
): { code: string; lookup: string } {
  const secret = generateSecret();
  return {
    code: formatVerificationCode(memberNumber, secret),
    lookup: lookupKey(year, seq, secret),
  };
}
