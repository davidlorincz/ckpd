/**
 * DIGI univerzita — katalog kurzů a lekcí.
 *
 * Čtení pro členskou sekci a seed z `content/digiuniverzita/*.json`.
 * Postup člena (heartbeat, procenta) je zvlášť v convex/progress.ts,
 * podepsané playback URL v convex/video.ts.
 */
import { v } from "convex/values";

import {
  internalMutation,
  internalQuery,
  query,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  canAccessCourse,
  canAccessLesson,
  resolveAccess,
} from "./lib/entitlement";
import {
  lessonKindValidator,
  publishStateValidator,
  tierValidator,
  videoProviderValidator,
} from "./schema";

/**
 * Návrh vidí jen admin.
 *
 * Původně to viselo na `NODE_ENV`, jenže Convex funkce běží vždycky jako
 * produkce — návrh by tak neuviděl nikdo, ani při náhledu. Role je navíc
 * správnější kritérium: admin má obsah zkontrolovat, než ho pustí členům.
 */
async function canSeeDrafts(ctx: QueryCtx): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.role === "admin";
}

function visible(
  state: Doc<"courses">["state"] | Doc<"lessons">["state"],
  drafts: boolean,
) {
  return state === "published" || (state === "draft" && drafts);
}

/* ────────────────────────────────────────────────────────────────── čtení */

/**
 * Katalog pro přehled DIGI univerzity. Vrací i kurzy, na které člen nemá
 * nárok — schválně: má vidět, co mu PRO členství přinese. Jen u nich
 * `unlocked: false` a stránka místo obsahu ukáže výzvu k upgradu.
 */
export const catalog = query({
  args: {},
  handler: async (ctx) => {
    const access = await resolveAccess(ctx);
    const drafts = await canSeeDrafts(ctx);
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_state")
      .collect();

    // Postup se přibalí rovnou sem — dashboard vypisuje všechny kurzy naráz
    // a dotahovat ho po jednom by znamenalo dotaz na každou kartu.
    const summaries = access.memberId
      ? await ctx.db
          .query("courseProgress")
          .withIndex("by_member", (q) => q.eq("memberId", access.memberId!))
          .collect()
      : [];
    const byCourse = new Map(summaries.map((s) => [s.courseId, s]));

    return courses
      .filter((c) => visible(c.state, drafts))
      .sort((a, b) => a.position - b.position)
      .map((c) => ({
        percent: byCourse.get(c._id)?.percent ?? 0,
        lessonsCompleted: byCourse.get(c._id)?.lessonsCompleted ?? 0,
        slug: c.slug,
        title: c.title,
        perex: c.perex,
        coverImageUrl: c.coverImageUrl,
        requiredTier: c.requiredTier,
        lessonCount: c.lessonCount,
        totalDurationSeconds: c.totalDurationSeconds,
        state: c.state,
        unlocked: canAccessCourse(access, c),
      }));
  },
});

/** Osnova kurzu — moduly, lekce, délky. Bez transkriptů a bez playback URL. */
export const courseBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const access = await resolveAccess(ctx);
    const drafts = await canSeeDrafts(ctx);
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!course || !visible(course.state, drafts)) return null;

    const [sections, lessons] = await Promise.all([
      ctx.db
        .query("courseSections")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect(),
      ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect(),
    ]);

    const unlocked = canAccessCourse(access, course);

    return {
      slug: course.slug,
      title: course.title,
      perex: course.perex,
      coverImageUrl: course.coverImageUrl,
      requiredTier: course.requiredTier,
      lessonCount: course.lessonCount,
      totalDurationSeconds: course.totalDurationSeconds,
      unlocked,
      sections: sections
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ key: s.key, title: s.title })),
      lessons: lessons
        .filter((l) => visible(l.state, drafts))
        .sort((a, b) => a.position - b.position)
        .map((l) => ({
          slug: l.slug,
          title: l.title,
          perex: l.perex,
          position: l.position,
          kind: l.kind,
          durationSeconds: l.durationSeconds,
          sectionKey:
            sections.find((s) => s._id === l.sectionId)?.key ?? null,
          isPreview: l.isPreview,
          isRequired: l.isRequired,
          state: l.state,
          stateNote: l.stateNote,
          unlocked: canAccessLesson(access, course, l),
        })),
    };
  },
});

/**
 * Detail lekce pro stránku přehrávače.
 *
 * Transkript se vrací jen tomu, kdo na lekci má nárok — jsou to doslovné
 * přepisy celého kurzu, takže bez kontroly by šel obsah přečíst i bez videa.
 */
