/**
 * Členská čísla a ověřovací kódy — web strana. Logika žije v
 * `convex/lib/code.ts`, aby frontend i backend normalizovaly vstup stejně.
 */
export {
  ALPHABET,
  formatMemberNumber,
  formatVerificationCode,
  normalizeCode,
  parseMemberNumber,
} from "../convex/lib/code";
