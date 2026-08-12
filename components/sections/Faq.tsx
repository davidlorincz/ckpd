const faq = [
  {
    q: "Musím být členem komory, abych mohl létat?",
    a: "Ne. Komora není zřízena zákonem a členství v ní není podmínkou provozu bezpilotního systému. Pravidla provozu a evidenci provozovatelů má na starosti Úřad pro civilní letectví (ÚCL). Komora je dobrovolný profesní spolek — sdružuje ty, kdo chtějí, aby obor měl společný hlas.",
  },
  {
    q: "Co mi členství reálně přinese?",
    a: "Hlas při jednání s úřady, přístup ke vzorovým provozním dokumentům a doporučeným postupům, data o oboru a síť pilotů a provozovatelů. A hlavně: čím větší členská báze, tím větší váhu mají připomínky komory k legislativě, která se týká i tvého létání.",
  },
  {
    q: "Kdo se může stát členem?",
    a: "Každý pilot bezpilotního systému — hobby i výdělečný — a každá firma, která bezpilotní systémy provozuje, vyrábí nebo s nimi pracuje. Přijímáme i školy, výcvikové organizace a e-shopy včetně konkurenčních. Komora, která si vybírá jen spřízněné členy, není komora.",
  },
  {
    q: "Jak probíhá přijetí?",
    a: "Odešleš přihlášku, o přijetí rozhodne Rada komory na nejbližším zasedání, poté přijde e-mail s pokyny k platbě příspěvku a po jeho připsání je členství aktivní. Členství vzniká rozhodnutím orgánu spolku, ne nákupem — proto to není okamžité.",
  },
  {
    q: "Kolik členství stojí a jak se platí?",
    a: "Individuální pilot 900 Kč ročně, studenti a školy 0–300 Kč, firemní členství od 8 000 Kč podle velikosti. Platí se převodem na účet komory na základě pokynů, které přijdou e-mailem po přijetí. Výše příspěvků vyplývá ze stanov.",
  },
  {
    q: "Vydává komora průkazy nebo osvědčení pilota?",
    a: "Ne. Nevydáváme průkazy způsobilosti, osvědčení ani nic, co by nahrazovalo doklady od ÚCL, a nezkoušíme piloty. Členům vystavujeme pouze potvrzení o členství v komoře. Cokoli, co souvisí s podmínkami provozu, řeší výhradně ÚCL.",
  },
  {
    q: "Zveřejňujete seznam členů?",
    a: "Ne. Seznam členů se nezveřejňuje; člen může se zveřejněním svého jména vyslovit souhlas v přihlášce (výchozí stav je nesouhlas). Veřejně uvádíme jen souhrnné počty členů.",
  },
  {
    q: "Jaký je vztah komory k DRONPRO?",
    a: "DRONPRO s.r.o. je zakládajícím členem a sponzorem komory a je to uvedeno v patičce webu i ve výroční zprávě. Komora má vlastní orgány, vlastní hospodaření a nedoporučuje produkty ani prodejce. Členy jsou a mají být i konkurenční firmy.",
  },
  {
    q: "K čemu komora používá data o mém provozu?",
    a: "Údaje o nalétaných hodinách a zaměření provozu zpracováváme výhradně souhrnně a anonymizovaně — jako podklad pro Zprávu o stavu DRONového provozu v ČR a pro jednání s úřady. Individuální data nikomu nepředáváme.",
  },
  {
    q: "Můžu se zapojit víc než jen příspěvkem?",
    a: "Ano, a je to vítané. Komora staví na odborných komisích a pracovních skupinách (legislativa, standardy, data). Napiš nám, čemu se věnuješ — práce je víc než lidí.",
  },
] as const;

/**
 * FAQ k členství — details/summary bez JS, oddělené hairlinem.
 */
export function Faq() {
  return (
    <div className="border-t border-hairline">
      {faq.map((item) => (
        <details key={item.q} className="group border-b border-hairline">
          <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 font-serif text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden
              className="shrink-0 text-brass transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="measure pb-5 text-[15.5px] leading-relaxed text-ink-2">
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}
