"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SKILLS, validityLabel } from "@/lib/skills";

const fmt = (ts?: number | null) =>
  ts ? new Date(ts).toLocaleDateString("cs-CZ") : "—";

const isoDay = (ts: number) => new Date(ts).toISOString().slice(0, 10);

const stateLabels: Record<string, string> = {
  valid: "platné",
  expiring: "končí platnost",
  expired: "vypršelo",
  revoked: "odebráno",
};

const basisOptions = [
  { value: "zkouska", label: "Zkouška ve školicím středisku" },
  { value: "portfolio", label: "Doložené portfolio" },
  { value: "kurz", label: "Absolvovaný kurz" },
  { value: "praxe", label: "Doložená praxe" },
] as const;

const input =
  "w-full rounded-[2px] border border-hairline bg-paper px-3 py-2 text-[15px] text-ink focus:border-deep";
const button =
  "rounded-[2px] bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-50";
const linkBtn = "text-[13.5px] text-ink-2 underline-offset-4 hover:underline";

/** Vydávání, prodlužování a odebírání certifikací. */
export function CredentialAdmin() {
  const expiring = useQuery(api.credentials.adminExpiringSoon);
  const [q, setQ] = useState("");
  const found = useQuery(api.credentials.adminFindMembers, q.trim().length >= 2 ? { q } : "skip");

  const [memberId, setMemberId] = useState<Id<"members"> | null>(null);
  const [memberLabel, setMemberLabel] = useState<string>("");
  const rows = useQuery(
    api.credentials.adminListForMember,
    memberId ? { memberId } : "skip",
  );

  const issue = useMutation(api.credentials.issue);
  const renew = useMutation(api.credentials.renew);
  const revoke = useMutation(api.credentials.revoke);
  const setValidUntil = useMutation(api.credentials.setValidUntil);

  const [skill, setSkill] = useState<string>(SKILLS[0].key);
  const [basis, setBasis] = useState<string>("zkouska");
  const [note, setNote] = useState("");
  const [issuedAt, setIssuedAt] = useState(isoDay(Date.now()));
  const [busy, setBusy] = useState(false);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setBusy(true);
    try {
      const res = await issue({
        memberId,
        skill,
        basis: basis as "zkouska" | "portfolio" | "kurz" | "praxe",
        note: note.trim() || undefined,
        issuedAt: Date.parse(`${issuedAt}T12:00:00Z`),
      });
      toast.success(
        res.reused
          ? `Člen už platnou certifikaci má: ${res.code}`
          : `Vydáno ${res.code}, platné do ${fmt(res.validUntil)}`,
      );
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Vydání selhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 w-full max-w-4xl">
      {/* Co hoří: tohle admin otevírá nejčastěji, proto nahoře. */}
      {expiring && expiring.length > 0 && (
        <section className="border border-brass bg-brass-2/30 p-5">
          <h2 className="text-[18px]">Blíží se konec platnosti</h2>
          <table className="mt-4 w-full border-collapse text-left">
            <tbody>
              {expiring.map((c) => (
                <tr key={c._id} className="border-b border-hairline last:border-b-0">
                  <td className="py-2.5 pr-4 text-[14.5px] text-ink">
                    {c.holderName}
                    <span className="tnum block text-[12.5px] text-ink-2">
                      {c.memberNumber ?? "—"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-[14.5px] text-ink-2">{c.label}</td>
                  <td className="tnum py-2.5 pr-4 text-[14.5px] text-ink-2">
                    {fmt(c.validUntil)}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      type="button"
                      className={linkBtn}
                      onClick={async () => {
                        const r = await renew({ id: c._id });
                        toast.success(`Prodlouženo do ${fmt(r.validUntil)}`);
                      }}
                    >
                      Prodloužit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-[22px]">Certifikace člena</h2>
        <p className="measure mt-3 text-[15px] leading-relaxed text-ink-2">
          Najdi člena podle jména, e-mailu nebo členského čísla. Vydat
          certifikaci jde jen aktivnímu členovi s přiděleným číslem.
        </p>

        <label className="mt-6 block max-w-md">
          <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
            Hledat člena
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Novák, novak@…, CKPD-2026-0142"
            className={input}
          />
        </label>

        {found && found.length > 0 && (
          <ul className="mt-3 max-w-md border border-hairline bg-paper">
            {found.map((m) => (
              <li key={m._id} className="border-b border-hairline last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setMemberId(m._id);
                    setMemberLabel(
                      `${m.name || m.email}${m.memberNumber ? ` · ${m.memberNumber}` : ""}`,
                    );
                    setQ("");
                  }}
                  className="block w-full px-3 py-2.5 text-left hover:bg-paper-2"
                >
                  <span className="text-[14.5px] text-ink">
                    {m.name || m.email}
                  </span>
                  <span className="tnum block text-[12.5px] text-ink-2">
                    {m.memberNumber ?? "bez čísla"} · {m.status}
                    {m.publicListing ? " · zveřejněn" : " · nezveřejněn"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {memberId && (
        <section className="mt-8 border border-hairline bg-paper p-5">
          <h3 className="text-[18px]">{memberLabel}</h3>

          {rows && rows.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-hairline">
                    {["Obor", "Kód", "Vydáno", "Platné do", "Stav", ""].map((h) => (
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
                  {rows.map((c) => (
                    <tr key={c._id} className="border-b border-hairline">
                      <td className="py-3 pr-4 text-[14.5px] text-ink">{c.label}</td>
                      <td className="tnum py-3 pr-4 font-mono text-[13px] text-ink-2">
                        {c.code}
                      </td>
                      <td className="tnum py-3 pr-4 text-[14px] text-ink-2">
                        {fmt(c.issuedAt)}
                      </td>
                      <td className="tnum py-3 pr-4 text-[14px] text-ink-2">
                        {fmt(c.validUntil)}
                      </td>
                      <td className="py-3 pr-4 text-[14px] text-ink-2">
                        {stateLabels[c.state]}
                      </td>
                      <td className="py-3 text-right">
                        {c.state !== "revoked" && (
                          <span className="flex flex-wrap justify-end gap-3">
                            <button
                              type="button"
                              className={linkBtn}
                              onClick={async () => {
                                const r = await renew({ id: c._id });
                                toast.success(`Prodlouženo do ${fmt(r.validUntil)}`);
                              }}
                            >
                              Prodloužit
                            </button>
                            <button
                              type="button"
                              className={linkBtn}
                              onClick={async () => {
                                const val = prompt(
                                  "Nové datum platnosti (RRRR-MM-DD):",
                                  isoDay(c.validUntil),
                                );
                                if (!val) return;
                                const ms = Date.parse(`${val}T12:00:00Z`);
                                if (Number.isNaN(ms)) {
                                  toast.error("Datum nedává smysl.");
                                  return;
                                }
                                await setValidUntil({ id: c._id, validUntil: ms });
                                toast.success("Datum upraveno.");
                              }}
                            >
                              Upravit datum
                            </button>
                            <button
                              type="button"
                              className={linkBtn}
                              onClick={async () => {
                                const reason = prompt(
                                  "Důvod odebrání (uvidí ho každý, kdo si certifikaci ověří):",
                                );
                                if (!reason?.trim()) return;
                                await revoke({ id: c._id, reason });
                                toast.success("Certifikace odebrána.");
                              }}
                            >
                              Odebrat
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <form onSubmit={handleIssue} className="mt-6 flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
                Obor
              </span>
              <select
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className={input}
              >
                {SKILLS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label} — {validityLabel(s.validityYears)}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[220px] flex-1">
              <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
                Základ
              </span>
              <select
                value={basis}
                onChange={(e) => setBasis(e.target.value)}
                className={input}
              >
                {basisOptions.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
                Vydáno
              </span>
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className={input}
              />
            </label>
            <label className="min-w-[240px] flex-1">
              <span className="mb-1.5 block text-[13px] uppercase tracking-wider text-ink-2">
                Poznámka (nepovinná)
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={input}
              />
            </label>
            <button type="submit" disabled={busy} className={button}>
              {busy ? "Vydávám…" : "Vydat certifikaci"}
            </button>
          </form>

          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            Kód se nikam neztratí — je vidět v tabulce výše i v účtu člena.
            Odebrání je trvalé, důvod uvidí každý, kdo si certifikaci ověří.
          </p>
        </section>
      )}
    </div>
  );
}
