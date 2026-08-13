import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/ui/Cta";
import { Seal } from "@/components/ui/Seal";

/**
 * Typografický hero na papírovém podkladu s jemným rastrem a vodoznakem
 * pečeti. Bez fotografie (PRD § 4.3).
 */
export function Hero() {
  return (
    <section className="paper-grid relative overflow-hidden border-b border-hairline">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 opacity-[0.05] lg:block"
      >
        <Seal decorative className="h-[540px] w-[540px]" />
      </div>
      <Container className="relative py-20 sm:py-28">
        <h1 className="max-w-3xl text-[34px] leading-[1.05] sm:text-[56px]">
          Zastupujeme piloty DRONů v&nbsp;České republice.
        </h1>
        <p className="measure mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
          Dobrovolný profesní spolek pilotů a provozovatelů bezpilotních
          systémů. Propojujeme piloty, odborníky a stát, aby regulace držela
          krok s technologií — a létat šlo bezpečně, legálně a co
          nejdostupněji.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Cta href="/clenstvi">Stát se členem</Cta>
          <Cta href="/kontakt" variant="secondary">
            Pro úřady a média
          </Cta>
        </div>
      </Container>
    </section>
  );
}
