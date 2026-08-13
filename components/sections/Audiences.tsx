import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { memberBenefits, membershipTiers } from "@/lib/site";

/**
 * Dvě karty členství (Základní / PRO). Všichni členové jsou si rovni —
 * jeden člen = jeden hlas; varianty se liší jen výhodami.
 */
export function Audiences() {
  const confirmed = memberBenefits.filter((b) => !b.unconfirmed);
  const zakladniBenefits = confirmed.filter((b) => b.zakladni);
  const proExtras = confirmed.filter((b) => b.pro && !b.zakladni);

  const cards = [
    { tier: membershipTiers[0], bullets: zakladniBenefits, extras: false },
    { tier: membershipTiers[1], bullets: proExtras, extras: true },
  ];

  return (
    <section className="border-b border-hairline bg-paper-2">
      <Container className="py-16 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">Členství</h2>
        <p className="mt-3 text-[15.5px] text-ink-2">
          Jeden člen, jeden hlas — bez ohledu na variantu.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {cards.map(({ tier, bullets, extras }) => (
            <Reveal
              key={tier.key}
              className="flex flex-col border border-hairline bg-paper p-7 shadow-paper sm:p-9"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-[22px]">{tier.label}</h3>
                <p className="tnum shrink-0 font-serif text-[19px] font-semibold text-deep">
                  {tier.fee}
                </p>
              </div>
              <p className="mt-1 font-serif text-[17px] italic text-ink-2">
                {tier.claim}
              </p>
              <ul className="mt-6 flex-1 space-y-3 text-[15.5px] leading-relaxed text-ink-2">
                {extras && (
                  <li className="flex gap-3 font-medium text-ink">
                    <span
                      aria-hidden
                      className="mt-[11px] h-px w-4 shrink-0 bg-brass"
                    />
                    Vše ze Základního členství, a navíc:
                  </li>
                )}
                {bullets.map((b) => (
                  <li key={b.label} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-[11px] h-px w-4 shrink-0 bg-brass"
                    />
                    {b.label}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-hairline pt-5">
                <p className="tnum text-[14px] text-ink-2">{tier.feeNote}</p>
                <Link
                  href="/clenstvi"
                  className="shrink-0 text-[15px] font-medium text-brass underline-offset-4 hover:underline"
                >
                  Všechny výhody →
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
