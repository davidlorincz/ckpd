"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { routeForCode } from "@/lib/verifyRouting";
import { ctaClass } from "@/components/ui/Cta";

/**
 * Jedno pole pro všechny tři druhy kódů.
 *
 * Schválně ne nativní GET formulář: ověřovací kód člena je tajemství a GET
 * by ho protáhl query stringem, který skončí v historii i v logu proxy.
 * `router.push` na path segment je o kus lepší.
 */
export function VerifyForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mt-8 max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const target = routeForCode(code);
        if (!target) {
          setError(
            "Tenhle kód neznáme. Zkontroluj přepis — čekáme tvar CKPD-2026-0142-XXXXXXXX, CKPD-OS-2026-XXXXXXXX nebo CKPD-DU-2026-XXXXXXXX.",
          );
          return;
        }
        setError(null);
        router.push(target.href);
      }}
    >
      <label
        htmlFor="verify-code"
        className="block text-[13px] font-medium uppercase tracking-wider text-ink-2"
      >
        Kód k ověření
      </label>
      <div className="mt-2 flex flex-wrap gap-3">
        <input
          id="verify-code"
          name="code"
          value={code}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="CKPD-2026-0142-K7M9XQ2T"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "verify-error" : undefined}
          className="tnum h-11 min-w-0 flex-1 rounded-[2px] border border-hairline bg-paper px-3 text-[15px] text-ink placeholder:text-ink-2/60 focus:border-brass focus:outline-none"
        />
        <button type="submit" className={ctaClass("primary", "shrink-0")}>
          Ověřit
        </button>
      </div>
      {error && (
        <p id="verify-error" role="alert" className="mt-3 text-[14px] text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
