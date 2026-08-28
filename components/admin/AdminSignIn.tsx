"use client";

import { SignIn, useUser } from "@clerk/nextjs";

import { useEditMode } from "@/contexts/EditModeContext";
import { hasClerk } from "@/lib/env";

/**
 * Vstup do administrace.
 *
 * Vykresluje se jen tomu, kdo dovnitř (zatím) nesmí — admin dostane rovnou
 * přehled. Dva stavy: nepřihlášený vidí Clerk přihlášení, přihlášený bez role
 * vysvětlení, proč ho to nepustilo.
 */
export function AdminSignIn() {
  // Bez Clerku (chybějící env) nemá stránka co nabídnout — a Clerk hooky
  // by mimo ClerkProvider spadly.
  if (!hasClerk) {
    return (
      <p className="text-ink-2">
        Administrace není nakonfigurovaná (chybí backend).
      </p>
    );
  }
  return <AdminSignInInner />;
}

function AdminSignInInner() {
  const { signOut } = useEditMode();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    // forceRedirectUrl: po přihlášení zůstat na /admin, ne skočit
    // na homepage bez vysvětlení
    return <SignIn routing="path" path="/admin" forceRedirectUrl="/admin" />;
  }

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
