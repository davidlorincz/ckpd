/**
 * Veřejné ověření na webu — člen a jeho certifikace.
 *
 * Tohle je bezpečnostní povrch, proto vlastní soubor. Partnerské REST API
 * (`convex/verification.ts`, `/api/v1/verify`) zůstává nedotčené; tady jde
 * o stránku `/overit`, kterou otevře zaměstnavatel nebo úřad bez klíče.
 *
 * INVARIANTY — zopakované z `verification.ts` a nesmí se rozvolnit:
 *  1) Lookup VÝHRADNĚ podle ověřovacího kódu. Nikdy podle jména, e-mailu ani
 *     samotného členského čísla — to je pořadové a šlo by projet od 0001.
 *  2) Jediná záporná odpověď `{ valid: false }` pro špatný tvar, neznámý kód
 *     i neaktivní členství. Rozlišení by bylo nápověda pro hádání.
 *  3) Jméno jen se souhlasem `publicListing`, bez cachování — odvolání
 *     souhlasu se musí projevit okamžitě.
 *  4) Nikdy nevracet e-mail, telefon, IČO, `uclOperator` ani žádné `_id`.
 *
 * Certifikace mají dvojí režim, a je to záměr:
 *  - výpis člena ODEBRANÉ neuvádí (ptáme se „co umí", ne co mu vzali),
 *  - přímý dotaz na kód certifikace ji vrací se stavem `revoked` (někdo drží
 *    v ruce papír a musí se dozvědět, že neplatí).
 * Vypršelé se vracejí v obou cestách.
 *
 * Bez auditu do `verificationLog`: query je read-only a ten log patří
 * partnerskému API. Tajemství má 40 bitů a odpověď nedává žádnou nápovědu.
 */
import { v } from "convex/values";

import { query } from "./_generated/server";
import { normalizeCode, normalizeCredentialCode } from "./lib/code";
import { isMembershipActive } from "./lib/membershipState";
import { credentialState, skillByKey } from "./lib/skills";

/** Ceník. Drží se stejný jako `membershipTiers` v lib/site.ts. */
const TIERS = {
  zakladni: { label: "Základní" },
  pro: { label: "PRO" },
  cestne: { label: "Čestné" },
} as const;

const isoDay = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Jediné místo, kde vzniká záporná odpověď — proto je vždy identická. */
const NOT_VALID = { valid: false } as const;

export const member = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const lookup = normalizeCode(code);
    if (!lookup) return NOT_VALID;

    const doc = await ctx.db
      .query("members")
      .withIndex("by_code", (q) => q.eq("verificationCodeLookup", lookup))
      .unique();
    if (!doc) return NOT_VALID;

    const now = Date.now();
    if (!isMembershipActive(doc, now)) return NOT_VALID;

    const rows = await ctx.db
      .query("credentials")
      .withIndex("by_member", (q) => q.eq("memberId", doc._id))
      .collect();

    const credentials = rows
      .filter((c) => c.revokedAt === undefined)
      .map((c) => ({
        skill: c.skill,
        label: c.snapshot.skillLabel,
        code: c.code,
        basis: c.basis,
        issuedAt: isoDay(c.issuedAt),
        validUntil: isoDay(c.validUntil),
        state: credentialState(c, now),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "cs"));

    const tier = doc.tier ?? "zakladni";
    return {
      valid: true as const,
      memberNumber: doc.memberNumber ?? null,
      tier,
      tierLabel: TIERS[tier].label,
      memberSince: doc.memberSince ? isoDay(doc.memberSince) : null,
      paidUntil: doc.currentPeriodEnd ? isoDay(doc.currentPeriodEnd) : null,
      // jméno i kraj jen se souhlasem se zveřejněním
      name: doc.publicListing ? doc.name : null,
      region: doc.publicListing ? (doc.region ?? null) : null,
      credentials,
    };
  },
});

/**
 * Tvar odpovědi je vypsaný ručně, aby to byl pravý diskriminovaný union —
 * bez toho si TypeScript na stránce sloučí větve do jednoho objektu
 * s volitelnými poli a zúžení podle `status` přestane fungovat.
 */
export type PublicCredentialResult =
  | { status: "bad_format" }
  | { status: "not_found" }
  | {
      status: "valid" | "expiring" | "expired" | "revoked";
      code: string;
      skill: string;
      label: string;
      scope: string | null;
      basis: "zkouska" | "portfolio" | "kurz" | "praxe";
      issuedAt: number;
      validUntil: number;
      renewedAt: number | null;
      revokedAt: number | null;
      revokedReason: string | null;
      holderName: string | null;
      memberNumber: string | null;
      membershipActive: boolean;
      issuerName: string;
      contentHash: string;
    };

export const credential = query({
  args: { code: v.string() },
  handler: async (ctx, { code }): Promise<PublicCredentialResult> => {
    const lookup = normalizeCredentialCode(code);
    if (!lookup) return { status: "bad_format" as const };

    const row = await ctx.db
      .query("credentials")
      .withIndex("by_code", (q) => q.eq("codeLookup", lookup))
      .unique();
    if (!row) return { status: "not_found" as const };

    const now = Date.now();
    const holder = await ctx.db.get(row.memberId);
    const publicListing = holder?.publicListing ?? false;

    return {
      status: credentialState(row, now),
      code: row.code,
      skill: row.skill,
      label: row.snapshot.skillLabel,
      scope: skillByKey(row.skill)?.scope ?? null,
      basis: row.basis,
      issuedAt: row.issuedAt,
      validUntil: row.validUntil,
      renewedAt: row.renewals.at(-1)?.at ?? null,
      revokedAt: row.revokedAt ?? null,
      revokedReason: row.revokedReason ?? null,
      holderName: publicListing ? row.snapshot.holderName : null,
      memberNumber: row.snapshot.memberNumber ?? null,
      /** Certifikace platí i bez členství, ale ověřovatel má právo to vědět. */
      membershipActive: holder ? isMembershipActive(holder, now) : false,
      issuerName: row.snapshot.issuerName,
      contentHash: row.contentHash,
    };
  },
});
