import { AdminHeading } from "@/components/admin/AdminShell";
import { PartnerKeys } from "@/components/admin/PartnerKeys";

export const metadata = { title: "Partneři · Administrace" };

export default function AdminPartnersPage() {
  return (
    <>
      <AdminHeading
        title="Partneři"
        lead="Klíče k ověřovacímu API a audit dotazů. Klíč se ukáže jednou při vydání a už nikdy — v databázi je jen jeho otisk."
      />
      <PartnerKeys />
    </>
  );
}
