import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { E } from "@/components/editor/EditableText";
import {
  IconInstitution,
  IconMeasure,
  IconStandard,
} from "@/components/ui/icons";

const pillars = [
  {
    icon: IconInstitution,
    title: "Zastupujeme",
    text: "Připomínkujeme legislativu a jednáme s ÚCL a Ministerstvem dopravy ČR. Dáváme pilotům a provozovatelům hlas, který má u úřadů váhu.",
  },
  {
    icon: IconStandard,
    title: "Standardizujeme",
    text: "Vydáváme etický kodex, doporučené provozní postupy a vzorové dokumenty (SORA/OSO). Aby dobrá praxe nebyla know-how pár firem, ale standard oboru.",
  },
  {
    icon: IconMeasure,
    title: "Měříme",
    text: "Sbíráme data o provozu a incidentech a publikujeme Zprávu o stavu DRONového provozu v ČR. S úřady mluvíme s čísly v ruce, ne s dojmy.",
  },
] as const;

export function Pillars() {
  return (
    <section className="border-b border-hairline">
      <Container className="py-16 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">
          <E k="home.pillars.title">Co děláme</E>
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          {pillars.map((p, i) => (
            <Reveal key={p.title}>
              <p.icon className="h-11 w-11 text-deep" />
              <h3 className="mt-5 text-[22px]">
                <E k={`home.pillars.${i}.title`}>{p.title}</E>
              </h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
                <E k={`home.pillars.${i}.text`}>{p.text}</E>
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
