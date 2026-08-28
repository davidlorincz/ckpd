"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MembershipStatusCard } from "@/components/member/MembershipStatusCard";
import { VerificationCodeCard } from "@/components/member/VerificationCodeCard";
import { MemberSkeleton } from "@/components/member/MemberSkeleton";
import { memberBenefits } from "@/lib/site";
import { isActive } from "@/lib/membership";

function PaymentBanner() {
  const params = useSearchParams();
  if (params.get("platba") !== "ok") return null;

  return (
    <div className="mb-8 border-l-2 border-l-action border border-hairline bg-paper p-5 shadow-paper">
      <p className="font-serif text-[17px] font-bold uppercase text-action">
        Členství aktivováno
      </p>
      <p className="mt-1.5 text-[15px] text-ink-2">
        Vítej v komoře. Níž najdeš svůj ověřovací kód pro partnery.
      </p>
    </div>
  );
}

export function MemberOverview() {
  const member = useQuery(api.members.getSelf);

  if (member === undefined) return <MemberSkeleton />;

  if (member === null) {
    return (
      <p className="text-[15.5px] text-ink-2">
        Zakládáme tvůj členský záznam… Pokud se nic nestane, načti stránku znovu.
      </p>
    );
  }

  const active = isActive(member.status, member.currentPeriodEnd);
  const benefits = memberBenefits
    .filter((b) => !b.unconfirmed)
    .filter((b) => (member.tier === "pro" ? b.pro : b.zakladni));

  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={null}>
        <PaymentBanner />
      </Suspense>

      <MembershipStatusCard
        status={member.status}
        tier={member.tier}
        memberSince={member.memberSince}
        currentPeriodEnd={member.currentPeriodEnd}
        cancelAtPeriodEnd={member.cancelAtPeriodEnd}
        memberNumber={member.memberNumber}
      />

      {active && (
        <VerificationCodeCard
          memberNumber={member.memberNumber}
          code={member.verificationCode}
        />
      )}

      {active && benefits.length > 0 && (
        <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
          <h2 className="text-[20px] sm:text-[24px]">Co ti členství dává</h2>
          <ul className="mt-6 flex flex-col gap-3">
            {benefits.map((b) => (
              <li key={b.label} className="flex gap-3 text-[15.5px] text-ink">
                <span className="mt-[11px] h-px w-4 shrink-0 bg-brass" />
                {b.label}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[13.5px] leading-relaxed text-ink-2">
            Výhody u partnerů komory jsou jejich dobrovolným plněním vůči
            členům. Komora z nich nemá provize.
          </p>
        </section>
      )}

      {!member.name && (
        <section className="border border-brass bg-paper p-7 shadow-paper sm:p-9">
          <h2 className="text-[20px]">Doplň profil</h2>
          <p className="measure mt-3 text-[15.5px] leading-relaxed text-ink-2">
            Ještě o tobě nic nevíme. Vyplň jméno a zaměření — bez toho tě
            nemůžeme uvést ve veřejném seznamu členů.
          </p>
          <Link
            href="/muj-ucet/profil"
            className="mt-6 inline-block rounded-[2px] border border-deep px-6 py-3 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
          >
            Vyplnit profil
          </Link>
        </section>
      )}
    </div>
  );
}
