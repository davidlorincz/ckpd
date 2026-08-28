import { notFound } from "next/navigation";

import { LessonView } from "@/components/digiuniverzita/LessonView";
import { SHOW_DIGIUNIVERZITA } from "@/lib/flags";

export const metadata = { robots: { index: false, follow: false } };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ kurz: string; lekce: string }>;
}) {
  if (!SHOW_DIGIUNIVERZITA) notFound();
  const { kurz, lekce } = await params;
  return <LessonView courseSlug={kurz} lessonSlug={lekce} />;
}
