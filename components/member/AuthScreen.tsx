"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { Container } from "@/components/ui/Container";
import { Seal } from "@/components/ui/Seal";
import { hasClerk } from "@/lib/env";

/**
 * Přihlášení a registrace do členské sekce. `/admin` má vlastní obrazovku
 * (components/admin/AdminSignIn.tsx) — nesmí sdílet tyhle cesty, jinak by
 * se admin po přihlášení zacyklil mimo administraci.
 *
 * Rám kreslíme sami (rámeček s brass obrysem jako v heru), Clerk uvnitř
 * dodává jen formulář — viz `elements.card` v lib/clerkAppearance.ts.
 */
export function AuthScreen({ mode }: { mode: "signIn" | "signUp" }) {
  if (!hasClerk) {
    return (
      <Container className="py-20">
        <p className="text-ink-2">Přihlašování zatím není nakonfigurované.</p>
      </Container>
    );
  }

  const signUp = mode === "signUp";
  const points = signUp
    ? [
        "Účet je zdarma a k ničemu tě nezavazuje.",
        "Variantu členství si vybereš až po registraci.",
        "Členské číslo a doklady najdeš hned ve svém účtu.",
      ]
    : [
        "V účtu máš členské číslo, ověřovací kód a doklady.",
        "Certifikace i datum jejich platnosti na jednom místě.",
        "Obnovování členství zrušíš kdykoli.",
      ];

  return (
    <div className="paper-grid relative overflow-hidden border-b border-hairline">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 hidden -translate-y-1/2 opacity-[0.05] lg:block"
      >
        <Seal decorative className="h-[540px] w-[540px]" />
      </div>

      <Container className="relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_minmax(360px,420px)] lg:gap-16">
        <div>
          <div className="inline-block border-2 border-brass px-5 py-4 sm:px-7 sm:py-5">
            <h1 className="text-[26px] sm:text-[38px]">
              {signUp ? "Registrace" : "Přihlášení"}
            </h1>
          </div>
          <p className="measure mt-6 text-[15.5px] leading-relaxed text-ink-2">
            {signUp
              ? "Založ si účet v České komoře pilotů DRONů. Trvá to minutu a nic tím neplatíš."
              : "Přihlas se do svého členského účtu."}
          </p>
          <ul className="mt-7 space-y-3 text-[15.5px] leading-relaxed text-ink-2">
            {points.map((p) => (
              <li key={p} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-[11px] h-px w-4 shrink-0 bg-brass"
                />
                {p}
              </li>
            ))}
          </ul>
          <p className="measure mt-8 text-[13.5px] leading-relaxed text-ink-2">
            Členství v komoře je dobrovolné a nesouvisí s podmínkami provozu
            DRONů. Ty stanoví Úřad pro civilní letectví.
          </p>
        </div>

        {/* na mobilu bez rámu a bez odsazení — Clerk si drží vlastní minimální
            šířku a v užším rámu z něj vyčnívá ven */}
        <div className="min-w-0 bg-paper sm:border sm:border-hairline sm:p-8 sm:shadow-paper">
          {signUp ? (
            <SignUp
              routing="path"
              path="/registrace"
              signInUrl="/prihlaseni"
              forceRedirectUrl="/muj-ucet"
            />
          ) : (
            <SignIn
              routing="path"
              path="/prihlaseni"
              signUpUrl="/registrace"
              forceRedirectUrl="/muj-ucet"
            />
          )}
        </div>
      </Container>
    </div>
  );
}
