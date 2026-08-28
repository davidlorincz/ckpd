"use client";

/**
 * Úvodní obrazovka administrace.
 *
 * Čtyři čísla, podle kterých se admin rozhoduje, co dělat dál — a rovnou
 * odkazy tam, kde se to dělá. Kdyby tu byl graf návštěvnosti, nikoho by
 * nikam neposlal.
 */

import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

function Tile({
  label,
  value,
  note,
  href,
  action,
  alert,
}: {
  label: string;
  value: string;
  note: string;
  href: string;
  action: string;
  alert?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex flex-col border border-hairline bg-paper p-6 shadow-paper",
        alert && "border-l-2 border-l-brass",
      )}
    >
      <p className="text-[13px] uppercase tracking-[0.08em] text-ink-2">{label}</p>
      <p className="mt-3 font-serif text-[40px] font-bold leading-none text-brass tnum">
        {value}
      </p>
      <p className="mt-3 flex-1 text-[14px] text-ink-2">{note}</p>
      <Link
        href={href}
        className="mt-5 self-start border-b border-brass pb-0.5 text-[14px] font-medium text-ink transition-colors hover:text-brass"
      >
        {action} →
      </Link>
    </article>
  );
}

export function AdminOverview() {
  const stats = useQuery(api.digiAdmin.overview);

  if (stats === undefined) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-52 animate-pulse border border-hairline bg-paper-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <Tile
        label="Členové"
        value={String(stats.members.active)}
        note={`s platným členstvím z ${stats.members.total} registrovaných účtů`}
        href="/admin/uzivatele"
        action="Spravovat přístupy"
      />
      <Tile
        label="Kurzy"
        value={`${stats.courses.published}/${stats.courses.total}`}
        note="publikovaných kurzů — nepublikovaný vidí jen administrace"
        href="/admin/kurzy"
        action="Otevřít DIGI univerzitu"
      />
      <Tile
        label="Lekce"
        value={`${stats.lessons.published}/${stats.lessons.total}`}
        note="publikovaných lekcí napříč všemi kurzy"
        href="/admin/kurzy"
        action="Upravit publikování"
      />
      <Tile
        label="Bez videa"
        value={String(stats.lessons.withoutVideo)}
        note={
          stats.lessons.withoutVideo === 0
            ? "všechny lekce mají nahrané video"
            : "lekcí čeká na nahrání videa"
        }
        href="/admin/kurzy"
        action="Nahrát video"
        alert={stats.lessons.withoutVideo > 0}
      />
    </div>
  );
}
