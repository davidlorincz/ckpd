import Link from "next/link";
import { cn } from "@/lib/utils";

type CtaProps = {
  href: string;
  variant?: "primary" | "secondary" | "onDark" | "conversion";
  className?: string;
  children: React.ReactNode;
};

/**
 * Institucionální tlačítko: radius 2 px, žádný stín, žádný gradient.
 * primary = plná deep, secondary = obrys, onDark = papírové na tmavé ploše,
 * conversion = zelené konverzní CTA (DRONPRO zelená), funguje na světlé i tmavé.
 */
export function Cta({ href, variant = "primary", className, children }: CtaProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-block rounded-[2px] px-6 py-3 text-[15px] font-medium transition-colors",
        variant === "primary" &&
          "bg-deep text-paper hover:bg-deep-2",
        variant === "secondary" &&
          "border border-deep text-deep hover:bg-deep hover:text-paper",
        variant === "onDark" &&
          "bg-paper text-deep hover:bg-paper-2",
        variant === "conversion" &&
          "bg-action text-white hover:bg-action-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}
