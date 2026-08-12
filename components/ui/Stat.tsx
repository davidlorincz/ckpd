/**
 * Jedno číslo v číselném pásu: velké tabulární číslice, střídmý popisek.
 * Bez animovaného počítadla (PRD § 6.6).
 */
export function Stat({
  value,
  label,
  note,
}: {
  value: number;
  label: string;
  note?: string;
}) {
  return (
    <div className="text-center">
      <p className="tnum font-serif text-5xl font-semibold text-deep">
        {value.toLocaleString("cs-CZ")}
      </p>
      <p className="mt-2 text-[14px] text-ink-2">
        {label}
        {note ? <span className="text-ink-2/70"> ({note})</span> : null}
      </p>
    </div>
  );
}
