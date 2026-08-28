"use client";

/**
 * Osnova kurzu vedle přehrávače.
 *
 * Bez ní by se mezi lekcemi chodilo přes zpět na kurz a zpátky. Sidebar drží
 * kontext — kde jsem, co mám za sebou a co je další — a je to nejběžnější
 * pattern kurzových platforem právě proto, že unese hlubší strukturu
 * i delší seznam než vodorovná navigace.
 */

import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { ProgressBar } from "@/components/digiuniverzita/ProgressBar";
import {
  formatDuration,
  formatRemaining,
  lessonPresentation,
  type LessonState,
} from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

export function LessonSidebar({
  courseSlug,
  currentLessonSlug,
}: {
  courseSlug: string;
  currentLessonSlug: string;
}) {
  const course = useQuery(api.digiuniverzita.courseBySlug, { slug: courseSlug });
  const progress = useQuery(api.progress.forCourse, { courseSlug });

  if (!course) return null;

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="border border-hairline bg-paper shadow-paper">
        <div className="border-b border-hairline px-5 py-4">
          <Link
            href={`/digiuniverzita/${course.slug}`}
            className="text-[15px] font-medium text-ink hover:text-brass"
          >
            {course.title}
          </Link>
          {progress && (
            <>
              <ProgressBar percent={progress.percent} className="mt-3" />
              <p className="mt-2 text-[13px] text-ink-2 tnum">
                {Math.round(progress.percent * 100)} % ·{" "}
                {progress.lessonsCompleted}/{progress.lessonsTotal}
                {progress.remainingSeconds > 0 &&
                  ` · ${formatRemaining(progress.remainingSeconds)}`}
              </p>
            </>
          )}
        </div>

        <ol className="max-h-[calc(100vh-16rem)] overflow-y-auto">
          {course.lessons.map((lesson) => {
            const p = progress?.lessons[lesson.slug];
            const state: LessonState = p?.completed
              ? "dokoncena"
              : p?.started
                ? "rozkoukana"
                : "nezahajena";
            const look = lessonPresentation[state];
            const isCurrent = lesson.slug === currentLessonSlug;

            return (
              <li key={lesson.slug} className="border-b border-hairline last:border-b-0">
                <Link
                  href={`/digiuniverzita/${course.slug}/${lesson.slug}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "flex items-start gap-3 border-l-2 px-4 py-3 transition-colors",
                    isCurrent
                      ? "border-l-brass bg-paper-2"
                      : cn(look.row, "hover:bg-paper-2"),
                    !lesson.unlocked && "opacity-55",
                  )}
                >
                  <span
                    className={cn("mt-1 size-2.5 shrink-0 rounded-full", look.dot)}
                    aria-label={look.label}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-[14px] leading-snug",
                        isCurrent ? "font-medium text-ink" : "text-ink-2",
                      )}
                    >
                      {lesson.position}. {lesson.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-[13px] text-ink-2 tnum">
                    {formatDuration(lesson.durationSeconds)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}
