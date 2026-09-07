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

/** Certifikujeme — zkouška na počítači ve školicím středisku */
export function IconExam({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <rect x="5" y="9" width="38" height="25" rx="2" />
      <path d="M24 34v7M17 41h14" />
      <path d="m17 21 5 5 9-10" />
    </svg>
  );
}

/**
 * Video / přehrát. Schválně ne oficiální logo YouTube — cizí ochranná známka
 * do linkové sady nepatří a obrys v currentColor drží styl ostatních ikon.
 */
export function IconPlayBadge({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <rect x="4" y="11" width="40" height="26" rx="5" />
      <path d="m20 18 12 7-12 7z" />
    </svg>
  );
}

/** Burza — poptávka a nabídka, dvě strany jednoho trhu */
export function IconExchange({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <path d="M8 17h28M28 9l8 8-8 8" />
      <path d="M40 31H12M20 39l-8-8 8-8" />
    </svg>
  );
}

/** Půjčovna — technika na čas */
export function IconRental({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <path d="M7 16h34v24H7z" />
      <path d="M17 16v-5a7 7 0 0 1 14 0v5" />
      <circle cx="24" cy="28" r="5" />
      <path d="M24 25v3l2 2" />
    </svg>
  );
}

/** E-shop a školicí středisko */
export function IconStore({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" {...base}>
      <path d="M8 19h32v21H8z" />
      <path d="M6 19 9 9h30l3 10" />
      <path d="M18 40V28h12v12" />
    </svg>
  );
}
