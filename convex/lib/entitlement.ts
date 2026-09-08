/**
 * Nárok člena na obsah DIGI univerzity.
 *
 * Jediné místo, kde se rozhoduje „smí to vidět?". Kdyby ta logika byla
 * rozsypaná po queries, dřív nebo později by někde vznikla cesta, která
 * kontrolu obejde — a obsah je za členstvím, které se platí.
 *
 * Členství se čte VÝHRADNĚ z tabulky `members`, nikdy z Clerk metadat:
 * tier zapisuje platební brána a musí být auditovatelný (viz convex/schema.ts).
 */
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { isMembershipActive } from "./membershipState.ts";

export type Access = {
  memberId: Doc<"members">["_id"] | null;
  /** Platné členství — status `active` a období ještě neskončilo. */
  active: boolean;
  tier: Doc<"members">["tier"];
  /** Role `admin` z Clerk JWT. Admin vidí obsah i bez zaplaceného členství. */
  admin: boolean;
};

export const ANONYMOUS: Access = {
  memberId: null,
  active: false,
  tier: undefined,
  admin: false,
};

/**
 * Nárok přihlášeného uživatele.
 *
 * `admin` je top-level claim z Clerk JWT šablony „convex" — stojí nula dotazů
 * a je to jediná věc, kterou o nároku rozhoduje Clerk. Členství se pořád čte
 * výhradně z tabulky `members`.
 */
export async function resolveAccess(
  ctx: QueryCtx | MutationCtx,
): Promise<Access> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return ANONYMOUS;

  const admin = identity.role === "admin";

  const member = await ctx.db
    .query("members")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", String(identity.subject)))
    .unique();
  if (!member) return { ...ANONYMOUS, admin };

  return {
    memberId: member._id,
    active: isMembershipActive(member, Date.now()),
    tier: member.tier,
    admin,
  };
}

/**
 * Pořadí variant. Čestné členství uděluje Rada osobnostem oboru a co do
 * přístupu k obsahu se rovná PRO.
 */
const TIER_RANK = { zakladni: 1, pro: 2, cestne: 2 } as const;

/**
 * Splňuje nárok požadovaný tier?
 *
 * `undefined` na kurzu = stačí platné členství (Základní i PRO) — to je
 * „hobby část" ze strategie.
 *
 * Dřív tu byla past: `requiredTier` s hodnotou `"zakladni"` nebo `"cestne"`
 * propadlo na `return true` a neomezilo NIC, fungovalo jedině `"pro"`.
 * Teď se porovnává pořadí, takže každá hodnota z číselníku něco znamená.
 */
export function meetsTier(
  access: Access,
  requiredTier: Doc<"courses">["requiredTier"],
): boolean {
  // Admin spravuje obsah — musí ho vidět, i když sám členství nemá.
  if (access.admin) return true;
  if (!access.active) return false;
  if (!requiredTier) return true;
  if (!access.tier) return false;
  return TIER_RANK[access.tier] >= TIER_RANK[requiredTier];
}

/** Vidí člen kurz celý? Draft je jen pro admina (řeší si ho admin queries). */
export function canAccessCourse(
  access: Access,
  course: Pick<Doc<"courses">, "requiredTier">,
): boolean {
  return meetsTier(access, course.requiredTier);
}

/**
 * Vidí člen konkrétní lekci?
 *
 * `isPreview` je veřejná ukázka — hraje i nepřihlášenému, protože je to
 * lákadlo na členství. Lekce může nárok jen zpřísnit oproti kurzu,
 * nikdy zmírnit; proto se vyhodnocují oba a musí projít oba.
 */
export function canAccessLesson(
  access: Access,
  course: Pick<Doc<"courses">, "requiredTier">,
  lesson: Pick<Doc<"lessons">, "isPreview" | "requiredTier">,
): boolean {
  if (lesson.isPreview) return true;
  if (!canAccessCourse(access, course)) return false;
  return meetsTier(access, lesson.requiredTier);
}

/** Varianta pro akce, které nemají `ctx.db`. Vrací jen Clerk subject. */
export async function subjectOfAction(ctx: ActionCtx): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity();
  return identity ? String(identity.subject) : null;
}
