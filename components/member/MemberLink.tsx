"use client";

import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { hasClerk } from "@/lib/env";
import { SHOW_MEMBER_AREA } from "@/lib/flags";

/**
 * CTA v hlavičce: nepřihlášený jde na registraci, přihlášený do svého účtu.
 * Bez Clerku (deploy bez backendu) padá zpět na kotvu na stránce Členství.
 */
export function MemberLink({ className }: { className?: string }) {
  // Dokud členská sekce neběží, vede CTA na ceník místo na registraci.
  if (!hasClerk || !SHOW_MEMBER_AREA) {
    return (
      <Link href="/clenstvi#varianty" className={className}>
        Stát se členem
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <Link href="/registrace" className={className}>
          Stát se členem
        </Link>
      </Show>
      <Show when="signed-in">
        <Link href="/muj-ucet" className={className}>
          Můj účet
        </Link>
      </Show>
    </>
  );
}
