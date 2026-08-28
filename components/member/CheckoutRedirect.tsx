"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/ui/Container";

/**
 * Mezistav mezi webem a platební bránou. Ve Stripe verzi tady místo
 * `router.replace` bude `window.location.href = session.url` — proto tu
 * obrazovka je už teď, ať se tok nemění.
 */
export function CheckoutRedirect() {
  const router = useRouter();
  const params = useSearchParams();
  const tier = params.get("tarif") ?? "zakladni";

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(`/platba/mock?tarif=${encodeURIComponent(tier)}`);
    }, 1400);
    return () => clearTimeout(t);
  }, [router, tier]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-hairline border-t-brass"
        aria-hidden
      />
      <p className="mt-6 font-serif text-[20px] font-bold uppercase text-brass">
        Přesměrováváme na platební bránu
      </p>
      <p className="measure mt-3 text-[15.5px] text-ink-2">
        Za okamžik tě přepneme na zabezpečenou stránku platební brány. Údaje
        o kartě zadáváš přímo tam — komora se k nim nedostane.
      </p>
    </Container>
  );
}
