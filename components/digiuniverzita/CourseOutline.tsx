"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";
import { ProgressBar } from "@/components/digiuniverzita/ProgressBar";
import { QuizRunner } from "@/components/digiuniverzita/QuizRunner";
import { CourseCompletion } from "@/components/digiuniverzita/CourseCompletion";
import {
  formatDuration,
  formatRemaining,
  formatTotal,
  lessonPresentation,
  type LessonState,
} from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

export function CourseOutline({ slug }: { slug: string }) {
  const course = useQuery(api.digiuniverzita.courseBySlug, { slug });
  const progress = useQuery(api.progress.forCourse, { courseSlug: slug });

  if (course === undefined) return <MemberSkeleton />;

  if (course === null) {
    return (
      <section className="border border-hairline bg-paper p-7 shadow-paper">
        <h1 className="text-[20px]">Kurz nenalezen</h1>
        <Link
          href="/digiuniverzita"
          className="mt-4 inline-block text-[15px] text-brass underline underline-offset-4"
        >
          Zpět na DIGI univerzitu
        </Link>
      </section>
    );
  }

  /** Moduly v pořadí ze seedu; lekce bez modulu spadnou na konec. */
  const groups = [
    ...course.sections.map((s) => ({
      key: s.key,
      title: s.title,
      lessons: course.lessons.filter((l) => l.sectionKey === s.key),
    })),
    {
      key: "__bez__",
      title: "Ostatní",
      lessons: course.lessons.filter((l) => l.sectionKey === null),
    },
  ].filter((g) => g.lessons.length > 0);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link
          href="/digiuniverzita"
          className="text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink"
        >
          ← DIGI univerzita
        </Link>
        <h1 className="mt-3 text-[24px] sm:text-[28px]">{course.title}</h1>
        <p className="measure mt-3 text-[15.5px] text-ink-2">{course.perex}</p>
        <p className="mt-4 text-[14px] text-ink-2 tnum">
          {course.lessonCount} lekcí · {formatTotal(course.totalDurationSeconds)}
        </p>

        {course.unlocked && progress && (
          <div className="mt-5 max-w-md">
            <ProgressBar percent={progress.percent} />
            <p className="mt-2 text-[14px] text-ink-2 tnum">
              {Math.round(progress.percent * 100)} % ·{" "}
              {progress.lessonsCompleted} z {progress.lessonsTotal} lekcí hotovo
              {progress.remainingSeconds > 0 &&
                ` · ${formatRemaining(progress.remainingSeconds)}`}
            </p>
            {progress.nextLessonSlug && (
              <Link
                href={`/digiuniverzita/${course.slug}/${progress.nextLessonSlug}`}
                className="mt-4 inline-block border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
              >
                {progress.percent > 0 ? "Pokračovat" : "Začít kurz"}
              </Link>
            )}
          </div>
        )}
      </header>

      {!course.unlocked && (
        <section className="border border-brass bg-paper p-7 shadow-paper">
          <h2 className="text-[19px]">Kurz máš zamčený</h2>
          <p className="mt-2 text-[15px] text-ink-2">
            {course.requiredTier === "pro"
              ? "Tenhle kurz je součástí členství PRO."
              : "Kurz je dostupný členům s aktivním členstvím."}
          </p>
          <Link
            href="/muj-ucet/predplatne"
            className="mt-5 inline-block border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
          >
            Zobrazit členství
          </Link>
        </section>
      )}

      {course.unlocked && (
        <CourseCompletion
          courseSlug={course.slug}
          courseCompleted={
            !!progress &&
            progress.lessonsTotal > 0 &&
            progress.lessonsCompleted === progress.lessonsTotal
          }
        />
      )}

      {groups.map((group) => (
        <section key={group.key}>
          <h2 className="text-[17px] sm:text-[19px]">{group.title}</h2>
          <ul className="mt-4 border border-hairline bg-paper shadow-paper">
            {group.lessons.map((lesson) => {
              const p = progress?.lessons[lesson.slug];
              const state: LessonState = p?.completed
                ? "dokoncena"
                : p?.started
                  ? "rozkoukana"
                  : "nezahajena";
              const look = lessonPresentation[state];

              const body = (
                <>
                  <span
                    className={cn("mt-1.5 size-3 shrink-0 rounded-full", look.dot)}
                    title={look.label}
                    aria-label={look.label}
                  />
                  <span className="w-6 shrink-0 text-[14px] text-ink-2 tnum">
                    {lesson.position}.
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15.5px] text-ink">
                      {lesson.title}
                      {lesson.state === "draft" && (
                        <span className="ml-2 border border-brass bg-brass-2 px-1.5 py-0.5 align-middle text-[11px] font-medium text-deep">
                          návrh
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[14px] text-ink-2">
                      {lesson.perex}
                    </span>
                  </span>
                  {/* délku ukazujeme vždy — skrytá stopáž je nejrychlejší způsob, jak ztratit důvěru */}
                  <span className="shrink-0 text-right text-[14px] text-ink-2 tnum">
                    {formatDuration(lesson.durationSeconds)}
                    {state === "rozkoukana" && p && (
                      <span className="mt-0.5 block text-[12px] text-brass">
                        {Math.round(p.percent * 100)} %
                      </span>
                    )}
                  </span>
                </>
              );

              return (
                <li
                  key={lesson.slug}
                  className="border-b border-hairline last:border-b-0"
                >
                  {lesson.unlocked ? (
                    <Link
                      href={`/digiuniverzita/${course.slug}/${lesson.slug}`}
                      className={cn(
                        "flex items-start gap-4 border-l-2 px-5 py-4 transition-colors",
                        look.row,
                        "hover:border-l-brass hover:bg-paper-2",
                      )}
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-4 border-l-2 border-l-transparent px-5 py-4 opacity-55">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {course.unlocked && <QuizRunner courseSlug={course.slug} />}
    </div>
  );
}
