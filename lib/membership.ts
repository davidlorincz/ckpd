import { membershipTiers } from "@/lib/site";

/** Stav členství — zrcadlí `statusValidator` v convex/schema.ts. */
export type MembershipStatus =
  | "none"
  | "pending"
  | "active"
  | "past_due"
  | "canceled";

export type MembershipTier = "zakladni" | "pro" | "cestne";

/**
 * Jak se stav zobrazuje. Barvy jdou výhradně ze sémantických tokenů
 * (app/globals.css) — žádné nové odstíny.
 */
export const statusPresentation: Record<
  MembershipStatus,
  {
    label: string;
    /** Krátké vysvětlení pod štítkem. `{date}` nahradí datum konce období. */
    note: string;
    badge: string;
    card: string;
    dot: string;
  }
> = {
  none: {
    label: "Neaktivní",
    note: "Účet máš založený, členství zatím ne.",
    badge: "bg-paper-2 text-ink-2 border border-hairline",
    card: "border-hairline bg-paper-2",
    dot: "bg-ink-2/40",
  },
  pending: {
    label: "Čeká na platbu",
    note: "Platbu jsme zaznamenali, čekáme na potvrzení od brány.",
    badge: "bg-brass-2 text-deep border border-brass",
    card: "border-brass bg-paper",
    dot: "bg-brass animate-pulse",
  },
  active: {
    label: "Aktivní",
    note: "Členství platí do {date}.",
    badge: "bg-action text-white",
    card: "border-hairline border-l-2 border-l-action bg-paper",
    dot: "bg-action",
  },
  past_due: {
    label: "Platba selhala",
    note: "Kartu se nepodařilo zatížit. Členství běží do {date}.",
    badge: "bg-destructive text-white",
    card: "border-destructive bg-paper",
    dot: "bg-destructive",
  },
  canceled: {
    label: "Ukončené",
    note: "Členství skončilo {date}.",
    badge: "bg-paper-2 text-ink-2 border border-hairline",
    card: "border-hairline bg-paper-2",
    dot: "bg-ink-2/40",
  },
};

export const tierLabels: Record<MembershipTier, string> = {
  zakladni: "Základní",
  pro: "PRO",
  cestne: "Čestné",
};

/** Placené varianty z ceníku (`lib/site.ts` je zdroj pravdy pro ceny). */
export const payableTiers = membershipTiers;

/** Cena varianty v haléřích — pro budoucí Stripe i pro mock bránu. */
export function priceOf(tier: MembershipTier): number {
  const found = membershipTiers.find((t) => t.key === tier);
  if (!found) return 0;
  return Number(found.price.replace(/\D/g, "")) * 100;
}

export function formatPrice(minorUnits: number): string {
  return `${(minorUnits / 100).toLocaleString("cs-CZ")} Kč`;
}

export function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Text stavu s doplněným datem. */
export function statusNote(
  status: MembershipStatus,
  periodEnd?: number,
): string {
  return statusPresentation[status].note.replace(
    "{date}",
    formatDate(periodEnd),
  );
}

/** Členství, které právě teď opravňuje k výhodám. */
export function isActive(
  status: MembershipStatus,
  currentPeriodEnd?: number,
): boolean {
  if (status !== "active") return false;
  return !currentPeriodEnd || currentPeriodEnd > Date.now();
}
