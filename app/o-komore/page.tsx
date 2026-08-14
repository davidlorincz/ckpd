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
              nebo u záchranných složek. Komora vznikla, aby tenhle rostoucí
              obor měl společný hlas: aby u tvorby pravidel, která jeho provoz
              určují, seděl ten, kdo skutečně létá. Společný hlas prosadí to,
              na co je jednotlivec sám krátký.
            </p>
            <p>
              Sdružujeme jednotlivé piloty i firmy a jednáme za ně s Úřadem pro
              civilní letectví, Ministerstvem dopravy ČR a dalšími institucemi.
              Jsme profesní organizace, která staví na datech: sbíráme
              informace o reálném provozu, incidentech a potřebách oboru a
              publikujeme je ve Zprávě o stavu DRONového provozu v ČR.
            </p>
            <p>
              Chceme, aby regulace držela krok s technologií. Propojujeme
              piloty, odborníky a stát a zvyšujeme odbornost i odpovědnost
              pilotů — aby bezpilotní systémy mohly být provozovány bezpečně,
              legálně a co nejdostupněji. Proto vedle zastupování kultivujeme
              obor zevnitř: vydáváme etický kodex, doporučené provozní postupy
              a vzorové dokumenty, které zvednou úroveň běžné praxe.
              Důvěryhodný obor, který úřady znají, si vyjedná lepší podmínky.
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            Jak se dělíme o role s úřadem
          </h2>
          <p className="measure mt-6 text-[16.5px] leading-relaxed text-ink-2">
            Bezpilotní letectví stojí na dvou pilířích, které se doplňují.
            Stát určuje pravidla — obor je naplňuje životem. Každý dělá to,
            co umí nejlíp:
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="border border-hairline bg-paper p-6 sm:p-7">
              <h3 className="text-[19px]">Úřad pro civilní letectví</h3>
              <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink-2">
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-hairline" />
                  určuje podmínky provozu bezpilotních systémů
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-hairline" />
                  vydává doklady pilotů a vede úřední evidenci provozovatelů
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-hairline" />
                  vykonává dozor nad provozem
                </li>
              </ul>
            </div>
            <div className="border border-hairline bg-paper p-6 sm:p-7">
              <h3 className="text-[19px]">Komora</h3>
              <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink-2">
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  dává oboru hlas při tvorbě a připomínkování pravidel
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  rozvíjí standardy, dobrou praxi a vzorové dokumenty
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  sbírá data o reálném provozu a zpřístupňuje je
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  propojuje piloty, firmy a odborníky a přináší členům výhody
                </li>
              </ul>
            </div>
          </div>
          <div className="measure mt-8 space-y-4 text-[16.5px] leading-relaxed text-ink-2">
            <p>
              Členství v komoře je dobrovolné — létat můžeš i bez něj. S námi
              ale má tvůj hlas váhu a obor partnera, který za něj jedná.
            </p>
            <p>
              Komora je místo, kde se obor domlouvá na společných zájmech a
              standardech. Výhody, které členům poskytují partneři komory,
              jsou jejich dobrovolným plněním — stanoviska komory vznikají
              nezávisle a bez provizí.
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
                  která při práci s tisíci pilotů viděla, jak moc oboru pomůže
                  zastoupení u úřadů, a rozhodla se ho pomoct založit.
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
