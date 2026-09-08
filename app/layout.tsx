import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "./globals.css";
import { Toaster } from "sonner";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { hasClerk, hasConvex } from "@/lib/env";
import { ANONYMOUS_SESSION, type HeaderSession } from "@/lib/session";
import { ConvexClientProvider } from "@/lib/convex";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/*
 * Hlavička se renderuje podle přihlášení a zaplaceného členství, takže HTML
 * je per-uživatel a NESMÍ se cachovat. Dřív tu bylo `revalidate = 300`, ale
 * neúčinkovalo — `fetchQuery` z convex/nextjs posílá `cache: "no-store"`
 * a statický render tím odstavuje. V režimu „jen Clerk, bez Convexu“
 * (lib/convex.tsx ho výslovně podporuje) by se ale `getInitialContent`
 * nezavolal, ISR by se probudilo a zapeklo přihlášení jednoho člověka do
 * stránky servírované všem ostatním. Proto explicitně.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL("https://ckpd.cz"),
  title: {
    default: "Česká komora pilotů DRONů",
    template: "%s · Česká komora pilotů DRONů",
  },
  description:
    "Dobrovolný profesní spolek pilotů a provozovatelů bezpilotních systémů. Propojujeme piloty, odborníky a stát, aby regulace držela krok s technologií.",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "Česká komora pilotů DRONů",
  },
};

/** Přepisy textů z Convexu pro první server render. Bez backendu → prázdno. */
async function getInitialContent(): Promise<Record<string, string>> {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) return {};
  try {
    return await fetchQuery(api.content.getAll);
  } catch {
    return {};
  }
}

/**
 * Stav přihlášení pro první server render hlavičky.
 *
 * Clerk klientsky odpoví až po stažení clerk-js (`useUser().isLoaded` je při
 * prvním paintu vždycky false), takže bez tohohle by hlavička při každém
 * načtení probliknala z „Stát se členem“ na ikonu účtu.
 */
async function getSession(): Promise<HeaderSession> {
  // Bez klíčů `middleware.ts` Clerk vůbec nemontuje a `auth()` by spadlo.
  if (!hasClerk) return ANONYMOUS_SESSION;
  try {
    const { userId, getToken } = await auth();
    if (!userId) return ANONYMOUS_SESSION;
    if (!hasConvex) return { ...ANONYMOUS_SESSION, signedIn: true };

    const token = await getToken({ template: "convex" });
    const me = token
      ? await fetchQuery(api.members.getSelfSummary, {}, { token })
      : null;

    return {
      signedIn: true,
      admin: me?.admin ?? false,
      digiAccess: me?.digiAccess ?? false,
      tier: me?.active ? me.tier : undefined,
    };
  } catch {
    return ANONYMOUS_SESSION;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [initialContent, session] = await Promise.all([
    getInitialContent(),
    getSession(),
  ]);

  return (
    <html lang="cs">
      <body className="flex min-h-screen flex-col">
        <ConvexClientProvider>
          <EditModeProvider>
            <ContentProvider initial={initialContent}>
              <UtilityBar />
              <Header session={session} />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster position="bottom-right" richColors />
            </ContentProvider>
          </EditModeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
