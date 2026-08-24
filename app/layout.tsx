import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "./globals.css";
import { Toaster } from "sonner";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ConvexClientProvider } from "@/lib/convex";
import { EditModeProvider } from "@/contexts/EditModeContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// ISR: server-side HTML s editovanými texty se obnoví nejpozději po 5 minutách;
// klienti mají změny okamžitě přes živou Convex subscription.
export const revalidate = 300;

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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialContent = await getInitialContent();

  return (
    <html lang="cs">
      <body className="flex min-h-screen flex-col">
        <ConvexClientProvider>
          <EditModeProvider>
            <ContentProvider initial={initialContent}>
              <UtilityBar />
              <Header />
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
