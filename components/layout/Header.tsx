"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { nav } from "@/lib/site";
import { useEditMode } from "@/contexts/EditModeContext";
import { MemberLink } from "@/components/member/MemberLink";

/**
 * Sticky hlavička: značka + název ve dvou řádcích vlevo, navigace vpravo,
 * sekundární CTA „Přihláška". Na scrollu se zúží. Bez hamburgeru na desktopu
 * (PRD § 4.2); na mobilu jednoduché rozbalovací menu.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isEditMode, signOut } = useEditMode();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 transition-[padding] duration-200",
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

        <nav aria-label="Hlavní navigace" className="hidden items-center gap-7 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[15px] font-medium text-ink-2 transition-colors hover:text-ink",
                pathname.startsWith(item.href) &&
                  "text-ink underline decoration-brass decoration-2 underline-offset-8",
              )}
            >
              {item.label}
            </Link>
          ))}
          <MemberLink className="border border-deep px-4 py-2 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper" />
          {isEditMode && (
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-[2px] bg-green-600 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                Edit
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="text-[13px] text-ink-2 underline-offset-4 hover:underline"
                title="Odhlásit se z editace"
              >
                Odhlásit
              </button>
            </span>
          )}
        </nav>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-[5px] md:hidden"
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

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobilní navigace"
          className="border-t border-hairline bg-paper md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-hairline py-3 text-[16px] font-medium text-ink last:border-b-0"
              >
                {item.label}
              </Link>
            ))}
            <MemberLink className="my-3 border border-deep px-4 py-2.5 text-center text-[16px] font-medium text-deep" />
          </div>
        </nav>
      )}
    </header>
  );
}
