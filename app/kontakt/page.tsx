import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentLink } from "@/components/ui/DocumentLink";
import { org } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakty na Českou komoru pilotů DRONů — registrové údaje, datová schránka a kontakt pro média.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title={<E k="kontakt.header.title">Kontakt</E>}
        lead={
          <E k="kontakt.header.lead">
            Úřady, novináři i piloti — všichni se nám dovolají na stejné
            adrese.
          </E>
        }
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-[26px] sm:text-[34px]">
                <E k="kontakt.spojeni.title">Spojení</E>
              </h2>
              <dl className="mt-6 space-y-4 text-[15.5px]">
                <div>
                  <dt className="text-[13.5px] uppercase tracking-wider text-ink-2">
                    <E k="kontakt.spojeni.osobaLabel">Kontaktní osoba</E>
                  </dt>
                  <dd className="mt-1 font-medium text-ink">
                    {org.chairman},{" "}
                    <E k="kontakt.spojeni.osobaRole">
                      statutární orgán komory
                    </E>
                  </dd>
                </div>
                <div>
                  <dt className="text-[13.5px] uppercase tracking-wider text-ink-2">
                    <E k="kontakt.spojeni.emailLabel">E-mail</E>
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${org.email}`}
                      className="font-medium text-brass underline-offset-4 hover:underline"
                    >
                      {org.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[13.5px] uppercase tracking-wider text-ink-2">
                    <E k="kontakt.spojeni.datovkaLabel">Datová schránka</E>
                  </dt>
                  <dd className="tnum mt-1 font-medium text-ink">
                    {org.dataBox}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-[26px] sm:text-[34px]">
                <E k="kontakt.registr.title">Registrové údaje</E>
              </h2>
              <dl className="tnum mt-6 space-y-1.5 text-[15.5px] leading-relaxed text-ink-2">
                <dd className="font-medium text-ink">{org.name}</dd>
                <dd>IČO {org.ico}</dd>
                <dd>Sídlo: {org.address}</dd>
                <dd>
                  Spisová značka {org.fileNumber} vedená u&nbsp;{org.court}
                </dd>
                <dd className="pt-2">
                  <a
                    href={org.registryUrl}
                    rel="noopener noreferrer"
                    className="text-brass underline-offset-4 hover:underline"
                  >
                    <E k="kontakt.registr.vypis" editable={false}>
                      Výpis ze spolkového rejstříku ↗
                    </E>
                  </a>
                </dd>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">
            <E k="kontakt.media.title">Pro média</E>
          </h2>
          <div className="mt-6 grid gap-12 md:grid-cols-2">
            <div className="measure space-y-4 text-[15.5px] leading-relaxed text-ink-2">
              <p>
                <E k="kontakt.media.p1a">Vyjádření za komoru poskytuje</E>{" "}
                {org.chairman}.{" "}
                <E k="kontakt.media.p1b">
                  Na novinářské dotazy odpovídáme
                </E>{" "}
                <strong className="text-ink">
                  <E k="kontakt.media.p1strong">do 24 hodin</E>
                </strong>{" "}
                <E k="kontakt.media.p1c">— pište na</E>{" "}
                <a
                  href={`mailto:${org.mediaEmail}`}
                  className="text-brass underline-offset-4 hover:underline"
                >
                  {org.mediaEmail}
                </a>{" "}
                <E k="kontakt.media.p1d">a uveďte uzávěrku.</E>
              </p>
              <p>
                <E k="kontakt.media.p2">
                  Rádi dodáme kontext k regulaci bezpilotních systémů, datům o
                  provozu i k fungování oboru v ČR. Mluvíme věcně a jen o tom,
                  co máme podložené.
                </E>
              </p>
            </div>
            <div>
              <h3 className="text-[19px]">
                <E k="kontakt.media.download">Ke stažení</E>
              </h3>
              <div className="mt-4">
                <DocumentLink
                  href="/brand/znak.svg"
                  label="Znak komory"
                  meta="SVG"
                />
                <DocumentLink
                  href="/brand/znak-inverse.svg"
                  label="Znak komory — inverzní"
                  meta="SVG"
                />
              </div>
              <h3 className="mt-8 text-[19px]">
                <E k="kontakt.media.fakta">Fakta o komoře</E>
              </h3>
              <ul className="mt-3 space-y-1.5 text-[14.5px] leading-relaxed text-ink-2">
                <li>
                  <E k="kontakt.media.faktaItems.0">
                    Dobrovolný profesní spolek pilotů a provozovatelů
                    bezpilotních systémů, zapsán 8. 5. 2026.
                  </E>
                </li>
                <li>
                  <E k="kontakt.media.faktaItems.1">
                    Sdružuje jednotlivé piloty i firmy; členství je dobrovolné
                    a otevřené všem.
                  </E>
                </li>
                <li>
                  <E k="kontakt.media.faktaItems.2">
                    Připravuje Zprávu o stavu DRONového provozu v ČR — první
                    souhrnná data o oboru.
                  </E>
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
