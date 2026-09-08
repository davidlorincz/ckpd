import type { MembershipTier } from "@/lib/membership";

/**
 * Co o návštěvníkovi ví server při prvním renderu hlavičky.
 *
 * Všechno, co mění rozložení hlavičky (přihlášen? zaplaceno? admin?), se
 * rozhoduje tady — na serveru. Clerk klientsky odpoví až po stažení clerk-js
 * a do té doby `useUser().isLoaded` je vždycky false, takže cokoli závislého
 * na hooku by při každém načtení probliklo.
 */
export type HeaderSession = {
  signedIn: boolean;
  admin: boolean;
  /** Smí do DIGI univerzity — zaplacené členství nebo admin. */
  digiAccess: boolean;
  tier?: MembershipTier;
};

export const ANONYMOUS_SESSION: HeaderSession = {
  signedIn: false,
  admin: false,
  digiAccess: false,
};
