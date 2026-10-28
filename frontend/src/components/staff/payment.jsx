import { useEffect,useState } from 'react';
import {staffPosRequest} from '../../api/staff-pos';
import { ArrowLeft, Banknote, QrCode, Split, Printer } from 'lucide-react';
import { peso, input, btn, btnGhost, card, Modal } from './ui';

const cents = (n) => Math.round((Number(n) || 0) * 100);
const toNum = (s) => (s === '' || s == null ? 0 : Number(String(s).replace(/,/g, '')) || 0);

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
export function CashModal({ items, subtotal, amount, allowDiscount = true, onConfirm, onCancel,busy=false,token }) {
  const [pay, setPay] = useState('');
  const [discountType,setDiscountType]=useState('NONE'),[promoCode,setPromoCode]=useState(''),[quoteResult,setQuoteResult]=useState(null);
  const cartKey=JSON.stringify(items.map(item=>({serviceId:item.id,quantity:item.qty})));
  const code=discountType==='PROMO'?promoCode.trim().toUpperCase():'';
  const selectionKey=JSON.stringify([cartKey,discountType,code,token]);
  const current=quoteResult?.key===selectionKey?quoteResult:null;
  const quoted=current?.data;
  const discount=allowDiscount&&discountType!=='NONE'?(quoted?.discount??0):0;
  const priceMatches=!quoted||cents(quoted.subtotal)===cents(subtotal);
  const verified=!allowDiscount||discountType==='NONE'||(Boolean(quoted)&&priceMatches);
  const due=amount-discount,tendered=toNum(pay),enough=verified&&cents(tendered)>=cents(due)&&due>0,change=enough?tendered-due:0;
  useEffect(()=>{
    if(!allowDiscount||!['PWD','SENIOR'].includes(discountType))return;
    let active=true;
    staffPosRequest(token,'quote',{method:'POST',body:{items:JSON.parse(cartKey),discountType}})
      .then(data=>{if(active)setQuoteResult({key:selectionKey,data});})
      .catch(error=>{if(active)setQuoteResult({key:selectionKey,error:error.message});});
    return()=>{active=false;};
  },[allowDiscount,cartKey,discountType,selectionKey,token]);
  const verifyPromo=async()=>{
    setQuoteResult({key:selectionKey,loading:true});
    try{const data=await staffPosRequest(token,'quote',{method:'POST',body:{items:JSON.parse(cartKey),discountType:'PROMO',promoCode:code}});setQuoteResult({key:selectionKey,data});}
    catch(error){setQuoteResult({key:selectionKey,error:error.message});}
  };
  const submit=e=>{e.preventDefault();if(enough&&!busy)onConfirm({discount,discountType:allowDiscount?discountType:'NONE',promoCode:allowDiscount?code:'',amount:due,tendered,change});};


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
          {allowDiscount&&<div className="space-y-3">
            <Field label="Discount"><select className={input} value={discountType} disabled={busy} onChange={e=>{setDiscountType(e.target.value);setPromoCode('');setQuoteResult(null);}}><option value="NONE">No discount</option><option value="PWD">PWD · 20%</option><option value="SENIOR">Senior Citizen · 20%</option><option value="PROMO">Promo code</option></select></Field>
            {discountType==='PROMO'&&<Field label="Promo code"><div className="flex gap-2"><input className={input} aria-label="Promo code" maxLength={50} placeholder="Enter code from Services" value={promoCode} onChange={e=>{setPromoCode(e.target.value.toUpperCase());setQuoteResult(null);}}/><button type="button" className={btnGhost} disabled={!code||busy||current?.loading} onClick={verifyPromo}>{current?.loading?'Checking…':'Verify'}</button></div></Field>}
            {current?.error&&<p role="alert" className="text-xs text-red-700">{current.error}</p>}
            {!priceMatches&&<p role="alert" className="text-xs text-red-700">Service prices changed. Cancel and refresh your cart before collecting payment.</p>}
            {quoted&&priceMatches&&<p role="status" className="rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">{quoted.label} applied: {peso(quoted.discount)}</p>}
            {['PWD','SENIOR'].includes(discountType)&&!current&&<p role="status" className="text-xs text-[#8A8174]">Calculating discount…</p>}
            <p className="text-[10px] text-[#8A8174]">One discount per sale. PWD, Senior Citizen and promo codes cannot be combined.</p>
          </div>}
          <Field label="Change"><input readOnly className={input} value={peso(change)} /></Field>
          {pay !== '' && !enough && <p className="text-[11px] font-bold text-rose-600">Short by {peso(Math.max(0, due - tendered))}</p>}
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button type="submit" disabled={!enough||busy} className={btn}>Proceed</button>
            <button type="button" className={btnGhost} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- QR Ph modal ---------- */
// Record an externally received QR payment only after the cashier explicitly verifies it.
export function QrModal({items,subtotal,amount,onConfirm,onCancel,busy=false,demo=false}){
 const [reference,setReference]=useState(''),[verified,setVerified]=useState(false);
 if(demo)return <Modal title="Demo QR Ph · No payment" onClose={onCancel}><p>Do not scan or send money</p><p>{peso(amount)}</p><button className={btn} onClick={()=>onConfirm({amount})}>Simulate payment</button></Modal>;
 return <Modal title="Check Out · External QR Payment" onClose={onCancel}><div className={split2}><div className={half}><ServicesList items={items}/><ReceiptSummary subtotal={subtotal} discount={0}/></div><form className={half} onSubmit={e=>{e.preventDefault();if(verified&&reference.trim())onConfirm({amount,reference:reference.trim(),verified:true});}}><p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Use the salon’s actual QR or payment terminal. This screen records a payment you have verified; it does not charge the customer or generate a payment QR.</p><p className="text-xl font-bold">{peso(amount)}</p><Field label="Receipt / transaction reference"><input className={input} required maxLength={100} value={reference} onChange={e=>setReference(e.target.value)}/></Field><label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/>I confirmed receipt of this payment in the salon’s wallet or terminal.</label><button className={btn} disabled={busy||!verified||!reference.trim()}>Record confirmed payment</button><button type="button" className={btnGhost} disabled={busy} onClick={onCancel}>Cancel</button></form></div></Modal>;
}

function PaymentMethodIcon({icon:Icon}){return <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F6F0E6] text-[#4A3928] transition group-hover:bg-[#EBDBC8]"><Icon size={28} strokeWidth={1.5} /></span>;}

/* ---------- Payment Methods screen ---------- */
export function PaymentMethods({ total, onBack, onSelect, demo=false }) {
  const tile = `${card} group flex items-center gap-4 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-md active:scale-95`;
  return (
    <section className="fade-in min-w-0 flex-1">
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 rounded-lg text-xs font-bold text-[#443523] hover:text-[#2A1E1B]"><ArrowLeft size={14} /> Back</button>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#2A1E1B]">Payment Methods</h1>
          <p className="text-xs text-[#8A8174]">{demo?'Demo checkout — no money collected':'Record a received payment'}</p>
        </div>
        <p className="rounded-full bg-[#EBDBC8] px-4 py-1.5 text-xs font-bold text-[#8C6D3B]">Total due {peso(total)}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button className={tile} onClick={() => onSelect('cash')}><PaymentMethodIcon icon={Banknote} /><span><span className="block text-base font-bold text-[#2A1E1B]">Cash</span><span className="text-[11px] text-[#8A8174]">Enter amount received, get change</span></span></button>
        <button className={tile} onClick={() => onSelect('qr')}><PaymentMethodIcon icon={QrCode} /><span><span className="block text-base font-bold text-[#2A1E1B]">QR Ph</span><span className="text-[11px] text-[#8A8174]">Verify payment received on the salon’s actual QR</span></span></button>
        <button className={tile} onClick={() => onSelect('split')}><PaymentMethodIcon icon={Split} /><span><span className="block text-base font-bold text-[#2A1E1B]">Split</span><span className="text-[11px] text-[#8A8174]">Pay part in cash, the rest by QR Ph</span></span></button>
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
