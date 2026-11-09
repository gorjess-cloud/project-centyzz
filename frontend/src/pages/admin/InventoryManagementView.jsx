import {usePageFind} from '../../components/workspace/AdminWorkspaceContext';
import useSalonProfile from '../../hooks/useSalonProfile';
import AdminPageHeader from '../../components/workspace/AdminPageHeader';
import {adminWorkspaceRequest} from '../../api/admin-workspace';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { readJsonResponse } from '../../api/client';
import { 
  Search, 
  Plus, 
  AlertTriangle, 
  Trash2, 
  Printer, 
  X, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  FileText,
  RotateCcw,
  MinusCircle
} from 'lucide-react';

export default function InventoryManagementView({ showHeaderActions = true, currentUser }) {
  const salonProfile=useSalonProfile();
  const [toastMessage, setToastMessage] = useState('');
  const [mainTab, setMainTab] = useState('active');

  const [items, setItems] = useState([]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery,isHighlightSearch] = usePageFind();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [addItemTab, setAddItemTab] = useState('NEW');

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isPODocumentModalOpen, setIsPODocumentModalOpen] = useState(false);

  const [archiveTargetItem, setArchiveTargetItem] = useState(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [excludedPoSkus, setExcludedPoSkus] = useState([]);

  const [inventoryPreferences,setInventoryPreferences]=useState({lowStockThreshold:5,alertsEnabled:true});
  useEffect(()=>{let active=true;adminWorkspaceRequest(currentUser?.accessToken,'settings').then(config=>{if(active){setInventoryPreferences(config.inventory);setNewItemForm(form=>({...form,lowStockAlert:String(config.inventory.lowStockThreshold)}));}}).catch(()=>{});return()=>{active=false;};},[currentUser?.accessToken]);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    sku: '',
    category: 'Retail (For Sale)',
    unit: 'Pieces',
    initialQuantity: '0',
    lowStockAlert: '5',
    costPrice: '',
    retailPrice: '',
    supplier: '',
    note: ''
  });

  const [restockForm, setRestockForm] = useState({
    selectedSku: '',
    qtyToAdd: '0',
    note: ''
  });

  const [poOrderQty, setPoOrderQty] = useState({});

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const lowStockCount = items.filter(i => !i.isArchived && i.stock <= i.alertThreshold).length;

  const filteredItems = items.filter(i => {
    const matchesTab = mainTab === 'active' ? !i.isArchived : i.isArchived;
    const matchesCategory = categoryFilter === 'ALL' || i.category === categoryFilter;
    const matchesAvailability = 
      availabilityFilter === 'ALL' || 
      (availabilityFilter === 'LOW' && i.status === 'LOW STOCK') ||
      (availabilityFilter === 'IN' && i.status === 'IN STOCK');

    const matchesSearch = isHighlightSearch || i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesAvailability && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [savedOrder, setSavedOrder] = useState(null);
  const requests = useRef(new Map());
  const running = useRef(false);
  const token = currentUser?.accessToken;
  async function request(path = '', method = 'GET', body, actionPin) {
    if (!token) throw new Error('Sign in as an Admin to manage inventory.');
    const fingerprint = method + path + JSON.stringify(body ?? {});
    let key;
    if (method !== 'GET') {
      key = requests.current.get(fingerprint) ?? crypto.randomUUID();
      requests.current.set(fingerprint, key);
    }
    const response = await fetch('/api/admin/inventory' + path, {
      method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
        ...(key ? { 'Idempotency-Key': key, 'x-management-pin': actionPin } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const result = await readJsonResponse(response);
    if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(' ') : result.message || 'Inventory request failed.');
    if (key) requests.current.delete(fingerprint);
    return result;
  }
  async function load() {
    const result = await request();
    setItems(result);
    return result;
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    request().then(data => { if (active) setItems(data); })
      .catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  useEffect(() => { setCurrentPage(p => Math.min(p, totalPages)); }, [totalPages]);
  useEffect(() => {
    if (!items.some(i => !i.isArchived && i.sku === restockForm.selectedSku)) {
      setRestockForm(f => ({ ...f, selectedSku: items.find(i => !i.isArchived)?.sku ?? '' }));
    }
  }, [items]);
  const queue = task => { if (!running.current) { setPin(''); setPinError(''); setPending(task); } };
  async function confirmAction(e) {
    e.preventDefault();
    if (running.current || !pending) return;
    running.current = true; setBusy(true); setPinError('');
    let committed = false;
    try {
      const result = await request(pending.path, pending.method, pending.body, pin);
      committed = true;
      pending.done?.(result);
      setPending(null); setPin('');
      showToast(pending.message);
      try { await load(); setError(''); }
      catch { setError('Action saved. Refresh inventory to see the latest stock.'); }
    } catch(e) { if (!committed) setPinError(e.message); }
    finally { running.current = false; setBusy(false); setPin(''); }
  }
  const handleAddNewItem = e => {
    e.preventDefault();
    queue({ path:'',method:'POST',body:{ ...newItemForm,
      initialQuantity:Number(newItemForm.initialQuantity),lowStockAlert:Number(newItemForm.lowStockAlert),
      costPrice:Number(newItemForm.costPrice),retailPrice:Number(newItemForm.retailPrice) },
      message:'Inventory item saved.',done:() => {
        setIsAddItemModalOpen(false);
        setNewItemForm({name:'',sku:'',category:'Retail (For Sale)',unit:'Pieces',initialQuantity:'0',lowStockAlert:String(inventoryPreferences.lowStockThreshold),costPrice:'',retailPrice:'',supplier:'',note:''});
      } });
  };
  const handleRestockItem = e => {
    e.preventDefault();
    const item = items.find(i => i.sku === restockForm.selectedSku && !i.isArchived);
    if (!item) { setError('Choose an active inventory item.'); return; }
    queue({path:'/' + item.id + '/restock',method:'POST',body:{quantity:Number(restockForm.qtyToAdd),note:restockForm.note},
      message:'Stock updated.',done:() => {setIsAddItemModalOpen(false);setRestockForm(f => ({...f,qtyToAdd:'0',note:''}));} });
  };
  function changeState(item, state) {
    queue({path:'/' + item.id + (state === 'hide' ? '' : '/' + state),method:state === 'hide' ? 'DELETE' : 'PATCH',
      message: state === 'restore' ? 'Item restored.' : state === 'archive' ? 'Item archived.' : 'Item removed from archive.',
      done:() => {setArchiveTargetItem(null);setDeleteTargetItem(null);} });
  }
  function saveOrder() {
    queue({path:'/purchase-orders',method:'POST',body:{items:lowStockItemsList.map(i => ({id:i.id,quantity:poOrderQty[i.sku] ?? i.recommendedQty}))},
      message:'Purchase order saved. Receive delivered stock through Restock Item.',done:order => {
        setSavedOrder(order);setIsPOModalOpen(false);setIsPODocumentModalOpen(true);setExcludedPoSkus([]);setPoOrderQty({});
      } });
  }

  const handleExcludePoItem = (sku, name) => {
    setExcludedPoSkus([...excludedPoSkus, sku]);
    showToast(`Excluded ${name} from this Purchase Order`);
  };

  const lowStockItemsList = items.filter(i => !i.isArchived && i.status === 'LOW STOCK' && !excludedPoSkus.includes(i.sku));
  const poEstimatedTotal = lowStockItemsList.reduce((sum, item) => {
    const qty = poOrderQty[item.sku] ?? item.recommendedQty;
    return sum + (qty * item.unitCost);
  }, 0);

  const renderStatusBadge = (status) => {
    if (status === 'IN STOCK') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={10} /> IN STOCK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
        • LOW STOCK
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8 text-[#2A1E1B] font-sans">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar matching Schedule and Client views */}
      <AdminPageHeader title="Inventory Management" subtitle="Track salon stock levels, reorder alerts, and purchase orders" showHeaderActions={showHeaderActions}/>

      {loading && <p role="status">Loading inventory…</p>}
      {error && <div role="alert" className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-sm">{error} <button type="button" className="underline ml-3" onClick={() => {setLoading(true);load().then(() => setError('')).catch(e => setError(e.message)).finally(() => setLoading(false));}}>Refresh inventory</button></div>}
      {/* MAIN CONTAINER SQUARE */}
      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 sm:p-8 space-y-6">

        {/* Controls Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">All Inventory Items</h2>
              <span className="bg-[#2A1E1B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {filteredItems.length}
              </span>
            </div>

            {/* Active vs Archived Toggle */}
            <div className="flex items-center bg-[#F8F5F0] p-1 rounded-xl border border-[#E7DFD4] ml-2">
              <button
                onClick={() => { setMainTab('active'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mainTab === 'active' 
                    ? 'bg-[#2A1E1B] text-white shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Active Inventory
              </button>
              <button
                onClick={() => { setMainTab('archived'); setCurrentPage(1); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mainTab === 'archived' 
                    ? 'bg-[#2A1E1B] text-white shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Archived Bin
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search Item name or SKU..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if(!isHighlightSearch)setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all font-medium"
              />
            </div>

            {/* Action Button inside main card */}
            <button
              onClick={() => {
                setAddItemTab('NEW');
                setIsAddItemModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border border-[#C5A059]/40"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 pt-1">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] block">Categories</span>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#FFFDF8] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3.5 py-2 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"
            >
              <option value="ALL">All Categories</option>
              <option value="Retail (For Sale)">Retail (For Sale)</option>
              <option value="In Salon Use">In Salon Use</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174] block">Stock Availability</span>
            <select
              value={availabilityFilter}
              onChange={(e) => { setAvailabilityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#FFFDF8] border border-[#E7DFD4] text-[#2A1E1B] text-xs font-semibold px-3.5 py-2 rounded-xl outline-none cursor-pointer focus:border-[#C5A059]"
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">Low Stock</option>
              <option value="IN">In Stock</option>
            </select>
          </div>
        </div>

        {/* Low Stock Alert Box */}
        {mainTab === 'active' && inventoryPreferences.alertsEnabled && lowStockCount > 0 && (
          <div className="bg-[#FFFDF3] border border-[#EADDBF] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#2A1E1B]">
                  {lowStockCount} {lowStockCount === 1 ? 'product at or below' : 'products at or below'} minimum threshold
                </h3>
                <p className="text-[11px] text-[#8A8174] mt-0.5">
                  {items.filter(i => !i.isArchived && i.stock <= i.alertThreshold).slice(0,3).map(i => i.name).join(', ')}{lowStockCount > 3 ? ' +' + (lowStockCount - 3) + ' more' : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setExcludedPoSkus([]);
                setIsPOModalOpen(true);
              }}
              className="bg-[#675B4B] hover:bg-[#4A3F32] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 self-start sm:self-auto"
            >
              Create Purchase Order
            </button>
          </div>
        )}

        {/* Inventory Table */}
        <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFDF8] text-[10px] uppercase font-bold text-[#8A8174] tracking-wider border-b border-[#E7DFD4]">
                <th className="p-4 pl-6 w-10">

                </th>
                <th className="p-4">SKU / Item Code</th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4 text-center">Quantity in Stock</th>
                <th className="p-4 text-right">Unit Cost (PHP)</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7DFD4] text-xs font-sans">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#8A8174]">
                    {loading ? 'Loading inventory…' : error ? 'Inventory could not be loaded.' : mainTab === 'active' ? 'No active inventory items found. Add your first item to begin.' : 'Archived bin is empty.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4 pl-6">

                    </td>
                    <td className="p-4 font-bold text-[#2A1E1B]">{item.sku}</td>
                    <td className="p-4 font-bold text-[#2A1E1B]">{item.name}</td>
                    <td className="p-4">
                      <span className="bg-[#F8F5F0] text-[#5C5243] border border-[#E7DFD4] text-[10px] font-bold px-2.5 py-1 rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="font-bold text-[#2A1E1B] text-xs">{item.stock}</span>
                        {renderStatusBadge(item.status)}
                      </div>
                    </td>
                    <td className="p-4 text-right font-bold text-[#2A1E1B] text-xs">
                      ₱ {item.unitCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      {mainTab === 'active' ? (
                        <button
                          onClick={() => setArchiveTargetItem(item)}
                          className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Move to Archive"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => changeState(item, 'restore')}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                            title="Restore Item"
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                          <button
                            onClick={() => setDeleteTargetItem(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Remove from Archive"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8174] pt-1 gap-3">
          <span>Showing {paginatedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items</span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F8F5F0] transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold px-2 text-[#2A1E1B]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[#E7DFD4] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F8F5F0] transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL: ADD ITEM */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F9F8EF] rounded-[28px] border-2 border-[#B3A772] shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 text-[#443523]">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#4A3B2C]">Add Item</h2>
                <p className="text-xs text-[#8A8174] mt-0.5">Stock management</p>
              </div>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                <X size={20} />
              </button>
            </div>

            <div className="p-1 rounded-2xl flex items-center justify-between bg-[#EBE7DC]">
              <button
                type="button"
                onClick={() => setAddItemTab('RESTOCK')}
                className={`w-1/2 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  addItemTab === 'RESTOCK'
                    ? 'bg-[#60CBB3] text-white shadow-sm'
                    : 'text-[#5C5243] hover:text-[#2A1E1B]'
                }`}
              >
                &rarr; Restock Item
              </button>
              <button
                type="button"
                onClick={() => setAddItemTab('NEW')}
                className={`w-1/2 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                  addItemTab === 'NEW'
                    ? 'bg-[#B58D54] text-white shadow-sm'
                    : 'text-[#5C5243] hover:text-[#2A1E1B]'
                }`}
              >
                + New Item
              </button>
            </div>

            {addItemTab === 'NEW' && (
              <form onSubmit={handleAddNewItem} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-1">Product Name*</label>
                    <input id="inventory-field-1"
                      type="text"
                      required
                      placeholder="e.g. Moroccan Argan Shampoo"
                      value={newItemForm.name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-2">SKU*</label>
                    <input id="inventory-field-2"
                      type="text"
                      required
                      placeholder="e.g. MAS - 001"
                      value={newItemForm.sku}
                      onChange={(e) => setNewItemForm({ ...newItemForm, sku: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-3">Category*</label>
                    <select id="inventory-field-3"
                      value={newItemForm.category}
                      onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs font-semibold outline-none focus:border-[#2A1E1B]"
                    >
                      <option value="Retail (For Sale)">Retail (For Sale)</option>
                      <option value="In Salon Use">In Salon Use</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-4">Unit</label>
                    <select id="inventory-field-4"
                      value={newItemForm.unit}
                      onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs font-semibold outline-none focus:border-[#2A1E1B]"
                    >
                      <option value="Pieces">Pieces</option>
                      <option value="Bottles">Bottles</option>
                      <option value="Boxes">Boxes</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-5">Initial Quantity*</label>
                    <input id="inventory-field-5"
                      type="number" min="0" max="1000000" step="1"
                      required
                      value={newItemForm.initialQuantity}
                      onChange={(e) => setNewItemForm({ ...newItemForm, initialQuantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-6">Low-Stock Alert*</label>
                    <input id="inventory-field-6"
                      type="number" min="0" max="1000000" step="1"
                      required
                      value={newItemForm.lowStockAlert}
                      onChange={(e) => setNewItemForm({ ...newItemForm, lowStockAlert: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-7">Cost Price (₱)</label>
                    <input id="inventory-field-7"
                      type="number" required min="0" max="99999999.99" step="0.01"
                      placeholder="0.00"
                      value={newItemForm.costPrice}
                      onChange={(e) => setNewItemForm({ ...newItemForm, costPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-8">Retail Price (₱)</label>
                    <input id="inventory-field-8"
                      type="number" required min="0" max="99999999.99" step="0.01"
                      placeholder="0.00"
                      value={newItemForm.retailPrice}
                      onChange={(e) => setNewItemForm({ ...newItemForm, retailPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-9">Supplier</label>
                  <input id="inventory-field-9"
                    type="text"
                    placeholder="e.g. Beauty Pro Distributors"
                    value={newItemForm.supplier}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-10">Note (optional)</label>
                  <textarea id="inventory-field-10"
                    rows={2}
                    placeholder="Storage instructions, Expiry date, etc."
                    value={newItemForm.note}
                    onChange={(e) => setNewItemForm({ ...newItemForm, note: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B] resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="w-1/2 py-3 rounded-xl border border-[#A29883] bg-white text-xs font-bold text-[#5C5243] hover:bg-[#F6F4EF]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 rounded-xl bg-[#B58D54] hover:bg-[#9E7B3B] text-white text-xs font-bold transition-all shadow-md"
                  >
                    Confirm Adding
                  </button>
                </div>
              </form>
            )}

            {addItemTab === 'RESTOCK' && (
              <form onSubmit={handleRestockItem} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-11">Search Product</label>
                  <select id="inventory-field-11"
                    value={restockForm.selectedSku}
                    onChange={(e) => setRestockForm({ ...restockForm, selectedSku: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#38C69F] bg-white text-xs font-semibold outline-none focus:border-[#C5A059]"
                  >
                    {items.filter(i => !i.isArchived).map(i => (
                      <option key={i.sku} value={i.sku}>{i.name} ({i.sku}) — Current Stock: {i.stock}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-12">Qty to Add</label>
                    <input id="inventory-field-12"
                      type="number" min="1" max="1000000" step="1"
                      required
                      placeholder="1"
                      value={restockForm.qtyToAdd}
                      onChange={(e) => setRestockForm({ ...restockForm, qtyToAdd: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#38C69F] bg-white text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-13">New Total</label>
                    <input id="inventory-field-13"
                      type="text"
                      readOnly
                      value={(items.find(i => i.sku === restockForm.selectedSku)?.stock || 0) + (parseInt(restockForm.qtyToAdd) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-gray-100 text-xs font-bold text-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-14">Note (optional)</label>
                  <textarea id="inventory-field-14"
                    rows={3}
                    placeholder="e.g. Received from supplier, Batch #A24-09..."
                    value={restockForm.note}
                    onChange={(e) => setRestockForm({ ...restockForm, note: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#38C69F] bg-white text-xs outline-none focus:border-[#C5A059] resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="w-1/2 py-3 rounded-xl border border-[#A29883] bg-white text-xs font-bold text-[#5C5243] hover:bg-[#F6F4EF]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 rounded-xl bg-[#675B4B] hover:bg-[#4A3F32] text-white text-xs font-bold transition-all shadow-md"
                  >
                    Confirm Restock
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#F9F8EF] rounded-[28px] border-2 border-[#B3A772] shadow-2xl max-w-4xl w-full p-8 sm:p-10 space-y-6 text-[#443523] overflow-hidden">

            <div className="flex items-start justify-between border-b border-[#E7DFD4] pb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#4A3B2C]">Create Purchase Order</h2>
                <p className="text-xs text-[#8A8174] mt-0.5">{lowStockItemsList.length} items queued for reorder &bull; {new Date().toLocaleDateString()}</p>
              </div>
              <button onClick={() => setIsPOModalOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B] p-1">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-15">PO NUMBER:</label>
                <input id="inventory-field-15"
                  type="text"
                  readOnly
                  value="Assigned when saved"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#B3A772] bg-white font-bold text-[#2A1E1B]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1" htmlFor="inventory-field-16">REQUESTED BY:</label>
                <input id="inventory-field-16"
                  type="text"
                  readOnly
                  value={currentUser?.name || [currentUser?.firstName,currentUser?.lastName].filter(Boolean).join(' ') || 'Signed-in Admin'}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#B3A772] bg-white font-bold text-[#2A1E1B]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[#B3A772] overflow-hidden bg-white shadow-xs">
              <div className="bg-[#B8A97A] p-4 grid grid-cols-12 text-xs font-bold text-white uppercase tracking-wider">
                <span className="col-span-5">PRODUCT & RECOMMENDATION</span>
                <span className="col-span-2 text-center">ON-HAND</span>
                <span className="col-span-2 text-center">QTY TO ORDER</span>
                <span className="col-span-2 text-right">LINE TOTAL</span>
                <span className="col-span-1 text-center">REMOVE</span>
              </div>

              <div className="divide-y divide-[#E7DFD4] max-h-[300px] overflow-y-auto">
                {lowStockItemsList.length === 0 ? (
                  <div className="p-8 text-center text-[#8A8174] text-xs">
                    No items selected for this Purchase Order draft.
                  </div>
                ) : (
                  lowStockItemsList.map((item) => {
                    const qty = poOrderQty[item.sku] ?? item.recommendedQty;
                    const lineTotal = qty * item.unitCost;

                    return (
                      <div key={item.id} className="p-4 grid grid-cols-12 items-center text-xs font-sans">
                        <div className="col-span-5 space-y-1.5">
                          <p className="font-bold text-[#2A1E1B] text-xs">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFE3CD] text-[#C25E00]">
                              • LOW STOCK
                            </span>
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5F6F0] text-[#1E5C4E]">
                              Rec. Reorder: +{item.recommendedQty} units
                            </span>
                          </div>
                        </div>

                        <span className="col-span-2 text-center font-bold text-[#2A1E1B] text-xs">{item.stock}</span>

                        <div className="col-span-2 text-center">
                          <input
                            type="number" min="1" max="1000000" step="1" value={qty}
                            onChange={(e) => setPoOrderQty({ ...poOrderQty, [item.sku]: Number(e.target.value) })}
                            className="w-20 px-3 py-1.5 text-center rounded-xl border border-[#B3A772] font-bold text-xs outline-none focus:ring-2 focus:ring-[#B8A97A]"
                          />
                        </div>

                        <span className="col-span-2 text-right font-bold text-[#2A1E1B] text-xs">
                          ₱{lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleExcludePoItem(item.sku, item.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Exclude item from PO"
                          >
                            <MinusCircle size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-[#B8A97A] p-5 rounded-2xl flex items-center justify-between text-white shadow-xs">
              <div>
                <p className="text-[10px] text-white/90 uppercase font-bold tracking-wider">ESTIMATED TOTAL ORDER AMOUNT</p>
                <p className="text-xl font-bold tracking-tight mt-0.5">₱ {poEstimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-5 py-3 rounded-xl bg-white text-[#2A1E1B] font-bold text-xs hover:bg-[#F6F4EF] transition-all shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={lowStockItemsList.length === 0 || lowStockItemsList.some(i => !Number.isInteger(poOrderQty[i.sku] ?? i.recommendedQty) || (poOrderQty[i.sku] ?? i.recommendedQty) < 1 || (poOrderQty[i.sku] ?? i.recommendedQty) > 1000000)}
                  onClick={saveOrder}
                  className="px-6 py-3 rounded-xl bg-[#4A3F32] hover:bg-[#2A1E1B] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  Save Purchase Order
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PRINT PO DOCUMENT */}
      {isPODocumentModalOpen && createPortal(
        <div id="inventory-print-root" role="dialog" aria-modal="true" aria-label="Purchase order document" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <style>{`@media print {
  body > *:not(#inventory-print-root) { display: none !important; }
  #inventory-print-root { position: static !important; display: block !important; overflow: visible !important; padding: 0 !important; background: white !important; }
  #inventory-print-root > section { max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; }
  #inventory-print-root button { display: none !important; }
  #inventory-print-root tr { break-inside: avoid; }
}`}</style>
          <section className="bg-white rounded-2xl border border-[#E7DFD4] shadow-2xl max-w-3xl w-full p-8 my-8 text-[#2A1E1B] space-y-6">

            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-[#C5A059] h-5 w-5" />
                <h3 className="font-bold text-base">Purchase Order Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2A1E1B] text-white hover:bg-[#C5A059] text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer size={14} />
                  <span>Print PO</span>
                </button>
                <button onClick={() => setIsPODocumentModalOpen(false)} className="text-gray-400 hover:text-black p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="bg-[#FFFDF8] border border-[#E7DFD4] p-8 rounded-xl shadow-xs space-y-6 text-xs font-sans">

              <div className="flex justify-between items-start border-b-2 border-[#2A1E1B] pb-6">
                <div>
                  <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] tracking-wide">{salonProfile.salonName}</h1>
                  <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Hair & Beauty Studio</p>
                  <p className="text-[11px] text-[#8A8174] mt-1">{salonProfile.address}</p>
                  <p className="text-[11px] text-[#8A8174]">Phone: {salonProfile.phone}</p>
                </div>

                <div className="text-right">
                  <h2 className="text-xl font-bold tracking-wider text-[#2A1E1B]">PURCHASE ORDER</h2>
                  <p className="text-[11px] font-bold text-[#2A1E1B] mt-1">PO No: {savedOrder?.number}</p>
                  <p className="text-[11px] text-[#8A8174]">Date: {savedOrder && new Date(savedOrder.createdAt).toLocaleDateString()}</p>
                  <p className="text-[11px] text-[#8A8174]">Issued By: {savedOrder?.requestedBy}</p>
                </div>
              </div>

              <table className="w-full border-collapse border border-[#E7DFD4] text-xs">
                <thead>
                  <tr className="bg-[#2A1E1B] text-white text-[10px] uppercase font-bold">
                    <th className="p-2.5 text-center w-12">No.</th>
                    <th className="p-2.5 text-left">Item / SKU</th>
                    <th className="p-2.5 text-left">Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Unit Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD4] font-sans">
                  {(savedOrder?.items ?? []).map((item, idx) => {
                    const qty = item.quantity;
                    const total = qty * item.unitCost;

                    return (
                      <tr key={item.id}>
                        <td className="p-2.5 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <p className="font-bold">{item.sku}</p>
                          <span className="text-[9px] text-gray-500">{item.unit}</span>
                        </td>
                        <td className="p-2.5 font-bold">{item.name}</td>
                        <td className="p-2.5 text-center font-bold">{qty}</td>
                        <td className="p-2.5 text-right font-bold text-[#2A1E1B]">₱ {item.unitCost.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-bold text-[#2A1E1B]">₱ {total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end pt-2">
                <div className="bg-[#F8F5F0] p-4 rounded-xl border border-[#E7DFD4] space-y-2 text-xs w-64">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-[#2A1E1B]">₱ {(savedOrder?.total ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold text-base text-[#2A1E1B]">
                    <span>TOTAL:</span>
                    <span>₱ {(savedOrder?.total ?? 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

          </section>
        </div>, document.body
      )}

      {pending && <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"><form onSubmit={confirmAction} role="dialog" aria-modal="true" aria-labelledby="inventory-pin-title" className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4"><h2 id="inventory-pin-title" className="font-bold">Confirm inventory action</h2><label className="block text-sm">Management PIN<input autoFocus required type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} disabled={busy} className="block border rounded-xl w-full p-3 mt-2" /></label>{pinError && <p role="alert" className="text-rose-700 text-sm">{pinError}</p>}<div className="flex gap-3 justify-end"><button type="button" disabled={busy} onClick={() => {setPending(null);setPin('');}}>Cancel</button><button type="submit" disabled={busy} className="bg-[#8B5E3C] text-white rounded-xl px-4 py-2">{busy ? 'Saving…' : 'Confirm'}</button></div></form></div>}
      {/* MODAL: ARCHIVE ITEM */}
      {archiveTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E7DFD4] shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <h3 className="font-bold text-base">Confirm Archive Item</h3>
              <button onClick={() => setArchiveTargetItem(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to move <strong className="text-[#2A1E1B]">{archiveTargetItem.name}</strong> ({archiveTargetItem.sku}) to the Archived Bin?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveTargetItem(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => changeState(archiveTargetItem, 'archive')}
                className="px-5 py-2 rounded-xl bg-[#2A1E1B] text-white text-xs font-bold hover:bg-[#C5A059] transition-all"
              >
                Move to Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMANENT DELETE */}
      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-rose-200 shadow-2xl max-w-md w-full p-6 space-y-5 text-[#2A1E1B]">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <h3 className="font-bold text-base text-rose-700">Remove Archived Item</h3>
              <button onClick={() => setDeleteTargetItem(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Remove <strong className="text-[#2A1E1B]">{deleteTargetItem.name}</strong> from this list? Stock movements and history will be retained.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetItem(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => changeState(deleteTargetItem, 'hide')}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
              >
                Remove from Archive
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}