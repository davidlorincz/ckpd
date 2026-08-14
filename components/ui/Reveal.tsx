"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Vstupní animace sekce: fade + 4 px posun, 200 ms ease-out (PRD § 6.6).
 * `prefers-reduced-motion` řeší CSS. Animace nikdy nesmí obsah schovat:
 * prvky ve viewportu se odkryjí hned, ostatní přes IntersectionObserver,
 * a pojistný časovač odkryje vše i tam, kde observer nefunguje.
 */
export function Reveal({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const show = () => el.classList.add("is-visible");

    if (el.getBoundingClientRect().top < window.innerHeight) {
      show();
      return;
    }

    // pojistka: observer po observe() vždy pošle iniciální callback;
    // když nepřijde, je rozbitý a obsah se odkryje bez animace
    const failsafe = window.setTimeout(show, 1500);

    const io = new IntersectionObserver(
      (entries) => {
        window.clearTimeout(failsafe);
        if (entries.some((e) => e.isIntersecting)) {
          show();
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div ref={ref} className={cn("reveal", className)}>
      {children}
    </div>
  );
}
