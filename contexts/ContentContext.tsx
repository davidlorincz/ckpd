"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Jediná živá subscription na celý slovník přepisů (api.content.getAll).
 * EditableText čte z tohoto kontextu — žádné stovky dotazů po klíčích.
 *
 * `initial` přichází ze serveru (fetchQuery v root layoutu), takže první
 * render už obsahuje editované texty a nic neproblikne.
 */
const ContentContext = createContext<Record<string, string>>({});

function ContentProviderInner({
  initial,
  children,
}: {
  initial: Record<string, string>;
  children: ReactNode;
}) {
  const live = useQuery(api.content.getAll);
  return (
    <ContentContext.Provider value={live ?? initial}>
      {children}
    </ContentContext.Provider>
  );
}

export function ContentProvider({
  initial,
  children,
}: {
  initial: Record<string, string>;
  children: ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return <>{children}</>;
  return <ContentProviderInner initial={initial}>{children}</ContentProviderInner>;
}

/** Přepis daného klíče z DB, nebo undefined (→ použije se výchozí text z kódu). */
export function useContentValue(key: string): string | undefined {
  const map = useContext(ContentContext);
  const value = map[key];
  // Prázdný string se chová jako „bez přepisu" — auto-upsert může založit "".
  return value || undefined;
}
