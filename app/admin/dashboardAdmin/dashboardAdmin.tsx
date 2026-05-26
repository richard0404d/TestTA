import { Building2 } from "lucide-react";

export default function DashboardContent() {
  const stats = [
    {
      title: "Total Kamar",
      value: "12",
    },
    {
      title: "Kamar Ditempati",
      value: "9",
    },
    {
      title: "Kamar Tersedia",
      value: "3",
    },
    {
      title: "Pendapatan Bulanan",
      value: "7.000.000",
    },
  ];

  return (
    <main className="flex-1 p-5 md:p-8 md:ml-[260px]">

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8 pt-20">

        {stats.map((item, index) => (
          <div
            key={index}
            className="bg-white border rounded-2xl p-6 shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <Building2 size={24} />
            </div>

            <p className="text-gray-500 mb-2">
              {item.title}
            </p>

            <h1 className="text-3xl font-bold text-gray-800">
              {item.value}
            </h1>
          </div>
        ))}

      </div>

      <div className="bg-white border rounded-3xl p-6 shadow-sm">

        <h2 className="text-2xl font-bold mb-6">
          Pendapatan
        </h2>

        <div className="h-[350px] rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100 border flex items-center justify-center text-gray-400">
          Grafik Pendapatan
        </div>

      </div>
    </main>
  );
}