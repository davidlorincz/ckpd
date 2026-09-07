import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/ui/Cta";
import { PreviewLesson } from "@/components/sections/PreviewLesson";
import { E } from "@/components/editor/EditableText";

/**
 * Kurzy DIGI univerzity jako důvod ke členství.
 *
 * POZOR NA FORMULACE: kurzy NEJSOU zdarma. Přístup je zamčený za platné
 * členství — `convex/lib/entitlement.ts` nepustí nikoho bez `active`
 * a katalog zamčenou kartu označuje „Pro aktivní členy". Když se text
 * rozejde s tímhle pravidlem, web lže.
 *
 * Zdarma je jen účet — to je něco jiného než členství a je potřeba to
 * rozlišovat, jinak z toho vzniká falešné očekávání.
 *
 * Čísla u OPEN A1/A3 odpovídají skutečnosti v Convexu (10 publikovaných
 * lekcí, 3 529 s ≈ 58 min). Při změně kurzu je potřeba je přepsat.
 */
const courses = [
  {
    key: "opena1a3",
    title: "OPEN A1/A3",
    badge: "V členství",
    available: true,
    text: "Kompletní výklad pravidel otevřené kategorie. Deset lekcí, dohromady necelou hodinu, zakončeno testem a potvrzením s ověřitelným kódem.",
  },
  {
    key: "prvnistart",
    title: "První start",
    badge: "Připravujeme",
    available: false,
    text: "Praktický kurz pro první let: nastavení dronu, předletová příprava, checklist a co dělat, když se něco pokazí.",
  },
  {
    key: "fotogrametrie",
    title: "Fotogrametrie",
    badge: "Připravujeme",
    available: false,
    text: "Plánování náletu, překryvy, vlícovací body a kontrola přesnosti výstupu.",
  },
] as const;

export function Courses() {
  return (
    <section id="kurzy" className="border-b border-hairline">
      <Container className="py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-16">
          {/* místo ilustrace rovnou ukázková lekce — nejlepší důkaz kvality
              kurzu je kus kurzu, ne fotka */}
          <PreviewLesson className="lg:sticky lg:top-28" />

          <div>
            <p className="font-serif text-[26px] font-medium leading-snug text-deep sm:text-[34px]">
              <E k="home.courses.statement">
                Koupil sis DRON? Nauč se s ním létat pořádně.
              </E>
            </p>
            <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
              <E k="home.courses.lead">
                Kurzy DIGI univerzity jsou součástí členství — v Základním
                i v PRO. Žádný příplatek navíc: zaplatíš členství a máš je
                otevřené, včetně těch, které teprve přibudou. Jednu lekci si
                můžeš pustit hned, bez přihlášení.
              </E>
            </p>

            {/* seznam, ne mřížka: kurzů má přibývat a tři karty ve dvou
                sloupcích nechávaly prázdné místo */}
            <ul className="mt-10 border-t border-hairline">
              {courses.map((c) => (
                <li key={c.key} className="border-b border-hairline py-6">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                    <h3 className="text-[20px] sm:text-[22px]">
                      <E k={`home.courses.${c.key}.title`}>{c.title}</E>
                    </h3>
                    <span
                      className={
                        c.available
                          ? "rounded-[2px] bg-action px-2 py-0.5 text-[12px] font-medium uppercase tracking-wider text-white"
                          : "rounded-[2px] border border-hairline px-2 py-0.5 text-[12px] font-medium uppercase tracking-wider text-ink-2"
                      }
                    >
                      <E k={`home.courses.${c.key}.badge`} editable={false}>
                        {c.badge}
                      </E>
                    </span>
                  </div>
                  <p className="measure mt-2 text-[15.5px] leading-relaxed text-ink-2">
                    <E k={`home.courses.${c.key}.text`}>{c.text}</E>
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <Cta href="/clenstvi" variant="conversion">
                <E k="home.courses.cta" editable={false}>
                  Stát se členem
                </E>
              </Cta>
            </div>

            <p className="measure mt-6 text-[13.5px] leading-relaxed text-ink-2">
              <E k="home.courses.note">
                Účet si založíš zdarma, kurzy se otevřou se zaplaceným
                členstvím. Provozuje je DRONPRO s.r.o., zakládající člen
                a sponzor komory; jde o dobrovolné plnění partnera vůči členům.
              </E>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
