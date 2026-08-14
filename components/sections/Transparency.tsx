import { Container } from "@/components/ui/Container";
import { DocumentLink } from "@/components/ui/DocumentLink";
import { SHOW_MEMBERS } from "@/lib/flags";
import { org } from "@/lib/site";

/**
 * Blok Transparentnost (PRD § 4.8): seznam dokumentů + „Jak jsme financováni".
 * Řádky pro dokumenty, které ještě neexistují (stanovy PDF, výroční zpráva),
 * se nezobrazují — doplnit do pole `docs`, až budou soubory v /public.
 */
const docs: {
  href: string;
  label: string;
  meta?: string;
  external?: boolean;
}[] = [
  // { href: "/dokumenty/stanovy-ckpd.pdf", label: "Stanovy", meta: "PDF" },
  { href: "/eticky-kodex", label: "Etický kodex" },
  // { href: "/dokumenty/vyrocni-zprava-2026.pdf", label: "Výroční zpráva 2026", meta: "PDF" },
  {
    href: org.registryUrl,
    label: "Výpis ze spolkového rejstříku",
    external: true,
  },
  ...(SHOW_MEMBERS
    ? [{ href: "/clenove", label: "Veřejný seznam členů" }]
    : []),
];

export function Transparency() {
  return (
    <section className="border-b border-hairline">
      <Container className="py-16 sm:py-20">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-[26px] sm:text-[34px]">Transparentnost</h2>
            <div className="mt-6">
              {docs.map((d) => (
                <DocumentLink key={d.label} {...d} />
              ))}
            </div>
          </div>
          <div className="md:pt-2">
            <h3 className="text-[19px]">Jak jsme financováni</h3>
            <p className="measure mt-4 text-[15.5px] leading-relaxed text-ink-2">
              Činnost komory je financována členskými příspěvky, dary a
              sponzoringem. Zakládajícím členem a sponzorem komory je DRONPRO
              s.r.o.; orgány komory rozhodují nezávisle a výhody, které
              členům poskytují partneři, jsou jejich dobrovolným plněním.
            </p>
            <p className="measure mt-3 text-[15.5px] leading-relaxed text-ink-2">
              Hospodaření shrnujeme ve výroční zprávě a účetní závěrku
              zveřejňujeme ve sbírce listin spolkového rejstříku.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
