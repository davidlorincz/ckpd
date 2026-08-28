"use client";

/**
 * Rám administrace.
 *
 * Záměrně vypadá jinak než veřejný web, aby bylo na první pohled jasné, kde
 * jsi — tmavý navy pruh místo papírové hlavičky. Zbytek jazyka je ale stejný:
 * hairline mřížka, serifové verzálky v nadpisech, tabulková čísla. Backstage
 * komory, ne cizí nástroj.
 *
 * Nahradilo to jednu dlouhou stránku, na které byla naskládaná správa
 * uživatelů, partnerských klíčů i kurzů pod sebou.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const sections: { href: string; label: string; exact?: boolean }[] = [
  { href: "/admin", label: "Přehled", exact: true },
  { href: "/admin/kurzy", label: "DIGI univerzita" },
  { href: "/admin/uzivatele", label: "Uživatelé" },
  { href: "/admin/partneri", label: "Partneři" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      {/*
        Pruh sedí pod hlavičkou webu a slouží jako cedule „jsi v zázemí".
        Odhlášení ani cestu zpět na web nedubluje — obojí je o kus výš
        v hlavičce, kde to člověk hledá.
      */}
      <div className="paper-grid-dark border-b border-deep-2 bg-deep">
        <div className="mx-auto w-full max-w-[88rem] px-5 pt-5 sm:px-8">
          <p className="font-serif text-[18px] font-bold uppercase tracking-[0.12em] text-paper">
            Administrace
            <span className="ml-3 text-brass-2">ČKPD</span>
          </p>

          <nav aria-label="Sekce administrace" className="mt-4">
            <ul className="-mb-px flex gap-1 overflow-x-auto">
              {sections.map((section) => {
                const active = section.exact
                  ? pathname === section.href
                  : pathname.startsWith(section.href);
                return (
                  <li key={section.href} className="shrink-0">
                    <Link
                      href={section.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block border-b-2 px-4 py-3 text-[14.5px] font-medium transition-colors",
                        active
                          ? "border-b-brass-2 text-paper"
                          : "border-b-transparent text-brass-2/70 hover:text-paper",
                      )}
                    >
                      {section.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[88rem] px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </div>
    </>
  );
}

/** Hlavička sekce — jednotný odstup a rytmus napříč stránkami administrace. */
export function AdminHeading({
  title,
  lead,
  aside,
}: {
  title: string;
  lead?: string;
  aside?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-5">
      <div>
        <h1 className="text-[26px] sm:text-[32px]">{title}</h1>
        {lead && <p className="measure mt-2 text-[15px] text-ink-2">{lead}</p>}
      </div>
      {aside}
    </header>
  );
}