export const lessonBySlug = query({
  args: { courseSlug: v.string(), lessonSlug: v.string() },
  handler: async (ctx, { courseSlug, lessonSlug }) => {
    const access = await resolveAccess(ctx);
    const drafts = await canSeeDrafts(ctx);
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course || !visible(course.state, drafts)) return null;

    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_course_slug", (q) =>
        q.eq("courseId", course._id).eq("slug", lessonSlug),
      )
      .unique();
    if (!lesson || !visible(lesson.state, drafts)) return null;

    const unlocked = canAccessLesson(access, course, lesson);

    const transcript = unlocked
      ? await ctx.db
          .query("lessonTranscripts")
          .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
          .unique()
      : null;

    const siblings = (
      await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect()
    )
      .filter((l) => visible(l.state, drafts))
      .sort((a, b) => a.position - b.position);
    const index = siblings.findIndex((l) => l._id === lesson._id);
    const neighbour = (l: Doc<"lessons"> | undefined) =>
      l ? { slug: l.slug, title: l.title } : null;

    return {
      course: { slug: course.slug, title: course.title },
      lessonId: lesson._id,
      slug: lesson.slug,
      title: lesson.title,
      perex: lesson.perex,
      position: lesson.position,
      durationSeconds: lesson.durationSeconds,
      bodyMd: lesson.bodyMd,
      attachments: lesson.attachments,
      state: lesson.state,
      stateNote: lesson.stateNote,
      unlocked,
      /** Playback URL se nevydává tady — je podepsaná a krátkodobá (video.ts). */
      hasVideo: !!lesson.videoAssetId,
      transcript: transcript?.segments ?? null,
      prev: neighbour(siblings[index - 1]),
      next: neighbour(siblings[index + 1]),
    };
  },
});

/* ─────────────────────────────────────────────────────────────────── seed */

const lessonSeed = v.object({
  slug: v.string(),
  title: v.string(),
  perex: v.string(),
  position: v.number(),
  sectionKey: v.union(v.string(), v.null()),
  kind: lessonKindValidator,
  durationSeconds: v.number(),
  state: publishStateValidator,
  stateNote: v.optional(v.string()),
  isRequired: v.boolean(),
  isPreview: v.boolean(),
  sourceMaster: v.optional(v.string()),
  sourceYoutubeId: v.optional(v.string()),
});

/**
 * Založí nebo aktualizuje kurz podle seedu. Idempotentní — klíčem je slug,
 * takže opakované spuštění nevytvoří duplikáty a nepřepíše `videoAssetId`
 * (ten doplňuje admin po nahrání k providerovi a seed o něm nic neví).
 */
export const seedCourse = internalMutation({
  args: {
    course: v.object({
      slug: v.string(),
      title: v.string(),
      perex: v.string(),
      coverImageUrl: v.optional(v.string()),
      requiredTier: v.optional(tierValidator),
      position: v.number(),
      state: publishStateValidator,
      sections: v.array(
        v.object({ key: v.string(), title: v.string(), position: v.number() }),
      ),
    }),
    lessons: v.array(lessonSeed),
  },
  handler: async (ctx, { course, lessons }) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", course.slug))
      .unique();

    const totals = lessons.reduce(
      (acc, l) => ({
        count: acc.count + 1,
        duration: acc.duration + l.durationSeconds,
      }),
      { count: 0, duration: 0 },
    );

    const courseFields = {
      slug: course.slug,
      title: course.title,
      perex: course.perex,
      coverImageUrl: course.coverImageUrl,
      requiredTier: course.requiredTier,
      state: course.state,
      position: course.position,
      lessonCount: totals.count,
      totalDurationSeconds: totals.duration,
      updatedAt: now,
    };

    let courseId: Id<"courses">;
    if (existing) {
      await ctx.db.patch(existing._id, courseFields);
      courseId = existing._id;
    } else {
      courseId = await ctx.db.insert("courses", {
        ...courseFields,
        publishedAt: course.state === "published" ? now : undefined,
        createdAt: now,
      });
    }

    // moduly
    const existingSections = await ctx.db
      .query("courseSections")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
    const sectionIds = new Map<string, Id<"courseSections">>();
    for (const s of course.sections) {
      const found = existingSections.find((e) => e.key === s.key);
      if (found) {
        await ctx.db.patch(found._id, { title: s.title, position: s.position });
        sectionIds.set(s.key, found._id);
      } else {
        sectionIds.set(
          s.key,
          await ctx.db.insert("courseSections", { courseId, ...s }),
        );
      }
    }

    // lekce
    const existingLessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();

    for (const l of lessons) {
      const { sectionKey, ...rest } = l;
      const fields = {
        courseId,
        sectionId: sectionKey ? sectionIds.get(sectionKey) : undefined,
        ...rest,
        updatedAt: now,
      };
      const found = existingLessons.find((e) => e.slug === l.slug);
      if (found) {
        await ctx.db.patch(found._id, fields);
      } else {
        await ctx.db.insert("lessons", {
          ...fields,
          attachments: [],
          createdAt: now,
        });
      }
    }

    return { courseId, lessons: lessons.length };
  },
});

