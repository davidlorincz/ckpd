import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { Container } from "@/components/ui/Container";
import { MemberNav } from "@/components/member/MemberNav";
import { EnsureMember } from "@/components/member/EnsureMember";

export const metadata: Metadata = {
  title: "Můj účet",
  robots: { index: false, follow: false },
};

/**
 * Root layout má `revalidate = 300` — bez `force-dynamic` by se
 * vyrenderované HTML jednoho člena mohlo naservírovat dalšímu.
 */
export const dynamic = "force-dynamic";

/**
 * Členská sekce. Chráněná přes `auth()` v layoutu, ne přes matcher
 * v middleware — `createRouteMatcher` je v Clerku 7 deprecated.
 */
export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn({ returnBackUrl: "/muj-ucet" });

  return (
    <>
      <EnsureMember />
      <div className="paper-grid border-b border-hairline">
        <Container className="py-10 sm:py-14">
          <h1 className="text-[30px] leading-[1.1] sm:text-[40px]">Můj účet</h1>
        </Container>
      </div>
      <Container className="py-10 sm:py-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-14">
          <MemberNav />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </Container>
    </>
  );
}
