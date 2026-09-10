import { cn } from "@/lib/utils";

/**
 * Položka rozcestníku v hlavičce.
 *
 * Aktivní stránka se značí 2px brass linkou zaraženou na spodní hranu
 * hlavičky — `-bottom-px` ji položí přes hairline, takže obě splynou v jednu
 * a stránka vypadá jako vytažená záložka rejstříku. Dřív to bylo podtržení
 * 8 px pod textem, které se vznášelo bez vztahu k čemukoli okolo.
 *
 * Linka existuje i u neaktivních položek, jen průhledná — na hover se
 * rozsvítí a nic přitom neposkakuje.
 *
 * Aby linka seděla na hraně i po zmenšení hlavičky při scrollu, musí se
 * položka roztáhnout na celou její výšku: řádek v `Header.tsx` je proto
 * `items-stretch`. Bez toho by se odsazení muselo počítat natvrdo.
 *
 * Definice je schválně jedna — vzhled sdílí `Header.tsx` i `VerifyMenu.tsx`
 * a jako dvě kopie tříd se dřív nebo později rozešly.
 */
export function navLinkClass(active: boolean, className?: string) {
  return cn(
    "relative flex shrink-0 items-center whitespace-nowrap text-[15px] font-medium transition-colors",
    "after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:transition-colors",
    active
      ? "text-ink after:bg-brass"
      : "text-ink-2 after:bg-transparent hover:text-ink hover:after:bg-brass-2",
    className,
  );
}
