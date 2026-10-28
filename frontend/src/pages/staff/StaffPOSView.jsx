import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Bell, Plus, Minus, ChevronDown, ChevronRight, Scissors, Flower2, Hand, ShoppingBag, Trash2, X, Moon, Sun } from 'lucide-react';
import { Toast, useToast, Badge, EmptyState, ConfirmModal, peso, card, input } from '../../components/staff/ui';
import { PaymentMethods, SplitPayment, CashModal, QrModal, ReceiptSummary, DemoReceiptModal } from '../../components/staff/payment';
import { useWorkspaceTheme } from '../../components/workspace/WorkspaceContext';
import { api } from '../../api/client';
import { getServiceImage } from '../../utils/serviceImages';

const GROUPS = ['All Categories', 'Hair Services', 'Nail Services', 'Skin & Lashes'];
const SUBCATEGORIES = [
  ['All-services', 'Cuts & Styling', 'Coloring & Highlights', 'Treatments', 'Packages'],
  ['All-services', 'Manicures', 'Pedicures', 'Nail Art', 'Packages'],
  ['All-services', 'Facials', 'Lash Extensions', 'Skin Treatments', 'Packages'],
];
const categoryIndex = (name = '') => /nail|mani|pedi/i.test(name) ? 1 : /skin|lash|facial/i.test(name) ? 2 : 0;
const serviceSubcategory = (name = '', group) => {
  if (/package|bundle/i.test(name)) return 4;
  if (group === 1) {
    if (/nail art|art design|nail design/i.test(name)) return 3;
    if (/pedi/i.test(name)) return 2;
    return 1;
  }
  if (group === 2) {
    if (/lash|extension|lift|tint|brow/i.test(name)) return 2;
    if (/facial|face|peel|cleanse/i.test(name)) return 1;
    return 3;
  }
  return /color|highlight|balayage/i.test(name) ? 2 : /cut|style|blowout/i.test(name) ? 1 : 3;
};
const serviceIcon = [Scissors, Hand, Flower2];
const makeCustomerId = () => `Customer${new Date().toISOString().slice(0, 10).replace(/-/g, '')}0001`;

