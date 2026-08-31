"use client";

/**
 * Dohledání uniklého odkazu na video.
 *
 * Podepsaná adresa je z principu vidět v prohlížeči a člen ji může poslat dál.
 * Zabránit tomu bez DRM nejde, ale jde poznat, čí přihlášení ji vytvořilo —
 * a to je proti sdílení účinnější než technika, protože riziko nese konkrétní
 * člověk, ne anonymní „někdo".
 */

import { useState } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

const czDateTime = (ms: number) =>
  new Date(ms).toLocaleString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function TokenTrace() {
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const result = useQuery(
    api.digiAdmin.traceToken,
    query ? { input: query } : "skip",
  );

  return (
    <section className="mt-10 border border-hairline bg-paper p-6 shadow-paper">
      <h2 className="text-[19px]">Dohledat uniklý odkaz</h2>
      <p className="measure mt-2 text-[14.5px] text-ink-2">
        Vlož celou adresu videa, samotný token nebo jen jeho identifikátor.
        Vypadne členství, kterému byl odkaz vydán, a kdy.
      </p>

      <form
        className="mt-5 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(draft.trim());
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://stream.mux.com/…?token=eyJ…"
          aria-label="Adresa nebo token"
          className="min-w-0 flex-1 border border-hairline bg-paper px-3 py-2 text-[14px] text-ink placeholder:text-ink-2 focus:border-brass focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="border border-deep bg-deep px-4 py-2 text-[14.5px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40"
        >
          Dohledat
        </button>
      </form>

      {query && result === undefined && (
        <p className="mt-5 text-[15px] text-ink-2">Hledám…</p>
      )}

      {result?.status === "bad_input" && (
        <p className="mt-5 border border-hairline bg-paper-2 p-4 text-[15px] text-ink-2">
          V tomhle vstupu není identifikátor odkazu. Zkontroluj, že jsi zkopíroval
          celou adresu i s <code>?token=</code>.
        </p>
      )}

      {result?.status === "not_found" && (
        <p className="mt-5 border border-hairline bg-paper-2 p-4 text-[15px] text-ink-2">
          Odkaz <code>{result.jti}</code> neevidujeme. Buď je starší než 90 dní
          (evidence se po té době maže), nebo nevznikl u nás.
        </p>
      )}

      {result?.status === "found" && (
        <div className="mt-5 border border-hairline border-l-2 border-l-brass bg-paper p-5">
          <p className="text-[13px] uppercase tracking-wide text-ink-2">
            Odkaz byl vydán
          </p>
          <p className="mt-2 text-[17px] text-ink">
            {result.member?.name ?? "člen už neexistuje"}
            {result.member?.memberNumber && (
              <span className="ml-2 text-ink-2 tnum">
                {result.member.memberNumber}
              </span>
            )}
          </p>
          {result.member && (
            <p className="mt-1 text-[14px] text-ink-2">
              {result.member.email} · členství {result.member.status}
              {result.member.tier && ` · ${result.member.tier}`}
            </p>
          )}
          <p className="mt-3 text-[14px] text-ink-2">
            {result.lesson
              ? `Lekce: ${result.lesson.title}`
              : "Lekce už neexistuje"}{" "}
            · {czDateTime(result.issuedAt)}
          </p>
          <p className="mt-3 text-[13px] text-ink-2">
            Znamená to, že odkaz vytvořilo tohle přihlášení — ne nutně že ho ten
            člověk šířil.
          </p>
        </div>
      )}
    </section>
  );
}
