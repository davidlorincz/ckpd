import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Faq } from "@/components/sections/Faq";
import { Cta } from "@/components/ui/Cta";
import { SHOW_MEMBER_AREA } from "@/lib/flags";
import { memberBenefits, membershipTiers, org } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Členství",
  description:
    "Kategorie členství v České komoře pilotů DRONů, výhody, průběh přijetí a přihláška.",
};

const steps = [
  {
    title: "Založíš si účet",
    text: "Stačí e-mail a heslo. Účet je zdarma a nezavazuje k ničemu.",
  },
  {
    title: "Vybereš variantu",
    text: "Základní, nebo PRO. Obě mají stejný hlas, liší se rozsahem výhod.",
  },
  {
    title: "Zaplatíš kartou",
    text: "Platba běží přes zabezpečenou bránu. Zrušit jde kdykoli.",
  },
  {
    title: "Jsi člen",
    text: "Hned. V účtu najdeš členské číslo, doklady a datum obnovy.",
  },
] as const;

export default function MembershipPage() {
  return (
    <>
      <PageHeader
        title={<E k="clenstvi.header.title">Členství</E>}
        lead={
          <E k="clenstvi.header.lead">
            Komora je tak silná, jak silná je její členská báze. Členství je
            dobrovolné a otevřené jednotlivcům i firmám — čím víc nás je, tím
            silnější hlas obor má.
          </E>
        }
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="clenstvi.varianty.title">Varianty a výhody</E>
          </h2>
          <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
            <E k="clenstvi.varianty.intro">
              Dvě varianty, jinak jsme si všichni rovni: jeden člen znamená
              jeden hlas, ať platíš Základní, nebo PRO. Výhody u partnerů
              komory jsou jejich dobrovolným plněním vůči členům.
            </E>
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline align-bottom">
                  <th className="w-1/2 py-3 pr-4 text-[13.5px] font-medium uppercase tracking-wider text-ink-2">
                    <E k="clenstvi.cenik.thVyhoda">Výhoda</E>
                  </th>
                  {membershipTiers.map((t) => (
                    <th key={t.key} className="py-3 pr-4">
                      <span className="block font-serif text-[19px] font-semibold text-ink">
                        <E k={`clenstvi.tiers.${t.key}.label`}>{t.label}</E>
                      </span>
                      <span className="tnum block font-serif font-normal">
                        <span className="text-[19px] font-semibold text-deep">
                          <E k={`clenstvi.tiers.${t.key}.price`}>{t.price}</E>
                        </span>{" "}
                        <span className="text-[13px] text-ink-2">
                          /{" "}
                          <E k={`clenstvi.tiers.${t.key}.period`}>{t.period}</E>
                        </span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {memberBenefits
                  .filter((b) => !b.unconfirmed)
                  .map((b, i) => (
                    <tr key={b.label} className="border-b border-hairline">
                      <td className="py-3.5 pr-4 text-[15px] text-ink">
                        <E k={`clenstvi.benefits.${i}.label`}>{b.label}</E>
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
                .map((t) => `${t.label}: ${t.price} / ${t.period}`)
                .join(" · ")}
              .{" "}
              <E k="clenstvi.cenik.note">
                Platí se převodem, výše příspěvků vyplývá ze stanov.
              </E>
            </p>
            <p>
              <E k="clenstvi.cenik.cestne">
                Čestné členství uděluje Rada osobnostem oboru — bez příspěvku.
              </E>
            </p>
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="clenstvi.vstup.title">Jak vstup funguje</E>
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title}>
                <p className="tnum font-serif text-[34px] font-semibold leading-none text-brass">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-[19px]">
                  <E k={`clenstvi.steps.${i}.title`}>{s.title}</E>
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                  <E k={`clenstvi.steps.${i}.text`}>{s.text}</E>
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="clenstvi.faq.title">Časté otázky</E>
          </h2>
          <div className="mt-8 max-w-3xl">
            <Faq />
          </div>
        </Container>
      </section>

      <section id="prihlaska" className="scroll-mt-24 border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="clenstvi.prihlaska.title">Přidej se</E>
          </h2>
          <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
            <E k="clenstvi.prihlaska.intro">
              Účet je zdarma a variantu členství si vybereš až v něm. Členství
              je aktivní hned po zaplacení a zrušit obnovování jde kdykoli.
              Údaje slouží jen pro vedení evidence členů.
            </E>
          </p>
          {SHOW_MEMBER_AREA ? (
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Cta href="/registrace" variant="conversion">
                <E k="clenstvi.prihlaska.cta" editable={false}>
                  Stát se členem
                </E>
              </Cta>
              <p className="text-[14px] text-ink-2">
                <E k="clenstvi.prihlaska.signin">Už máš účet?</E>{" "}
                <Link
                  href="/prihlaseni"
                  className="text-brass underline-offset-4 hover:underline"
                >
                  Přihlas se
                </Link>
                .
              </p>
            </div>
          ) : (
            <p className="measure mt-8 text-[15.5px] leading-relaxed text-ink-2">
              <E k="clenstvi.prihlaska.brzy">
                Přihlášky spouštíme, jakmile bude hotová platební brána. Napiš
                nám a ozveme se ti hned, jak to bude možné:
              </E>{" "}
              <a
                href={`mailto:${org.email}`}
                className="text-brass underline-offset-4 hover:underline"
              >
                {org.email}
              </a>
              .
            </p>
          )}
        </Container>
      </section>
    </>
  );
}
