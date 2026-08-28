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

export type Access = {
  memberId: Doc<"members">["_id"] | null;
  /** Platné členství — status `active` a období ještě neskončilo. */
  active: boolean;
  tier: Doc<"members">["tier"];
};

export const ANONYMOUS: Access = { memberId: null, active: false, tier: undefined };

/**
 * Zrcadlí `isActive` z lib/membership.ts. Záměrně duplikováno, ne importováno —
 * Convex funkce nesmí viset na kódu z Next.js stromu, jinak by se do bundlu
 * tahal celý frontend.
 */
function isActive(member: Doc<"members">): boolean {
  if (member.status !== "active") return false;
  return !member.currentPeriodEnd || member.currentPeriodEnd > Date.now();
}

/** Nárok přihlášeného uživatele. Nepřihlášený i neplatící dostane ANONYMOUS. */
export async function resolveAccess(
  ctx: QueryCtx | MutationCtx,
): Promise<Access> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return ANONYMOUS;

  const member = await ctx.db
    .query("members")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", String(identity.subject)))
    .unique();
  if (!member) return ANONYMOUS;

  return { memberId: member._id, active: isActive(member), tier: member.tier };
}

/**
 * Splňuje nárok požadovaný tier?
 *
 * `undefined` na kurzu = stačí platné členství (Základní i PRO) — to je
 * „hobby část" ze strategie. `cestne` členství uděluje Rada a má přístup
 * jako PRO.
 */
export function meetsTier(
  access: Access,
  requiredTier: Doc<"courses">["requiredTier"],
): boolean {
  if (!access.active) return false;
  if (!requiredTier) return true;
  if (requiredTier === "pro") return access.tier === "pro" || access.tier === "cestne";
  return true;
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
