import {
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

export default function Footer() {
  return (

    <footer className="w-full bg-gray-300 border-t mt-20">

      <div className="max-w-6xl mx-auto px-6 py-8">

        <h2 className="font-semibold text-lg mb-4">
          Tentang Kami
        </h2>

        <div className="space-y-3 text-sm text-gray-700">

          <div className="flex items-center gap-2">

            <Phone size={16} />

            <span>
              085820059999
            </span>

          </div>

          <div className="flex items-center gap-2">

            <Mail size={16} />

            <span>
              kos75@gmail.com
            </span>

          </div>

          <div className="flex items-center gap-2">

            <MapPin size={16} />

            <span>
              Kaliasin no. 75
            </span>

          </div>

        </div>

      </div>

    </footer>
  );
}