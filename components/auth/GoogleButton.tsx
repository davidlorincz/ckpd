"use client";

import { useState } from "react";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { LoaderCircleIcon } from "lucide-react";

import { ctaClass } from "@/components/ui/Cta";
import { authErrorMessage } from "@/lib/authErrors";

/** Google logo musí zůstat ve firemních barvách — je to jejich značka. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="size-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/**
 * Přihlášení a registrace přes Google.
 *
 * U registrace se jde přes `signUp.sso()` — je to jediné SSO volání, které
 * bere `unsafeMetadata`, takže souhlas se stanovami a GDPR přežije odskok na
 * Google a vrátí se s uživatelem zpátky. Jméno se tudy poslat nedá (runtime
 * `firstName`/`lastName` zahazuje), to si Clerk vezme z Google profilu.
 */
export function GoogleButton({
  mode,
  redirectTo,
  callbackUrl,
  unsafeMetadata,
  disabled,
  onError,
}: {
  mode: "signIn" | "signUp";
  redirectTo: string;
  callbackUrl: string;
  unsafeMetadata?: Record<string, unknown>;
  disabled?: boolean;
  onError: (message: string) => void;
}) {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    try {
      const { error } =
        mode === "signUp"
          ? await signUp.sso({
              strategy: "oauth_google",
              redirectUrl: redirectTo,
              redirectCallbackUrl: callbackUrl,
              unsafeMetadata,
            })
          : await signIn.sso({
              strategy: "oauth_google",
              redirectUrl: redirectTo,
              redirectCallbackUrl: callbackUrl,
            });

      if (error) {
        setPending(false);
        onError(authErrorMessage(error));
      }
      // Bez chyby prohlížeč odchází na Google — spinner schválně necháváme běžet.
    } catch (thrown) {
      setPending(false);
      onError(authErrorMessage(thrown));
    }
  }

  return (
    <button
      type="button"
      onClick={() => void start()}
      disabled={disabled || pending}
      aria-busy={pending}
      className={ctaClass(
        "secondary",
        "flex w-full items-center justify-center gap-3 bg-paper disabled:opacity-60",
      )}
    >
      {pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
      ) : (
        <GoogleIcon />
      )}
      Pokračovat přes Google
    </button>
  );
}
