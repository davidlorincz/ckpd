/**
 * Pomocníci pro zobrazení DIGI univerzity.
 *
 * Stavy lekce jsou tu centralizované ze stejného důvodu jako
 * `statusPresentation` v lib/membership.ts — aby se třídy nerozsypaly
 * po komponentách a stav šel změnit na jednom místě.
 */
import type { MembershipTier } from "@/lib/membership";

export type LessonState = "nezahajena" | "rozkoukana" | "dokoncena";

export const lessonPresentation: Record<
  LessonState,
  { label: string; dot: string; row: string }
> = {
  nezahajena: {
    label: "Nezahájená",
    dot: "border border-hairline bg-paper",
    row: "border-l-transparent",
  },
  rozkoukana: {
    label: "Rozkoukaná",
    dot: "border-2 border-brass bg-paper",
    row: "border-l-brass bg-paper-2/60",
  },
  dokoncena: {
    label: "Dokončená",
    dot: "border-2 border-action bg-action",
    row: "border-l-action",
  },
};

/** „5:41" — délka lekce. Sekundy nezaokrouhlujeme nahoru, ať sedí se stopáží. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * „1 h 2 min" / „47 min" — celková délka kurzu.
 * Podle NN/g je skrytá délka jeden z nejrychlejších způsobů, jak ztratit
 * důvěru; proto se ukazuje všude, kde je seznam lekcí.
 */
export function formatTotal(seconds: number): string {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** „Zbývá ~24 min" — konkrétnější a motivačnější než holá procenta. */
export function formatRemaining(seconds: number): string {
  if (seconds <= 30) return "Zbývá pár vteřin";
  return `Zbývá ~${formatTotal(seconds)}`;
}

export function tierLabel(tier: MembershipTier | undefined): string {
  if (tier === "pro") return "PRO";
  if (tier === "cestne") return "Čestné";
  return "Základní";
}

/** `00:04:39.230` — časový kód pro WebVTT. */
function vttTime(seconds: number): string {
  const ms = Math.round(seconds * 1000);
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${pad(Math.floor(ms / 3600000))}:` +
    `${pad(Math.floor((ms % 3600000) / 60000))}:` +
    `${pad(Math.floor((ms % 60000) / 1000))}.` +
    `${pad(ms % 1000, 3)}`
  );
}

/**
 * Titulky z transkriptu.
 *
 * Nestahují se ze serveru zvlášť — věty i s časováním už klient má pro
 * klikatelný přepis, takže by to byl druhý dotaz na totéž. Vzniká z nich
 * blob a ten se přehrávači předá jako textová stopa.
 *
 * Titulky nejsou volitelné: WCAG 1.2.2 je vyžaduje na úrovni A a podle
 * výzkumu je jako studijní pomůcku používají tři čtvrtiny diváků, ne jen
 * lidé se sluchovým postižením.
 */
export function toWebVtt(
  segments: { start: number; end: number; text: string }[],
): string {
  const cues = segments.map(
    (s, i) => `${i + 1}\n${vttTime(s.start)} --> ${vttTime(s.end)}\n${s.text}`,
  );
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

export type TranscriptSegment = { start: number; end: number; text: string };

/**
 * Titulkové věty → čitelné odstavce.
 *
 * Titulky jsou nasekané podle toho, co se vejde na obrazovku a jak dlouho
 * to tam má viset — medián pět slov, často uprostřed věty. Jako titulky
 * je to správně, jako přepis je to nečitelné.
 *
 * Slučujeme proto do odstavců, které končí na hranici věty. Zdroj zůstává
 * jeden — stopa pro titulky se dál generuje ze syrových vět, tohle je čistě
 * zobrazovací transformace. Každý odstavec si drží čas své první věty,
 * takže klik pořád skočí přesně tam, kde odstavec začíná.
 */
export function toParagraphs(
  segments: readonly TranscriptSegment[],
  { minChars = 220, maxChars = 480 } = {},
): TranscriptSegment[] {
  const out: TranscriptSegment[] = [];
  let current: TranscriptSegment | null = null;

  for (const segment of segments) {
    const text = segment.text.trim();
    if (!text) continue;

    current = current
      ? { start: current.start, end: segment.end, text: `${current.text} ${text}` }
      : { start: segment.start, end: segment.end, text };

    // uzavřít smíme jen na konci věty; uvozovka nebo závorka za tečkou nevadí
    const endsSentence = /[.!?…]["“”»)\]]?$/.test(current.text);
    if ((endsSentence && current.text.length >= minChars) || current.text.length >= maxChars) {
      out.push(current);
      current = null;
    }
  }
  if (current) out.push(current);
  return out;
}
