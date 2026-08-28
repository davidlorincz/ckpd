"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/muj-ucet", label: "Přehled" },
  { href: "/muj-ucet/predplatne", label: "Členství a platby" },
  { href: "/muj-ucet/faktury", label: "Doklady" },
  { href: "/muj-ucet/profil", label: "Profil" },
] as const;

export function MemberNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Členská sekce"
      className="lg:w-52 lg:shrink-0"
    >
      <ul className="flex overflow-x-auto border-b border-hairline lg:flex-col lg:overflow-visible lg:border-b-0">
        {items.map((item) => {
          const active =
            item.href === "/muj-ucet"
              ? pathname === "/muj-ucet"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0 lg:shrink">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap px-4 py-3 text-[15px] font-medium transition-colors first:pl-0 lg:border-l-2 lg:px-4 lg:py-2.5 lg:first:pl-4",
                  active
                    ? "text-ink lg:border-l-brass lg:bg-paper-2"
                    : "border-transparent text-ink-2 hover:text-ink lg:border-l-hairline",
                  active &&
                    "border-b-2 border-b-brass lg:border-b-0 lg:border-l-2",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
