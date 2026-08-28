"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";

import { hasClerk } from "@/lib/env";
import { SHOW_DIGIUNIVERZITA, SHOW_MEMBER_AREA } from "@/lib/flags";

/**
 * Odkaz na DIGI univerzitu v hlavní navigaci.
 *
 * Nepřihlášenému se nezobrazuje — je to obsah za členstvím a odkaz, který
 * vede na přihlašovací obrazovku, jen mate. Zájemce se o kurzech dozví
 * z ceníku, kde je DIGI univerzita mezi benefity.
 */
export function DigiNavLink({
  className,
  active,
}: {
  className?: string;
  active?: boolean;
}) {
  if (!hasClerk || !SHOW_MEMBER_AREA || !SHOW_DIGIUNIVERZITA) return null;

  return (
    <Show when="signed-in">
      <Link
        href="/digiuniverzita"
        aria-current={active ? "page" : undefined}
        className={className}
      >
        DIGI univerzita
      </Link>
    </Show>
  );
}
