import { useState } from 'react';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

export default function ForgotPinPage({ isDarkMode, setIsDarkMode }) {
  const [email, setEmail] = useState('');
  const panelBase = isDarkMode ? 'bg-[#111111] text-[#F5F1EA]' : 'bg-[#F4EFE6] text-[#2A201C]';
  const fieldLabel = isDarkMode ? 'text-[#D8C2A0]' : 'text-[#5C524B]';
  const fieldClass = isDarkMode
    ? 'mt-1.5 w-full rounded-md border border-[#3B3B3B] bg-[#1A1A1A] px-4 py-3 text-xs text-[#F5F1EA] placeholder-[#A19A90] outline-none transition-all duration-300 focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30'
    : 'mt-1.5 w-full rounded-md border border-[#E8DFD1] bg-white px-4 py-3 text-xs text-[#121212] placeholder-[#5C524B] outline-none transition-all duration-300 focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30';

  const handleSubmit = (event) => {
    event.preventDefault();
    window.alert(`PIN reset requested for ${email}`);
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${panelBase}`}>
      <div className="relative hidden h-screen w-1/2 shrink-0 select-none flex-col justify-between p-10 lg:flex">
        <div
          className="absolute inset-0 bg-cover bg-center grayscale transition-all duration-700 ease-out"
          style={{
            backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop')",
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/30 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Salon
          </a>

          <button
            type="button"
            onClick={() => setIsDarkMode((previous) => !previous)}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {isDarkMode ? 'Light' : 'Dark'}
          </button>
        </div>

        <div className="relative z-10 my-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A059]">
            CLIENT SANCTUARY PORTAL
          </p>
          <h1 className="mt-3 text-4xl font-normal leading-tight text-white lg:text-5xl">
            Elevate Your <br />
            <span className="italic text-[#C5A059]">Personal Elegance.</span>
          </h1>
          <p className="mt-4 text-xs font-light leading-relaxed text-white/70">
            Manage your bookings, view tailored hair &amp; nail consultation histories, and claim exclusive VIP pampering rewards.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-[10px] text-white/60">
            © Centy&apos;zz Hair &amp; Beauty Salon - Caloocan City
          </p>
        </div>
      </div>

      <div className={`flex h-screen flex-1 items-center justify-center overflow-y-auto px-6 py-12 custom-scrollbar lg:px-12 ${isDarkMode ? 'bg-[#101010]' : 'bg-[#F4EFE6]'}`}>
        <div className="my-auto w-full max-w-md space-y-6 py-6 text-center">
          <div className="mb-2 flex justify-center">
            <img
              src="/logo.png"
              alt="Centy'zz Salon Logo"
              className="h-16 w-auto object-contain transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div className="transform transition-all duration-300 ease-in-out">
            <h2 className={`text-3xl ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#121212]'}`}>
              Reset PIN
            </h2>
            <p className={`mt-2 text-xs ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]'}`}>
              Enter your email to receive a PIN reset code
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
            <div>
              <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter Your Email"
                required
                className={fieldClass}
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-[#C5A059] py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition-all duration-300 hover:bg-[#D8B775] active:scale-[0.99]"
            >
              SEND RESET CODE
            </button>
          </form>

          <div className="pt-2 text-xs">
            <p className={isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]'}>
              Remembered your PIN?{' '}
              <a
                href="/?page=auth"
                className="font-semibold uppercase text-[#C5A059] transition-colors hover:underline"
              >
                SIGN IN HERE
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
