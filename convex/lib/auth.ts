/**
 * Sdílené auth helpery pro Convex funkce.
 *
 * `role` je top-level claim z Clerk JWT template „convex". Členství se tudy
 * NEČTE — to žije v tabulce `members`, protože ho řídí platební webhook
 * a musí být auditovatelné. Clerk drží jen identitu a admin roli pro CMS.
 */

type AuthCtx = {
  auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> };
};

/** Vyžaduje přihlášení. Vrací identitu z Clerk JWT. */
export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Nepřihlášený uživatel.");
  return identity;
}

/** Vyžaduje přihlášení + admin roli. */
export async function requireAdmin(ctx: AuthCtx) {
  const identity = await requireIdentity(ctx);
  if (identity.role !== "admin") throw new Error("Chybí admin role.");
  return identity;
}

/** Clerk user id (`sub` claim). */
export function subjectOf(identity: Record<string, unknown>): string {
  return String(identity.subject);
}

/**
 * E-mail z JWT. Vyžaduje claim `email` v Clerk JWT template „convex" —
 * bez něj by členům vznikl řádek s prázdným e-mailem.
 */
export function emailOf(identity: Record<string, unknown>): string {
  return typeof identity.email === "string" ? identity.email : "";
}

/** Jméno z JWT, když ho Clerk pošle. Slouží jen jako předvyplnění profilu. */
export function nameOf(identity: Record<string, unknown>): string {
  const name = identity.name ?? identity.given_name;
  return typeof name === "string" ? name : "";
}
