"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import {
  Plus,
  Pencil,
  X,
} from "lucide-react";

export default function ManajemenPenggunaView() {

  // ============================================
  // SUPABASE
  // ============================================

  const supabase = createClient();

  // ============================================
  // STATE
  // ============================================

  const [pegawai, setPegawai] =
    useState<any[]>([]);

  const [penyewa, setPenyewa] =
    useState<any[]>([]);

  const [openPegawai, setOpenPegawai] =
    useState(false);

  const [openPenyewa, setOpenPenyewa] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [editPegawaiId, setEditPegawaiId] =
    useState<string | null>(null);

  const [editPenyewaId, setEditPenyewaId] =
    useState<string | null>(null);

  // ============================================
  // FORM PEGAWAI
  // ============================================

  const [pegawaiForm, setPegawaiForm] =
    useState({
      nama_pegawai: "",
      email_pegawai: "",
      password: "",
      nomor_telepon_pegawai: "",
      id_role: "2",
      status_pegawai: "Aktif",
    });

  // ============================================
  // FORM PENYEWA
  // ============================================

  const [penyewaForm, setPenyewaForm] =
    useState({
      nama_penyewa: "",
      email_penyewa: "",
      password: "",
      nomor_telepon_penyewa: "",
      ktp_penyewa: "",
      status_penyewa: "Aktif",
    });

  // ============================================
  // GET PEGAWAI
  // ============================================

  const getPegawai = async () => {

    const {
      data,
      error,
    } = await supabase
      .from("pegawai")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {

      console.log(error);

      return;
    }

    setPegawai(data || []);
  };

  // ============================================
  // GET PENYEWA
  // ============================================

  const getPenyewa = async () => {

    const {
      data,
      error,
    } = await supabase
      .from("penyewa")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {

      console.log(error);

      return;
    }

    setPenyewa(data || []);
  };

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {

    getPegawai();

    getPenyewa();

  }, []);

  // ============================================
  // HANDLE INPUT PEGAWAI
  // ============================================

  const handlePegawaiChange = (
    e: any
  ) => {

    setPegawaiForm({
      ...pegawaiForm,
      [e.target.name]:
        e.target.value,
    });
  };

  // ============================================
  // HANDLE INPUT PENYEWA
  // ============================================

  const handlePenyewaChange = (
    e: any
  ) => {

    setPenyewaForm({
      ...penyewaForm,
      [e.target.name]:
        e.target.value,
    });
  };

  // ============================================
  // SIMPAN PEGAWAI
  // ============================================

  const handleSavePegawai =
    async () => {

      try {

        setLoading(true);

        // ============================================
        // UPDATE
        // ============================================

        if (editPegawaiId) {

          const { error } =
            await supabase
              .from("pegawai")
              .update({
                nama_pegawai:
                  pegawaiForm.nama_pegawai,

                email_pegawai:
                  pegawaiForm.email_pegawai,

                nomor_telepon_pegawai:
                  pegawaiForm.nomor_telepon_pegawai,

                id_role:
                  Number(
                    pegawaiForm.id_role
                  ),

                status_pegawai:
                  pegawaiForm.status_pegawai,
              })
              .eq(
                "id_pegawai",
                editPegawaiId
              );

          if (error)
            throw error;

          alert(
            "Pegawai berhasil diupdate"
          );

        } else {

          // ============================================
          // INSERT AUTH USER
          // ============================================

          const {
            data: authData,
            error: authError,
          } = await supabase.auth.signUp({
            email:
              pegawaiForm.email_pegawai,

            password:
              pegawaiForm.password,
          });

          if (authError)
            throw authError;

          const userId =
            authData.user?.id;

          if (!userId) {

            throw new Error(
              "User gagal dibuat"
            );
          }

          // ============================================
          // INSERT PEGAWAI
          // ============================================

          const { error } =
            await supabase
              .from("pegawai")
              .insert([
                {
                  id_pegawai:
                    userId,

                  nama_pegawai:
                    pegawaiForm.nama_pegawai,

                  email_pegawai:
                    pegawaiForm.email_pegawai,

                  nomor_telepon_pegawai:
                    pegawaiForm.nomor_telepon_pegawai,

                  id_role:
                    Number(
                      pegawaiForm.id_role
                    ),

                  status_pegawai:
                    pegawaiForm.status_pegawai,
                },
              ]);

          if (error)
            throw error;

          alert(
            "Pegawai berhasil ditambahkan"
          );
        }

        // REFRESH
        await getPegawai();

        // RESET
        setPegawaiForm({
          nama_pegawai: "",
          email_pegawai: "",
          password: "",
          nomor_telepon_pegawai: "",
          id_role: "2",
          status_pegawai: "Aktif",
        });

        setEditPegawaiId(null);

        setOpenPegawai(false);

      } catch (error: any) {

        console.log(error);

        alert(error.message);

      } finally {

        setLoading(false);
      }
    };

  // ============================================
  // SIMPAN PENYEWA
  // ============================================

  const handleSavePenyewa =
    async () => {

      try {

        setLoading(true);

        // ============================================
        // UPDATE
        // ============================================

        if (editPenyewaId) {

          const { error } =
            await supabase
              .from("penyewa")
              .update({
                nama_penyewa:
                  penyewaForm.nama_penyewa,

                nomor_telepon_penyewa:
                  penyewaForm.nomor_telepon_penyewa,

                ktp_penyewa:
                  penyewaForm.ktp_penyewa,

                status_penyewa:
                  penyewaForm.status_penyewa,
              })
              .eq(
                "id_penyewa",
                editPenyewaId
              );

          if (error)
            throw error;

          alert(
            "Penyewa berhasil diupdate"
          );

        } else {

          // ============================================
          // INSERT AUTH USER
          // ============================================

          const {
            data: authData,
            error: authError,
          } = await supabase.auth.signUp({
            email:
              penyewaForm.email_penyewa,

            password:
              penyewaForm.password,
          });

          if (authError)
            throw authError;

          const userId =
            authData.user?.id;

          if (!userId) {

            throw new Error(
              "User gagal dibuat"
            );
          }

          // ============================================
          // INSERT PENYEWA
          // ============================================

          const { error } =
            await supabase
              .from("penyewa")
              .insert([
                {
                  id_penyewa:
                    userId,

                  nama_penyewa:
                    penyewaForm.nama_penyewa,

                  nomor_telepon_penyewa:
                    penyewaForm.nomor_telepon_penyewa,

                  ktp_penyewa:
                    penyewaForm.ktp_penyewa,

                  status_penyewa:
                    penyewaForm.status_penyewa,
                },
              ]);

          if (error)
            throw error;

          alert(
            "Penyewa berhasil ditambahkan"
          );
        }

        // REFRESH
        await getPenyewa();

        // RESET
        setPenyewaForm({
          nama_penyewa: "",
          email_penyewa: "",
          password: "",
          nomor_telepon_penyewa: "",
          ktp_penyewa: "",
          status_penyewa: "Aktif",
        });

        setEditPenyewaId(null);

        setOpenPenyewa(false);

      } catch (error: any) {

        console.log(error);

        alert(error.message);

      } finally {

        setLoading(false);
      }
    };

  return (

    <div className="min-h-screen bg-gray-100 md:pt-20">

      <main className="pt-24 md:ml-[260px] p-5 md:p-8">

        <div className="bg-white rounded-3xl border shadow-sm p-6">

          {/* TITLE */}
          <div className="mb-8">

            <h1 className="text-3xl font-bold text-gray-800">
              Manajemen Pengguna
            </h1>

            <p className="text-gray-500 mt-1">
              Kelola data pegawai dan penyewa kos
            </p>

          </div>

          {/* ============================================ */}
          {/* DATA PEGAWAI */}
          {/* ============================================ */}

          <div className="mb-12">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-bold">
                Data Pegawai
              </h2>

              <button
                onClick={() => {

                  setOpenPegawai(true);

                  setEditPegawaiId(null);
                }}
                className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl"
              >

                <Plus size={18} />

                Tambah Pegawai

              </button>

            </div>

            <div className="overflow-x-auto rounded-2xl border">

              <table className="w-full">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="px-6 py-4 text-left">
                      Nama
                    </th>

                    <th className="px-6 py-4 text-left">
                      Email
                    </th>

                    <th className="px-6 py-4 text-left">
                      Telepon
                    </th>

                    <th className="px-6 py-4 text-left">
                      Role
                    </th>

                    <th className="px-6 py-4 text-left">
                      Status
                    </th>

                    <th className="px-6 py-4 text-center">
                      Aksi
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {pegawai.map((item) => (

                    <tr
                      key={item.id_pegawai}
                      className="border-t"
                    >

                      <td className="px-6 py-4">
                        {item.nama_pegawai}
                      </td>

                      <td className="px-6 py-4">
                        {item.email_pegawai}
                      </td>

                      <td className="px-6 py-4">
                        {item.nomor_telepon_pegawai}
                      </td>

                      <td className="px-6 py-4">

                        {item.id_role === 1
                          ? "Pemilik"
                          : "Admin"}

                      </td>

                      <td className="px-6 py-4">
                        {item.status_pegawai}
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-center">

                          <button
                            onClick={() => {

                              setEditPegawaiId(
                                item.id_pegawai
                              );

                              setPegawaiForm({
                                nama_pegawai:
                                  item.nama_pegawai,

                                email_pegawai:
                                  item.email_pegawai,

                                password: "",

                                nomor_telepon_pegawai:
                                  item.nomor_telepon_pegawai,

                                id_role:
                                  String(
                                    item.id_role
                                  ),

                                status_pegawai:
                                  item.status_pegawai,
                              });

                              setOpenPegawai(true);
                            }}
                            className="p-3 rounded-xl bg-yellow-100 text-yellow-600"
                          >

                            <Pencil size={18} />

                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

          {/* ============================================ */}
          {/* DATA PENYEWA */}
          {/* ============================================ */}

          <div>

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-bold">
                Data Penyewa
              </h2>

              <button
                onClick={() => {

                  setOpenPenyewa(true);

                  setEditPenyewaId(null);
                }}
                className="flex items-center gap-2 bg-[#1c3163] text-white px-5 py-3 rounded-xl"
              >

                <Plus size={18} />

                Tambah Penyewa

              </button>

            </div>

            <div className="overflow-x-auto rounded-2xl border">

              <table className="w-full">

                <thead className="bg-gray-100">

                  <tr>

                    <th className="px-6 py-4 text-left">
                      Nama
                    </th>

                    <th className="px-6 py-4 text-left">
                      Telepon
                    </th>

                    <th className="px-6 py-4 text-left">
                      KTP
                    </th>

                    <th className="px-6 py-4 text-left">
                      Status
                    </th>

                    <th className="px-6 py-4 text-center">
                      Aksi
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {penyewa.map((item) => (

                    <tr
                      key={item.id_penyewa}
                      className="border-t"
                    >

                      <td className="px-6 py-4">
                        {item.nama_penyewa}
                      </td>

                      <td className="px-6 py-4">
                        {item.nomor_telepon_penyewa}
                      </td>

                      <td className="px-6 py-4">
                        {item.ktp_penyewa}
                      </td>

                      <td className="px-6 py-4">
                        {item.status_penyewa}
                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-center">

                          <button
                            onClick={() => {

                              setEditPenyewaId(
                                item.id_penyewa
                              );

                              setPenyewaForm({
                                nama_penyewa:
                                  item.nama_penyewa,

                                email_penyewa:
                                  item.email_penyewa || "",

                                password: "",

                                nomor_telepon_penyewa:
                                  item.nomor_telepon_penyewa,

                                ktp_penyewa:
                                  item.ktp_penyewa,

                                status_penyewa:
                                  item.status_penyewa,
                              });

                              setOpenPenyewa(true);
                            }}
                            className="p-3 rounded-xl bg-yellow-100 text-yellow-600"
                          >

                            <Pencil size={18} />

                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </main>

      {/* ============================================ */}
      {/* MODAL PEGAWAI */}
      {/* ============================================ */}

      {openPegawai && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">

            <button
              onClick={() =>
                setOpenPegawai(false)
              }
              className="absolute top-5 right-5"
            >

              <X size={24} />

            </button>

            <h2 className="text-3xl font-bold mb-8">

              {editPegawaiId
                ? "Edit Pegawai"
                : "Tambah Pegawai"}

            </h2>

            <div className="space-y-5">

              <input
                type="text"
                name="nama_pegawai"
                value={pegawaiForm.nama_pegawai}
                onChange={handlePegawaiChange}
                placeholder="Nama Pegawai"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="email"
                name="email_pegawai"
                value={pegawaiForm.email_pegawai}
                onChange={handlePegawaiChange}
                placeholder="Email"
                className="w-full border rounded-xl px-4 py-3"
              />

              {!editPegawaiId && (

                <input
                  type="password"
                  name="password"
                  value={pegawaiForm.password}
                  onChange={handlePegawaiChange}
                  placeholder="Password"
                  className="w-full border rounded-xl px-4 py-3"
                />

              )}

              <input
                type="text"
                name="nomor_telepon_pegawai"
                value={pegawaiForm.nomor_telepon_pegawai}
                onChange={handlePegawaiChange}
                placeholder="Nomor Telepon"
                className="w-full border rounded-xl px-4 py-3"
              />

              <select
                name="id_role"
                value={pegawaiForm.id_role}
                onChange={handlePegawaiChange}
                className="w-full border rounded-xl px-4 py-3"
              >

                <option value="1">
                  Pemilik
                </option>

                <option value="2">
                  Admin
                </option>

              </select>

              <select
                name="status_pegawai"
                value={pegawaiForm.status_pegawai}
                onChange={handlePegawaiChange}
                className="w-full border rounded-xl px-4 py-3"
              >

                <option value="Aktif">
                  Aktif
                </option>

                <option value="Non-Aktif">
                  Non-Aktif
                </option>

              </select>

              <div className="flex justify-end gap-4 pt-5">

                <button
                  onClick={() =>
                    setOpenPegawai(false)
                  }
                  className="px-6 py-3 rounded-xl border"
                >

                  Batal

                </button>

                <button
                  onClick={handleSavePegawai}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#1c3163] text-white"
                >

                  {loading
                    ? "Menyimpan..."
                    : "Simpan"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ============================================ */}
      {/* MODAL PENYEWA */}
      {/* ============================================ */}

      {openPenyewa && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 relative">

            <button
              onClick={() =>
                setOpenPenyewa(false)
              }
              className="absolute top-5 right-5"
            >

              <X size={24} />

            </button>

            <h2 className="text-3xl font-bold mb-8">

              {editPenyewaId
                ? "Edit Penyewa"
                : "Tambah Penyewa"}

            </h2>

            <div className="space-y-5">

              <input
                type="text"
                name="nama_penyewa"
                value={penyewaForm.nama_penyewa}
                onChange={handlePenyewaChange}
                placeholder="Nama Penyewa"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="email"
                name="email_penyewa"
                value={penyewaForm.email_penyewa}
                onChange={handlePenyewaChange}
                placeholder="Email"
                className="w-full border rounded-xl px-4 py-3"
              />

              {!editPenyewaId && (

                <input
                  type="password"
                  name="password"
                  value={penyewaForm.password}
                  onChange={handlePenyewaChange}
                  placeholder="Password"
                  className="w-full border rounded-xl px-4 py-3"
                />

              )}

              <input
                type="text"
                name="nomor_telepon_penyewa"
                value={penyewaForm.nomor_telepon_penyewa}
                onChange={handlePenyewaChange}
                placeholder="Nomor Telepon"
                className="w-full border rounded-xl px-4 py-3"
              />

              <input
                type="text"
                name="ktp_penyewa"
                value={penyewaForm.ktp_penyewa}
                onChange={handlePenyewaChange}
                placeholder="KTP"
                className="w-full border rounded-xl px-4 py-3"
              />

              <select
                name="status_penyewa"
                value={penyewaForm.status_penyewa}
                onChange={handlePenyewaChange}
                className="w-full border rounded-xl px-4 py-3"
              >

                <option value="Aktif">
                  Aktif
                </option>

                <option value="Non-Aktif">
                  Non-Aktif
                </option>

                <option value="Ditangguhkan">
                  Ditangguhkan
                </option>

              </select>

              <div className="flex justify-end gap-4 pt-5">

                <button
                  onClick={() =>
                    setOpenPenyewa(false)
                  }
                  className="px-6 py-3 rounded-xl border"
                >

                  Batal

                </button>

                <button
                  onClick={handleSavePenyewa}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl bg-[#1c3163] text-white"
                >

                  {loading
                    ? "Menyimpan..."
                    : "Simpan"}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}