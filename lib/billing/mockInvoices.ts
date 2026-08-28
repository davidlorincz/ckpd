import { formatPrice, priceOf, type MembershipTier } from "@/lib/membership";

/**
 * Mock historie plateb. Odvozuje se z data vzniku členství a varianty —
 * žádná tabulka, protože doklady bude cílově vydávat účetní systém
 * (Fakturoid) a tahle vrstva se pak celá vymění pod stejnou komponentou.
 */
export type MockInvoice = {
  id: string;
  number: string;
  issuedAt: number;
  periodFrom: number;
  periodTo: number;
  amount: number;
  status: "paid" | "open";
};

function addMonths(ts: number, months: number): number {
  const d = new Date(ts);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

export function mockInvoices(
  memberSince: number | undefined,
  tier: MembershipTier | undefined,
  now = Date.now(),
): MockInvoice[] {
  if (!memberSince || !tier) return [];

  const amount = priceOf(tier);
  const invoices: MockInvoice[] = [];

  for (let i = 0; ; i++) {
    const from = addMonths(memberSince, i);
    if (from > now) break;

    const year = new Date(from).getFullYear();
    invoices.push({
      id: `mock-${i}`,
      number: `${year}${String(i + 1).padStart(4, "0")}`,
      issuedAt: from,
      periodFrom: from,
      periodTo: addMonths(memberSince, i + 1),
      amount,
      status: "paid",
    });

    if (i > 60) break; // pojistka proti nekonečné smyčce u rozbitého data
  }

  return invoices.reverse();
}

export { formatPrice };
