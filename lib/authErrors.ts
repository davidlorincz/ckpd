/**
 * Clerk chyby → česká věta.
 *
 * Vlastní auth UI znamená, že hlášky si píšeme sami — `lib/clerkLocalization.ts`
 * překládá jen hostované komponenty (admin, UserButton) a na tyhle obrazovky
 * nedosáhne.
 */

/**
 * Strukturální tvar chyby. Typy z Clerku nejde importovat: `@clerk/shared`
 * není v `node_modules/@clerk/` (pnpm strict) a přidat ho do `package.json`
 * by rozjelo verze proti tomu, co si táhne `@clerk/nextjs`.
 */
type ClerkErrorLike = {
  code?: string;
  message?: string;
  longMessage?: string;
  errors?: ClerkErrorLike[];
};

type AuthErrorKey =
  | "invalidCredentials"
  | "invalidEmail"
  | "required"
  | "emailTaken"
  | "sessionExists"
  | "codeIncorrect"
  | "codeExpired"
  | "tooManyRequests"
  | "accountLocked"
  | "passwordPwned"
  | "passwordTooShort"
  | "passwordWeak"
  | "captchaFailed"
  | "oauthFailed"
  | "generic";

const MESSAGES: Record<AuthErrorKey, string> = {
  invalidCredentials: "Nesprávný e-mail nebo heslo.",
  invalidEmail: "Zkontroluj tvar e-mailové adresy.",
  required: "Vyplň prosím všechna pole.",
  emailTaken: "Na tenhle e-mail už účet existuje.",
  sessionExists: "Už jsi přihlášený.",
  codeIncorrect: "Kód nesedí. Přepiš ho prosím znovu.",
  codeExpired: "Kódu vypršela platnost. Nech si poslat nový.",
  tooManyRequests: "Moc pokusů za sebou. Zkus to za chvíli znovu.",
  accountLocked: "Účet je dočasně zamčený kvůli opakovaným pokusům.",
  passwordPwned:
    "Tohle heslo se objevilo v úniku dat. Zvol prosím jiné.",
  passwordTooShort: "Heslo musí mít aspoň 8 znaků.",
  passwordWeak: "Heslo je příliš slabé. Přidej délku nebo další slovo.",
  captchaFailed:
    "Ověření, že nejsi robot, neprošlo. Načti stránku znovu a zkus to ještě jednou.",
  oauthFailed: "Přihlášení přes Google se nepovedlo. Zkus to prosím znovu.",
  generic: "Něco se nepovedlo. Zkus to prosím znovu.",
};

/**
 * `form_identifier_not_found` a `form_password_incorrect` mají ZÁMĚRNĚ stejnou
 * hlášku. Kdyby se lišily, dala by se evidence členů proklepat na existenci
 * konkrétního e-mailu.
 */
const CODE_MAP: Record<string, AuthErrorKey> = {
  form_identifier_not_found: "invalidCredentials",
  form_password_incorrect: "invalidCredentials",
  form_param_format_invalid: "invalidEmail",
  form_param_nil: "required",
  form_param_missing: "required",
  form_identifier_exists: "emailTaken",
  identifier_already_signed_in: "sessionExists",
  session_exists: "sessionExists",
  form_code_incorrect: "codeIncorrect",
  verification_failed: "codeIncorrect",
  verification_expired: "codeExpired",
  verification_already_verified: "codeExpired",
  too_many_requests: "tooManyRequests",
  rate_limit_exceeded: "tooManyRequests",
  user_locked: "accountLocked",
  form_password_pwned: "passwordPwned",
  form_password_length_too_short: "passwordTooShort",
  form_password_validation_failed: "passwordWeak",
  form_password_not_strong_enough: "passwordWeak",
  captcha_invalid: "captchaFailed",
  captcha_unavailable: "captchaFailed",
  captcha_failed: "captchaFailed",
  oauth_access_denied: "oauthFailed",
  external_account_exists: "oauthFailed",
  oauth_email_domain_reserved: "oauthFailed",
};

/**
 * Obálky, které samy o sobě nic neříkají. `ClerkAPIResponseError` nese na sobě
 * jen `code: "api_response_error"`; skutečný kód je až v `errors[0]`. Bez
 * tohohle rozbalení by každá chyba skončila jako generická.
 */
const WRAPPER_CODES = new Set(["api_response_error", "runtime_error", ""]);

function asError(value: unknown): ClerkErrorLike | null {
  return value && typeof value === "object" ? (value as ClerkErrorLike) : null;
}

/** Kód, na kterém se dá stavět — přeskočí obálky a jde do `errors[]`. */
export function authErrorCode(value: unknown): string | undefined {
  const error = asError(value);
  if (!error) return undefined;

  const own = error.code ?? "";
  if (!WRAPPER_CODES.has(own)) return own;

  const nested = error.errors?.[0];
  return nested?.code ?? (own || undefined);
}

/** Česká věta pro uživatele. Nikdy nevrací prázdno. */
export function authErrorMessage(value: unknown): string {
  const error = asError(value);
  if (!error) return MESSAGES.generic;

  const code = authErrorCode(value);
  if (code && code in CODE_MAP) return MESSAGES[CODE_MAP[code]];

  // Neznámý kód: Clerkova vlastní věta je pořád lepší než „něco se nepovedlo“.
  const nested = error.errors?.[0];
  return (
    nested?.longMessage ??
    nested?.message ??
    error.longMessage ??
    error.message ??
    MESSAGES.generic
  );
}

/** Hláška u konkrétního pole ze signálu (`errors.fields.password` apod.). */
export function fieldErrorMessage(field: unknown): string | null {
  const error = asError(field);
  if (!error) return null;
  return authErrorMessage(error);
}

export { MESSAGES as authMessages };
