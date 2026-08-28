/**
 * Členské číslo a ověřovací kód.
 *
 * DVĚ VĚCI, ZÁMĚRNĚ ODDĚLENÉ:
 *
 *  1) Členské číslo — `CKPD-2026-0142`. Lidsky čitelné, pořadové, neměnné.
 *     Je to identita člena: ukazuje se v účtu, na kartě, vrací ho ověřovací
 *     API. Není tajné.
 *
 *  2) Ověřovací kód — `CKPD-2026-0142-K7M9XQ2T`. Členské číslo plus osm
 *     náhodných znaků. Tímhle člen jednorázově propojí účet u partnera.
 *
 * Proč nestačí samotné členské číslo: čtyři číslice se dají projet od 0001
 * do 9999 a partner by si tak stáhl celou členskou základnu. Tajný přívěsek
 * (40 bitů) to zabíjí, a přitom číslo zůstane v přesně tom tvaru, který
 * se ukazuje uživatelům.
 */

/** Crockford base32 — bez I, L, O, U (záměna s 1, 0 a vulgarismy). */
export const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const SECRET_LEN = 8;
const PREFIX = "CKPD";

/* --------------------------------------------------------- členské číslo */

/** `CKPD-2026-0142` z roku vstupu a pořadí. */
export function formatMemberNumber(year: number, seq: number): string {
  return `${PREFIX}-${year}-${String(seq).padStart(4, "0")}`;
}

/** Rozebere členské číslo zpět na rok a pořadí. `null` když nesedí tvar. */
export function parseMemberNumber(
  input: string,
): { year: number; seq: number } | null {
  const m = /^CKPD-(\d{4})-(\d{4,})$/.exec(input.trim().toUpperCase());
  if (!m) return null;
  return { year: Number(m[1]), seq: Number(m[2]) };
}

/* -------------------------------------------------------- ověřovací kód */

/**
 * Tajný přívěsek ke členskému číslu. `byte & 31` je bez modulo biasu —
 * 256 je přesný násobek 32, takže není potřeba rejection sampling.
 */
export function generateSecret(): string {
  const bytes = new Uint8Array(SECRET_LEN);
  crypto.getRandomValues(bytes);

  let secret = "";
  for (const byte of bytes) secret += ALPHABET[byte & 31];
  return secret;
}

/** `CKPD-2026-0142` + `K7M9XQ2T` → `CKPD-2026-0142-K7M9XQ2T` */
export function formatVerificationCode(
  memberNumber: string,
  secret: string,
): string {
  return `${memberNumber}-${secret}`;
}

/**
 * Vstup od partnera → klíč pro index `members.by_code`, nebo `null` když
 * kód nedává smysl. Odpouští malá písmena, mezery místo pomlček, chybějící
 * prefix a klasické záměny znaků (I a l za 1, O za 0) v tajné části.
 *
 * Normalizovaný tvar je `2026:0142:K7M9XQ2T` — rok, pořadí, tajemství.
 */
export function normalizeCode(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/[\s_]+/g, "-");
  const m = /^(?:CKPD-)?(\d{4})-(\d{4,})-([0-9A-Z]{8})$/.exec(cleaned);
  if (!m) return null;

  const secret = m[3].replace(/[IL]/g, "1").replace(/O/g, "0");
  if ([...secret].some((c) => !ALPHABET.includes(c))) return null;

  return `${m[1]}:${String(Number(m[2])).padStart(4, "0")}:${secret}`;
}

/** Normalizovaný tvar pro kód, který právě vydáváme. */
export function lookupKey(
  year: number,
  seq: number,
  secret: string,
): string {
  return `${year}:${String(seq).padStart(4, "0")}:${secret}`;
}

/* ---------------------------------------------------------------- partneři */

const KEY_LEN = 32;

/**
 * Klíč partnera: `ckpd_live_` + 32 znaků base32 (~160 bitů).
 * `ckpd_test_` je pro pískoviště partnera.
 */
export function generatePartnerKey(mode: "live" | "test" = "live"): string {
  const bytes = new Uint8Array(KEY_LEN);
  crypto.getRandomValues(bytes);

  let body = "";
  for (const byte of bytes) body += ALPHABET[byte & 31];

  return `ckpd_${mode}_${body}`;
}

/** SHA-256 hex. V DB držíme jen tohle — plaintext klíče nikde neukládáme. */
export async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(key),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Prvních 18 znaků klíče na identifikaci v adminu. Není tajné. */
export function keyPrefixOf(key: string): string {
  return key.slice(0, 18);
}
