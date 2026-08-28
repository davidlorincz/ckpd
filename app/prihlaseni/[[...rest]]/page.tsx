import type { Metadata } from "next";
import { AuthScreen } from "@/components/member/AuthScreen";

export const metadata: Metadata = {
  title: "Přihlášení",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <AuthScreen mode="signIn" />;
}
