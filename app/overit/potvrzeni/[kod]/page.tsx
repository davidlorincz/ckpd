import Link from "next/link";
import { fetchQuery } from "convex/nextjs";

import { api } from "@/convex/_generated/api";
import { Container } from "@/components/ui/Container";
import { hasConvex } from "@/lib/env";
import { formatTotal } from "@/lib/digiuniverzita";

/**
 * Veřejné ověření potvrzení o absolvování.
 *
 * Záměrně mimo členskou sekci a bez přihlášení — potvrzení má smysl jen
 * tehdy, když si ho může ověřit zaměstnavatel nebo úřad, ne jen jeho držitel.
 * Stránka je dynamická: odvolané potvrzení se musí projevit okamžitě.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ověření potvrzení o absolvování",
  description:
    "Ověření pravosti potvrzení o absolvování kurzu DIGI univerzity ČKPD.",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-hairline py-3 last:border-b-0">
      <dt className="text-[15px] text-ink-2">{label}</dt>
      <dd className="text-[15px] font-medium text-ink">{value}</dd>
    </div>
  );
}

const czDate = (ms: number) =>
  new Date(ms).toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function VerifyCompletionPage({
  params,
}: {
  params: Promise<{ kod: string }>;
}) {
  const { kod } = await params;
  const code = decodeURIComponent(kod);

  const result = hasConvex
    ? await fetchQuery(api.completions.verifyPublic, { code })
    : ({ status: "not_found" } as const);

  return (
    <Container>
      <div className="py-14 sm:py-20">
        <p className="text-[13px] uppercase tracking-wide text-ink-2">
          DIGI univerzita ČKPD
        </p>
        <h1 className="mt-2 text-[26px] sm:text-[32px]">
          Ověření potvrzení
        </h1>
        <p className="mt-3 text-[15px] text-ink-2 tnum">
          Kód <span className="font-medium text-ink">{code}</span>
        </p>

        <div className="mt-8 max-w-xl">
          {result.status === "valid" && (
            <section className="border border-hairline border-l-2 border-l-action bg-paper p-7 shadow-paper">
              <p className="font-serif text-[18px] font-bold uppercase text-action">
                Potvrzení je platné
              </p>
              <dl className="mt-5">
                <Row label="Držitel" value={result.snapshot.holderName} />
                {result.snapshot.memberNumber && (
                  <Row
                    label="Členské číslo"
                    value={result.snapshot.memberNumber}
                  />
                )}
                <Row label="Kurz" value={result.snapshot.courseTitle} />
                <Row
                  label="Rozsah"
                  value={`${result.snapshot.lessonsCompleted} lekcí · ${formatTotal(result.snapshot.totalDurationSeconds)}`}
                />
                <Row label="Vydáno" value={czDate(result.issuedAt)} />
                <Row label="Vydavatel" value={result.snapshot.issuerName} />
              </dl>
              <p className="mt-5 break-all text-[12px] text-ink-2">
                Otisk obsahu: {result.contentHash}
              </p>
            </section>
          )}

          {/* „Odebráno" musí být jiná odpověď než „neexistuje" — jinak
              nejde poznat rozdíl mezi zrušeným a vymyšleným potvrzením. */}
          {result.status === "revoked" && (
            <section className="border border-destructive bg-paper p-7 shadow-paper">
              <p className="font-serif text-[18px] font-bold uppercase text-destructive">
                Potvrzení bylo odebráno
              </p>
              <p className="mt-2 text-[15px] text-ink-2">
                Vydáno {czDate(result.issuedAt)}, odebráno{" "}
                {czDate(result.revokedAt)}.
                {result.reason ? ` Důvod: ${result.reason}` : ""}
              </p>
              <dl className="mt-5">
                <Row label="Držitel" value={result.snapshot.holderName} />
                <Row label="Kurz" value={result.snapshot.courseTitle} />
              </dl>
            </section>
          )}

          {(result.status === "not_found" || result.status === "bad_format") && (
            <section className="border border-hairline bg-paper-2 p-7">
              <p className="font-serif text-[18px] font-bold uppercase text-ink">
                Potvrzení nenalezeno
              </p>
              <p className="mt-2 text-[15px] text-ink-2">
                {result.status === "bad_format"
                  ? "Kód nemá očekávaný tvar. Zkontroluj přepis — správný tvar je CKPD-DU-2026-XXXXXXXX."
                  : "K tomuhle kódu neevidujeme žádné potvrzení."}
              </p>
            </section>
          )}
        </div>

        <p className="mt-10 text-[14px] text-ink-2">
          <Link
            href="/kontakt"
            className="text-brass underline underline-offset-4"
          >
            Máš pochybnost? Ozvi se komoře.
          </Link>
        </p>
      </div>
    </Container>
  );
}
