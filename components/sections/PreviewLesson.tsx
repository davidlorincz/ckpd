"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { LessonPlayer } from "@/components/digiuniverzita/LessonPlayer";
import { SectionImage } from "@/components/ui/SectionImage";
import { hasConvex } from "@/lib/env";
import { SHOW_DIGIUNIVERZITA } from "@/lib/flags";

/** Ukázková lekce. Musí mít v Convexu `isPreview: true`, jinak se nepřehraje. */
const COURSE_SLUG = "open-a1-a3";
const LESSON_SLUG = "digitalni-mapa-dronemap";

type Playback = { src: string; posterUrl: string | null; storyboardUrl: string | null };

/**
 * Veřejná ukázka jedné lekce DIGI univerzity přímo na titulce.
 *
 * Stojí na `lessons.isPreview` — `canAccessLesson` ho bere jako první
 * podmínku a pustí i nepřihlášeného, takže podepsaná Mux URL se vydá
 * i anonymovi (bez `jti`, protože není komu podpis přiřadit).
 *
 * FACADE, ne rovnou přehrávač: video se dotahuje ze stream.mux.com a PRD § 9
 * zakazuje požadavky na třetí domény při načtení stránky. Do kliknutí se
 * tedy ukazuje jen lokální náhled a na Mux neodejde nic.
 *
 * Schválně NEpoužívá `LessonView` — ta renderuje poznámky a tlačítko
 * „označit jako dokončené", které anonymovi tiše selžou (mutace vrátí null).
 */
export function PreviewLesson({ className }: { className?: string }) {
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const enabled = hasConvex && SHOW_DIGIUNIVERZITA;
  const lesson = useQuery(
    api.digiuniverzita.lessonBySlug,
    enabled ? { courseSlug: COURSE_SLUG, lessonSlug: LESSON_SLUG } : "skip",
  );
  const sign = useAction(api.video.signedPlayback);

  // ukázka se ukáže jen tehdy, když je opravdu odemčená a má video
  const ready = !!lesson?.unlocked && !!lesson?.hasVideo;
  // dokud se lekce nenačte, nevíme, jestli ukázka existuje — proto skeleton
  const pending = enabled && lesson === undefined;

  async function play() {
    if (!lesson?.lessonId || loading) return;
    setLoading(true);
    try {
      const res = await sign({ lessonId: lesson.lessonId });
      if (!res?.src) throw new Error("bez zdroje");
      setPlayback(res);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  const minutes = lesson ? Math.round(lesson.durationSeconds / 60) : null;

  /**
   * Když je DIGI univerzita vypnutá nebo lekce přestala být ukázkou,
   * nesmí tu zůstat mrtvé tlačítko — sekce spadne zpátky na ilustraci.
   */
  if (!enabled || (!pending && !ready)) {
    return (
      <SectionImage
        src="/vizualy/prvni-start.webp"
        alt="Pilot drží složený dron na dlani nad ranní loukou před prvním startem"
        sizes="(min-width: 1024px) 40vw, 100vw"
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      <div className="relative isolate aspect-[16/9] w-full overflow-hidden border border-hairline bg-deep">
        {playback ? (
          <LessonPlayer
            src={playback.src}
            title={lesson?.title ?? "Ukázková lekce"}
            posterUrl={playback.posterUrl}
            storyboardUrl={playback.storyboardUrl}
          />
        ) : (
          <>
            <Image
              src="/vizualy/prvni-start.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover grayscale-[0.85]"
            />
            <div aria-hidden className="absolute inset-0 bg-deep/70" />
            <button
              type="button"
              onClick={play}
              disabled={!ready || loading}
              className="paper-grid-dark group absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center disabled:cursor-default"
            >
              <span className="inline-flex items-center gap-2.5 rounded-[2px] bg-action px-5 py-2.5 text-[15px] font-medium text-white transition-colors group-enabled:group-hover:bg-action-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
                {loading ? "Načítám…" : "Přehrát ukázkovou lekci"}
              </span>
              <span className="font-serif text-[17px] font-bold uppercase leading-tight text-paper sm:text-[20px]">
                {lesson?.title ?? "Digitální mapa DroneMap"}
              </span>
              {minutes && (
                <span className="tnum text-[13px] text-paper/70">
                  {minutes} minut · z kurzu OPEN A1/A3
                </span>
              )}
            </button>
          </>
        )}
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">
        {failed ? (
          <>Ukázku se teď nepodařilo načíst. Zkus to prosím znovu.</>
        ) : (
          <>
            Ukázka z kurzu OPEN A1/A3, přehraje se bez přihlášení. Zbytek kurzu
            i ostatní lekce jsou{" "}
            <Link
              href="/clenstvi"
              className="text-brass underline underline-offset-4 hover:text-deep-2"
            >
              součástí členství
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
