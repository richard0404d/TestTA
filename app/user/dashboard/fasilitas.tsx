import {
  Wifi,
  Shirt,
  CookingPot,
  Camera,
  Bike,
  Droplets,
} from "lucide-react";

export default function FasilitasKos() {
  const fasilitas = [
    {
      title: "WiFi",
      icon: <Wifi size={28} />,
    },
    {
      title: "Tempat Jemur",
      icon: <Shirt size={28} />,
    },
    {
      title: "Dapur Bersama",
      icon: <CookingPot size={28} />,
    },
    {
      title: "CCTV",
      icon: <Camera size={28} />,
    },
    {
      title: "Parkir Motor",
      icon: <Bike size={28} />,
    },
    {
      title: "Air 24 Jam",
      icon: <Droplets size={28} />,
    },
  ];

  return (
    <div className="bg-gray-50 py-20 px-6">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl border shadow-sm p-8">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Fasilitas Umum Kos
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {fasilitas.map((item, index) => (
            <div
              key={index}
              className="h-[150px] border rounded-2xl flex flex-col items-center justify-center text-center hover:shadow-md transition bg-white"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-blue-500 mb-4">
                {item.icon}
              </div>

              <p className="font-medium text-gray-700 px-2">
                {item.title}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}