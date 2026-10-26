import { useState } from 'react';
import { api } from '../api/client.js';

export default function FirstManagementSetupModal({ user, onComplete, onLogout }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '',
    phoneNumber: '', newPassword: '', confirmPassword: '', newPin: '', confirmPin: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (name) => (e) => setForm((current) => ({ ...current, [name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.newPin !== form.confirmPin) return setError('PINs do not match.');
    if (!/^\d{6}$/.test(form.newPin)) return setError('PIN must contain six digits.');
    setSaving(true);
    try {
      const result = await api.completeManagementSetup(user.accessToken, {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(), phoneNumber: form.phoneNumber.trim(),
        newPassword: form.newPassword, newPin: form.newPin,
      });
      if (!result.data?.accessToken || !result.data?.user) throw new Error('Setup was not completed.');
      onComplete(result.data.user, result.data.accessToken);
    } catch (err) {
      setError(err.message || 'Unable to complete account setup.');
    } finally { setSaving(false); }
  };
  const fields = [
    ['firstName', 'First name', 'text', 'given-name'],
    ['lastName', 'Last name', 'text', 'family-name'],
    ['phoneNumber', 'Phone number', 'tel', 'tel'],
    ['newPassword', 'New password', 'password', 'new-password'],
    ['confirmPassword', 'Confirm new password', 'password', 'new-password'],
    ['newPin', 'New six-digit PIN', 'password', 'off'],
    ['confirmPin', 'Confirm new PIN', 'password', 'off'],
  ];
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="first-login-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A1410]/50 p-4 backdrop-blur-md">
      <form onSubmit={submit} className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-[#29221e] shadow-2xl space-y-4">
        <h2 id="first-login-title" className="text-xl font-bold">Complete your management account setup</h2>
        <p className="text-sm text-gray-600">Required once before using the {user.role} portal. Replace your temporary credentials and enter your contact details.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map(([name, label, type, autoComplete]) => (
            <label key={name} className="block text-sm font-medium">
              {label}
              <input required type={type} autoComplete={autoComplete}
                minLength={name === 'newPassword' ? 12 : undefined}
                maxLength={name.toLowerCase().includes('pin') ? 6 : undefined}
                inputMode={name.toLowerCase().includes('pin') ? 'numeric' : undefined}
                pattern={name.toLowerCase().includes('pin') ? '[0-9]{6}' : undefined}
                value={form[name]} onChange={update(name)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-600">Password: 12+ characters, uppercase and lowercase letters, a number and symbol. Choose a different PIN and password from the temporary ones.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-[#3A342B] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">
            {saving ? 'Saving…' : 'Save and enter portal'}
          </button>
          <button type="button" onClick={onLogout} className="text-sm text-gray-600 underline">Log out</button>
        </div>
      </form>
    </div>
  );
}