/** Transkript zvlášť — je to stovky vět a do argumentů kurzu by se necpaly. */
export const seedTranscript = internalMutation({
  args: {
    courseSlug: v.string(),
    lessonSlug: v.string(),
    segments: v.array(
      v.object({ start: v.number(), end: v.number(), text: v.string() }),
    ),
  },
  handler: async (ctx, { courseSlug, lessonSlug, segments }) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course) throw new Error(`Kurz ${courseSlug} neexistuje.`);

    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_course_slug", (q) =>
        q.eq("courseId", course._id).eq("slug", lessonSlug),
      )
      .unique();
    if (!lesson) throw new Error(`Lekce ${lessonSlug} neexistuje.`);

    const existing = await ctx.db
      .query("lessonTranscripts")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { segments, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("lessonTranscripts", {
        lessonId: lesson._id,
        segments,
        updatedAt: Date.now(),
      });
    }
    return { cues: segments.length };
  },
});

/** Napojí lekci na nahrané video. Volá se z uploadu i z webhooku providera. */
export const attachVideo = internalMutation({
  args: {
    courseSlug: v.string(),
    lessonSlug: v.string(),
    videoProvider: videoProviderValidator,
    videoAssetId: v.string(),
    durationSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.courseSlug))
      .unique();
    if (!course) throw new Error(`Kurz ${args.courseSlug} neexistuje.`);

    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_course_slug", (q) =>
        q.eq("courseId", course._id).eq("slug", args.lessonSlug),
      )
      .unique();
    if (!lesson) throw new Error(`Lekce ${args.lessonSlug} neexistuje.`);

    await ctx.db.patch(lesson._id, {
      videoProvider: args.videoProvider,
      videoAssetId: args.videoAssetId,
      // délku z providera bereme jako přesnější než odhad ze seedu
      ...(args.durationSeconds ? { durationSeconds: args.durationSeconds } : {}),
      updatedAt: Date.now(),
    });
    return { lessonId: lesson._id };
  },
});

/**
 * Smí tenhle člen přehrát tuhle lekci? Volá se z `video.signedPlayback`,
 * protože akce nemá přístup k databázi a podpis se nesmí vydat bez kontroly.
 */
export const playbackTarget = internalQuery({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    const drafts = await canSeeDrafts(ctx);
    const lesson = await ctx.db.get(lessonId);
    if (!lesson || !visible(lesson.state, drafts)) return null;

    const course = await ctx.db.get(lesson.courseId);
    if (!course || !visible(course.state, drafts)) return null;

    const access = await resolveAccess(ctx);
    if (!canAccessLesson(access, course, lesson)) return null;
    if (!lesson.videoAssetId || !lesson.videoProvider) return null;

    return {
      provider: lesson.videoProvider,
      assetId: lesson.videoAssetId,
      durationSeconds: lesson.durationSeconds,
      /** `null` u veřejné ukázky — tam není komu podpis přiřadit. */
      memberId: access.memberId,
    };
  },
});

/** Lekce, které ještě nemají nahrané video. Pro nahrávací skript. */
export const lessonsMissingVideo = internalQuery({
  args: { courseSlug: v.string() },
  handler: async (ctx, { courseSlug }) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course) return [];

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .collect();

    return lessons
      .filter((l) => !l.videoAssetId)
      .sort((a, b) => a.position - b.position)
      .map((l) => ({
        slug: l.slug,
        title: l.title,
        position: l.position,
        sourceMaster: l.sourceMaster ?? null,
      }));
  },
});

/** Zapíše vydaný podpis, aby šel uniklý odkaz dohledat ke členovi. */
export const logPlaybackToken = internalMutation({
  args: {
    jti: v.string(),
    memberId: v.id("members"),
    lessonId: v.id("lessons"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("playbackTokens", { ...args, issuedAt: Date.now() });
  },
});
