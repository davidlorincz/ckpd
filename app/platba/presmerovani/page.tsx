import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOW_MEMBER_AREA } from "@/lib/flags";
import { Suspense } from "react";
import { CheckoutRedirect } from "@/components/member/CheckoutRedirect";

export const metadata: Metadata = {
  title: "Přesměrování na platbu",
  robots: { index: false, follow: false },
};

export default function CheckoutRedirectPage() {
  if (!SHOW_MEMBER_AREA) notFound();
  return (
    <Suspense fallback={null}>
      <CheckoutRedirect />
    </Suspense>
  );
}
