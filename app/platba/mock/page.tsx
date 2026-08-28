import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MockGateway } from "@/components/member/MockGateway";
import { BILLING_PROVIDER } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Platba",
  robots: { index: false, follow: false },
};

/** Ukázková brána. V ostrém provozu tahle cesta neexistuje. */
export default function MockGatewayPage() {
  if (BILLING_PROVIDER !== "mock") notFound();
  return (
    <Suspense fallback={null}>
      <MockGateway />
    </Suspense>
  );
}
