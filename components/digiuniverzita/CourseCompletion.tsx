"use client";

/**
 * Potvrzení o absolvování kurzu.
 *
 * Ukazuje se, až je kurz opravdu hotový. Hodnota potvrzení stojí na tom,
 * že je ověřitelné — proto je vedle kódu vždy vidět i veřejná adresa,
 * na které si ho kdokoli zkontroluje.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

export function CourseCompletion({
  courseSlug,
  courseCompleted,
}: {
  courseSlug: string;
  courseCompleted: boolean;
}) {
  const existing = useQuery(api.completions.mine, { courseSlug });
  const issue = useMutation(api.completions.issue);
  const [busy, setBusy] = useState(false);

  if (!courseCompleted && !existing) return null;

  const verifyUrl = existing
    ? `${typeof window === "undefined" ? "" : window.location.origin}/overit/potvrzeni/${existing.code}`
    : null;

  return (
    <section className="border border-hairline border-l-2 border-l-action bg-paper p-7 shadow-paper">
      <h2 className="text-[19px]">Potvrzení o absolvování</h2>

      {existing ? (
        <>
          <p className="mt-2 text-[15px] text-ink-2">
            Vydáno{" "}
            {new Date(existing.issuedAt).toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {existing.revoked && " · potvrzení bylo odebráno"}
          </p>
          <p className="mt-4 font-serif text-[20px] font-bold uppercase text-brass tnum">
            {existing.code}
          </p>
          {verifyUrl && (
            <p className="mt-3 break-all text-[14px] text-ink-2">
              Ověřit lze na{" "}
              <a
                href={`/overit/potvrzeni/${existing.code}`}
                className="text-brass underline underline-offset-4"
              >
                {verifyUrl}
              </a>
            </p>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-[15px] text-ink-2">
            Kurz máš hotový. Komora ti k němu vydá potvrzení s kódem, který si
            může kdokoli veřejně ověřit.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await issue({ courseSlug });
              setBusy(false);
            }}
            className="mt-5 border border-deep bg-deep px-5 py-2.5 text-[15px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40"
          >
            Vydat potvrzení
          </button>
        </>
      )}
    </section>
  );
}
