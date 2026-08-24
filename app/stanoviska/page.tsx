import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, getStanoviska } from "@/lib/stanoviska";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Stanoviska",
  description:
    "Stanoviska České komory pilotů DRONů k legislativě a aktuality z oboru bezpilotních systémů.",
};

export default function PositionsPage() {
  const items = getStanoviska();

  return (
    <>
      <PageHeader
        title={<E k="stanoviska.header.title">Stanoviska</E>}
        lead={
          <E k="stanoviska.header.lead">
            Věcná stanoviska k legislativě a regulaci bezpilotních systémů —
            vždy se zdroji a s návrhem konkrétního řešení.
          </E>
        }
      />
      <section>
        <Container className="py-12 sm:py-16">
          {items.length === 0 ? (
            <p className="measure text-[16px] text-ink-2">
              <E k="stanoviska.empty.text">
                První stanovisko připravujeme. Novinářské dotazy rádi
                zodpovíme — viz
              </E>{" "}
              <Link href="/kontakt" className="text-brass underline-offset-4 hover:underline">
                <E k="stanoviska.empty.link" editable={false}>
                  kontakt pro média
                </E>
              </Link>
              .
            </p>
          ) : (
            <div className="max-w-3xl">
              {items.map((s) => (
                <article key={s.slug} className="border-b border-hairline py-7">
                  <time
                    dateTime={s.date}
                    className="tnum text-[14px] text-ink-2"
                  >
                    {formatDate(s.date)}
                  </time>
                  <h2 className="mt-1.5 text-[22px] leading-snug">
                    <Link
                      href={`/stanoviska/${s.slug}`}
                      className="underline-offset-4 hover:underline hover:decoration-brass"
                    >
                      {s.title}
                    </Link>
                    {s.draft ? (
                      <span className="ml-3 align-middle border border-brass px-2 py-0.5 text-[12px] font-sans font-medium uppercase tracking-wider text-brass">
                        <E k="stanoviska.draftBadge">návrh k revizi</E>
                      </span>
                    ) : null}
                  </h2>
                  <p className="measure mt-2 text-[15.5px] leading-relaxed text-ink-2">
                    {s.perex}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
