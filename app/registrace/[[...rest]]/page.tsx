import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOW_MEMBER_AREA } from "@/lib/flags";
import { AuthScreen } from "@/components/member/AuthScreen";

export const metadata: Metadata = {
  title: "Registrace",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  if (!SHOW_MEMBER_AREA) notFound();
  return <AuthScreen mode="signUp" />;
}
