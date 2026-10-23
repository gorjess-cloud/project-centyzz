import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Minus, ChevronDown, ChevronRight, Scissors, Paintbrush, Sparkles, Wind, User, Flower2, Hand, Gem, ShoppingBag, Trash2, X } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';
import { PaymentMethods, SplitPayment, CashModal, QrModal, ReceiptSummary } from '../../components/staff/payment';

const GROUPS = ['Hair Services', 'Nail Services', 'Skin & Lashes'];
const SUBS = ['All-services', 'Cuts & Styling', 'Coloring & Highlights', 'Treatments', 'Packages'];
const SERVICES = [
  { id: 1, group: 0, sub: 1, name: 'Haircut', price: 99, icon: Scissors },
  { id: 2, group: 0, sub: 2, name: 'Hair Color Basic', price: 599, icon: Paintbrush },
  { id: 3, group: 0, sub: 3, name: 'Brazilian', price: 799, icon: Wind },
  { id: 4, group: 0, sub: 3, name: 'Botox', price: 999, icon: Sparkles },
  { id: 5, group: 0, sub: 3, name: 'Rebond', price: 999, icon: Wind },
  { id: 6, group: 0, sub: 2, name: 'Balayage', price: 1999, icon: User },
  { id: 7, group: 0, sub: 4, name: 'Cut + Color Package', price: 1499, icon: Gem },
  { id: 8, group: 1, sub: 3, name: 'Gel Manicure', price: 450, icon: Hand },
  { id: 9, group: 1, sub: 3, name: 'Pedicure', price: 400, icon: Hand },
  { id: 10, group: 2, sub: 3, name: 'Facial', price: 799, icon: Flower2 },
];
const makeCustomerId = () => `Customer${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0001`;

