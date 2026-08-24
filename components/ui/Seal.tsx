import { cn } from "@/lib/utils";

type SealProps = {
  className?: string;
  /** deep = tmavá pečeť na papír, paper = světlá na tmavé plochy */
  variant?: "deep" | "paper";
  /** dekorativní použití (vodoznak) — skryje se před čtečkami */
  decorative?: boolean;
};

/**
 * Kruhová pečeť ČKPD: tenký dvojitý kruh, text po obvodu, uprostřed
 * čtyřrotorový znak. Musí být inline SVG, aby text převzal Rapid Variable
 * z page CSS. Verze bez obvodového textu (favicon, malé rozměry) = samotný
 * znak v public/brand/znak.svg.
 */
export function Seal({ className, variant = "deep", decorative }: SealProps) {
  const color = variant === "deep" ? "#2626ff" : "#ffffff";
  const symbol =
    variant === "deep" ? "/brand/znak.svg" : "/brand/znak-inverse.svg";

  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("select-none", className)}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Pečeť České komory pilotů DRONů"}
      aria-hidden={decorative ? true : undefined}
    >
      <defs>
        <path id="seal-arc-top" d="M 44 256 A 212 212 0 0 1 468 256" />
        <path id="seal-arc-bottom" d="M 30 256 A 226 226 0 0 0 482 256" />
      </defs>
      <circle cx="256" cy="256" r="253" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="256" cy="256" r="245" fill="none" stroke={color} strokeWidth="1.25" />
      <circle cx="256" cy="256" r="188" fill="none" stroke={color} strokeWidth="1.25" />
      <circle cx="37" cy="256" r="3.5" fill={color} />
      <circle cx="475" cy="256" r="3.5" fill={color} />
      <text
        fill={color}
        fontSize="31"
        letterSpacing="4"
        fontWeight="500"
        className="font-serif"
      >
        <textPath href="#seal-arc-top" startOffset="50%" textAnchor="middle">
          ČESKÁ KOMORA PILOTŮ DRONŮ
        </textPath>
      </text>
      <text
        fill={color}
        fontSize="29"
        letterSpacing="8"
        fontWeight="500"
        className="font-serif"
      >
        <textPath href="#seal-arc-bottom" startOffset="50%" textAnchor="middle">
          2026
        </textPath>
      </text>
      <image href={symbol} x="112" y="112" width="288" height="288" />
    </svg>
  );
}
