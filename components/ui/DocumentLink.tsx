import { cn } from "@/lib/utils";

type DocumentLinkProps = {
  href: string;
  label: string;
  meta?: string;
  external?: boolean;
  className?: string;
};

/**
 * Řádek v seznamu dokumentů (blok Transparentnost) — seznam, nikoli karty.
 */
export function DocumentLink({
  href,
  label,
  meta,
  external,
  className,
}: DocumentLinkProps) {
  return (
    <a
      href={href}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "group flex items-baseline justify-between gap-4 border-b border-hairline py-3.5",
        className,
      )}
    >
      <span className="font-medium text-ink underline-offset-4 group-hover:underline group-hover:decoration-brass">
        {label}
      </span>
      <span className="shrink-0 text-[14px] text-ink-2">
        {meta ?? (external ? "externí odkaz ↗" : "")}
      </span>
    </a>
  );
}