function CartPanel({ cart, subtotal, customerId, editable, onChange, onRemove, onClear, footer }) {
  const count = cart.reduce((n, i) => n + i.qty, 0);
  return (
    <aside className={`${card} flex min-h-96 w-full shrink-0 flex-col p-5 md:min-h-0 md:w-64 xl:w-80`}>
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

export default function StaffPOSView() {
  const { theme, toggleTheme } = useWorkspaceTheme();
  const isDark = theme === 'dark';
  const [group, setGroup] = useState(-1);
  const [menu, setMenu] = useState(false);
  const [sub, setSub] = useState(0);
  const [q, setQ] = useState('');
  const [isServiceSearchOpen, setIsServiceSearchOpen] = useState(false);
  const [areNotificationsOpen, setAreNotificationsOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState('');
  const [toast, say] = useToast();
  const chipsRef = useRef(null);
  const menuRef = useRef(null);
  const [customerId] = useState(makeCustomerId);
  const [view, setView] = useState('pos'); // 'pos' | 'methods' | 'split'
  const [modal, setModal] = useState(null); // { type: 'cash'|'qr', amount, split }
  const [splitPayments, setSplitPayments] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [demoReceipt, setDemoReceipt] = useState(null);

  useEffect(() => {
    let current = true;
    api.getServices()
      .then((categories) => {
        if (!current) return;
        const catalog = (Array.isArray(categories) ? categories : []).flatMap((category) =>
          (category.services || []).map((service) => ({
            id: service.id,
            group: categoryIndex(category.category),
            sub: serviceSubcategory(service.name, categoryIndex(category.category)),
            name: service.name,
            image: getServiceImage(service.name, category.category),
            price: Number(service.price),
            icon: serviceIcon[categoryIndex(category.category)],
          })),
        );
        setServices(catalog);
      })
      .catch((error) => { if (current) setServicesError(error.message); })
      .finally(() => { if (current) setServicesLoading(false); });
    return () => { current = false; };
  }, []);

  // close the group dropdown when clicking elsewhere
  useEffect(() => {
    if (!menu) return;
    const h = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const shown = services.filter((s) => (group === -1 || s.group === group) && (sub === 0 || s.sub === sub) && s.name.toLowerCase().includes(q.toLowerCase()));
  const qtyOf = (id) => cart.find((c) => c.id === id)?.qty || 0;
  const change = (item, d) => setCart((c) => {
    const found = c.find((x) => x.id === item.id);
    if (!found) return d > 0 ? [...c, { ...item, qty: 1 }] : c;
    return c.map((x) => (x.id === item.id ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0);
  });
  const remove = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  // Demo receipt only: this does not record a sale or collect funds.
  const finalize = (payments, discount = 0) => {
    const sale = {
      id: `DEMO-${Date.now()}`,
      customer: customerId,
      items: cart.map(({ id, name, price, qty }) => ({ id, name, price, qty })),
      subtotal, discount, total: subtotal - discount,
      payments, paidAt: new Date().toISOString(), isDemo: true,
    };
    setDemoReceipt(sale);
    say('Demo checkout complete — no money was collected.');
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
    <div className="fade-in flex flex-col gap-4 md:h-[calc(100vh-2.5rem)] md:flex-row">
      {view === 'methods' && <PaymentMethods total={subtotal} onBack={() => setView('pos')} onSelect={selectMethod} />}
      {view === 'split' && <SplitPayment total={subtotal} payments={splitPayments} onBack={() => setView('methods')} onCharge={(m, amt) => setModal({ type: m, amount: amt, split: true })} />}
      {view === 'pos' && (
        <section className="min-w-0 flex-1 md:overflow-y-auto md:pr-1">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div ref={menuRef} className="relative">
              <p className="text-xs font-bold text-[#8B5E3C]">Services</p>
              <button onClick={() => setMenu(!menu)} aria-haspopup="listbox" aria-expanded={menu} className="flex items-center gap-2 rounded-lg text-2xl font-bold text-[#2A1E1B]">{GROUPS[group + 1]} <ChevronDown size={22} className={`transition-transform ${menu ? 'rotate-180' : ''}`} /></button>
              {menu && (
                <div role="listbox" className="pop-in absolute z-20 mt-1 w-52 overflow-hidden rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] shadow-lg">
                  {GROUPS.map((g, i) => <button key={g} role="option" aria-selected={i - 1 === group} onClick={() => { setGroup(i - 1); setSub(0); setMenu(false); }} className={`block w-full px-4 py-2.5 text-left text-xs font-bold text-[#443523] hover:bg-[#F6F0E6] ${i - 1 === group ? 'bg-[#F6F0E6]' : ''}`}>{g}</button>)}
                </div>
              )}
            </div>
            <div className="workspace-actions relative">
              <button type="button" className="workspace-action" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={isDark} onClick={toggleTheme}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button type="button" className="workspace-action" aria-label="Search services" title="Search services" aria-expanded={isServiceSearchOpen} onClick={() => { setIsServiceSearchOpen((open) => !open); setAreNotificationsOpen(false); }}>
                <Search size={16} />
              </button>
              <button type="button" className="workspace-action" aria-label="Notifications" title="Notifications" aria-expanded={areNotificationsOpen} onClick={() => { setAreNotificationsOpen((open) => !open); setIsServiceSearchOpen(false); }}>
                <Bell size={16} />
              </button>
              {areNotificationsOpen && <section className="workspace-action-panel" aria-label="Notifications"><div className="workspace-panel-heading"><strong>Notifications</strong><button type="button" className="workspace-panel-close" aria-label="Close notifications" onClick={() => setAreNotificationsOpen(false)}><X size={15} /></button></div><p className="workspace-no-notifications">No notifications to show.</p></section>}
            </div>
          </div>

          {isServiceSearchOpen && (
            <div className="relative mb-4 w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-3 text-[#8A8174]" />
              <input autoFocus aria-label="Search services" className={`${input} py-2.5 pl-9`} placeholder="Search services" value={q} onChange={(e) => setQ(e.target.value)} />
              {q && <button aria-label="Clear search" onClick={() => setQ('')} className="absolute right-2.5 top-2.5 rounded-full p-0.5 text-[#8A8174] hover:text-[#2A1E1B]"><X size={14} /></button>}
            </div>
          )}

          <div className="mb-5 flex items-center gap-2">
            <div ref={chipsRef} className="flex flex-1 gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {(group === -1 ? ['All-services'] : SUBCATEGORIES[group]).map((s, i) => (
                <button key={s} onClick={() => setSub(i)} aria-pressed={sub === i} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition ${sub === i ? 'bg-[#4A3928] text-white shadow-md' : 'border border-[#E7DFD4] bg-[#FFFDF8] text-[#443523] hover:bg-[#F6F0E6]'}`}>{s}</button>
              ))}
            </div>
            <button aria-label="Scroll categories" onClick={() => chipsRef.current?.scrollBy({ left: 200, behavior: 'smooth' })} className="shrink-0 rounded-full p-2 text-[#2A1E1B] hover:bg-[#F6F0E6] active:scale-90"><ChevronRight size={22} /></button>
          </div>

          <div className="grid grid-cols-2 gap-3 pb-2 lg:gap-4 xl:grid-cols-3">
            {servicesLoading && <div className="col-span-full rounded-xl border border-[#E7DFD4] bg-white p-5 text-center text-xs text-[#8A8174]">Loading services…</div>}
            {servicesError && <div role="alert" className="col-span-full rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">Unable to load services: {servicesError}</div>}
            {!servicesLoading && !servicesError && !services.length && <div className="col-span-full rounded-xl border border-[#E7DFD4] bg-white p-5 text-center text-xs text-[#8A8174]">No active services are available.</div>}
            {!servicesLoading && !servicesError && services.length > 0 && shown.length === 0 && <div className="col-span-full"><EmptyState icon={Search} title="No services found" hint="Try a different search or category." /></div>}
            {shown.map((s) => {
              const Icon = s.icon; const n = qtyOf(s.id);
              return (
                <button key={s.id} onClick={() => change(s, 1)} aria-label={`Add ${s.name}, ${peso(s.price)}`}
                  className={`${card} group relative flex h-44 touch-manipulation flex-col p-4 text-left transition hover:-translate-y-0.5 hover:border-[#C5A059] hover:shadow-md active:scale-95 lg:h-52 ${n > 0 ? 'border-[#C5A059] ring-2 ring-[#C5A059]/30' : ''}`}>
                  <span className="pr-7 text-sm font-bold text-[#4A3928]">{s.name}</span>
                  {n > 0 && <span className="pop-in absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#4A3928] px-1.5 text-[11px] font-bold text-white">{n}</span>}
                  <span className="m-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#F6F0E6] text-[#4A3928] transition group-hover:bg-[#EBDBC8] lg:h-20 lg:w-20">{s.image ? <img src={s.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Icon size={36} strokeWidth={1.5} />}</span>
                  <span className="self-end rounded-full bg-[#F6F0E6] px-3 py-1 text-sm font-bold text-[#8B5E3C]">₱ {s.price.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {cart.length > 0 && (
        <CartPanel cart={cart} subtotal={subtotal} customerId={customerId} editable={view === 'pos'}
          onChange={change} onRemove={remove} onClear={() => setConfirmClear(true)}
          footer={view === 'pos' && (
            <button disabled={!cart.length} onClick={() => setView('methods')} className="mt-4 rounded-full bg-[#4A3928] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#2A1E1B] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40">Proceed to Checkout</button>
          )} />
      )}

      {modal?.type === 'cash' && <CashModal items={cart} subtotal={subtotal} amount={modal.amount} allowDiscount={!modal.split} onConfirm={onCash} onCancel={() => setModal(null)} />}
      {modal?.type === 'qr' && <QrModal items={cart} subtotal={subtotal} amount={modal.amount} onConfirm={onQr} onCancel={() => setModal(null)} />}
      {confirmClear && <ConfirmModal message="Clear all services from the current cart?" danger onCancel={() => setConfirmClear(false)} onConfirm={() => { setCart([]); setConfirmClear(false); }} />}
      {demoReceipt && <DemoReceiptModal sale={demoReceipt} onClose={() => setDemoReceipt(null)} />}
      <Toast msg={toast} />
    </div>
  );
}
