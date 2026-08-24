import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentLink } from "@/components/ui/DocumentLink";
import { Bodies } from "@/components/sections/Bodies";
import { CtaBlock } from "@/components/sections/CtaBlock";
import { org } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "O komoře",
  description:
    "Poslání, orgány a dokumenty České komory pilotů DRONů — dobrovolného profesního spolku pilotů a provozovatelů bezpilotních systémů.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title={<E k="oKomore.header.title">O komoře</E>}
        lead={
          <E k="oKomore.header.lead">
            Dobrovolný profesní spolek, který dává pilotům a provozovatelům
            bezpilotních systémů v České republice společný hlas.
          </E>
        }
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="oKomore.mise.title">Poslání</E>
          </h2>
          <div className="measure mt-6 space-y-5 text-[16.5px] leading-relaxed text-ink-2">
            <p>
              <E k="oKomore.mise.p1">
                V České republice létají tisíce pilotů DRONů — od hobby letců
                po profesionální provozovatele v energetice, geodézii,
                zemědělství nebo u záchranných složek. Komora vznikla, aby
                tenhle rostoucí obor měl společný hlas: aby u tvorby pravidel,
                která jeho provoz určují, seděl ten, kdo skutečně létá.
                Společný hlas prosadí to, na co je jednotlivec sám krátký.
              </E>
            </p>
            <p>
              <E k="oKomore.mise.p2">
                Sdružujeme jednotlivé piloty i firmy a jednáme za ně s Úřadem
                pro civilní letectví, Ministerstvem dopravy ČR a dalšími
                institucemi. Jsme profesní organizace, která staví na datech:
                sbíráme informace o reálném provozu, incidentech a potřebách
                oboru a publikujeme je ve Zprávě o stavu DRONového provozu v
                ČR.
              </E>
            </p>
            <p>
              <E k="oKomore.mise.p3">
                Chceme, aby regulace držela krok s technologií. Propojujeme
                piloty, odborníky a stát a zvyšujeme odbornost i odpovědnost
                pilotů — aby bezpilotní systémy mohly být provozovány
                bezpečně, legálně a co nejdostupněji. Proto vedle zastupování
                kultivujeme obor zevnitř: vydáváme etický kodex, doporučené
                provozní postupy a vzorové dokumenty, které zvednou úroveň
                běžné praxe. Důvěryhodný obor, který úřady znají, si vyjedná
                lepší podmínky.
              </E>
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="oKomore.role.title">Jak se dělíme o role s úřadem</E>
          </h2>
          <p className="measure mt-6 text-[16.5px] leading-relaxed text-ink-2">
            <E k="oKomore.role.intro">
              Bezpilotní letectví stojí na dvou pilířích, které se doplňují.
              Stát určuje pravidla — obor je naplňuje životem. Každý dělá to,
              co umí nejlíp:
            </E>
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="border border-hairline bg-paper p-6 sm:p-7">
              <h3 className="text-[19px]">
                <E k="oKomore.role.urad.title">Úřad pro civilní letectví</E>
              </h3>
              <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink-2">
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-hairline" />
                  <E k="oKomore.role.urad.items.0">
                    určuje podmínky provozu bezpilotních systémů
                  </E>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-hairline" />
                  <E k="oKomore.role.urad.items.1">
                    vydává doklady pilotů a vede úřední evidenci provozovatelů
                  </E>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-hairline" />
                  <E k="oKomore.role.urad.items.2">
                    vykonává dozor nad provozem
                  </E>
                </li>
              </ul>
            </div>
            <div className="border border-hairline bg-paper p-6 sm:p-7">
              <h3 className="text-[19px]">
                <E k="oKomore.role.komora.title">Komora</E>
              </h3>
              <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-ink-2">
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  <E k="oKomore.role.komora.items.0">
                    dává oboru hlas při tvorbě a připomínkování pravidel
                  </E>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  <E k="oKomore.role.komora.items.1">
                    rozvíjí standardy, dobrou praxi a vzorové dokumenty
                  </E>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  <E k="oKomore.role.komora.items.2">
                    sbírá data o reálném provozu a zpřístupňuje je
                  </E>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                  <E k="oKomore.role.komora.items.3">
                    propojuje piloty, firmy a odborníky a přináší členům výhody
                  </E>
                </li>
              </ul>
            </div>
          </div>
          <div className="measure mt-8 space-y-4 text-[16.5px] leading-relaxed text-ink-2">
            <p>
              <E k="oKomore.role.outro1">
                Členství v komoře je dobrovolné — létat můžeš i bez něj. S
                námi ale má tvůj hlas váhu a obor partnera, který za něj
                jedná.
              </E>
            </p>
            <p>
              <E k="oKomore.role.outro2">
                Komora je místo, kde se obor domlouvá na společných zájmech a
                standardech. Výhody, které členům poskytují partneři komory,
                jsou jejich dobrovolným plněním — stanoviska komory vznikají
                nezávisle a bez provizí.
              </E>
            </p>
          </div>
        </Container>
      </section>

      <Bodies detailed />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-[26px] sm:text-[34px]">
                <E k="oKomore.dokumenty.title">Dokumenty</E>
              </h2>
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
                <E k="oKomore.dokumenty.note">
                  Stanovy v PDF a výroční zprávu zveřejníme zde a ve sbírce
                  listin spolkového rejstříku.
                </E>
              </p>
            </div>
            <div>
              <h2 className="text-[26px] sm:text-[34px]">
                <E k="oKomore.zalozeni.title">Kdo nás založil a proč</E>
              </h2>
              <div className="measure mt-6 space-y-4 text-[16.5px] leading-relaxed text-ink-2">
                <p>
                  <E k="oKomore.zalozeni.p1">
                    Komora byla zapsána 8. května 2026 u Městského soudu v
                    Praze. Zakládajícím členem a sponzorem je DRONPRO s.r.o. —
                    firma, která při práci s tisíci pilotů viděla, jak moc
                    oboru pomůže zastoupení u úřadů, a rozhodla se ho pomoct
                    založit.
                  </E>
                </p>
                <p>
                  <E k="oKomore.zalozeni.p2">
                    Právě proto je komora postavena tak, aby na jedné firmě
                    nestála: má vlastní orgány, vlastní hospodaření a přijímá
                    i konkurenční firmy. Konflikt zájmů řešíme tím, že ho
                    přiznáváme — a oddělujeme role.
                  </E>
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
