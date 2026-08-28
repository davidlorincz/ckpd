import { DigiCourseAdmin } from "@/components/admin/DigiCourseAdmin";

export const metadata = { title: "Kurz · Administrace" };

export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DigiCourseAdmin slug={slug} />;
}
