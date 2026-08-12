import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { org } from "@/lib/site";

export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
  description:
    "Zásady zpracování osobních údajů České komory pilotů DRONů z.s.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Ochrana osobních údajů"
        lead="Jak nakládáme s osobními údaji členů a zájemců o členství. Web sám o sobě žádné soubory cookie ke sledování nepoužívá."
      />
      <section>
        <Container className="py-12 sm:py-16">
          <div className="max-w-3xl space-y-10 text-[16px] leading-relaxed text-ink-2">
            <div>
              <h2 className="text-[22px] text-ink">Správce údajů</h2>
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
                Jaké údaje zpracováváme a proč
              </h2>
              <p className="mt-3">
                Z přihlášky ke členství zpracováváme: typ členství, jméno a
                příjmení (u firem název a IČO), e-mail, telefon, kraj,
                zaměření provozu a nepovinně registrační číslo operátora
                přidělené ÚCL. Údaje slouží k vyřízení přihlášky, vedení
                evidence členů podle stanov, výběru členských příspěvků a
                členské komunikaci.
              </p>
              <p className="mt-3">
                Právním titulem zpracování je{" "}
                <strong className="text-ink">
                  plnění smlouvy o členství
                </strong>{" "}
                (vyřízení přihlášky a vedení členství) a{" "}
                <strong className="text-ink">oprávněný zájem</strong> spolku
                na vnitřní správě a komunikaci se členy. Souhrnná anonymizovaná
                data o provozu (např. nalétané hodiny) zpracováváme pro
                statistické účely — z výstupů nelze určit konkrétní osobu.
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">Zveřejnění v seznamu členů</h2>
              <p className="mt-3">
                Seznam členů se nezveřejňuje. Jméno člena zveřejníme pouze na
                základě jeho výslovného souhlasu uděleného v přihlášce nebo
                později; souhlas je dobrovolný, výchozí stav je neudělen a lze
                ho kdykoli odvolat.
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">Doba uchování</h2>
              <p className="mt-3">
                Údaje uchováváme po dobu členství a poté po dobu nezbytnou pro
                vypořádání práv a povinností (zpravidla 3 roky od zániku
                členství); účetní doklady po dobu stanovenou zákonem.
                Přihlášky, které Rada nepřijme, mažeme do 6 měsíců od
                rozhodnutí.
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">Komu údaje předáváme</h2>
              <p className="mt-3">
                Údaje nepředáváme třetím stranám k marketingu. Zpracovatele
                používáme jen pro technický provoz evidence a e-mailové
                komunikace, vždy na základě smlouvy o zpracování. Údaje
                nepředáváme mimo EU/EHP, ledaže to vyžaduje použitý nástroj se
                standardními smluvními doložkami.
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">Vaše práva</h2>
              <p className="mt-3">
                Máte právo na přístup ke svým údajům, jejich opravu či výmaz,
                omezení zpracování, přenositelnost a právo vznést námitku
                proti zpracování založenému na oprávněném zájmu. Uplatníte je
                e-mailem na{" "}
                <a
                  href={`mailto:${org.email}`}
                  className="text-brass underline-offset-4 hover:underline"
                >
                  {org.email}
                </a>
                . Dozorovým úřadem je Úřad pro ochranu osobních údajů
                (uoou.gov.cz).
              </p>
            </div>

            <div>
              <h2 className="text-[22px] text-ink">Cookies a analytika</h2>
              <p className="mt-3">
                Tento web nepoužívá sledovací cookies, reklamní ani analytické
                nástroje třetích stran. Proto na něm nenajdete cookie lištu —
                není co odsouhlasovat.
              </p>
            </div>

            <p className="tnum border-t border-hairline pt-6 text-[14px]">
              Verze zásad: srpen 2026. Návrh — finální znění schvaluje Rada
              komory.
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