function CartPanel({ cart, subtotal, customerId, editable, onChange, onRemove, onClear, footer }) {
  const count = cart.reduce((n, i) => n + i.qty, 0);
  return (
    <aside className={`${card} flex min-h-96 w-full shrink-0 flex-col p-5 sm:min-h-0 sm:w-72 lg:w-80`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#2A1E1B]">Current Cart {count > 0 && <Badge tone="gold">{count}</Badge>}</h2>
          <p className="mt-1 text-[11px] text-[#8A8174]">{customerId}</p>
        </div>
        {editable && cart.length > 0 && (
          <button onClick={onClear} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#8A8174] transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={12} /> Clear</button>
        )}
      </div>

      <ul className="mt-4 flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {cart.length === 0 && <li><EmptyState icon={ShoppingBag} title="Cart is empty" hint="Tap a service to add it." /></li>}
        {cart.map((i) => (
          <li key={i.id} className="rounded-xl bg-[#F8F5F0] p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-[#2A1E1B]">{i.name}</p>
              {editable && <button aria-label={`Remove ${i.name}`} onClick={() => onRemove(i.id)} className="rounded-full p-1 text-[#8A8174] transition hover:bg-rose-50 hover:text-rose-600"><X size={13} /></button>}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#8A8174]">{peso(i.price)} each</span>
              {editable ? (
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#2A1E1B]">
                  <button aria-label={`Decrease ${i.name}`} onClick={() => onChange(i, -1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E7DFD4] text-[#443523] transition hover:bg-[#d9cfbf] active:scale-90"><Minus size={13} /></button>
                  <span className="w-4 text-center">{i.qty}</span>
                  <button aria-label={`Increase ${i.name}`} onClick={() => onChange(i, 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4A3928] text-white transition hover:bg-[#2A1E1B] active:scale-90"><Plus size={13} /></button>
                </div>
              ) : <span className="text-xs font-bold text-[#443523]">×{i.qty}</span>}
            </div>
            <p className="mt-1.5 text-right text-sm font-bold text-[#8B5E3C]">{peso(i.price * i.qty)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4"><ReceiptSummary subtotal={subtotal} discount={0} /></div>
      {footer}
    </aside>
  );
}

export default function StaffPOSView({ onSale }) {
  const [group, setGroup] = useState(0);
  const [menu, setMenu] = useState(false);
  const [sub, setSub] = useState(0);
  const [q, setQ] = useState('');
  const [cart, setCart] = useState([]);
  const [toast, say] = useToast();
  const chipsRef = useRef(null);
  const menuRef = useRef(null);
  const [customerId] = useState(makeCustomerId);
  const [view, setView] = useState('pos'); // 'pos' | 'methods' | 'split'
  const [modal, setModal] = useState(null); // { type: 'cash'|'qr', amount, split }
  const [splitPayments, setSplitPayments] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);

  // close the group dropdown when clicking elsewhere
  useEffect(() => {
    if (!menu) return;
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const shown = SERVICES.filter((s) => s.group === group && (sub === 0 || s.sub === sub) && s.name.toLowerCase().includes(q.toLowerCase()));
  const qtyOf = (id) => cart.find((c) => c.id === id)?.qty || 0;
  const change = (item, d) => setCart((c) => {
    const found = c.find((x) => x.id === item.id);
    if (!found) return d > 0 ? [...c, { ...item, qty: 1 }] : c;
    return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0);
  });
  const remove = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  // Records the sale, clears the cart and returns to the POS screen.
  const finalize = (payments, discount = 0) => {
    const sale = {
      id: `SALE${Date.now()}`,
      customer: customerId,
      items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      subtotal, discount, total: subtotal - discount,
      payments, paidAt: new Date().toISOString(),
    };
    onSale?.(sale); // hook up to your backend / sales store here
    say(`Payment received: ${peso(sale.total)}`);
    setCart([]); setSplitPayments([]); setModal(null); setView('pos');
  };

  const selectMethod = (m) => {
    if (m === 'split') setView('split');
    else setModal({ type: m, amount: subtotal, split: false });
  };
  const collect = (p) => {
    const all = [...splitPayments, p];
    const paid = all.reduce((t, x) => t + Math.round(x.amount * 100), 0);
    setModal(null);
    if (paid >= Math.round(subtotal * 100)) finalize(all);
    else setSplitPayments(all);
  };
  const onCash = ({ discount, amount, tendered, change }) => {
    if (!modal.split) return finalize([{ method: 'Cash', amount, tendered, change }], discount);
    collect({ method: 'Cash', amount, tendered, change });
  };
  const onQr = ({ amount }) => {
    if (!modal.split) return finalize([{ method: 'QR Ph', amount }]);
    collect({ method: 'QR Ph', amount });
  };

  return (
    <div className="fade-in flex flex-col gap-4 sm:h-[calc(100vh-2.5rem)] sm:flex-row">
      {view === 'methods' && <PaymentMethods total={subtotal} onBack={() => setView('pos')} onSelect={selectMethod} />}
      {view === 'split' && <SplitPayment total={subtotal} payments={splitPayments} onBack={() => setView('methods')} onCharge={(m, amt) => setModal({ type: m, amount: amt, split: true })} />}
      {view === 'pos' && (
        <section className="min-w-0 flex-1 sm:overflow-y-auto sm:pr-1">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div ref={menuRef} className="relative">
              <p className="text-xs font-bold text-[#8B5E3C]">Services</p>
              <button onClick={() => setMenu(!menu)} aria-haspopup="listbox" aria-expanded={menu} className="flex items-center gap-2 rounded-lg text-2xl font-bold text-[#2A1E1B]">{GROUPS[group]} <ChevronDown size={22} className={`transition-transform ${menu ? 'rotate-180' : ''}`} /></button>
              {menu && (
                <div role="listbox" className="pop-in absolute z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] shadow-lg">
                  {GROUPS.map((g, i) => <button key={g} role="option" aria-selected={i === group} onClick={() => { setGroup(i); setSub(0); setMenu(false); }} className={`block w-full px-4 py-2.5 text-left text-xs font-bold text-[#443523] hover:bg-[#F6F0E6] ${i === group ? 'bg-[#F6F0E6]' : ''}`}>{g}</button>)}
                </div>
              )}
            </div>
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-3 text-[#8A8174]" />
              <input aria-label="Search services" className={`${input} py-2.5 pl-9`} placeholder="Search services" value={q} onChange={(e) => setQ(e.target.value)} />
              {q && <button aria-label="Clear search" onClick={() => setQ('')} className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-[#8A8174] hover:text-[#2A1E1B]"><X size={14} /></button>}
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2">
            <div ref={chipsRef} className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {SUBS.map((s, i) => (
                <button key={s} onClick={() => setSub(i)} aria-pressed={sub === i} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${sub === i ? 'bg-[#4A3928] text-white shadow-md' : 'border border-[#E7DFD4] bg-[#FFFDF8] text-[#443523] hover:bg-[#F6F0E6]'}`}>{s}</button>
              ))}
            </div>
            <button aria-label="Scroll categories" onClick={() => chipsRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="shrink-0 rounded-full p-2 text-[#2A1E1B] hover:bg-[#F6F0E6] active:scale-90"><ChevronRight size={22} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2 lg:gap-4 xl:grid-cols-3">
            {shown.length === 0 && <div className="col-span-full"><EmptyState icon={Search} title="No services found" hint="Try a different search or category." /></div>}
            {shown.map((s) => {
              const Icon = s.icon; const n = qtyOf(s.id);
              return (
                <button key={s.id} onClick={() => change(s, 1)} aria-label={`Add ${s.name}, ${peso(s.price)}`}
                  className={`${card} group relative flex h-44 touch-manipulation flex-col p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-md active:scale-95 lg:h-52 ${n > 0 ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30' : ''}`}>
                  <span className="pr-7 text-sm font-bold text-[#4A3928]">{s.name}</span>
                  {n > 0 && <span className="pop-in absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#4A3928] px-1.5 text-[11px] font-bold text-white">{n}</span>}
                  <span className="m-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F6F0E6] text-[#4A3928] transition group-hover:bg-[#EBDBC8] lg:h-20 lg:w-20"><Icon size={36} strokeWidth={1.5} /></span>
                  <span className="self-end rounded-full bg-[#F6F0E6] px-3 py-1 text-sm font-bold text-[#8B5E3C]">₱ {s.price.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <CartPanel cart={cart} subtotal={subtotal} customerId={customerId} editable={view === 'pos'}
        onChange={change} onRemove={remove} onClear={() => setConfirmClear(true)}
        footer={view === 'pos' && (
          <button disabled={!cart.length} onClick={() => setView('methods')} className="mt-4 rounded-full bg-[#4A3928] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">Proceed to Checkout</button>
        )} />

      {modal?.type === 'cash' && <CashModal items={cart} subtotal={subtotal} amount={modal.amount} allowDiscount={!modal.split} onConfirm={onCash} onCancel={() => setModal(null)} />}
      {modal?.type === 'qr' && <QrModal items={cart} subtotal={subtotal} amount={modal.amount} onConfirm={onQr} onCancel={() => setModal(null)} />}
      {confirmClear && <ConfirmModal message="Clear all services from the current cart?" danger onCancel={() => setConfirmClear(false)} onConfirm={() => { setCart([]); setConfirmClear(false); }} />}
      <Toast msg={toast} />
    </div>
  );
}
