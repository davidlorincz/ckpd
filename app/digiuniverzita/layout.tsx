import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { EnsureMember } from "@/components/member/EnsureMember";
import { SHOW_DIGIUNIVERZITA, SHOW_MEMBER_AREA } from "@/lib/flags";

export const metadata: Metadata = {
  title: "DIGI univerzita",
  robots: { index: false, follow: false },
};

/**
 * Root layout má `revalidate = 300` — bez `force-dynamic` by se
 * vyrenderované HTML jednoho člena mohlo naservírovat dalšímu.
 */
export const dynamic = "force-dynamic";

/**
 * DIGI univerzita je vlastní sekce, ne záložka v účtu.
 *
 * Kurz potřebuje šířku: velké video, osnovu vedle přehrávače, přepis pod ním.
 * V pravém sloupci vedle navigace účtu by na to nezbylo místo a soutěžil by
 * o pozornost s fakturami a profilem.
 *
 * Ochrana je stejná jako u účtu — `auth()` v layoutu, ne matcher v middleware
 * (`createRouteMatcher` je v Clerku 7 deprecated).
 */
export default async function DigiuniverzitaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!SHOW_MEMBER_AREA || !SHOW_DIGIUNIVERZITA) notFound();

  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: "/digiuniverzita" });

  return (
    <>
      <EnsureMember />
      {/* širší než zbytek webu — přehrávač a osnova vedle sebe potřebují místo */}
      <div className="mx-auto w-full max-w-[92rem] px-5 py-8 sm:px-8 sm:py-12">
        {children}
      </div>
    </>
  );
}
