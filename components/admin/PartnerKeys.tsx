"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

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

/** Správa klíčů partnerů pro ověřovací API + náhled do auditu dotazů. */
export function PartnerKeys() {
  const keys = useQuery(api.partnerKeys.list);
  const calls = useQuery(api.partnerKeys.recentCalls);
  const issue = useMutation(api.partnerKeys.issue);
  const setActive = useMutation(api.partnerKeys.setActive);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { key } = await issue({ partnerName: name, contactEmail: email });
      setFresh(key);
      setName("");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Klíč se nepodařilo vydat.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: Id<"partnerKeys">, active: boolean) {
    if (active && !confirm("Zrušit klíč? Partner okamžitě ztratí přístup.")) return;
    await setActive({ id, active: !active });
  }

  return (
    <div className="mt-10 w-full max-w-4xl">
      <h2 className="text-[22px]">Partnerské klíče k ověřování členství</h2>
      <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">
        Každý partner dostane vlastní klíč — zrušení jednoho se ostatních
        nedotkne a v auditu je vidět, kdo se ptal. Klíč se ukáže jen jednou
        při vydání; ztracený se nedá obnovit, jen nahradit novým.
      </p>

      {fresh && (
        <div className="mt-6 border border-brass bg-brass-2/30 p-5">
          <p className="text-[14px] font-semibold text-deep">
            Zkopíruj klíč teď — už ho neuvidíš.
          </p>
          <code className="mt-3 block select-all break-all border border-hairline bg-paper px-3 py-2.5 font-mono text-[14px] text-ink">
            {fresh}
          </code>
          <div className="mt-3 flex gap-4">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(fresh);
                toast.success("Klíč zkopírován.");
              }}
              className="text-[14px] text-deep underline-offset-4 hover:underline"
            >
              Kopírovat
            </button>
            <button
              type="button"
              onClick={() => setFresh(null)}
              className="text-[14px] text-ink-2 underline-offset-4 hover:underline"
            >
              Mám ho, zavřít
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleIssue} className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex-1">
          <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
            Partner
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="DRONPRO s.r.o."
            className="w-full rounded-[2px] border border-hairline bg-paper px-3 py-2 text-[15px] text-ink focus:border-deep"
          />
        </label>
        <label className="flex-1">
          <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
            Kontaktní e-mail
          </span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-[2px] border border-hairline bg-paper px-3 py-2 text-[15px] text-ink focus:border-deep"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-[2px] bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-50"
        >
          Vydat klíč
        </button>
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              {["Partner", "Klíč", "Limit/min", "Dotazů 30 dní", "Naposledy", "Stav", ""].map(
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
            {(keys ?? []).map((k) => (
              <tr key={k._id} className="border-b border-hairline">
                <td className="py-3 pr-4 text-[14.5px] text-ink">
                  {k.partnerName}
                  <span className="block text-[12.5px] text-ink-2">
                    {k.contactEmail}
                  </span>
                </td>
                <td className="py-3 pr-4 font-mono text-[13px] text-ink-2">
                  {k.keyPrefix}…
                </td>
                <td className="tnum py-3 pr-4 text-[14.5px] text-ink-2">
                  {k.rateLimitPerMin}
                </td>
                <td className="tnum py-3 pr-4 text-[14.5px] text-ink-2">
                  {k.calls30d}
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
                <td className="py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggle(k._id, k.active)}
                    className="text-[13.5px] text-deep underline-offset-4 hover:underline"
                  >
                    {k.active ? "Zrušit" : "Obnovit"}
                  </button>
                </td>
              </tr>
            ))}
            {keys?.length === 0 && (
              <tr>
                <td colSpan={7} className="py-5 text-[14.5px] text-ink-2">
                  Zatím žádný partner.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="mt-12 text-[18px]">Poslední dotazy</h3>
      <p className="mt-2 text-[14px] text-ink-2">
        Zaznamenávají se i neúspěšné pokusy — jinak by nešlo poznat, že si
        někdo kódy zkouší hádat. Uchováváme 90 dní.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <tbody>
            {(calls ?? []).map((c) => (
              <tr key={c._id} className="border-b border-hairline">
                <td className="tnum py-2 pr-4 text-[13.5px] text-ink-2">
                  {new Date(c.at).toLocaleString("cs-CZ")}
                </td>
                <td className="py-2 pr-4 text-[13.5px] text-ink">{c.partner}</td>
                <td className="py-2 pr-4 font-mono text-[12.5px] text-ink-2">
                  {c.codeLookup || "—"}
                </td>
                <td className="py-2 text-[13.5px] text-ink-2">
                  {resultLabels[c.result] ?? c.result}
                </td>
              </tr>
            ))}
            {calls?.length === 0 && (
              <tr>
                <td className="py-4 text-[14px] text-ink-2">Zatím nikdo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
