/**
 * Testovací prostředí ověřovacího API (pískoviště).
 *
 * Partner potřebuje vyzkoušet integraci dřív, než mu první člen vloží svůj
 * kód — a hlavně potřebuje vidět okrajové stavy, které v ostrém provozu
 * nastanou jednou za rok: vypršelé členství, čestné členství bez placeného
 * období, člen bez souhlasu se zveřejněním jména.
 *
 * PROČ FIXTURY V KÓDU A NE ŘÁDKY V DATABÁZI: fiktivní členové by v tabulce
 * `members` zkreslovali počty, mohli by se objevit ve veřejném seznamu a
 * spotřebovávali by pořadová čísla. Takhle jsou testovací data zaručeně
 * neměnná, stejná v každém nasazení a nejde je omylem smazat.
 *
 * PROČ JSOU KÓDY NAPSANÉ RUČNĚ a ne poskládané z `lib/code.ts`: tenhle
 * soubor je schválně bez závislostí, aby se dal načíst i z testu. Shodu
 * `code` ↔ `lookup` s parserem hlídá `tests/sandbox.test.mts` — kdyby se
 * normalizace změnila, test spadne dřív, než se rozejdou vydané kódy.
 *
 * Sandbox kódy fungují VÝHRADNĚ na `/api/v1/sandbox/verify`, ostré kódy
 * výhradně na `/api/v1/verify`. Oba světy se nikde nepotkají — jinak by se
 * dal testovací kód uplatnit u partnera jako platné členství.
 */

export type SandboxStatus =
  | "none"
  | "pending"
  | "active"
  | "past_due"
  | "canceled";

export type SandboxMember = {
  /** Členské číslo. Od 9001 výš, ať je na první pohled poznat, že je fiktivní. */
  memberNumber: string;
  /**
   * Ověřovací kód, jak ho partner opíše. Tajný přívěsek obsahuje schválně
   * jen znaky, které normalizace nepřepisuje (žádné I, L, O, U) — zapsaný
   * a normalizovaný tvar jsou pak totožné a kód se v auditu pozná bez
   * překládání.
   */
  code: string;
  /** Normalizovaný tvar, na který se `code` musí přeložit. */
  lookup: string;
  name: string;
  tier?: "zakladni" | "pro" | "cestne";
  status: SandboxStatus;
  publicListing: boolean;
  /** Pevné datum vzniku členství (ISO). */
  memberSince?: string;
  /**
   * Konec zaplaceného období relativně ke dnešku, ve dnech. `null` znamená
   * členství bez placeného období (čestné).
   *
   * PROČ RELATIVNĚ: pevné datum by jednou nastalo — „platný" fixture by
   * vypršel a „vypršelý" by zestárnul do nesmyslu. Takhle sada popisuje
   * pořád ty stavy, kvůli kterým vznikla.
   */
  paidUntilOffsetDays: number | null;
  /** Popis pro administraci i dokumentaci partnerů. */
  note: string;
};

