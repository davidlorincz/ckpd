"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/Container";
import { membershipTiers } from "@/lib/site";
import { org } from "@/lib/site";
import type { MembershipTier } from "@/lib/membership";

/**
 * Ukázková platební brána — vizuálně napodobuje, co uvidí člen na Stripu,
 * ale nic nestrhne. „Zaplatit" volá `billing.mockConfirm`, což je přesně
 * to místo, kam v ostrém provozu dopadne `checkout.session.completed`.
 */
export function MockGateway() {
  const router = useRouter();
  const params = useSearchParams();
  const confirm = useMutation(api.billing.mockConfirm);
  const abandon = useMutation(api.billing.abandonCheckout);
  const [busy, setBusy] = useState(false);

  const tierKey = (params.get("tarif") ?? "zakladni") as MembershipTier;
  const tier = membershipTiers.find((t) => t.key === tierKey);

  if (!tier) {
    return (
      <Container className="py-20">
        <p className="text-ink-2">Neznámá varianta členství.</p>
      </Container>
    );
  }

  async function pay() {
    setBusy(true);
    try {
      await confirm({ tier: tierKey });
      router.replace("/muj-ucet?platba=ok");
    } catch (e) {
      setBusy(false);
      toast.error(e instanceof Error ? e.message : "Platba se nezdařila.");
    }
  }

  async function cancel() {
    setBusy(true);
    try {
      await abandon();
    } finally {
      router.replace("/muj-ucet/predplatne");
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <p className="mb-4 flex items-center justify-center gap-2 border border-brass bg-brass-2/40 px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wider text-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
          Ukázka — žádná platba se nestrhne
        </p>

        <div className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
          <p className="text-[13px] uppercase tracking-wider text-ink-2">
            Platba pro
          </p>
          <p className="mt-1 font-serif text-[19px] font-bold uppercase text-brass">
            {org.shortName}
          </p>

          <div className="mt-7 border-y border-hairline py-5">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[15.5px] text-ink">
                Členství {tier.label}
              </span>
              <span className="tnum font-serif text-[26px] font-bold text-deep">
                {tier.price}
              </span>
            </div>
            <p className="mt-1.5 text-[13.5px] text-ink-2">
              Opakovaně každý {tier.period}. Zrušit jde kdykoli.
            </p>
          </div>

          <dl className="mt-6 flex flex-col gap-3 text-[14.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">Karta</dt>
              <dd className="tnum text-ink">•••• •••• •••• 4242</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">Platnost</dt>
              <dd className="tnum text-ink">12 / 30</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={pay}
            disabled={busy}
            className="mt-8 w-full rounded-[2px] bg-action px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-action-2 disabled:opacity-50"
          >
            {busy ? "Zpracováváme…" : `Zaplatit ${tier.price}`}
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className="mt-3 w-full px-6 py-2.5 text-[14.5px] text-ink-2 underline-offset-4 hover:underline disabled:opacity-50"
          >
            Zrušit a vrátit se
          </button>
        </div>

        <p className="mt-5 text-center text-[13px] leading-relaxed text-ink-2">
          V ostrém provozu tahle stránka nebude — přejdeš rovnou na
          zabezpečenou bránu poskytovatele plateb.
        </p>
      </div>
    </Container>
  );
}
