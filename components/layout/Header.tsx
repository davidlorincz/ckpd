"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { headerContact, headerNav, headerVerify } from "@/lib/site";
import { hasClerk } from "@/lib/env";
import { SHOW_DIGIUNIVERZITA, SHOW_MEMBERS, SHOW_MEMBER_AREA } from "@/lib/flags";
import { memberNavItems } from "@/lib/memberNav";
import type { HeaderSession } from "@/lib/session";
import { UserMenu } from "@/components/layout/UserMenu";
import { VerifyMenu } from "@/components/layout/VerifyMenu";

/**
 * Sticky hlavička ve třech zónách: značka — obsahové stránky — utilitní blok.
 *
 * Dřív se za `nav` dolepovala DIGI univerzita, Administrace, účet, štítek EDIT
 * a odhlášení, takže Kontakt nebyl poslední, DIGI univerzita skončila úplně
 * vzadu a na 1024 px se popisky lámaly na dva řádky. Teď má levá strana
 * nejvýš pět položek, Kontakt sedí vpravo u účtu (obojí je „co s komorou
 * udělat“, ne „co si o ní přečíst“) a všechno kolem účtu je v jednom menu.
 *
 * Plná navigace až od `lg` — na `md` se osm položek do řádku nevešlo.
 */
export function Header({ session }: { session: HeaderSession }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const showDigi = SHOW_MEMBER_AREA && SHOW_DIGIUNIVERZITA && session.digiAccess;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const linkClass = (href: string) =>
    cn(
      "shrink-0 whitespace-nowrap text-[15px] font-medium text-ink-2 transition-colors hover:text-ink",
      pathname.startsWith(href) &&
        "text-ink underline decoration-brass decoration-2 underline-offset-8",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className={cn(
            "flex shrink-0 items-center gap-3 transition-[padding] duration-200",
            scrolled ? "py-2.5" : "py-4",
          )}
        >
          <Image
            src="/brand/lockup.svg"
            alt="ČKPD — Česká komora pilotů DRONů"
            width={195}
            height={44}
            priority
            className={cn(
              "transition-[width,height] duration-200",
              scrolled ? "h-9 w-[159px]" : "h-11 w-[195px]",
            )}
          />
        </Link>

        <nav
          aria-label="Hlavní navigace"
          className="hidden items-center gap-6 lg:flex xl:gap-8"
        >
          {/* DIGI univerzita je pro zaplaceného člena to, kvůli čemu sem chodí
              — proto první, ne dolepená za Kontakt. */}
          {showDigi && (
            <Link href="/digiuniverzita" className={linkClass("/digiuniverzita")}>
              DIGI univerzita
            </Link>
          )}
          {headerNav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
          <VerifyMenu />

          <span aria-hidden className="h-5 w-px shrink-0 bg-hairline" />

          <Link href={headerContact.href} className={linkClass(headerContact.href)}>
            {headerContact.label}
          </Link>
          <UserMenu session={session} />
        </nav>

        <button
          type="button"
          className="-mr-2 flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px] lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cn(
              "h-px w-5 bg-ink transition-transform",
              open && "translate-y-[3px] rotate-45",
            )}
          />
          <span
            className={cn(
              "h-px w-5 bg-ink transition-transform",
              open && "-translate-y-[3px] -rotate-45",
            )}
          />
        </button>
      </div>

      {open && <MobileNav session={session} showDigi={showDigi} />}
    </header>
  );
}

/**
 * Mobilní panel drží stejné pořadí jako desktop, jen rozbalené do sloupce.
 * Uživatelská sekce je dole a vypisuje se inline — portálovaný dropdown uvnitř
 * už otevřeného panelu se pere se zámkem scrollu.
 */
function MobileNav({
  session,
  showDigi,
}: {
  session: HeaderSession;
  showDigi: boolean;
}) {
  const itemClass =
    "border-b border-hairline py-3 text-[16px] font-medium text-ink last:border-b-0";
  const verifyItems = headerVerify.items.filter(
    (i) => !("membersOnly" in i && i.membersOnly) || SHOW_MEMBERS,
  );

  return (
    <nav
      id="mobile-nav"
      aria-label="Mobilní navigace"
      className="border-t border-hairline bg-paper lg:hidden"
    >
      <div className="mx-auto flex max-w-6xl flex-col px-5 py-2">
        {showDigi && (
          <Link href="/digiuniverzita" className={itemClass}>
            DIGI univerzita
          </Link>
        )}
        {headerNav.map((item) => (
          <Link key={item.href} href={item.href} className={itemClass}>
            {item.label}
          </Link>
        ))}
        {verifyItems.map((item) => (
          <Link key={item.href} href={item.href} className={itemClass}>
            {item.label}
          </Link>
        ))}
        <Link href={headerContact.href} className={itemClass}>
          {headerContact.label}
        </Link>

        <MobileAccount session={session} />
      </div>
    </nav>
  );
}

const mobileCtaClass =
  "my-3 rounded-[2px] border border-deep px-4 py-2.5 text-center text-[16px] font-medium text-deep";

function MobileAccount({ session }: { session: HeaderSession }) {
  // Stejné dělení jako v `UserMenu` na desktopu: bez Clerku nic, s vypnutou
  // členskou sekcí jen CTA na ceník (odkazy do účtu by byly 404), a přihlášení
  // pro každého odhlášeného — chodí přes něj i vstup do administrace.
  if (!hasClerk) {
    return (
      <Link href="/clenstvi#varianty" className={mobileCtaClass}>
        Stát se členem
      </Link>
    );
  }
  if (!session.signedIn || !SHOW_MEMBER_AREA) {
    return (
      <>
        {!session.signedIn && (
          <Link
            href="/prihlaseni"
            className="border-b border-hairline py-3 text-[16px] font-medium text-ink"
          >
            Přihlásit se
          </Link>
        )}
        <Link
          href={SHOW_MEMBER_AREA ? "/registrace" : "/clenstvi#varianty"}
          className={mobileCtaClass}
        >
          Stát se členem
        </Link>
      </>
    );
  }
  return <MobileAccountInner session={session} />;
}

function MobileAccountInner({ session }: { session: HeaderSession }) {
  const clerk = useClerk();
  const itemClass = "py-2.5 text-[15px] text-ink-2";

  return (
    <div className="mt-3 flex flex-col border-t border-hairline pt-3">
      <p className="pb-1 text-[11.5px] font-semibold uppercase tracking-wider text-ink-2">
        Můj účet
      </p>
      {memberNavItems.map((item) => (
        <Link key={item.href} href={item.href} className={itemClass}>
          {("menuLabel" in item && item.menuLabel) || item.label}
        </Link>
      ))}
      {session.admin && (
        <Link href="/admin" className={itemClass}>
          Administrace
        </Link>
      )}
      <button
        type="button"
        onClick={() => clerk.signOut()}
        className="py-2.5 text-left text-[15px] text-ink-2"
      >
        Odhlásit
      </button>
    </div>
  );
}
