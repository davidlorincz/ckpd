"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  formatDate,
  statusNote,
  statusPresentation,
  tierLabels,
  type MembershipStatus,
  type MembershipTier,
} from "@/lib/membership";

type Props = {
  status: MembershipStatus;
  tier?: MembershipTier;
  memberSince?: number;
  currentPeriodEnd?: number;
  cancelAtPeriodEnd?: boolean;
  memberNumber?: string;
};

/** Stav členství — první věc, kterou má člen na přehledu vidět. */
export function MembershipStatusCard({
  status,
  tier,
  memberSince,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  memberNumber,
}: Props) {
  const p = statusPresentation[status];

  return (
    <section className={cn("border p-7 shadow-paper sm:p-9", p.card)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wider text-ink-2">
            Stav členství
          </p>
          <p className="mt-2 flex items-center gap-2.5 font-serif text-[26px] font-bold uppercase text-brass sm:text-[32px]">
            {tier ? tierLabels[tier] : "Bez členství"}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-[2px] px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wider",
            p.badge,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", p.dot)} />
          {p.label}
        </span>
      </div>

      <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">
        {statusNote(status, currentPeriodEnd)}
        {cancelAtPeriodEnd && status === "active" ? (
          <>
            {" "}
            Obnovení je vypnuté — po tomhle datu členství skončí.
          </>
        ) : null}
      </p>

      {status !== "none" && (
        <dl className="mt-7 grid gap-5 border-t border-hairline pt-6 sm:grid-cols-2">
          {memberNumber && (
            <div>
              <dt className="text-[13px] uppercase tracking-wider text-ink-2">
                Členské číslo
              </dt>
              <dd className="tnum mt-1 font-mono text-[15.5px] tracking-[0.06em] text-ink">
                {memberNumber}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-[13px] uppercase tracking-wider text-ink-2">
              Členem od
            </dt>
            <dd className="tnum mt-1 text-[15.5px] text-ink">
              {formatDate(memberSince)}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] uppercase tracking-wider text-ink-2">
              {status === "canceled" ? "Skončilo" : "Platné do"}
            </dt>
            <dd className="tnum mt-1 text-[15.5px] text-ink">
              {formatDate(currentPeriodEnd)}
            </dd>
          </div>
        </dl>
      )}

      <div className="mt-7">
        {status === "active" || status === "past_due" ? (
          <Link
            href="/muj-ucet/predplatne"
            className="inline-block rounded-[2px] border border-deep px-6 py-3 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
          >
            Spravovat členství
          </Link>
        ) : (
          <Link
            href="/muj-ucet/predplatne"
            className="inline-block rounded-[2px] bg-action px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-action-2"
          >
            {status === "canceled" ? "Obnovit členství" : "Vybrat variantu"}
          </Link>
        )}
      </div>
    </section>
  );
}
