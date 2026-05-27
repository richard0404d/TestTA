import NavbarAdmin from "@/components/navbarAdmin";
import ManajemenPengguna from "@/app/admin/manajemenPengguna/manajemenPenggunaView";

export default function Page() {
  return (
    <main>
      <NavbarAdmin />
      <ManajemenPengguna />
    </main>
  );
}