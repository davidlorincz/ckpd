import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DocumentLink } from "@/components/ui/DocumentLink";
import { org } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakty na Českou komoru pilotů DRONů — registrové údaje, datová schránka a kontakt pro média.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Kontakt"
        lead="Úřady, novináři i piloti — všichni se nám dovolají na stejné adrese."
      />

      <section className="border-b border-hairline">
        <Container className="py-14 sm:py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-[26px] sm:text-[34px]">Spojení</h2>
              <dl className="mt-6 space-y-4 text-[15.5px]">
                <div>
                  <dt className="text-[13.5px] uppercase tracking-wider text-ink-2">
                    Kontaktní osoba
                  </dt>
                  <dd className="mt-1 font-medium text-ink">
                    {org.chairman}, statutární orgán komory
                  </dd>
                </div>
                <div>
                  <dt className="text-[13.5px] uppercase tracking-wider text-ink-2">
                    E-mail
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
                    Datová schránka
                  </dt>
                  <dd className="tnum mt-1 font-medium text-ink">
                    {org.dataBox}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-[26px] sm:text-[34px]">Registrové údaje</h2>
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
                    Výpis ze spolkového rejstříku ↗
                  </a>
                </dd>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-hairline bg-paper-2">
        <Container className="py-14 sm:py-16">
          <h2 className="text-[26px] sm:text-[34px]">Pro média</h2>
          <div className="mt-6 grid gap-12 md:grid-cols-2">
            <div className="measure space-y-4 text-[15.5px] leading-relaxed text-ink-2">
              <p>
                Vyjádření za komoru poskytuje {org.chairman}. Na novinářské
                dotazy odpovídáme{" "}
                <strong className="text-ink">do 24 hodin</strong> — pište na{" "}
                <a
                  href={`mailto:${org.mediaEmail}`}
                  className="text-brass underline-offset-4 hover:underline"
                >
                  {org.mediaEmail}
                </a>{" "}
                a uveďte uzávěrku.
              </p>
              <p>
                Rádi dodáme kontext k regulaci bezpilotních systémů, datům o
                provozu i k fungování oboru v ČR. Mluvíme věcně a jen o tom,
                co máme podložené.
              </p>
            </div>
            <div>
              <h3 className="text-[19px]">Ke stažení</h3>
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
              <h3 className="mt-8 text-[19px]">Fakta o komoře</h3>
              <ul className="mt-3 space-y-1.5 text-[14.5px] leading-relaxed text-ink-2">
                <li>
                  Dobrovolný profesní spolek pilotů a provozovatelů
                  bezpilotních systémů, zapsán 8. 5. 2026.
                </li>
                <li>
                  Sdružuje jednotlivé piloty i firmy; členství není podmínkou
                  provozu.
                </li>
                <li>
                  Připravuje Zprávu o stavu DRONového provozu v ČR — první
                  souhrnná data o oboru.
                </li>
              </ul>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
