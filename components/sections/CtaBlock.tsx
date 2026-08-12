import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/ui/Cta";

/** Tmavá CTA plocha (PRD § 4.10): jedno tvrzení + jedno tlačítko. */
export function CtaBlock() {
  return (
    <section className="bg-deep">
      <Container className="py-16 text-center sm:py-20">
        <p className="mx-auto max-w-2xl font-serif text-[26px] font-medium leading-snug text-paper sm:text-[34px]">
          Čím víc nás je, tím víc to platí.
        </p>
        <div className="mt-8">
          <Cta href="/clenstvi" variant="onDark">
            Přidej se
          </Cta>
        </div>
      </Container>
    </section>
  );
}
