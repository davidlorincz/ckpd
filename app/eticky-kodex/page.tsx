import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Etický kodex",
  description:
    "Etický kodex České komory pilotů DRONů — zásady, ke kterým se členové komory hlásí.",
};

const sections = [
  {
    title: "1. Bezpečnost především",
    items: [
      "Člen létá tak, aby nikdy neohrozil osoby, majetek ani ostatní provoz ve vzdušném prostoru.",
      "Před letem se seznámí s pravidly platnými pro dané místo a situaci a dodržuje je i tehdy, když se to nehodí.",
      "Nelétá pod vlivem alkoholu nebo jiných látek snižujících pozornost a nelétá s technikou, o jejímž stavu má pochybnosti.",
    ],
  },
  {
    title: "2. Respekt k soukromí",
    items: [
      "Člen nesnímá osoby a soukromé prostory bez právního důvodu a zbytečně nezasahuje do soukromí druhých.",
      "Se záznamy z letů nakládá odpovědně a v souladu s pravidly ochrany osobních údajů.",
    ],
  },
  {
    title: "3. Poctivost v podnikání",
    items: [
      "Člen nenabízí služby, pro které nemá odpovídající vybavení, zkušenost ani splněné zákonné podmínky.",
      "Vůči klientům jedná transparentně: neslibuje, co provoz neumožňuje, a nezamlčuje omezení.",
      "Nekonkuruje pomluvou ostatních pilotů a firem.",
    ],
  },
  {
    title: "4. Odpovědnost vůči oboru",
    items: [
      "Člen si je vědom, že každý nezodpovědný let poškozuje všechny, kdo létají. Vystupuje tak, aby obor budil důvěru.",
      "Incidenty a nebezpečné situace sdílí s komorou — anonymizovaná zkušenost jednoho chrání ostatní.",
      "Předává zkušenosti začínajícím pilotům věcně a bez povýšenosti.",
    ],
  },
  {
    title: "5. Vztah ke komoře",
    items: [
      "Člen nezneužívá členství v komoře k vytváření dojmu úředního postavení nebo výhody u úřadů.",
      "Ve sporech uvnitř oboru hledá nejdřív dohodu, pak rozhodnutí orgánů komory.",
    ],
  },
] as const;

export default function CodeOfConductPage() {
  return (
    <>
      <PageHeader
        title="Etický kodex"
        lead="Zásady, ke kterým se hlásí každý člen komory. Kodex není vymáhán úřadem — je vymáhán tím, že na něm stojí důvěra v obor."
      />
      <section>
        <Container className="py-12 sm:py-16">
          <p className="mb-10 inline-block border border-brass bg-paper-2 px-3 py-1.5 text-[13px] font-medium uppercase tracking-wider text-brass">
            Návrh — finální znění schvaluje Rada komory
          </p>
          <div className="max-w-3xl space-y-10">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-[22px]">{s.title}</h2>
                <ul className="mt-4 space-y-3 text-[16px] leading-relaxed text-ink-2">
                  {s.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span
                        aria-hidden
                        className="mt-[12px] h-px w-4 shrink-0 bg-brass"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="border-t border-hairline pt-6 text-[14.5px] leading-relaxed text-ink-2">
              Porušení kodexu projednává Revizní komise; závažné nebo opakované
              porušení může být důvodem ukončení členství podle stanov. Kodex
              se vztahuje na jednání člena související s provozem bezpilotních
              systémů a s činností komory.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
