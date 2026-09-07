"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { SkillBadge } from "@/components/credentials/SkillBadge";
import { EXPIRING_SOON_DAYS } from "@/lib/skills";

const czDate = (ms: number) =>
  new Date(ms).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const basisLabels: Record<string, string> = {
  zkouska: "Zkouška ve školicím středisku",
  portfolio: "Doložené portfolio",
  kurz: "Absolvovaný kurz",
  praxe: "Doložená praxe",
};

/**
 * Certifikace člena s datem „platné do".
 *
 * Ukazuje i vypršelé a odebrané — bez toho by se člen nedozvěděl, že mu
 * platnost skončila, a nemá se o co opřít při žádosti o prodloužení.
 */
export function CredentialsCard() {
  const rows = useQuery(api.credentials.mine);
  if (rows === undefined || rows.length === 0) return null;

  const daysLeft = (until: number) =>
    Math.max(0, Math.ceil((until - Date.now()) / 86_400_000));

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Odkaz zkopírován.");
    } catch {
      toast.error("Kopírování se nepovedlo — označ odkaz a zkopíruj ručně.");
    }
  }

  return (
    <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
      <h2 className="text-[20px] sm:text-[24px]">Certifikace</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
        Každá certifikace má vlastní kód. Zaměstnavatel nebo zadavatel si jím
        ověří, co umíš, aniž bys mu dával ověřovací kód ke členství.
      </p>

      <ul className="mt-6 flex flex-col gap-5">
        {rows.map((c) => (
          <li
            key={c._id}
            className={
              c.state === "expiring"
                ? "border-l-2 border-l-brass pl-4"
                : c.state === "expired" || c.state === "revoked"
                  ? "border-l-2 border-l-destructive pl-4"
                  : "border-l-2 border-l-hairline pl-4"
            }
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <SkillBadge
                label={c.label}
                validUntil={c.validUntil}
                state={c.state}
              />
              <span className="tnum text-[13px] text-ink-2">{c.code}</span>
            </div>

            <p className="tnum mt-2 text-[15.5px] font-medium text-ink">
              {c.state === "revoked"
                ? `Odebráno ${c.revokedAt ? czDate(c.revokedAt) : ""}`
                : c.state === "expired"
                  ? `Platnost skončila ${czDate(c.validUntil)}`
                  : `Platné do ${czDate(c.validUntil)}`}
            </p>
            <p className="mt-1 text-[14px] text-ink-2">
              {basisLabels[c.basis] ?? c.basis} · vydáno {czDate(c.issuedAt)}
            </p>

            {c.state === "expiring" && (
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">
                Platnost končí za {daysLeft(c.validUntil)} dní.{" "}
                <Link
                  href="/kontakt"
                  className="text-brass underline underline-offset-4"
                >
                  Napiš komoře o prodloužení
                </Link>
                .
              </p>
            )}
            {c.state === "revoked" && c.revokedReason && (
              <p className="mt-2 text-[14px] text-ink-2">
                Důvod: {c.revokedReason}
              </p>
            )}

            {c.state !== "revoked" && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[14px]">
                <Link
                  href={`/overit/certifikace/${c.code}`}
                  className="text-brass underline underline-offset-4"
                >
                  Veřejné ověření
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    copy(`${window.location.origin}/overit/certifikace/${c.code}`)
                  }
                  className="text-ink-2 underline underline-offset-4 hover:text-ink"
                >
                  Kopírovat odkaz
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-[13.5px] leading-relaxed text-ink-2">
        Na blížící se konec platnosti upozorňujeme {EXPIRING_SOON_DAYS} dní
        předem. Prodloužení vyřizuje komora.
      </p>
    </section>
  );
}
