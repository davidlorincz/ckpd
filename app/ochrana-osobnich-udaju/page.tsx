import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { org } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
  description:
    "Zásady zpracování osobních údajů České komory pilotů DRONů z.s.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title={<E k="gdpr.header.title">Ochrana osobních údajů</E>}
        lead={
          <E k="gdpr.header.lead">
            Jak nakládáme s osobními údaji členů a zájemců o členství. Web sám
            o sobě žádné soubory cookie ke sledování nepoužívá.
          </E>
        }
      />
      <section>
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl space-y-10 text-[16px] leading-relaxed text-ink-2">
            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.spravce.title">Správce údajů</E>
              </h2>
              <p className="tnum mt-3">
                {org.name}, IČO {org.ico}, sídlem {org.address}, zapsaná pod
                sp. zn. {org.fileNumber} u&nbsp;{org.court}. Kontakt:{" "}
                <a
                  href={`mailto:${org.email}`}
                  className="text-brass underline-offset-4 hover:underline"
                >
                  {org.email}
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.udaje.title">Jaké údaje zpracováváme a proč</E>
              </h2>
              <p className="mt-3">
                <E k="gdpr.udaje.p1">
                  Z přihlášky ke členství zpracováváme: typ členství, jméno a
                  příjmení (u firem název a IČO), e-mail, telefon, kraj,
                  zaměření provozu a nepovinně registrační číslo operátora
                  přidělené ÚCL. Údaje slouží k vyřízení přihlášky, vedení
                  evidence členů podle stanov, výběru členských příspěvků a
                  členské komunikaci.
                </E>
              </p>
              <p className="mt-3">
                <E k="gdpr.udaje.p2a">Právním titulem zpracování je</E>{" "}
                <strong className="text-ink">
                  <E k="gdpr.udaje.p2strong1">plnění smlouvy o členství</E>
                </strong>{" "}
                <E k="gdpr.udaje.p2b">
                  (vyřízení přihlášky a vedení členství) a
                </E>{" "}
                <strong className="text-ink">
                  <E k="gdpr.udaje.p2strong2">oprávněný zájem</E>
                </strong>{" "}
                <E k="gdpr.udaje.p2c">
                  spolku na vnitřní správě a komunikaci se členy. Souhrnná
                  anonymizovaná data o provozu (např. nalétané hodiny)
                  zpracováváme pro statistické účely — z výstupů nelze určit
                  konkrétní osobu.
                </E>
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.seznam.title">Veřejný seznam členů</E>
              </h2>
              <p className="mt-3">
                <E k="gdpr.seznam.p1">
                  Komora vede veřejný seznam členů na svém webu. Jméno člena v
                  něm uvedeme pouze na základě jeho výslovného souhlasu
                  uděleného v přihlášce nebo později; souhlas je dobrovolný,
                  výchozí stav je neudělen a lze ho kdykoli odvolat e-mailem —
                  jméno poté ze seznamu bez zbytečného odkladu odstraníme.
                </E>
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.uchovani.title">Doba uchování</E>
              </h2>
              <p className="mt-3">
                <E k="gdpr.uchovani.p1">
                  Údaje uchováváme po dobu členství a poté po dobu nezbytnou
                  pro vypořádání práv a povinností (zpravidla 3 roky od zániku
                  členství); účetní doklady po dobu stanovenou zákonem.
                  Přihlášky, které Rada nepřijme, mažeme do 6 měsíců od
                  rozhodnutí.
                </E>
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.predavani.title">Komu údaje předáváme</E>
              </h2>
              <p className="mt-3">
                <E k="gdpr.predavani.p1">
                  Údaje nepředáváme třetím stranám k marketingu. Zpracovatele
                  používáme jen pro technický provoz evidence a e-mailové
                  komunikace, vždy na základě smlouvy o zpracování. Údaje
                  nepředáváme mimo EU/EHP, ledaže to vyžaduje použitý nástroj
                  se standardními smluvními doložkami.
                </E>
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.prava.title">Vaše práva</E>
              </h2>
              <p className="mt-3">
                <E k="gdpr.prava.p1">
                  Máte právo na přístup ke svým údajům, jejich opravu či
                  výmaz, omezení zpracování, přenositelnost a právo vznést
                  námitku proti zpracování založenému na oprávněném zájmu.
                  Uplatníte je e-mailem na
                </E>{" "}
                <a
                  href={`mailto:${org.email}`}
                  className="text-brass underline-offset-4 hover:underline"
                >
                  {org.email}
                </a>
                .{" "}
                <E k="gdpr.prava.p2">
                  Dozorovým úřadem je Úřad pro ochranu osobních údajů
                  (uoou.gov.cz).
                </E>
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">
                <E k="gdpr.cookies.title">Cookies a analytika</E>
              </h2>
              <p className="mt-3">
                <E k="gdpr.cookies.p1">
                  Tento web nepoužívá sledovací cookies, reklamní ani
                  analytické nástroje třetích stran. Proto na něm nenajdete
                  cookie lištu — není co odsouhlasovat.
                </E>
              </p>
            </div>

            <p className="tnum border-t border-hairline pt-6 text-[14px]">
              <E k="gdpr.footer">
                Verze zásad: srpen 2026. Návrh — finální znění schvaluje Rada
                komory.
              </E>
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
