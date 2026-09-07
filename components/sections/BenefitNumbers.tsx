import { benefitHeadline, benefitHighlights } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

/**
 * Čísla, kterými se členství prodává (bod 13 zadání). Úplný výčet výhod
 * zůstává v tabulce na /clenstvi — tohle je důvod zaplatit, ne inventura.
 *
 * Hodnoty jsou stringy („5 % / 10 %“), takže se nedá použít `ui/Stat`.
 */
export function BenefitNumbers({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-8 border-y border-hairline py-8 sm:grid-cols-2 lg:grid-cols-4">
        {benefitHighlights.map((h) => (
          <div key={h.label}>
            <p className="tnum whitespace-nowrap font-serif text-[28px] font-bold leading-none text-brass sm:text-[34px]">
              {h.value}
            </p>
            <p className="mt-2 text-[15px] leading-snug text-ink">{h.label}</p>
            <p className="mt-1 text-[13.5px] leading-snug text-ink-2">
              {h.note}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] text-ink-2">
        <E k="home.benefitNumbers.headline">{benefitHeadline}</E>
      </p>
    </div>
  );
}
