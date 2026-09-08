/**
 * Kam se smí po přihlášení skočit.
 *
 * `redirectToSignIn({ returnBackUrl })` v `app/muj-ucet/layout.tsx` přilepí
 * na adresu `?redirect_url=…`. Ta hodnota přijde z URL, takže je to vstup od
 * kohokoli — bez kontroly by z přihlašovací stránky šlo udělat odrazový můstek
 * na cizí doménu (`/prihlaseni?redirect_url=https://…`).
 *
 * Pouštíme proto výhradně cesty v rámci tohohle webu a ještě z nich vyřazujeme
 * samotné auth obrazovky: návrat na `/prihlaseni` by po přihlášení jen zacyklil.
 */

/** Obrazovky, na které nemá smysl se po přihlášení vracet. */
const LOOP_PATHS = ["/prihlaseni", "/registrace", "/sso-callback"];

/** Řídicí znaky rozbíjejí hlavičku `Location`, do adresy nepatří. */
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001f\\u007f]");

/**
 * Clerk posílá `redirect_url` jako ABSOLUTNÍ adresu (`http://host/muj-ucet`),
 * ne jako cestu. Bez tohohle kroku by každý návrat po přihlášení spadl na
 * výchozí stránku. Pouštíme jen adresy na tomtéž hostu, na kterém právě jsme —
 * cizí doména se do cesty nepřevede a propadne na `fallback`.
 */
function toPath(value: string, allowedHost?: string): string | null {
  if (value.startsWith("/")) return value;
  if (!allowedHost) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.host !== allowedHost) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeRedirectPath(
  raw: string | string[] | undefined,
  fallback = "/muj-ucet",
  allowedHost?: string,
): string {
  if (typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return fallback;

  const value = toPath(trimmed, allowedHost) ?? trimmed;

  // Musí to být cesta na tomhle webu. `//evil.cz` i `/\evil.cz` prohlížeč
  // přečte jako protokolově relativní adresu, tedy jako cizí doménu.
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://")) return fallback;
  if (CONTROL_CHARS.test(value)) return fallback;

  const path = value.split(/[?#]/)[0];
  if (LOOP_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return fallback;
  }

  return value;
}
