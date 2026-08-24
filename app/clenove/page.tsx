import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CtaBlock } from "@/components/sections/CtaBlock";
import { SHOW_MEMBERS } from "@/lib/flags";
import { members } from "@/lib/members";
import { E } from "@/components/editor/EditableText";

export const metadata: Metadata = {
  title: "Seznam členů",
  description:
    "Veřejný seznam členů České komory pilotů DRONů — piloti a firmy, které dávají oboru společný hlas.",
};

const tierLabel = {
  zakladni: "Základní",
  pro: "PRO",
  cestny: "Čestný člen",
} as const;

export default function MembersPage() {
  if (!SHOW_MEMBERS || members.length === 0) notFound();

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline text-[13.5px] uppercase tracking-wider text-ink-2">
                  <th className="py-3 pr-4 font-medium">
                    <E k="clenove.table.thClen">Člen</E>
                  </th>
                  <th className="py-3 pr-4 font-medium">
                    <E k="clenove.table.thClenstvi">Členství</E>
                  </th>
                  <th className="py-3 pr-4 font-medium">
                    <E k="clenove.table.thKraj">Kraj</E>
                  </th>
                  <th className="py-3 font-medium">
                    <E k="clenove.table.thZamereni">Zaměření</E>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.name} className="border-b border-hairline">
                    <td className="py-3.5 pr-4 font-medium text-ink">
                      {m.name}
                    </td>
                    <td className="py-3.5 pr-4 text-ink-2">
                      <E k={`clenove.tier.${m.tier}`}>{tierLabel[m.tier]}</E>
                    </td>
                    <td className="py-3.5 pr-4 text-ink-2">
                      {m.region ?? "—"}
                    </td>
                    <td className="py-3.5 text-[14.5px] text-ink-2">
                      {m.profile ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-5 text-[14px] text-ink-2">
            <E k="clenove.note">
              Seznam obsahuje členy, kteří udělili souhlas se zveřejněním.
              Souhlas lze kdykoli udělit i odvolat e-mailem.
            </E>
          </p>
        </Container>
      </section>
      <CtaBlock />
    </>
  );
}
