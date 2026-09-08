"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";

import { authInputClass } from "@/components/auth/AuthUi";
import { cn } from "@/lib/utils";

/** Heslo s přepínačem viditelnosti — psaní dlouhého hesla naslepo je past. */
export function PasswordInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  autoComplete = "current-password",
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn(authInputClass, "pr-11")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label={visible ? "Skrýt heslo" : "Zobrazit heslo"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-2 transition-colors hover:text-ink"
      >
        {visible ? (
          <EyeOffIcon className="size-4" aria-hidden />
        ) : (
          <EyeIcon className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
