import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/ui/Cta";
import { E } from "@/components/editor/EditableText";

/** Tmavá CTA plocha (PRD § 4.10): jedno tvrzení + jedno tlačítko. */
export function CtaBlock() {
  return (
    <section className="bg-deep">
      <Container className="py-16 text-center sm:py-20">
        <p className="mx-auto max-w-2xl font-serif text-[26px] font-medium leading-snug text-paper sm:text-[34px]">
          <E k="home.cta.statement">Létáme každý sám. Jednáme společně.</E>
        </p>
        <div className="mt-8">
          <Cta href="/clenstvi" variant="onDark">
            <E k="home.cta.button" editable={false}>
              Přidej se
            </E>
          </Cta>
        </div>
      </Container>
    </section>
  );
}
