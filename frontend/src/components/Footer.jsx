import { MapPin, Phone } from 'lucide-react';

export default function Footer({ setActivePage, setServiceFilter, isDarkMode }) {
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
              <span className="text-xl tracking-widest text-white font-bold uppercase">CENTYZZ</span>
            </div>
            <p className={`text-xs leading-relaxed ${secondaryText}`}>
              Your premier sanctuary for luxury hair styling and bespoke nail artistry. Experience elegance redefined.
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
              <li className="flex justify-between"><span>Mon - Fri:</span> <span>9:00 AM - 8:00 PM</span></li>
              <li className="flex justify-between"><span>Saturday:</span> <span>9:00 AM - 7:00 PM</span></li>
              <li className="flex justify-between"><span>Sunday:</span> <span>10:00 AM - 5:00 PM</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">Contact Info</h4>
            <ul className={`space-y-2 text-xs ${mutedText}`}>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#C5A059]" /> 
Unit A, Block 15 lot 2, Marbella Cor. Larredo St. Tierra Nova Royale 2, Bagumbong Caloocan City, Caloocan, Philippines, 1421</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-[#C5A059]" />0976 187 2638</li>
            </ul>
          </div>
        </div>
        <div className={`pt-8 text-center text-xs ${isDarkMode ? 'text-[#A9A39B]' : 'text-amber-100/50'}`}>
          © {new Date().getFullYear()} Centyzz Salon & Spa. All rights reserved.
        </div>
      </div>
    </footer>
  );
}