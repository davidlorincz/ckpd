/**
 * Tenké linkové ikony pro pilíře (PRD § 4.5) — nevyplněné, nebarevné,
 * kreslené tahem 1.5 v currentColor.
 */

type IconProps = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Zastupujeme — budova instituce se sloupovím */
export function IconInstitution({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <path d="M6 42h36" />
      <path d="M10 42V22M18 42V22M30 42V22M38 42V22" />
      <path d="M6 22h36" />
      <path d="M8 17 24 7l16 10" />
      <circle cx="24" cy="14" r="1.6" />
    </svg>
  );
}

/** Standardizujeme — dokument s pečetí */
export function IconStandard({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <path d="M12 6h18l6 6v30H12z" />
      <path d="M30 6v6h6" />
      <path d="M17 18h10M17 24h14M17 30h8" />
      <circle cx="31" cy="35" r="4.5" />
      <path d="m28 39-1.5 4 4.5-2 4.5 2-1.5-4" />
    </svg>
  );
}

/** Měříme — graf s datovými body */
export function IconMeasure({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <path d="M8 8v32h32" />
      <path d="m14 32 8-9 7 4 9-13" />
      <circle cx="14" cy="32" r="1.8" />
      <circle cx="22" cy="23" r="1.8" />
      <circle cx="29" cy="27" r="1.8" />
      <circle cx="38" cy="14" r="1.8" />
    </svg>
  );
}
