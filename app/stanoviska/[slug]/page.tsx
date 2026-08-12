import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/ui/Container";
import { DocumentLink } from "@/components/ui/DocumentLink";
import { formatDate, getStanoviska, getStanovisko } from "@/lib/stanoviska";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getStanoviska().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const s = getStanovisko(slug);
  if (!s) return {};
  return { title: s.title, description: s.perex };
}

export default async function PositionDetailPage({ params }: Props) {
  const { slug } = await params;
  const s = getStanovisko(slug);
  if (!s) notFound();

  return (
    <article>
      <div className="paper-grid border-b border-hairline">
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl">
            {s.draft ? (
              <p className="mb-6 inline-block border border-brass bg-paper px-3 py-1.5 text-[13px] font-medium uppercase tracking-wider text-brass">
                Návrh k revizi — nepublikováno
              </p>
            ) : null}
            <time dateTime={s.date} className="tnum block text-[14px] text-ink-2">
              {formatDate(s.date)}
            </time>
            <h1 className="mt-2 text-[30px] leading-[1.15] sm:text-[42px]">
              {s.title}
            </h1>
            <p className="measure mt-4 text-[17px] leading-relaxed text-ink-2">
              {s.perex}
            </p>
          </div>
        </Container>
      </div>
      <Container className="py-12 sm:py-16">
        <div
          className="measure max-w-3xl space-y-5 text-[16.5px] leading-relaxed text-ink [&_a]:text-brass [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-brass [&_blockquote]:pl-5 [&_blockquote]:text-ink-2 [&_h2]:mt-10 [&_h2]:text-[24px] [&_h3]:mt-8 [&_h3]:text-[19px] [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium"
        >
          <MDXRemote source={s.content} />
        </div>
        {s.pdf ? (
          <div className="mt-12 max-w-3xl border-t border-hairline">
            <DocumentLink href={s.pdf} label="Stáhnout stanovisko" meta="PDF" />
          </div>
        ) : null}
      </Container>
    </article>
  );
}
