import { AdminHeading } from "@/components/admin/AdminShell";
import { UserAdmin } from "@/components/admin/UserAdmin";

export const metadata = { title: "Uživatelé · Administrace" };

export default function AdminUsersPage() {
  return (
    <>
      <AdminHeading
        title="Uživatelé"
        lead="Kdo má přístup do administrace. Roli si nelze odebrat sám sobě."
      />
      <UserAdmin />
    </>
  );
}
