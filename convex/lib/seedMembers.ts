/**
 * Testovací členové pro veřejný seznam na /clenove.
 *
 * PROČ TENHLE SEED VŮBEC EXISTUJE: sandboxové fixtury v `convex/lib/sandbox.ts`
 * jsou schválně jen v kódu, protože obsluhují ověřovací API a do evidence
 * nepatří. Tady je to naopak — seznam členů má číst skutečná data ze stejné
 * cesty jako produkce, jinak netestuje nic. Řádky proto do databáze jdou,
 * ale jsou od skutečných členů oddělené na třech úrovních:
 *
 *  - jméno končí „(TEST)“, takže je poznat i na veřejném webu
 *  - členská čísla běží od 9001, mimo pořadí z čítače `counters`
 *  - `clerkUserId` má prefix `seed_`, podle kterého je umí smazat
 *    `seed:seedMembersReset`
 *
 * Tajemství ověřovacích kódů musí být z Crockford base32 bez I/L/O/U,
 * jinak neprojdou `normalizeCode` (viz convex/lib/code.ts).
 */

export const SEED_PREFIX = "seed_";

export type SeedCredential = {
  skill: string;
  basis: "zkouska" | "portfolio" | "kurz" | "praxe";
  /** Kolik dní zpátky se certifikace vydala. Určuje i „platné do“. */
  issuedDaysAgo: number;
};

export type SeedMember = {
  seq: number;
  secret: string;
  name: string;
  email: string;
  tier: "zakladni" | "pro";
  region: string;
  profile: string;
  focus: string[];
  memberSinceDaysAgo: number;
  credentials: SeedCredential[];
};

export const SEED_MEMBERS: SeedMember[] = [
  {
    seq: 9001,
    secret: "TEST9001",
    name: "Jan Novák (TEST)",
    email: "jan.novak@test.ckpd.cz",
    tier: "pro",
    region: "Hlavní město Praha",
    profile: "inspekce fotovoltaik a plochých střech",
    focus: ["Inspekce a energetika", "Stavebnictví"],
    memberSinceDaysAgo: 420,
    credentials: [
      { skill: "termovize", basis: "zkouska", issuedDaysAgo: 300 },
      { skill: "foto", basis: "portfolio", issuedDaysAgo: 380 },
    ],
  },
  {
    seq: 9002,
    secret: "TEST9002",
    name: "Petra Dvořáková (TEST)",
    email: "petra.dvorakova@test.ckpd.cz",
    tier: "zakladni",
    region: "Jihomoravský kraj",
    profile: "svatební a reklamní video, Brno",
    focus: ["Foto a video"],
    memberSinceDaysAgo: 210,
    credentials: [{ skill: "video", basis: "portfolio", issuedDaysAgo: 180 }],
  },
  {
    seq: 9003,
    secret: "TEST9003",
    name: "Martin Svoboda (TEST)",
    email: "martin.svoboda@test.ckpd.cz",
    tier: "pro",
    region: "Středočeský kraj",
    profile: "geodetické mapování stavenišť",
    focus: ["Geodézie a mapování", "Stavebnictví"],
    memberSinceDaysAgo: 640,
    credentials: [
      { skill: "fotogrametrie", basis: "zkouska", issuedDaysAgo: 500 },
      { skill: "software", basis: "kurz", issuedDaysAgo: 460 },
    ],
  },
  {
    seq: 9004,
    secret: "TEST9004",
    name: "Lucie Nováková (TEST)",
    email: "lucie.novakova@test.ckpd.cz",
    tier: "zakladni",
    region: "Moravskoslezský kraj",
    profile: "letecké foto nemovitostí",
    focus: ["Foto a video"],
    memberSinceDaysAgo: 95,
    credentials: [{ skill: "foto", basis: "zkouska", issuedDaysAgo: 60 }],
  },
  {
    seq: 9005,
    secret: "TEST9005",
    name: "Tomáš Černý (TEST)",
    email: "tomas.cerny@test.ckpd.cz",
    tier: "pro",
    region: "Plzeňský kraj",
    profile: "inspekce vedení vysokého napětí",
    focus: ["Inspekce a energetika"],
    memberSinceDaysAgo: 810,
    credentials: [
      { skill: "termovize", basis: "zkouska", issuedDaysAgo: 720 },
      { skill: "foto", basis: "praxe", issuedDaysAgo: 700 },
      { skill: "software", basis: "kurz", issuedDaysAgo: 240 },
    ],
  },
  {
    seq: 9006,
    secret: "TEST9006",
    name: "Eva Procházková (TEST)",
    email: "eva.prochazkova@test.ckpd.cz",
    tier: "zakladni",
    region: "Královéhradecký kraj",
    profile: "snímkování porostů pro zemědělce",
    focus: ["Zemědělství"],
    memberSinceDaysAgo: 300,
    credentials: [
      { skill: "zemedelstvi", basis: "portfolio", issuedDaysAgo: 250 },
    ],
  },
  {
    seq: 9007,
    secret: "TEST9007",
    name: "Pavel Kučera (TEST)",
    email: "pavel.kucera@test.ckpd.cz",
    tier: "pro",
    region: "Ústecký kraj",
    profile: "3D modely průmyslových areálů",
    focus: ["Geodézie a mapování", "Inspekce a energetika"],
    memberSinceDaysAgo: 530,
    credentials: [
      { skill: "fotogrametrie", basis: "zkouska", issuedDaysAgo: 420 },
      { skill: "software", basis: "zkouska", issuedDaysAgo: 400 },
    ],
  },
  {
    seq: 9008,
    secret: "TEST9008",
    name: "Jana Veselá (TEST)",
    email: "jana.vesela@test.ckpd.cz",
    tier: "zakladni",
    region: "Jihočeský kraj",
    profile: "dokumentace staveb pro projektanty",
    focus: ["Stavebnictví", "Foto a video"],
    memberSinceDaysAgo: 150,
    credentials: [
      { skill: "foto", basis: "kurz", issuedDaysAgo: 120 },
      { skill: "fotogrametrie", basis: "kurz", issuedDaysAgo: 90 },
    ],
  },
  {
    seq: 9009,
    secret: "TEST9009",
    name: "Ondřej Horák (TEST)",
    email: "ondrej.horak@test.ckpd.cz",
    tier: "pro",
    region: "Zlínský kraj",
    profile: "termovizní měření budov a rozvoden",
    focus: ["Inspekce a energetika"],
    memberSinceDaysAgo: 365,
    credentials: [{ skill: "termovize", basis: "zkouska", issuedDaysAgo: 340 }],
  },
  {
    seq: 9010,
    secret: "TESTA010",
    name: "Markéta Pospíšilová (TEST)",
    email: "marketa.pospisilova@test.ckpd.cz",
    tier: "zakladni",
    region: "Olomoucký kraj",
    profile: "video pro cestovní ruch",
    focus: ["Foto a video", "Vzdělávání a výcvik"],
    memberSinceDaysAgo: 60,
    credentials: [
      { skill: "video", basis: "portfolio", issuedDaysAgo: 40 },
      { skill: "foto", basis: "portfolio", issuedDaysAgo: 40 },
    ],
  },
];
