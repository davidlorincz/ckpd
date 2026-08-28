import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOW_MEMBER_AREA } from "@/lib/flags";
import { AuthScreen } from "@/components/member/AuthScreen";

export const metadata: Metadata = {
  title: "Přihlášení",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  if (!SHOW_MEMBER_AREA) notFound();
  return <AuthScreen mode="signIn" />;
}
