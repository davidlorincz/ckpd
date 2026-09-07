import { AdminHeading } from "@/components/admin/AdminShell";
import { CredentialAdmin } from "@/components/admin/CredentialAdmin";

export const metadata = { title: "Certifikace · Administrace" };

export default function AdminCredentialsPage() {
  return (
    <>
      <AdminHeading
        title="Certifikace"
        lead="Vydávání certifikací, prodlužování platnosti a odebrání. Každá certifikace má vlastní veřejně ověřitelný kód."
      />
      <CredentialAdmin />
    </>
  );
}
