import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Varianta členství. `cestne` uděluje Rada osobnostem oboru, bez příspěvku. */
export const tierValidator = v.union(
  v.literal("zakladni"),
  v.literal("pro"),
  v.literal("cestne"),
);

/**
 * Stav členství.
 *  none      — zaregistrovaný účet bez tarifu (registrace je zdarma)
 *  pending   — rozjetá platba, čeká se na potvrzení od brány
 *  active    — platné členství
 *  past_due  — platba selhala, členství ještě neskončilo
 *  canceled  — členství skončilo
 */
export const statusValidator = v.union(
  v.literal("none"),
  v.literal("pending"),
  v.literal("active"),
  v.literal("past_due"),
  v.literal("canceled"),
);

export default defineSchema({
  /**
   * Editovatelné texty webu. Klíč = dot-notation adresa místa na webu
   * (např. "home.hero.title", "clenstvi.benefits.3.label").
   * Výchozí hodnoty zůstávají v kódu — řádek tu vzniká až první editací
   * (auto-upsert v content.update).
   */
  content: defineTable({
    key: v.string(),
    value: v.string(),
    category: v.string(), // první segment klíče, pro filtrování v dashboardu
    lastEditedBy: v.string(), // Clerk user id
    lastEditedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"]),

  /** Historie změn — kdo, kdy, co přepsal. */
  contentHistory: defineTable({
    contentId: v.id("content"),
    key: v.string(),
    oldValue: v.string(),
    newValue: v.string(),
    editedBy: v.string(),
    editedAt: v.number(),
  })
    .index("by_content", ["contentId"])
    .index("by_date", ["editedAt"]),

  /**
   * Evidence členů. Zdroj pravdy pro stav členství v aplikaci — záměrně NENÍ
   * v Clerk metadatech, protože zápis řídí platební brána a musí být
   * auditovatelný. Clerk drží jen identitu (`clerkUserId`, `email`).
   * Řádek vzniká lazy při prvním otevření členské sekce (members.ensureSelf).
   */
  members: defineTable({
    clerkUserId: v.string(),
    email: v.string(),

    // Profil — zrcadlí pole přihlášky (components/member/ProfileForm.tsx)
    name: v.string(),
    ico: v.optional(v.string()),
    phone: v.optional(v.string()),
    uclOperator: v.optional(v.string()),
    region: v.optional(v.string()),
    focus: v.array(v.string()),
    profile: v.optional(v.string()), // jednořádkový popis do veřejného seznamu

    // Členství
    tier: v.optional(tierValidator),
    status: statusValidator,
    memberSince: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.boolean(),

    // Identita a ověření členství partnery
    /** Členské číslo „CKPD-2026-0142". Neměnné, není tajné. */
    memberNumber: v.optional(v.string()),
    memberNumberYear: v.optional(v.number()),
    memberNumberSeq: v.optional(v.number()),
    /** Ověřovací kód „CKPD-2026-0142-K7M9XQ2T" — členské číslo + tajemství. */
    verificationCode: v.optional(v.string()),
    /** Normalizovaný tvar „2026:0142:K7M9XQ2T" — klíč pro lookup. */
    verificationCodeLookup: v.optional(v.string()),
    verificationCodeIssuedAt: v.optional(v.number()),

    // Souhlasy
    /** Souhlas se zveřejněním ve veřejném seznamu i v odpovědi ověřovacího API. */
    publicListing: v.boolean(),
    agreeStatutesAt: v.optional(v.number()),
    agreeGdprAt: v.optional(v.number()),

    // Platby — mock i Stripe sdílí stejný tvar, aby přechod nic neměnil
    billingProvider: v.union(v.literal("mock"), v.literal("stripe")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_code", ["verificationCodeLookup"])
    .index("by_number", ["memberNumber"])
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  /**
   * Klíče partnerů pro ověřovací API (slevové programy). Každý partner má
   * vlastní klíč — revokace jednoho neshodí ostatní. V DB je jen SHA-256 hash;
   * plaintext se ukáže jednou při vydání a už nikdy.
   */
  partnerKeys: defineTable({
    partnerName: v.string(),
    contactEmail: v.string(),
    keyHash: v.string(),
    /** Prvních pár znaků klíče, aby šel v adminu poznat. Není tajný. */
    keyPrefix: v.string(),
    scopes: v.array(v.string()),
    active: v.boolean(),
    rateLimitPerMin: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  })
    .index("by_hash", ["keyHash"])
    .index("by_active", ["active"]),

  /**
   * Audit dotazů na ověřovací API. Zaznamenává i neúspěšné pokusy — jinak by
   * nešlo poznat, že se někdo pokouší kódy hádat. Retence 90 dní (crons.ts).
   */
  verificationLog: defineTable({
    partnerKeyId: v.optional(v.id("partnerKeys")),
    codeLookup: v.string(),
    memberId: v.optional(v.id("members")),
    result: v.union(
      v.literal("valid"),
      v.literal("not_found"),
      v.literal("inactive"),
      v.literal("bad_format"),
      v.literal("rate_limited"),
      v.literal("unauthorized"),
    ),
    at: v.number(),
  })
    .index("by_partner_at", ["partnerKeyId", "at"])
    .index("by_at", ["at"]),

  /**
   * Pořadová čísla. Convex mutace jsou transakční, takže čtení a zvýšení
   * čítače v jedné mutaci nemůže vydat dvě stejná členská čísla.
   * Klíč = `memberNumber:2026`.
   */
  counters: defineTable({
    key: v.string(),
    value: v.number(),
  }).index("by_key", ["key"]),

  /** Fixed-window čítač requestů. Drží se v DB, aby odpadla závislost na KV. */
  rateLimits: defineTable({
    /** `${partnerKeyId}:${minuta}` */
    bucket: v.string(),
    count: v.number(),
    expiresAt: v.number(),
  }).index("by_bucket", ["bucket"]),
});
