"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { Container } from "@/components/ui/Container";
import { hasClerk } from "@/lib/env";

/**
 * Přihlášení a registrace do členské sekce. `/admin` má vlastní obrazovku
 * (components/admin/AdminSignIn.tsx) — nesmí sdílet tyhle cesty, jinak by
 * se admin po přihlášení zacyklil mimo administraci.
 */
export function AuthScreen({ mode }: { mode: "signIn" | "signUp" }) {
  if (!hasClerk) {
    return (
      <Container className="py-20">
        <p className="text-ink-2">
          Přihlašování zatím není nakonfigurované.
        </p>
      </Container>
    );
  }

  return (
    <div className="paper-grid border-b border-hairline">
      <Container className="flex flex-col items-center py-14 sm:py-20">
        <h1 className="text-[28px] sm:text-[34px]">
          {mode === "signUp" ? "Registrace" : "Přihlášení"}
        </h1>
        <p className="measure mt-3 text-center text-[15.5px] leading-relaxed text-ink-2">
          {mode === "signUp"
            ? "Účet je zdarma. Členství si vybereš hned po registraci."
            : "Přihlas se do svého členského účtu."}
        </p>

        <div className="mt-10">
          {mode === "signUp" ? (
            <SignUp
              routing="path"
              path="/registrace"
              signInUrl="/prihlaseni"
              forceRedirectUrl="/muj-ucet"
            />
          ) : (
            <SignIn
              routing="path"
              path="/prihlaseni"
              signUpUrl="/registrace"
              forceRedirectUrl="/muj-ucet"
            />
          )}
        </div>
      </Container>
    </div>
  );
}
