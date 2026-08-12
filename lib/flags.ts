/**
 * Feature flagy dle PRD.
 *
 * SHOW_STATS  — číselný pás na hlavní stránce. Zapnout až s reálnými čísly;
 *               nikdy nezobrazovat smyšlená (PRD § 4.4).
 * SHOW_BODIES — sekce Orgány komory. Zapnout až po obsazení Rady a Revizní
 *               komise; bez ní je launch blokovaný (PRD § 4.7).
 */
export const SHOW_STATS = false;
export const SHOW_BODIES = false;

/** Reálná čísla doplnit před zapnutím SHOW_STATS. */
export const stats = [
  { value: 0, label: "členů celkem" },
  { value: 0, label: "firemních členů" },
  { value: 0, label: "hodin nalétáno členy", note: "self-reported" },
  { value: 0, label: "stanovisek k legislativě" },
] as const;
