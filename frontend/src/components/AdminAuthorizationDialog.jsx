import { useRef, useState } from "react";
import { Lock } from "lucide-react";
export default function AdminAuthorizationDialog({
  action,
  onConfirm,
  onClose,
  title="Admin Authorization",
}) {
  const [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const running = useRef(false);
  async function submit(e) {
    e.preventDefault();
    if (running.current) return;
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter your six-digit management PIN.");
      return;
    }
    running.current = true;
    setBusy(true);
    setError("");
    try {
      await onConfirm(pin);
    } catch (e) {
      setError(e.message || "Unable to confirm this action.");
    } finally {
      setPin("");
      setBusy(false);
      running.current = false;
    }
  }
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-authorize-title"
        className="w-full max-w-sm space-y-5 rounded-3xl border border-[#E9E4D8] bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E9DCB3] bg-[#FFFDF3] text-[#B4833F]">
          <Lock size={24} />
        </div>
        <div>
          <h2
            id="admin-authorize-title"
            className="text-base font-bold text-[#2A1E1B]"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs text-[#8A8174]">{action}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <input
            aria-label="Management PIN"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            minLength={6}
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="••••••"
            value={pin}
            disabled={busy}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="w-full rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] px-4 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none focus:border-[#C5A059]"
          />
          {error && (
            <p role="alert" className="text-xs text-rose-700">
              {error}
            </p>
          )}
          <p className="text-[10px] text-[#8A8174]">
            Your management PIN is verified against your account.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="flex-1 rounded-xl bg-[#EFECE6] px-4 py-2.5 text-xs font-bold text-[#5C524B] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-xl bg-[#4A3928] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : "Confirm PIN"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
