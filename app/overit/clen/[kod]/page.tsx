import Link from "next/link";
import { fetchQuery } from "convex/nextjs";

import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/Container";
import { SkillBadge } from "@/components/credentials/SkillBadge";
import { Row, basisLabels, czDay } from "@/components/verify/VerifyResultParts";
import { hasConvex } from "@/lib/env";

/**
 * Veřejné ověření člena a všech jeho certifikací naráz.
 *
 * Dynamická: odvolaný souhlas se zveřejněním i zrušené členství se musí
 * projevit okamžitě. Neindexuje se a neposílá referrer — v adrese je
 * ověřovací kód, tedy tajemství.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ověření člena",
  description: "Ověření členství a certifikací České komory pilotů DRONů.",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function VerifyMemberPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const code = decodeURIComponent(kod);

  const result = hasConvex
    ? await fetchQuery(api.publicVerify.member, { code })
    : ({ valid: false } as const);

  return (
    <Container>
      <div className="py-14 sm:py-20">
        <p className="text-[13px] uppercase tracking-wide text-ink-2">
          Česká komora pilotů DRONů
        </p>
        <h1 className="mt-2 text-[26px] sm:text-[32px]">Ověření člena</h1>

        <div className="mt-8 max-w-xl">
          {result.valid ? (
            <>
              <section className="border border-hairline border-l-2 border-l-action bg-paper p-7 shadow-paper">
                <p className="font-serif text-[18px] font-bold uppercase text-action">
                  Členství platí
                </p>
                <dl className="mt-5">
                  {result.name && <Row label="Člen" value={result.name} />}
                  {result.memberNumber && (
                    <Row label="Členské číslo" value={result.memberNumber} />
                  )}
                  <Row label="Varianta" value={result.tierLabel} />
                  {result.region && <Row label="Kraj" value={result.region} />}
                  {result.memberSince && (
                    <Row label="Členem od" value={czDay(result.memberSince)} />
                  )}
                  {result.paidUntil && (
                    <Row label="Zaplaceno do" value={czDay(result.paidUntil)} />
                  )}
                </dl>
                {!result.name && (
                  <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
                    Člen nedal souhlas se zveřejněním jména. Komora proto
                    potvrzuje jen to, že členství platí.
                  </p>
                )}
              </section>

              <section className="mt-6 border border-hairline bg-paper p-7 shadow-paper">
                <h2 className="text-[19px]">Certifikace</h2>
                {result.credentials.length === 0 ? (
                  <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                    K tomuhle členství zatím neevidujeme žádnou certifikaci.
                  </p>
                ) : (
                  <ul className="mt-5 space-y-5">
                    {result.credentials.map((c) => (
                      <li
                        key={c.code}
                        className="border-b border-hairline pb-5 last:border-b-0 last:pb-0"
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <SkillBadge
                            label={c.label}
                            validUntil={c.validUntil}
                            state={c.state}
                          />
                          <span className="tnum text-[13px] text-ink-2">
                            {c.code}
                          </span>
                        </div>
                        <p className="tnum mt-2 text-[15px] text-ink">
                          {c.state === "expired"
                            ? `Platnost skončila ${czDay(c.validUntil)}`
                            : `Platné do ${czDay(c.validUntil)}`}
                        </p>
                        <p className="mt-1 text-[14px] text-ink-2">
                          {basisLabels[c.basis] ?? c.basis} · vydáno{" "}
                          {czDay(c.issuedAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            /* Jediná záporná odpověď — neznámý kód i neplatné členství
               vypadají stejně, jinak by šlo kódy hádat. */
            <section className="border border-hairline bg-paper-2 p-7">
              <p className="font-serif text-[18px] font-bold uppercase text-ink">
                Členství nenalezeno
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                K tomuhle kódu neevidujeme platné členství. Zkontroluj přepis —
                správný tvar je CKPD-2026-0142-XXXXXXXX.
              </p>
            </section>
          )}
        </div>

        <p className="mt-8 max-w-xl text-[13.5px] leading-relaxed text-ink-2">
          Tenhle odkaz obsahuje ověřovací kód. Sdílej ho jen s tím, komu ho
          chceš ukázat — kdo ho má, může tvoje členství doložit dál.
        </p>

        <p className="mt-6 text-[14px]">
          <Link
            href="/overit"
            className="text-brass underline underline-offset-4"
          >
            Ověřit jiný kód
          </Link>
        </p>
      </div>
    </Container>
  );
}
