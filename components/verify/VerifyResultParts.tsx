/** Sdílené kousky výsledkových stránek ověření — ať nejsou třikrát opsané. */

export function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-hairline py-3 last:border-b-0">
      <dt className="text-[15px] text-ink-2">{label}</dt>
      <dd className="text-[15px] font-medium text-ink">{value}</dd>
    </div>
  );
}

export const czDate = (ms: number) =>
  new Date(ms).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/** ISO „2031-04-03" z Convexu → české datum. */
export const czDay = (iso: string) => czDate(Date.parse(iso));

export const basisLabels: Record<string, string> = {
  zkouska: "Zkouška ve školicím středisku",
  portfolio: "Doložené portfolio",
  kurz: "Absolvovaný kurz",
  praxe: "Doložená praxe",
};
