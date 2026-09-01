/**
 * Správa DIGI univerzity pro adminy.
 *
 * Čtení je tu zvlášť od `digiuniverzita.ts`, protože admin musí vidět i to,
 * co je draft, a navíc technický stav videa. Členské dotazy tyhle věci vidět
 * nesmí, tak se záměrně nemíchají.
 */
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { extractPlaybackJti, slugify } from "./lib/code";
import { publishStateValidator, tierValidator } from "./schema";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

/** Celý strom kurzu i s technickým stavem — podklad pro admin obrazovku. */
export const tree = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const courses = await ctx.db.query("courses").collect();
    return await Promise.all(
      courses
        .sort((a, b) => a.position - b.position)
        .map(async (course) => {
          const lessons = await ctx.db
            .query("lessons")
            .withIndex("by_course", (q) => q.eq("courseId", course._id))
            .collect();

          const transcripts = await Promise.all(
            lessons.map((l) =>
              ctx.db
                .query("lessonTranscripts")
                .withIndex("by_lesson", (q) => q.eq("lessonId", l._id))
                .unique(),
            ),
          );

          return {
            id: course._id,
            slug: course.slug,
            title: course.title,
            state: course.state,
            requiredTier: course.requiredTier,
            lessons: lessons
              .sort((a, b) => a.position - b.position)
              .map((l, i) => ({
                id: l._id,
                slug: l.slug,
                title: l.title,
                position: l.position,
                state: l.state,
                stateNote: l.stateNote,
                durationSeconds: l.durationSeconds,
                hasVideo: !!l.videoAssetId,
                provider: l.videoProvider ?? null,
                transcriptCues: transcripts[i]?.segments.length ?? 0,
              })),
          };
        }),
    );
  },
});

/** Publikování a stažení lekce. Jediná cesta, jak obsah zviditelnit členům. */
export const setLessonState = mutation({
  args: {
    lessonId: v.id("lessons"),
    state: publishStateValidator,
    stateNote: v.optional(v.string()),
  },
  handler: async (ctx, { lessonId, state, stateNote }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(lessonId, {
      state,
      stateNote: stateNote?.trim() || undefined,
      updatedAt: Date.now(),
    });
    return lessonId;
  },
});

export const setCourseState = mutation({
  args: { courseId: v.id("courses"), state: publishStateValidator },
  handler: async (ctx, { courseId, state }) => {
    await requireAdmin(ctx);
    const course = await ctx.db.get(courseId);
    await ctx.db.patch(courseId, {
      state,
      publishedAt:
        state === "published" ? (course?.publishedAt ?? Date.now()) : undefined,
      updatedAt: Date.now(),
    });
    return courseId;
  },
});

/**
 * Přehození pořadí lekcí.
 *
 * Přečíslují se všechny naráz. Fractional indexing by ušetřilo zápisy, ale
 * kurz má deset až sto lekcí a přečíslování v jedné Convex mutaci je
 * transakční a levné — složitost by se nevrátila.
 */
export const reorderLessons = mutation({
  args: { courseId: v.id("courses"), lessonIds: v.array(v.id("lessons")) },
  handler: async (ctx, { courseId, lessonIds }) => {
    await requireAdmin(ctx);
    const now = Date.now();
    for (const [index, lessonId] of lessonIds.entries()) {
      const lesson = await ctx.db.get(lessonId);
      // pořadí se smí měnit jen uvnitř jednoho kurzu
      if (!lesson || lesson.courseId !== courseId) continue;
      await ctx.db.patch(lessonId, { position: index + 1, updatedAt: now });
    }
    return lessonIds.length;
  },
});

