import { Container } from "@/components/ui/Container";
import { Stat } from "@/components/ui/Stat";
import { SHOW_STATS, stats } from "@/lib/flags";

/**
 * Číselný pás (PRD § 4.4). Řízeno flagem SHOW_STATS — zobrazovat výhradně
 * reálná čísla, jinak sekci vůbec nerenderovat.
 */
export function StatBand() {
  if (!SHOW_STATS) return null;

  return (
    <section className="border-b border-hairline bg-paper-2">
      <Container className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <Stat key={s.label} value={s.value} label={s.label} note={"note" in s ? s.note : undefined} />
        ))}
      </Container>
    </section>
  );
}
