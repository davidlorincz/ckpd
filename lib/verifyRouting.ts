/**
 * Rozpoznání kódu na stránce /overit.
 *
 * Komora vydává tři různé kódy a návštěvník nemá důvod vědět, který z nich
 * drží — vloží ho do jednoho pole a stránka ho pošle, kam patří.
 *
 * SCHVÁLNĚ BEZ IMPORTU z `convex/lib/code.ts`: testy načítají tenhle soubor
 * přes nativní type-stripping Nodu, který runtime importy TS modulů neumí
 * (proto jsou ostatní testované moduly v repu bez závislostí). Rozpoznání
 * tvaru je navíc jiná odpovědnost než normalizace pro databázový lookup —
 * tahle funkce jen vybírá adresu, platnost kódu pak stejně rozhoduje Convex.
 */

export type VerifyTarget =
  | { kind: "completion"; href: string }
  | { kind: "credential"; href: string }
  | { kind: "member"; href: string }
  | null;

/** Crockford base32 — bez I, L, O, U. Shodné s `ALPHABET` v convex/lib/code.ts. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/** I a L za 1, O za 0 — klasické překlepy při přepisu z papíru. */
function fixLookalikes(secret: string): string {
  return secret.replace(/[IL]/g, "1").replace(/O/g, "0");
}

function inAlphabet(secret: string): boolean {
  return [...secret].every((c) => ALPHABET.includes(c));
}

/**
 * Podle tvaru pozná, oč jde, a vrátí cílovou adresu v kanonickém tvaru
 * s pomlčkami — nasdílený odkaz má vypadat jako doklad.
 *
 * Pořadí je záměrné: prefixované tvary napřed a kód člena až nakonec.
 * Tajný kód člena se tak nemůže omylem svézt na veřejnou stránku
 * certifikace ani potvrzení.
 */
export function routeForCode(input: string): VerifyTarget {
  const cleaned = input.trim().toUpperCase().replace(/[\s_-]+/g, "");
  if (!cleaned) return null;

  const completion = /^CKPDDU(\d{4})([0-9A-Z]{6,10})$/.exec(cleaned);
  if (completion) {
    const secret = completion[2];
    if (!inAlphabet(secret)) return null;
    return {
      kind: "completion",
      href: `/overit/potvrzeni/CKPD-DU-${completion[1]}-${secret}`,
    };
  }

  const credential = /^CKPDCERT(\d{4})([0-9A-Z]{8})$/.exec(cleaned);
  if (credential) {
    const secret = fixLookalikes(credential[2]);
    if (!inAlphabet(secret)) return null;
    return {
      kind: "credential",
      href: `/overit/certifikace/CKPD-CERT-${credential[1]}-${secret}`,
    };
  }

  const member = /^(?:CKPD)?(\d{4})(\d{4,})([0-9A-Z]{8})$/.exec(cleaned);
  if (member) {
    const secret = fixLookalikes(member[3]);
    if (!inAlphabet(secret)) return null;
    const seq = String(Number(member[2])).padStart(4, "0");
    return {
      kind: "member",
      href: `/overit/clen/CKPD-${member[1]}-${seq}-${secret}`,
    };
  }

  return null;
}
