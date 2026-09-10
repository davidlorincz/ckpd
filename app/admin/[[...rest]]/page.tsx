import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { AdminNoAccess } from "@/components/admin/AdminNoAccess";
import { AdminHeading } from "@/components/admin/AdminShell";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { TokenTrace } from "@/components/admin/TokenTrace";

export const metadata: Metadata = {
  title: "Administrace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * `/admin` a jeho podcesty. Konkrétní sekce administrace mají vlastní routy
 * a mají před touhle catch-all přednost.
 *
 * Nepřihlášený jde na společné `/prihlaseni` — jedna přihlašovací obrazovka
 * na celém webu. Schválně ne `redirectToSignIn()` jako v `/muj-ucet`: ten
 * čte `NEXT_PUBLIC_CLERK_SIGN_IN_URL` a vstup do administrace nemá viset na
 * tom, jestli je proměnná nasazená všude.
 */
export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) redirect("/prihlaseni?redirect_url=%2Fadmin");

  const client = await clerkClient();
  const me = await client.users.getUser(userId);

  if (me.publicMetadata?.role !== "admin") return <AdminNoAccess />;

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
