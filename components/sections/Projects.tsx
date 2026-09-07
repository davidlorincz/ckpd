import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { DronproWordmark } from "@/components/ui/DronproWordmark";
import { ProjectLockup } from "@/components/ui/ProjectLockup";
import { SectionImage } from "@/components/ui/SectionImage";
import { ExplainerVideos } from "@/components/sections/ExplainerVideos";
import { projects } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

/**
 * Ekosystém pod herem: návštěvník musí hned vidět, co za komorou reálně
 * stojí, ne až v patičce.
 *
 * Burza ani Půjčovna nemají vlastní značku — jsou to produkty DRONPRO,
 * proto nesou endorsement lockup „X by DRONPRO" ve stejném vzoru jako
 * sesterské aplikace. Karta ukazuje lockup jako hlavní sdělení, text je
 * jen popiska pod ním.
 */
export function Projects() {
  return (
    <section id="projekty" className="border-b border-hairline bg-paper-2">
      <Container className="py-20 sm:py-28">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <h2 className="text-[26px] sm:text-[34px]">
              <E k="home.projects.title">Naše projekty</E>
            </h2>
            <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
              <E k="home.projects.intro">
                Komora nevznikla ve vzduchoprázdnu. Stojí za ní funkční
                ekosystém DRONPRO — e-shop, půjčovna a burza zakázek, které
                piloti používají každý den.
              </E>
            </p>
          </div>
          <SectionImage
            src="/vizualy/vybaveni.webp"
            alt="Vybavení pilota připravené na stole — dron, ovladač, náhradní baterie a zápisník"
            sizes="(min-width: 1024px) 420px, 100vw"
            className="lg:w-[420px]"
          />
        </div>

        <div className="mt-14 grid gap-px border border-hairline bg-hairline md:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.key} delay={i * 60} className="bg-paper">
              <div className="flex h-full flex-col px-7 py-8">
                <div className="flex min-h-[64px] items-center">
                  {p.lockup ? (
                    <ProjectLockup name={p.lockup} height={42} />
                  ) : (
                    <DronproWordmark className="h-[22px] text-ink sm:h-[30px]" />
                  )}
                </div>
                <p className="mt-6 flex-1 text-[15.5px] leading-relaxed text-ink-2">
                  <E k={`home.projects.${p.key}.text`}>{p.text}</E>
                </p>
                {p.href ? (
                  <a
                    href={p.href}
                    rel="noopener"
                    className="mt-6 text-[14px] text-brass underline underline-offset-4 hover:text-deep-2"
                  >
                    <E k={`home.projects.${p.key}.link`} editable={false}>
                      Otevřít →
                    </E>
                  </a>
                ) : (
                  <span className="mt-6 text-[13px] uppercase tracking-wider text-ink-2">
                    <E k={`home.projects.${p.key}.soon`} editable={false}>
                      Připravujeme
                    </E>
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        {/* hranice spolek / sponzor se nesmí rozmazat (PRD § 8) */}
        <p className="measure mt-6 text-[13.5px] leading-relaxed text-ink-2">
          <E k="home.projects.disclosure">
            Projekty provozuje DRONPRO s.r.o., zakládající člen a sponzor
            komory. Orgány komory rozhodují nezávisle; výhody, které partneři
            členům poskytují, jsou jejich dobrovolným plněním.
          </E>
        </p>

        <ExplainerVideos />
      </Container>
    </section>
  );
}
