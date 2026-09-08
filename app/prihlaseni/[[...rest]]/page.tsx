import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LegacyAuthScreen } from "@/components/auth/LegacyAuthScreen";
import { SignInForm, type SignInNotice } from "@/components/auth/SignInForm";
import { LEGACY_AUTH_UI, SHOW_MEMBER_AREA } from "@/lib/flags";
import { safeRedirectPath } from "@/lib/safeRedirect";

/*
 * Catch-all zůstává kvůli rollbacku: hostované `<SignIn/>` / `<SignUp/>`
 * v `LegacyAuthScreen` jedou s `routing="path"` a bez podcest (`/registrace/
 * verify-email-address`, `sso-callback`) odmítnou naběhnout. Vlastní UI si
 * `rest` nevšímá — krok drží ve stavu, ne v adrese.
 */
export const metadata: Metadata = {
  title: "Přihlášení",
  robots: { index: false, follow: false },
};

/** Hlášky, které smí přijít z URL — cizí text by se sem jinak dal podstrčit. */
const NOTICES = new Set<SignInNotice>(["no_account", "account_exists"]);

function noticeFrom(value: string | string[] | undefined) {
  return typeof value === "string" && NOTICES.has(value as SignInNotice)
    ? (value as SignInNotice)
    : undefined;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!SHOW_MEMBER_AREA) notFound();
  if (LEGACY_AUTH_UI) return <LegacyAuthScreen mode="signIn" />;

  const search = await searchParams;
  // Clerk vrací `redirect_url` absolutně, takže sanitizace potřebuje vědět,
  // na jakém hostu jsme — jinak by cizí doména a ta naše vypadaly stejně.
  const host = (await headers()).get("host") ?? undefined;
  const redirectTo = safeRedirectPath(search?.redirect_url, "/muj-ucet", host);
  const callbackUrl = `/sso-callback?mode=signIn&redirect_url=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthSplitLayout
      hero={{
        title: "Tvoje doklady na jednom místě.",
        points: [
          "V účtu máš členské číslo, ověřovací kód a doklady.",
          "Certifikace i datum jejich platnosti na jednom místě.",
          "Obnovování členství zrušíš kdykoli.",
        ],
      }}
    >
      <SignInForm
        redirectTo={redirectTo}
        callbackUrl={callbackUrl}
        oauthError={search?.error === "oauth"}
        notice={noticeFrom(search?.notice)}
      />
    </AuthSplitLayout>
  );
}
