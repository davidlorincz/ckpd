"use client";

/**
 * Správa jednoho kurzu: metadata, lekce, videa, pořadí.
 *
 * Pořadí se přehazuje šipkami, ne přetahováním — u desítek položek je to
 * spolehlivější, funguje z klávesnice a nepotřebuje to knihovnu.
 *
 * Mazat jde jen to, co nikdo nesledoval. Jakmile u lekce visí postup člena,
 * nabídne se archivace; smazáním by ta data osiřela.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDuration, formatTotal } from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  perex: string;
  position: number;
  state: string;
  stateNote?: string;
  durationSeconds: number;
  isPreview: boolean;
  isRequired: boolean;
  hasVideo: boolean;
  provider: string | null;
  transcriptCues: number;
  watchers: number;
};

const field =
  "w-full border border-hairline bg-paper px-3 py-2 text-[15px] text-ink focus:border-brass focus:outline-none";

/** `5:41` → sekundy. Přijme i holé sekundy. */
function parseDuration(input: string): number | null {
  const t = input.trim();
  if (/^\d+$/.test(t)) return Number(t);
  const m = /^(\d+):([0-5]?\d)$/.exec(t);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function DigiCourseAdmin({ slug }: { slug: string }) {
  const router = useRouter();
  const course = useQuery(api.digiAdmin.courseDetail, { slug });
  const updateCourse = useMutation(api.digiAdmin.updateCourse);
  const setCourseState = useMutation(api.digiAdmin.setCourseState);
  const createLesson = useMutation(api.digiAdmin.createLesson);
  const updateLesson = useMutation(api.digiAdmin.updateLesson);
  const deleteLesson = useMutation(api.digiAdmin.deleteLesson);
  const setLessonState = useMutation(api.digiAdmin.setLessonState);
  const reorder = useMutation(api.digiAdmin.reorderLessons);
  const deleteCourse = useMutation(api.digiAdmin.deleteCourse);
  const createUpload = useAction(api.video.createDirectUpload);

  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [meta, setMeta] = useState(false);

  if (course === undefined) {
    return <div className="h-96 animate-pulse border border-hairline bg-paper-2" />;
  }
  if (course === null) {
    return (
      <div className="border border-hairline bg-paper-2 p-8">
        <p className="text-[15.5px] text-ink">Kurz nenalezen.</p>
        <Link
          href="/admin/kurzy"
          className="mt-3 inline-block text-[15px] text-brass underline underline-offset-4"
        >
          Zpět na kurzy
        </Link>
      </div>
    );
  }

  const total = course.lessons.reduce((a, l) => a + l.durationSeconds, 0);

  async function move(index: number, direction: -1 | 1) {
    const next = [...course!.lessons];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await reorder({
      courseId: course!.id as Id<"courses">,
      lessonIds: next.map((l) => l.id as Id<"lessons">),
    });
  }

  async function upload(lessonSlug: string, file: File) {
    setUploading(lessonSlug);
    try {
      const { uploadUrl } = await createUpload({
        courseSlug: course!.slug,
        lessonSlug,
      });
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type || "video/mp4" },
        body: file,
      });
      if (!res.ok) throw new Error(`Nahrání selhalo (${res.status}).`);
      toast.success("Nahráno. Video se enkóduje a napojí se samo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nahrání selhalo.");
    } finally {
      setUploading(null);
    }
  }

  async function remove(lesson: Lesson) {
    if (lesson.watchers > 0) {
      toast.error(
        `Lekci sleduje ${lesson.watchers} členů — místo mazání ji stáhni na návrh.`,
      );
      return;
    }
    if (!confirm(`Opravdu smazat lekci „${lesson.title}"? Nejde vzít zpět.`)) return;
    try {
      await deleteLesson({ lessonId: lesson.id as Id<"lessons"> });
      toast.success("Lekce smazána.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Smazání selhalo.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/admin/kurzy"
        className="text-[14px] text-ink-2 underline-offset-4 hover:text-ink hover:underline"
      >
        ← Kurzy
      </Link>

      {/* ── metadata kurzu ── */}
      <section className="border border-hairline bg-paper p-6 shadow-paper">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[22px] leading-tight">{course.title}</h2>
            <p className="mt-1.5 text-[13.5px] text-ink-2 tnum">
              <code>/{course.slug}</code> · {course.lessons.length} lekcí ·{" "}
              {formatTotal(total)}
              {course.requiredTier === "pro" && " · jen PRO"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMeta((v) => !v)}
              className="border border-hairline px-3 py-1.5 text-[14px] font-medium text-ink transition-colors hover:bg-paper-2"
            >
              {meta ? "Zavřít" : "Upravit"}
            </button>
            <button
              type="button"
              onClick={() =>
                void setCourseState({
                  courseId: course.id as Id<"courses">,
                  state: course.state === "published" ? "draft" : "published",
                })
              }
              className={cn(
                "border px-3.5 py-1.5 text-[14px] font-medium transition-colors",
                course.state === "published"
                  ? "border-action bg-action text-white hover:bg-action-2"
                  : "border-hairline text-ink-2 hover:text-ink",
              )}
            >
              {course.state === "published" ? "Publikováno" : "Návrh"}
            </button>
          </div>
        </div>

        {meta && (
          <form
            className="mt-6 border-t border-hairline pt-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await updateCourse({
                courseId: course.id as Id<"courses">,
                title: String(form.get("title") ?? ""),
                perex: String(form.get("perex") ?? ""),
                coverImageUrl: String(form.get("cover") ?? ""),
                requiredTier: form.get("pro") ? "pro" : null,
              });
              toast.success("Uloženo.");
              setMeta(false);
            }}
          >
            <label className="block text-[14px] text-ink-2">
              Název
              <input name="title" defaultValue={course.title} className={cn(field, "mt-1.5")} />
            </label>
            <label className="mt-4 block text-[14px] text-ink-2">
              Perex
              <textarea
                name="perex"
                rows={3}
                defaultValue={course.perex}
                className={cn(field, "mt-1.5")}
              />
            </label>
            <label className="mt-4 block text-[14px] text-ink-2">
              Obálka (cesta v <code>/public</code>)
              <input
                name="cover"
                defaultValue={course.coverImageUrl ?? ""}
                placeholder="/digiuniverzita/nazev.webp"
                className={cn(field, "mt-1.5")}
              />
            </label>
            <label className="mt-4 flex items-center gap-2 text-[14px] text-ink">
              <input
                type="checkbox"
                name="pro"
                defaultChecked={course.requiredTier === "pro"}
                className="size-4 accent-brass"
              />
              Jen pro členství PRO
            </label>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <button
                type="submit"
                className="border border-deep bg-deep px-5 py-2 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
              >
                Uložit
              </button>

              {/*
                Mazání kurzu projde jen tehdy, když v něm nikdo nic nesledoval —
                jinak mutace odmítne a nabídne archivaci. Kontroluje to server,
                aby to nešlo obejít schovaným tlačítkem.
              */}
              <button
                type="button"
                onClick={async () => {
                  if (
                    !confirm(
                      `Opravdu smazat celý kurz „${course.title}" i s lekcemi? Nejde vzít zpět.`,
                    )
                  ) {
                    return;
                  }
                  try {
                    await deleteCourse({ courseId: course.id as Id<"courses"> });
                    toast.success("Kurz smazán.");
                    router.push("/admin/kurzy");
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : "Smazání selhalo.",
                    );
                  }
                }}
                className="text-[14px] text-ink-2 underline-offset-4 transition-colors hover:text-destructive hover:underline"
              >
                Smazat kurz
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ── lekce ── */}
      <section>
        <div className="flex items-center justify-between gap-4 border-b border-hairline pb-4">
          <h2 className="text-[19px]">Lekce</h2>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="border border-deep bg-deep px-4 py-2 text-[14.5px] font-medium text-paper transition-colors hover:bg-deep-2"
          >
            {adding ? "Zavřít" : "Přidat lekci"}
          </button>
        </div>

        {adding && (
          <form
            className="mt-5 border border-brass bg-paper p-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const seconds = parseDuration(String(form.get("duration") ?? ""));
              if (!seconds) {
                toast.error("Délka musí být ve tvaru 5:41 nebo v sekundách.");
                return;
              }
              try {
                await createLesson({
                  courseId: course.id as Id<"courses">,
                  title: String(form.get("title") ?? ""),
                  perex: String(form.get("perex") ?? ""),
                  durationSeconds: seconds,
                });
                toast.success("Lekce přidána jako návrh. Teď k ní nahraj video.");
                setAdding(false);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Přidání selhalo.");
              }
            }}
          >
            <label className="block text-[14px] text-ink-2">
              Název lekce
              <input name="title" required className={cn(field, "mt-1.5")} />
            </label>
            <label className="mt-4 block text-[14px] text-ink-2">
              Perex
              <textarea name="perex" rows={2} className={cn(field, "mt-1.5")} />
            </label>
            <label className="mt-4 block text-[14px] text-ink-2">
              Délka
              <input
                name="duration"
                required
                placeholder="5:41"
                className={cn(field, "mt-1.5 max-w-32")}
              />
              <span className="mt-1 block text-[13px] text-ink-2">
                Odhad stačí — po nahrání videa se přepíše přesnou stopáží.
              </span>
            </label>
            <button
              type="submit"
              className="mt-5 border border-deep bg-deep px-5 py-2 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
            >
              Přidat lekci
            </button>
          </form>
        )}

        {course.lessons.length === 0 ? (
          <p className="mt-6 border border-hairline bg-paper-2 p-6 text-[15px] text-ink-2">
            Kurz zatím nemá lekce. Přidej první a nahraj k ní video.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {course.lessons.map((lesson, index) => (
              <li
                key={lesson.id}
                className={cn(
                  "border border-hairline bg-paper p-5 shadow-paper",
                  lesson.state !== "published" && "bg-paper-2/50",
                )}
              >
                <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => void move(index, -1)}
                      disabled={index === 0}
                      aria-label="Posunout nahoru"
                      className="border border-hairline px-2 text-[13px] text-ink-2 transition-colors hover:text-ink disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => void move(index, 1)}
                      disabled={index === course.lessons.length - 1}
                      aria-label="Posunout dolů"
                      className="border border-hairline px-2 text-[13px] text-ink-2 transition-colors hover:text-ink disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <span className="mt-1 w-6 shrink-0 text-[14px] text-ink-2 tnum">
                    {lesson.position}.
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] text-ink">{lesson.title}</p>
                    <p className="mt-1 text-[14px] text-ink-2">{lesson.perex}</p>
                    {lesson.stateNote && (
                      <p className="mt-1.5 text-[13.5px] text-brass">
                        {lesson.stateNote}
                      </p>
                    )}
                    <p className="mt-2 text-[13px] text-ink-2 tnum">
                      <code>/{lesson.slug}</code> ·{" "}
                      {formatDuration(lesson.durationSeconds)} ·{" "}
                      {lesson.transcriptCues
                        ? `${lesson.transcriptCues} vět přepisu`
                        : "bez přepisu"}
                      {lesson.watchers > 0 && ` · sleduje ${lesson.watchers}`}
                      {lesson.isPreview && " · veřejná ukázka"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {lesson.hasVideo ? (
                      <span className="text-[14px] text-action">
                        ✓ {lesson.provider}
                      </span>
                    ) : uploading === lesson.slug ? (
                      <span className="text-[14px] text-ink-2">nahrávám…</span>
                    ) : (
                      <label className="cursor-pointer border border-hairline px-2.5 py-1 text-[13.5px] font-medium text-ink transition-colors hover:border-brass hover:text-brass">
                        Nahrát video
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          disabled={!!uploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void upload(lesson.slug, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        void setLessonState({
                          lessonId: lesson.id as Id<"lessons">,
                          state: lesson.state === "published" ? "draft" : "published",
                          stateNote: lesson.stateNote,
                        })
                      }
                      className={cn(
                        "border px-2.5 py-1 text-[13.5px] font-medium transition-colors",
                        lesson.state === "published"
                          ? "border-action bg-action text-white"
                          : "border-hairline text-ink-2 hover:text-ink",
                      )}
                    >
                      {lesson.state === "published" ? "Publikováno" : "Návrh"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditing(editing === lesson.id ? null : lesson.id)
                      }
                      className="border border-hairline px-2.5 py-1 text-[13.5px] font-medium text-ink transition-colors hover:bg-paper-2"
                    >
                      Upravit
                    </button>

                    <button
                      type="button"
                      onClick={() => void remove(lesson)}
                      title={
                        lesson.watchers > 0
                          ? "Lekci už někdo sleduje — smazat nelze"
                          : "Smazat lekci"
                      }
                      className="border border-hairline px-2.5 py-1 text-[13.5px] font-medium text-ink-2 transition-colors hover:border-destructive hover:text-destructive disabled:opacity-40"
                      disabled={lesson.watchers > 0}
                    >
                      Smazat
                    </button>
                  </div>
                </div>

                {editing === lesson.id && (
                  <form
                    className="mt-5 border-t border-hairline pt-5"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      const seconds = parseDuration(
                        String(form.get("duration") ?? ""),
                      );
                      if (!seconds) {
                        toast.error("Délka musí být ve tvaru 5:41 nebo v sekundách.");
                        return;
                      }
                      await updateLesson({
                        lessonId: lesson.id as Id<"lessons">,
                        title: String(form.get("title") ?? ""),
                        perex: String(form.get("perex") ?? ""),
                        durationSeconds: seconds,
                        isPreview: !!form.get("preview"),
                        isRequired: !!form.get("required"),
                        stateNote: String(form.get("note") ?? ""),
                      });
                      toast.success("Uloženo.");
                      setEditing(null);
                    }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-[14px] text-ink-2 sm:col-span-2">
                        Název
                        <input
                          name="title"
                          defaultValue={lesson.title}
                          className={cn(field, "mt-1.5")}
                        />
                      </label>
                      <label className="block text-[14px] text-ink-2 sm:col-span-2">
                        Perex
                        <textarea
                          name="perex"
                          rows={2}
                          defaultValue={lesson.perex}
                          className={cn(field, "mt-1.5")}
                        />
                      </label>
                      <label className="block text-[14px] text-ink-2">
                        Délka
                        <input
                          name="duration"
                          defaultValue={formatDuration(lesson.durationSeconds)}
                          className={cn(field, "mt-1.5")}
                        />
                      </label>
                      <label className="block text-[14px] text-ink-2">
                        Poznámka ke stavu
                        <input
                          name="note"
                          defaultValue={lesson.stateNote ?? ""}
                          placeholder="např. čeká na přerender"
                          className={cn(field, "mt-1.5")}
                        />
                      </label>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-6">
                      <label className="flex items-center gap-2 text-[14px] text-ink">
                        <input
                          type="checkbox"
                          name="preview"
                          defaultChecked={lesson.isPreview}
                          className="size-4 accent-brass"
                        />
                        Veřejná ukázka (hraje i nepřihlášenému)
                      </label>
                      <label className="flex items-center gap-2 text-[14px] text-ink">
                        <input
                          type="checkbox"
                          name="required"
                          defaultChecked={lesson.isRequired}
                          className="size-4 accent-brass"
                        />
                        Počítá se do procent kurzu
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="mt-5 border border-deep bg-deep px-5 py-2 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2"
                    >
                      Uložit lekci
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
