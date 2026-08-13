import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Faq } from "@/components/sections/Faq";
import { MembershipForm } from "@/components/forms/MembershipForm";
import { memberBenefits, membershipTiers } from "@/lib/site";

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
          <h2 className="text-[26px] sm:text-[34px]">Varianty a výhody</h2>
          <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
            Dvě varianty, jinak jsme si všichni rovni: jeden člen znamená
            jeden hlas, ať platíš Základní, nebo PRO. Výhody u partnerů
            komory jsou jejich dobrovolným plněním vůči členům.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline align-bottom">
                  <th className="w-1/2 py-3 pr-4 text-[13.5px] font-medium uppercase tracking-wider text-ink-2">
                    Výhoda
                  </th>
                  {membershipTiers.map((t) => (
                    <th key={t.key} className="py-3 pr-4">
                      <span className="block font-serif text-[19px] font-semibold text-ink">
                        {t.label}
                      </span>
                      <span className="tnum block text-[14px] font-normal text-deep">
                        {t.fee}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {memberBenefits
                  .filter((b) => !b.unconfirmed)
                  .map((b) => (
                    <tr key={b.label} className="border-b border-hairline">
                      <td className="py-3.5 pr-4 text-[15px] text-ink">
                        {b.label}
                      </td>
                      <td className="py-3.5 pr-4">
                        {b.zakladni ? (
                          <span className="font-medium text-brass">●</span>
                        ) : (
                          <span aria-label="není součástí" className="text-hairline">—</span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4">
                        {b.pro ? (
                          <span className="font-medium text-brass">●</span>
                        ) : (
                          <span aria-label="není součástí" className="text-hairline">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 space-y-1.5 text-[14px] text-ink-2">
            <p>
              {membershipTiers
                .map((t) => `${t.label}: ${t.feeNote}`)
                .join(" · ")}
              . Platí se převodem, výše příspěvků vyplývá ze stanov.
            </p>
            <p>
              Čestné členství uděluje Rada osobnostem oboru — bez příspěvku.
            </p>
          </div>
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
