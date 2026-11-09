import useSalonProfile from '../hooks/useSalonProfile';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer({ setActivePage, setServiceFilter, isDarkMode }) {
  const profile=useSalonProfile();
  const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const time=value=>{const [h,m]=value.split(':').map(Number);return (h%12||12)+':'+String(m).padStart(2,'0')+' '+(h<12?'AM':'PM');};
  const shell = isDarkMode ? 'bg-[#171717] text-[#F5F1EA] border-[#2A2A2A]' : 'bg-[#2A1E1B] text-white border-[#3A2E2B]';
  const mutedText = isDarkMode ? 'text-[#D6D0C8]' : 'text-amber-100/80';
  const secondaryText = isDarkMode ? 'text-[#D6D0C8]/80' : 'text-amber-100/70';

  return (
    <footer className={`${shell} pt-16 pb-12 border-t`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex justify-center mb-2">
            <img 
                src="/logo.png" /* Replace with your image URL or imported logo asset */
                alt="Centy'zz Salon Logo" 
                className="h-8 w-auto object-contain" 
              />
          </div>
              <span className="text-xl tracking-widest text-white font-bold uppercase">{profile.salonName}</span>
            </div>
            <p className={`text-xs leading-relaxed ${secondaryText}`}>
              {profile.description}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Quick Navigation</h4>
            <ul className={`space-y-2 text-xs ${mutedText}`}>
              <li><button onClick={() => setActivePage('home')} className="hover:text-[#C5A059]">Home</button></li>
              <li><button onClick={() => { setActivePage('services'); setServiceFilter('hair'); }} className="hover:text-[#C5A059]">Hair Services</button></li>
              <li><button onClick={() => { setActivePage('services'); setServiceFilter('nails'); }} className="hover:text-[#C5A059]">Nail Art & Spa</button></li>
              <li><button onClick={() => setActivePage('promos')} className="hover:text-[#C5A059]">Promos & Bundles</button></li>
              <li><button onClick={() => setActivePage('about')} className="hover:text-[#C5A059]">About Us</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Salon Hours</h4>
            <ul className={`space-y-1.5 text-xs ${mutedText}`}>
              {profile.hours.map(day=><li key={day.day} className="flex justify-between gap-3"><span>{days[day.day]}:</span><span>{day.closed?'Closed':time(day.start)+' – '+time(day.end)}</span></li>)}
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Contact Info</h4>
            <ul className={`space-y-2 text-xs ${mutedText}`}>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#C5A059]" /> 
{profile.address}</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#C5A059]" />{profile.phone}</li>
              {profile.email&&<li className="flex items-center gap-2"><Mail className="w-4 h-4 text-[#C5A059]"/>{profile.email}</li>}
            </ul>
          </div>
        </div>
        <div className={`pt-8 text-center text-xs ${isDarkMode ? 'text-[#A9A39B]' : 'text-amber-100/50'}`}>
          © {new Date().getFullYear()} {profile.salonName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}