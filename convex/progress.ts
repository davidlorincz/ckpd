/**
 * Postup člena v kurzu.
 *
 * Ukládá se na server, ne do localStorage — jinak by se postup ztratil při
 * přechodu na mobil a „pokračovat kde jsi skončil" by lhalo. Klient posílá
 * heartbeat každých 15 s a navíc při pauze, přetočení a odchodu ze stránky.
 *
 * Proč se drží sledované úseky a ne jen poslední pozice, vysvětluje
 * convex/lib/ranges.ts.
 */
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { addRange, clampSegment, coverage, coverageRatio } from "./lib/ranges";
import { canAccessLesson, resolveAccess, type Access } from "./lib/entitlement";

/** Interval, ve kterém klient hlásí přehrané úseky. */
export const HEARTBEAT_SECONDS = 15;

/**
 * Nejdelší úsek, který server přijme v jednom hlášení. Dvojnásobek intervalu,
 * aby se vešel jeden zameškaný tik. **Tohle je bezpečnostní hranice:** bez ní
 * stačí jeden ručně poslaný požadavek `{from: 0, to: 3600}` a lekce je
 * „dokoukaná" — a s ní i potvrzení o absolvování, které komora vydává.
 */
const MAX_SEGMENT_SECONDS = HEARTBEAT_SECONDS * 2;

/** Podíl reálně přehrané stopáže, od kterého se lekce považuje za dokončenou. */
const COMPLETE_COVERAGE = 0.9;

/**
 * Druhá podmínka dokončení. Samotné pokrytí by šlo naplnit sledováním
 * prvních 90 % a odchodem před koncem; tohle vyžaduje i dojetí na konec.
 */
const COMPLETE_POSITION = 0.95;

type ProgressRow = Doc<"lessonProgress">;

function isComplete(row: {
  watchedRanges: { s: number; e: number }[];
  maxPositionSeconds: number;
}, durationSeconds: number): boolean {
  if (!(durationSeconds > 0)) return false;
  const covered = coverageRatio(row.watchedRanges, durationSeconds);
  const reached = row.maxPositionSeconds / durationSeconds;
  return covered >= COMPLETE_COVERAGE && reached >= COMPLETE_POSITION;
}

/**
 * Přepočte souhrn za kurz. Procenta jsou **vážená délkou lekce**, ne podílem
 * jejich počtu — jinak by pětiminutová a osmiminutová lekce měly stejnou váhu
 * a ukazatel by lhal.
 *
 * Volitelné lekce (`isRequired: false`) se do jmenovatele nepočítají, aby
 * přidání bonusu neshodilo postup těm, kdo už měli hotovo.
 */
async function recomputeCourse(
  ctx: MutationCtx,
  memberId: Id<"members">,
  courseId: Id<"courses">,
  lastLessonId: Id<"lessons">,
) {
  const lessons = (
    await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect()
  ).filter((l) => l.state === "published" && l.isRequired);

  const rows = await ctx.db
    .query("lessonProgress")
    .withIndex("by_member_course", (q) =>
      q.eq("memberId", memberId).eq("courseId", courseId),
    )
    .collect();
  const byLesson = new Map(rows.map((r) => [r.lessonId, r]));

  let weighted = 0;
  let total = 0;
  let completed = 0;
  let watched = 0;

  for (const lesson of lessons) {
    const duration = Math.max(1, lesson.durationSeconds);
    total += duration;
    const row = byLesson.get(lesson._id);
    if (!row) continue;
    watched += row.watchedSeconds;
    if (row.completedAt) {
      weighted += duration;
      completed += 1;
    } else {
      weighted += Math.min(duration, coverage(row.watchedRanges));
    }
  }

  const percent = total > 0 ? Math.min(1, weighted / total) : 0;
  const now = Date.now();

  const existing = await ctx.db
    .query("courseProgress")
    .withIndex("by_member_course", (q) =>
      q.eq("memberId", memberId).eq("courseId", courseId),
    )
    .unique();

  const fields = {
    lessonsTotal: lessons.length,
    lessonsCompleted: completed,
    percent,
    watchedSeconds: watched,
    lastLessonId,
    completedAt:
      lessons.length > 0 && completed === lessons.length
        ? (existing?.completedAt ?? now)
        : undefined,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, fields);
  } else {
    await ctx.db.insert("courseProgress", {
      memberId,
      courseId,
      startedAt: now,
      ...fields,
    });
  }
}

