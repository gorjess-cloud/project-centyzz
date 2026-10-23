import { useState } from 'react';
import { Search, Package, AlertTriangle, ShoppingBag, Droplets } from 'lucide-react';
import { Header, Badge, StatCard, EmptyState, card, input } from '../../components/staff/ui';

const FILTERS = ['All', 'Low stock', 'Retail (For Sale)', 'In Salon Use'];

export default function StaffInventoryView() {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [items] = useState([
    { sku: 'OLP-003', name: 'Olaplex No. 3 Hair Perfector', category: 'Retail (For Sale)', stock: 2, alert: 5 },
    { sku: 'HBS-100', name: 'Hydra Boost Serum', category: 'Retail (For Sale)', stock: 3, alert: 5 },
    { sku: 'CDV-020', name: 'Color Developer 20V', category: 'In Salon Use', stock: 4, alert: 5 },
    { sku: 'PTS-250', name: 'Purple Toning Shampoo', category: 'Retail (For Sale)', stock: 18, alert: 5 },
    { sku: 'NGP-BLS', name: 'Nail Gel Polish — Blush Pink', category: 'In Salon Use', stock: 7, alert: 5 },
    { sku: 'MAS-001', name: 'Moroccan Argan Shampoo', category: 'In Salon Use', stock: 12, alert: 5 },
  ]);

  const isLow = (i) => i.stock <= i.alert;
  const lowCount = items.filter(isLow).length;

  const rows = items
    .filter((i) => (i.name + i.sku).toLowerCase().includes(q.toLowerCase()))
    .filter((i) => (filter === 'All' ? true : filter === 'Low stock' ? isLow(i) : i.category === filter))
    .sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.stock - b.stock);

  return (
    <div className="fade-in">
      <Header title="Inventory" subtitle="View current stock levels">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-[#8A8174]" />
          <input aria-label="Search inventory" className={`${input} pl-9`} placeholder="Search item or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Header>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Package} label="Total items" value={items.length} />
        <StatCard icon={AlertTriangle} label="Low stock" value={lowCount} tone={lowCount ? 'bad' : 'neutral'} />
        <StatCard icon={ShoppingBag} label="Retail" value={items.filter((i) => i.category.startsWith('Retail')).length} />
        <StatCard icon={Droplets} label="In salon use" value={items.filter((i) => i.category === 'In Salon Use').length} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${filter === f ? 'bg-[#4A3928] text-white shadow-md' : 'border border-[#E7DFD4] bg-[#FFFDF8] text-[#443523] hover:bg-[#F6F0E6]'}`}>{f}</button>
        ))}
      </div>

      <div className={`${card} overflow-x-auto`}>
        {rows.length === 0 ? (
          <EmptyState icon={Package} title="No items match" hint="Try another search or filter." />
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#E7DFD4] bg-[#F8F5F0]/60 text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">
                <th className="p-4 pl-6">SKU</th><th className="p-4">Item</th><th className="p-4">Category</th><th className="p-4 pr-6">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD4]">
              {rows.map((i) => {
                const low = isLow(i);
                const pct = Math.min(100, (i.stock / Math.max(i.alert * 3, i.stock)) * 100);
                return (
                  <tr key={i.sku} className="transition hover:bg-[#FDFBF7]">
                    <td className="p-4 pl-6 font-mono font-bold text-[#8B5E3C]">{i.sku}</td>
                    <td className="p-4 font-bold text-[#2A1E1B]">{i.name}</td>
                    <td className="p-4"><Badge>{i.category}</Badge></td>
                    <td className="w-56 p-4 pr-6">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-bold text-[#2A1E1B]">{i.stock} left</span>
                        <Badge tone={low ? 'bad' : 'ok'}>{low ? 'LOW STOCK' : 'IN STOCK'}</Badge>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#E7DFD4]"><div className={`h-full rounded-full transition-all duration-500 ${low ? 'bg-rose-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
