"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";

import { authErrorMessage, authMessages } from "@/lib/authErrors";

/** Jediné místo v appce, které volá Clerk sign-in API. */
export type SignInStep =
  | "heslo"
  | "kod"
  | "zapomenute-heslo"
  | "zapomenute-kod"
  | "nove-heslo"
  | "nove-heslo-vynucene"
  | "druhy-faktor"
  | "overeni-navic";

export function useSignInFlow({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { signIn, errors, fetchStatus } = useSignIn();

  const [step, setStep] = useState<SignInStep>("heslo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const finalizing = useRef(false);

  /**
   * Ověřování kódu u neexistujícího účtu se na server vůbec neposílá — Clerk
   * by vrátil hlášku, ze které se pozná, že účet neexistuje. Tvrdíme „špatný
   * kód“, stejně jako u špatného hesla.
   */
  const neutralAttempt = useRef(false);

  const pending = busy || fetchStatus === "fetching";

  const goTo = useCallback((next: SignInStep) => {
    setError(null);
    setCode("");
    setStep(next);
  }, []);

  const finalize = useCallback(async () => {
    if (finalizing.current) return;
    finalizing.current = true;

    const { error: finalizeError } = await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        const url = decorateUrl(redirectTo);
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });

    if (finalizeError) {
      finalizing.current = false;
      setError(authErrorMessage(finalizeError));
    }
  }, [signIn, redirectTo, router]);

  /**
   * Signal API vrací chyby v `{ error }`, ale `finalize`, `emailCode.sendCode`
   * a `resetPasswordEmailCode.sendCode` házejí MIMO ten wrapper. Bez `catch`
   * by po nich zůstal jen zaseklý spinner.
   */
  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (thrown) {
      setError(authErrorMessage(thrown));
    } finally {
      setBusy(false);
    }
  }, []);

  const routeByStatus = useCallback(async () => {
    switch (signIn.status) {
      case "complete":
        await finalize();
        return;
      case "needs_new_password":
        setError(null);
        setStep("nove-heslo-vynucene");
        return;
      case "needs_second_factor":
      case "needs_client_trust": {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          setError(authErrorMessage(sendError));
          return;
        }
        setCode("");
        setStep("druhy-faktor");
        return;
      }
      // Clerk si na instanci může vyžádat vlastní kontrolu uprostřed toku.
      // Bez téhle větve by spadla do generické chyby a člověk by netušil proč.
      case "needs_protect_check":
        setError(null);
        setStep("overeni-navic");
        return;
      default:
        setError(authMessages.generic);
    }
  }, [signIn, finalize]);

  const submitPassword = () =>
    run(async () => {
      const { error: signInError } = await signIn.password({
        identifier: email.trim(),
        password,
      });

      if (signInError) {
        setError(authErrorMessage(signInError));
        return;
      }

      await routeByStatus();
    });

  /** Přihlášení kódem na e-mail — alternativa k heslu. */
  const sendSignInCode = () =>
    run(async () => {
      neutralAttempt.current = false;

      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });

      if (createError) {
        // Neexistující účet nepřiznáváme: obrazovku s kódem ukážeme stejně
        // a kód pak prostě „nesedí“.
        neutralAttempt.current = true;
        setCode("");
        setStep("kod");
        return;
      }

      const { error: sendError } = await signIn.emailCode.sendCode();
      if (sendError) {
        neutralAttempt.current = true;
      }

      setCode("");
      setStep("kod");
    });

  const verifySignInCode = (value: string) =>
    run(async () => {
      if (neutralAttempt.current) {
        setError(authMessages.codeIncorrect);
        return;
      }

      const { error: verifyError } = await signIn.emailCode.verifyCode({
        code: value,
      });

      if (verifyError) {
        setError(authErrorMessage(verifyError));
        return;
      }

      await routeByStatus();
    });

  const verifyMfaCode = (value: string) =>
    run(async () => {
      const { error: verifyError } = await signIn.mfa.verifyEmailCode({
        code: value,
      });

      if (verifyError) {
        setError(authErrorMessage(verifyError));
        return;
      }

      await routeByStatus();
    });

  /** Zapomenuté heslo: pošli kód → ověř → nastav nové. */
  const sendResetCode = () =>
    run(async () => {
      neutralAttempt.current = false;

      const { error: createError } = await signIn.create({
        identifier: email.trim(),
      });

      if (createError) {
        neutralAttempt.current = true;
        setCode("");
        setStep("zapomenute-kod");
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        neutralAttempt.current = true;
      }

      setCode("");
      setStep("zapomenute-kod");
    });

  const verifyResetCode = (value: string) =>
    run(async () => {
      if (neutralAttempt.current) {
        setError(authMessages.codeIncorrect);
        return;
      }

      const { error: verifyError } =
        await signIn.resetPasswordEmailCode.verifyCode({ code: value });

      if (verifyError) {
        setError(authErrorMessage(verifyError));
        return;
      }

      setStep("nove-heslo");
    });

  /**
   * Nové heslo. `signOutOfOtherSessions` je tu schválně: heslo se resetuje
   * hlavně tehdy, když ho mohl získat někdo cizí.
   */
  const submitNewPassword = () =>
    run(async () => {
      const { error: submitError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
          signOutOfOtherSessions: true,
        });

      if (submitError) {
        setError(authErrorMessage(submitError));
        return;
      }

      await routeByStatus();
    });

  return {
    step,
    goTo,
    email,
    setEmail,
    password,
    setPassword,
    newPassword,
    setNewPassword,
    code,
    setCode,
    error,
    setError,
    pending,
    fieldErrors: errors.fields,
    submitPassword,
    sendSignInCode,
    verifySignInCode,
    verifyMfaCode,
    sendResetCode,
    verifyResetCode,
    submitNewPassword,
  };
}
