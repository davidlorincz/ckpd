"use client";

import Link from "next/link";
import { SignIn, useUser } from "@clerk/nextjs";
import { useEditMode } from "@/contexts/EditModeContext";
import { UserAdmin } from "@/components/admin/UserAdmin";
import { PartnerKeys } from "@/components/admin/PartnerKeys";
import { hasClerk } from "@/lib/env";

/**
 * /admin: nepřihlášený vidí Clerk přihlášení, přihlášený admin
 * potvrzení + odkaz zpět na web (edituje se přímo na stránkách).
 */
export function AdminSignIn() {
  // Bez Clerku (chybějící env) nemá stránka co nabídnout — a Clerk hooky
  // by mimo ClerkProvider spadly.
  if (!hasClerk) {
    return (
      <p className="text-ink-2">Administrace není nakonfigurovaná (chybí backend).</p>
    );
  }
  return <AdminSignInInner />;
}

function AdminSignInInner() {
  const { isEditMode, signOut } = useEditMode();
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    // forceRedirectUrl: po přihlášení zůstat na /admin (potvrzení stavu),
    // ne skočit na homepage bez vysvětlení
    return <SignIn routing="path" path="/admin" forceRedirectUrl="/admin" />;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
    <div className="max-w-md border border-hairline bg-paper-2 p-8 text-center">
      {isEditMode ? (
        <>
          <h1 className="text-xl">Editace zapnutá</h1>
          <p className="mt-3 text-[15px] text-ink-2">
            Jsi přihlášený jako admin — v hlavičce webu teď svítí zelený
            štítek <strong>EDIT</strong>. Přejdi na kteroukoli stránku, najeď
            myší na text (orámuje se modře) a klikni: otevře se políčko přímo
            v místě. Enter / ✓ uloží, Esc zruší. Změna se hned propíše všem
            návštěvníkům a ukládá se do historie.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/"
              className="bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
            >
              Na web
            </Link>
            <button
              onClick={() => signOut()}
              className="border border-deep px-5 py-2.5 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
            >
              Odhlásit
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl">Bez přístupu k editaci</h1>
          <p className="mt-3 text-[15px] text-ink-2">
            Tvůj účet nemá admin roli. Požádej správce o její přidělení.
          </p>
          <button
            onClick={() => signOut()}
            className="mt-6 border border-deep px-5 py-2.5 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
          >
            Odhlásit
          </button>
        </>
      )}
    </div>
    {isEditMode && <UserAdmin />}
    {isEditMode && <PartnerKeys />}
    </div>
  );
}
