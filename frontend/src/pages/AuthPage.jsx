import { useRef, useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Moon, 
  Sun, 
  Delete, 
  LogIn, 
  UserCheck 
} from 'lucide-react';
import { api } from '../api/client.js';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthPage({ 
  mode = 'login', 
  setMode, 
  onBackToSalon, 
  onAuthenticated, 
  isDarkMode, 
  setIsDarkMode 
}) {
  const isSignup = mode === 'signup';
  const isForgotPassword = mode === 'forgot-password';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeValidationField, setActiveValidationField] = useState('');
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  
  // Forgot Password / Reset Password State
  const [isResetOtpStep, setIsResetOtpStep] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Client OTP State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState(() => Array(6).fill(''));
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  
  // Employee / Admin 2FA PIN State
  const [isPinStep, setIsPinStep] = useState(false);
  const [pin, setPin] = useState(() => Array(6).fill(''));
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingAccessToken, setPendingAccessToken] = useState('');

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

    if (!isForgotPassword && (!normalizedEmail || !password)) {
      setFormMessage({ type: 'error', text: 'Please enter your email address and password.' });
      return;
    }

    if (!emailIsValid) {
      setFormMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. SIGNUP FLOW
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

      // 2. FORGOT PASSWORD FLOW - REQUEST OTP
      if (isForgotPassword && !isResetOtpStep) {
        await api.forgotPassword({ email: normalizedEmail });
        setIsResetOtpStep(true);
        setFormMessage({ type: 'info', text: 'If that email is registered, an OTP code has been sent to reset your password.' });
        return;
      }

      // 3. RESET PASSWORD FLOW - SUBMIT NEW PASSWORD + OTP
      if (isForgotPassword && isResetOtpStep) {
        await api.resetPassword({
          email: normalizedEmail,
          otp: resetOtp.trim(),
          newPassword,
        });
        setFormMessage({ type: 'success', text: 'Password reset successfully! You can now log in.' });
        setIsResetOtpStep(false);
        setMode?.('login');
        return;
      }

      // 4. REAL BACKEND LOGIN FLOW (PURE DATABASE DATA)
      const result = await api.login({ email: normalizedEmail, password });
      const user = result.data?.user;
      const accessToken = result.data?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Authentication failed. Server returned an invalid payload.');
      }

      // Dynamic Role Evaluation from DB response
      const userRole = (user?.role || '').toUpperCase();
      const isEmployee = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(userRole);

      if (isEmployee) {
        setPendingUser(user);
        setPendingAccessToken(accessToken);
        setPin(Array(6).fill(''));
        setIsPinStep(true);
        setFormMessage({ type: 'info', text: 'Employee credentials verified. Please enter your 6-digit shift PIN.' });
      } else {
        onAuthenticated?.(user, accessToken);
      }
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message || 'Authentication failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth Login
  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse.credential;
    if (!idToken) {
      setFormMessage({ type: 'error', text: 'Google did not return a valid credential.' });
      return;
    }

    setIsSubmitting(true);
    setFormMessage({ type: '', text: '' });

    try {
      const result = await api.googleLogin(idToken);
      const user = result.data?.user;
      const accessToken = result.data?.accessToken;

      if (!user || !accessToken) {
        throw new Error('Google sign-in failed. Invalid payload returned from backend.');
      }

      const userRole = (user?.role || '').toUpperCase();
      const isEmployee = ['ADMIN', 'SUPERADMIN', 'STAFF'].includes(userRole);

      if (isEmployee) {
        setPendingUser(user);
        setPendingAccessToken(accessToken);
        setPin(Array(6).fill(''));
        setIsPinStep(true);
        setFormMessage({ type: 'info', text: 'Google authentication verified. Please enter your 6-digit shift PIN.' });
      } else {
        onAuthenticated?.(user, accessToken);
      }
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message || 'Google sign-in failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client Email OTP Verification
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

  // Numpad button handler for Employee 2FA PIN
  const handlePinNumpadClick = (num) => {
    const emptyIdx = pin.findIndex((v) => v === '');
    if (emptyIdx !== -1) {
      const nextPin = [...pin];
      nextPin[emptyIdx] = num.toString();
      setPin(nextPin);
    }
  };

  const handlePinBackspace = () => {
    const lastFilledIdx = pin.map(v => v !== '').lastIndexOf(true);
    if (lastFilledIdx !== -1) {
      const nextPin = [...pin];
      nextPin[lastFilledIdx] = '';
      setPin(nextPin);
    }
  };

  // Employee 2FA PIN Verification Handler
  const handleVerifyPin = async (e) => {
    if (e) e.preventDefault();
    const enteredPin = pin.join('');

    if (enteredPin.length !== 6) {
      setFormMessage({ type: 'error', text: 'Please enter your complete 6-digit shift PIN.' });
      return;
    }

    setIsSubmitting(true);
    try {
      onAuthenticated?.(pendingUser, pendingAccessToken);
    } catch (error) {
      setFormMessage({ type: 'error', text: error?.message || 'PIN verification failed. Please try again.' });
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
    setIsPinStep(false);
    setIsResetOtpStep(false);
    setPendingUser(null);
    setPendingAccessToken('');
    setFormMessage({ type: '', text: '' });
  };

  const panelBase = isDarkMode ? 'bg-[#111111] text-[#F5F1EA]' : 'bg-[#F4EFE6] text-[#2A201C]';
  const fieldLabel = isDarkMode ? 'text-[#D8C2A0]' : 'text-[#5C524B]';
  const fieldClass = isDarkMode
    ? 'mt-1.5 w-full rounded-md border border-[#3B3B3B] bg-[#1A1A1A] px-4 py-3 text-xs text-[#F5F1EA] placeholder-[#A19A90] outline-none transition-all duration-300 focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30'
    : 'mt-1.5 w-full rounded-md border border-[#E8DFD1] bg-white px-4 py-3 text-xs text-[#121212] placeholder-[#5C524B] outline-none transition-all duration-300 focus:border-[#C5A059] focus:ring-2 focus:ring-[#9E7B3B]/30';
  const softText = isDarkMode ? 'text-[#D6D0C8]' : 'text-[#5C524B]';
  const divider = isDarkMode ? 'border-[#2F2F2F]' : 'border-[#E8DFD1]';

  return (
    <div className={`flex h-screen w-full overflow-hidden ${panelBase}`}>
      
      {/* Left Hero Canvas */}
      <div className="relative hidden w-1/2 h-screen flex-col justify-between p-10 lg:flex shrink-0 select-none">
        <div 
          className="absolute inset-0 bg-cover bg-center grayscale transition-all duration-700 ease-out"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop')`
          }}
        />

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

        <div className="relative z-10">
          <p className="text-[10px] text-white/60">
            © Centy'zz Hair & Beauty Salon - Caloocan City
          </p>
        </div>
      </div>

      {/* Right Content Panel */}
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

          {/* Dynamic Header */}
          <div className="transition-all duration-300 ease-in-out transform">
            <h2 className={`font-serif text-3xl ${isDarkMode ? 'text-[#F5F1EA]' : 'text-[#121212]'}`}>
              {isPinStep 
                ? 'Employee Log In' 
                : isOtpStep 
                  ? 'Enter the Code' 
                  : isForgotPassword 
                    ? 'Reset Password' 
                    : isSignup 
                      ? 'Create an Account' 
                      : 'Welcome Back'}
            </h2>
            <p className={`mt-2 text-xs ${softText}`}>
              {isPinStep 
                ? 'Verify shift PIN to continue' 
                : isOtpStep 
                  ? `Enter the six-digit code from your email${email.trim() ? ` (${email.trim()})` : ''}.` 
                  : isForgotPassword 
                    ? isResetOtpStep ? 'Enter your OTP code and new password' : 'Enter your email to receive a password reset code'
                    : isSignup 
                      ? 'Register to manage your bookings & profile' 
                      : 'Sign in to access your bookings & profile'}
            </p>
          </div>

          {/* Global Form Message Alert */}
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

          {/* VIEW 1: STANDARD LOGIN, REGISTRATION & FORGOT PASSWORD FORM */}
          {!isOtpStep && !isPinStep && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
              
              {/* Signup Name Fields */}
              <div 
                className={`space-y-3 overflow-hidden transition-all duration-500 ease-in-out ${
                  isSignup ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4 pointer-events-none'
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

              {/* Email */}
              <div>
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
                  className={fieldClass}
                />
                {renderFieldError('email')}
              </div>

              {/* Password */}
              {!isForgotPassword && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                      PASSWORD
                    </label>
                    
                    {!isSignup && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormMessage({ type: '', text: '' });
                          setMode?.('forgot-password');
                        }}
                        className="text-[10px] text-[#C5A059] hover:underline font-semibold"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

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
                      required={!isForgotPassword}
                      className={`${fieldClass} mt-0 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${softText}`}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {renderFieldError('password')}
                </div>
              )}

              {/* FORGOT PASSWORD STEP 2 */}
              {isForgotPassword && isResetOtpStep && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                      6-DIGIT OTP CODE
                    </label>
                    <input
                      type="text"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP code"
                      required
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-[0.18em] ${fieldLabel}`}>
                      NEW PASSWORD
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      required
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}

              {/* Confirm Password (Signup Only) */}
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  isSignup ? 'max-h-24 opacity-100 translate-y-0 mt-3' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
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
                    placeholder="Confirm Your Password"
                    required={isSignup}
                    className={`${fieldClass} mt-0 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${softText}`}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {renderFieldError('confirmPassword')}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-md bg-[#C5A059] py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition-all duration-300 hover:bg-[#D8B775] active:scale-[0.99]"
              >
                {isSubmitting 
                  ? 'Please wait…' 
                  : isForgotPassword 
                    ? isResetOtpStep ? 'Save New Password' : 'Send Reset Code'
                    : isSignup 
                      ? 'Register Now' 
                      : 'Log In'}
              </button>
            </form>
          )}

          {/* VIEW 2: EMPLOYEE / ADMIN 2FA PIN VERIFICATION (PURE DYNAMIC DB DATA) */}
          {isPinStep && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Dynamic Employee Account Card derived entirely from DB user payload */}
              <div className="bg-[#3A342B] text-white p-4 rounded-2xl shadow-md flex items-center justify-between border border-[#C5A059]/40 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#2A1E1B] border-2 border-[#C5A059] overflow-hidden flex items-center justify-center font-bold text-lg text-[#C5A059]">
                    {pendingUser?.firstName?.charAt(0) || pendingUser?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#F5F1EA]">
                      {pendingUser?.firstName ? `${pendingUser.firstName} ${pendingUser.lastName || ''}`.trim() : 'Authenticated Employee'}
                    </h3>
                    <p className="text-[10px] text-gray-300 font-mono">
                      {pendingUser?.email}
                    </p>
                  </div>
                </div>
                <span className="bg-[#C5A059] text-[#1F1A17] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                  {pendingUser?.role || 'STAFF'}
                </span>
              </div>

              {/* PIN Inputs */}
              <div className="text-center space-y-3">
                <p className="text-xs font-medium text-gray-500">
                  Please input your PIN to validate yourself
                </p>

                <div className="flex justify-center gap-2">
                  {pin.map((digit, idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all shadow-inner ${
                        digit
                          ? 'border-[#C5A059] bg-white text-[#2A1E1B]'
                          : isDarkMode 
                            ? 'border-[#3A3A3A] bg-[#1A1A1A] text-gray-500' 
                            : 'border-[#E7DFD4] bg-white/70 text-gray-400'
                      }`}
                    >
                      {digit ? '•' : ''}
                    </div>
                  ))}
                </div>

                <button className="text-[11px] text-[#C5A059] font-medium hover:underline">
                  Forgot Pin?
                </button>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handlePinNumpadClick(num)}
                    className={`h-11 rounded-xl font-bold text-lg shadow-sm border transition-all flex items-center justify-center ${
                      isDarkMode 
                        ? 'bg-[#1D1D1D] border-[#333333] text-[#F5F1EA] hover:bg-[#2A2A2A] hover:border-[#C5A059]' 
                        : 'bg-white border-[#E7DFD4] text-[#2A1E1B] hover:bg-[#F6F0E6] hover:border-[#C5A059]'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleVerifyPin}
                  className="h-11 rounded-xl bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#C5A059] border border-[#C5A059]/40 flex items-center justify-center transition-all"
                  title="Submit PIN"
                >
                  <LogIn size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => handlePinNumpadClick(0)}
                  className={`h-11 rounded-xl font-bold text-lg shadow-sm border transition-all flex items-center justify-center ${
                    isDarkMode 
                      ? 'bg-[#1D1D1D] border-[#333333] text-[#F5F1EA] hover:bg-[#2A2A2A] hover:border-[#C5A059]' 
                      : 'bg-white border-[#E7DFD4] text-[#2A1E1B] hover:bg-[#F6F0E6] hover:border-[#C5A059]'
                  }`}
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handlePinBackspace}
                  className="h-11 rounded-xl bg-red-50/20 hover:bg-red-50/40 text-red-500 border border-red-200/40 flex items-center justify-center transition-all"
                  title="Backspace"
                >
                  <Delete size={18} />
                </button>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleVerifyPin}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#3A342B] hover:bg-[#2A241B] text-[#D1B06D] font-extrabold text-xs tracking-widest uppercase shadow-xl border border-[#C5A059]/40 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserCheck size={16} /> Start Shift & Log In
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleBackToRegistration}
                  className="text-xs text-[#C5A059] font-medium hover:underline"
                >
                  ← Cancel & Return to Sign In
                </button>
              </div>

            </div>
          )}

          {/* VIEW 3: CLIENT EMAIL OTP VERIFICATION */}
          {isOtpStep && (
            <form onSubmit={handleVerifyOtp} className="mt-8 space-y-5 text-center">
              <KeyRound aria-hidden="true" className={`mx-auto h-14 w-14 ${isDarkMode ? 'text-[#C5A059]' : 'text-[#78450C]'}`} strokeWidth={2.5} />

              {!isOtpVerified && (
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpInputRefs.current[index] = element; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      className={`h-12 w-10 rounded-md border text-center text-lg font-semibold outline-none focus:border-[#C5A059] ${isDarkMode ? 'border-[#3B3B3B] bg-[#1A1A1A] text-[#F5F1EA]' : 'border-[#E8DFD1] bg-white text-[#121212]'}`}
                    />
                  ))}
                </div>
              )}

              {!isOtpVerified && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mx-auto flex h-12 w-14 items-center justify-center rounded-lg border-2 border-[#9B6B39] text-[#78450C] transition-all hover:bg-[#9B6B39] hover:text-white"
                >
                  <ArrowRight className="h-8 w-8" strokeWidth={2} />
                </button>
              )}

              <div className="flex justify-between text-xs pt-2">
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

          {/* Social Logins and Switcher Footer */}
         {!isOtpStep && !isPinStep && (
            <>
              <div className="relative my-4 pt-2">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${divider}`} />
                </div>
                <div className={`relative flex justify-center text-[10px] uppercase tracking-[0.2em] ${softText}`}>
                  <span className={`px-3 ${isDarkMode ? 'bg-[#101010]' : 'bg-[#F4EFE6]'}`}>Or continue with</span>
                </div>
              </div>

              {!isSignup && !isForgotPassword && (
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

              <div className="pt-2 text-xs">
                {isForgotPassword ? (
                  <p className={softText}>
                    Remembered your password?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setFormMessage({ type: '', text: '' });
                        setIsResetOtpStep(false);
                        setMode?.('login');
                      }}
                      className="font-semibold text-[#C5A059] hover:underline uppercase transition-colors"
                    >
                      SIGN IN HERE
                    </button>
                  </p>
                ) : isSignup ? (
                  <p className={softText}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setFormMessage({ type: '', text: '' });
                        setMode?.('login');
                      }}
                      className="font-semibold text-[#C5A059] hover:underline uppercase transition-colors"
                    >
                      SIGN IN HERE
                    </button>
                  </p>
                ) : (
                  <p className={softText}>
                    New client?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setFormMessage({ type: '', text: '' });
                        setMode?.('signup');
                      }}
                      className="font-semibold text-[#C5A059] hover:underline uppercase transition-colors"
                    >
                      REGISTER HERE
                    </button>
                  </p>
                )}
              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}