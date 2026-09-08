"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";

import { api } from "@/convex/_generated/api";
import { hasConvex } from "@/lib/env";

/**
 * Založí členský záznam při prvním vstupu do sekce. Renderuje null.
 *
 * Záměrně místo Clerk webhooku: webhook by chtěl `svix`, signing secret
 * a tunel na dev i na každý preview deploy. Mutace je idempotentní.
 *
 * E-mail a jméno mutaci nepředáváme — vezme si je z ověřeného Clerk JWT.
 * Předáváme jen souhlasy ze zaškrtávátek v registraci: ty čekají v Clerk
 * `unsafeMetadata`, protože tudy přežijí i odskok na Google. Do evidence je
 * bez tohohle kroku nemá kdo dostat.
 */
type Agreements = { statutes: boolean; gdpr: boolean };

function readAgreements(metadata: unknown): Agreements | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as { agreements?: unknown }).agreements;
  if (!value || typeof value !== "object") return undefined;

  const { statutes, gdpr } = value as Partial<Agreements>;
  if (typeof statutes !== "boolean" || typeof gdpr !== "boolean") {
    return undefined;
  }
  return { statutes, gdpr };
}

function EnsureMemberInner() {
  const { isAuthenticated } = useConvexAuth();
  const { user, isLoaded } = useUser();
  const ensureSelf = useMutation(api.members.ensureSelf);
  const done = useRef(false);

  useEffect(() => {
    // Počkat, až Convex uvidí Clerk token — jinak mutace spadne na neautorizaci.
    // A zároveň na načtený Clerk profil, jinak by souhlasy z registrace utekly.
    if (!isAuthenticated || !isLoaded || done.current) return;
    done.current = true;

    const agreements = readAgreements(user?.unsafeMetadata);

    ensureSelf(agreements ? { agreements } : {}).catch(() => {
      // Další načtení stránky to zkusí znovu; profil se dá doplnit i ručně.
      done.current = false;
    });
  }, [isAuthenticated, isLoaded, user, ensureSelf]);

  return null;
}

export function EnsureMember() {
  if (!hasConvex) return null;
  return <EnsureMemberInner />;
}
