import { notFound } from "next/navigation";

import { CourseCatalog } from "@/components/digiuniverzita/CourseCatalog";
import { SHOW_DIGIUNIVERZITA } from "@/lib/flags";

export const metadata = {
  title: "DIGI univerzita",
  robots: { index: false, follow: false },
};

export default function DigiuniverzitaPage() {
  if (!SHOW_DIGIUNIVERZITA) notFound();
  return <CourseCatalog />;
}
