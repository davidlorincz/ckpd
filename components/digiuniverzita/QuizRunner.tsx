"use client";

/**
 * Zkušební test.
 *
 * Otázky se losují na serveru a klíče se klientovi neposílají — vyhodnocení
 * proběhne až po odevzdání. Po výsledku se ukazuje odůvodnění u každé otázky,
 * protože z testu si člověk odnese víc než skóre.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type Question = {
  id: Id<"quizQuestions">;
  section: string;
  question: string;
  options: string[];
};

type Attempt = {
  attemptId: Id<"quizAttempts">;
  title: string;
  passingScore: number;
  questions: Question[];
};

type Result = {
  score: number;
  total: number;
  passed: boolean;
  results: {
    id: Id<"quizQuestions">;
    question: string;
    options: string[];
    correctIndex: number;
    chosenIndex: number | null;
    correct: boolean;
    explanation: string;
  }[];
};

export function QuizRunner({ courseSlug }: { courseSlug: string }) {
  const quizzes = useQuery(api.quizzes.forCourse, { courseSlug });
  const start = useMutation(api.quizzes.start);
  const submit = useMutation(api.quizzes.submit);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  if (!quizzes || quizzes.length === 0) return null;

  async function begin(slug: string) {
    setBusy(true);
    const started = await start({ quizSlug: slug });
    setBusy(false);
    if (!started) return;
    setAttempt(started);
    setAnswers({});
    setResult(null);
  }

  async function finish() {
    if (!attempt) return;
    setBusy(true);
    const outcome = await submit({
      attemptId: attempt.attemptId,
      answers: Object.entries(answers).map(([questionId, chosenIndex]) => ({
        questionId: questionId as Id<"quizQuestions">,
        chosenIndex,
      })),
    });
    setBusy(false);
    if (outcome) {
      setResult(outcome);
      setAttempt(null);
    }
  }

  /* ── výsledek ── */
  if (result) {
    return (
      <section className="border border-hairline bg-paper p-7 shadow-paper">
        <h2 className="text-[19px]">
          {result.passed ? "Test jsi zvládl" : "Zkus to znovu"}
        </h2>
        <p className="mt-2 text-[15px] text-ink-2 tnum">
          {result.score} z {result.total} správně
        </p>

        <ol className="mt-6 space-y-5">
          {result.results.map((r, i) => (
            <li key={r.id} className="border-l-2 border-l-hairline pl-4">
              <p className="text-[15px] text-ink">
                {i + 1}. {r.question}
              </p>
              <p
                className={cn(
                  "mt-1.5 text-[14px]",
                  r.correct ? "text-action" : "text-destructive",
                )}
              >
                {r.correct ? "Správně" : "Špatně"}
                {!r.correct && r.correctIndex >= 0 && (
                  <> — správně je: {r.options[r.correctIndex]}</>
                )}
              </p>
              {r.explanation && (
                <p className="mt-1.5 text-[14px] text-ink-2">{r.explanation}</p>
              )}
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-7 border border-hairline px-5 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-paper-2"
        >
          Zavřít výsledek
        </button>
      </section>
    );
  }

  /* ── běžící pokus ── */
  if (attempt) {
    const answered = Object.keys(answers).length;
    return (
      <section className="border border-hairline bg-paper p-7 shadow-paper">
        <h2 className="text-[19px]">{attempt.title}</h2>
        <p className="mt-2 text-[15px] text-ink-2 tnum">
          Zodpovězeno {answered} z {attempt.questions.length} · uspěješ od{" "}
          {attempt.passingScore} správných
        </p>

        <ol className="mt-6 space-y-7">
          {attempt.questions.map((q, i) => (
            <li key={q.id}>
              <p className="text-[15.5px] text-ink">
                {i + 1}. {q.question}
              </p>
              <p className="mt-1 text-[13px] text-ink-2">{q.section}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((option, index) => (
                  <label
                    key={index}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 border p-3 text-[15px] transition-colors",
                      answers[q.id] === index
                        ? "border-brass bg-paper-2 text-ink"
                        : "border-hairline text-ink-2 hover:bg-paper-2",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === index}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: index }))
                      }
                      className="mt-1 accent-brass"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => void finish()}
          disabled={busy || answered === 0}
          className="mt-8 border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40"
        >
          Odevzdat test
        </button>
      </section>
    );
  }

  /* ── nabídka testů ── */
  return (
    <section className="border border-hairline bg-paper p-7 shadow-paper">
      <h2 className="text-[19px]">Zkušební test</h2>
      {quizzes.map((quiz) => (
        <div key={quiz.slug} className="mt-4">
          <p className="text-[15px] text-ink-2">{quiz.perex}</p>
          <p className="mt-2 text-[14px] text-ink-2 tnum">
            {quiz.questionsPerAttempt} otázek · uspěješ od {quiz.passingScore}{" "}
            správných
            {quiz.attempts > 0 &&
              ` · nejlepší výsledek ${quiz.bestScore}/${quiz.questionsPerAttempt}`}
          </p>
          <button
            type="button"
            onClick={() => void begin(quiz.slug)}
            disabled={busy}
            className="mt-4 border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40"
          >
            {quiz.attempts > 0 ? "Zkusit znovu" : "Spustit test"}
          </button>
        </div>
      ))}
    </section>
  );
}
