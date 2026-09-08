"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn, useSignUp } from "@clerk/nextjs";

/**
 * Návrat z Googlu.
 *
 * Čeká se na `clerk.loaded`, ne na `fetchStatus`: dokud se clerk-js nestáhne,
 * vrací signál zástupné hodnoty (`signUp.status === "missing_requirements"`,
 * `signIn.status === "needs_identifier"`), takže by se rozhodovalo podle
 * výmyslu. Metody na načtení počkají samy, vlastnosti ne.
 *
 * `isTransferable` řeší situaci, kdy člověk klikl na Google v registraci, ale
 * účet už má (nebo naopak) — Clerk si sám nepřehodí tok, musí se mu říct.
 */
const TIMEOUT_MS = 10_000;

/**
 * Stav se mění po každém volání Clerku, ale TypeScript si ho z dřívější větve
 * pamatuje zúžený a druhé porovnání by označil za zbytečné. Průchod přes
 * `string` mu to rozmluví.
 */
function isComplete(status: string) {
  return status === "complete";
}

export function SsoCallbackClient({
  redirectTo,
  mode,
}: {
  redirectTo: string;
  mode: "signIn" | "signUp";
}) {
  const router = useRouter();
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const handled = useRef(false);

  useEffect(() => {
    if (!clerk.loaded || handled.current) return;
    handled.current = true;

    const fallback = mode === "signUp" ? "/registrace" : "/prihlaseni";

    const timeout = setTimeout(() => {
      router.replace(`${fallback}?error=oauth`);
    }, TIMEOUT_MS);

    async function finish() {
      try {
        if (isComplete(signUp.status)) {
          await signUp.finalize({ navigate: () => router.replace(redirectTo) });
          return;
        }

        if (isComplete(signIn.status)) {
          await signIn.finalize({ navigate: () => router.replace(redirectTo) });
          return;
        }

        // Registrace přes účet, který už existuje → překlopit na přihlášení.
        if (signUp.isTransferable) {
          const { error } = await signIn.create({ transfer: true });
          if (!error && isComplete(signIn.status)) {
            await signIn.finalize({
              navigate: () => router.replace(redirectTo),
            });
            return;
          }
          router.replace(`/prihlaseni?notice=account_exists`);
          return;
        }

        // Přihlášení Googlem, ke kterému účet není → poslat na registraci.
        if (signIn.isTransferable) {
          router.replace(`/prihlaseni?notice=no_account`);
          return;
        }

        // Chybí něco doplnit (typicky jméno) — dořeší to formulář registrace.
        if (signUp.status === "missing_requirements") {
          router.replace("/registrace?flow=continue");
          return;
        }

        router.replace(`${fallback}?error=oauth`);
      } catch {
        router.replace(`${fallback}?error=oauth`);
      } finally {
        clearTimeout(timeout);
      }
    }

    void finish();

    return () => clearTimeout(timeout);
  }, [clerk.loaded, mode, redirectTo, router, signIn, signUp]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="text-[15px] text-ink-2">Dokončujeme přihlášení…</p>
    </div>
  );
}
