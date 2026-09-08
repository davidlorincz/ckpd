"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hasConvex } from "@/lib/env";
import { tierLabels } from "@/lib/membership";
import { skillByKey } from "@/lib/skills";
import { SkillBadge } from "@/components/credentials/SkillBadge";

/**
 * Veřejný seznam členů. Zdrojem je evidence v Convexu — vrací výhradně
 * aktivní členy se souhlasem se zveřejněním (`members.listPublic`).
 */
function MembersTableInner() {
  const members = useQuery(api.members.listPublic);

  if (members === undefined) {
    return (
      <div className="h-40 animate-pulse border border-hairline bg-paper-2" />
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-[15.5px] leading-relaxed text-ink-2">
        Seznam se plní — první členové se souhlasem se zveřejněním se tu
        objeví, jakmile jejich členství začne platit.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline text-[13.5px] uppercase tracking-wider text-ink-2">
            {[
              "Člen",
              "Členské číslo",
              "Členství",
              "Certifikace",
              "Kraj",
              "Popis",
            ].map((h) => (
              <th key={h} className="py-3 pr-4 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.memberNumber ?? m.name} className="border-b border-hairline">
              <td className="py-3.5 pr-4 font-medium text-ink">{m.name}</td>
              <td className="tnum py-3.5 pr-4 font-mono text-[14px] text-ink-2">
                {m.memberNumber ?? "—"}
              </td>
              <td className="py-3.5 pr-4 text-ink-2">{tierLabels[m.tier]}</td>
              {/* jen platné certifikace — vypršelý doklad ve výpisu neplatí */}
              <td className="py-3.5 pr-4">
                {m.credentials.length === 0 ? (
                  <span className="text-ink-2">—</span>
                ) : (
                  <span className="flex flex-wrap gap-1">
                    {m.credentials.map((c) => (
                      // krátký tvar z číselníku — tři plné názvy by řádek
                      // roztáhly přes celou tabulku
                      <SkillBadge
                        key={c.skill}
                        label={skillByKey(c.skill)?.short ?? c.label}
                        validUntil={c.validUntil}
                      />
                    ))}
                  </span>
                )}
              </td>
              <td className="py-3.5 pr-4 text-ink-2">{m.region ?? "—"}</td>
              <td className="py-3.5 text-[14.5px] text-ink-2">
                {m.profile ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MembersTable() {
  if (!hasConvex) {
    return (
      <p className="text-[15.5px] text-ink-2">Evidence členů zatím neběží.</p>
    );
  }
  return <MembersTableInner />;
}
