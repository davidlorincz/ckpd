import { Container } from "@/components/ui/Container";
import { utilityBarText } from "@/lib/site";

/**
 * Jednořádkový tmavý pruh s registrovými údaji nad hlavičkou (PRD § 4.1).
 * „Nejlevnější legitimita na webu" — údaje nahoře, ne schované v patičce.
 */
export function UtilityBar() {
  return (
    <div className="bg-deep text-paper/85">
      <Container>
        <p className="tnum py-1.5 text-center text-[12.5px] leading-snug tracking-wide sm:text-[13px]">
          {utilityBarText}
        </p>
      </Container>
    </div>
  );
}