/** Ověří nárok a vrátí lekci. `null`, když volající nemá co pohledávat. */
async function authorize(
  ctx: MutationCtx | QueryCtx,
  lessonId: Id<"lessons">,
): Promise<{ access: Access; lesson: Doc<"lessons"> } | null> {
  const lesson = await ctx.db.get(lessonId);
  if (!lesson) return null;
  const course = await ctx.db.get(lesson.courseId);
  if (!course) return null;

  const access = await resolveAccess(ctx);
  // Postup se ukládá jen členům — u veřejné ukázky není komu ho přiřadit.
  if (!access.memberId) return null;
  if (!canAccessLesson(access, course, lesson)) return null;

  return { access, lesson };
}

/* ─────────────────────────────────────────────────────────────── zápis */

/**
 * Zaznamená přehraný úsek. Idempotentní — opakovaný ani přeházený heartbeat
 * pokrytí nezdvojí (viz ranges.ts), takže klient může posílat radši jednou
 * navíc, hlavně u `sendBeacon`, který doručení nepotvrzuje.
 *
 * `from`/`to` jsou v **media-time**, ne v reálném čase: při dvojnásobné
 * rychlosti se za 15 sekund přehraje 30 sekund stopáže a musí se započítat
 * právě těch 30.
 */
export const heartbeat = mutation({
  args: {
    lessonId: v.id("lessons"),
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, { lessonId, from, to }) => {
    const authorized = await authorize(ctx, lessonId);
    if (!authorized) return null;
    const { access, lesson } = authorized;
    const memberId = access.memberId!;

    const segment = clampSegment(from, to, {
      durationSeconds: lesson.durationSeconds,
      maxSegmentSeconds: MAX_SEGMENT_SECONDS,
    });

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_member_lesson", (q) =>
        q.eq("memberId", memberId).eq("lessonId", lessonId),
      )
      .unique();

    const now = Date.now();
    const ranges = segment
      ? addRange(existing?.watchedRanges ?? [], segment.s, segment.e)
      : (existing?.watchedRanges ?? []);
    const maxPosition = Math.max(
      existing?.maxPositionSeconds ?? 0,
      Math.min(segment?.e ?? 0, lesson.durationSeconds),
    );
    const lastPosition = Math.min(
      Math.max(0, segment?.e ?? existing?.lastPositionSeconds ?? 0),
      lesson.durationSeconds,
    );

    const completedNow = isComplete(
      { watchedRanges: ranges, maxPositionSeconds: maxPosition },
      lesson.durationSeconds,
    );

    const fields = {
      watchedRanges: ranges,
      watchedSeconds: coverage(ranges),
      lastPositionSeconds: lastPosition,
      maxPositionSeconds: maxPosition,
      completion: coverageRatio(ranges, lesson.durationSeconds),
      lastViewedAt: now,
      ...(completedNow && !existing?.completedAt
        ? { completedAt: now, completionTrigger: "auto" as const }
        : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("lessonProgress", {
        memberId,
        lessonId,
        courseId: lesson.courseId,
        playCount: 1,
        firstViewedAt: now,
        ...fields,
      });
    }

    await recomputeCourse(ctx, memberId, lesson.courseId, lessonId);
    return { completed: completedNow };
  },
});

/**
 * Ruční označení lekce.
 *
 * Automatika sama nestačí — kdo si obsah přečte v přepisu nebo látku už zná,
 * nemá důvod video přehrávat, a zamknout mu postup by bylo trestání. Naopak
 * odškrtnutí zpět musí jít taky, jinak omyl nikdo nenapraví.
 */
export const setCompleted = mutation({
  args: { lessonId: v.id("lessons"), completed: v.boolean() },
  handler: async (ctx, { lessonId, completed }) => {
    const authorized = await authorize(ctx, lessonId);
    if (!authorized) return null;
    const { access, lesson } = authorized;
    const memberId = access.memberId!;

    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_member_lesson", (q) =>
        q.eq("memberId", memberId).eq("lessonId", lessonId),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        completedAt: completed ? (existing.completedAt ?? now) : undefined,
        completionTrigger: completed ? ("manual" as const) : undefined,
        lastViewedAt: now,
      });
    } else if (completed) {
      await ctx.db.insert("lessonProgress", {
        memberId,
        lessonId,
        courseId: lesson.courseId,
        completion: 1,
        completedAt: now,
        completionTrigger: "manual" as const,
        lastPositionSeconds: 0,
        maxPositionSeconds: 0,
        watchedSeconds: 0,
        watchedRanges: [],
        playCount: 0,
        firstViewedAt: now,
        lastViewedAt: now,
      });
    }

    await recomputeCourse(ctx, memberId, lesson.courseId, lessonId);
    return { completed };
  },
});

/* ─────────────────────────────────────────────────────────────── čtení */

