import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutRedirect } from "@/components/member/CheckoutRedirect";

export const metadata: Metadata = {
  title: "Přesměrování na platbu",
  robots: { index: false, follow: false },
};

export default function CheckoutRedirectPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutRedirect />
    </Suspense>
  );
}
