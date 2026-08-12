import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SHOW_BODIES } from "@/lib/flags";

export type Person = {
  name: string;
  /** jednořádkový profil, např. „instruktor, ATO Brno" */
  profile: string;
  /** cesta k reálné fotografii v /public/lide — žádné avatary ani stock */
  photo: string;
};

/**
 * Orgány komory (PRD § 4.7). Reálné fotky a jména; dokud nejsou orgány
 * obsazené, sekce se nerenderuje (SHOW_BODIES) — bez ní se web nespouští.
 */
export const rada: Person[] = [
  // { name: "…", profile: "instruktor, ATO Brno", photo: "/lide/….jpg" },
];

export const revizniKomise: Person[] = [];

function PersonCard({ person }: { person: Person }) {
  return (
    <figure>
      <Image
        src={person.photo}
        alt={person.name}
        width={280}
        height={320}
        className="aspect-[7/8] w-full border border-hairline object-cover"
      />
      <figcaption className="mt-3">
        <p className="font-medium text-ink">{person.name}</p>
        <p className="text-[14px] text-ink-2">{person.profile}</p>
      </figcaption>
    </figure>
  );
}

export function Bodies({ detailed = false }: { detailed?: boolean }) {
  if (!SHOW_BODIES || rada.length === 0) return null;

  return (
    <section className="border-b border-hairline">
      <Container className="py-16 sm:py-20">
        <h2 className="text-[26px] sm:text-[34px]">Orgány komory</h2>

        <h3 className="mt-10 text-[19px] text-ink-2">Rada komory</h3>
        <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {rada.map((p) => (
            <PersonCard key={p.name} person={p} />
          ))}
        </div>

        {revizniKomise.length > 0 && (
          <>
            <h3 className="mt-12 text-[19px] text-ink-2">Revizní komise</h3>
            <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {revizniKomise.map((p) => (
                <PersonCard key={p.name} person={p} />
              ))}
            </div>
          </>
        )}

        {detailed && (
          <p className="measure mt-10 text-[15.5px] leading-relaxed text-ink-2">
            Rada komory je statutárním orgánem spolku, Revizní komise nezávislým
            kontrolním orgánem. Složení obou orgánů je zapsáno ve spolkovém
            rejstříku.
          </p>
        )}
      </Container>
    </section>
  );
}
