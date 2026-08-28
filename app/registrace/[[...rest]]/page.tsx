import type { Metadata } from "next";
import { AuthScreen } from "@/components/member/AuthScreen";

export const metadata: Metadata = {
  title: "Registrace",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return <AuthScreen mode="signUp" />;
}
