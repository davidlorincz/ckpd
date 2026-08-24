import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Zakázaná slovní zásoba (PRD § 8) — stejná pravidla jako
 * scripts/content-lint.mjs. Build-time lint texty v DB nepokryje,
 * proto se kontroluje při každém zápisu.
 */
const FORBIDDEN_RULES: Array<[RegExp, string, RegExp[]]> = [
  [/licenc\w*/giu, "'licence' — komora žádné nevydává ani nezmiňuje", []],
  [/certifik\w*/giu, "'certifikace/certifikát' — zakázaný jazyk státu", []],
  [
    /oprávněn\w*/giu,
    "'oprávnění' — zakázaný jazyk státu",
    [/oprávněn(ý|ého|ému|ém|ým)\s+záj(em|m\w*)/giu],
  ],
  [/akredit\w*/giu, "'akreditace' — zakázaný jazyk státu", []],
  [/registru?\s+pilot\w*/giu, "'registr pilotů' — komora nevede registr", []],
  [
    /povinn(é|ého|ém|ým|á|ou)\s+členstv\w*/giu,
    "'povinné členství' — členství je dobrovolné",
    [],
  ],
  [
    /garantujeme\s+bezpečnost\w*/giu,
    "'garantujeme bezpečnost' — negarantujeme, standardizujeme",
    [],
  ],
];

function checkForbiddenVocabulary(text: string): string | null {
  for (const [pattern, description, allow] of FORBIDDEN_RULES) {
    for (const match of text.matchAll(new RegExp(pattern))) {
      const allowed = allow.some((a) =>
        [...text.matchAll(new RegExp(a))].some(
          (m) =>
            m.index! <= match.index! &&
            match.index! < m.index! + m[0].length,
        ),
      );
      if (!allowed) return `„${match[0]}" → ${description}`;
    }
  }
  return null;
}

async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<Record<string, unknown> | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Nepřihlášený uživatel.");
  if (identity.role !== "admin") throw new Error("Chybí admin role.");
  return identity;
}

/** Celý slovník přepisů jedním dotazem — { key: value }. Veřejné čtení. */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("content").collect();
    const map: Record<string, string> = {};
    for (const row of rows) map[row.key] = row.value;
    return map;
  },
});

/** Historie změn jednoho klíče (pro případný admin přehled). */
export const getHistory = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    return await ctx.db
      .query("contentHistory")
      .withIndex("by_date")
      .order("desc")
      .filter((q) => q.eq(q.field("key"), key))
      .take(20);
  },
});

/**
 * Uloží novou hodnotu klíče. Jen admin (role z Clerk JWT claimu).
 * Neznámý klíč se auto-upsertne — díky tomu jde editovat i text,
 * který nikdy nebyl migrován do DB (výchozí hodnota žije v kódu).
 */
export const update = mutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, { key, value }) => {
    const identity = await requireAdmin(ctx);

    const violation = checkForbiddenVocabulary(value);
    if (violation) {
      throw new Error(`Zakázaná slovní zásoba: ${violation}`);
    }

    const editedBy = String(identity.subject ?? "unknown");
    const now = Date.now();
    const existing = await ctx.db
      .query("content")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      if (existing.value === value) return { updated: false };
      await ctx.db.patch(existing._id, {
        value,
        lastEditedBy: editedBy,
        lastEditedAt: now,
      });
      await ctx.db.insert("contentHistory", {
        contentId: existing._id,
        key,
        oldValue: existing.value,
        newValue: value,
        editedBy,
        editedAt: now,
      });
      return { updated: true };
    }

    const contentId = await ctx.db.insert("content", {
      key,
      value,
      category: key.split(".")[0] ?? "misc",
      lastEditedBy: editedBy,
      lastEditedAt: now,
    });
    await ctx.db.insert("contentHistory", {
      contentId,
      key,
      oldValue: "",
      newValue: value,
      editedBy,
      editedAt: now,
    });
    return { updated: true };
  },
});
