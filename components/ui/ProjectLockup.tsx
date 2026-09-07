import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Endorsement lockup „<SLOVO> by DRONPRO".
 *
 * Stejný vzor jako sesterské aplikace — HUBAI ho zavedl, BURZA
 * (uber_dronpro) zprůmyslnila do generátoru. Loga jsou celá v křivkách
 * (`scripts/build-logo.py`), takže nezávisí na načtení fontu a DRONPRO
 * wordmark nejde omylem rozdělit na dvě barvy: je to registrovaná značka
 * a musí zůstat vcelku.
 *
 * Poměry stran musí sedět s viewBoxem vygenerovaných SVG — po přegenerování
 * je zkontrolovat, jinak se logo roztáhne.
 */
const LOCKUPS = {
  burza: { ratio: 8199.4 / 1620, label: "BURZA by DRONPRO" },
  pujcovna: { ratio: 8554.2 / 1620, label: "PŮJČOVNA by DRONPRO" },
  ckpd: { ratio: 5088.4 / 1540, label: "ČKPD by DRONPRO" },
} as const;

export type LockupName = keyof typeof LOCKUPS;

export function ProjectLockup({
  name,
  tone = "ink",
  height = 28,
  className,
}: {
  name: LockupName;
  /** `ink` = navy na světlém podkladu, `inv` = bílé na tmavém. */
  tone?: "ink" | "inv";
  /** Výška v px; šířka se dopočítá z poměru stran. */
  height?: number;
  className?: string;
}) {
  const { ratio, label } = LOCKUPS[name];
  return (
    <Image
      src={`/brand/${name}-by-dronpro-${tone === "inv" ? "white" : "navy"}.svg`}
      alt={label}
      width={Math.round(height * ratio)}
      height={height}
      className={cn("w-auto max-w-full", className)}
      style={{ height }}
    />
  );
}