function shape(row: ProgressRow | null, durationSeconds: number) {
  if (!row) {
    return {
      lastPositionSeconds: 0,
      watchedSeconds: 0,
      percent: 0,
      completed: false,
      started: false,
    };
  }
  return {
    lastPositionSeconds: row.lastPositionSeconds,
    watchedSeconds: row.watchedSeconds,
    percent: coverageRatio(row.watchedRanges, durationSeconds),
    completed: !!row.completedAt,
    started: row.watchedSeconds > 0 || !!row.completedAt,
  };
}

/** Postup v jedné lekci — pro resume overlay a stav tlačítka „dokončeno". */
export const forLesson = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const authorized = await authorize(ctx, lessonId);
    if (!authorized) return null;
    const { access, lesson } = authorized;

    const row = await ctx.db
      .query("lessonProgress")
      .withIndex("by_member_lesson", (q) =>
        q.eq("memberId", access.memberId!).eq("lessonId", lessonId),
      )
      .unique();

    return shape(row, lesson.durationSeconds);
  },
});

/** Postup ve všech lekcích kurzu — pro checkmarky v osnově. */
export const forCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, { courseSlug }) => {
    const access = await resolveAccess(ctx);
    if (!access.memberId) return null;

    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course) return null;

    const [lessons, rows, summary] = await Promise.all([
      ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect(),
      ctx.db
        .query("lessonProgress")
        .withIndex("by_member_course", (q) =>
          q.eq("memberId", access.memberId!).eq("courseId", course._id),
        )
        .collect(),
      ctx.db
        .query("courseProgress")
        .withIndex("by_member_course", (q) =>
          q.eq("memberId", access.memberId!).eq("courseId", course._id),
        )
        .unique(),
    ]);

    const byLesson = new Map(rows.map((r) => [r.lessonId, r]));
    const lessonsBySlug: Record<string, ReturnType<typeof shape>> = {};
    let remaining = 0;
    let countable = 0;
    let done = 0;
    for (const lesson of lessons) {
      if (lesson.state !== "published") continue;
      const row = byLesson.get(lesson._id) ?? null;
      const s = shape(row, lesson.durationSeconds);
      lessonsBySlug[lesson.slug] = s;
      if (lesson.isRequired) {
        countable += 1;
        if (s.completed) done += 1;
      }
      if (!s.completed) {
        remaining += Math.max(0, lesson.durationSeconds - s.watchedSeconds);
      }
    }

    const next = lessons
      .filter((l) => l.state === "published" && l.isRequired)
      .sort((a, b) => a.position - b.position)
      .find((l) => !byLesson.get(l._id)?.completedAt);

    return {
      percent: summary?.percent ?? 0,
      // Počty čteme z lekcí, ne ze souhrnu — ten vzniká až prvním heartbeatem
      // a do té doby by ukazatel tvrdil „0 z 0".
      lessonsCompleted: done,
      lessonsTotal: countable,
      remainingSeconds: Math.round(remaining),
      nextLessonSlug: next?.slug ?? null,
      lessons: lessonsBySlug,
    };
  },
});

/**
 * „Pokračovat kde jsi skončil" pro přehled účtu. Vrací poslední rozkoukaný
 * kurz — ne nutně poslední navštívený, protože dokončený kurz už nemá kam
 * pokračovat.
 */
export const continueWatching = query({
  args: {},
  handler: async (ctx) => {
    const access = await resolveAccess(ctx);
    if (!access.memberId || !access.active) return null;

    const summaries = await ctx.db
      .query("courseProgress")
      .withIndex("by_member", (q) => q.eq("memberId", access.memberId!))
      .order("desc")
      .take(10);

    for (const summary of summaries) {
      if (summary.completedAt) continue;
      const course = await ctx.db.get(summary.courseId);
      if (!course || course.state !== "published") continue;

      const lessons = (
        await ctx.db
          .query("lessons")
          .withIndex("by_course", (q) => q.eq("courseId", course._id))
          .collect()
      )
        .filter((l) => l.state === "published" && l.isRequired)
        .sort((a, b) => a.position - b.position);

      const rows = await ctx.db
        .query("lessonProgress")
        .withIndex("by_member_course", (q) =>
          q.eq("memberId", access.memberId!).eq("courseId", course._id),
        )
        .collect();
      const byLesson = new Map(rows.map((r) => [r.lessonId, r]));

      const next =
        lessons.find((l) => {
          const row = byLesson.get(l._id);
          return row && !row.completedAt;
        }) ?? lessons.find((l) => !byLesson.get(l._id));
      if (!next) continue;

      return {
        courseSlug: course.slug,
        courseTitle: course.title,
        lessonSlug: next.slug,
        lessonTitle: next.title,
        percent: summary.percent,
        resumeSeconds: byLesson.get(next._id)?.lastPositionSeconds ?? 0,
      };
    }
    return null;
  },
});
