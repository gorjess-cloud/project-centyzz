import { useState } from 'react';
import { ArrowLeft, Banknote, QrCode, Split, Printer } from 'lucide-react';
import { peso, input, btn, btnGhost, card, Modal } from './ui';

const cents = (n) => Math.round((Number(n) || 0) * 100);
export const toNum = (s) => (s === '' || s == null ? 0 : Number(String(s).replace(/,/g, '')) || 0);

/* ---------- shared bits ---------- */

export function ReceiptSummary({ subtotal, discount = 0 }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#E7DFD4]/70 text-xs text-[#443523]">
      <div className="space-y-1.5 p-4">
        <div className="flex justify-between"><span>Subtotal</span><span>{peso(subtotal)}</span></div>
        <div className="flex justify-between"><span>Discount</span><span>{peso(discount)}</span></div>
      </div>
      <div className="mx-4 border-t border-dashed border-[#8A8174]/50" />
      <div className="flex justify-between bg-[#E7DFD4] p-4 text-sm font-bold text-[#2A1E1B]">
        <span>Total</span><span>{peso(Math.max(0, subtotal - discount))}</span>
      </div>
    </div>
  );
}

function ServicesList({ items }) {
  return (
    <div className="max-h-48 flex-1 overflow-y-auto rounded-xl border border-[#E7DFD4] bg-white p-3 sm:max-h-none">
      <p className="mb-2 text-xs font-bold text-[#2A1E1B]">Services</p>
      {items.map((i) => (
        <div key={i.id} className="mb-2 flex justify-between gap-2 text-[11px] text-[#443523]">
          <span>{i.name}{i.qty > 1 ? ` ×${i.qty}` : ''}</span>
          <span className="font-bold">{peso(i.price * i.qty)}</span>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold text-[#2A1E1B]">{label}</span>
      {children}
    </label>
  );
}

const split2 = 'flex flex-col gap-4 sm:flex-row';
const half = 'flex flex-col gap-3 sm:w-1/2';

/* ---------- Cash modal ---------- */
// amount: what this cash payment must cover. allowDiscount: only for full (non-split) payments.
export function CashModal({ items, subtotal, amount, allowDiscount = true, onConfirm, onCancel }) {
  const [pay, setPay] = useState('');
  const [disc, setDisc] = useState('');
  const discount = allowDiscount ? Math.min(Math.max(toNum(disc), 0), amount) : 0;
  const due = amount - discount;
  const tendered = toNum(pay);
  const enough = cents(tendered) >= cents(due) && due > 0;
  const change = enough ? tendered - due : 0;
  const submit = (e) => { e.preventDefault(); if (enough) onConfirm({ discount, amount: due, tendered, change }); };

  return (
    <Modal title="Check Out · Cash" onClose={onCancel}>
      <form onSubmit={submit} className={split2}>
        <div className={half}>
          <ServicesList items={items} />
          <ReceiptSummary subtotal={subtotal} discount={discount} />
        </div>
        <div className={half}>
          <Field label="Total Amount"><input readOnly className={input} value={peso(due)} /></Field>
          <Field label="Payment Amount">
            <input autoFocus inputMode="decimal" className={input} placeholder="₱ 0.00" value={pay}
              onChange={(e) => setPay(e.target.value.replace(/[^\d.]/g, ''))} />
          </Field>
          {allowDiscount && (
            <Field label="Discount">
              <input inputMode="decimal" className={input} placeholder="₱ 0.00" value={disc}
                onChange={(e) => setDisc(e.target.value.replace(/[^\d.]/g, ''))} />
            </Field>
          )}
          <Field label="Charge"><input readOnly className={input} value={peso(change)} /></Field>
          {pay !== '' && !enough && <p className="text-[11px] font-bold text-rose-600">Short by {peso(Math.max(0, due - tendered))}</p>}
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button type="submit" disabled={!enough} className={btn}>Proceed</button>
            <button type="button" className={btnGhost} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- QR Ph modal ---------- */
// Deliberately NOT a scannable payment code: this is only a POS walkthrough.
function QrPlaceholder() {
  return (
    <div role="img" aria-label="Demo QR Ph only, not a payable QR code"
      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl bg-[#F6F0E6] text-[#8B5E3C]">
      <QrCode size={52} strokeWidth={1.2} />
      <strong className="text-base tracking-widest">DEMO ONLY</strong>
      <span className="text-center text-[10px]">Do not scan or send money</span>
    </div>
  );
}

export function QrModal({ items, subtotal, amount, onConfirm, onCancel }) {
  return (
    <Modal title="Check Out · QR Ph" onClose={onCancel}>
      <div className={split2}>
        <div className={half}>
          <ServicesList items={items} />
          <ReceiptSummary subtotal={subtotal} discount={0} />
        </div>
        <div className={`${half} items-center`}>
          <div className="aspect-square w-full max-w-48 rounded-xl border border-[#E7DFD4] bg-white p-2"><QrPlaceholder /></div>
          <p className="text-xs text-[#8A8174]">Simulated amount (no payment)</p>
          <p className="-mt-2 text-2xl font-bold text-[#2A1E1B]">{peso(amount)}</p>
          <div className="mt-auto flex w-full flex-col gap-2 pt-2">
            <button className={btn} onClick={() => onConfirm({ amount })}>Simulate payment</button>
            <button className={btnGhost} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Payment Methods screen ---------- */
export function PaymentMethods({ total, onBack, onSelect }) {
  const tile = `${card} group flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-md active:scale-95`;
  const Icon = ({ i: I }) => <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F6F0E6] text-[#4A3928] transition group-hover:bg-[#EBDBC8]"><I size={28} strokeWidth={1.5} /></span>;
  return (
    <section className="fade-in min-w-0 flex-1">
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 rounded-lg text-xs font-bold text-[#443523] hover:text-[#2A1E1B]"><ArrowLeft size={14} /> Back</button>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#2A1E1B]">Payment Methods</h1>
          <p className="text-xs text-[#8A8174]">Demo checkout — no money collected</p>
        </div>
        <p className="rounded-full bg-[#EBDBC8] px-4 py-1.5 text-xs font-bold text-[#8C6D3B]">Total due {peso(total)}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button className={tile} onClick={() => onSelect('cash')}><Icon i={Banknote} /><span><span className="block text-base font-bold text-[#2A1E1B]">Cash</span><span className="text-[11px] text-[#8A8174]">Enter amount received, get change</span></span></button>
        <button className={tile} onClick={() => onSelect('qr')}><Icon i={QrCode} /><span><span className="block text-base font-bold text-[#2A1E1B]">QR Ph</span><span className="text-[11px] text-[#8A8174]">Simulated QR; no real code</span></span></button>
        <button className={tile} onClick={() => onSelect('split')}><Icon i={Split} /><span><span className="block text-base font-bold text-[#2A1E1B]">Split</span><span className="text-[11px] text-[#8A8174]">Pay part in cash, the rest by QR Ph</span></span></button>
      </div>
    </section>
  );
}

/* ---------- Split Payment screen ---------- */
// payments: already-collected portions [{method, amount}]. Cash amount is typed; QR Ph takes the remainder.
export function SplitPayment({ total, payments, onBack, onCharge }) {
  const [cashStr, setCashStr] = useState('');
  const paidCash = payments.find((p) => p.method === 'Cash');
  const paidQr = payments.find((p) => p.method === 'QR Ph');
  const locked = payments.length > 0;
  const cashAmt = paidCash ? paidCash.amount : Math.min(toNum(cashStr), total);
  const qrAmt = paidQr ? paidQr.amount : Math.max(0, total - cashAmt);
  const paidSum = payments.reduce((t, p) => t + p.amount, 0);
  const pct = total > 0 ? Math.min(100, (paidSum / total) * 100) : 0;

  const row = (icon, label, amount, paid, key, editable) => (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <span className="flex w-36 items-center gap-2 text-xs font-bold text-[#443523]">{icon}{label}</span>
      {editable && !locked ? (
        <input inputMode="decimal" aria-label="Cash portion" className={`${input} w-36`} placeholder="₱ 0.00" value={cashStr}
          onChange={(e) => setCashStr(e.target.value.replace(/[^\d.]/g, ''))} />
      ) : (
        <input readOnly aria-label={`${label} portion`} className={`${input} w-36`} value={peso(amount)} />
      )}
      <button disabled={paid || amount <= 0} className={btn} onClick={() => onCharge(key, amount)}>{paid ? 'Paid ✓' : 'Charge'}</button>
    </div>
  );

  return (
    <section className="fade-in min-w-0 flex-1">
      <button onClick={onBack} disabled={locked} className="mb-4 flex items-center gap-1.5 rounded-lg text-xs font-bold text-[#443523] hover:text-[#2A1E1B] disabled:opacity-40"><ArrowLeft size={14} /> Back</button>
      <h1 className="text-2xl font-bold text-[#2A1E1B]">Split Payment</h1>
      <p className="mb-5 text-xs text-[#8A8174]">Enter the cash portion. The remainder goes to QR Ph.</p>

      <div className={`${card} mb-4 p-4`}>
        <div className="mb-2 flex justify-between text-xs"><span className="text-[#8A8174]">Collected</span><span className="font-bold text-[#2A1E1B]">{peso(paidSum)} / {peso(total)}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[#E7DFD4]"><div className="h-full rounded-full bg-[#C5A059] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className={`${card} divide-y divide-[#E7DFD4] px-5 py-1`}>
        {row(<Banknote size={18} />, 'Cash', cashAmt, !!paidCash, 'cash', true)}
        {row(<QrCode size={18} />, 'QR Ph', qrAmt, !!paidQr, 'qr', false)}
      </div>
    </section>
  );
}

/* ---------- Post-checkout demonstration receipt ---------- */
export function DemoReceiptModal({ sale, onClose }) {
  return (
    <Modal title="Demo Checkout Receipt" onClose={onClose} size="max-w-lg">
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .centyzz-demo-print, .centyzz-demo-print * { visibility: visible !important; }
        .centyzz-demo-print { position: absolute !important; inset: 0 auto auto 0 !important; width: 100% !important; padding: 24px !important; color: black !important; background: white !important; }
      }`}</style>
      <section className="centyzz-demo-print rounded-xl border border-dashed border-[#D8C8B0] bg-[#FFFCF5] p-5 text-[#2A1E1B]">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-extrabold tracking-wide">CENTY'ZZ</h3>
          <p className="text-[11px]">Hair & Beauty · Demo Receipt</p>
          <p className="mt-2 text-sm font-extrabold text-[#9A5D21]">DEMO — NOT A PROOF OF PAYMENT</p>
          <p className="text-[11px]">No payment was received. Not a fiscal receipt.</p>
        </div>
        <div className="mb-3 space-y-1 border-y border-[#D8C8B0] py-3 text-xs">
          <div className="flex justify-between gap-3"><span>Reference</span><strong>{sale.id}</strong></div>
          <div className="flex justify-between gap-3"><span>Date / Time</span><span>{new Date(sale.paidAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</span></div>
          <div className="flex justify-between gap-3"><span>Customer</span><span>{sale.customer}</span></div>
        </div>
        <p className="mb-2 text-xs font-bold">Items</p>
        <div className="space-y-2 text-xs">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-3">
              <span>{item.name} ×{item.qty}</span>
              <strong>{peso(item.price * item.qty)}</strong>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1 border-t border-[#D8C8B0] pt-3 text-xs">
          <div className="flex justify-between"><span>Subtotal</span><span>{peso(sale.subtotal)}</span></div>
          <div className="flex justify-between"><span>Demo discount</span><span>{peso(sale.discount)}</span></div>
          <div className="flex justify-between text-base font-extrabold"><span>DEMO TOTAL</span><span>{peso(sale.total)}</span></div>
        </div>
        <div className="mt-4 border-t border-[#D8C8B0] pt-3 text-xs">
          <p className="mb-2 font-bold">Simulated payment breakdown</p>
          {sale.payments.map((payment, index) => (
            <div key={index} className="flex justify-between"><span>{payment.method} (demo)</span><span>{peso(payment.amount)}</span></div>
          ))}
          {sale.payments.filter((payment) => payment.method === 'Cash').map((payment, index) => (
            <div key={`cash-${index}`} className="mt-1 text-[11px] text-[#8A8174]">Tendered: {peso(payment.tendered)} · Change: {peso(payment.change)}</div>
          ))}
        </div>
        <p className="mt-5 text-center text-[10px] font-semibold uppercase tracking-widest">Simulation only · No database sale recorded</p>
      </section>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={`${btn} flex flex-1 items-center justify-center gap-2`} onClick={() => window.print()}><Printer size={15} /> Print demo receipt</button>
        <button type="button" className={`${btnGhost} flex-1`} onClick={onClose}>Close receipt</button>
      </div>
    </Modal>
  );
}
