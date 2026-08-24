import type { Metadata } from "next";
import { AdminSignIn } from "@/components/admin/AdminSignIn";

export const metadata: Metadata = {
  title: "Administrace",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16">
      <AdminSignIn />
    </div>
  );
}
