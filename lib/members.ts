/**
 * Veřejný seznam členů. Uvádět VÝHRADNĚ členy, kteří v přihlášce (nebo
 * později) udělili souhlas se zveřejněním — souhlas je v evidenci členů.
 * Po zprovoznění Airtable nahradit načítáním z evidence.
 */
export type Member = {
  /** jméno a příjmení, nebo název firmy */
  name: string;
  /** "zakladni" | "pro" | "cestny" */
  tier: "zakladni" | "pro" | "cestny";
  region?: string;
  /** volitelný jednořádkový profil, např. „inspekce fotovoltaik, Brno" */
  profile?: string;
  /** ISO datum vzniku členství */
  since?: string;
};

export const members: Member[] = [
  // { name: "…", tier: "pro", region: "Jihomoravský kraj", since: "2026-09-01" },
];
