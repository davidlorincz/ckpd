"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { hasConvex } from "@/lib/env";

/**
 * Založí členský záznam při prvním vstupu do sekce. Renderuje null.
 *
 * Záměrně místo Clerk webhooku: webhook by chtěl `svix`, signing secret
 * a tunel na dev i na každý preview deploy. Mutace je idempotentní.
 *
 * Nic jí nepředáváme — e-mail a jméno si vezme z ověřeného Clerk JWT.
 */
function EnsureMemberInner() {
  const { isAuthenticated } = useConvexAuth();
  const ensureSelf = useMutation(api.members.ensureSelf);
  const done = useRef(false);

  useEffect(() => {
    // Počkat, až Convex uvidí Clerk token — jinak mutace spadne na neautorizaci.
    if (!isAuthenticated || done.current) return;
    done.current = true;
    ensureSelf().catch(() => {
      // Další načtení stránky to zkusí znovu; profil se dá doplnit i ručně.
      done.current = false;
    });
  }, [isAuthenticated, ensureSelf]);

  return null;
}

export function EnsureMember() {
  if (!hasConvex) return null;
  return <EnsureMemberInner />;
}
