"use client";

import { ReactNode, useMemo } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { csCZ } from "@clerk/localizations";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { hasClerk, hasConvex } from "@/lib/env";
import { clerkAppearance } from "@/lib/clerkAppearance";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Clerk + Convex providery. Osy jsou dvě a nesmí se plést:
 * Clerk drží přihlášení (členská sekce, admin), Convex data.
 *
 *  - Clerk i Convex  → oba providery, Convex ověřuje přes Clerk JWT
 *  - jen Clerk       → přihlášení funguje, texty jedou z kódu
 *  - ani jedno       → čistý statický web bez backendu
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => (convexUrl ? new ConvexReactClient(convexUrl) : null),
    [],
  );

  if (!hasClerk) return <>{children}</>;

  if (!hasConvex || !client)
    return (
      <ClerkProvider localization={csCZ} appearance={clerkAppearance}>
        {children}
      </ClerkProvider>
    );

  return (
    <ClerkProvider localization={csCZ} appearance={clerkAppearance}>
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
