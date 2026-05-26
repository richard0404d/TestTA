import NavbarAdmin from "@/components/navbarAdmin";
import ManajemenLaporanKerusakan from "@/app/admin/manajemenLaporanKerusakan/manajemenLaporanKerusakan";

export default function Page() {
  return (
    <main>
      <NavbarAdmin />
      <ManajemenLaporanKerusakan />
    </main>
  );
}