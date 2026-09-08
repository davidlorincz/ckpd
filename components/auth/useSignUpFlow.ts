"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignUp } from "@clerk/nextjs";

import { authErrorCode, authErrorMessage, authMessages } from "@/lib/authErrors";

/** Jediné místo v appce, které volá Clerk sign-up API. */
export type SignUpStep = "identita" | "jmeno" | "kod";

export const SIGN_UP_STEPS: SignUpStep[] = ["identita", "jmeno", "kod"];

/**
 * `protect_check` je Clerkova vlastní kontrola, ne pole k vyplnění. Kdyby
 * zůstalo v seznamu, poslalo by člověka na obrazovku „doplň jméno“, kde není
 * co doplnit.
 */
function realMissingFields(fields: readonly string[]): string[] {
  return fields.filter((field) => field !== "protect_check");
}

export function useSignUpFlow({
  redirectTo,
  resume,
}: {
  redirectTo: string;
  /** Návrat z Googlu, kterému Clerk ještě něco chybí (typicky jméno). */
  resume?: boolean;
}) {
  const router = useRouter();
  const clerk = useClerk();
  const { signUp, errors, fetchStatus } = useSignUp();

  const [step, setStep] = useState<SignUpStep>("identita");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [agreeStatutes, setAgreeStatutes] = useState(false);
  const [agreeGdpr, setAgreeGdpr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [busy, setBusy] = useState(false);
  const finalizing = useRef(false);

  const pending = busy || fetchStatus === "fetching";

  /**
   * Souhlasy jedou do `unsafeMetadata`, protože v ČKPD není Clerk webhook —
   * do evidence členů je přenese `components/member/EnsureMember.tsx` při
   * prvním vstupu do účtu. Přes metadata navíc přežijí i odskok na Google.
   */
  const agreementsMetadata = {
    agreements: { statutes: agreeStatutes, gdpr: agreeGdpr },
  };

  const finalize = useCallback(async () => {
    if (finalizing.current) return;
    finalizing.current = true;

    const { error: finalizeError } = await signUp.finalize({
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
  }, [signUp, redirectTo, router]);

  /**
   * Signal API vrací chyby v `{ error }`, ale síťové a runtime výpadky pořád
   * vyhazují — a část metod (`finalize`, `sendCode`) hází i mimo ten wrapper.
   * Bez `catch` by po nich zůstal jen zaseklý spinner.
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
    if (signUp.status === "complete") {
      await finalize();
      return;
    }
    if (
      signUp.status === "missing_requirements" &&
      realMissingFields(signUp.missingFields).length > 0
    ) {
      setError(null);
      setStep("jmeno");
      return;
    }
    setError(authMessages.generic);
  }, [signUp, finalize]);

  /*
   * Po návratu z Googlu chybí Clerku jen doplňky, ne e-mail a heslo — začít
   * znovu prvním krokem by uživatele poslalo zakládat účet, který už má.
   * Čeká se na `clerk.loaded`: dokud se clerk-js nestáhne, hlásí signál
   * zástupný stav a `missingFields` je prázdné.
   */
  const resumed = useRef(false);
  useEffect(() => {
    if (!resume || resumed.current || !clerk.loaded) return;
    if (signUp.status !== "missing_requirements") return;
    if (realMissingFields(signUp.missingFields).length === 0) return;
    resumed.current = true;
    setStep("jmeno");
  }, [resume, clerk.loaded, signUp.status, signUp.missingFields]);

  /** Krok 1 → založí registraci a hned pošle kód, ať čeká ve schránce. */
  const submitIdentity = () =>
    run(async () => {
      setEmailExists(false);

      const { error: signUpError } = await signUp.password({
        emailAddress: email.trim(),
        password,
        unsafeMetadata: agreementsMetadata,
      });

      if (signUpError) {
        setEmailExists(authErrorCode(signUpError) === "form_identifier_exists");
        setError(authErrorMessage(signUpError));
        return;
      }

      if (signUp.status === "complete") {
        await finalize();
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(authErrorMessage(sendError));
        return;
      }

      setCode("");
      setStep("jmeno");
    });

  /**
   * Krok 2 → jméno do Clerku. Musí se stihnout, dokud je registrace
   * `missing_requirements`: na dokončené už FAPI patch neprojde. Odtud si ho
   * přes JWT claim `name` vyzvedne Convex `members.ensureSelf`.
   */
  const submitName = () =>
    run(async () => {
      const { error: updateError } = await signUp.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      if (updateError) {
        setError(authErrorMessage(updateError));
        return;
      }

      // U Googlu je e-mail ověřený už od poskytovatele, takže se tu registrace
      // rovnou dokončí. U hesla čeká ještě kód ze schránky.
      if (signUp.status === "complete") {
        await finalize();
        return;
      }

      setStep("kod");
    });

  const resendEmailCode = () =>
    run(async () => {
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) setError(authErrorMessage(sendError));
    });

  const verifyEmailCode = (value: string) =>
    run(async () => {
      const { error: verifyError } =
        await signUp.verifications.verifyEmailCode({ code: value });

      if (verifyError) {
        setError(authErrorMessage(verifyError));
        return;
      }

      await routeByStatus();
    });

  return {
    step,
    setStep,
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    code,
    setCode,
    agreeStatutes,
    setAgreeStatutes,
    agreeGdpr,
    setAgreeGdpr,
    agreementsMetadata,
    error,
    setError,
    emailExists,
    pending,
    fieldErrors: errors.fields,
    submitIdentity,
    submitName,
    resendEmailCode,
    verifyEmailCode,
  };
}
