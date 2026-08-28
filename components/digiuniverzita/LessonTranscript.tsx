"use client";

/**
 * Klikatelný přepis.
 *
 * Zdrojem jsou titulkové věty z produkce videa, ale ty jsou nasekané podle
 * toho, co se vejde na obrazovku — medián pět slov, často uprostřed věty.
 * Jako přepis by to byla nečitelná změť, takže se tady slučují do odstavců
 * na hranicích vět (`toParagraphs`). Stopa s titulky se generuje ze stejného
 * zdroje, ale ponechává si původní sekání.
 *
 * Tím se z videa stává referenční dokument: najdeš slovo, klikneš na odstavec,
 * skočíš na sekundu. Je to zároveň textová alternativa k videu, kterou
 * doporučuje NN/g a vyžaduje WCAG 1.2.3.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatDuration,
  toParagraphs,
  type TranscriptSegment,
} from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

/** Zvýrazní hledaný výraz v textu odstavce. */
function Highlighted({ text, needle }: { text: string; needle: string }) {
  if (needle.length < 2) return <>{text}</>;

  const lower = text.toLocaleLowerCase("cs");
  const parts: React.ReactNode[] = [];
  let from = 0;
  let at = lower.indexOf(needle);

  while (at !== -1) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(
      <mark key={at} className="bg-brass-2 text-ink">
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
    at = lower.indexOf(needle, from);
  }
  parts.push(text.slice(from));
  return <>{parts}</>;
}

export function LessonTranscript({
  segments,
  currentTime,
  onSeek,
}: {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (seconds: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [follow, setFollow] = useState(true);
  const activeRef = useRef<HTMLLIElement>(null);

  const paragraphs = useMemo(() => toParagraphs(segments), [segments]);

  const needle = query.trim().toLocaleLowerCase("cs");
  const searching = needle.length >= 2;
  const filtered = useMemo(
    () =>
      searching
        ? paragraphs.filter((p) => p.text.toLocaleLowerCase("cs").includes(needle))
        : paragraphs,
    [paragraphs, needle, searching],
  );

  const activeStart = useMemo(() => {
    const hit = paragraphs.find(
      (p) => currentTime >= p.start && currentTime < p.end,
    );
    return hit?.start ?? null;
  }, [paragraphs, currentTime]);

  /** Odrolování za přehráváním jde vypnout — jinak nejde v klidu číst dopředu. */
  useEffect(() => {
    if (!follow || searching) return;
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeStart, follow, searching]);

  return (
    <section className="border border-hairline bg-paper shadow-paper">
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-4">
        <h2 className="mr-auto text-[17px]">Přepis</h2>
        <label className="flex items-center gap-2 text-[14px] text-ink-2">
          <input
            type="checkbox"
            checked={follow}
            onChange={(e) => setFollow(e.target.checked)}
            className="size-4 accent-brass"
          />
          Sledovat přehrávání
        </label>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hledat v přepisu…"
          aria-label="Hledat v přepisu"
          className="w-full border border-hairline bg-paper px-3 py-2 text-[14px] text-ink placeholder:text-ink-2 focus:border-brass focus:outline-none sm:w-56"
        />
      </div>

      {searching && (
        <p className="border-b border-hairline px-5 py-2.5 text-[13px] text-ink-2">
          {filtered.length === 0
            ? "Nic nenalezeno."
            : `${filtered.length} z ${paragraphs.length} odstavců`}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="px-5 py-6 text-[15px] text-ink-2">
          Zkus jiné slovo — hledá se v celém přepisu lekce.
        </p>
      ) : (
        <ul className="max-h-[32rem] overflow-y-auto">
          {filtered.map((paragraph) => {
            const isActive = activeStart === paragraph.start;
            return (
              <li
                key={paragraph.start}
                ref={isActive ? activeRef : undefined}
                className="border-b border-hairline last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => onSeek(paragraph.start)}
                  className={cn(
                    "flex w-full items-baseline gap-4 border-l-2 px-5 py-3.5 text-left transition-colors",
                    isActive
                      ? "border-l-brass bg-paper-2 text-ink"
                      : "border-l-transparent text-ink-2 hover:bg-paper-2 hover:text-ink",
                  )}
                >
                  <span className="w-12 shrink-0 text-[13px] tnum">
                    {formatDuration(paragraph.start)}
                  </span>
                  <span className="text-[15px] leading-relaxed">
                    <Highlighted text={paragraph.text} needle={needle} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
