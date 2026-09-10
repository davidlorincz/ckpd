"use client";

import { useUser } from "@clerk/nextjs";

import { useEditMode } from "@/contexts/EditModeContext";
import { hasClerk } from "@/lib/env";

/**
 * Vysvětlení pro toho, koho administrace nepustila dál.
 *
 * Vykresluje se jen přihlášenému bez admin role — admin dostane rovnou
 * přehled a nepřihlášený odchází na `/prihlaseni` už ze serveru
 * (`app/admin/[[...rest]]/page.tsx`). Dřív tu bylo i hostované Clerk
 * přihlášení; teď má web jedinou přihlašovací obrazovku.
 */
export function AdminNoAccess() {
  // Bez Clerku (chybějící env) nemá stránka co nabídnout — a Clerk hooky
  // by mimo ClerkProvider spadly.
  if (!hasClerk) {
    return (
      <p className="text-ink-2">
        Administrace není nakonfigurovaná (chybí backend).
      </p>
    );
  }
  return <AdminNoAccessInner />;
}

function AdminNoAccessInner() {
  const { signOut } = useEditMode();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="max-w-md border border-hairline bg-paper-2 p-8 text-center">
      <h1 className="text-xl">Bez přístupu do administrace</h1>
      <p className="mt-3 text-[15px] text-ink-2">
        Tvůj účet nemá admin roli. Požádej správce o její přidělení.
      </p>
      <button
        onClick={() => signOut()}
        className="mt-6 border border-deep px-5 py-2.5 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
      >
        Odhlásit
      </button>
    </div>
  );
}