/**
 * Čísla na úvodní obrazovku administrace.
 *
 * Záměrně jen to, podle čeho se admin rozhoduje, co dělat dál — kolik je
 * členů, kolik obsahu čeká na publikování a kde chybí video. Ne dashboard
 * pro dashboard.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [members, courses, lessons, partnerKeys] = await Promise.all([
      ctx.db.query("members").collect(),
      ctx.db.query("courses").collect(),
      ctx.db.query("lessons").collect(),
      ctx.db.query("partnerKeys").collect(),
    ]);

    const active = members.filter(
      (m) =>
        m.status === "active" &&
        (!m.currentPeriodEnd || m.currentPeriodEnd > Date.now()),
    );

    return {
      members: { total: members.length, active: active.length },
      courses: {
        total: courses.length,
        published: courses.filter((c) => c.state === "published").length,
      },
      lessons: {
        total: lessons.length,
        published: lessons.filter((l) => l.state === "published").length,
        withoutVideo: lessons.filter((l) => !l.videoAssetId).length,
      },
      partnerKeys: {
        total: partnerKeys.length,
        active: partnerKeys.filter((k) => k.active).length,
      },
    };
  },
});

/* ─────────────────────────────────────────────────────────── zakládání */

/** Přepočítá souhrny kurzu. Volá se po každé změně skladby lekcí. */
async function recountCourse(ctx: MutationCtx, courseId: Id<"courses">) {
  const lessons = await ctx.db
    .query("lessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();
  // Stejné pravidlo jako v `digiuniverzita.seedCourse`: čísla kurzu popisují
  // to, co člen uvidí, takže draft a archiv se do nich nepočítají.
  const published = lessons.filter((l) => l.state === "published");
  await ctx.db.patch(courseId, {
    lessonCount: published.length,
    totalDurationSeconds: published.reduce((a, l) => a + l.durationSeconds, 0),
    updatedAt: Date.now(),
  });
}

/** Volný slug — při kolizi přidá pořadové číslo. */
async function freeCourseSlug(ctx: MutationCtx, base: string) {
  const root = slugify(base) || "kurz";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const clash = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique();
    if (!clash) return candidate;
  }
  throw new Error("Nepodařilo se najít volnou adresu kurzu.");
}

export const createCourse = mutation({
  args: {
    title: v.string(),
    perex: v.string(),
    requiredTier: v.optional(tierValidator),
  },
  handler: async (ctx, { title, perex, requiredTier }) => {
    await requireAdmin(ctx);
    const trimmed = title.trim();
    if (!trimmed) throw new Error("Kurz musí mít název.");

    const all = await ctx.db.query("courses").collect();
    const now = Date.now();

    const courseId = await ctx.db.insert("courses", {
      slug: await freeCourseSlug(ctx, trimmed),
      title: trimmed,
      perex: perex.trim(),
      requiredTier,
      // nový kurz je vždy návrh — publikuje se, až má obsah
      state: "draft",
      position: all.length + 1,
      lessonCount: 0,
      totalDurationSeconds: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { courseId };
  },
});

export const updateCourse = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.optional(v.string()),
    perex: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    /** `null` = kurz pro každého aktivního člena. */
    requiredTier: v.optional(v.union(tierValidator, v.null())),
  },
  handler: async (ctx, { courseId, requiredTier, ...rest }) => {
    await requireAdmin(ctx);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (rest.title !== undefined) {
      const t = rest.title.trim();
      if (!t) throw new Error("Kurz musí mít název.");
      patch.title = t;
    }
    if (rest.perex !== undefined) patch.perex = rest.perex.trim();
    if (rest.coverImageUrl !== undefined) {
      patch.coverImageUrl = rest.coverImageUrl.trim() || undefined;
    }
    if (requiredTier !== undefined) {
      patch.requiredTier = requiredTier ?? undefined;
    }
    await ctx.db.patch(courseId, patch);
    return courseId;
  },
});

/**
 * Smazání kurzu.
 *
 * Jen když v něm nikdo nic nesledoval. Jakmile existuje postup nebo vydané
 * potvrzení, mazání by ta data osiřelo — od toho je stav `archived`, který
 * kurz schová členům a data nechá být.
 */
export const deleteCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    await requireAdmin(ctx);

    const [watched, issued] = await Promise.all([
      ctx.db
        .query("lessonProgress")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .first(),
      ctx.db
        .query("courseCompletions")
        .withIndex("by_course", (q) => q.eq("courseId", courseId))
        .first(),
    ]);
    if (watched || issued) {
      throw new Error(
        "Kurz už někdo sledoval nebo k němu bylo vydáno potvrzení. Použij archivaci.",
      );
    }

    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
    for (const lesson of lessons) {
      const transcript = await ctx.db
        .query("lessonTranscripts")
        .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
        .unique();
      if (transcript) await ctx.db.delete(transcript._id);
      await ctx.db.delete(lesson._id);
    }
    const sections = await ctx.db
      .query("courseSections")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
    for (const section of sections) await ctx.db.delete(section._id);

    await ctx.db.delete(courseId);
    return { deleted: true };
  },
});

