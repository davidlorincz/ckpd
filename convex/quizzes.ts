/**
 * Kvízy.
 *
 * Pokus si vylosuje otázky rovnoměrně napříč sekcemi poolu, uloží si které,
 * a teprve po odevzdání se vyhodnotí. Správné odpovědi se klientovi **nikdy
 * neposílají dopředu** — jinak by je stačilo přečíst v odpovědi dotazu.
 */
import { v } from "convex/values";

import { internalMutation, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { publishStateValidator } from "./schema";
import { canAccessCourse, resolveAccess } from "./lib/entitlement";

/** Losování bez opakování. `Math.random` je v Convex mutaci povolený. */
function sample<T>(items: T[], count: number): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/* ─────────────────────────────────────────────────────────────── čtení */

/** Kvízy kurzu i s posledním výsledkem člena. */
export const forCourse = query({
  args: { courseSlug: v.string() },
  handler: async (ctx, { courseSlug }) => {
    const access = await resolveAccess(ctx);
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", courseSlug))
      .unique();
    if (!course || !canAccessCourse(access, course)) return [];

    const quizzes = (
      await ctx.db
        .query("quizzes")
        .withIndex("by_course", (q) => q.eq("courseId", course._id))
        .collect()
    ).filter((q) => q.state === "published");

    return await Promise.all(
      quizzes.map(async (quiz) => {
        const attempts = access.memberId
          ? await ctx.db
              .query("quizAttempts")
              .withIndex("by_member_quiz", (q) =>
                q.eq("memberId", access.memberId!).eq("quizId", quiz._id),
              )
              .collect()
          : [];
        const finished = attempts.filter((a) => a.finishedAt);
        const best = finished.reduce<Doc<"quizAttempts"> | null>(
          (acc, a) => (!acc || (a.score ?? 0) > (acc.score ?? 0) ? a : acc),
          null,
        );
        return {
          slug: quiz.slug,
          title: quiz.title,
          perex: quiz.perex,
          questionsPerAttempt: quiz.questionsPerAttempt,
          passingScore: quiz.passingScore,
          attempts: finished.length,
          bestScore: best?.score ?? null,
          passed: finished.some((a) => a.passed),
        };
      }),
    );
  },
});

/* ─────────────────────────────────────────────────────────────── pokus */

/**
 * Založí pokus a vrátí vylosované otázky **bez klíčů**.
 * Otázky se rozdělí rovnoměrně mezi sekce, ať test pokryje celou látku.
 */
export const start = mutation({
  args: { quizSlug: v.string() },
  handler: async (ctx, { quizSlug }) => {
    const access = await resolveAccess(ctx);
    if (!access.memberId) return null;

    const quiz = await ctx.db
      .query("quizzes")
      .withIndex("by_slug", (q) => q.eq("slug", quizSlug))
      .unique();
    if (!quiz || quiz.state !== "published") return null;

    const course = await ctx.db.get(quiz.courseId);
    if (!course || !canAccessCourse(access, course)) return null;

    const all = (
      await ctx.db
        .query("quizQuestions")
        .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
        .collect()
    ).filter((q) => q.state === "published");
    if (all.length === 0) return null;

    const sections = [...new Set(all.map((q) => q.section))];
    const perSection = Math.max(
      1,
      Math.floor(quiz.questionsPerAttempt / Math.max(1, sections.length)),
    );

    const drawn = sections.flatMap((section) =>
      sample(all.filter((q) => q.section === section), perSection),
    );
    // dorovnání, když počet sekcí nedělí počet otázek beze zbytku
    const missing = quiz.questionsPerAttempt - drawn.length;
    if (missing > 0) {
      const rest = all.filter((q) => !drawn.some((d) => d._id === q._id));
      drawn.push(...sample(rest, missing));
    }

    const attemptId = await ctx.db.insert("quizAttempts", {
      memberId: access.memberId,
      quizId: quiz._id,
      questionIds: drawn.map((q) => q._id),
      answers: [],
      startedAt: Date.now(),
    });

    return {
      attemptId,
      title: quiz.title,
      passingScore: quiz.passingScore,
      questions: drawn.map((q) => ({
        id: q._id,
        section: q.section,
        question: q.question,
        options: q.options,
      })),
    };
  },
});

/**
 * Odevzdání. Vyhodnocuje se až tady a na serveru — klient klíče nikdy neviděl.
 * Vrací i odůvodnění, protože největší hodnota kvízu je v tom, co si člověk
 * odnese ze špatné odpovědi, ne v samotném skóre.
 */
export const submit = mutation({
  args: {
    attemptId: v.id("quizAttempts"),
    answers: v.array(
      v.object({ questionId: v.id("quizQuestions"), chosenIndex: v.number() }),
    ),
  },
  handler: async (ctx, { attemptId, answers }) => {
    const access = await resolveAccess(ctx);
    const attempt = await ctx.db.get(attemptId);
    if (!attempt || !access.memberId || attempt.memberId !== access.memberId) {
      return null;
    }
    if (attempt.finishedAt) return null;

    const quiz = await ctx.db.get(attempt.quizId);
    if (!quiz) return null;

    // hodnotí se jen otázky, které byly v tomhle pokusu vylosované
    const allowed = new Set(attempt.questionIds.map(String));
    const filtered = answers.filter((a) => allowed.has(String(a.questionId)));

    const questions = await Promise.all(
      attempt.questionIds.map((id) => ctx.db.get(id)),
    );
    const byId = new Map(
      questions.filter(Boolean).map((q) => [String(q!._id), q!]),
    );

    let score = 0;
    const results = attempt.questionIds.map((id) => {
      const question = byId.get(String(id));
      const chosen = filtered.find((a) => String(a.questionId) === String(id));
      const correct =
        !!question && chosen?.chosenIndex === question.correctIndex;
      if (correct) score += 1;
      return {
        id,
        question: question?.question ?? "",
        options: question?.options ?? [],
        correctIndex: question?.correctIndex ?? -1,
        chosenIndex: chosen?.chosenIndex ?? null,
        correct,
        explanation: question?.explanation ?? "",
      };
    });

    const passed = score >= quiz.passingScore;
    await ctx.db.patch(attemptId, {
      answers: filtered,
      score,
      passed,
      finishedAt: Date.now(),
    });

    return { score, total: attempt.questionIds.length, passed, results };
  },
});

/* ──────────────────────────────────────────────────────────────── seed */

export const seedQuiz = internalMutation({
  args: {
    courseSlug: v.string(),
    slug: v.string(),
    title: v.string(),
    perex: v.string(),
    questionsPerAttempt: v.number(),
    passingScore: v.number(),
    state: publishStateValidator,
    questions: v.array(
      v.object({
        section: v.string(),
        position: v.number(),
        question: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
        explanation: v.string(),
        verified: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_slug", (q) => q.eq("slug", args.courseSlug))
      .unique();
    if (!course) throw new Error(`Kurz ${args.courseSlug} neexistuje.`);

    const now = Date.now();
    const existing = await ctx.db
      .query("quizzes")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    const fields = {
      courseId: course._id,
      slug: args.slug,
      title: args.title,
      perex: args.perex,
      questionsPerAttempt: args.questionsPerAttempt,
      passingScore: args.passingScore,
      state: args.state,
      updatedAt: now,
    };

    let quizId: Id<"quizzes">;
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      quizId = existing._id;
      // pool se nahrazuje celý — revize otázek mění i jejich pořadí
      const old = await ctx.db
        .query("quizQuestions")
        .withIndex("by_quiz", (q) => q.eq("quizId", quizId))
        .collect();
      for (const q of old) await ctx.db.delete(q._id);
    } else {
      quizId = await ctx.db.insert("quizzes", { ...fields, createdAt: now });
    }

    for (const q of args.questions) {
      await ctx.db.insert("quizQuestions", {
        quizId,
        ...q,
        // Neověřená otázka se nikdy nedostane do losování.
        state: q.verified ? "published" : "draft",
      });
    }

    return { quizId, questions: args.questions.length };
  },
});
