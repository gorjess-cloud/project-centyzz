import { SERVICES_DATA } from '../data/servicesData';

export default function ServicesPage({ serviceFilter, setServiceFilter, onOpenBooking, isDarkMode }) {
  const filtered = serviceFilter === 'all' 
    ? SERVICES_DATA 
    : SERVICES_DATA.filter(s => s.category === serviceFilter);

  return (
    <div className={`py-12 min-h-screen ${isDarkMode ? 'bg-gradient-to-b from-[#121212] via-[#1B1917] to-[#2A231B] text-[#F5F1EA]' : 'bg-gradient-to-b from-[#FDFBF7] via-[#F1E8D3] to-[#DDC8A2] text-[#2A1E1B]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className={`text-3xl sm:text-5xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
            Explore Services for <span className="italic font-normal text-[#C5A059]">Hair</span> & <span className="italic font-normal text-[#C5A059]">Nails.</span>
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#3A2E2B]/80'}`}>Customized, professional treatments executed by our senior artists.</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center">
          <div className={`inline-flex p-1.5 rounded-full border ${isDarkMode ? 'bg-[#1D1D1D] border-[#2A2A2A]' : 'bg-[#E8DFD1]/50 border-[#E8DFD1]'}`}>
            {['all', 'hair', 'nails'].map((cat) => (
              <button
                key={cat}
                onClick={() => setServiceFilter(cat)}
                className={`px-6 py-2 rounded-full text-xs font-semibold capitalize transition-all ${serviceFilter === cat ? 'bg-[#C5A059] text-white shadow' : isDarkMode ? 'text-[#F5F1EA]' : 'text-[#3A2E2B]'}`}
              >
                {cat === 'all' ? 'All Services' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Cards: Sample pa lang mga nanjan nakakatamad pa, tas nasa data folder ung mga services since wala pa to sa back end */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((service) => (
            <div key={service.id} className={`rounded-2xl overflow-hidden border shadow-sm flex flex-col justify-between ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
              <div>
                <img src={service.image} alt={service.title} className="w-full h-44 object-cover" />
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-[#C5A059]">{service.category}</span>
                    <span className="text-xs font-bold text-amber-500">★ {service.rating}</span>
                  </div>
                  <h3 className={`font-serif font-bold text-base ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>{service.title}</h3>
                  <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>{service.description}</p>
                </div>
              </div>
              <div className={`p-4 border-t flex items-center justify-between ${isDarkMode ? 'border-[#2A2A2A]' : 'border-gray-100'}`}>
                <span className="text-lg font-serif font-bold text-[#C5A059]">{service.price}</span>
                <button onClick={() => onOpenBooking(service)} className="px-3 py-1.5 rounded-lg bg-[#395004] text-white text-xs font-medium hover:bg-[#C5A059]">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}