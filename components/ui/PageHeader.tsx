import { Container } from "@/components/ui/Container";

export function PageHeader({
  title,
  lead,
}: {
  title: string;
  lead?: string;
}) {
  return (
    <div className="paper-grid border-b border-hairline">
      <Container className="py-14 sm:py-18">
        <h1 className="text-[34px] leading-[1.1] sm:text-[48px]">{title}</h1>
        {lead ? (
          <p className="measure mt-5 text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
            {lead}
          </p>
        ) : null}
      </Container>
    </div>
  );
}
