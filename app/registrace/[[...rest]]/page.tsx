import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LegacyAuthScreen } from "@/components/auth/LegacyAuthScreen";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { LEGACY_AUTH_UI, SHOW_MEMBER_AREA } from "@/lib/flags";
import { safeRedirectPath } from "@/lib/safeRedirect";

/*
 * Catch-all zůstává kvůli rollbacku: hostované `<SignIn/>` / `<SignUp/>`
 * v `LegacyAuthScreen` jedou s `routing="path"` a bez podcest (`/registrace/
 * verify-email-address`, `sso-callback`) odmítnou naběhnout. Vlastní UI si
 * `rest` nevšímá — krok drží ve stavu, ne v adrese.
 */
export const metadata: Metadata = {
  title: "Registrace",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!SHOW_MEMBER_AREA) notFound();
  if (LEGACY_AUTH_UI) return <LegacyAuthScreen mode="signUp" />;

  const search = await searchParams;
  // Clerk vrací `redirect_url` absolutně, takže sanitizace potřebuje vědět,
  // na jakém hostu jsme — jinak by cizí doména a ta naše vypadaly stejně.
  const host = (await headers()).get("host") ?? undefined;
  const redirectTo = safeRedirectPath(search?.redirect_url, "/muj-ucet", host);
  const callbackUrl = `/sso-callback?mode=signUp&redirect_url=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthSplitLayout
      hero={{
        title: "Zastupujeme piloty DRONů.",
        points: [
          "Účet je zdarma a k ničemu tě nezavazuje.",
          "Variantu členství si vybereš až po registraci.",
          "Členské číslo a doklady najdeš hned ve svém účtu.",
        ],
      }}
    >
      <SignUpForm
        redirectTo={redirectTo}
        callbackUrl={callbackUrl}
        oauthError={search?.error === "oauth"}
        resume={search?.flow === "continue"}
      />
    </AuthSplitLayout>
  );
}
