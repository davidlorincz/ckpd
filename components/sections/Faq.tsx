import { E } from "@/components/editor/EditableText";

const faq = [
  {
    q: "Musím být členem komory, abych mohl létat?",
    a: "Létat můžeš i bez členství — podmínky provozu a evidenci provozovatelů má na starosti Úřad pro civilní letectví (ÚCL). Komora je dobrovolný profesní spolek: sdružuje ty, kdo chtějí, aby obor měl společný hlas, lepší standardy a konkrétní výhody.",
  },
  {
    q: "Co mi členství reálně přinese?",
    a: "Hlas při jednání s úřady, vzorové provozní dokumenty, prémiový obsah v Dronzóně a konkrétní výhody u partnerů komory — od slev na techniku a školení až po přístup k nabídkám komerčních zakázek ve variantě PRO. A hlavně: čím větší členská báze, tím větší váhu mají připomínky komory k legislativě, která se týká i tvého létání.",
  },
  {
    q: "Kdo se může stát členem?",
    a: "Každý pilot bezpilotního systému — hobby i výdělečný — a každá firma, která bezpilotní systémy provozuje, vyrábí nebo s nimi pracuje. Přijímáme i školy, výcvikové organizace a e-shopy včetně konkurenčních. Obě varianty členství jsou otevřené všem a každý člen má stejný, jeden hlas.",
  },
  {
    q: "Jak probíhá přijetí?",
    a: "Založíš si účet, vybereš variantu členství a zaplatíš kartou. Členství je aktivní hned po zaplacení — žádné čekání na zasedání. V účtu pak najdeš své členské číslo, doklady o platbách a datum, do kdy máš příspěvek uhrazený.",
  },
  {
    q: "Kolik členství stojí a jak se platí?",
    a: "Základní členství stojí 199 Kč měsíčně, varianta PRO 499 Kč měsíčně. Platí se kartou a obnovuje se automaticky; zrušit obnovování jde kdykoli ve svém účtu a členství pak doběhne do konce zaplaceného období. Obě varianty mají stejný hlas — liší se jen rozsahem výhod.",
  },
  {
    q: "Vydává komora průkazy nebo osvědčení pilota?",
    a: "Doklady pilota a vše, co souvisí s podmínkami provozu, vydává výhradně ÚCL — role jsou jasně rozdělené. Od komory dostaneš potvrzení o členství, vzorové dokumenty, standardy a podporu v tom, co úřad neřeší: praxi, data a společný hlas oboru. Ke členství patří i členské číslo a ověřovací kód, kterým partnerům komory prokážeš, že tvé členství platí.",
  },
  {
    q: "Zveřejňujete seznam členů?",
    a: "Ano — komora vede veřejný seznam členů, protože viditelná členská základna je největší důkaz síly oboru. Tvoje jméno v něm uvedeme s tvým souhlasem, který můžeš kdykoli udělit i odvolat ve svém účtu. Doporučujeme ho dát: každé jméno v seznamu přidává váhu hlasu, kterým komora jedná.",
  },
  {
    q: "Jaký je vztah komory k DRONPRO?",
    a: "DRONPRO s.r.o. je zakládajícím členem a sponzorem komory a je to uvedeno v patičce webu i ve výroční zprávě. Komora má vlastní orgány a vlastní hospodaření. Členské výhody u partnerů (včetně DRONPRO) jsou dobrovolným plněním partnerů vůči členům — komora z nich nemá provize a její orgány rozhodují nezávisle. Členy jsou a mají být i konkurenční firmy.",
  },
  {
    q: "K čemu komora používá data o mém provozu?",
    a: "Údaje o nalétaných hodinách a zaměření provozu zpracováváme výhradně souhrnně a anonymizovaně — jako podklad pro Zprávu o stavu DRONového provozu v ČR a pro jednání s úřady. Individuální data zůstávají jen u komory.",
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
      {faq.map((item, i) => (
        <details key={item.q} className="group border-b border-hairline">
          <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 py-4 font-serif text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
            <E k={`home.faq.${i}.question`}>{item.q}</E>
            <span
              aria-hidden
              className="shrink-0 text-brass transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="measure pb-5 text-[15.5px] leading-relaxed text-ink-2">
            <E k={`home.faq.${i}.answer`}>{item.a}</E>
          </p>
        </details>
      ))}
    </div>
  );
}
