import { AdminHeading } from "@/components/admin/AdminShell";
import { DigiAdmin } from "@/components/admin/DigiAdmin";

export const metadata = { title: "DIGI univerzita · Administrace" };

export default function AdminCoursesPage() {
  return (
    <>
      <AdminHeading
        title="DIGI univerzita"
        lead="Kurzy, lekce a videa. Publikovaná lekce je hned vidět členům — video se po nahrání ještě chvíli enkóduje a k lekci se napojí samo."
      />
      <DigiAdmin />
    </>
  );
}
