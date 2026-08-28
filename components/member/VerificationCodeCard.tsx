"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";

/**
 * Členské číslo a ověřovací kód.
 *
 * Číslo je identita člena — ukazuje se, sdílí se, nemění se. Kód je číslo
 * plus tajný přívěsek; tím člen jednorázově propojí účet u partnera
 * (např. DRONPRO), aby se mu tam propsaly členské výhody.
 */
export function VerificationCodeCard({
  memberNumber,
  code,
}: {
  memberNumber?: string;
  code?: string;
}) {
  const rotate = useMutation(api.members.rotateVerificationCode);
  const [rotating, setRotating] = useState(false);
  const [revealed, setRevealed] = useState(false);

  if (!memberNumber) return null;

  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${what} zkopírován${what === "Kód" ? "" : "o"}.`);
    } catch {
      toast.error("Kopírování se nepovedlo — označ text a zkopíruj ručně.");
    }
  }

  async function handleRotate() {
    if (
      !confirm(
        "Vygenerovat nový ověřovací kód? Ten stávající okamžitě přestane " +
          "platit a u partnerů se budeš muset propojit znovu. Členské číslo " +
          "zůstane stejné.",
      )
    )
      return;
    setRotating(true);
    try {
      await rotate();
      setRevealed(true);
      toast.success("Nový kód vygenerován.");
    } catch {
      toast.error("Kód se nepodařilo přegenerovat.");
    } finally {
      setRotating(false);
    }
  }

  return (
    <section className="border border-hairline bg-paper p-7 shadow-paper sm:p-9">
      <h2 className="text-[20px] sm:text-[24px]">Členské číslo a ověření</h2>

      <div className="mt-6">
        <p className="text-[13px] uppercase tracking-wider text-ink-2">
          Členské číslo
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <code className="tnum select-all font-mono text-[19px] tracking-[0.08em] text-ink">
            {memberNumber}
          </code>
          <button
            type="button"
            onClick={() => copy(memberNumber!, "Číslo")}
            className="text-[13.5px] text-deep underline-offset-4 hover:underline"
          >
            Kopírovat
          </button>
        </div>
        <p className="measure mt-2 text-[13.5px] leading-relaxed text-ink-2">
          Tvoje identita v komoře. Můžeš ji klidně uvádět veřejně.
        </p>
      </div>

      {code && (
        <div className="mt-8 border-t border-hairline pt-6">
          <p className="text-[13px] uppercase tracking-wider text-ink-2">
            Ověřovací kód
          </p>
          <p className="measure mt-2 text-[14.5px] leading-relaxed text-ink-2">
            Vlož ho jednou u partnera komory (třeba na DRONPRO) a členské
            výhody se ti propíšou do účtu. Zacházej s ním jako s heslem —
            kdo ho má, může tvoje členství vydávat za ověřené.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code
              className={
                "tnum border border-hairline bg-paper-2 px-4 py-3 font-mono text-[16px] tracking-[0.1em] text-ink" +
                (revealed ? " select-all" : " select-none blur-[5px]")
              }
              aria-hidden={!revealed}
            >
              {code}
            </code>
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              className="rounded-[2px] border border-deep px-4 py-2.5 text-[14px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
            >
              {revealed ? "Skrýt" : "Zobrazit"}
            </button>
            <button
              type="button"
              onClick={() => copy(code, "Kód")}
              className="rounded-[2px] border border-deep px-4 py-2.5 text-[14px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
            >
              Kopírovat
            </button>
          </div>

          <button
            type="button"
            onClick={handleRotate}
            disabled={rotating}
            className="mt-5 text-[14px] text-ink-2 underline-offset-4 hover:underline disabled:opacity-50"
          >
            {rotating ? "Generuji…" : "Kód mi unikl — vygenerovat nový"}
          </button>
        </div>
      )}
    </section>
  );
}
