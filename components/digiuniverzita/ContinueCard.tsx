"use client";

/**
 * „Pokračovat kde jsi skončil" na přehledu účtu.
 *
 * Podle rešerše je to primární CTA, které dělá největší rozdíl v dokončovacím
 * poměru — bez něj se člověk po týdnu vrací do katalogu a hledá, kde přestal.
 * Nezobrazuje se u dokončených kurzů; tam už není kam pokračovat.
 */

import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { ProgressBar } from "@/components/digiuniverzita/ProgressBar";
import { formatDuration } from "@/lib/digiuniverzita";
import { SHOW_DIGIUNIVERZITA } from "@/lib/flags";

export function ContinueCard() {
  const resume = useQuery(
    api.progress.continueWatching,
    SHOW_DIGIUNIVERZITA ? {} : "skip",
  );

  if (!SHOW_DIGIUNIVERZITA || !resume) return null;

  return (
    <section className="border border-hairline border-l-2 border-l-brass bg-paper p-7 shadow-paper sm:p-9">
      <p className="text-[13px] uppercase tracking-wide text-ink-2">
        Pokračovat v učení
      </p>
      <h2 className="mt-2 text-[20px] sm:text-[24px]">{resume.lessonTitle}</h2>
      <p className="mt-1.5 text-[15px] text-ink-2">
        {resume.courseTitle}
        {resume.resumeSeconds > 5 &&
          ` · naposledy na ${formatDuration(resume.resumeSeconds)}`}
      </p>

      <ProgressBar percent={resume.percent} className="mt-5 max-w-sm" />
      <p className="mt-2 text-[13px] text-ink-2 tnum">
        {Math.round(resume.percent * 100)} % kurzu hotovo
      </p>

      <Link
        href={`/digiuniverzita/${resume.courseSlug}/${resume.lessonSlug}`}
        className="mt-5 inline-block border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
      >
        Pokračovat
      </Link>
    </section>
  );
}
