/**
 * Položky členské sekce na jednom místě.
 *
 * Čte je boční navigace v `/muj-ucet` i uživatelské menu v hlavičce — kdyby
 * měla každá vlastní seznam, dřív nebo později by se rozešly. Popisek se
 * v obou místech liší jen u přehledu: v sekci je člověk „v účtu" a čte
 * „Přehled", v hlavičce potřebuje vědět, že ho odkaz do účtu teprve vezme.
 */
export const memberNavItems = [
  { href: "/muj-ucet", label: "Přehled", menuLabel: "Můj účet", exact: true },
  { href: "/muj-ucet/predplatne", label: "Členství a platby" },
  { href: "/muj-ucet/faktury", label: "Doklady" },
  { href: "/muj-ucet/profil", label: "Profil" },
] as const;
