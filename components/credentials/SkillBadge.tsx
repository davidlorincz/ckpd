import { cn } from "@/lib/utils";
import type { CredentialState } from "@/lib/skills";

const czDate = (ms: number) =>
  new Date(ms).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const styles: Record<CredentialState, string> = {
  valid: "border-brass text-brass",
  expiring: "border-brass bg-brass-2/40 text-deep",
  expired: "border-hairline text-ink-2 line-through",
  revoked: "border-destructive text-destructive line-through",
};

const suffix: Record<CredentialState, string> = {
  valid: "platné do",
  expiring: "končí platnost",
  expired: "platnost skončila",
  revoked: "odebráno",
};

/**
 * Odznak certifikované dovednosti. Datum „platné do" jde do `title` i do
 * skryté textové varianty — `title` samotný čtečky spolehlivě nečtou,
 * a datum je podle zadání povinná informace, ne bonus.
 */
export function SkillBadge({
  label,
  validUntil,
  state = "valid",
  className,
}: {
  label: string;
  validUntil: number | string;
  state?: CredentialState;
  className?: string;
}) {
  const ms = typeof validUntil === "string" ? Date.parse(validUntil) : validUntil;
  const date = Number.isNaN(ms) ? String(validUntil) : czDate(ms);
  const full = `${label} — ${suffix[state]} ${date}`;

  return (
    <span
      title={full}
      className={cn(
        "inline-block rounded-[2px] border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        styles[state],
        className,
      )}
    >
      {label}
      <span className="sr-only"> — {suffix[state]} {date}</span>
    </span>
  );
}
