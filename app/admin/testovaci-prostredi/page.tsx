import { AdminHeading } from "@/components/admin/AdminShell";
import { SandboxAdmin } from "@/components/admin/SandboxAdmin";

export const metadata = { title: "Testovací prostředí · Administrace" };

export default function AdminSandboxPage() {
  return (
    <>
      <AdminHeading
        title="Testovací prostředí"
        lead="Pískoviště ověřovacího API pro partnery: pevná sada fiktivních členů, vlastní klíče a log dotazů i s odpověďmi. Odpovědi mají stejný tvar jako v ostrém provozu."
      />
      <SandboxAdmin />
    </>
  );
}
