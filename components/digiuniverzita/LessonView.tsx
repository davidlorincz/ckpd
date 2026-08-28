"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAction, useQuery } from "convex/react";
import type { MediaPlayerInstance } from "@vidstack/react";

import { api } from "@/convex/_generated/api";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";
import { LessonPlayer } from "@/components/digiuniverzita/LessonPlayer";
import { LessonTranscript } from "@/components/digiuniverzita/LessonTranscript";
import { LessonNotes } from "@/components/digiuniverzita/LessonNotes";
import { LessonSidebar } from "@/components/digiuniverzita/LessonSidebar";
import { useLessonProgress } from "@/components/digiuniverzita/useLessonProgress";
import { formatDuration, toWebVtt } from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

/**
 * Kolik sekund před uloženou pozicí se navazuje. Pár vteřin kontextu zpátky
 * je rozdíl mezi „vím, kde jsem" a „o čem to zrovna mluví".
 */
const RESUME_REWIND_SECONDS = 5;

/** Konec videa už nemá cenu nabízet k pokračování. */
const RESUME_TAIL_SECONDS = 30;

type Playback = {
  src: string;
  posterUrl: string | null;
  storyboardUrl: string | null;
  expiresAt: number;
  unsigned: boolean;
};

export function LessonView({
  courseSlug,
  lessonSlug,
}: {
  courseSlug: string;
  lessonSlug: string;
}) {
  const lesson = useQuery(api.digiuniverzita.lessonBySlug, {
    courseSlug,
    lessonSlug,
  });
  const requestPlayback = useAction(api.video.signedPlayback);

  const player = useRef<MediaPlayerInstance>(null);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [resumeDismissed, setResumeDismissed] = useState(false);

  const { progress, track, commit, markCompleted } = useLessonProgress(
    lesson?.lessonId,
  );

  const lessonId = lesson?.lessonId;
  const canPlay = !!lesson?.unlocked && !!lesson?.hasVideo;

  useEffect(() => {
    if (!lessonId || !canPlay) return;
    let cancelled = false;
    setPlayback(null);
    setPlaybackError(null);

    requestPlayback({ lessonId })
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setPlaybackError("Video se nepodařilo načíst.");
          return;
        }
        setPlayback(result);
      })
      .catch(() => {
        if (!cancelled) setPlaybackError("Video se nepodařilo načíst.");
      });

    return () => {
      cancelled = true;
    };
  }, [lessonId, canPlay, requestPlayback]);

  /**
   * Titulky vyrobené z transkriptu. Blob se drží po dobu života komponenty
   * a při odchodu se uvolní, aby URL neunikaly.
   */
  const subtitlesUrl = useMemo(() => {
    if (!lesson?.transcript?.length) return null;
    return URL.createObjectURL(
      new Blob([toWebVtt(lesson.transcript)], { type: "text/vtt" }),
    );
  }, [lesson?.transcript]);

  useEffect(() => {
    return () => {
      if (subtitlesUrl) URL.revokeObjectURL(subtitlesUrl);
    };
  }, [subtitlesUrl]);

  const seekTo = useCallback((seconds: number) => {
    const el = player.current;
    if (!el) return;
    commit();
    el.currentTime = seconds;
    void el.play();
  }, [commit]);

  /**
   * Nabídnout návrat tam, kde divák skončil — ale nikdy neskákat sám od sebe.
   * Automatický skok bez zeptání je matoucí: člověk čeká začátek a dostane
   * půlku. Poslední půlminutu a dokončenou lekci nenabízíme vůbec.
   */
  const resumeAt =
    progress && !progress.completed &&
    progress.lastPositionSeconds > RESUME_REWIND_SECONDS &&
    lesson &&
    progress.lastPositionSeconds < lesson.durationSeconds - RESUME_TAIL_SECONDS
      ? Math.max(0, progress.lastPositionSeconds - RESUME_REWIND_SECONDS)
      : null;

  if (lesson === undefined) return <MemberSkeleton />;

  if (lesson === null) {
    return (
      <section className="border border-hairline bg-paper p-7 shadow-paper">
        <h1 className="text-[20px]">Lekce nenalezena</h1>
        <Link
          href="/digiuniverzita"
          className="mt-4 inline-block text-[15px] text-brass underline underline-offset-4"
        >
          Zpět na DIGI univerzitu
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-8">
      <header>
        <Link
          href={`/digiuniverzita/${lesson.course.slug}`}
          className="text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink"
        >
          ← {lesson.course.title}
        </Link>
        <h1 className="mt-3 text-[24px] sm:text-[28px]">{lesson.title}</h1>
        <p className="mt-2 text-[14px] text-ink-2 tnum">
          Lekce {lesson.position} · {formatDuration(lesson.durationSeconds)}
        </p>
      </header>

      {lesson.state === "draft" && lesson.stateNote && (
        <p className="border border-brass bg-paper p-5 text-[15px] text-ink-2">
          <strong className="text-ink">Návrh k revizi.</strong> {lesson.stateNote}
        </p>
      )}

      {!lesson.unlocked ? (
        <section className="border border-brass bg-paper p-7 shadow-paper">
          <h2 className="text-[19px]">Lekci máš zamčenou</h2>
          <p className="mt-2 text-[15px] text-ink-2">
            Obsah je dostupný členům s aktivním členstvím.
          </p>
          <Link
            href="/muj-ucet/predplatne"
            className="mt-5 inline-block border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
          >
            Zobrazit členství
          </Link>
        </section>
      ) : !lesson.hasVideo ? (
        <p className="border border-hairline bg-paper-2 p-7 text-[15px] text-ink-2">
          Video k téhle lekci se ještě připravuje.
        </p>
      ) : playbackError ? (
        <p className="border border-destructive bg-paper p-7 text-[15px] text-ink-2">
          {playbackError}
        </p>
      ) : playback ? (
        <>
          {playback.unsigned && (
            <p className="border border-brass bg-brass-2 p-4 text-[14px] text-deep">
              Vývojový režim: video se přehrává bez podepsané adresy. Na produkci
              je to zakázané — doplň Mux podpisové klíče.
            </p>
          )}
          {resumeAt !== null && !resumeDismissed && (
            <div className="flex flex-wrap items-center gap-4 border border-brass bg-paper p-4">
              <p className="mr-auto text-[15px] text-ink">
                Minule jsi skončil na {formatDuration(resumeAt)}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResumeDismissed(true);
                  seekTo(resumeAt);
                }}
                className="border border-deep bg-deep px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-deep-2"
              >
                Pokračovat od {formatDuration(resumeAt)}
              </button>
              <button
                type="button"
                onClick={() => setResumeDismissed(true)}
                className="border border-hairline px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-paper-2"
              >
                Přehrát od začátku
              </button>
            </div>
          )}
          <LessonPlayer
            ref={player}
            src={playback.src}
            title={lesson.title}
            posterUrl={playback.posterUrl}
            storyboardUrl={playback.storyboardUrl}
            subtitlesUrl={subtitlesUrl}
            onTimeUpdate={(t) => {
              setCurrentTime(t);
              track(t);
            }}
            onCommit={commit}
          />

          {/* Automatika sama nestačí — kdo si látku přečte v přepisu, musí
              mít možnost lekci odškrtnout ručně. A zase ji odškrtnout zpět. */}
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void markCompleted(!progress?.completed)}
              className={cn(
                "border px-5 py-2.5 text-[15px] font-medium transition-colors",
                progress?.completed
                  ? "border-action bg-action text-white hover:bg-action-2"
                  : "border-hairline text-ink hover:bg-paper-2",
              )}
            >
              {progress?.completed ? "✓ Dokončeno" : "Označit jako dokončené"}
            </button>
            {progress && progress.percent > 0 && !progress.completed && (
              <span className="text-[14px] text-ink-2 tnum">
                Shlédnuto {Math.round(progress.percent * 100)} %
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="aspect-video w-full animate-pulse border border-hairline bg-paper-2" />
      )}

      {lesson.perex && (
        <p className="measure text-[15.5px] text-ink-2">{lesson.perex}</p>
      )}

      {lesson.transcript && lesson.transcript.length > 0 && (
        <LessonTranscript
          segments={lesson.transcript}
          currentTime={currentTime}
          onSeek={seekTo}
        />
      )}

      {lesson.unlocked && (
        <LessonNotes
          lessonId={lesson.lessonId}
          currentTime={currentTime}
          onSeek={seekTo}
        />
      )}

      <nav className="flex items-center justify-between gap-4 border-t border-hairline pt-6">
        {lesson.prev ? (
          <Link
            href={`/digiuniverzita/${lesson.course.slug}/${lesson.prev.slug}`}
            className="text-[15px] text-ink-2 hover:text-ink"
          >
            ← {lesson.prev.title}
          </Link>
        ) : (
          <span />
        )}
        {lesson.next && (
          <Link
            href={`/digiuniverzita/${lesson.course.slug}/${lesson.next.slug}`}
            className="text-right text-[15px] font-medium text-ink hover:text-brass"
          >
            {lesson.next.title} →
          </Link>
        )}
      </nav>
      </div>

      <LessonSidebar
        courseSlug={lesson.course.slug}
        currentLessonSlug={lesson.slug}
      />
    </div>
  );
}
