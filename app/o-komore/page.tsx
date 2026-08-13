import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentLink } from "@/components/ui/DocumentLink";
import { Bodies } from "@/components/sections/Bodies";
import { CtaBlock } from "@/components/sections/CtaBlock";
import { org } from "@/lib/site";

export const metadata: Metadata = {
  title: "O komoře",
  description:
    "Poslání, orgány a dokumenty České komory pilotů DRONů — dobrovolného profesního spolku pilotů a provozovatelů bezpilotních systémů.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="O komoře"
        lead="Dobrovolný profesní spolek, který dává pilotům a provozovatelům bezpilotních systémů v České republice společný hlas."
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Poslání</h2>
          <div className="measure mt-6 space-y-5 text-[16.5px] leading-relaxed text-ink-2">
            <p>
              V České republice létají tisíce pilotů DRONů — od hobby letců po
              profesionální provozovatele v energetice, geodézii, zemědělství
              nebo u záchranných složek. Legislativa, která jejich provoz
              určuje, ale vzniká převážně bez nich. Jednotlivec, který chce
              připomínkovat vyhlášku nebo evropské nařízení, nemá reálnou šanci
              být slyšet. Komora vznikla proto, aby tento hlas existoval.
            </p>
            <p>
              Sdružujeme jednotlivé piloty i firmy a jednáme za ně s Úřadem pro
              civilní letectví, Ministerstvem dopravy ČR a dalšími institucemi.
              Nejsme spolek nadšenců ani zájmová skupina jedné firmy — jsme
              profesní organizace, která staví na datech: sbíráme informace o
              reálném provozu, incidentech a potřebách oboru a publikujeme je
              ve Zprávě o stavu DRONového provozu v ČR.
            </p>
            <p>
              Chceme, aby regulace držela krok s technologií. Propojujeme
              piloty, odborníky a stát a zvyšujeme odbornost i odpovědnost
              pilotů — aby bezpilotní systémy mohly být provozovány bezpečně,
              legálně a co nejdostupněji. Proto vedle zastupování kultivujeme
              obor zevnitř: vydáváme etický kodex, doporučené provozní postupy
              a vzorové dokumenty, které zvednou úroveň běžné praxe.
              Důvěryhodný obor si nakonec vyjedná lepší podmínky než obor, o
              kterém úřady nic nevědí.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Čemu se nevěnujeme</h2>
          <div className="measure mt-6 space-y-4 text-[16.5px] leading-relaxed text-ink-2">
            <p>
              Nejsme úřad a nechceme ho suplovat.{" "}
              <strong className="text-ink">
                Nevydáváme průkazy způsobilosti ani osvědčení, nezkoušíme
                piloty a nevedeme žádnou úřední evidenci provozovatelů.
              </strong>{" "}
              To vše je role Úřadu pro civilní letectví a členství v komoře na
              tom nic nemění — není podmínkou provozu bezpilotního systému a
              žádnou výhodu u úřadů samo o sobě nezakládá.
            </p>
            <p>
              Neprodáváme techniku a nejsme odbytový kanál žádného prodejce.
              Výhody, které členům poskytují partneři komory, jsou jejich
              dobrovolným plněním — komora z nich nemá provize a její
              stanoviska si nikdo nekupuje. Komora je místo, kde se obor
              domlouvá na společných zájmech a standardech.
            </p>
          </div>
        </Container>
      </section>

      <Bodies detailed />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-[26px] sm:text-[34px]">Dokumenty</h2>
              <div className="mt-6">
                <DocumentLink href="/eticky-kodex" label="Etický kodex" />
                <DocumentLink
                  href={org.registryUrl}
                  label="Výpis ze spolkového rejstříku"
                  external
                />
                <DocumentLink
                  href="/ochrana-osobnich-udaju"
                  label="Zásady ochrany osobních údajů"
                />
              </div>
              <p className="mt-4 text-[14px] text-ink-2">
                Stanovy v PDF a výroční zprávu zveřejníme zde a ve sbírce
                listin spolkového rejstříku.
              </p>
            </div>
            <div>
              <h2 className="text-[26px] sm:text-[34px]">
                Kdo nás založil a proč
              </h2>
              <div className="measure mt-6 space-y-4 text-[16.5px] leading-relaxed text-ink-2">
                <p>
                  Komora byla zapsána 8. května 2026 u Městského soudu v Praze.
                  Zakládajícím členem a sponzorem je DRONPRO s.r.o. — firma,
                  která při práci s tisíci pilotů narážela na to, že obor nemá
                  u úřadů žádné zastoupení.
                </p>
                <p>
                  Právě proto je komora postavena tak, aby na jedné firmě
                  nestála: má vlastní orgány, vlastní hospodaření a přijímá i
                  konkurenční firmy. Konflikt zájmů řešíme tím, že ho
                  přiznáváme — a oddělujeme role.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <CtaBlock />
    </>
  );
}
