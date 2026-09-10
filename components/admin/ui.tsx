import { cn } from "@/lib/utils";

/**
 * Opakující se prvky administrace na jednom místě.
 *
 * Tyhle třídy byly doslova zkopírované ve třech obrazovkách (`PartnerKeys`,
 * `SandboxAdmin`, `CredentialAdmin`) — a ve dvou verzích, které se už začaly
 * rozcházet (input jednou `focus:border-deep`, jindy `focus:border-brass`).
 * Nové obrazovky berou odsud; staré se převedou, až se k nim někdo vrátí.
 */

export const adminInputClass =
  "w-full rounded-[2px] border border-hairline bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-ink-2 focus:border-brass focus:outline-none";

export const adminButtonClass =
  "rounded-[2px] border border-deep bg-deep px-4 py-2 text-[14.5px] font-medium text-paper transition-colors hover:bg-deep-2 disabled:opacity-40";

export const adminGhostButtonClass =
  "rounded-[2px] border border-deep px-3 py-1.5 text-[13.5px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper disabled:opacity-50";

export const adminLinkButtonClass =
  "text-[13.5px] text-ink-2 underline-offset-4 hover:underline disabled:opacity-50";

/** Datum v českém tvaru. `—` když chybí — v tabulce nesmí zůstat prázdno. */
export function czDate(ts?: number | null) {
  return ts ? new Date(ts).toLocaleDateString("cs-CZ") : "—";
}

/** Hlavička sloupce. Verzálky, aby se odlišila od hodnot pod sebou. */
export function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "py-2.5 pr-4 text-[12.5px] font-medium uppercase tracking-wider text-ink-2",
        className,
      )}
    >
      {children}
    </th>
  );
}

/**
 * Tabulka administrace. `minWidth` je povinné — vodorovné rolování je lepší
 * než zmáčknuté sloupce, ale musí se říct, kdy má nastat.
 */
export function AdminTable({
  minWidth,
  head,
  children,
}: {
  minWidth: number;
  head: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-left"
        style={{ minWidth: `${minWidth}px` }}
      >
        <thead>
          <tr className="border-b border-hairline">{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

type BadgeTone = "neutral" | "brass" | "action" | "danger";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border border-hairline text-ink-2",
  brass: "bg-brass text-white",
  // Zelená s bílou má kontrast 2,8 : 1 a na malý text nestačí — proto
  // outline s tmavým písmem místo výplně, jak to má zbytek administrace.
  action: "border border-action text-action",
  danger: "border border-destructive text-destructive",
};

/** Odznak stavu. Pro hotové stavy členství se místo `tone` posílá `className`. */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-[2px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        className ?? badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}
