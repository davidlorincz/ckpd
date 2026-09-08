"use client";

import Link from "next/link";

import {
  AuthError,
  AuthHeading,
  AuthLink,
  AuthNotice,
  Field,
  OrDivider,
  StepAnnouncement,
  StepMeter,
  SubmitButton,
  authInputClass,
} from "@/components/auth/AuthUi";
import { CodeInput } from "@/components/auth/CodeInput";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { SIGN_UP_STEPS, useSignUpFlow } from "@/components/auth/useSignUpFlow";
import { fieldErrorMessage } from "@/lib/authErrors";
import { ctaClass } from "@/components/ui/Cta";

const OAUTH_MESSAGE =
  "Přihlášení přes Google se nedokončilo. Zkus to prosím znovu.";

export function SignUpForm({
  redirectTo,
  callbackUrl,
  oauthError,
  resume,
}: {
  redirectTo: string;
  callbackUrl: string;
  oauthError?: boolean;
  /** Návrat z Googlu, kterému ještě něco chybí — nezačínat od začátku. */
  resume?: boolean;
}) {
  const flow = useSignUpFlow({ redirectTo, resume });
  const stepIndex = SIGN_UP_STEPS.indexOf(flow.step) + 1;
  const agreed = flow.agreeStatutes && flow.agreeGdpr;

  // Chybu u pole schováme, když už svítí hláška nad formulářem — jinak by
  // člověk četl totéž dvakrát.
  const formError = flow.error ?? (oauthError ? OAUTH_MESSAGE : null);
  const emailFieldError = formError
    ? null
    : fieldErrorMessage(flow.fieldErrors.emailAddress);
  const passwordFieldError = formError
    ? null
    : fieldErrorMessage(flow.fieldErrors.password);

  return (
    <div>
      <StepMeter step={stepIndex} total={SIGN_UP_STEPS.length} />

      {flow.step === "identita" ? (
        <>
          <AuthHeading
            title="Registrace"
            lead="Založ si účet v České komoře pilotů DRONů. Trvá to minutu a nic tím neplatíš."
          />
          <StepAnnouncement message="Krok 1 ze 3: e-mail a heslo" />

          <AuthError message={formError} />
          {flow.emailExists ? (
            <AuthNotice message="Na tenhle e-mail už účet existuje.">
              <Link
                href="/prihlaseni"
                className={ctaClass("secondary", "bg-paper text-[14px]")}
              >
                Přihlásit se
              </Link>
            </AuthNotice>
          ) : null}

          <GoogleButton
            mode="signUp"
            redirectTo={redirectTo}
            callbackUrl={callbackUrl}
            unsafeMetadata={flow.agreementsMetadata}
            disabled={flow.pending || !agreed}
            onError={flow.setError}
          />
          {!agreed ? (
            <p className="mt-2 text-[13px] text-ink-2">
              Nejdřív prosím odsouhlas stanovy a zpracování údajů níže.
            </p>
          ) : null}

          <OrDivider />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.submitIdentity();
            }}
          >
            <Field label="E-mailová adresa" htmlFor="email" error={emailFieldError}>
              <input
                id="email"
                name="email"
                type="email"
                value={flow.email}
                onChange={(event) => flow.setEmail(event.target.value)}
                disabled={flow.pending}
                autoComplete="email"
                placeholder="tvuj@email.cz"
                aria-invalid={emailFieldError ? true : undefined}
                className={authInputClass}
              />
            </Field>

            <Field
              label="Heslo"
              htmlFor="password"
              error={passwordFieldError}
              hint="Aspoň 8 znaků."
            >
              <PasswordInput
                id="password"
                value={flow.password}
                onChange={flow.setPassword}
                disabled={flow.pending}
                invalid={Boolean(passwordFieldError)}
                autoComplete="new-password"
                placeholder="Zvol si heslo"
              />
            </Field>

            <div className="space-y-3 border-t border-hairline pt-5">
              <label className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                <input
                  type="checkbox"
                  checked={flow.agreeStatutes}
                  onChange={(event) => flow.setAgreeStatutes(event.target.checked)}
                  disabled={flow.pending}
                  className="mt-1 size-4 shrink-0 accent-[#2626ff]"
                />
                <span>
                  Přečetl jsem si <AuthLink href="/eticky-kodex">stanovy a etický kodex</AuthLink> a souhlasím s nimi.
                </span>
              </label>

              <label className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
                <input
                  type="checkbox"
                  checked={flow.agreeGdpr}
                  onChange={(event) => flow.setAgreeGdpr(event.target.checked)}
                  disabled={flow.pending}
                  className="mt-1 size-4 shrink-0 accent-[#2626ff]"
                />
                <span>
                  Souhlasím se <AuthLink href="/ochrana-osobnich-udaju">zpracováním osobních údajů</AuthLink>.
                </span>
              </label>
            </div>

            <SubmitButton pending={flow.pending} disabled={!agreed}>
              Pokračovat
            </SubmitButton>
          </form>

          <p className="mt-8 text-center text-[14px] text-ink-2">
            Už máš účet? <AuthLink href="/prihlaseni">Přihlas se</AuthLink>
          </p>
        </>
      ) : null}

      {flow.step === "jmeno" ? (
        <>
          <AuthHeading
            title="Jak se jmenuješ?"
            lead="Zatímco to vyplňuješ, letí ti do schránky ověřovací kód."
          />
          <StepAnnouncement message="Krok 2 ze 3: jméno a příjmení" />

          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.submitName();
            }}
          >
            <Field label="Jméno" htmlFor="firstName">
              <input
                id="firstName"
                name="firstName"
                value={flow.firstName}
                onChange={(event) => flow.setFirstName(event.target.value)}
                disabled={flow.pending}
                autoComplete="given-name"
                className={authInputClass}
              />
            </Field>

            <Field label="Příjmení" htmlFor="lastName">
              <input
                id="lastName"
                name="lastName"
                value={flow.lastName}
                onChange={(event) => flow.setLastName(event.target.value)}
                disabled={flow.pending}
                autoComplete="family-name"
                className={authInputClass}
              />
            </Field>

            <SubmitButton
              pending={flow.pending}
              disabled={!flow.firstName.trim() || !flow.lastName.trim()}
            >
              Pokračovat
            </SubmitButton>
          </form>
        </>
      ) : null}

      {flow.step === "kod" ? (
        <>
          <AuthHeading
            title="Ověření e-mailu"
            lead={
              <>
                Poslali jsme šestimístný kód na <strong>{flow.email}</strong>.
              </>
            }
          />
          <StepAnnouncement message="Krok 3 ze 3: ověřovací kód" />

          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.verifyEmailCode(flow.code);
            }}
          >
            <CodeInput
              value={flow.code}
              onChange={flow.setCode}
              onComplete={flow.verifyEmailCode}
              onResend={flow.resendEmailCode}
              disabled={flow.pending}
            />

            <SubmitButton pending={flow.pending} disabled={flow.code.length < 6}>
              Dokončit registraci
            </SubmitButton>
          </form>
        </>
      ) : null}

      {/*
        Kotva pro Clerk captchu. Je jedna a mimo větve kroků: musí zůstat
        v DOM po celou registraci a nesmí být `display:none` — Clerk sem umí
        vykreslit interaktivní výzvu.
      */}
      <div id="clerk-captcha" className="mt-4 empty:hidden" />
    </div>
  );
}
