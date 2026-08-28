"use client";

/**
 * Poznámky k místu ve videu.
 *
 * Nová poznámka si vezme aktuální sekundu z přehrávače, takže z ní je odkaz
 * zpátky. Klik na časovou stopu skočí na to místo.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDuration } from "@/lib/digiuniverzita";

export function LessonNotes({
  lessonId,
  currentTime,
  onSeek,
}: {
  lessonId: Id<"lessons">;
  currentTime: number;
  onSeek: (seconds: number) => void;
}) {
  const notes = useQuery(api.notes.forLesson, { lessonId });
  const addNote = useMutation(api.notes.add);
  const removeNote = useMutation(api.notes.remove);

  const [draft, setDraft] = useState("");
  /** Sekunda se zamrazí při začátku psaní — jinak by ujela, než dopíšeš. */
  const [pinnedAt, setPinnedAt] = useState<number | null>(null);

  const at = pinnedAt ?? currentTime;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    await addNote({ lessonId, atSeconds: at, text });
    setDraft("");
    setPinnedAt(null);
  }

  return (
    <section className="border border-hairline bg-paper shadow-paper">
      <h2 className="border-b border-hairline px-5 py-4 text-[17px]">
        Moje poznámky
      </h2>

      <form onSubmit={submit} className="border-b border-hairline p-5">
        <label className="block text-[14px] text-ink-2">
          Poznámka k času{" "}
          <span className="font-medium text-brass tnum">
            {formatDuration(at)}
          </span>
          <textarea
            value={draft}
            onChange={(e) => {
              if (pinnedAt === null) setPinnedAt(currentTime);
              setDraft(e.target.value);
            }}
            rows={3}
            placeholder="Co si chceš zapamatovat?"
            className="mt-2 w-full border border-hairline bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-ink-2 focus:border-brass focus:outline-none"
          />
        </label>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={!draft.trim()}
            className="border border-deep bg-deep px-4 py-2 text-[14px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40"
          >
            Uložit poznámku
          </button>
          {pinnedAt !== null && (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                setPinnedAt(null);
              }}
              className="text-[14px] text-ink-2 underline underline-offset-4 hover:text-ink"
            >
              Zrušit
            </button>
          )}
        </div>
      </form>

      {notes === undefined ? (
        <p className="px-5 py-6 text-[15px] text-ink-2">Načítám…</p>
      ) : notes.length === 0 ? (
        <p className="px-5 py-6 text-[15px] text-ink-2">
          Zatím tu nic nemáš. Poznámka si zapamatuje, v které minutě vznikla.
        </p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-start gap-4 border-b border-hairline px-5 py-3 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onSeek(note.atSeconds)}
                className="w-12 shrink-0 text-left text-[13px] text-brass underline underline-offset-4 tnum"
              >
                {formatDuration(note.atSeconds)}
              </button>
              <p className="flex-1 whitespace-pre-wrap text-[15px] text-ink">
                {note.text}
              </p>
              <button
                type="button"
                onClick={() => void removeNote({ noteId: note.id })}
                aria-label="Smazat poznámku"
                className="shrink-0 text-[14px] text-ink-2 transition-colors hover:text-destructive"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
