import type { Metadata } from "next";
import "@fontsource-variable/source-serif-4";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "./globals.css";
import { UtilityBar } from "@/components/layout/UtilityBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body className="flex min-h-screen flex-col">
        <UtilityBar />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
