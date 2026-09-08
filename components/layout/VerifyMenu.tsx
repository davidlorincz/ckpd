"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SHOW_MEMBERS } from "@/lib/flags";
import { headerVerify } from "@/lib/site";
import { cn } from "@/lib/utils";

const linkClass =
  "shrink-0 whitespace-nowrap text-[15px] font-medium text-ink-2 transition-colors hover:text-ink";
const activeClass =
  "text-ink underline decoration-brass decoration-2 underline-offset-8";

/**
 * Ověření + veřejný seznam členů.
 *
 * Obojí odpovídá na tutéž otázku — „kdo je vlastně člen“ — takže to patří
 * pod jednu položku, ne vedle sebe do už tak plné hlavičky. Když je seznam
 * vypnutý flagem, zbyde jediná položka a rozbalovačka nemá co nabídnout;
 * v tu chvíli je to obyčejný odkaz.
 */
export function VerifyMenu() {
  const pathname = usePathname();
  const items = headerVerify.items.filter(
    (i) => !("membersOnly" in i && i.membersOnly) || SHOW_MEMBERS,
  );
  const active = items.some((i) => pathname.startsWith(i.href));

  if (items.length < 2) {
    return (
      <Link
        href={headerVerify.href}
        aria-current={active ? "page" : undefined}
        className={cn(linkClass, active && activeClass)}
      >
        {headerVerify.label}
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex items-center gap-1",
          linkClass,
          active && activeClass,
          "data-popup-open:text-ink",
        )}
      >
        {headerVerify.label}
        <ChevronDownIcon
          className="size-3.5 transition-transform group-data-popup-open:rotate-180"
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        {items.map((item) => (
          <DropdownMenuLinkItem key={item.href} render={<Link href={item.href} />}>
            {item.label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
