import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { VerifyForm } from "@/components/verify/VerifyForm";
import { SKILLS, validityLabel } from "@/lib/skills";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Ověření pilota",
  description:
    "Ověření členství, certifikace ČKPD a potvrzení o absolvování kurzu České komory pilotů DRONů. Bez přihlášení.",
};

const kinds = [
  {
    key: "clen",
    title: "Člen a všechny jeho certifikace",
    text: "Ověřovacím kódem člena zjistíš, že členství platí, a rovnou uvidíš všechny certifikace včetně data „platné do“.",
    code: "CKPD-2026-0142-XXXXXXXX",
  },
  {
    key: "osvedceni",
    title: "Jedna certifikace",
    text: "Kód z konkrétního certifikátu. Pilot ho může ukázat, aniž by dával z ruky přístup k celému členství.",
    code: "CKPD-CERT-2026-XXXXXXXX",
  },
  {
    key: "potvrzeni",
    title: "Potvrzení o absolvování kurzu",
    text: "Kód z potvrzení, které komora vydává po dokončení kurzu DIGI univerzity.",
    code: "CKPD-DU-2026-XXXXXXXX",
  },
] as const;

export default function VerifyPage() {
  return (
    <>
      <PageHeader
        title={<E k="overit.header.title">Ověření pilota</E>}
        lead={
          <E k="overit.header.lead">
            Zaměstnavatel, úřad i zadavatel si tady může ověřit, jaké certifikace
            a jaké zkušenosti pilot má. Bez přihlášení, zdarma, přímo od komory
            — a funguje to i mimo Burzu.
          </E>
        }
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <VerifyForm />

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {kinds.map((k) => (
              <div
                key={k.key}
                className="border border-hairline bg-paper p-6 shadow-paper"
              >
                <h2 className="text-[19px]">
                  <E k={`overit.kind.${k.key}.title`}>{k.title}</E>
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
                  <E k={`overit.kind.${k.key}.text`}>{k.text}</E>
                </p>
                <p className="tnum mt-4 text-[13px] text-ink-2">{k.code}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="overit.skills.title">Co komora certifikuje</E>
          </h2>
          <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
            <E k="overit.skills.lead">
              Certifikace se skládá osobně ve školicím středisku a platí
              omezenou dobu — obor od oboru se liší podle toho, jak rychle se
              v něm mění technika a praxe. Po vypršení se prodlužuje.
            </E>
          </p>
          <div className="mt-8 grid grid-cols-1 gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {SKILLS.map((s) => (
              <div key={s.key} className="bg-paper px-5 py-4">
                <p className="text-[16px] font-medium text-ink">{s.label}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
                  {s.scope}
                </p>
                <p className="tnum mt-2 text-[13px] text-ink-2">
                  Platnost {validityLabel(s.validityYears)}
                </p>
              </div>
            ))}
          </div>
          <p className="measure mt-6 text-[13.5px] leading-relaxed text-ink-2">
            <E k="overit.skills.legal">
              Certifikace ČKPD potvrzuje konkrétní dovednost, kterou člen
              doložil zkouškou před komisí. Podmínky provozu bezpilotních
              systémů řeší Úřad pro civilní letectví.
            </E>
          </p>
        </Container>
      </section>

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[22px]">
            <E k="overit.partners.title">Ověřujete hromadně?</E>
          </h2>
          <p className="measure mt-3 text-[15.5px] leading-relaxed text-ink-2">
            <E k="overit.partners.text">
              Tahle stránka je pro lidi. Partneři komory, kteří potřebují
              ověřovat členství ze svého systému, mají k dispozici rozhraní
              s vlastním klíčem.
            </E>
          </p>
          <p className="mt-4 text-[14px]">
            <Link
              href="/kontakt"
              className="text-brass underline underline-offset-4 hover:text-deep-2"
            >
              <E k="overit.partners.link" editable={false}>
                Napsat komoře →
              </E>
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
