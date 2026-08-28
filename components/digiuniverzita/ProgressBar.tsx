/**
 * Ukazatel postupu.
 *
 * Procenta jsou vážená délkou lekce (počítá je convex/progress.ts) — ukazatel
 * počítaný z počtu lekcí by u pětiminutové a osmiminutové lekce tvrdil totéž
 * a to je klasifikované jako dark pattern: lidem nevadí pomalý ukazatel,
 * vadí jim nepoctivý.
 */
import { cn } from "@/lib/utils";

export function ProgressBar({
  percent,
  className,
  label,
}: {
  /** 0–1. */
  percent: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, percent)) * 100);
  return (
    <div className={className}>
      <div
        className="h-1.5 w-full bg-paper-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Postup v kurzu"}
      >
        <div
          className={cn("h-full transition-[width] duration-500", pct === 100 ? "bg-action" : "bg-brass")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
