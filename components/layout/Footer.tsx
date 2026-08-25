import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SHOW_MEMBERS } from "@/lib/flags";
import { disclosureLine, legalLine, nav, org } from "@/lib/site";
import { E } from "@/components/editor/EditableText";

const legalLinks = [
  { href: "/eticky-kodex", label: "Etický kodex" },
  { href: "/ochrana-osobnich-udaju", label: "Ochrana osobních údajů" },
] as const;

export function Footer() {
  return (
    <footer className="paper-grid-dark bg-deep text-paper">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center">
              <Image
                src="/brand/lockup-inverse.svg"
                alt="ČKPD — Česká komora pilotů DRONů z.s."
                width={177}
                height={40}
                className="h-10 w-[177px]"
              />
            </div>
            <address className="tnum mt-5 text-[14px] not-italic leading-relaxed text-paper/75">
              IČO {org.ico}
              <br />
              {org.address}
              <br />
              Spisová značka {org.fileNumber}, {org.court}
              <br />
              Datová schránka: {org.dataBox}
              <br />
              <a
                href={`mailto:${org.email}`}
                className="text-brass-2 underline-offset-4 hover:underline"
              >
                {org.email}
              </a>
            </address>
          </div>

          <nav aria-label="Patičková navigace" className="text-[14px]">
            <p className="mb-3 font-medium uppercase tracking-wider text-paper/55">
              <E k="layout.footer.navTitle">Komora</E>
            </p>
            <ul className="space-y-2">
              {nav.map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                  >
                    <E k={`layout.footer.nav.${i}`} editable={false}>
                      {item.label}
                    </E>
                  </Link>
                </li>
              ))}
              {SHOW_MEMBERS && (
                <li>
                  <Link
                    href="/clenove"
                    className="text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                  >
                    <E k="layout.footer.membersLink" editable={false}>
                      Seznam členů
                    </E>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <nav aria-label="Právní odkazy" className="text-[14px]">
            <p className="mb-3 font-medium uppercase tracking-wider text-paper/55">
              <E k="layout.footer.docsTitle">Dokumenty</E>
            </p>
            <ul className="space-y-2">
              {legalLinks.map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                  >
                    <E k={`layout.footer.legalLinks.${i}`} editable={false}>
                      {item.label}
                    </E>
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={org.registryUrl}
                  rel="noopener noreferrer"
                  className="text-paper/85 underline-offset-4 hover:text-paper hover:underline"
                >
                  <E k="layout.footer.registryLink" editable={false}>
                    Výpis ze spolkového rejstříku
                  </E>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-paper/15 pt-6 text-[13px] leading-relaxed text-paper/60">
          <p>
            <E k="layout.footer.disclosureLine">{disclosureLine}</E>
          </p>
          <p className="mt-2">
            <E k="layout.footer.legalLine">{legalLine}</E>
          </p>
        </div>
      </Container>
    </footer>
  );
}
