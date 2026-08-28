/**
 * Sladění Clerk formulářů s institucionálním vzhledem webu: radius 2 px,
 * BLUE BASE jako primární, konverzní zelená na potvrzovacích tlačítkách,
 * žádné stíny navíc. Hodnoty odpovídají tokenům v app/globals.css.
 */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#0eb24f",
    colorText: "#000064",
    colorTextSecondary: "#55557f",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#000064",
    colorDanger: "#9e2b25",
    borderRadius: "2px",
    fontSize: "15px",
  },
  elements: {
    card: "border border-hairline shadow-paper rounded-[2px]",
    headerTitle: "font-serif uppercase text-brass",
    formButtonPrimary:
      "bg-action hover:bg-action-2 text-white normal-case text-[15px] font-medium rounded-[2px] shadow-none",
    footerActionLink: "text-brass hover:text-deep-2",
  },
};
