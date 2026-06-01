export default function Banner() {
  return (
    // Padding px-4 md:px-8 memberikan jarak dari ujung layar di HP dan Laptop
    <div className="w-full px-4 md:px-8 py-6 bg-gray-50"> 
      
      {/* max-w-6xl membatasi lebar gambar, mx-auto posisikan ke tengah */}
      <div className="max-w-6xl mx-auto overflow-hidden rounded-2xl md:rounded-3xl shadow-md border">
        <img 
          src="/images/BannerKos.png" 
          alt="Banner Kos Kaliasin" 
          className="w-full h-auto block" 
        />
      </div>
      
    </div>
  );
}