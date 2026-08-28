"use client";

import { cn } from "@/lib/utils";
import { memberBenefits, membershipTiers } from "@/lib/site";
import type { MembershipTier } from "@/lib/membership";

/** Karty variant členství. Ceny jsou v `lib/site.ts` — jediný zdroj pravdy. */
export function TierPicker({
  current,
  disabled,
  onChoose,
}: {
  current?: MembershipTier;
  disabled?: boolean;
  onChoose: (tier: MembershipTier) => void;
}) {
  const benefits = memberBenefits.filter((b) => !b.unconfirmed);

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {membershipTiers.map((tier) => {
        const isCurrent = current === tier.key;
        const included = benefits.filter((b) =>
          tier.key === "pro" ? b.pro : b.zakladni,
        );

        return (
          <div
            key={tier.key}
            className={cn(
              "flex flex-col border bg-paper p-7 shadow-paper sm:p-8",
              isCurrent ? "border-l-2 border-l-action border-hairline" : "border-hairline",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-serif text-[22px] font-bold uppercase text-brass">
                {tier.label}
              </h3>
              {isCurrent && (
                <span className="rounded-[2px] bg-action px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wider text-white">
                  Máš
                </span>
              )}
            </div>

            <p className="mt-1 text-[15px] text-ink-2">{tier.claim}</p>

            <p className="tnum mt-5 font-serif">
              <span className="text-[32px] font-bold text-deep">{tier.price}</span>
              <span className="text-[14px] text-ink-2"> / {tier.period}</span>
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5">
              {included.map((b) => (
                <li key={b.label} className="flex gap-3 text-[14.5px] text-ink">
                  <span className="mt-[10px] h-px w-4 shrink-0 bg-brass" />
                  {b.label}
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={disabled || isCurrent}
              onClick={() => onChoose(tier.key as MembershipTier)}
              className={cn(
                "mt-8 rounded-[2px] px-6 py-3 text-[15px] font-medium transition-colors",
                isCurrent
                  ? "cursor-default border border-hairline text-ink-2"
                  : "bg-action text-white hover:bg-action-2",
                disabled && !isCurrent && "opacity-50",
              )}
            >
              {isCurrent ? "Aktuální varianta" : `Zvolit ${tier.label}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}
