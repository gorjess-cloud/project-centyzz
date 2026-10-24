import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { getServiceImage } from '../utils/serviceImages';

export default function ServicesPage({ serviceFilter, setServiceFilter, onOpenBooking, setActivePage, setAuthMode, currentUser, isDarkMode }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    api.getServices()
      .then((result) => { if (current) setGroups(Array.isArray(result) ? result : result.data || []); })
      .catch((err) => { if (current) setError(err.message); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, []);

  const categories = [{ id: 'all', label: 'All Services' }, ...groups.map((group) => ({ id: String(group.id), label: group.category }))];
  const allServices = groups.flatMap((group) => (group.services || []).map((service) => ({ ...service, category: group.category, categoryId: String(group.id) })));
  const previewLimit = 4;
  const isRegistered = Boolean(currentUser);
  const servicesToShow = (isRegistered ? allServices : allServices.slice(0, previewLimit)).filter((service) =>
    serviceFilter === 'all'
      || service.categoryId === String(serviceFilter)
      || String(service.category).toLowerCase() === String(serviceFilter).toLowerCase()
      || String(service.category).toLowerCase().includes(String(serviceFilter).toLowerCase()),
  );
  const additionalServicesCount = Math.max(0, allServices.length - previewLimit);
  const text = isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]';

  return (
    <div className={`min-h-screen py-6 sm:py-10 lg:py-12 ${isDarkMode ? 'bg-gradient-to-b from-[#121212] via-[#1B1917] to-[#2A231B] text-[#F5F1EA]' : 'bg-gradient-to-b from-[#FDFBF7] via-[#F1E8D3] to-[#DDC8A2] text-[#2A1E1B]'}`}>
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:space-y-8 sm:px-6 lg:space-y-10 lg:px-8">
        <header className="mx-auto max-w-3xl space-y-3 text-center">
          <h1 className={`font-serif text-3xl font-bold sm:text-5xl ${text}`}>Explore Our <span className="font-normal italic text-[#C5A059]">Services.</span></h1>
          <p className={isDarkMode ? 'text-sm text-[#D6D0C8]' : 'text-sm text-[#3A2E2B]/80'}>Browse the current services offered by Centy'zz.</p>
        </header>

        <div className="flex justify-center"><div className={`inline-flex flex-wrap justify-center gap-1.5 rounded-2xl border p-1.5 ${isDarkMode ? 'border-[#39342B] bg-[#1D1A16]' : 'border-[#E9E4D8] bg-[#FFFDF8]/70'}`}>
          {categories.map(({ id, label }) => <button key={id} type="button" onClick={() => setServiceFilter(id)} aria-pressed={String(serviceFilter) === id} className={`min-h-11 rounded-full px-4 py-2 text-xs font-semibold transition sm:px-5 ${String(serviceFilter) === id ? 'bg-[#4A3928] text-white shadow' : isDarkMode ? 'text-[#D6D0C8] hover:bg-white/5' : 'text-[#63513B] hover:bg-[#C5A059]/10'}`}>{label}</button>)}
        </div></div>

        {loading && <p role="status" className="text-center text-sm">Loading services…</p>}
        {error && <p role="alert" className="text-center text-sm text-red-600">Couldn’t load services: {error}</p>}
        {!loading && !error && allServices.length === 0 && <p className="text-center text-sm">No services are available right now.</p>}

        {!loading && !error && allServices.length > 0 && servicesToShow.length === 0 && (
          <p className={`text-center text-sm ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#63513B]'}`}>
            This category has more services available. Create an account to explore the full catalog.
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {servicesToShow.map((service) => (
            <article key={service.id} className={`flex flex-col justify-between overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? 'border-[#2A2A2A] bg-[#1A1A1A]' : 'border-[#E8DFD1] bg-white'}`}>
              <img src={getServiceImage(service.name, service.category)} alt={service.name} loading="lazy" className="h-44 w-full object-cover" />
              <div className="p-4 sm:p-5">
                <span className="text-[10px] font-bold uppercase text-[#C5A059]">{service.category}</span>
                <h2 className={`mt-2 font-serif text-lg font-bold ${text}`}>{service.name}</h2>
                <p className={`mt-2 min-h-12 text-xs ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>{service.description || 'Ask our team about this service.'}</p>
                <p className="mt-4 text-sm font-bold text-[#C5A059]">₱{Number(service.price).toLocaleString('en-PH')}</p>
                <p className={`mt-1 text-[11px] ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-500'}`}>{service.durationMinutes} minutes</p>
              </div>
              <div className={`border-t p-4 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-gray-100'}`}>
                <button type="button" onClick={() => onOpenBooking({ ...service, title: service.name, category: service.category })} className="min-h-11 w-full rounded-lg bg-[#4A3928] px-3 py-2.5 text-xs font-medium text-white transition hover:bg-[#C5A059]">Book this service</button>
              </div>
            </article>
          ))}
        </div>
        {!loading && !error && !isRegistered && additionalServicesCount > 0 && (
          <section className={`mx-auto max-w-4xl rounded-2xl border p-6 text-center shadow-sm sm:p-8 ${isDarkMode ? 'border-[#51493B] bg-[#211F1B]' : 'border-[#E8DFD1] bg-white/80'}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">Enjoy the full experience</p>
            <h2 className={`mt-2 font-serif text-2xl font-bold sm:text-3xl ${text}`}>There’s more to discover</h2>
            <p className={`mx-auto mt-2 max-w-2xl text-sm ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#63513B]'}`}>
              You’re viewing a preview. Create an account to explore and book all {allServices.length} services, including {additionalServicesCount} more {additionalServicesCount === 1 ? "option" : "options"}.
            </p>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setActivePage('auth'); }}
              className="mt-5 min-h-11 rounded-full bg-[#C5A059] px-6 py-3 text-xs font-bold text-white shadow transition hover:bg-[#A9823F]"
            >
              Create your account
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
