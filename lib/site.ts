/**
 * Centrální konstanty webu. Registrové údaje pocházejí z ARES / spolkového
 * rejstříku (stav k 12. 8. 2026) — při změně sídla nebo orgánů aktualizovat zde.
 */

export const org = {
  name: "Česká komora pilotů DRONů z.s.",
  shortName: "ČKPD",
  ico: "24902497",
  court: "Městský soud v Praze",
  fileNumber: "L 81935",
  address: "Měšetice 2, 257 91 Sedlec-Prčice",
  // TODO: doplnit ID datové schránky, až bude zpřístupněná
  dataBox: "bude doplněno",
  email: "info@ckpd.cz",
  mediaEmail: "media@ckpd.cz",
  chairman: "Alexandr Novotný",
  registryUrl:
    "https://or.justice.cz/ias/ui/rejstrik-$firma?ico=24902497",
} as const;

export const utilityBarText = `Dobrovolný profesní spolek · IČO ${org.ico} · zapsáno u Městského soudu v Praze, sp. zn. ${org.fileNumber}`;

export const legalLine =
  "Nejsme zřízeni zákonem. Členství v komoře je dobrovolné a není podmínkou provozu bezpilotního systému.";

export const disclosureLine =
  "Zakládajícím členem a sponzorem komory je DRONPRO s.r.o. Komora nedoporučuje produkty ani prodejce.";

export const nav = [
  { href: "/o-komore", label: "O komoře" },
  { href: "/clenstvi", label: "Členství" },
  { href: "/stanoviska", label: "Stanoviska" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

export const membershipTiers = [
  {
    key: "pilot",
    label: "Individuální pilot",
    fee: "900 Kč / rok",
    vote: "1 hlas",
    note: "Hobby i výdělečný provoz.",
  },
  {
    key: "student",
    label: "Student, do 18 let, škola",
    fee: "0–300 Kč / rok",
    vote: "poradní hlas",
    note: "Výši potvrzuje Rada podle kategorie.",
  },
  {
    key: "firma",
    label: "Firemní člen — provozovatel do 5 pilotů",
    fee: "8 000 Kč / rok",
    vote: "1 hlas",
    note: "Malé provozní firmy a živnostníci s týmem.",
  },
  {
    key: "korporat",
    label: "Firemní člen — korporát / výrobce",
    fee: "25 000 Kč / rok",
    vote: "1 hlas",
    note: "Větší provozovatelé, výrobci, integrátoři.",
  },
  {
    key: "cestny",
    label: "Čestný člen",
    fee: "bez příspěvku",
    vote: "poradní hlas",
    note: "Na pozvání Rady — osobnosti oboru a akademici.",
  },
] as const;

export const regions = [
  "Hlavní město Praha",
  "Středočeský kraj",
  "Jihočeský kraj",
  "Plzeňský kraj",
  "Karlovarský kraj",
  "Ústecký kraj",
  "Liberecký kraj",
  "Královéhradecký kraj",
  "Pardubický kraj",
  "Kraj Vysočina",
  "Jihomoravský kraj",
  "Olomoucký kraj",
  "Zlínský kraj",
  "Moravskoslezský kraj",
] as const;

export const operationFocus = [
  "Foto a video",
  "Inspekce a energetika",
  "Geodézie a mapování",
  "Zemědělství",
  "Stavebnictví",
  "IZS a bezpečnost",
  "Vzdělávání a výcvik",
  "Rekreační létání",
  "Jiné",
] as const;
