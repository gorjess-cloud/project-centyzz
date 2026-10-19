import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, Moon, Sun } from 'lucide-react';
import { api } from '../api/client.js';
import { GoogleLogin } from '@react-oauth/google';


export default function AuthPage({ mode = 'login', setMode, onBackToSalon, onPreviewDashboard, onAuthenticated, isDarkMode, setIsDarkMode }) {
  const isSignup = mode === 'signup';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeValidationField, setActiveValidationField] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState(() => Array(6).fill(''));
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRefs = useRef([]);

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordRules = [
    { label: 'at least 8 characters', isValid: password.length >= 8 },
    { label: 'one uppercase letter', isValid: /[A-Z]/.test(password) },
    { label: 'one number', isValid: /\d/.test(password) },
    { label: 'one symbol', isValid: /[^A-Za-z0-9\s]/.test(password) },
  ];
  const unmetPasswordRule = passwordRules.find((rule) => !rule.isValid);
  const fieldErrors = {
    email: !email.trim() ? 'Email is required.' : !emailIsValid ? 'Enter a valid email address.' : '',
    password: !password ? 'Password is required.' : unmetPasswordRule ? `Add ${unmetPasswordRule.label}.` : '',
    confirmPassword: !confirmPassword
      ? 'Re-enter your password.'
      : confirmPassword !== password
        ? 'Passwords do not match.'
        : '',
  };

  const renderFieldError = (field) => {
    if (!isSignup || activeValidationField !== field || !fieldErrors[field]) return null;

    return (
      <p id={`${field}-error`} role="alert" className={`mt-1 text-[10px] ${isDarkMode ? 'text-[#f7a6a6]' : 'text-[#a13c3c]'}`}>
        {fieldErrors[field]}
      </p>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormMessage({ type: '', text: '' });

    const normalizedEmail = email.trim();

    if (isSignup) {
      if (!firstName.trim() || !lastName.trim()) {
        setActiveValidationField('');
        setFormMessage({ type: 'error', text: 'Please complete all required fields to create an account.' });
        return;
      }

      if (!emailIsValid) {
        setActiveValidationField('email');
        return;
      }

      if (unmetPasswordRule) {
        setActiveValidationField('password');
        return;
      }

      if (password !== confirmPassword) {
        setActiveValidationField('confirmPassword');
        return;
      }

    }

    if (!normalizedEmail || !password) {
      setFormMessage({ type: 'error', text: 'Please enter your email address and password.' });
      return;
    }

    if (!emailIsValid) {
      setFormMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignup) {
        await api.register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          password,
        });
        setOtp(Array(6).fill(''));
        setIsOtpVerified(false);
        setIsOtpStep(true);
        setFormMessage({ type: 'info', text: 'Registration successful. Check your email for the verification code.' });
        return;
      }

      const result = await api.login({ email: normalizedEmail, password });
      onAuthenticated?.(result.data.user, result.data.accessToken);
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
  const idToken = credentialResponse.credential;

    if (!idToken) {
      setFormMessage({
        type: 'error',
        text: 'Google did not return a valid credential.',
      });
      return;
    }

    setIsSubmitting(true);
    setFormMessage({ type: '', text: '' });

    try {
      const result = await api.googleLogin(idToken);
      onAuthenticated?.(result.data.user, result.data.accessToken);
    } catch (error) {
      setFormMessage({
        type: 'error',
        text: error.message || 'Google sign-in failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const verificationCode = otp.join('');

    if (verificationCode.length !== 6) {
      setFormMessage({ type: 'error', text: 'Enter the six-digit verification code.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.verifyEmail({ email: email.trim(), otp: verificationCode });
      setIsOtpVerified(true);
      setFormMessage({ type: 'success', text: 'Email verified successfully.' });
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 1) {
      const pastedCode = digits.slice(0, 6);
      const nextOtp = Array(6).fill('');
      [...pastedCode].forEach((digit, digitIndex) => {
        nextOtp[digitIndex] = digit;
      });
      setOtp(nextOtp);
      otpInputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = digits;
    setOtp(nextOtp);
    if (digits && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };


  const handleBackToRegistration = () => {
    setOtp(Array(6).fill(''));
    setIsOtpVerified(false);
    setIsOtpStep(false);
    setFormMessage({ type: '', text: '' });
  };

  const handlePreviewDashboard = (profile = {}) => {
    const submittedName = profile.firstName || email.trim().split('@')[0].replace(/[._-]+/g, ' ');
    const displayName = submittedName
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'Jennie';

    onPreviewDashboard?.({
      ...profile,
      name: displayName,
      email: profile.email || email.trim(),
    });
  };

  const socialProviders = [
    { name: 'Google', bg: 'bg-white border border-[#E8DFD1] text-[#2A1E1B]' },
  ];

  const panelBase = isDarkMode ? 'bg-[#111111] text-[#F5F1EA]' : 'bg-[#F4EFE6] text-[#2A201C]';
  const fieldLabel = isDarkMode ? 'text-[#D8C2A0]' : 'text-[#5C524B]';
  const fieldClass = isDarkMode
    ? 'mt-1.5 w-full rounded-md border border-[#3B3B3B] bg-[#1A1A1A] px-4 py-3 text-xs text-[#F5F1EA] placeholder-[#A19A90] outline-none transition-all duration-300 focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30'
    : 'mt-1.5 w-full rounded-md border border-[#E8DFD1] bg-white px-4 py-3 text-xs text-[#121212] placeholder-[#5C524B] outline-none transition-all duration-300 focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30';
  const softText = isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]';
  const divider = isDarkMode ? 'border-[#2F2F2F]' : 'border-[#E8DFD1]';

  return (
    <div className={`flex h-screen w-full overflow-hidden ${panelBase}`}>
      
      {/* Left Panel - Fixed & Static Hero Canvas */}
      <div className="relative hidden w-1/2 h-screen flex-col justify-between p-10 lg:flex shrink-0 select-none">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale transition-all duration-700 ease-out"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop')`
          }}
        />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <button 
            onClick={onBackToSalon}
            className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/30 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Salon
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {isDarkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        {/* Middle Hero Typography */}
        <div className="relative z-10 my-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5A059]">
            CLIENT SANCTUARY PORTAL
          </p>
          <h1 className="mt-3 font-serif text-4xl font-normal leading-tight text-white lg:text-5xl">
            Elevate Your <br />
            <span className="italic text-[#C5A059]">Personal Elegance.</span>
          </h1>
          <p className="mt-4 text-xs font-light leading-relaxed text-white/70">
            Manage your bookings, view tailored hair & nail consultation histories, and claim exclusive VIP pampering rewards.
          </p>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10">
          <p className="text-[10px] text-white/60">
            © Centy'zz Hair & Beauty Salon - Caloocan City
          </p>
        </div>
      </div>

      {/* Right Panel - Smooth Flowing Independent Scroll Container */}
      <div className={`flex-1 h-screen overflow-y-auto px-6 py-12 lg:px-12 flex items-center justify-center custom-scrollbar ${isDarkMode ? 'bg-[#101010]' : 'bg-[#F4EFE6]'}`}>
        <div className="w-full max-w-md my-auto py-6 space-y-6 text-center">

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="Centy'zz Salon Logo" 
              className="h-16 w-auto object-contain transition-transform duration-500 hover:scale-105" 
            />
          </div>

          {/* Header Title with Smooth Fade Transition */}
          <div className="transition-all duration-300 ease-in-out transform">
            <h2 className={`${isOtpStep ? 'font-sans text-2xl font-semibold text-[#9B6B39]' : `font-serif text-3xl ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#121212]'}`} transition-all duration-300`}>
              {isOtpStep ? 'Enter the code' : isSignup ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <p className={`mt-2 text-xs transition-all duration-300 ${isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]'}`}>
              {isOtpStep ? `Enter the six-digit code from your email${email.trim() ? ` (${email.trim()})` : ''}.` : isSignup ? 'Register to manage your bookings & profile' : 'Sign in to access your bookings & profile'}
            </p>
          </div>

          {!isOtpStep && <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
            
            {/* Dynamic Registration Fields Container (Collapses smoothly during Login) */}
            <div 
              className={`space-y-3 overflow-hidden transition-all duration-500 ease-in-out ${
                isSignup ? 'max-h-[160px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
              }`}
              inert={!isSignup}
              aria-hidden={!isSignup}
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                    FIRST NAME
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required={isSignup}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                    LAST NAME
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required={isSignup}
                    className={fieldClass}
                  />
                </div>
              </div>

            </div>

            {/* Email Field */}
            <div className="transition-all duration-300">
              <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (isSignup) setActiveValidationField('email');
                }}
                onFocus={() => isSignup && setActiveValidationField('email')}
                onBlur={() => setActiveValidationField('')}
                placeholder="you@example.com"
                required
                aria-invalid={isSignup && activeValidationField === 'email' && Boolean(fieldErrors.email)}
                aria-describedby={isSignup ? 'email-error' : undefined}
                className={fieldClass}
              />
              {renderFieldError('email')}
            </div>

            {/* Password Field */}
            <div className="transition-all duration-300">
              <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                PASSWORD
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isSignup) setActiveValidationField('password');
                  }}
                  onFocus={() => isSignup && setActiveValidationField('password')}
                  onBlur={() => setActiveValidationField('')}
                  placeholder="Enter Your Password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  aria-invalid={isSignup && activeValidationField === 'password' && Boolean(fieldErrors.password)}
                  aria-describedby={isSignup ? 'password-error' : undefined}
                  className={`${fieldClass} mt-0 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${softText}`}
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
                </button>
              </div>
              {renderFieldError('password')}
            </div>

            {/* Re-type Password Field (Smooth Collapse) */}
            <div 
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isSignup ? 'max-h-[96px] opacity-100 translate-y-0 mt-3' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
              }`}
              inert={!isSignup}
              aria-hidden={!isSignup}
            >
              <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                RE-TYPE PASSWORD
              </label>
              <div className="relative mt-1.5">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setActiveValidationField('confirmPassword');
                  }}
                  onFocus={() => setActiveValidationField('confirmPassword')}
                  onBlur={() => setActiveValidationField('')}
                  placeholder="Confirm Your Password"
                  autoComplete="new-password"
                  required={isSignup}
                  aria-invalid={activeValidationField === 'confirmPassword' && Boolean(fieldErrors.confirmPassword)}
                  aria-describedby="confirmPassword-error"
                  className={`${fieldClass} mt-0 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                  aria-pressed={showConfirmPassword}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${softText}`}
                >
                  {showConfirmPassword ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
                </button>
              </div>
              {renderFieldError('confirmPassword')}
            </div>

            {/* Submit Button */}
            {formMessage.text && (
              <p
                role={formMessage.type === 'error' ? 'alert' : 'status'}
                className={`rounded-md border px-3 py-2 text-[11px] ${
                  formMessage.type === 'error'
                    ? isDarkMode
                      ? 'border-[#7a4d4d] bg-[#2a1d1d] text-[#f7c8c8]'
                      : 'border-[#e9c7c7] bg-[#fff4f4] text-[#7a2b2b]'
                    : formMessage.type === 'info'
                      ? isDarkMode
                        ? 'border-[#66552f] bg-[#2a251b] text-[#f3dfaa]'
                        : 'border-[#ead9a9] bg-[#fffaf0] text-[#715b25]'
                      : isDarkMode
                      ? 'border-[#3d5d3d] bg-[#1d2a1d] text-[#d6f5d7]'
                      : 'border-[#d4e7d4] bg-[#f3fff3] text-[#2f6b3e]'
                }`}
              >
                {formMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-md bg-[#C5A059] py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition-all duration-300 hover:bg-[#D8B775] hover:shadow-md active:scale-[0.99] focus:ring-2 focus:ring-[#9E7B3B]/30"
            >
              {isSubmitting ? 'Please wait…' : isSignup ? 'Register Now' : 'Log In'}
            </button>
          </form>}

          {isOtpStep && (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5 text-center">
              <KeyRound aria-hidden="true" className={`mx-auto h-14 w-14 ${isDarkMode ? 'text-[#C5A059]' : 'text-[#78450C]'}`} strokeWidth={2.5} />

              {formMessage.text && (
                <p
                  role={formMessage.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-md border px-3 py-2 text-[11px] ${
                    formMessage.type === 'error'
                      ? isDarkMode
                        ? 'border-[#7a4d4d] bg-[#2a1d1d] text-[#f7c8c8]'
                        : 'border-[#e9c7c7] bg-[#fff4f4] text-[#7a2b2b]'
                      : formMessage.type === 'info'
                        ? isDarkMode
                          ? 'border-[#66552f] bg-[#2a251b] text-[#f3dfaa]'
                          : 'border-[#ead9a9] bg-[#fffaf0] text-[#715b25]'
                        : isDarkMode
                          ? 'border-[#3d5d3d] bg-[#1d2a1d] text-[#d6f5d7]'
                          : 'border-[#d4e7d4] bg-[#f3fff3] text-[#2f6b3e]'
                  }`}
                >
                  {formMessage.text}
                </p>
              )}

              {!isOtpVerified && (
                <div className="flex justify-center gap-2" aria-label="Six-digit verification code">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpInputRefs.current[index] = element; }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      aria-label={`Digit ${index + 1} of 6`}
                      className={`h-12 w-10 rounded-md border text-center text-lg font-semibold outline-none focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30 ${isDarkMode ? 'border-[#3B3B3B] bg-[#1A1A1A] text-[#F5F1EA]' : 'border-[#E8DFD1] bg-white text-[#121212]'}`}
                    />
                  ))}
                </div>
              )}

              {!isOtpVerified && (
                <button
                  type="submit"
                  aria-label="Verify code"
                  disabled={isSubmitting}
                  className="mx-auto flex h-12 w-14 items-center justify-center rounded-lg border-2 border-[#9B6B39] text-[#78450C] transition-all hover:bg-[#9B6B39] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#9B6B39]/30 active:scale-95"
                >
                  <ArrowRight aria-hidden="true" className="h-8 w-8" strokeWidth={2} />
                </button>
              )}

              {isOtpVerified && (
                <button
                  type="button"
                  onClick={() => handlePreviewDashboard({
                    firstName,
                    lastName,
                    email: email.trim(),
                  })}
                  className="w-full rounded-md bg-[#C5A059] py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#D8B775]"
                >
                  Preview Member Dashboard
                </button>
              )}

              <div className="flex justify-between text-xs">
                <button
                  type="button"
                  onClick={handleBackToRegistration}
                  className="font-semibold text-[#C5A059] hover:underline"
                >
                  Back to registration
                </button>
              </div>
            </form>
          )}

          {!isSignup && !isOtpStep && (
            <button
              type="button"
              onClick={() => handlePreviewDashboard()}
              className={`text-[11px] underline underline-offset-2 ${softText} hover:text-[#C5A059]`}
            >
              Preview signed-in member dashboard
            </button>
          )}

          {/* Divider */}
          {!isOtpStep && <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${divider}`} />
            </div>
            <div className={`relative flex justify-center text-[10px] uppercase tracking-[0.2em] ${softText}`}>
              <span className={`px-3 ${isDarkMode ? 'bg-[#101010]' : 'bg-[#F4EFE6]'}`}>Or continue with</span>
            </div>
          </div>}

          {/* Social Logins */}
          {/* Social Logins */}
          {!isOtpStep && !isSignup && (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  setFormMessage({
                    type: 'error',
                    text: 'Google sign-in failed. Please try again.',
                  })
                }
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="320"
              />
            </div>
          )}

          {/* Mode Toggle Link */}
          {!isOtpStep && <div className="pt-2 text-xs">
            {isSignup ? (
              <p className={isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]'}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFormMessage({ type: '', text: '' });
                    setMode?.('login');
                  }}
                  className="font-semibold text-[#C5A059] hover:underline uppercase transition-colors duration-200"
                >
                  SIGN IN HERE
                </button>
              </p>
            ) : (
              <p className={isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]'}>
                New client?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setFormMessage({ type: '', text: '' });
                    setMode?.('signup');
                  }}
                  className="font-semibold text-[#C5A059] hover:underline uppercase transition-colors duration-200"
                >
                  REGISTER HERE
                </button>
              </p>
            )}
          </div>}

        </div>
      </div>

    </div>
  );
}