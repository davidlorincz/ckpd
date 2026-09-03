"use client";

import { Fragment, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Testovací prostředí ověřovacího API.
 *
 * Tři věci na jednom místě, protože se používají naráz: čím se ptát
 * (klíče), na co se ptát (kódy) a co z toho vylezlo (log i s payloadem).
 */

const ENDPOINT = "https://ckpd.cz/api/v1/sandbox/verify";

const fmt = (ts?: number) =>
  ts ? new Date(ts).toLocaleDateString("cs-CZ") : "—";

const resultLabels: Record<string, string> = {
  valid: "platné",
  not_found: "neznámý kód",
  inactive: "neplatné členství",
  bad_format: "špatný tvar",
  rate_limited: "limit",
  unauthorized: "bez přístupu",
};

const tierLabels: Record<string, string> = {
  zakladni: "Základní",
  pro: "PRO",
  cestne: "Čestné",
};

/** Případy, které nemají svůj řádek v sadě — vzniknou samotným vstupem. */
const EXTRA_CASES = [
  {
    input: "CKPD-2026-9999-ZZZZZZZZ",
    result: '{"valid": false}',
    note: "Správný tvar, neexistující kód. V logu `not_found`.",
  },
  {
    input: "CKPD-2026-9001",
    result: '{"valid": false}',
    note: "Holé členské číslo bez tajemství API odmítá — jinak by šlo projet 0001–9999. V logu `bad_format`.",
  },
  {
    input: "ckpd 2026 9001 test9001",
    result: "stejná odpověď jako u CKPD-2026-9001-TEST9001",
    note: "Malá písmena i mezery místo pomlček projdou — člen kód opisuje z obrazovky.",
  },
  {
    input: "ostrý klíč ckpd_live_… na testovací adrese",
    result: '401 {"error": "unauthorized"}',
    note: "Klíč platí jen ve svém světě. Naopak testovacím klíčem se reálný člen dohledat nedá.",
  },
];

/** Odpověď se ukládá jako JSON; kdyby se náhodou nedala přečíst, ukáže se syrová. */
function pretty(body?: string): string {
  if (!body) return "—";
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

function copy(text: string, label = "Zkopírováno.") {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

export function SandboxAdmin() {
  const keys = useQuery(api.partnerKeys.list);
  const fixtures = useQuery(api.sandbox.fixtures);
  const calls = useQuery(api.sandbox.recentCalls);
  const issueTestKeys = useMutation(api.sandbox.issueTestKeys);

  const [fresh, setFresh] = useState<
    { partnerName: string; key: string; purpose: string }[] | null
  >(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<Id<"verificationLog"> | null>(null);

  const testKeys = (keys ?? []).filter((k) => k.mode === "test");

  async function handleIssue() {
    if (
      testKeys.some((k) => k.active) &&
      !confirm(
        "Vydat novou sadu? Stávající testovací klíče se zruší a přestanou fungovat.",
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const { keys: issued } = await issueTestKeys();
      setFresh(issued);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Klíče se nepodařilo vydat.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 w-full max-w-4xl">
      {/* ─────────────────────────────── adresa ─────────────────────────── */}
      <h2 className="text-[22px]">Adresa</h2>
      <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">
        Pískoviště má vlastní cestu, ale stejný kód i stejný tvar odpovědí jako
        ostrý provoz — partner při přechodu do produkce mění jen adresu a klíč.
        Testovací kódy v ostrém API nefungují a ostré kódy tady taky ne.
      </p>
      <button
        type="button"
        onClick={() =>
          copy(
            `curl -s -H "Authorization: Bearer <klíč>" "${ENDPOINT}?code=CKPD-2026-9001-TEST9001"`,
            "Příkaz zkopírován.",
          )
        }
        className="mt-4 block w-full select-all break-all border border-hairline bg-paper px-3 py-2.5 text-left font-mono text-[13.5px] text-ink hover:border-deep"
      >
        GET {ENDPOINT}?code=…
      </button>

      {/* ──────────────────────────────── klíče ─────────────────────────── */}
      <h2 className="mt-12 text-[22px]">Testovací klíče</h2>
      <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">
        Tři klíče, aby šly vyzkoušet i chybové stavy: běžný provoz, zrušený
        klíč (401) a nízký limit (429). V databázi je jen otisk — plaintexty se
        ukážou jednou při vydání, pak už nikdy.
      </p>

      {fresh && (
        <div className="mt-6 border border-brass bg-brass-2/30 p-5">
          <p className="text-[14px] font-semibold text-deep">
            Zkopíruj klíče teď — už je neuvidíš.
          </p>
          {fresh.map((k) => (
            <div key={k.partnerName} className="mt-4">
              <p className="text-[13.5px] text-ink">
                {k.partnerName}
                <span className="block text-[12.5px] text-ink-2">
                  {k.purpose}
                </span>
              </p>
              <code
                onClick={() => copy(k.key, "Klíč zkopírován.")}
                className="mt-1.5 block cursor-pointer select-all break-all border border-hairline bg-paper px-3 py-2.5 font-mono text-[14px] text-ink"
              >
                {k.key}
              </code>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFresh(null)}
            className="mt-4 text-[14px] text-ink-2 underline-offset-4 hover:underline"
          >
            Mám je, zavřít
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleIssue}
        disabled={busy}
        className="mt-6 rounded-[2px] bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-50"
      >
        {testKeys.length ? "Vydat novou sadu" : "Vydat sadu testovacích klíčů"}
      </button>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              {["Klíč", "Prefix", "Limit/min", "Naposledy", "Stav"].map((h) => (
                <th
                  key={h}
                  className="py-2.5 pr-4 text-[12.5px] font-medium uppercase tracking-wider text-ink-2"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {testKeys.map((k) => (
              <tr key={k._id} className="border-b border-hairline">
                <td className="py-3 pr-4 text-[14.5px] text-ink">
                  {k.partnerName}
                </td>
                <td className="py-3 pr-4 font-mono text-[13px] text-ink-2">
                  {k.keyPrefix}…
                </td>
                <td className="tnum py-3 pr-4 text-[14.5px] text-ink-2">
                  {k.rateLimitPerMin}
                </td>
                <td className="tnum py-3 pr-4 text-[14.5px] text-ink-2">
                  {fmt(k.lastUsedAt)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      "rounded-[2px] px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider " +
                      (k.active
                        ? "bg-action text-white"
                        : "border border-hairline text-ink-2")
                    }
                  >
                    {k.active ? "aktivní" : "zrušený"}
                  </span>
                </td>
              </tr>
            ))}
            {keys && testKeys.length === 0 && (
              <tr>
                <td colSpan={5} className="py-5 text-[14.5px] text-ink-2">
                  Sada zatím nebyla vydaná.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ──────────────────────────────── kódy ──────────────────────────── */}
      <h2 className="mt-12 text-[22px]">Testovací kódy</h2>
      <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">
        Fiktivní členové. Neexistují v evidenci, takže nic nezkreslují ani se
        neobjeví ve veřejném seznamu. Data konce období jsou relativní ke
        dnešku — sada tak popisuje pořád ty stavy, kvůli kterým vznikla.
        Klikni na kód pro zkopírování.
      </p>

      {!fixtures && <div className="mt-6 h-64 animate-pulse border border-hairline bg-paper-2" />}

      {fixtures && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                {["Kód", "Odpověď", "Varianta", "Platí do", "K čemu je"].map(
                  (h) => (
                    <th
                      key={h}
                      className="py-2.5 pr-4 text-[12.5px] font-medium uppercase tracking-wider text-ink-2"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {fixtures.map((f) => (
                <tr key={f.code} className="border-b border-hairline align-top">
                  <td className="py-3 pr-4">
                    <button
                      type="button"
                      onClick={() => copy(f.code, "Kód zkopírován.")}
                      className="font-mono text-[13px] text-ink hover:text-deep hover:underline"
                    >
                      {f.code}
                    </button>
                    <span className="block text-[12.5px] text-ink-2">
                      {f.name}
                      {!f.publicListing && " · bez souhlasu se zveřejněním"}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        "rounded-[2px] px-2 py-0.5 text-[12px] font-semibold uppercase tracking-wider " +
                        (f.valid
                          ? "bg-action text-white"
                          : "border border-hairline text-ink-2")
                      }
                    >
                      {f.valid ? "valid: true" : "valid: false"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[14px] text-ink-2">
                    {f.tier ? tierLabels[f.tier] : "—"}
                    <span className="block text-[12.5px] text-ink-2">
                      {f.status}
                    </span>
                  </td>
                  <td className="tnum py-3 pr-4 text-[14px] text-ink-2">
                    {f.paidUntil ?? "—"}
                  </td>
                  <td className="py-3 pr-4 text-[13.5px] text-ink-2">
                    {f.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mt-10 text-[16px]">Případy bez vlastního kódu</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <tbody>
            {EXTRA_CASES.map((c) => (
              <tr key={c.input} className="border-b border-hairline align-top">
                <td className="py-3 pr-4 font-mono text-[13px] text-ink">
                  {c.input}
                </td>
                <td className="py-3 pr-4 font-mono text-[12.5px] text-ink-2">
                  {c.result}
                </td>
                <td className="py-3 text-[13.5px] text-ink-2">{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ───────────────────────────────── log ──────────────────────────── */}
      <h2 className="mt-12 text-[22px]">Log testovacích dotazů</h2>
      <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">
        Posledních 200 dotazů do pískoviště včetně neúspěšných. Klikni na
        řádek pro celý payload — přesně to, co partnerovi odešlo.
      </p>

      {!calls && <div className="mt-4 h-40 animate-pulse border border-hairline bg-paper-2" />}

      {calls && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <tbody>
              {calls.map((c) => (
                <Fragment key={c._id}>
                  <tr
                    onClick={() => setOpen(open === c._id ? null : c._id)}
                    className="cursor-pointer border-b border-hairline hover:bg-paper-2"
                  >
                    <td className="tnum py-2 pr-4 text-[13.5px] text-ink-2">
                      {new Date(c.at).toLocaleString("cs-CZ")}
                    </td>
                    <td className="py-2 pr-4 text-[13.5px] text-ink">
                      {c.partner}
                    </td>
                    <td className="py-2 pr-4 font-mono text-[12.5px] text-ink-2">
                      {c.requestCode || c.codeLookup || "—"}
                    </td>
                    <td className="tnum py-2 pr-4 text-[13.5px] text-ink-2">
                      {c.httpStatus ?? "—"}
                    </td>
                    <td className="py-2 text-[13.5px] text-ink-2">
                      {resultLabels[c.result] ?? c.result}
                    </td>
                  </tr>
                  {open === c._id && (
                    <tr className="border-b border-hairline">
                      <td colSpan={5} className="py-3">
                        {c.fixtureNote && (
                          <p className="mb-2 text-[13px] text-ink-2">
                            {c.fixtureNote}
                          </p>
                        )}
                        <pre className="overflow-x-auto border border-hairline bg-paper px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-ink">
                          {`GET ${ENDPOINT}?code=${c.requestCode ?? "—"}\n\nHTTP ${c.httpStatus ?? "?"}\n${pretty(c.responseBody)}`}
                        </pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {calls.length === 0 && (
                <tr>
                  <td className="py-4 text-[14px] text-ink-2">
                    Zatím se nikdo neptal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
