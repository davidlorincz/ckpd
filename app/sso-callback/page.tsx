import type { Metadata } from "next";
import { headers } from "next/headers";

import { SsoCallbackClient } from "@/components/auth/SsoCallbackClient";
import { SHOW_MEMBER_AREA } from "@/lib/flags";
import { safeRedirectPath } from "@/lib/safeRedirect";

export const metadata: Metadata = {
  title: "Přihlašování",
  robots: { index: false, follow: false },
};

/** Mezizastávka po návratu z Googlu. Sama nic nevykresluje, jen přesměruje. */
export default async function SsoCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await searchParams;
  // Clerk vrací `redirect_url` absolutně, takže sanitizace potřebuje vědět,
  // na jakém hostu jsme — jinak by cizí doména a ta naše vypadaly stejně.
  const host = (await headers()).get("host") ?? undefined;
  // Stejně jako `/prihlaseni` není za `SHOW_MEMBER_AREA` — bez callbacku by
  // nefungoval Google. S vypnutou sekcí je ale `/muj-ucet` 404.
  const redirectTo = safeRedirectPath(
    search?.redirect_url,
    SHOW_MEMBER_AREA ? "/muj-ucet" : "/",
    host,
  );
  const mode = search?.mode === "signUp" ? "signUp" : "signIn";

  return <SsoCallbackClient redirectTo={redirectTo} mode={mode} />;
}
