import Link from "next/link";
import { fetchQuery } from "convex/nextjs";

import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/Container";
import { Row, basisLabels, czDate } from "@/components/verify/VerifyResultParts";
import { hasConvex } from "@/lib/env";

/**
 * Veřejné ověření jedné certifikace.
 *
 * Na rozdíl od výpisu člena tady odebraný certifikát JE vidět, i s důvodem:
 * někdo drží v ruce papír a musí se dozvědět, že už neplatí. „Odebráno" je
 * jiná odpověď než „neexistuje" — stejné pravidlo jako u potvrzení o kurzu.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ověření certifikace",
  description:
    "Ověření pravosti certifikace vydané Českou komorou pilotů DRONů.",
};

export default async function VerifyCredentialPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const code = decodeURIComponent(kod);

  const result = hasConvex
    ? await fetchQuery(api.publicVerify.credential, { code })
    : ({ status: "not_found" } as const);

  // zúžení do proměnné — `in` samo o sobě union z Convexu nerozliší
  const found = "label" in result ? result : null;
  const ok = result.status === "valid" || result.status === "expiring";

  return (
    <Container>
      <div className="py-14 sm:py-20">
        <p className="text-[13px] uppercase tracking-wide text-ink-2">
          Česká komora pilotů DRONů
        </p>
        <h1 className="mt-2 text-[26px] sm:text-[32px]">Ověření certifikace</h1>
        <p className="tnum mt-3 text-[15px] text-ink-2">
          Kód <span className="font-medium text-ink">{code}</span>
        </p>

        <div className="mt-8 max-w-xl">
          {(result.status === "bad_format" || result.status === "not_found") && (
            <section className="border border-hairline bg-paper-2 p-7">
              <p className="font-serif text-[18px] font-bold uppercase text-ink">
                Certifikace nenalezena
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                {result.status === "bad_format"
                  ? "Kód nemá očekávaný tvar. Zkontroluj přepis — správný tvar je CKPD-CERT-2026-XXXXXXXX."
                  : "K tomuhle kódu neevidujeme žádnou certifikaci."}
              </p>
            </section>
          )}

          {found && (
            <section
              className={
                found.status === "revoked"
                  ? "border border-destructive bg-paper p-7 shadow-paper"
                  : ok
                    ? "border border-hairline border-l-2 border-l-action bg-paper p-7 shadow-paper"
                    : "border border-hairline border-l-2 border-l-hairline bg-paper p-7 shadow-paper"
              }
            >
              <p
                className={
                  found.status === "revoked"
                    ? "font-serif text-[18px] font-bold uppercase text-destructive"
                    : ok
                      ? "font-serif text-[18px] font-bold uppercase text-action"
                      : "font-serif text-[18px] font-bold uppercase text-ink"
                }
              >
                {found.status === "revoked"
                  ? "Certifikace byla odebrána"
                  : found.status === "expired"
                    ? "Platnost certifikace skončila"
                    : "Certifikace je platná"}
              </p>

              {found.status === "expiring" && (
                <p className="mt-2 text-[15px] text-ink-2">
                  Platnost se blíží ke konci, ale certifikace zatím platí.
                </p>
              )}
              {found.status === "revoked" && found.revokedAt && (
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                  Odebráno {czDate(found.revokedAt)}.
                  {found.revokedReason ? ` Důvod: ${found.revokedReason}` : ""}
                </p>
              )}

              <dl className="mt-5">
                {found.holderName && (
                  <Row label="Držitel" value={found.holderName} />
                )}
                {found.memberNumber && (
                  <Row label="Členské číslo" value={found.memberNumber} />
                )}
                <Row label="Dovednost" value={found.label} />
                <Row
                  label="Základ"
                  value={basisLabels[found.basis] ?? found.basis}
                />
                <Row label="Vydáno" value={czDate(found.issuedAt)} />
                <Row label="Platné do" value={czDate(found.validUntil)} />
                {found.renewedAt && (
                  <Row label="Naposledy prodlouženo" value={czDate(found.renewedAt)} />
                )}
                <Row label="Vydavatel" value={found.issuerName} />
                <Row
                  label="Členství držitele"
                  value={found.membershipActive ? "platné" : "neplatné"}
                />
              </dl>

              {found.scope && (
                <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
                  Co certifikace pokrývá: {found.scope}
                </p>
              )}
              {!found.holderName && (
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
                  Držitel nedal souhlas se zveřejněním jména. Komora proto
                  potvrzuje jen pravost samotné certifikace.
                </p>
              )}
              <p className="mt-5 break-all text-[12px] text-ink-2">
                Otisk obsahu: {found.contentHash}
              </p>
            </section>
          )}
        </div>

        <p className="mt-8 text-[14px]">
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
