import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { formatDate, getStanoviska } from "@/lib/stanoviska";
import { E } from "@/components/editor/EditableText";

/**
 * Poslední 3 stanoviska na hlavní stránce (PRD § 4.9). Když žádné publikované
 * není, sekce se nerenderuje — prázdná působí hůř než žádná.
 */
export function Positions() {
  const items = getStanoviska().slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="border-b border-hairline bg-paper-2">
      <Container className="py-16 sm:py-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="home.positions.title">Stanoviska</E>
          </h2>
          <Link
            href="/stanoviska"
            className="shrink-0 text-[15px] font-medium text-brass underline-offset-4 hover:underline"
          >
            <E k="home.positions.allLink" editable={false}>
              Všechna stanoviska →
            </E>
          </Link>
        </div>
        <div className="mt-8">
          {items.map((s) => (
            <Link
              key={s.slug}
              href={`/stanoviska/${s.slug}`}
              className="group flex flex-col gap-1 border-b border-hairline py-5 sm:flex-row sm:items-baseline sm:gap-8"
            >
              <time
                dateTime={s.date}
                className="tnum shrink-0 text-[14px] text-ink-2 sm:w-36"
              >
                {formatDate(s.date)}
              </time>
              <span>
                <span className="font-medium text-ink underline-offset-4 group-hover:underline group-hover:decoration-brass">
                  <E k={`home.positions.${s.slug}.title`} editable={false}>
                    {s.title}
                  </E>
                  {s.draft ? " (návrh k revizi)" : ""}
                </span>
                <span className="mt-1 block text-[15px] text-ink-2">
                  <E k={`home.positions.${s.slug}.perex`} editable={false}>
                    {s.perex}
                  </E>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
