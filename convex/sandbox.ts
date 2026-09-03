import { internalMutation, mutation, query } from "./_generated/server";
import { requireAdmin, subjectOf } from "./lib/auth";
import type { MutationCtx } from "./_generated/server";
import { generatePartnerKey, hashKey, keyModeOf, keyPrefixOf } from "./lib/code";
import { SANDBOX_MEMBERS, findSandboxMember, resolveSandbox } from "./lib/sandbox";

/**
 * Testovací prostředí ověřovacího API — přehled pro administraci.
 *
 * Data testovacích členů jsou v `lib/sandbox.ts`; tady se jen rozpouštějí
 * relativní data k dnešku a čte se audit. Zdroj pravdy je kód, aby admin,
 * dokumentace i samotné API viděly totéž.
 */

/** Kolik posledních testovacích dotazů se ukazuje. */
const LOG_LIMIT = 200;

/**
 * Testovací kódy i s tím, co na ně API vrátí. Bez `requireAdmin` — kódy
 * jsou veřejná dokumentace pro partnery a stojí i v docs/.
 */
export const fixtures = query({
  args: {},
  handler: async () => {
    const now = Date.now();

    return SANDBOX_MEMBERS.map((m) => {
      const resolved = resolveSandbox(m, now);
      const expired =
        resolved.currentPeriodEnd !== undefined &&
        resolved.currentPeriodEnd < now;

      return {
        code: m.code,
        memberNumber: m.memberNumber,
        name: m.name,
        tier: m.tier ?? null,
        status: m.status,
        publicListing: m.publicListing,
        note: m.note,
        /** Co endpoint vrátí — ať to admin vidí bez ptaní se API. */
        valid: resolved.status === "active" && !expired,
        memberSince: resolved.memberSince
          ? new Date(resolved.memberSince).toISOString().slice(0, 10)
          : null,
        paidUntil: resolved.currentPeriodEnd
          ? new Date(resolved.currentPeriodEnd).toISOString().slice(0, 10)
          : null,
      };
    });
  },
});

/** Dotazy do pískoviště včetně celého payloadu. */
export const recentCalls = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const rows = await ctx.db
      .query("verificationLog")
      .withIndex("by_mode_at", (q) => q.eq("mode", "test"))
      .order("desc")
      .take(LOG_LIMIT);

    const names = new Map<string, string>();
    return await Promise.all(
      rows.map(async (r) => {
        let partner = "—";
        if (r.partnerKeyId) {
          const cached = names.get(r.partnerKeyId);
          if (cached) partner = cached;
          else {
            const k = await ctx.db.get(r.partnerKeyId);
            partner = k?.partnerName ?? "smazaný klíč";
            names.set(r.partnerKeyId, partner);
          }
        }

        // Ke kódu se dohledá popis fixtury, ať je v logu hned vidět,
        // který okrajový stav se zkoušel.
        const fixture = r.codeLookup ? findSandboxMember(r.codeLookup) : undefined;

        return {
          _id: r._id,
          at: r.at,
          partner,
          result: r.result,
          requestCode: r.requestCode,
          codeLookup: r.codeLookup,
          httpStatus: r.httpStatus,
          responseBody: r.responseBody,
          fixtureNote: fixture?.note,
        };
      }),
    );
  },
});

/**
 * Sada testovacích klíčů. Tři, aby šlo vyzkoušet i chybové stavy — běžný
 * provoz, zrušený klíč (401) a nízký limit (429).
 */
const TEST_KEYS = [
  {
    partnerName: "DRONPRO (test)",
    contactEmail: "test@dronpro.cz",
    rateLimitPerMin: 60,
    active: true,
    purpose: "Běžný provoz.",
  },
  {
    partnerName: "Testovací klíč — zrušený",
    contactEmail: "test@dronpro.cz",
    rateLimitPerMin: 60,
    active: false,
    purpose: "Vrací 401 unauthorized i na jinak správný dotaz.",
  },
  {
    partnerName: "Testovací klíč — nízký limit",
    contactEmail: "test@dronpro.cz",
    rateLimitPerMin: 3,
    active: true,
    purpose: "Po čtvrtém dotazu za minutu vrací 429 a hlavičku Retry-After.",
  },
] as const;

/**
 * Vydá celou sadu. Plaintexty se vracejí JEN TEĎ — v DB zůstává jen otisk,
 * stejně jako u ostrých klíčů. Ztracená sada se nedá obnovit, jen vydat
 * znovu; předchozí se přitom revokuje, aby nezůstávaly platné klíče, ke
 * kterým nikdo nezná heslo.
 */
async function createTestKeys(ctx: MutationCtx, createdBy: string) {
  const existing = await ctx.db.query("partnerKeys").collect();
  for (const k of existing) {
    if (keyModeOf(k) === "test" && k.active) {
      await ctx.db.patch(k._id, { active: false, revokedAt: Date.now() });
    }
  }

  const issued: { partnerName: string; key: string; purpose: string }[] = [];
  for (const spec of TEST_KEYS) {
    const key = generatePartnerKey("test");
    await ctx.db.insert("partnerKeys", {
      partnerName: spec.partnerName,
      contactEmail: spec.contactEmail,
      keyHash: await hashKey(key),
      keyPrefix: keyPrefixOf(key),
      mode: "test",
      scopes: ["verify"],
      active: spec.active,
      rateLimitPerMin: spec.rateLimitPerMin,
      createdBy,
      createdAt: Date.now(),
      revokedAt: spec.active ? undefined : Date.now(),
    });
    issued.push({ partnerName: spec.partnerName, key, purpose: spec.purpose });
  }

  return { keys: issued };
}

/** Vydání z administrace. */
export const issueTestKeys = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireAdmin(ctx);
    return await createTestKeys(ctx, subjectOf(identity));
  },
});

/**
 * Vydání z CLI: `npx convex run sandbox:seedTestKeys` (s `--prod` na ostré
 * nasazení). Interní funkce, takže se nedá zavolat z prohlížeče — CLI má
 * přístup k nasazení, ne k Clerk identitě, a `requireAdmin` by ho odmítl.
 */
export const seedTestKeys = internalMutation({
  args: {},
  handler: async (ctx) => await createTestKeys(ctx, "cli"),
});
