"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { hasClerk } from "@/lib/env";

type EditModeState = {
  /** true = přihlášený admin, texty jdou editovat kliknutím */
  isEditMode: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const EditModeContext = createContext<EditModeState>({
  isEditMode: false,
  isLoading: false,
  signOut: async () => {},
});

/** Vnitřek vyžaduje ClerkProvider — montuje se jen když je Clerk nakonfigurován. */
function EditModeProviderInner({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();

  const isEditMode = isLoaded && user?.publicMetadata?.role === "admin";

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        isLoading: !isLoaded,
        signOut: async () => {
          await clerk.signOut();
        },
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function EditModeProvider({ children }: { children: ReactNode }) {
  // Bez Clerku (chybějící env) zůstává výchozí kontext: nikdo needituje.
  // Guard musí být na Clerku, ne na Convexu — uvnitř jsou Clerk hooky.
  if (!hasClerk) return <>{children}</>;
  return <EditModeProviderInner>{children}</EditModeProviderInner>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}
