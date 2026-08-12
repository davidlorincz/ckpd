import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Faq } from "@/components/sections/Faq";
import { MembershipForm } from "@/components/forms/MembershipForm";
import { membershipTiers } from "@/lib/site";

export const metadata: Metadata = {
  title: "Členství",
  description:
    "Kategorie členství v České komoře pilotů DRONů, výhody, průběh přijetí a přihláška.",
};

const steps = [
  {
    title: "Odešleš přihlášku",
    text: "Zabere to tři minuty. Žádná platba předem.",
  },
  {
    title: "Rozhodne Rada",
    text: "O přijetí člena rozhoduje Rada komory na nejbližším zasedání.",
  },
  {
    title: "Zaplatíš příspěvek",
    text: "Po přijetí přijde e-mail s pokyny k platbě převodem.",
  },
  {
    title: "Jsi člen",
    text: "Potvrdíme ti členství a přidáme tě do členské komunikace.",
  },
] as const;

export default function MembershipPage() {
  return (
    <>
      <PageHeader
        title="Členství"
        lead="Komora je tak silná, jak silná je její členská báze. Členství je dobrovolné, otevřené jednotlivcům i firmám — a k ničemu tě nezavazuje kromě toho, že obor bude mít společný hlas."
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Kategorie členství</h2>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline text-[13.5px] uppercase tracking-wider text-ink-2">
                  <th className="py-3 pr-4 font-medium">Kategorie</th>
                  <th className="py-3 pr-4 font-medium">Roční příspěvek</th>
                  <th className="py-3 pr-4 font-medium">Hlas</th>
                  <th className="py-3 font-medium">Poznámka</th>
                </tr>
              </thead>
              <tbody>
                {membershipTiers.map((t) => (
                  <tr key={t.key} className="border-b border-hairline">
                    <td className="py-4 pr-4 font-medium text-ink">
                      {t.label}
                    </td>
                    <td className="tnum py-4 pr-4 text-deep">{t.fee}</td>
                    <td className="py-4 pr-4 text-ink-2">{t.vote}</td>
                    <td className="py-4 text-[14.5px] text-ink-2">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[14px] text-ink-2">
            Výše příspěvků vyplývá ze stanov komory. Příspěvek je členským
            příspěvkem spolku, ne platbou za služby.
          </p>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Jak vstup funguje</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title}>
                <p className="tnum font-serif text-[34px] font-semibold leading-none text-brass">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-[19px]">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                  {s.text}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Časté otázky</h2>
          <div className="mt-8 max-w-3xl">
            <Faq />
          </div>
        </Container>
      </section>

      <section id="prihlaska" className="scroll-mt-24 border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Přihláška</h2>
          <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
            Přihláška je nezávazná do rozhodnutí Rady a nevzniká z ní povinnost
            platby. Údaje slouží jen pro vyřízení přihlášky a evidenci členů.
          </p>
          <div className="mt-10 max-w-3xl">
            <MembershipForm />
          </div>
        </Container>
      </section>
    </>
  );
}
