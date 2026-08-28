import { notFound } from "next/navigation";

import { CourseOutline } from "@/components/digiuniverzita/CourseOutline";
import { SHOW_DIGIUNIVERZITA } from "@/lib/flags";

export const metadata = { robots: { index: false, follow: false } };

export default async function CoursePage({
  params,
}: {
  params: Promise<{ kurz: string }>;
}) {
  if (!SHOW_DIGIUNIVERZITA) notFound();
  const { kurz } = await params;
  return <CourseOutline slug={kurz} />;
}
