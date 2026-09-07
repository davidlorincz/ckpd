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
  "Zakládajícím členem a sponzorem komory je DRONPRO s.r.o. Členské výhody poskytované partnery komory jsou jejich dobrovolným plněním vůči členům; komora z nich nemá provize.";

export const nav = [
  { href: "/o-komore", label: "O komoře" },
  { href: "/clenstvi", label: "Členství" },
  { href: "/stanoviska", label: "Stanoviska" },
  { href: "/overit", label: "Ověření" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

/**
 * Cenová politika: dvě varianty, jinak jsou si všichni členové rovni —
 * jeden člen = jeden hlas bez ohledu na variantu. Čestné členství uděluje
 * Rada osobnostem oboru (bez příspěvku).
 */
export const membershipTiers = [
  {
    key: "zakladni",
    label: "Základní",
    price: "199 Kč",
    period: "měsíc",
    claim: "Být u toho.",
  },
  {
    key: "pro",
    label: "PRO",
    price: "499 Kč",
    period: "měsíc",
    claim: "Pro ty, kdo dronem vydělávají.",
  },
] as const;

/**
 * Členské výhody. Výhody u partnerů (DRONPRO) jsou dobrovolným plněním
 * partnera vůči členům komory. Položky označené `unconfirmed` jsou návrh
 * k potvrzení — před spuštěním webu potvrdit, nebo smazat (nikdy neslibovat
 * nic, co neplatí).
 */
export const memberBenefits: {
  label: string;
  zakladni: boolean;
  pro: boolean;
  unconfirmed?: boolean;
}[] = [
  { label: "Hlas v komoře — jeden člen, jeden hlas", zakladni: true, pro: true },
  {
    label: "Vzorové provozní dokumenty a doporučené postupy (SORA/OSO)",
    zakladni: true,
    pro: true,
  },
  { label: "Prémiový obsah v Dronzóně", zakladni: true, pro: true },
  {
    label: "DIGI univerzita — videokurzy včetně OPEN A1/A3",
    zakladni: true,
    pro: true,
  },
  {
    label: "DIGI univerzita — kurzy pro výdělečný provoz",
    zakladni: false,
    pro: true,
  },
  {
    label: "Bezplatné webináře a workshopy k novým produktům",
    zakladni: true,
    pro: true,
  },
  {
    label: "5 % sleva v e-shopu DRONPRO na consumer techniku",
    zakladni: true,
    pro: true,
  },
  {
    label: "Burza DRONPRO — přístup k nabídkám komerčních zakázek",
    zakladni: false,
    pro: true,
  },
  {
    label: "10 % sleva v e-shopu DRONPRO na enterprise techniku",
    zakladni: false,
    pro: true,
  },
  {
    label: "Až 75 % sleva na vybraná školení",
    zakladni: true,
    pro: true,
  },
  {
    label: "Půjčovna DRONPRO — 25 % navíc na zápůjčku přes členský kód",
    zakladni: false,
    pro: true,
  },
  {
    label: "Výhodnější výkup dronů — o 3–5 % lepší výkupní cena",
    zakladni: false,
    pro: true,
  },
  {
    label: "Bezplatná účast na odborných konferencích",
    zakladni: false,
    pro: true,
  },
  {
    label: "Přednostní servisní termíny",
    zakladni: false,
    pro: true,
    unconfirmed: true,
  },
  {
    label: "Pozvánky na testovací dny nové techniky",
    zakladni: false,
    pro: true,
    unconfirmed: true,
  },
  {
    label: "Zpráva o stavu DRONového provozu v předstihu před publikací",
    zakladni: false,
    pro: true,
    unconfirmed: true,
  },
];

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

/**
 * Vysvětlující videa. Facade v `components/ui/VideoDialog.tsx` je načte až po
 * kliknutí, takže na youtube.com neodejde nic, dokud návštěvník nechce (PRD § 9).
 * `youtubeId: null` = místo je připravené, video se teprve natočí.
 */
export const videos = {
  jakToFunguje: {
    // placeholder z kanálu DRONPRO, než vznikne video přímo o komoře
    youtubeId: "6i9SR2uDKrM",
    title: "Jak funguje Česká komora pilotů DRONů",
  },
} as const;

/** Tři vysvětlující videa v sekci Naše projekty. Doplnit `youtubeId`, až budou. */
export const explainerVideos: {
  key: string;
  title: string;
  text: string;
  youtubeId: string | null;
}[] = [
  {
    key: "digi",
    title: "DIGI univerzita",
    text: "Co se v kurzech naučíš. OPEN A1/A3 má deset lekcí, dohromady necelou hodinu — a máš je v členství.",
    youtubeId: null,
  },
  {
    key: "burza",
    title: "Burza zakázek",
    text: "Přihlásíš se, nastavíš zaměření — a chodí ti poptávky.",
    youtubeId: null,
  },
  {
    key: "vyhody",
    title: "Výhody členství při nákupu",
    text: "Sleva v e-shopu a lepší cena v půjčovně přes členský kód.",
    youtubeId: null,
  },
];

/**
 * Ekosystém, ve kterém komora stojí. Burza ani Půjčovna nemají vlastní značku —
 * jsou to produkty DRONPRO, proto sdílejí jeho wordmark a liší se jen suffixem.
 */
export const projects: {
  key: string;
  /** Klíč lockupu v components/ui/ProjectLockup.tsx; `null` = mateřská značka. */
  lockup: "burza" | "pujcovna" | null;
  href: string | null;
  text: string;
}[] = [
  {
    key: "dronpro",
    lockup: null,
    href: "https://www.dronpro.cz",
    text: "E-shop, servis a školicí středisko. Technika i výcvik na jednom místě.",
  },
  {
    key: "burza",
    lockup: "burza",
    href: null,
    text: "Zadavatel poptá práci, piloti se hlásí.",
  },
  {
    key: "pujcovna",
    lockup: "pujcovna",
    href: null,
    text: "Dron na zakázku, aniž bys ho musel koupit.",
  },
];

/**
 * Čísla, kterými se členství prodává. Úplný výčet zůstává v `memberBenefits`;
 * tohle je výběr toho, co je vidět jako důvod zaplatit. Slevy jsou dobrovolné
 * plnění partnerů — při změně u DRONPRO změnit i tady.
 */
export const benefitHighlights = [
  {
    // pozor na délku: hodnota musí zůstat na jednom řádku i ve čtyřech
    // sloupcích, jinak se řada čísel rozejde z účaří
    value: "5–10 %",
    label: "sleva v e-shopu DRONPRO",
    note: "Základní / PRO",
  },
  {
    value: "25 %",
    label: "navíc na zápůjčku techniky",
    note: "PRO — přes členský kód v půjčovně",
  },
  {
    value: "až 75 %",
    label: "sleva na vybraná školení",
    note: "obě varianty",
  },
  {
    value: "10 lekcí",
    label: "DIGI univerzita, OPEN A1/A3",
    note: "v Základním i PRO",
  },
] as const;

/** Co se čísly vyjádřit nejde. Doplňuje `benefitHighlights`. */
export const benefitHeadline =
  "PRO navíc: přístup k nabídkám komerčních zakázek na Burze DRONPRO.";
