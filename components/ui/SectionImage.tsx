import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Fotografie vtažená do palety komory.
 *
 * Odbarvení + vrstva `bg-deep` v režimu `mix-blend-color` udělá duotone
 * přímo v prohlížeči, takže se soubor nemusí předzpracovávat a nemůže se
 * s brandem rozejít. Papírový rastr přes to drží fotku jako součást téže
 * látky, ne jako cizí blok — a `isolate` zabrání tomu, aby blend prosákl
 * na sousední prvky.
 */
export function SectionImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate aspect-[16/9] w-full overflow-hidden border border-hairline",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover grayscale-[0.85] contrast-[1.05]"
      />
      {/* jemné modré tónování: `multiply` s nízkým krytím sníží teplotu do
          palety, ale nechá kresbu čitelnou. Plné `mix-blend-color` s bg-deep
          udělalo z fotky rovnou modrou plochu. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-brass/20 mix-blend-multiply"
      />
    </div>
  );
}
