import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionImage } from "@/components/ui/SectionImage";
import { SKILLS, validityLabel } from "@/lib/skills";
import { E } from "@/components/editor/EditableText";

/**
 * Certifikace ČKPD (body 7–8 zadání). Zatím se připravuje, takže texty
 * mluví o záměru — komora nesmí slibovat službu, která neběží.
 *
 * Certifikujeme dovednosti, ne způsobilost k provozu; podmínky provozu
 * řeší ÚCL. Zbytek zakázaného slovníku platí dál — seznam je
 * v scripts/content-lint.mjs.
 */
export function Certification() {
  return (
    <section id="certifikace" className="border-b border-hairline bg-paper-2">
      <Container className="py-20 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 className="text-[26px] sm:text-[34px]">
              <E k="home.certification.title">Certifikace ČKPD</E>
            </h2>
            <p className="measure mt-5 text-[15.5px] leading-relaxed text-ink-2">
              <E k="home.certification.lead">
                Certifikujeme, co pilot skutečně umí. Zatímco Úřad pro
                civilní letectví řeší podmínky provozu, komora společně
                s DRONPRO certifikuje jednotlivé dovednosti — a zadavatel si
                je může kdykoli ověřit online.
              </E>
            </p>
          </div>
          <SectionImage
            src="/vizualy/zkouska-stredisko.webp"
            alt="Zkušební místnost školicího střediska s řadami počítačů"
          />
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
          {SKILLS.map((s) => (
            <div key={s.key} className="bg-paper px-5 py-4">
              <p className="text-[16px] font-medium text-ink">
                <E k={`home.certification.skill.${s.key}.label`}>{s.label}</E>
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                <E k={`home.certification.skill.${s.key}.scope`}>{s.scope}</E>
              </p>
              <p className="tnum mt-2 text-[13px] text-ink-2">
                Platnost {validityLabel(s.validityYears)}
              </p>
            </div>
          ))}
        </div>

        {/* bod 8 — hlavní argument proti papírům z internetu */}
        <div className="mt-10 border border-hairline border-l-2 border-l-brass bg-paper px-6 py-8 shadow-paper sm:px-10">
          <h3 className="text-[19px]">
            <E k="home.certification.examTitle">Zkouška se skládá osobně</E>
          </h3>
          <p className="measure mt-3 text-[15.5px] leading-relaxed text-ink-2">
            <E k="home.certification.examText">
              Test běží na počítači ve školicím středisku, pod dohledem
              zkoušejícího. Ne doma, ne na tři kliknutí, ne za pět minut. To je
              celý rozdíl mezi certifikací komory a papírem, který si kdokoli
              vygeneruje na internetu.
            </E>
          </p>
          <ul className="mt-5 space-y-3 text-[15.5px] leading-relaxed text-ink-2">
            {[
              "Fyzická účast ve školicím středisku.",
              "Test na počítači pod dohledem, ne online formulář.",
              "Certifikace platí 3 až 5 let podle oboru a dá se prodloužit.",
            ].map((t, i) => (
              <li key={t} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[11px] h-px w-4 shrink-0 bg-brass"
                />
                <E k={`home.certification.examPoint.${i}`}>{t}</E>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px]">
            <Link
              href="/overit"
              className="text-brass underline underline-offset-4 hover:text-deep-2"
            >
              <E k="home.certification.verifyLink" editable={false}>
                Ověřit certifikaci pilota →
              </E>
            </Link>
          </p>
        </div>

        <p className="measure mt-6 text-[13.5px] leading-relaxed text-ink-2">
          <E k="home.certification.status">
            Připravujeme. Rozsah, podmínky i ceny zveřejníme dřív, než se
            otevřou první přihlášky; členy informujeme jako první.
          </E>
        </p>
      </Container>
    </section>
  );
}
