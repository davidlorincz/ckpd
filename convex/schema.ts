import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
});
