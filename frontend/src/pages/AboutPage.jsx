import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const getInitials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();
const formatDate = (date) => {
  if (!date) return '';
  const parsed = new Date(`${String(date).slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

export default function AboutPage({ isDarkMode }) {
  const [stylists, setStylists] = useState([]);
  const [stylistsLoading, setStylistsLoading] = useState(true);
  const [stylistsError, setStylistsError] = useState('');

  useEffect(() => {
    let current = true;
    api.getPublicStylists()
      .then((result) => { if (current) setStylists(Array.isArray(result) ? result : result?.data || []); })
      .catch((error) => { if (current) setStylistsError(error.message || 'Unable to load stylist profiles.'); })
      .finally(() => { if (current) setStylistsLoading(false); });
    return () => { current = false; };
  }, []);

  return (
    <div className={`min-h-screen py-6 sm:py-10 lg:py-12 animate-fadeIn ${isDarkMode ? 'bg-gradient-to-b from-[#121212] via-[#1B1917] to-[#2A231B] text-[#F5F1EA]' : 'bg-gradient-to-b from-[#FDFBF7] via-[#F1E8D3] to-[#DDC8A2] text-[#2A1E1B]'}`}>
      <div className="mx-auto max-w-7xl space-y-9 px-4 sm:space-y-12 sm:px-6 lg:space-y-16 lg:px-8">
        
        {/* basta Header to */}
        <div className="mx-auto max-w-3xl space-y-3 text-center sm:space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Our Story & Craft</span>
          <h1 className={`text-3xl leading-tight sm:text-5xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
            Redefining Salon Care with <span className="italic font-normal text-[#C5A059]">Passion & Elegance.</span>
          </h1>
          <p className={`text-sm sm:text-base leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#3A2E2B]/80'}`}>
            Founded with a commitment to individual expression and holistic beauty, Centyzz Salon provides an elevated escape where skill meets artistry.
          </p>
        </div>

        {/* Mission & Vision: Sample lang yan */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:gap-8">
          <div className={`space-y-3 rounded-2xl border p-5 sm:rounded-3xl sm:p-8 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
            <h3 className={`text-xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Our Mission</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>
              To deliver world-class hair and nail artistry tailored to each client's unique style, while maintaining strict health standards and using eco-conscious luxury products.
            </p>
          </div>
          <div className={`space-y-3 rounded-2xl border p-5 sm:rounded-3xl sm:p-8 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
            <h3 className={`text-xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Our Vision</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>
              To remain the leading sanctuary for clients seeking high-end transformations, unmatched hospitality, and innovative aesthetic techniques.
            </p>
          </div>
        </div>

        {/* Active stylist profiles from the staff database */}
        <div className="space-y-5 sm:space-y-8">
          <div className="text-center">
            <h2 className={`text-3xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Meet Our Stylists</h2>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>Our active stylist profiles at Centy'zz.</p>
          </div>

          {stylistsLoading ? <p role="status" className={`text-center text-sm ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>Loading stylist profiles…</p>
            : stylistsError ? <p role="alert" className="text-center text-sm text-red-600">Couldn’t load stylist profiles: {stylistsError}</p>
              : stylists.length === 0 ? <p className={`text-center text-sm ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>No active stylist profiles are available right now.</p>
                : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                  {stylists.map((member) => {
                    const hiredOn = formatDate(member.hiredOn);
                    return <article key={member.id} className={`space-y-3 overflow-hidden rounded-2xl border p-5 text-center shadow-sm sm:rounded-3xl sm:p-6 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
                      <div aria-label={member.name} role="img" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#C5A059] bg-[#4A3928] font-serif text-2xl font-bold text-[#F1E7C6]">{getInitials(member.name)}</div>
                      <h3 className={`font-serif font-bold text-lg ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>{member.name}</h3>
                      <p className="text-xs font-medium text-[#C5A059]">{member.jobTitle || 'Stylist'}</p>
                      <div className={`space-y-1 text-[11px] ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-500'}`}>
                        {member.biography && <p>{member.biography}</p>}
                        {hiredOn && <p>With Centy'zz since {hiredOn}</p>}
                        {!member.biography && !hiredOn && <p>Stylist profile details have not been added yet.</p>}
                      </div>
                    </article>;
                  })}
                </div>}
        </div>

      </div>
    </div>
  );
}
