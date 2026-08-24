"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  listUsers,
  setAdminRole,
  type AdminUserRow,
} from "@/app/admin/actions";

/**
 * Správa adminů na /admin: seznam všech přihlášených účtů,
 * admin může komukoli roli udělit nebo odebrat (kromě sám sobě).
 */
export function UserAdmin() {
  const [users, setUsers] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = () => {
    startTransition(async () => {
      try {
        setUsers(await listUsers());
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Načtení uživatelů selhalo.");
      }
    });
  };

  useEffect(refresh, []);

  const toggle = (u: AdminUserRow) => {
    startTransition(async () => {
      try {
        await setAdminRole(u.id, !u.isAdmin);
        toast.success(
          u.isAdmin ? `${u.email}: admin odebrán` : `${u.email}: admin udělen`,
        );
        setUsers(await listUsers());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Změna role selhala.");
      }
    });
  };

  return (
    <section className="mt-10 w-full max-w-2xl">
      <h2 className="text-lg">Uživatelé</h2>
      <p className="mt-2 text-[14px] text-ink-2">
        Nový admin se nejdřív sám přihlásí na této stránce (Google nebo
        e-mail), pak se objeví v seznamu a tady mu roli potvrdíš.
      </p>
      {error && <p className="mt-4 text-[14px] text-destructive">{error}</p>}
      {!users && !error && (
        <p className="mt-4 text-[14px] text-ink-2">Načítám…</p>
      )}
      {users && (
        <ul className="mt-4 divide-y divide-hairline border border-hairline">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-ink">
                  {u.name}
                </p>
                <p className="truncate text-[13.5px] text-ink-2">{u.email}</p>
              </div>
              {u.isAdmin && (
                <span className="rounded-[2px] bg-brass px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">
                  Admin
                </span>
              )}
              <button
                onClick={() => toggle(u)}
                disabled={pending}
                className="border border-deep px-3 py-1.5 text-[13.5px] font-medium text-deep transition-colors hover:bg-deep hover:text-paper disabled:opacity-50"
              >
                {u.isAdmin ? "Odebrat admina" : "Udělit admina"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
