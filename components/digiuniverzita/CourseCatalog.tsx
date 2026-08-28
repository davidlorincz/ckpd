"use client";

/**
 * Přehled kurzů.
 *
 * Karta vede obrázkem, ne textem — kurz se vybírá okem. Obálka je ilustrace
 * přímo z produkce lekcí (flat vektor v DRONPRO stylu), takže katalog vypadá
 * jako pokračování videa, ne jako jiná aplikace. Pod obrázkem je hierarchie
 * podle toho, co člověk potřebuje vědět nejdřív: název, o čem to je, kolik
 * to zabere, kde jsem.
 */

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";
import { ProgressBar } from "@/components/digiuniverzita/ProgressBar";
import { formatTotal } from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

export function CourseCatalog() {
  const courses = useQuery(api.digiuniverzita.catalog);

  if (courses === undefined) return <MemberSkeleton />;

  if (courses.length === 0) {
    return (
      <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
        <h2 className="text-[20px] sm:text-[24px]">DIGI univerzita</h2>
        <p className="mt-3 text-[15.5px] text-ink-2">
          Zatím tu není žádný kurz. Připravujeme je.
        </p>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="border-b border-hairline pb-6">
        <h1 className="text-[28px] sm:text-[36px]">DIGI univerzita</h1>
        <p className="measure mt-3 text-[16px] text-ink-2">
          Videokurzy k legislativě a provozu dronů. Postup se ukládá, takže se
          kdykoli vrátíš tam, kde jsi skončil.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course, index) => {
          const started = course.percent > 0;
          const done = course.percent >= 1;
          /*
            První kurz dostane celou šířku a obrázek vedle textu. Jednak je to
            vlajková loď katalogu, jednak by osamocená úzká karta ve třísloupcové
            mřížce vypadala jako chyba — a dokud je kurz jediný, přesně to by se
            stalo.
          */
          const featured = index === 0;

          const card = (
            <>
              <div
                className={cn(
                  "relative overflow-hidden bg-deep",
                  featured ? "aspect-[16/9] md:aspect-auto md:h-full" : "aspect-[16/9]",
                )}
              >
                {course.coverImageUrl ? (
                  <Image
                    src={course.coverImageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                    className={cn(
                      "object-cover transition-transform duration-500",
                      course.unlocked && "group-hover:scale-[1.03]",
                    )}
                  />
                ) : (
                  <div className="paper-grid-dark size-full" />
                )}

                {/* štítky sedí na obrázku, ať karta nemá řádek navíc */}
                <div className="absolute left-0 top-0 flex flex-col items-start gap-1.5 p-3">
                  {course.requiredTier === "pro" && (
                    <span className="bg-deep px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-brass-2">
                      PRO
                    </span>
                  )}
                  {course.state === "draft" && (
                    <span className="bg-brass px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-paper">
                      Návrh
                    </span>
                  )}
                </div>

                {done && (
                  <span className="absolute right-3 top-3 bg-action px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                    Dokončeno
                  </span>
                )}

                {!course.unlocked && (
                  <div className="absolute inset-0 flex items-end bg-deep/70 p-4">
                    <p className="text-[13px] font-medium text-paper">
                      {course.requiredTier === "pro"
                        ? "Součást členství PRO"
                        : "Pro aktivní členy"}
                    </p>
                  </div>
                )}
              </div>

              <div
                className={cn(
                  "flex flex-1 flex-col",
                  featured ? "p-7 sm:p-9" : "p-6",
                )}
              >
                <h2
                  className={cn(
                    "leading-tight",
                    featured
                      ? "text-[22px] sm:text-[27px]"
                      : "text-[19px] sm:text-[21px]",
                  )}
                >
                  {course.title}
                </h2>
                <p
                  className={cn(
                    "mt-3 flex-1 leading-relaxed text-ink-2",
                    featured ? "measure text-[16px]" : "text-[15px]",
                  )}
                >
                  {course.perex}
                </p>

                <p className="mt-5 text-[13.5px] text-ink-2 tnum">
                  {course.lessonCount} lekcí · {formatTotal(course.totalDurationSeconds)}
                </p>

                {course.unlocked && started && (
                  <div className="mt-3">
                    <ProgressBar
                      percent={course.percent}
                      label={`Postup v kurzu ${course.title}`}
                    />
                    <p className="mt-2 text-[13px] text-ink-2 tnum">
                      {Math.round(course.percent * 100)} % ·{" "}
                      {course.lessonsCompleted}/{course.lessonCount} lekcí hotovo
                    </p>
                  </div>
                )}

                <span
                  className={cn(
                    "mt-6 self-start border-b-2 pb-1 text-[15px] font-medium transition-colors",
                    course.unlocked
                      ? "border-b-brass text-ink group-hover:text-brass"
                      : "border-b-hairline text-ink-2",
                  )}
                >
                  {course.unlocked
                    ? done
                      ? "Projít znovu →"
                      : started
                        ? "Pokračovat →"
                        : "Začít kurz →"
                    : "Zobrazit členství →"}
                </span>
              </div>
            </>
          );

          const className = cn(
            "group overflow-hidden border border-hairline bg-paper shadow-paper transition-shadow",
            featured
              ? "flex flex-col md:col-span-2 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] xl:col-span-3"
              : "flex flex-col",
            course.unlocked
              ? "hover:shadow-[0_2px_16px_rgba(0,0,100,.10)]"
              : "bg-paper-2",
          );

          return course.unlocked ? (
            <Link
              key={course.slug}
              href={`/digiuniverzita/${course.slug}`}
              className={className}
            >
              {card}
            </Link>
          ) : (
            <Link key={course.slug} href="/muj-ucet/predplatne" className={className}>
              {card}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
