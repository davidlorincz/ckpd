/**
 * Přihlášení a registrace ve vzhledu komory, ne výchozího Clerku.
 *
 * DVĚ SADY NÁZVŮ PROMĚNNÝCH SCHVÁLNĚ: Clerk kolem verze 6 přejmenoval
 * `colorText` → `colorForeground`, `colorInputBackground` → `colorInput`
 * a spol. Neznámé klíče Clerk tiše ignoruje, takže držet obě sady je
 * levnější než hádat, co zrovna běží — a přežije to i upgrade.
 *
 * Hodnoty odpovídají tokenům v app/globals.css. Radius 2 px, žádné stíny
 * navíc, konverzní zelená jen na potvrzovacím tlačítku.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0eb24f",
    colorPrimaryForeground: "#ffffff",
    // nové názvy
    colorForeground: "#000064",
    colorMutedForeground: "#55557f",
    colorInput: "#ffffff",
    colorInputForeground: "#000064",
    colorMuted: "#ededff",
    colorNeutral: "#000064",
    colorBorder: "#b6b3ff",
    colorRing: "#2626ff",
    // starší názvy — pro jistotu, ignorované verze je přeskočí
    colorText: "#000064",
    colorTextSecondary: "#55557f",
    colorInputBackground: "#ffffff",
    colorInputText: "#000064",

    colorBackground: "#ffffff",
    colorDanger: "#9e2b25",
    borderRadius: "2px",
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    fontSize: "15px",
  },
  layout: {
    socialButtonsPlacement: "bottom" as const,
    socialButtonsVariant: "blockButton" as const,
    shimmer: false,
    logoPlacement: "none" as const,
    privacyPageUrl: "/ochrana-osobnich-udaju",
    termsPageUrl: "/eticky-kodex",
  },
  elements: {
    // rám kreslí stránka (AuthScreen), Clerk má být jen formulář uvnitř
    rootBox: "w-full min-w-0",
    // min-w-0 + max-w-full: bez toho si Clerk drží vnitřní minimum ~337 px
    // a na 375px displeji vyjede z rámu ven
    cardBox: "w-full min-w-0 max-w-full shadow-none border-0 rounded-none",
    card: "w-full min-w-0 max-w-full bg-paper border-0 rounded-none shadow-none px-0 py-0",
    // nadpis kreslí stránka (AuthScreen); Clerkův by ho zdvojil
    header: "hidden",
    logoBox: "hidden",

    socialButtonsBlockButton:
      "h-11 rounded-[2px] border border-hairline bg-paper text-ink shadow-none hover:bg-paper-2",
    socialButtonsBlockButtonText: "text-[15px] font-medium text-ink",
    dividerLine: "bg-hairline",
    dividerText: "text-[12px] uppercase tracking-wider text-ink-2",

    formFieldLabel:
      "text-[13px] font-medium uppercase tracking-wider text-ink-2",
    formFieldInput:
      "h-11 rounded-[2px] border border-hairline bg-paper text-ink shadow-none focus:border-brass",
    formFieldAction: "text-brass hover:text-deep-2",
    formButtonPrimary:
      "h-11 rounded-[2px] bg-action text-white shadow-none normal-case text-[15px] font-medium hover:bg-action-2",
    otpCodeFieldInput: "rounded-[2px] border-hairline text-ink",
    identityPreview: "rounded-[2px] border border-hairline bg-paper-2",

    footer: "bg-transparent border-t border-hairline pt-4",
    footerAction: "bg-transparent",
    footerActionText: "text-ink-2",
    footerActionLink: "text-brass hover:text-deep-2",
  },
};
