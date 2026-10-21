import { useState } from 'react';
import { 
  Bell, 
  Search, 
  Moon, 
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

export default function InventoryManagementView() {
  const [toastMessage, setToastMessage] = useState('');
  const [mainTab, setMainTab] = useState('active');

  const [items, setItems] = useState([
    { id: '1', sku: 'OLP-003', name: 'Olaplex No. 3 Hair Perfector', category: 'Retail (For Sale)', stock: 2, unitCost: 350.00, alertThreshold: 5, recommendedQty: 15, status: 'LOW STOCK', isArchived: false },
    { id: '2', sku: 'HBS-100', name: 'Hydra Boost Serum', category: 'Retail (For Sale)', stock: 3, unitCost: 350.00, alertThreshold: 5, recommendedQty: 20, status: 'LOW STOCK', isArchived: false },
    { id: '3', sku: 'CDV-020', name: 'Color Developer 20V', category: 'Retail (For Sale)', stock: 4, unitCost: 350.00, alertThreshold: 5, recommendedQty: 18, status: 'LOW STOCK', isArchived: false },
    { id: '4', sku: 'KTS-500', name: 'Keratin Treatment Solution', category: 'Retail (For Sale)', stock: 1, unitCost: 350.00, alertThreshold: 5, recommendedQty: 12, status: 'LOW STOCK', isArchived: false },
    { id: '5', sku: 'PTS-250', name: 'Purple Toning Shampoo', category: 'Retail (For Sale)', stock: 18, unitCost: 350.00, alertThreshold: 5, recommendedQty: 25, status: 'IN STOCK', isArchived: false },
    { id: '6', sku: 'NGP-BLS', name: 'Nail Gel Polish — Blush Pink', category: 'In Salon Use', stock: 7, unitCost: 350.00, alertThreshold: 5, recommendedQty: 10, status: 'IN STOCK', isArchived: false },
    { id: '7', sku: 'MAS-001', name: 'Moroccan Argan Shampoo', category: 'In Salon Use', stock: 12, unitCost: 280.00, alertThreshold: 5, recommendedQty: 15, status: 'IN STOCK', isArchived: false },
    { id: '8', sku: 'SLF-102', name: 'Sulfate-Free Conditioner', category: 'Retail (For Sale)', stock: 15, unitCost: 310.00, alertThreshold: 5, recommendedQty: 20, status: 'IN STOCK', isArchived: true }
  ]);

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [addItemTab, setAddItemTab] = useState('NEW');

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isPODocumentModalOpen, setIsPODocumentModalOpen] = useState(false);

  const [archiveTargetItem, setArchiveTargetItem] = useState(null);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [excludedPoSkus, setExcludedPoSkus] = useState([]);

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
    selectedSku: 'OLP-003',
    qtyToAdd: '0',
    note: ''
  });

  const [poOrderQty, setPoOrderQty] = useState({
    'OLP-003': 13,
    'HBS-100': 20,
    'CDV-020': 16,
    'KTS-500': 19
  });

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

    const matchesSearch = 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesCategory && matchesAvailability && matchesSearch;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newItemForm.name || !newItemForm.sku) return;

    const initialQtyNum = parseInt(newItemForm.initialQuantity) || 0;
    const thresholdNum = parseInt(newItemForm.lowStockAlert) || 5;

    let computedStatus = initialQtyNum <= thresholdNum ? 'LOW STOCK' : 'IN STOCK';

    const itemToAdd = {
      id: String(Date.now()),
      sku: newItemForm.sku,
      name: newItemForm.name,
      category: newItemForm.category,
      stock: initialQtyNum,
      unitCost: parseFloat(newItemForm.costPrice) || 350.00,
      alertThreshold: thresholdNum,
      recommendedQty: 15,
      status: computedStatus,
      isArchived: false
    };

    setItems([itemToAdd, ...items]);
    setIsAddItemModalOpen(false);
    showToast(`Added new inventory item "${newItemForm.name}"`);
    setNewItemForm({ name: '', sku: '', category: 'Retail (For Sale)', unit: 'Pieces', initialQuantity: '0', lowStockAlert: '5', costPrice: '', retailPrice: '', supplier: '', note: '' });
  };

  const handleRestockItem = (e) => {
    e.preventDefault();
    const addQty = parseInt(restockForm.qtyToAdd) || 0;
    if (addQty <= 0) return;

    setItems(items.map(item => {
      if (item.sku === restockForm.selectedSku) {
        const updatedStock = item.stock + addQty;
        const updatedStatus = updatedStock <= item.alertThreshold ? 'LOW STOCK' : 'IN STOCK';

        return { ...item, stock: updatedStock, status: updatedStatus };
      }
      return item;
    }));

    setIsAddItemModalOpen(false);
    showToast(`Successfully restocked ${addQty} units for SKU ${restockForm.selectedSku}`);
  };

  const handleExcludePoItem = (sku, name) => {
    setExcludedPoSkus([...excludedPoSkus, sku]);
    showToast(`Excluded ${name} from this Purchase Order`);
  };

  const lowStockItemsList = items.filter(i => !i.isArchived && i.status === 'LOW STOCK' && !excludedPoSkus.includes(i.sku));
  const poEstimatedTotal = lowStockItemsList.reduce((sum, item) => {
    const qty = poOrderQty[item.sku] || 10;
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
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">Inventory Management</h1>
          <p className="mt-0.5 text-xs text-[#8A8174] truncate">
            Track salon stock levels, reorder alerts, and purchase orders
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button className="p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Moon size={16} />
          </button>
          <button className="p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Search size={16} />
          </button>
          <button className="relative p-2.5 rounded-full border border-[#E7DFD4] bg-white text-[#2A1E1B] hover:bg-[#F6F0E6] transition-colors">
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#C5A059] rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </header>

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
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
        {mainTab === 'active' && lowStockCount > 0 && (
          <div className="bg-[#FFFDF3] border border-[#EADDBF] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#2A1E1B]">
                  {lowStockCount} products below minimum threshold
                </h3>
                <p className="text-[11px] text-[#8A8174] mt-0.5">
                  Hydra Boost Serum, Olaplex No. 3 Hair Perfector, Color Developer 20V +{lowStockCount - 3} more
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
                  <input type="checkbox" className="rounded border-gray-300 text-[#8B5E3C] focus:ring-0 cursor-pointer" />
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
                    {mainTab === 'active' ? 'No active inventory items found.' : 'Archived bin is empty.'}
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-4 pl-6">
                      <input type="checkbox" className="rounded border-gray-300 text-[#8B5E3C] focus:ring-0 cursor-pointer" />
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
                            onClick={() => {
                              setItems(items.map(i => i.id === item.id ? { ...i, isArchived: false } : i));
                              showToast(`Restored "${item.name}" to Active Inventory`);
                            }}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                            title="Restore Item"
                          >
                            <RotateCcw size={14} /> Restore
                          </button>
                          <button
                            onClick={() => setDeleteTargetItem(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Delete Permanently"
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Product Name*</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Moroccan Argan Shampoo"
                      value={newItemForm.name}
                      onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">SKU*</label>
                    <input
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Category*</label>
                    <select
                      value={newItemForm.category}
                      onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs font-semibold outline-none focus:border-[#2A1E1B]"
                    >
                      <option value="Retail (For Sale)">Retail (For Sale)</option>
                      <option value="In Salon Use">In Salon Use</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Unit</label>
                    <select
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Initial Quantity*</label>
                    <input
                      type="number"
                      required
                      value={newItemForm.initialQuantity}
                      onChange={(e) => setNewItemForm({ ...newItemForm, initialQuantity: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Low-Stock Alert*</label>
                    <input
                      type="number"
                      required
                      value={newItemForm.lowStockAlert}
                      onChange={(e) => setNewItemForm({ ...newItemForm, lowStockAlert: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Cost Price (₱)</label>
                    <input
                      type="text"
                      placeholder="P 0.00"
                      value={newItemForm.costPrice}
                      onChange={(e) => setNewItemForm({ ...newItemForm, costPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Retail Price (₱)</label>
                    <input
                      type="text"
                      placeholder="P 0.00"
                      value={newItemForm.retailPrice}
                      onChange={(e) => setNewItemForm({ ...newItemForm, retailPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Supplier</label>
                  <input
                    type="text"
                    placeholder="e.g. Beauty Pro Distributors"
                    value={newItemForm.supplier}
                    onChange={(e) => setNewItemForm({ ...newItemForm, supplier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#B58D54] bg-white text-xs outline-none focus:border-[#2A1E1B]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Note (optional)</label>
                  <textarea
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Search Product</label>
                  <select
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
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Qty to Add</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={restockForm.qtyToAdd}
                      onChange={(e) => setRestockForm({ ...restockForm, qtyToAdd: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#38C69F] bg-white text-xs outline-none focus:border-[#C5A059]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">New Total</label>
                    <input
                      type="text"
                      readOnly
                      value={(items.find(i => i.sku === restockForm.selectedSku)?.stock || 0) + (parseInt(restockForm.qtyToAdd) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-gray-100 text-xs font-bold text-[#2A1E1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Note (optional)</label>
                  <textarea
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
                <p className="text-xs text-[#8A8174] mt-0.5">{lowStockItemsList.length} items queued for reorder &bull; 2026-08-20</p>
              </div>
              <button onClick={() => setIsPOModalOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B] p-1">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">PO NUMBER:</label>
                <input
                  type="text"
                  readOnly
                  value="PO-359553"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#B3A772] bg-white font-bold text-[#2A1E1B]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">REQUESTED BY:</label>
                <input
                  type="text"
                  readOnly
                  value="Admin - Centy'zz Hair & Beauty Salon"
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
                    const qty = poOrderQty[item.sku] || 10;
                    const lineTotal = qty * (item.unitCost || 350);

                    return (
                      <div key={item.id} className="p-4 grid grid-cols-12 items-center text-xs font-sans">
                        <div className="col-span-5 space-y-1.5">
                          <p className="font-bold text-[#2A1E1B] text-xs">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFE3CD] text-[#C25E00]">
                              • LOW STOCK
                            </span>
                            <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5F6F0] text-[#1E5C4E]">
                              Rec. Reorder: +{item.recommendedQty || 15} units
                            </span>
                          </div>
                        </div>

                        <span className="col-span-2 text-center font-bold text-[#2A1E1B] text-xs">{item.stock}</span>

                        <div className="col-span-2 text-center">
                          <input
                            type="number"
                            value={qty}
                            onChange={(e) => setPoOrderQty({ ...poOrderQty, [item.sku]: parseInt(e.target.value) || 0 })}
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
                  disabled={lowStockItemsList.length === 0}
                  onClick={() => {
                    setIsPOModalOpen(false);
                    setIsPODocumentModalOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl bg-[#4A3F32] hover:bg-[#2A1E1B] text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  Submit Purchase Order
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: PRINT PO DOCUMENT */}
      {isPODocumentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-2xl max-w-3xl w-full p-8 my-8 text-[#2A1E1B] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="text-[#C5A059] h-5 w-5" />
                <h3 className="font-bold text-base">Purchase Order Document</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                    showToast('Sending Purchase Order to printer...');
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
                  <h1 className="text-2xl font-serif font-bold text-[#2A1E1B] tracking-wide">CENTY'ZZ SALON</h1>
                  <p className="text-[10px] uppercase tracking-widest text-[#C5A059] font-bold">Hair & Beauty Studio</p>
                  <p className="text-[11px] text-[#8A8174] mt-1">Unit A, Block 15 Lot 2, Bagumbong, Caloocan City</p>
                  <p className="text-[11px] text-[#8A8174]">Phone: 0917 187 2638</p>
                </div>

                <div className="text-right">
                  <h2 className="text-xl font-bold tracking-wider text-[#2A1E1B]">PURCHASE ORDER</h2>
                  <p className="text-[11px] font-bold text-[#2A1E1B] mt-1">PO No: PO-2026-08-31-01</p>
                  <p className="text-[11px] text-[#8A8174]">Date: 2026-08-31</p>
                  <p className="text-[11px] text-[#8A8174]">Issued By: Admin</p>
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
                  {lowStockItemsList.map((item, idx) => {
                    const qty = poOrderQty[item.sku] || 10;
                    const total = qty * item.unitCost;

                    return (
                      <tr key={item.id}>
                        <td className="p-2.5 text-center font-bold text-gray-500">{idx + 1}</td>
                        <td className="p-2.5">
                          <p className="font-bold">{item.sku}</p>
                          <span className="text-[9px] text-amber-700 font-bold">(LOW STOCK)</span>
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
                    <span className="font-bold text-[#2A1E1B]">₱ {poEstimatedTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#E7DFD4] pt-2 font-bold text-base text-[#2A1E1B]">
                    <span>TOTAL:</span>
                    <span>₱ {poEstimatedTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

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
                onClick={() => {
                  setItems(items.map(i => i.id === archiveTargetItem.id ? { ...i, isArchived: true } : i));
                  showToast(`Moved "${archiveTargetItem.name}" to Archived Bin`);
                  setArchiveTargetItem(null);
                }}
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
              <h3 className="font-bold text-base text-rose-700">Delete Item Permanently</h3>
              <button onClick={() => setDeleteTargetItem(null)} className="text-gray-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              This action cannot be undone. Are you sure you want to permanently delete <strong className="text-[#2A1E1B]">{deleteTargetItem.name}</strong> from the database?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetItem(null)}
                className="px-4 py-2 rounded-xl border border-[#E7DFD4] text-xs font-bold text-gray-600 hover:bg-[#F8F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setItems(items.filter(i => i.id !== deleteTargetItem.id));
                  showToast(`Permanently deleted "${deleteTargetItem.name}"`);
                  setDeleteTargetItem(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}