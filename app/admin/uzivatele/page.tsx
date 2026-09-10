import { AdminHeading } from "@/components/admin/AdminShell";
import { UserAdmin } from "@/components/admin/UserAdmin";

export const metadata = { title: "Uživatelé · Administrace" };

export default function AdminUsersPage() {
  return (
    <>
      <AdminHeading
        title="Uživatelé"
        lead="Všichni zaregistrovaní — jejich členství, certifikace a přístup do administrace. Klikni na řádek pro detail. Roli si nelze odebrat sám sobě."
      />
      <UserAdmin />
    </>
  );
}
