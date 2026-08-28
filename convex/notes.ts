/**
 * Poznámky člena k místu ve videu.
 *
 * Poznámka si drží sekundu, ve které vznikla, takže je z ní odkaz zpátky do
 * lekce — ne jen text v prázdnu. Existence celého trhu doplňků, kterými si
 * lidé přidávají poznámky do Udemy a Coursery, je docela dobrý důkaz, že to
 * chybí i tam, kde by to čekali.
 *
 * Poznámky jsou soukromé. Nikde se nesdílejí ani neagregují.
 */
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { canAccessLesson, resolveAccess } from "./lib/entitlement";

const MAX_LENGTH = 2000;

async function authorize(
  ctx: QueryCtx | MutationCtx,
  lessonId: Id<"lessons">,
) {
  const lesson = await ctx.db.get(lessonId);
  if (!lesson) return null;
  const course = await ctx.db.get(lesson.courseId);
  if (!course) return null;
  const access = await resolveAccess(ctx);
  if (!access.memberId) return null;
  if (!canAccessLesson(access, course, lesson)) return null;
  return { memberId: access.memberId, lesson };
}

export const forLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const authorized = await authorize(ctx, lessonId);
    if (!authorized) return [];

    const notes = await ctx.db
      .query("lessonNotes")
      .withIndex("by_member_lesson", (q) =>
        q.eq("memberId", authorized.memberId).eq("lessonId", lessonId),
      )
      .collect();

    return notes
      .sort((a, b) => a.atSeconds - b.atSeconds)
      .map((n) => ({
        id: n._id,
        atSeconds: n.atSeconds,
        text: n.text,
        updatedAt: n.updatedAt,
      }));
  },
});

export const add = mutation({
  args: {
    lessonId: v.id("lessons"),
    atSeconds: v.number(),
    text: v.string(),
  },
  handler: async (ctx, { lessonId, atSeconds, text }) => {
    const authorized = await authorize(ctx, lessonId);
    if (!authorized) return null;

    const trimmed = text.trim().slice(0, MAX_LENGTH);
    if (!trimmed) return null;

    const now = Date.now();
    return await ctx.db.insert("lessonNotes", {
      memberId: authorized.memberId,
      lessonId,
      // zarovnání do stopáže, ať poznámka neodkazuje za konec videa
      atSeconds: Math.max(
        0,
        Math.min(Math.round(atSeconds), authorized.lesson.durationSeconds),
      ),
      text: trimmed,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { noteId: v.id("lessonNotes"), text: v.string() },
  handler: async (ctx, { noteId, text }) => {
    const note = await ctx.db.get(noteId);
    if (!note) return null;
    const access = await resolveAccess(ctx);
    // Cizí poznámku nesmí přepsat ani admin — je to soukromý zápisník.
    if (!access.memberId || access.memberId !== note.memberId) return null;

    const trimmed = text.trim().slice(0, MAX_LENGTH);
    if (!trimmed) return null;
    await ctx.db.patch(noteId, { text: trimmed, updatedAt: Date.now() });
    return noteId;
  },
});

export const remove = mutation({
  args: { noteId: v.id("lessonNotes") },
  handler: async (ctx, { noteId }) => {
    const note = await ctx.db.get(noteId);
    if (!note) return null;
    const access = await resolveAccess(ctx);
    if (!access.memberId || access.memberId !== note.memberId) return null;
    await ctx.db.delete(noteId);
    return noteId;
  },
});
