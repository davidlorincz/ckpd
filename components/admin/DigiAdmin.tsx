"use client";

/**
 * Seznam kurzů v administraci.
 *
 * Odsud se kurz zakládá a otevírá; všechno ostatní (lekce, videa, publikování
 * jednotlivých lekcí) je na detailu kurzu, aby tahle obrazovka zůstala
 * přehledem a ne tabulkou všeho.
 */

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { formatTotal } from "@/lib/digiuniverzita";
import { cn } from "@/lib/utils";

export function DigiAdmin() {
  const tree = useQuery(api.digiAdmin.tree);
  const createCourse = useMutation(api.digiAdmin.createCourse);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [perex, setPerex] = useState("");
  const [pro, setPro] = useState(false);
  const [busy, setBusy] = useState(false);

  if (tree === undefined) {
    return <div className="h-64 animate-pulse border border-hairline bg-paper-2" />;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createCourse({
        title,
        perex,
        ...(pro ? { requiredTier: "pro" as const } : {}),
      });
      toast.success("Kurz založen jako návrh.");
      setTitle("");
      setPerex("");
      setPro(false);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Založení selhalo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[15px] text-ink-2">
          {tree.length === 0
            ? "Zatím tu není žádný kurz."
            : `${tree.length} ${tree.length === 1 ? "kurz" : tree.length < 5 ? "kurzy" : "kurzů"}`}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="border border-deep bg-deep px-4 py-2 text-[14.5px] font-medium text-paper transition-colors hover:bg-deep-2"
        >
          {open ? "Zavřít" : "Nový kurz"}
        </button>
      </div>

      {open && (
        <form
          onSubmit={submit}
          className="border border-brass bg-paper p-6 shadow-paper"
        >
          <h2 className="text-[18px]">Nový kurz</h2>
          <p className="mt-1.5 text-[14px] text-ink-2">
            Adresa se odvodí z názvu. Kurz vznikne jako návrh — publikuješ ho,
            až v něm bude obsah.
          </p>

          <label className="mt-5 block text-[14px] text-ink-2">
            Název
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="např. A2 — létání blíž k lidem"
              className="mt-1.5 w-full border border-hairline bg-paper px-3 py-2 text-[15px] text-ink focus:border-brass focus:outline-none"
            />
          </label>

          <label className="mt-4 block text-[14px] text-ink-2">
            Perex
            <textarea
              value={perex}
              onChange={(e) => setPerex(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Jednou dvěma větami, o čem kurz je."
              className="mt-1.5 w-full border border-hairline bg-paper px-3 py-2 text-[15px] text-ink focus:border-brass focus:outline-none"
            />
          </label>

          <label className="mt-4 flex items-center gap-2 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={pro}
              onChange={(e) => setPro(e.target.checked)}
              className="size-4 accent-brass"
            />
            Jen pro členství PRO
          </label>

          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="mt-6 border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40"
          >
            Založit kurz
          </button>
        </form>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {tree.map((course) => {
          const published = course.lessons.filter((l) => l.state === "published");
          const missing = course.lessons.filter((l) => !l.hasVideo).length;
          const total = course.lessons.reduce((a, l) => a + l.durationSeconds, 0);

          return (
            <Link
              key={course.id}
              href={`/admin/kurzy/${course.slug}`}
              className="group border border-hairline bg-paper p-6 shadow-paper transition-shadow hover:shadow-[0_2px_16px_rgba(0,0,100,.10)]"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[19px] leading-tight group-hover:text-brass">
                  {course.title}
                </h2>
                <span
                  className={cn(
                    "shrink-0 border px-2 py-0.5 text-[12px] font-medium",
                    course.state === "published"
                      ? "border-action text-action"
                      : "border-hairline text-ink-2",
                  )}
                >
                  {course.state === "published"
                    ? "publikovaný"
                    : course.state === "archived"
                      ? "archivovaný"
                      : "návrh"}
                </span>
              </div>

              <p className="mt-2 text-[13.5px] text-ink-2 tnum">
                <code>/{course.slug}</code> · {published.length}/
                {course.lessons.length} lekcí · {formatTotal(total)}
                {course.requiredTier === "pro" && " · jen PRO"}
              </p>

              {missing > 0 && (
                <p className="mt-3 border-l-2 border-l-brass bg-paper-2 px-3 py-2 text-[13.5px] text-ink">
                  {missing} {missing === 1 ? "lekce čeká" : "lekcí čeká"} na video
                </p>
              )}

              <span className="mt-4 inline-block border-b border-brass pb-0.5 text-[14px] font-medium text-ink">
                Spravovat →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
