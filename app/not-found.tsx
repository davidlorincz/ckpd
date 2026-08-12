import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <section className="paper-grid border-b border-hairline">
      <Container className="py-24 text-center sm:py-32">
        <p className="tnum font-serif text-[56px] font-semibold text-deep">404</p>
        <h1 className="mt-2 text-[26px]">Stránka nenalezena</h1>
        <p className="mt-4 text-[16px] text-ink-2">
          Adresa neexistuje, nebo byla přesunuta.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-[2px] border border-deep px-6 py-3 text-[15px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper"
        >
          Zpět na hlavní stránku
        </Link>
      </Container>
    </section>
  );
}
