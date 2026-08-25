import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/ui/Cta";
import { Seal } from "@/components/ui/Seal";
import { HeroDrones } from "@/components/sections/HeroDrones";
import { E } from "@/components/editor/EditableText";

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
      <HeroDrones />
      <Container className="relative py-20 sm:py-28">
        {/* rámeček = místo transformace chaosu v řád; drony do něj vlétávají */}
        <div
          data-hero-title
          className="inline-block max-w-full border-2 border-brass px-4 py-4 sm:max-w-3xl sm:px-8 sm:py-6"
        >
          {/* clamp: nejdelší slovo titulku se musí vejít i na úzký mobil */}
          <h1 className="text-[clamp(20px,6.6vw,34px)] leading-[1.05] sm:text-[56px]">
            <E k="home.hero.title">Česká komora pilotů DRONů</E>
          </h1>
        </div>
        <p className="measure mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2 sm:text-[19px]">
          <E k="home.hero.lead">
            Dobrovolný profesní spolek pilotů a provozovatelů bezpilotních
            systémů. Propojujeme piloty, odborníky a stát, aby regulace držela
            krok s technologií — a létat šlo bezpečně, legálně a co
            nejdostupněji.
          </E>
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Cta href="/clenstvi" variant="conversion">
            <E k="home.hero.ctaPrimary" editable={false}>
              Stát se členem
            </E>
          </Cta>
          <Cta href="/kontakt" variant="secondary">
            <E k="home.hero.ctaSecondary" editable={false}>
              Pro úřady a média
            </E>
          </Cta>
        </div>
      </Container>
    </section>
  );
}
