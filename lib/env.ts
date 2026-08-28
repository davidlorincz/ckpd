/**
 * Dostupnost backendů podle env. Musí to být přímé statické čtení
 * `process.env.NEXT_PUBLIC_*` — jen tak hodnoty Next inlinuje do klientského
 * bundle. Destrukturování ani dynamický přístup nefunguje.
 *
 * hasClerk  — přihlašování, členská sekce, admin login
 * hasConvex — databáze: přepisy textů (CMS) i evidence členů
 */
export const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const hasConvex = !!process.env.NEXT_PUBLIC_CONVEX_URL;
