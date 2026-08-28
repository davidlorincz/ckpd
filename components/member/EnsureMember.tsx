"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hasConvex } from "@/lib/env";

/**
 * Založí členský záznam při prvním vstupu do sekce. Renderuje null.
 *
 * Záměrně místo Clerk webhooku: webhook by chtěl `svix`, signing secret
 * a tunel na dev i na každý preview deploy. Mutace je idempotentní.
 *
 * E-mail a jméno posíláme jen jako zálohu pro případ, že JWT šablona
 * „convex" nemá claimy `email` / `name`. Hodnota z tokenu má vždy přednost.
 */
function EnsureMemberInner() {
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const ensureSelf = useMutation(api.members.ensureSelf);
  const done = useRef(false);

  useEffect(() => {
    // Počkat, až Convex uvidí Clerk token — jinak mutace spadne na neautorizaci.
    if (!isAuthenticated || !user || done.current) return;
    done.current = true;
    ensureSelf({
      email: user.primaryEmailAddress?.emailAddress ?? undefined,
      name: user.fullName ?? undefined,
    }).catch(() => {
      // Další načtení stránky to zkusí znovu; profil se dá doplnit i ručně.
      done.current = false;
    });
  }, [isAuthenticated, user, ensureSelf]);

  return null;
}

export function EnsureMember() {
  if (!hasConvex) return null;
  return <EnsureMemberInner />;
}
