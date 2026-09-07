/**
 * Číselník dovedností, které komora certifikuje.
 *
 * Žije v `convex/lib/`, protože ho potřebují obě strany: backend při vydání
 * (validace oboru, výpočet platnosti, popisek do snapshotu) i web (odznaky,
 * výběr v administraci, veřejný výpis na /overit). Web ho bere přes tenký
 * re-export v `lib/skills.ts` — opačný směr by nefungoval, Convex funkce
 * neumí importovat z `@/lib`.
 *
 * Soubor nesmí importovat z `convex/_generated` — testy (`tests/*.test.mts`)
 * ho načítají přímo přes nativní type-stripping Nodu.
 */

export type SkillKey =
  | "foto"
  | "video"
  | "fotogrametrie"
  | "termovize"
  | "zemedelstvi"
  | "software";

export type SkillDef = {
  key: SkillKey;
  /** Plný název do dokladu a na stránku ověření. */
  label: string;
  /** Krátký tvar do odznaku ve výpisu členů. */
  short: string;
  /** Platnost v letech. Rozsah 3–5 podle rychlosti změn v oboru. */
  validityYears: 3 | 4 | 5;
  /** Co komora u té dovednosti posuzuje. */
  scope: string;
};

export const SKILLS: readonly SkillDef[] = [
  {
    key: "foto",
    label: "Letecká fotografie",
    short: "Foto",
    validityYears: 5,
    scope: "Kompozice, expozice a bezpečné vedení letu při fotografování.",
  },
  {
    key: "video",
    label: "Letecké video",
    short: "Video",
    validityYears: 5,
    scope: "Plynulost letu, práce s kamerou a příprava natáčecího dne.",
  },
  {
    key: "fotogrametrie",
    label: "Fotogrametrie a 3D mapování",
    short: "Fotogrametrie",
    validityYears: 3,
    scope: "Plánování náletu, překryvy, vlícovací body a kontrola přesnosti.",
  },
  {
    key: "termovize",
    label: "Termovizní měření",
    short: "Termovize",
    validityYears: 3,
    scope: "Nastavení emisivity, vliv počasí a čtení termogramu bez dohadů.",
  },
  {
    key: "zemedelstvi",
    label: "Zemědělské aplikace",
    short: "Zemědělství",
    validityYears: 3,
    scope: "Snímkování porostů, indexy a pravidla pro práci nad pozemky.",
  },
  {
    key: "software",
    label: "Práce se softwarem",
    short: "Software",
    validityYears: 4,
    scope: "Zpracování dat, výstupy pro zadavatele a správa projektu.",
  },
] as const;

/** Kolik dní předem se certifikace hlásí jako „končí platnost". */
export const EXPIRING_SOON_DAYS = 90;

/** „3 roky" / „5 let" — čeština u platnosti nesmí drhnout. */
export function validityLabel(years: number): string {
  if (years === 1) return "1 rok";
  if (years >= 2 && years <= 4) return `${years} roky`;
  return `${years} let`;
}

export function skillByKey(key: string): SkillDef | undefined {
  return SKILLS.find((s) => s.key === key);
}

/** Popisek oboru; u neznámého klíče vrátí klíč, ať UI nespadne. */
export function skillLabel(key: string): string {
  return skillByKey(key)?.label ?? key;
}

/**
 * Datum konce platnosti. Počítá se v UTC a 29. února se posouvá na 28. 2. —
 * `setUTCFullYear` by z něj jinak udělal 1. březen a certifikace by tiše
 * platilo o den déle.
 */
export function validUntilFor(issuedAt: number, years: number): number {
  const d = new Date(issuedAt);
  const day = d.getUTCDate();
  const month = d.getUTCMonth();
  const target = new Date(
    Date.UTC(
      d.getUTCFullYear() + years,
      month,
      day,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  );
  // přetekl měsíc (29. 2. → 1. 3.)? vrať se na poslední den cílového měsíce
  if (target.getUTCMonth() !== month) target.setUTCDate(0);
  return target.getTime();
}

export type CredentialState = "valid" | "expiring" | "expired" | "revoked";

/**
 * Stav se počítá ze `validUntil` a `revokedAt` při každém čtení — nikdy se
 * neukládá. Denormalizovaný stav by potřeboval cron a mezi jeho běhy by
 * vypršelá certifikace chvíli platila dál.
 */
export function credentialState(
  row: { validUntil: number; revokedAt?: number },
  now: number,
): CredentialState {
  if (row.revokedAt !== undefined) return "revoked";
  if (now > row.validUntil) return "expired";
  if (row.validUntil - now <= EXPIRING_SOON_DAYS * 86_400_000) {
    return "expiring";
  }
  return "valid";
}
