import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CtaBlock } from "@/components/sections/CtaBlock";
import { MembersTable } from "@/components/sections/MembersTable";
import { SHOW_MEMBERS } from "@/lib/flags";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Seznam členů",
  description:
    "Veřejný seznam členů České komory pilotů DRONů — piloti a firmy, které dávají oboru společný hlas.",
};

export default function MembersPage() {
  if (!SHOW_MEMBERS) notFound();

  return (
    <>
      <PageHeader
        title={<E k="clenove.header.title">Seznam členů</E>}
        lead={
          <E k="clenove.header.lead">
            Komora je tak důvěryhodná, jak viditelní jsou její členové. Tady
            jsou piloti a firmy, které dávají oboru společný hlas — uvedení se
            souhlasem každého člena.
          </E>
        }
      />
      <section className="border-b border-hairline">
        <Container className="py-12 sm:py-16">
          <MembersTable />
          <p className="mt-5 text-[14px] text-ink-2">
            <E k="clenove.note">
              Seznam obsahuje členy, kteří udělili souhlas se zveřejněním.
              Souhlas lze kdykoli udělit i odvolat ve vlastním účtu.
            </E>
          </p>
        </Container>
      </section>
      <CtaBlock />
    </>
  );
}
