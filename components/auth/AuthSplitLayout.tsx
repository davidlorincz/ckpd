import Link from "next/link";

import { Seal } from "@/components/ui/Seal";
import { ProjectLockup } from "@/components/ui/ProjectLockup";

/**
 * Rám auth obrazovek: vlevo papír s formulářem, vpravo tmavá plocha komory.
 *
 * Hlavička ani patička webu tu nejsou schválně — vypíná je
 * `components/layout/SiteChrome.tsx`. Registrace je jediná věc, kterou tu má
 * člověk dělat.
 *
 * Pravý panel je pod `lg` skrytý; aby se odrážky neztratily, složí se pod
 * formulář do drobného bloku.
 */
export type AuthHero = {
  title: string;
  points: string[];
};

export function AuthSplitLayout({
  hero,
  children,
}: {
  hero: AuthHero;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header>
          <Link href="/" aria-label="Česká komora pilotů DRONů">
            <ProjectLockup name="ckpd" tone="ink" height={26} />
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          {children}

          {/* Pod lg pravý panel není — obsah se nesmí ztratit. */}
          <ul className="mt-10 space-y-3 border-t border-hairline pt-7 text-[14.5px] leading-relaxed text-ink-2 lg:hidden">
            {hero.points.map((point) => (
              <li key={point} className="flex gap-3">
                <span aria-hidden className="mt-[10px] h-px w-4 shrink-0 bg-brass" />
                {point}
              </li>
            ))}
          </ul>
        </main>

        <footer className="mx-auto w-full max-w-[26rem] text-[13px] leading-relaxed text-ink-2">
          Členství v komoře je dobrovolné a nesouvisí s podmínkami provozu
          DRONů. Ty stanoví Úřad pro civilní letectví.
        </footer>
      </div>

      <aside className="paper-grid-dark relative isolate hidden overflow-hidden bg-deep lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/2 -translate-y-1/2 opacity-[0.07]"
        >
          <Seal variant="paper" decorative className="h-[620px] w-[620px]" />
        </div>

        <div className="relative flex h-full flex-col justify-center px-12 py-16 xl:px-16">
          <p className="font-serif text-[12px] font-bold uppercase tracking-[0.22em] text-brass-2">
            Česká komora pilotů DRONů
          </p>
          <h2 className="mt-5 max-w-md text-[30px] leading-tight text-paper xl:text-[36px]">
            {hero.title}
          </h2>
          <ul className="mt-10 space-y-4 text-[15px] leading-relaxed text-paper/85">
            {hero.points.map((point) => (
              <li key={point} className="flex gap-4">
                <span
                  aria-hidden
                  className="mt-[11px] h-px w-5 shrink-0 bg-brass-2"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
