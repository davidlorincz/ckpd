import { csCZ } from "@clerk/localizations";

/**
 * Čeština pro Clerk, přepsaná na tykání.
 *
 * Výchozí `csCZ` vyká („Vítejte zpět! Prosím přihlaste se“), zbytek webu
 * tyká — a právě ten rozpor dělá z přihlášení cizí službu. Přepisujeme jen
 * texty, které uživatel reálně uvidí v našem toku (e-mail + kód, heslo,
 * registrace); zbytek zůstává z balíku.
 */
export const clerkLocalization = {
  ...csCZ,

  formButtonPrimary: "Pokračovat",
  // placeholdery: část jich csCZ nepřekládá vůbec, zbytek vyká
  formFieldInputPlaceholder__emailAddress: "tvuj@email.cz",
  formFieldInputPlaceholder__password: "Zadej heslo",
  formFieldInputPlaceholder__signUpPassword: "Zvol si heslo",
  formFieldInputPlaceholder__firstName: "Jméno",
  formFieldInputPlaceholder__lastName: "Příjmení",
  formFieldInputPlaceholder__emailAddress_username: "E-mail nebo uživatelské jméno",
  dividerText: "nebo",
  backButton: "Zpět",
  footerActionLink__useAnotherMethod: "Zkusit jinak",

  signIn: {
    ...csCZ.signIn,
    start: {
      ...csCZ.signIn?.start,
      title: "Přihlášení",
      subtitle: "Zadej e-mail, kterým ses registroval.",
      actionText: "Ještě nemáš účet?",
      actionLink: "Zaregistruj se",
    },
    password: {
      ...csCZ.signIn?.password,
      title: "Zadej heslo",
      subtitle: "Heslo k tvému účtu v komoře.",
    },
    emailCode: {
      ...csCZ.signIn?.emailCode,
      title: "Zkontroluj e-mail",
      subtitle: "Poslali jsme ti přihlašovací kód.",
    },
    forgotPasswordAlternativeMethods: {
      ...csCZ.signIn?.forgotPasswordAlternativeMethods,
      title: "Zapomenuté heslo",
    },
  },

  signUp: {
    ...csCZ.signUp,
    start: {
      ...csCZ.signUp?.start,
      title: "Registrace",
      subtitle: "Účet je zdarma a k ničemu tě nezavazuje.",
      actionText: "Už máš účet?",
      actionLink: "Přihlas se",
    },
    emailCode: {
      ...csCZ.signUp?.emailCode,
      title: "Ověř svůj e-mail",
      subtitle: "Poslali jsme ti ověřovací kód.",
    },
  },
} as typeof csCZ;
