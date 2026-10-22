import HeaderActions from '../../components/workspace/HeaderActions';
import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Tag, 
  MoreHorizontal, 
  Edit3, 
  UserX, 
  UserCheck, 
  X, 
  CheckCircle2, 
  Archive,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const formatPromoDate = (date) => {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function ServiceManagementView({ showHeaderActions = true }) {
  // Active Promo Banner State
  const [activePromo, setActivePromo] = useState({
    title: 'Nail Bar Weekday Special',
    appliesTo: 'Classic Gel Manicure',
    discountText: '₱200 off',
    startDate: '2026-08-15',
    endDate: '2026-08-31',
    status: 'ACTIVE'
  });

  // Services Data
  const [services, setServices] = useState([
    {
      id: 'srv_1',
      category: 'HAIR',
      name: 'Signature Cut & Blowout',
      duration: '1 hr',
      price: '₱1,800.00',
      status: 'ACTIVE',
      isArchived: false,
      description: 'Professional haircut styling and premium blowout.',
      dateCreated: 'Aug 16, 2026'
    },
    {
      id: 'srv_2',
      category: 'HAIR',
      name: 'Root Touch-Up (Single Process)',
      duration: '1 hr 30 mins',
      price: '₱2,800.00',
      status: 'ACTIVE',
      isArchived: false,
      description: 'Single process hair root touch-up treatment.',
      dateCreated: 'Aug 16, 2026'
    },
    {
      id: 'srv_3',
      category: 'HAIR',
      name: 'Keratin Smoothing Treatment',
      duration: '2 hrs 30 mins',
      price: '₱4,000.00',
      status: 'ACTIVE',
      isArchived: false,
      description: 'Long-lasting frizz reduction and hair smoothing.',
      dateCreated: 'Aug 16, 2026'
    },
    {
      id: 'srv_4',
      category: 'NAILS',
      name: 'Classic Gel Manicure',
      duration: '45 mins',
      price: '₱900.00',
      status: 'ACTIVE',
      isArchived: false,
      description: 'Standard gel manicure with cuticle care and polishing.',
      dateCreated: 'Aug 16, 2026'
    },
    {
      id: 'srv_5',
      category: 'NAILS',
      name: 'Luxury Spa Pedicure',
      duration: '1 hr',
      price: '₱1,200.00',
      status: 'ACTIVE',
      isArchived: false,
      description: 'Exfoliating foot scrub, massage, and pedicure.',
      dateCreated: 'Aug 16, 2026'
    },
    {
      id: 'srv_6',
      category: 'SKIN',
      name: 'Hydrating Facial Treatment',
      duration: '1 hr 15 mins',
      price: '₱2,500.00',
      status: 'INACTIVE',
      isArchived: false,
      description: 'Deep pore cleansing and ultra-hydrating facial mask.',
      dateCreated: 'Aug 18, 2026'
    }
  ]);

  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'ARCHIVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isEditPromoOpen, setIsEditPromoOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  // Form States
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: 'HAIR',
    price: '',
    durationHours: '1',
    durationMins: '0',
    description: ''
  });

  const [promoForm, setPromoForm] = useState({
    title: activePromo.title,
    appliesTo: activePromo.appliesTo,
    discountType: '% Off',
    value: '20',
    startDate: activePromo.startDate,
    endDate: activePromo.endDate
  });

  const openPromoEditor = () => {
    const isPercentage = activePromo.discountText.includes('%');
    const discountValue = activePromo.discountText.match(/[\d,.]+/)?.[0] || '';
    setPromoForm({
      title: activePromo.title,
      appliesTo: activePromo.appliesTo,
      discountType: isPercentage ? '% Off' : '₱ Off',
      value: discountValue.replace(/,/g, ''),
      startDate: activePromo.startDate,
      endDate: activePromo.endDate
    });
    setIsEditPromoOpen(true);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter logic
  const tabFilteredServices = services.filter((s) => {
    if (activeTab === 'ACTIVE') return !s.isArchived;
    return s.isArchived;
  });

  const filteredServices = tabFilteredServices.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const paginatedServices = filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedServiceIds(paginatedServices.map((s) => s.id));
    } else {
      setSelectedServiceIds([]);
    }
  };

  const handleSelectService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddServiceSubmit = (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.price) return;

    const durStr = `${serviceForm.durationHours !== '0' ? serviceForm.durationHours + ' hr ' : ''}${serviceForm.durationMins !== '0' ? serviceForm.durationMins + ' mins' : ''}`.trim() || '1 hr';
    const formattedPrice = serviceForm.price.includes('₱') ? serviceForm.price : `₱${Number(serviceForm.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? {
        ...s,
        name: serviceForm.name,
        category: serviceForm.category,
        price: formattedPrice,
        duration: durStr,
        description: serviceForm.description
      } : s));
      setEditingService(null);
      showToast(`Successfully updated service "${serviceForm.name}"`);
    } else {
      const newSrv = {
        id: `srv_${Date.now()}`,
        category: serviceForm.category,
        name: serviceForm.name,
        duration: durStr,
        price: formattedPrice,
        status: 'ACTIVE',
        isArchived: false,
        description: serviceForm.description,
        dateCreated: 'Oct 21, 2026'
      };
      setServices([newSrv, ...services]);
      showToast(`Successfully added new service "${serviceForm.name}"`);
    }

    setIsAddServiceOpen(false);
    setServiceForm({ name: '', category: 'HAIR', price: '', durationHours: '1', durationMins: '0', description: '' });
  };

  const handleToggleStatus = (targetService) => {
    setServices(services.map(s => s.id === targetService.id ? {
      ...s,
      status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    } : s));
    setActiveMenuId(null);
    showToast(`Updated status for ${targetService.name}`);
  };

  const handleToggleArchive = (targetService) => {
    setServices(services.map(s => s.id === targetService.id ? {
      ...s,
      isArchived: !s.isArchived
    } : s));
    setActiveMenuId(null);
    showToast(targetService.isArchived ? `Restored ${targetService.name}` : `Archived ${targetService.name}`);
  };

  const renderCategoryBadge = (category) => {
    const cat = category.toUpperCase();
    if (cat === 'HAIR') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#FDEBB6] text-[#8C6D23] text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-[#F3DE9F]">
          <Sparkles className="h-3 w-3" /> HAIR
        </span>
      );
    }
    if (cat === 'NAILS') {
      return (
        <span className="inline-flex items-center gap-1.5 bg-[#E1F5FE] text-[#0288D1] text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-[#B3E5FC]">
          <Tag className="h-3 w-3" /> NAILS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-[#FCE4EC] text-[#C2185B] text-[10px] font-bold tracking-wider px-3 py-1 rounded-full border border-[#F8BBD0]">
        <Tag className="h-3 w-3" /> SKIN
      </span>
    );
  };

  return (
    <div className="w-full space-y-6 text-[#443523] pb-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-[#3A342B] text-[#F5F1EA] px-4 py-3 rounded-xl shadow-xl border border-[#C5A059]/40 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 text-[#C5A059]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B]">Service Management</h1>
          <p className="text-xs text-[#8A8174]">Manage salon treatment catalog, pricing, durations, and active promo discounts</p>
        </div>

        {/* Group 2: System Quick Actions */}
        {showHeaderActions && (<HeaderActions />)}
      </header>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top Controls & Archive Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">All Services</h2>
              <span className="bg-[#3A342B] text-[#F5F1EA] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {tabFilteredServices.length}
              </span>
            </div>

            {/* Active vs Archived Tabs */}
            <div className="flex items-center bg-[#F6F4EF] p-1 rounded-xl border border-[#E9E4D8] ml-2">
              <button
                onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); setSelectedServiceIds([]); setActiveMenuId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ACTIVE' 
                    ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Active Services
              </button>
              <button
                onClick={() => { setActiveTab('ARCHIVED'); setCurrentPage(1); setSelectedServiceIds([]); setActiveMenuId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ARCHIVED' 
                    ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Archived Services
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search Here..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none cursor-pointer focus:border-[#C5A059]"
              >
                <option value="ALL">All Categories</option>
                <option value="HAIR">Hair</option>
                <option value="NAILS">Nails</option>
                <option value="SKIN">Skin</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8174] pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setEditingService(null);
                setServiceForm({ name: '', category: 'HAIR', price: '', durationHours: '1', durationMins: '0', description: '' });
                setIsAddServiceOpen(true);
              }}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 border border-[#C5A059]/40"
            >
              <Plus className="h-4 w-4 text-[#F5F1EA]" />
              <span>Add New Service</span>
            </button>

            <button
              onClick={openPromoEditor}
              className="flex items-center gap-2 bg-white hover:bg-[#FFFDF8] text-[#8B5E3C] px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all border border-[#8B5E3C]/30"
            >
              <Tag className="h-4 w-4 text-[#8B5E3C]" />
              <span>Create promo / discount</span>
            </button>
          </div>
        </div>

        {/* Promo Banner Alert */}
        {activeTab === 'ACTIVE' && (
          <div className="bg-[#F7F4EF] border border-[#E8DDCF] rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-[#EFE4D4] text-[#8B5E3C] rounded-xl border border-[#DFCBB5] shrink-0">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#2A1E1B]">{activePromo.title}</h3>
                <p className="text-[11px] text-[#8A8174] mt-0.5">
                  <span className="font-semibold text-[#443523]">{activePromo.appliesTo}</span> &bull; <span className="text-[#8B5E3C] font-bold">{activePromo.discountText}</span> &bull; {formatPromoDate(activePromo.startDate)} – {formatPromoDate(activePromo.endDate)}
                </p>
              </div>
            </div>

            <button
              onClick={openPromoEditor}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs self-start sm:self-auto border border-[#C5A059]/30"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit Current Promo
            </button>
          </div>
        )}

        {/* Services Data Table */}
        <div className="overflow-x-auto overflow-y-visible rounded-xl border border-[#E9E4D8]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFDF8] border-b border-[#E9E4D8] text-[10px] font-semibold text-[#9A907F] uppercase tracking-wider">
                <th className="p-4 pl-5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedServiceIds.length === paginatedServices.length && paginatedServices.length > 0}
                    className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4">Category</th>
                <th className="p-4">Service Name</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E4D8] text-xs">
              {paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#8A8174]">
                    No {activeTab.toLowerCase()} services found.
                  </td>
                </tr>
              ) : (
                paginatedServices.map((s, index) => {
                  const isSelected = selectedServiceIds.includes(s.id);
                  const isBottomRow = index >= paginatedServices.length - 2;

                  return (
                    <tr 
                      key={s.id} 
                      className={`hover:bg-[#C5A059]/5 transition-colors ${isSelected ? 'bg-[#FFFDF0]' : ''}`}
                    >
                      <td className="p-4 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectService(s.id)}
                          className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        {renderCategoryBadge(s.category)}
                      </td>

                      <td className="p-4">
                        <div>
                          <p className="font-bold text-[#2A1E1B]">{s.name}</p>
                          <p className="text-[11px] text-[#8A8174] truncate max-w-xs">{s.description}</p>
                        </div>
                      </td>

                      <td className="p-4 text-[#443523] font-medium">
                        {s.duration}
                      </td>

                      <td className="p-4 text-[#2A1E1B] font-bold">
                        {s.price}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full ${
                          s.isArchived 
                            ? 'bg-[#EFECE6] text-[#6E6359] border border-[#DFD5C0]' 
                            : s.status === 'ACTIVE' 
                              ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]' 
                              : 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.isArchived ? 'bg-[#6E6359]' : s.status === 'ACTIVE' ? 'bg-[#137333]' : 'bg-[#C5221F]'}`} />
                          {s.isArchived ? 'ARCHIVED' : s.status}
                        </span>
                      </td>

                      <td className="p-4 text-right pr-6 relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                          className="p-2 rounded-lg hover:bg-[#E9E4D8]/50 text-[#8A8174] hover:text-[#2A1E1B] transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === s.id && (
                          <div className={`absolute right-6 w-52 bg-white rounded-xl shadow-xl border border-[#E9E4D8] py-1.5 z-40 text-left animate-fadeIn ${
                            isBottomRow ? 'bottom-12' : 'top-12'
                          }`}>
                            
                            {!s.isArchived ? (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingService(s);
                                    setServiceForm({
                                      name: s.name,
                                      category: s.category,
                                      price: s.price.replace('₱', '').replace(',', ''),
                                      durationHours: s.duration.includes('hr') ? s.duration.split('hr')[0].trim() : '0',
                                      durationMins: s.duration.includes('mins') ? s.duration.split('hr')[1]?.replace('mins', '').trim() || '30' : '0',
                                      description: s.description
                                    });
                                    setActiveMenuId(null);
                                    setIsAddServiceOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-[#8A8174]" />
                                  Edit Service
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(s)}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium border-t border-[#E9E4D8]"
                                >
                                  {s.status === 'ACTIVE' ? <UserX className="h-3.5 w-3.5 text-red-500" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-600" />}
                                  {s.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                                </button>

                                <button
                                  onClick={() => handleToggleArchive(s)}
                                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold border-t border-[#E9E4D8]"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  Archive Service
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleArchive(s)}
                                  className="w-full px-3.5 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Restore Service
                                </button>
                                <button
                                  onClick={() => {
                                    alert(`Service Details:\nName: ${s.name}\nCategory: ${s.category}\nPrice: ${s.price}\nDuration: ${s.duration}\nDescription: ${s.description}`);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium border-t border-[#E9E4D8]"
                                >
                                  <Search className="h-3.5 w-3.5 text-[#8A8174]" />
                                  View Details
                                </button>
                              </>
                            )}

                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A8174] pt-1 gap-3">
          <span>Showing {paginatedServices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredServices.length)} of {filteredServices.length} items</span>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F6F4EF] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold px-2 text-[#443523]">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] disabled:opacity-40 hover:bg-[#F6F4EF] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>

      {/* ================= MODAL 1: ADD / EDIT SERVICE ================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F6F4EF] text-[#8B5E3C] rounded-xl border border-[#E9E4D8]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#2A1E1B]">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
              </div>
              <button onClick={() => setIsAddServiceOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signature Rebonding"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Category</label>
                  <select
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="HAIR">Hair</option>
                    <option value="NAILS">Nails</option>
                    <option value="SKIN">Skin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Price (₱)</label>
                  <input
                    type="text"
                    required
                    placeholder="1,500"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Duration (Hours)</label>
                  <select
                    value={serviceForm.durationHours}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="0">0 hrs</option>
                    <option value="1">1 hr</option>
                    <option value="2">2 hrs</option>
                    <option value="3">3 hrs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Duration (Minutes)</label>
                  <select
                    value={serviceForm.durationMins}
                    onChange={(e) => setServiceForm({ ...serviceForm, durationMins: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="0">0 mins</option>
                    <option value="15">15 mins</option>
                    <option value="30">30 mins</option>
                    <option value="45">45 mins</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter brief description of the service..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724B2F] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editingService ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CREATE / EDIT PROMO ================= */}
      {isEditPromoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F6F4EF] text-[#8B5E3C] rounded-xl border border-[#E9E4D8]">
                  <Tag className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#2A1E1B]">Create / Edit Promo</h3>
              </div>
              <button onClick={() => setIsEditPromoOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              setActivePromo({
                title: promoForm.title,
                appliesTo: promoForm.appliesTo,
                discountText: promoForm.discountType === '% Off' ? `${promoForm.value}% off` : `₱${promoForm.value} off`,
                startDate: promoForm.startDate,
                endDate: promoForm.endDate,
                status: 'ACTIVE'
              });
              setIsEditPromoOpen(false);
              showToast(`Successfully updated promotional campaign!`);
            }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Promo Title</label>
                <input
                  type="text"
                  required
                  value={promoForm.title}
                  onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Applies to Service</label>
                <input
                  type="text"
                  required
                  value={promoForm.appliesTo}
                  onChange={(e) => setPromoForm({ ...promoForm, appliesTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Discount Type</label>
                  <div className="grid grid-cols-2 gap-1 bg-[#F6F4EF] p-1 rounded-xl border border-[#E9E4D8]">
                    {['% Off', '₱ Off'].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setPromoForm({ ...promoForm, discountType: type })}
                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                          promoForm.discountType === type ? 'bg-[#8B5E3C] text-white shadow-xs' : 'text-[#8A8174]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Discount Value</label>
                  <input
                    type="text"
                    required
                    value={promoForm.value}
                    onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={promoForm.startDate}
                    onChange={(e) => setPromoForm({ ...promoForm, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={promoForm.endDate}
                    onChange={(e) => setPromoForm({ ...promoForm, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditPromoOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724B2F] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Save Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}