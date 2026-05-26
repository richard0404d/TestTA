import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-gray-300 border-t p-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-semibold mb-2">Tentang Kami</h2>

        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <Phone size={16} />
            <span>085820059999</span>
          </div>

          <div className="flex items-center gap-2">
            <Mail size={16} />
            <span>kos75@gmail.com</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>Kaliasin no. 75</span>
          </div>
        </div>
      </div>
    </div>
  );
}