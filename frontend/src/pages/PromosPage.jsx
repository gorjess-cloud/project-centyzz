import { useState } from 'react';
import { Check, Tag, X, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { PROMOS_DATA } from '../data/promosData';

export default function PromosPage({ setActivePage, setAuthMode, isDarkMode }) {
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClaimClick = (promo) => {
    setSelectedPromo(promo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPromo(null);
  };

  const handleLoginClick = () => {
    handleCloseModal();
    if (setAuthMode) setAuthMode('login');
    if (setActivePage) setActivePage('auth');
  };

  const handleRegisterClick = () => {
    handleCloseModal();
    if (setAuthMode) setAuthMode('signup');
    if (setActivePage) setActivePage('auth');
  };

  return (
    <div className={`py-12 min-h-screen relative ${isDarkMode ? 'bg-gradient-to-b from-[#121212] via-[#1B1917] to-[#2A231B] text-[#F5F1EA]' : 'bg-gradient-to-b from-[#FDFBF7] via-[#F1E8D3] to-[#DDC8A2] text-[#2A1E1B]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-[#C5A059] uppercase tracking-widest">Exclusive Combos</span>
          <h1 className={`text-3xl sm:text-5xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>
            Bundle it. More Services <span className="italic font-normal text-[#C5A059]">for less.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PROMOS_DATA.map((promo) => (
            <div key={promo.id} className={`rounded-3xl p-6 border shadow-md flex flex-col justify-between ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E8DFD1]'}`}>
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">{promo.savings}</span>
                <h3 className={`text-xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>{promo.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-serif font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>{promo.bundlePrice}</span>
                  <span className="text-sm text-gray-400 line-through">{promo.originalPrice}</span>
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>{promo.description}</p>
                <div className="space-y-2 pt-2">
                  {promo.features.map((feat, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>
                      <Check className="w-3.5 h-3.5 text-[#C5A059]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => handleClaimClick(promo)} 
                className="mt-6 w-full py-3 rounded-xl bg-[#C5A059] text-white text-xs font-semibold hover:bg-[#b08d47] transition-colors"
              >
                Claim Bundle Deal
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PROMOTION / MANDATORY MEMBER LOGIN POPUP BANNER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`rounded-3xl border shadow-2xl relative max-w-md w-full overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#1A1917] border-[#3A342B]' : 'bg-white border-[#E8DFD1]'}`}>
            
            {/* Close Button */}
            <button 
              onClick={handleCloseModal}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${isDarkMode ? 'text-[#B8B1A7] hover:text-white bg-[#302D29] hover:bg-[#403B34]' : 'text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Card Content */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Icon Header */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-[#29251F] text-[#D7B56D]' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Tag className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>Members-Only Offer</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block mt-0.5 ${isDarkMode ? 'text-[#E8C77E] bg-[#342C1E]' : 'text-amber-600 bg-amber-50'}`}>
                    Account Required
                  </span>
                </div>
              </div>

              {/* Promo Context Description */}
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#D6D0C8]' : 'text-gray-600'}`}>
                The <strong className={isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}>{selectedPromo?.title}</strong> bundle discount is exclusively available to registered Centy'Zz members. Please sign in or create an account to unlock this offer.
              </p>

              {/* Locked Promo Code Display */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#A9A39B]' : 'text-gray-400'}`}>
                  Voucher / Campaign Code
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      readOnly 
                      value={selectedPromo ? `${selectedPromo.title.toUpperCase().replace(/\s+/g, '-')}-DEAL` : 'BUNDLE-PROMO'} 
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold tracking-wide focus:outline-none pr-8 ${isDarkMode ? 'bg-[#242220] border-[#484033] text-[#E8D9B7]' : 'bg-indigo-50/40 border-indigo-200 text-indigo-900'}`}
                    />
                    <Lock className={`w-3.5 h-3.5 absolute right-3 top-3 ${isDarkMode ? 'text-[#C5A059]' : 'text-indigo-400'}`} />
                  </div>
                  <button 
                    onClick={handleLoginClick}
                    className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1 ${isDarkMode ? 'bg-[#3A342B] border border-[#8D7444] text-[#F5F1EA] hover:bg-[#51432D] hover:border-[#C5A059]' : 'bg-[#2A1E1B] text-white hover:bg-[#C5A059]'}`}
                  >
                    <span>Apply</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </button>
                </div>
              </div>

              {/* Mandatory Auth Notice Banner */}
              <div className={`border rounded-2xl p-3.5 flex items-start gap-2.5 ${isDarkMode ? 'bg-[#30291E] border-[#514126]' : 'bg-amber-50/80 border-amber-200/60'}`}>
                <Lock className={`w-4 h-4 shrink-0 mt-0.5 ${isDarkMode ? 'text-[#E8C77E]' : 'text-amber-700'}`} />
                <p className={`text-xs font-medium leading-snug ${isDarkMode ? 'text-[#EADBB9]' : 'text-amber-900'}`}>
                  Login or Sign Up required! This <span className="font-bold">{selectedPromo?.savings || 'special discount'}</span> offer will be automatically credited to your new account.
                </p>
              </div>

              {/* Primary Mandatory Actions */}
              <div className="pt-2 flex flex-col gap-2.5">
                <button 
                  onClick={() => { setAuthMode('login'); setActivePage('auth'); }}
                  className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 shadow-md ${isDarkMode ? 'bg-[#3A342B] border border-[#8D7444] text-[#F5F1EA] hover:bg-[#51432D] hover:border-[#C5A059]' : 'bg-[#2A1E1B] text-white hover:bg-[#C5A059]'}`}
                >
                  <span>Sign In to Claim Deal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button 
                  onClick={handleRegisterClick}
                  className={`w-full py-2.5 rounded-xl border text-xs font-semibold transition-colors ${isDarkMode ? 'bg-[#242220] border-[#3A342B] hover:bg-[#302D29] text-[#F5F1EA]' : 'bg-white border-[#E8DFD1] hover:bg-[#FDFBF7] text-[#2A1E1B]'}`}
                >
                  Don't have an account? <span className="text-[#C5A059] font-bold">Register Free</span>
                </button>
              </div>
            </div>

            {/* Bottom Artwork Banner */}
            <div className={`h-24 bg-gradient-to-r border-t relative overflow-hidden flex items-center justify-center ${isDarkMode ? 'from-[#3B3020] via-[#39262A] to-[#28263A] border-[#3A342B]' : 'from-amber-200 via-rose-200 to-indigo-200 border-[#E8DFD1]'}`}>
              <div className={`absolute inset-0 opacity-20 ${isDarkMode ? 'bg-[radial-gradient(#F5F1EA_1px,transparent_1px)]' : 'bg-[radial-gradient(#2A1E1B_1px,transparent_1px)]'} [background-size:12px_12px]`} />
              <div className="relative z-10 text-center px-4">
                <p className={`font-serif italic text-xs font-bold ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#2A1E1B]'}`}>✨ Centy'Zz Loyalty Perks ✨</p>
                <p className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#2A1E1B]/70'}`}>Register now to claim your bundle & earn reward points instantly.</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}