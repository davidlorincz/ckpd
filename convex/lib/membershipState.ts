/**
 * Kdy členství platí.
 *
 * POZOR — TOTÉŽ PRAVIDLO JE NA DVOU MÍSTECH. `convex/verification.ts`
 * (`buildBody`) je zmrazený partnerský kontrakt a nesmí se měnit, takže si
 * pravidlo drží sám. Tenhle helper používá veřejné ověření na webu.
 * Když se změní jedno, musí se změnit obě — a test v tests/credentials.test.mts
 * očekávání zmrazuje, aby se to nerozešlo potichu.
 */
export function isMembershipActive(
  m: { status: string; currentPeriodEnd?: number },
  now: number,
): boolean {
  if (m.status !== "active") return false;
  return m.currentPeriodEnd === undefined || m.currentPeriodEnd >= now;
}