export const createLesson = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    perex: v.string(),
    durationSeconds: v.number(),
    sectionId: v.optional(v.id("courseSections")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const title = args.title.trim();
    if (!title) throw new Error("Lekce musí mít název.");
    if (!(args.durationSeconds > 0)) {
      throw new Error("Lekce musí mít délku — doplní se přesně po nahrání videa.");
    }

    const siblings = await ctx.db
      .query("lessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    const root = slugify(title) || "lekce";
    let slug = root;
    for (let i = 1; siblings.some((s) => s.slug === slug); i++) {
      slug = `${root}-${i + 1}`;
    }

    const now = Date.now();
    const lessonId = await ctx.db.insert("lessons", {
      courseId: args.courseId,
      sectionId: args.sectionId,
      slug,
      title,
      perex: args.perex.trim(),
      position: siblings.length + 1,
      kind: "video",
      durationSeconds: Math.round(args.durationSeconds),
      attachments: [],
      isPreview: false,
      isRequired: true,
      state: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await recountCourse(ctx, args.courseId);
    return { lessonId, slug };
  },
});

export const updateLesson = mutation({
  args: {
    lessonId: v.id("lessons"),
    title: v.optional(v.string()),
    perex: v.optional(v.string()),
    durationSeconds: v.optional(v.number()),
    isPreview: v.optional(v.boolean()),
    isRequired: v.optional(v.boolean()),
    sectionId: v.optional(v.union(v.id("courseSections"), v.null())),
    requiredTier: v.optional(v.union(tierValidator, v.null())),
    stateNote: v.optional(v.string()),
  },
  handler: async (ctx, { lessonId, sectionId, requiredTier, ...rest }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) throw new Error("Lekce neexistuje.");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (rest.title !== undefined) {
      const t = rest.title.trim();
      if (!t) throw new Error("Lekce musí mít název.");
      patch.title = t;
    }
    if (rest.perex !== undefined) patch.perex = rest.perex.trim();
    if (rest.durationSeconds !== undefined) {
      if (!(rest.durationSeconds > 0)) throw new Error("Délka musí být kladná.");
      patch.durationSeconds = Math.round(rest.durationSeconds);
    }
    if (rest.isPreview !== undefined) patch.isPreview = rest.isPreview;
    if (rest.isRequired !== undefined) patch.isRequired = rest.isRequired;
    if (rest.stateNote !== undefined) {
      patch.stateNote = rest.stateNote.trim() || undefined;
    }
    if (sectionId !== undefined) patch.sectionId = sectionId ?? undefined;
    if (requiredTier !== undefined) patch.requiredTier = requiredTier ?? undefined;

    await ctx.db.patch(lessonId, patch);
    if (patch.durationSeconds !== undefined) {
      await recountCourse(ctx, lesson.courseId);
    }
    return lessonId;
  },
});

/** Smazat lze jen lekci, kterou nikdo nesledoval — jinak archivuj. */
export const deleteLesson = mutation({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, { lessonId }) => {
    await requireAdmin(ctx);
    const lesson = await ctx.db.get(lessonId);
    if (!lesson) return { deleted: false };

    const watched = await ctx.db
      .query("lessonProgress")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .collect();
    if (watched.length > 0) {
      throw new Error(
        `Lekci už sleduje ${watched.length} členů. Použij archivaci, ne mazání.`,
      );
    }

    const transcript = await ctx.db
      .query("lessonTranscripts")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .unique();
    if (transcript) await ctx.db.delete(transcript._id);

    const notes = await ctx.db
      .query("lessonNotes")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .collect();
    for (const note of notes) await ctx.db.delete(note._id);

    await ctx.db.delete(lessonId);

    // přečíslovat, ať v pořadí nezůstane díra
    const rest = (
      await ctx.db
        .query("lessons")
        .withIndex("by_course", (q) => q.eq("courseId", lesson.courseId))
        .collect()
    ).sort((a, b) => a.position - b.position);
    for (const [index, l] of rest.entries()) {
      if (l.position !== index + 1) {
        await ctx.db.patch(l._id, { position: index + 1 });
      }
    }

    await recountCourse(ctx, lesson.courseId);
    return { deleted: true };
  },
});

