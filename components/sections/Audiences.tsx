import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

const audiences = [
  {
    title: "Piloti",
    claim: "Létáš sám, ale nemusíš být sám.",
    bullets: [
      "Tvůj hlas při jednání s ÚCL a ministerstvem — jeden člen, jeden hlas",
      "Vzorové dokumenty a doporučené postupy pro běžný provoz",
      "Data a přehled: co se v oboru a legislativě skutečně děje",
      "Síť pilotů napříč obory, od hobby po profesionální provoz",
    ],
    price: "900 Kč / rok",
  },
  {
    title: "Firmy a provozovatelé",
    claim: "Zastoupení, které si sami nezajistíte.",
    bullets: [
      "Připomínky k legislativě s vahou celé členské báze",
      "Vzorová provozní dokumentace a standardy (SORA/OSO)",
      "Účast v odborných komisích a pracovních skupinách komory",
      "Kontakty na provozovatele a piloty v celé ČR",
    ],
    price: "od 8 000 Kč / rok",
  },
] as const;

export function Audiences() {
  return (
    <section className="border-b border-hairline bg-paper-2">
      <Container className="py-16 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">Pro koho tu jsme</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {audiences.map((a) => (
            <Reveal
              key={a.title}
              className="flex flex-col border border-hairline bg-paper p-7 shadow-paper sm:p-9"
            >
              <h3 className="text-[22px]">{a.title}</h3>
              <p className="mt-1 font-serif text-[17px] italic text-ink-2">
                {a.claim}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-[15.5px] leading-relaxed text-ink-2">
                {a.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center justify-between border-t border-hairline pt-5">
                <p className="tnum font-serif text-[19px] font-semibold text-deep">
                  {a.price}
                </p>
                <Link
                  href="/clenstvi"
                  className="text-[15px] font-medium text-brass underline-offset-4 hover:underline"
                >
                  Podmínky členství →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
