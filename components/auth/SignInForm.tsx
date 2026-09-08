"use client";

import {
  AuthError,
  AuthHeading,
  AuthLink,
  AuthNotice,
  Field,
  LinkButton,
  OrDivider,
  StepAnnouncement,
  SubmitButton,
  authInputClass,
} from "@/components/auth/AuthUi";
import { CodeInput } from "@/components/auth/CodeInput";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useSignInFlow } from "@/components/auth/useSignInFlow";
import { fieldErrorMessage } from "@/lib/authErrors";

const OAUTH_MESSAGE =
  "Přihlášení přes Google se nedokončilo. Zkus to prosím znovu.";

const NOTICES = {
  no_account:
    "K tomuhle Google účtu tu zatím žádný účet není. Založ si ho registrací.",
  account_exists:
    "Účet už existuje. Přihlas se prosím tady.",
} as const;

export type SignInNotice = keyof typeof NOTICES;

export function SignInForm({
  redirectTo,
  callbackUrl,
  oauthError,
  notice,
}: {
  redirectTo: string;
  callbackUrl: string;
  oauthError?: boolean;
  notice?: SignInNotice;
}) {
  const flow = useSignInFlow({ redirectTo });

  const formError = flow.error ?? (oauthError ? OAUTH_MESSAGE : null);
  const identifierError = formError
    ? null
    : fieldErrorMessage(flow.fieldErrors.identifier);
  const passwordError = formError
    ? null
    : fieldErrorMessage(flow.fieldErrors.password);

  const emailField = (
    <Field label="E-mailová adresa" htmlFor="identifier" error={identifierError}>
      <input
        id="identifier"
        name="identifier"
        type="email"
        value={flow.email}
        onChange={(event) => flow.setEmail(event.target.value)}
        disabled={flow.pending}
        autoComplete="email"
        placeholder="tvuj@email.cz"
        aria-invalid={identifierError ? true : undefined}
        className={authInputClass}
      />
    </Field>
  );

  return (
    <div>
      {flow.step === "heslo" ? (
        <>
          <AuthHeading
            title="Přihlášení"
            lead="Přihlas se do svého členského účtu."
          />
          <AuthError message={formError} />
          <AuthNotice message={notice ? NOTICES[notice] : null} />

          <GoogleButton
            mode="signIn"
            redirectTo={redirectTo}
            callbackUrl={callbackUrl}
            disabled={flow.pending}
            onError={flow.setError}
          />

          <OrDivider />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.submitPassword();
            }}
          >
            {emailField}

            <Field label="Heslo" htmlFor="password" error={passwordError}>
              <PasswordInput
                id="password"
                value={flow.password}
                onChange={flow.setPassword}
                disabled={flow.pending}
                invalid={Boolean(passwordError)}
              />
            </Field>

            <SubmitButton pending={flow.pending}>Přihlásit se</SubmitButton>
          </form>

          <div className="mt-5 flex flex-wrap justify-between gap-3">
            <LinkButton
              onClick={() => flow.goTo("kod")}
              disabled={flow.pending}
            >
              Přihlásit se kódem na e-mail
            </LinkButton>
            <LinkButton
              onClick={() => flow.goTo("zapomenute-heslo")}
              disabled={flow.pending}
            >
              Zapomenuté heslo?
            </LinkButton>
          </div>

          <p className="mt-8 text-center text-[14px] text-ink-2">
            Ještě nemáš účet? <AuthLink href="/registrace">Zaregistruj se</AuthLink>
          </p>
        </>
      ) : null}

      {flow.step === "kod" ? (
        <>
          <AuthHeading
            title="Kód z e-mailu"
            lead={
              <>
                Poslali jsme šestimístný kód na <strong>{flow.email}</strong>.
              </>
            }
          />
          <StepAnnouncement message="Zadej kód z e-mailu" />
          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.verifySignInCode(flow.code);
            }}
          >
            <CodeInput
              value={flow.code}
              onChange={flow.setCode}
              onComplete={flow.verifySignInCode}
              onResend={flow.sendSignInCode}
              disabled={flow.pending}
            />
            <SubmitButton pending={flow.pending} disabled={flow.code.length < 6}>
              Přihlásit se
            </SubmitButton>
          </form>

          <div className="mt-5">
            <LinkButton onClick={() => flow.goTo("heslo")} disabled={flow.pending}>
              Zpět na heslo
            </LinkButton>
          </div>
        </>
      ) : null}

      {flow.step === "zapomenute-heslo" ? (
        <>
          <AuthHeading
            title="Zapomenuté heslo"
            lead="Pošleme ti kód, kterým si nastavíš nové."
          />
          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.sendResetCode();
            }}
          >
            {emailField}
            <SubmitButton pending={flow.pending}>Poslat kód</SubmitButton>
          </form>

          <div className="mt-5">
            <LinkButton onClick={() => flow.goTo("heslo")} disabled={flow.pending}>
              Zpět na přihlášení
            </LinkButton>
          </div>
        </>
      ) : null}

      {flow.step === "zapomenute-kod" ? (
        <>
          <AuthHeading
            title="Kód pro obnovu"
            lead={
              <>
                Poslali jsme šestimístný kód na <strong>{flow.email}</strong>.
              </>
            }
          />
          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.verifyResetCode(flow.code);
            }}
          >
            <CodeInput
              value={flow.code}
              onChange={flow.setCode}
              onComplete={flow.verifyResetCode}
              onResend={flow.sendResetCode}
              disabled={flow.pending}
            />
            <SubmitButton pending={flow.pending} disabled={flow.code.length < 6}>
              Pokračovat
            </SubmitButton>
          </form>
        </>
      ) : null}

      {flow.step === "nove-heslo" || flow.step === "nove-heslo-vynucene" ? (
        <>
          <AuthHeading
            title="Nové heslo"
            lead={
              flow.step === "nove-heslo-vynucene"
                ? "Než budeš pokračovat, nastav si prosím nové heslo."
                : "Ostatní přihlášená zařízení se odhlásí."
            }
          />
          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.submitNewPassword();
            }}
          >
            <Field label="Nové heslo" htmlFor="newPassword" hint="Aspoň 8 znaků.">
              <PasswordInput
                id="newPassword"
                value={flow.newPassword}
                onChange={flow.setNewPassword}
                disabled={flow.pending}
                autoComplete="new-password"
              />
            </Field>
            <SubmitButton pending={flow.pending}>Nastavit heslo</SubmitButton>
          </form>
        </>
      ) : null}

      {flow.step === "druhy-faktor" ? (
        <>
          <AuthHeading
            title="Potvrzení přihlášení"
            lead="Poslali jsme ti na e-mail kód, kterým potvrdíš, že jsi to opravdu ty."
          />
          <AuthError message={flow.error} />

          <form
            noValidate
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void flow.verifyMfaCode(flow.code);
            }}
          >
            <CodeInput
              value={flow.code}
              onChange={flow.setCode}
              onComplete={flow.verifyMfaCode}
              onResend={flow.sendSignInCode}
              disabled={flow.pending}
            />
            <SubmitButton pending={flow.pending} disabled={flow.code.length < 6}>
              Potvrdit
            </SubmitButton>
          </form>
        </>
      ) : null}

      {flow.step === "overeni-navic" ? (
        <>
          <AuthHeading
            title="Ještě jedno ověření"
            lead="Přihlášení potřebuje dodatečnou kontrolu. Načti prosím stránku znovu a zkus to ještě jednou."
          />
          <AuthError message={flow.error} />
          <div className="mt-2">
            <LinkButton onClick={() => flow.goTo("heslo")}>
              Zpět na přihlášení
            </LinkButton>
          </div>
        </>
      ) : null}
    </div>
  );
}
