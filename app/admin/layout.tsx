import type { Metadata } from "next";
import { auth, clerkClient } from "@clerk/nextjs/server";

import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Administrace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Rám administrace se vykreslí jen adminovi.
 *
 * Nepřihlášený musí projít stránkou `/admin`, kde je Clerk přihlášení —
 * kdyby ho layout zablokoval, neměl by se kudy přihlásit. Proto se tady
 * nezakazuje přístup, jen se nenasazuje rám; jednotlivé sekce si nárok
 * hlídají samy (server actions i Convex `requireAdmin`).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  let isAdmin = false;

  if (userId) {
    const client = await clerkClient();
    const me = await client.users.getUser(userId);
    isAdmin = me.publicMetadata?.role === "admin";
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        {children}
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
