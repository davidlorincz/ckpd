"use client";

import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";
import { mockInvoices } from "@/lib/billing/mockInvoices";
import { formatDate, formatPrice } from "@/lib/membership";
import { BILLING_PROVIDER } from "@/lib/flags";

/**
 * Doklady o zaplacených příspěvcích. Data jsou zatím odvozená (mock) —
 * cílově je bude vydávat účetní systém a vymění se jen zdroj dat.
 */
export function InvoiceList() {
  const member = useQuery(api.members.getSelf);

  if (member === undefined) return <MemberSkeleton />;
  if (member === null) return null;

  const invoices = mockInvoices(member.memberSince, member.tier);

  return (
    <div className="flex flex-col gap-8">
      {BILLING_PROVIDER === "mock" && (
        <p className="border border-brass bg-brass-2/40 px-5 py-3 text-[14px] text-deep">
          <strong className="font-semibold">Ukázková data.</strong> Doklady
          zatím nevydáváme — tohle je náhled, jak bude přehled vypadat.
        </p>
      )}

      <section>
        <h2 className="text-[20px] sm:text-[24px]">Doklady</h2>

        {invoices.length === 0 ? (
          <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
            Zatím tu nic není. Doklad se objeví po první zaplacené platbě
            členského příspěvku.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  {["Číslo", "Vystaveno", "Období", "Částka", ""].map((h) => (
                    <th
                      key={h}
                      className="py-3 pr-4 text-[13px] font-medium uppercase tracking-wider text-ink-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-hairline">
                    <td className="tnum py-3.5 pr-4 text-[15px] text-ink">
                      {inv.number}
                    </td>
                    <td className="tnum py-3.5 pr-4 text-[15px] text-ink-2">
                      {formatDate(inv.issuedAt)}
                    </td>
                    <td className="tnum py-3.5 pr-4 text-[14.5px] text-ink-2">
                      {formatDate(inv.periodFrom)} – {formatDate(inv.periodTo)}
                    </td>
                    <td className="tnum py-3.5 pr-4 text-[15px] text-ink">
                      {formatPrice(inv.amount)}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          toast.info(
                            "Stahování dokladů bude k dispozici po napojení účetního systému.",
                          )
                        }
                        className="text-[14px] text-deep underline-offset-4 hover:underline"
                      >
                        Stáhnout PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="measure mt-8 text-[13.5px] leading-relaxed text-ink-2">
          Členské příspěvky spolku nejsou plněním podléhajícím DPH. Potřebuješ-li
          doklad na firmu, doplň si IČO v profilu.
        </p>
      </section>
    </div>
  );
}
