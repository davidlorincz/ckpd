import type { Metadata } from "next";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { AdminHeading } from "@/components/admin/AdminShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { TokenTrace } from "@/components/admin/TokenTrace";

export const metadata: Metadata = {
  title: "Administrace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * `/admin` a všechny podcesty, které si Clerk otevírá při přihlašování
 * (sso-callback, factor-one…). Konkrétní sekce administrace mají vlastní
 * routy a mají před touhle catch-all přednost.
 */
export default async function AdminPage() {
  const { userId } = await auth();

  if (userId) {
    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    if (me.publicMetadata?.role === "admin") {
      return (
        <>
          <AdminHeading
            title="Přehled"
            lead="Stav členské základny a obsahu. Editace textů na webu se zapíná automaticky — projdi na kteroukoli stránku a klikni do textu."
          />
          <AdminOverview />
          <TokenTrace />
        </>
      );
    }
  }

  return <AdminSignIn />;
}
