import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { E } from "@/components/editor/EditableText";
import {
  IconExam,
  IconInstitution,
  IconMeasure,
  IconStandard,
} from "@/components/ui/icons";

const pillars = [
  {
    key: "merime",
    icon: IconMeasure,
    title: "Měříme",
    text: "Sbíráme data o provozu a incidentech a publikujeme Zprávu o stavu DRONového provozu v ČR. S úřady mluvíme s čísly v ruce, ne s dojmy.",
  },
  {
    key: "zastupujeme",
    icon: IconInstitution,
    title: "Zastupujeme",
    text: "Připomínkujeme legislativu a jednáme s ÚCL a Ministerstvem dopravy ČR. Dáváme pilotům a provozovatelům hlas, který má u úřadů váhu.",
  },
  {
    key: "standardizujeme",
    icon: IconStandard,
    title: "Standardizujeme",
    text: "Vydáváme etický kodex, doporučené provozní postupy a vzorové dokumenty (SORA/OSO). Aby dobrá praxe nebyla know-how pár firem, ale standard oboru.",
  },
  {
    key: "certifikujeme",
    icon: IconExam,
    title: "Certifikujeme",
    text: "Certifikujeme skutečné dovednosti — foto, video, fotogrametrii, termovizi, zemědělství a práci se softwarem. Zkouška se skládá osobně ve školicím středisku, ne proklikem na internetu.",
  },
] as const;

/**
 * Čtyři pilíře ve dvou sloupcích s číslováním jako v technické dokumentaci.
 *
 * POZOR — čtyři sloupce vedle sebe nejdou. Rapid Variable Extended je
 * extrémně široký a jednoslovné nadpisy se nelámou: „Standardizujeme"
 * potřebuje 353 px, ale sloupec ve `grid-cols-4` má na 1280 px jen 248 px,
 * takže text přeteče přes sousední sloupec. Dva sloupce dávají ~528 px
 * a problém je fyzicky vyloučený i pro delší názvy.
 */
export function Pillars() {
  return (
    <section id="co-delame" className="border-b border-hairline">
      <Container className="py-20 sm:py-28">
        <h2 className="text-[26px] sm:text-[34px]">
          <E k="home.pillars.title">Co děláme</E>
        </h2>

        <div className="mt-12 grid gap-x-12 gap-y-14 md:grid-cols-2 lg:gap-x-20">
          {pillars.map((p, i) => (
            <Reveal key={p.key} delay={i * 60}>
              {/* číslo a ikona v hlavičce, nadpis pak dostane plnou šířku
                  sloupce — jinak by se dlouhé jednoslovné názvy nevešly */}
              <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
                <span
                  aria-hidden
                  className="tnum font-serif text-[30px] font-normal leading-none text-brass-2"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p.icon className="h-10 w-10 shrink-0 text-deep" />
              </div>
              <h3 className="mt-6 text-[19px] sm:text-[22px] lg:text-[26px]">
                <E k={`home.pillars.${p.key}.title`}>{p.title}</E>
              </h3>
              <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
                <E k={`home.pillars.${p.key}.text`}>{p.text}</E>
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
