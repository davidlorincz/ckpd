"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Server actions pro správu adminů. Volat je smí jen přihlášený admin —
 * kontroluje se role v Clerk publicMetadata, ne claim ze session tokenu.
 */
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Nepřihlášený uživatel.");
  const client = await clerkClient();
  const me = await client.users.getUser(userId);
  if (me.publicMetadata?.role !== "admin") throw new Error("Jen pro adminy.");
  return { client, userId };
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: number;
};

export async function listUsers(): Promise<AdminUserRow[]> {
  const { client } = await requireAdmin();
  const res = await client.users.getUserList({ limit: 100, orderBy: "-created_at" });
  return res.data.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "—",
    email:
      u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId)
        ?.emailAddress ?? "",
    isAdmin: u.publicMetadata?.role === "admin",
    createdAt: u.createdAt,
  }));
}

export async function setAdminRole(targetId: string, makeAdmin: boolean) {
  const { client, userId } = await requireAdmin();
  if (targetId === userId && !makeAdmin) {
    throw new Error("Admina si nemůžeš odebrat sám — požádej jiného admina.");
  }
  await client.users.updateUserMetadata(targetId, {
    publicMetadata: { role: makeAdmin ? "admin" : null },
  });
  return { ok: true };
}
