import { ArrowLeft, KeyRound, Mail } from 'lucide-react';

export default function ForgotPinPage({ isDarkMode = false }) {
  return <section className={`mx-auto my-10 w-full max-w-lg rounded-2xl border p-6 sm:p-8 ${isDarkMode ? 'border-[#51493B] bg-[#211F1B] text-[#F5F1EA]' : 'border-[#E7DFD4] bg-white text-[#2A1E1B]'}`}>
    <KeyRound size={30} className="mb-4 text-[#8B5E3C]"/>
    <h1 className="text-2xl font-bold">Forgot your management PIN?</h1>
    <p className="mt-3 text-sm leading-6">Your PIN is separate from your password. An Admin can send a secure reset link to your account’s registered email.</p>
    <ol className="my-6 list-decimal space-y-3 pl-5 text-sm leading-6">
      <li>Ask an Admin to open <strong>Users</strong>, find your account and choose <strong>Reset PIN Email</strong>.</li>
      <li>Open the Centyzz email on this PC, then choose your new six-digit PIN and confirm it.</li>
      <li>Sign in again with your password and new PIN. The email link expires in 15 minutes and works once.</li>
    </ol>
    <p className="flex items-start gap-2 rounded-xl bg-[#C5A059]/10 p-3 text-xs leading-5"><Mail size={16} className="mt-0.5 shrink-0"/>Check your spam folder too. If the link has expired or your account still needs first-time setup, contact your Admin for assistance.</p>
    <a href="/?page=auth" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#4A3928] px-5 py-3 text-sm font-semibold text-white"><ArrowLeft size={16}/>Back to sign in</a>
  </section>;
}
