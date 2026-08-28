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
    label: "DIGI univerzita — videokurzy k legislativě a provozu",
    zakladni: true,
    pro: true,
  },
  {
    label: "DIGI univerzita v plném rozsahu (hobby i průmysl)",
    zakladni: false,
    pro: true,
  },
  {
    label: "Bezplatné webináře a workshopy k novým produktům",
    zakladni: true,
    pro: true,
  },
  { label: "5% sleva na consumer techniku", zakladni: true, pro: true },
  {
    label: "Přístup k pravidelným nabídkám komerčních zakázek (marketplace)",
    zakladni: false,
    pro: true,
  },
  { label: "10% sleva na enterprise techniku", zakladni: false, pro: true },
  { label: "Až 75% sleva na vybraná školení", zakladni: true, pro: true },
  {
    label: "Dodatečná 25% sleva na zápůjčku techniky",
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