/** Modul kurzu. Bez modulů se lekce zobrazí v jednom seznamu. */
export const createSection = mutation({
  args: { courseId: v.id("courses"), title: v.string() },
  handler: async (ctx, { courseId, title }) => {
    await requireAdmin(ctx);
    const t = title.trim();
    if (!t) throw new Error("Modul musí mít název.");
    const siblings = await ctx.db
      .query("courseSections")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
    return await ctx.db.insert("courseSections", {
      courseId,
      key: slugify(t) || `modul-${siblings.length + 1}`,
      title: t,
      position: siblings.length + 1,
    });
  },
});

/** Detail jednoho kurzu pro admina — včetně draftů a technického stavu. */
export const courseDetail = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    await requireAdmin(ctx);

    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!course) return null;

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

    const detail = await Promise.all(
      lessons
        .sort((a, b) => a.position - b.position)
        .map(async (l) => {
          const [transcript, watchers] = await Promise.all([
            ctx.db
              .query("lessonTranscripts")
              .withIndex("by_lesson", (q) => q.eq("lessonId", l._id))
              .unique(),
            ctx.db
              .query("lessonProgress")
              .withIndex("by_lesson", (q) => q.eq("lessonId", l._id))
              .collect(),
          ]);
          return {
            id: l._id,
            slug: l.slug,
            title: l.title,
            perex: l.perex,
            position: l.position,
            state: l.state,
            stateNote: l.stateNote,
            durationSeconds: l.durationSeconds,
            sectionId: l.sectionId ?? null,
            isPreview: l.isPreview,
            isRequired: l.isRequired,
            requiredTier: l.requiredTier ?? null,
            hasVideo: !!l.videoAssetId,
            provider: l.videoProvider ?? null,
            transcriptCues: transcript?.segments.length ?? 0,
            /** Kolik členů lekci sleduje — podle toho jde/nejde smazat. */
            watchers: watchers.length,
          };
        }),
    );

    return {
      id: course._id,
      slug: course.slug,
      title: course.title,
      perex: course.perex,
      coverImageUrl: course.coverImageUrl ?? null,
      requiredTier: course.requiredTier ?? null,
      state: course.state,
      sections: sections
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ id: s._id, key: s.key, title: s.title })),
      lessons: detail,
    };
  },
});

/**
 * Dohledání uniklého odkazu.
 *
 * Přijme celou adresu, samotný token i holé `jti`. Payload JWT je jen base64,
 * takže `jti` se z odkazu přečte bez podpisového klíče — a podle něj se najde,
 * komu a kdy byl vydán.
 *
 * Nedokazuje to, kdo odkaz šířil; dokazuje, čí přihlášení ho vytvořilo. To
 * stačí na to, aby se s tím členem dalo mluvit.
 */
export const traceToken = query({
  args: { input: v.string() },
  handler: async (ctx, { input }) => {
    await requireAdmin(ctx);

    const raw = input.trim();
    if (!raw) return null;

    const jti = extractPlaybackJti(raw);
    if (!jti) return { status: "bad_input" as const };

    const row = await ctx.db
      .query("playbackTokens")
      .withIndex("by_jti", (q) => q.eq("jti", jti))
      .unique();
    // Po 90 dnech je záznam smazaný — to je jiná odpověď než „neexistuje".
    if (!row) return { status: "not_found" as const, jti };

    const [member, lesson] = await Promise.all([
      ctx.db.get(row.memberId),
      ctx.db.get(row.lessonId),
    ]);

    return {
      status: "found" as const,
      jti,
      issuedAt: row.issuedAt,
      member: member
        ? {
            name: member.name,
            email: member.email,
            memberNumber: member.memberNumber ?? null,
            tier: member.tier ?? null,
            status: member.status,
          }
        : null,
      lesson: lesson ? { title: lesson.title, slug: lesson.slug } : null,
    };
  },
});
