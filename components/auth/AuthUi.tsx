"use client";

import Link from "next/link";
import { LoaderCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ctaClass } from "@/components/ui/Cta";

/**
 * Stavební prvky auth obrazovek.
 *
 * Držíme se institucionálního jazyka webu: radius 2 px, hairline rámečky,
 * žádné stíny ani gradienty. Tlačítka nemají vlastní varianty — berou se
 * z `components/ui/Cta.tsx`, aby se konverzní zelená nedefinovala dvakrát.
 */

/** Input v členské sekci, jen o kousek vyšší — na auth je pole hlavní hrdina. */
export const authInputClass =
  "h-11 w-full rounded-[2px] border border-hairline bg-paper px-3.5 text-[15.5px] text-ink placeholder:text-ink-2/60 transition-colors focus:border-brass aria-[invalid=true]:border-destructive";

export const authLabelClass = "mb-1.5 block text-[14px] font-medium text-ink";

/** Nadpis v modrém rámečku — podpis ČKPD, stejný jako na ostatních stránkách. */
export function AuthHeading({
  title,
  lead,
}: {
  title: string;
  lead?: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="inline-block border-2 border-brass px-5 py-3">
        <h1 className="text-[24px] sm:text-[28px]">{title}</h1>
      </div>
      {lead ? (
        <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{lead}</p>
      ) : null}
    </div>
  );
}

/**
 * Krokovník. Žádná kolečka s fajfkami — jen popisek verzálkami a tenká linka,
 * jak to má zbytek webu.
 */
export function StepMeter({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-6">
      <p className="font-serif text-[12px] font-bold uppercase tracking-[0.18em] text-brass">
        Krok {step} ze {total}
      </p>
      <div className="mt-2 h-px w-full bg-hairline">
        <div
          className="h-px bg-brass transition-[width] duration-500"
          style={{ width: `${Math.round((step / total) * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Vodorovná linka s popiskem uprostřed. */
export function OrDivider() {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="h-px w-full bg-hairline" />
      <span className="absolute bg-paper px-3 text-[12px] uppercase tracking-[0.18em] text-ink-2">
        nebo
      </span>
    </div>
  );
}

export function AuthError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-5 rounded-[2px] border border-destructive/40 bg-destructive/5 px-4 py-3 text-[14px] leading-relaxed text-destructive"
    >
      {message}
    </p>
  );
}

export function AuthNotice({
  message,
  children,
}: {
  message?: string | null;
  children?: React.ReactNode;
}) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="mb-5 rounded-[2px] border border-hairline bg-paper-2 px-4 py-3 text-[14px] leading-relaxed text-ink"
    >
      {message}
      {children ? <span className="mt-2 block">{children}</span> : null}
    </div>
  );
}

export function SubmitButton({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={ctaClass(
        "conversion",
        "flex w-full items-center justify-center gap-2 disabled:opacity-60",
      )}
    >
      {pending ? (
        <LoaderCircleIcon className="size-4 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

/** Odkazové tlačítko uvnitř formuláře (jiný krok, znovu poslat kód…). */
export function LinkButton({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-[14px] font-medium text-brass underline-offset-4 transition-colors hover:underline disabled:opacity-50 disabled:hover:no-underline",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-brass underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

/** Změna kroku pro čtečky obrazovky — vizuálně se pozná z nadpisu. */
export function StepAnnouncement({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={authLabelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-[13.5px] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-ink-2">{hint}</p>
      ) : null}
    </div>
  );
}