export const SANDBOX_MEMBERS: SandboxMember[] = [
  /* ────────────────────────── platná členství ────────────────────────── */
  {
    memberNumber: "CKPD-2026-9001",
    code: "CKPD-2026-9001-TEST9001",
    lookup: "2026:9001:TEST9001",
    name: "Jan Testovací",
    tier: "zakladni",
    status: "active",
    publicListing: true,
    memberSince: "2026-01-15",
    paidUntilOffsetDays: 30,
    note: "Základní členství, běžný stav. Referenční šťastná cesta.",
  },
  {
    memberNumber: "CKPD-2026-9002",
    code: "CKPD-2026-9002-TEST9002",
    lookup: "2026:9002:TEST9002",
    name: "Petra Zkušební",
    tier: "pro",
    status: "active",
    publicListing: true,
    memberSince: "2025-03-01",
    paidUntilOffsetDays: 30,
    note: "PRO členství — na tomhle se ověří odstupňování výhody podle `tier`.",
  },
  {
    memberNumber: "CKPD-2026-9003",
    code: "CKPD-2026-9003-TEST9003",
    lookup: "2026:9003:TEST9003",
    name: "Skrytý Testovač",
    tier: "pro",
    status: "active",
    publicListing: false,
    memberSince: "2026-05-20",
    paidUntilOffsetDays: 30,
    note: "Člen bez souhlasu se zveřejněním — vrací `name: null`. Partner se nesmí na jméno spoléhat.",
  },
  {
    memberNumber: "CKPD-2026-9004",
    code: "CKPD-2026-9004-TEST9004",
    lookup: "2026:9004:TEST9004",
    name: "Čestný Testovač",
    tier: "cestne",
    status: "active",
    publicListing: true,
    memberSince: "2024-09-01",
    paidUntilOffsetDays: null,
    note: "Čestné členství: `price: 0`, prázdná `period` a `paidUntil: null` — členství bez placeného období.",
  },
  {
    memberNumber: "CKPD-2026-9005",
    code: "CKPD-2026-9005-TEST9005",
    lookup: "2026:9005:TEST9005",
    name: "Hraniční Testovač",
    tier: "zakladni",
    status: "active",
    publicListing: true,
    memberSince: "2026-02-10",
    paidUntilOffsetDays: 1,
    note: "Platné jen do zítřka — na test upozornění, že členství brzy končí, bez čekání měsíc.",
  },

  /* ───────────────────────── neplatná členství ───────────────────────── */
  {
    memberNumber: "CKPD-2026-9006",
    code: "CKPD-2026-9006-TEST9006",
    lookup: "2026:9006:TEST9006",
    name: "Vypršelý Testovač",
    tier: "pro",
    status: "active",
    publicListing: true,
    memberSince: "2025-01-05",
    paidUntilOffsetDays: -45,
    note: "Vypršelé členství — příspěvek uhrazen do data v minulosti.",
  },
  {
    memberNumber: "CKPD-2026-9007",
    code: "CKPD-2026-9007-TEST9007",
    lookup: "2026:9007:TEST9007",
    name: "Zrušený Testovač",
    tier: "zakladni",
    status: "canceled",
    publicListing: true,
    memberSince: "2025-06-01",
    paidUntilOffsetDays: -10,
    note: "Člen členství zrušil.",
  },
  {
    memberNumber: "CKPD-2026-9008",
    code: "CKPD-2026-9008-TEST9008",
    lookup: "2026:9008:TEST9008",
    name: "Nedoplatek Testovač",
    tier: "pro",
    status: "past_due",
    publicListing: true,
    memberSince: "2025-11-01",
    paidUntilOffsetDays: 5,
    note: "Nezaplacená obnova — období ještě běží, ale členství je pozastavené. Odpověď je stejná jako u vypršelého.",
  },
  {
    memberNumber: "CKPD-2026-9009",
    code: "CKPD-2026-9009-TEST9009",
    lookup: "2026:9009:TEST9009",
    name: "Nezaplacený Testovač",
    status: "pending",
    publicListing: true,
    paidUntilOffsetDays: null,
    note: "Registrace bez zaplacení — členství ještě nevzniklo.",
  },
];

export function findSandboxMember(lookup: string): SandboxMember | undefined {
  return SANDBOX_MEMBERS.find((m) => m.lookup === lookup);
}

/** Konec dne v UTC posunutý o `days`. Odpověď datum stejně ořezává na den. */
function endOfDay(now: number, days: number): number {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 59, 999);
  return d.getTime();
}

/**
 * Fixture → přesně ten tvar, který ověřování čte u skutečného člena. Díky
 * tomu jde přes obě větve tentýž kód sestavující odpověď a payloady se
 * nemůžou rozejít.
 */
export function resolveSandbox(m: SandboxMember, now: number) {
  return {
    tier: m.tier,
    status: m.status,
    memberSince: m.memberSince ? Date.parse(m.memberSince) : undefined,
    currentPeriodEnd:
      m.paidUntilOffsetDays === null
        ? undefined
        : endOfDay(now, m.paidUntilOffsetDays),
    memberNumber: m.memberNumber,
    name: m.name,
    publicListing: m.publicListing,
  };
}
