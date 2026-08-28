"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";
import { TierPicker } from "@/components/member/TierPicker";
import { BILLING_PROVIDER } from "@/lib/flags";
import {
  formatDate,
  statusPresentation,
  tierLabels,
  type MembershipTier,
} from "@/lib/membership";

/** Výběr varianty, zahájení platby a zrušení či obnovení členství. */
export function SubscriptionPanel() {
  const member = useQuery(api.members.getSelf);
  const startCheckout = useMutation(api.billing.startCheckout);
  const cancel = useMutation(api.billing.cancelAtPeriodEnd);
  const resume = useMutation(api.billing.resumeSubscription);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (member === undefined) return <MemberSkeleton />;
  if (member === null) return null;

  async function choose(tier: MembershipTier) {
    setBusy(true);
    try {
      const { sessionId } = await startCheckout({ tier });
      // Stejný tvar jako u Stripe: odcházíme na bránu, nic se needituje inline.
      router.push(
        `/platba/presmerovani?session=${encodeURIComponent(sessionId)}&tarif=${tier}`,
      );
    } catch (e) {
      setBusy(false);
      toast.error(e instanceof Error ? e.message : "Platbu se nepodařilo zahájit.");
    }
  }

  const active = member.status === "active" || member.status === "past_due";

  return (
    <div className="flex flex-col gap-8">
      {BILLING_PROVIDER === "mock" && (
        <p className="border border-brass bg-brass-2/40 px-5 py-3 text-[14px] text-deep">
          <strong className="font-semibold">Ukázkový režim.</strong> Platební
          brána zatím není napojená — platba se jen nasimuluje a nic se nestrhne.
        </p>
      )}

      {active ? (
        <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
          <h2 className="text-[20px] sm:text-[24px]">Tvoje členství</h2>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-[13px] uppercase tracking-wider text-ink-2">
                Varianta
              </dt>
              <dd className="mt-1 text-[15.5px] text-ink">
                {member.tier ? tierLabels[member.tier] : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] uppercase tracking-wider text-ink-2">
                Stav
              </dt>
              <dd className="mt-1 text-[15.5px] text-ink">
                {statusPresentation[member.status].label}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] uppercase tracking-wider text-ink-2">
                {member.cancelAtPeriodEnd ? "Skončí" : "Další platba"}
              </dt>
              <dd className="tnum mt-1 text-[15.5px] text-ink">
                {formatDate(member.currentPeriodEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-[13px] uppercase tracking-wider text-ink-2">
                Platební metoda
              </dt>
              <dd className="mt-1 text-[15.5px] text-ink">
                {BILLING_PROVIDER === "mock" ? "Ukázková karta •••• 4242" : "Karta"}
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-hairline pt-6">
            {member.cancelAtPeriodEnd ? (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await resume();
                    toast.success("Členství bude pokračovat.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-[2px] bg-action px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-action-2 disabled:opacity-50"
              >
                Pokračovat v členství
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(
                      "Zrušit obnovování? Členství poběží do konce zaplaceného období.",
                    )
                  )
                    return;
                  setBusy(true);
                  try {
                    await cancel();
                    toast.success("Členství se už nebude obnovovat.");
                  } finally {
                    setBusy(false);
                  }
                }}
                className="rounded-[2px] border border-hairline px-6 py-3 text-[15px] font-medium text-ink-2 transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                Zrušit obnovování
              </button>
            )}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="text-[20px] sm:text-[24px]">
          {active ? "Změnit variantu" : "Vyber variantu členství"}
        </h2>
        <p className="measure mt-3 text-[15.5px] leading-relaxed text-ink-2">
          Jeden člen znamená jeden hlas, ať platíš Základní, nebo PRO. Varianta
          rozhoduje jen o rozsahu výhod u partnerů komory.
        </p>
        <TierPicker
          current={member.tier}
          disabled={busy}
          onChoose={choose}
        />
      </section>
    </div>
  );
}
