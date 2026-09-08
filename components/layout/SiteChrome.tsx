"use client";

import { usePathname } from "next/navigation";

import { LEGACY_AUTH_UI } from "@/lib/flags";

/**
 * Rám webu — utilitní pruh, hlavička, patička — kolem obsahu stránky.
 *
 * Auth obrazovky ho schválně nemají: registrace i přihlášení jsou split-screen
 * přes celou výšku okna a navigace nad nimi by z nich dělala jen další
 * podstránku. Rozhoduje se to tady, na klientu, a ne rozdělením `app/` na
 * skupiny rout: kořenové `not-found.tsx` chytá i adresy mimo jakoukoli skupinu,
 * takže by se 404 rázem ocitla bez hlavičky.
 *
 * `usePathname` funguje i při serverovém renderu klientské komponenty, takže
 * hlavička na auth stránkách neprobliká.
 *
 * Při rollbacku na hostované Clerk komponenty (`NEXT_PUBLIC_AUTH_UI=clerk`)
 * se rám nechává: původní obrazovka je běžná podstránka webu a bez hlavičky
 * by z ní nevedla cesta zpátky.
 */
const BARE_PATHS = ["/prihlaseni", "/registrace", "/sso-callback"];

export function SiteChrome({
  utilityBar,
  header,
  footer,
  children,
}: {
  utilityBar: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const bare =
    !LEGACY_AUTH_UI &&
    BARE_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

  if (bare) return <>{children}</>;

  return (
    <>
      {utilityBar}
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}
