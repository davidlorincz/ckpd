"use client";

import { useEffect, useRef, useState } from "react";

import { authLabelClass } from "@/components/auth/AuthUi";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 45;

/**
 * Jeden široký input na ověřovací kód.
 *
 * Schválně ne šest okének: `autocomplete="one-time-code"` míří na jediné pole
 * (iOS i Chrome ho tak nabízejí), jeden input znamená jeden popisek a jednu
 * chybovou hlášku, a odpadá ruční práce s kurzorem při vkládání ze schránky.
 *
 * Po šestém znaku se odesílá samo — po přepsání kódu z mailu už není co
 * potvrzovat. `submittedFor` hlídá, aby se stejný kód neposlal dvakrát.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  onResend,
  disabled,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  onResend: () => void;
  disabled?: boolean;
  error?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedFor = useRef<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (value.length !== CODE_LENGTH || disabled) return;
    if (submittedFor.current === value) return;
    submittedFor.current = value;
    onComplete(value);
  }, [value, disabled, onComplete]);

  return (
    <div>
      <label htmlFor="code" className={authLabelClass}>
        Ověřovací kód
      </label>
      <input
        ref={inputRef}
        id="code"
        name="code"
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
        }
        disabled={disabled}
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={CODE_LENGTH}
        autoComplete="one-time-code"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "code-error" : undefined}
        className="h-14 w-full rounded-[2px] border border-hairline bg-paper text-center font-serif text-[26px] tracking-[0.5em] text-ink transition-colors focus:border-brass aria-[invalid=true]:border-destructive"
      />
      {error ? (
        <p id="code-error" className="mt-1.5 text-[13.5px] text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-3 text-[14px] text-ink-2">
        {cooldown > 0 ? (
          <span>Nový kód lze poslat za {cooldown} s</span>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setCooldown(RESEND_COOLDOWN_SECONDS);
              submittedFor.current = null;
              onResend();
            }}
            className="font-medium text-brass underline-offset-4 transition-colors hover:underline disabled:opacity-50"
          >
            Poslat kód znovu
          </button>
        )}
      </div>
    </div>
  );
}
