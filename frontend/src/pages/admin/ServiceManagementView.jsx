import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit3, 
  X, 
  CheckCircle2, 
  Archive,
  RotateCcw,
  User,
  Calendar,
  Sparkles,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function ClientManagementView() {
  // 20 Mock Clients Data
  const [clients, setClients] = useState([
    {
      id: 'clt_1',
      fullName: 'Natasha Romanoff',
      email: 'blackwidow@gmail.com',
      contactNumber: '09952347123',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Aug 15, 2026',
      totalVisits: 8,
      totalSpend: '₱12,450.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Allergic to certain hair dye ammonia. Prefers organic scalp treatments.',
      avatarColor: 'bg-[#4A3928]',
      bookingHistory: [
        { id: 'b1', service: 'Keratin Smoothing Treatment', date: 'Aug 15, 2026', amount: '₱4,000.00' },
        { id: 'b2', service: 'Signature Cut & Blowout', date: 'Jul 10, 2026', amount: '₱1,800.00' }
      ],
      favoriteService: 'Keratin Smoothing Treatment'
    },
    {
      id: 'clt_2',
      fullName: 'Ava Silva',
      email: 'warriornun@gmail.com',
      contactNumber: '099523847123',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Aug 03, 2026',
      totalVisits: 10,
      totalSpend: '₱18,200.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Likes extra hot towel service during hair treatments.',
      avatarColor: 'bg-[#9B6B39]',
      bookingHistory: [
        { id: 'b3', service: 'Root Touch-Up (Single Process)', date: 'Aug 03, 2026', amount: '₱2,800.00' }
      ],
      favoriteService: 'Root Touch-Up (Single Process)'
    },
    {
      id: 'clt_3',
      fullName: 'Mike Wheeler',
      email: 'thepaladin@gmail.com',
      contactNumber: '09912347123',
      gender: 'Male',
      tier: 'Regular',
      lastVisit: 'Aug 03, 2026',
      totalVisits: 1,
      totalSpend: '₱900.00',
      status: 'NEW',
      isArchived: false,
      notes: 'First time visitor. Interested in styling recommendations.',
      avatarColor: 'bg-[#2E4A39]',
      bookingHistory: [
        { id: 'b4', service: 'Classic Gel Manicure', date: 'Aug 03, 2026', amount: '₱900.00' }
      ],
      favoriteService: 'Classic Gel Manicure'
    },
    {
      id: 'clt_4',
      fullName: 'Sansa Stark',
      email: 'redwolf@gmail.com',
      contactNumber: '099155847123',
      gender: 'Female',
      tier: 'Regular',
      lastVisit: 'Jun 07, 2026',
      totalVisits: 3,
      totalSpend: '₱3,600.00',
      status: 'INACTIVE',
      isArchived: false,
      notes: 'Prefers quiet sessions without background chatter.',
      avatarColor: 'bg-[#5C4033]',
      bookingHistory: [
        { id: 'b5', service: 'Luxury Spa Pedicure', date: 'Jun 07, 2026', amount: '₱1,200.00' }
      ],
      favoriteService: 'Luxury Spa Pedicure'
    },
    {
      id: 'clt_5',
      fullName: 'Bea Alonzo',
      email: 'bea.alonzo@example.com',
      contactNumber: '0944556677',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Sep 02, 2026',
      totalVisits: 14,
      totalSpend: '₱25,400.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Loyal client for hair rebonding and facial treatments.',
      avatarColor: 'bg-[#3A342B]',
      bookingHistory: [{ id: 'b6', service: 'Hydrating Facial', date: 'Sep 02, 2026', amount: '₱2,500.00' }],
      favoriteService: 'Hydrating Facial Treatment'
    },
    {
      id: 'clt_6',
      fullName: 'John Lloyd Cruz',
      email: 'johnlloyd@example.com',
      contactNumber: '0955667788',
      gender: 'Male',
      tier: 'Regular',
      lastVisit: 'Aug 20, 2026',
      totalVisits: 5,
      totalSpend: '₱6,500.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Always books morning appointments.',
      avatarColor: 'bg-[#4A3928]',
      bookingHistory: [{ id: 'b7', service: 'Signature Cut & Blowout', date: 'Aug 20, 2026', amount: '₱1,800.00' }],
      favoriteService: 'Signature Cut & Blowout'
    },
    {
      id: 'clt_7',
      fullName: 'Sarah Geronimo',
      email: 'sarahg@example.com',
      contactNumber: '0966778899',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Sep 05, 2026',
      totalVisits: 19,
      totalSpend: '₱38,900.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Very particular with hair layering.',
      avatarColor: 'bg-[#9B6B39]',
      bookingHistory: [{ id: 'b8', service: 'Keratin Smoothing', date: 'Sep 05, 2026', amount: '₱4,000.00' }],
      favoriteService: 'Keratin Smoothing Treatment'
    },
    {
      id: 'clt_8',
      fullName: 'Vice Ganda',
      email: 'viceganda@example.com',
      contactNumber: '0977889900',
      gender: 'LGBTQ+',
      tier: 'VIP',
      lastVisit: 'Sep 10, 2026',
      totalVisits: 22,
      totalSpend: '₱45,000.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Loves experimental hair coloring and nail art.',
      avatarColor: 'bg-[#2E4A39]',
      bookingHistory: [{ id: 'b9', service: 'Classic Gel Manicure', date: 'Sep 10, 2026', amount: '₱900.00' }],
      favoriteService: 'Classic Gel Manicure'
    },
    {
      id: 'clt_9',
      fullName: 'Anne Curtis',
      email: 'annecurtis@example.com',
      contactNumber: '0988990011',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Aug 12, 2026',
      totalVisits: 12,
      totalSpend: '₱21,000.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Prefers organic shampoos only.',
      avatarColor: 'bg-[#5C4033]',
      bookingHistory: [{ id: 'b10', service: 'Signature Cut', date: 'Aug 12, 2026', amount: '₱1,800.00' }],
      favoriteService: 'Signature Cut & Blowout'
    },
    {
      id: 'clt_10',
      fullName: 'Kathryn Bernardo',
      email: 'kathryn@example.com',
      contactNumber: '0999001122',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Sep 12, 2026',
      totalVisits: 16,
      totalSpend: '₱29,800.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'VIP guest. Provide complimentary beverages.',
      avatarColor: 'bg-[#3A342B]',
      bookingHistory: [{ id: 'b11', service: 'Luxury Spa Pedicure', date: 'Sep 12, 2026', amount: '₱1,200.00' }],
      favoriteService: 'Luxury Spa Pedicure'
    },
    {
      id: 'clt_11',
      fullName: 'Daniel Padilla',
      email: 'daniel@example.com',
      contactNumber: '0911223355',
      gender: 'Male',
      tier: 'Regular',
      lastVisit: 'Jul 22, 2026',
      totalVisits: 4,
      totalSpend: '₱5,200.00',
      status: 'INACTIVE',
      isArchived: false,
      notes: 'Standard men haircut.',
      avatarColor: 'bg-[#4A3928]',
      bookingHistory: [{ id: 'b12', service: 'Signature Cut', date: 'Jul 22, 2026', amount: '₱1,800.00' }],
      favoriteService: 'Signature Cut & Blowout'
    },
    {
      id: 'clt_12',
      fullName: 'Liza Soberano',
      email: 'liza@example.com',
      contactNumber: '0922334466',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Sep 14, 2026',
      totalVisits: 15,
      totalSpend: '₱31,000.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Prefers private VIP booth.',
      avatarColor: 'bg-[#9B6B39]',
      bookingHistory: [{ id: 'b13', service: 'Hydrating Facial', date: 'Sep 14, 2026', amount: '₱2,500.00' }],
      favoriteService: 'Hydrating Facial Treatment'
    },
    {
      id: 'clt_13',
      fullName: 'Enrique Gil',
      email: 'enrique@example.com',
      contactNumber: '0933445577',
      gender: 'Male',
      tier: 'Regular',
      lastVisit: 'Aug 25, 2026',
      totalVisits: 6,
      totalSpend: '₱7,800.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Prefers afternoon scheduling.',
      avatarColor: 'bg-[#2E4A39]',
      bookingHistory: [{ id: 'b14', service: 'Root Touch-Up', date: 'Aug 25, 2026', amount: '₱2,800.00' }],
      favoriteService: 'Root Touch-Up (Single Process)'
    },
    {
      id: 'clt_14',
      fullName: 'Nadine Lustre',
      email: 'nadine@example.com',
      contactNumber: '0944556688',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'Sep 01, 2026',
      totalVisits: 11,
      totalSpend: '₱19,500.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Loves edgy nail designs and dark tones.',
      avatarColor: 'bg-[#5C4033]',
      bookingHistory: [{ id: 'b15', service: 'Classic Gel Manicure', date: 'Sep 01, 2026', amount: '₱900.00' }],
      favoriteService: 'Classic Gel Manicure'
    },
    {
      id: 'clt_15',
      fullName: 'James Reid',
      email: 'james@example.com',
      contactNumber: '0955667799',
      gender: 'Male',
      tier: 'Regular',
      lastVisit: 'Jun 15, 2026',
      totalVisits: 2,
      totalSpend: '₱2,400.00',
      status: 'INACTIVE',
      isArchived: false,
      notes: 'Infrequent visitor.',
      avatarColor: 'bg-[#3A342B]',
      bookingHistory: [{ id: 'b16', service: 'Signature Cut', date: 'Jun 15, 2026', amount: '₱1,200.00' }],
      favoriteService: 'Signature Cut & Blowout'
    },
    {
      id: 'clt_16',
      fullName: 'Alden Richards',
      email: 'alden@example.com',
      contactNumber: '0966778800',
      gender: 'Male',
      tier: 'VIP',
      lastVisit: 'Sep 16, 2026',
      totalVisits: 13,
      totalSpend: '₱23,000.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Very polite. Regular weekend guest.',
      avatarColor: 'bg-[#4A3928]',
      bookingHistory: [{ id: 'b17', service: 'Root Touch-Up', date: 'Sep 16, 2026', amount: '₱2,800.00' }],
      favoriteService: 'Root Touch-Up (Single Process)'
    },
    {
      id: 'clt_17',
      fullName: 'Maine Mendoza',
      email: 'maine@example.com',
      contactNumber: '0977889911',
      gender: 'Female',
      tier: 'Regular',
      lastVisit: 'Sep 11, 2026',
      totalVisits: 7,
      totalSpend: '₱8,900.00',
      status: 'ACTIVE',
      isArchived: false,
      notes: 'Prefers natural hair styling.',
      avatarColor: 'bg-[#9B6B39]',
      bookingHistory: [{ id: 'b18', service: 'Classic Gel Manicure', date: 'Sep 11, 2026', amount: '₱900.00' }],
      favoriteService: 'Classic Gel Manicure'
    },
    {
      id: 'clt_18',
      fullName: 'Dingdong Dantes',
      email: 'dingdong@example.com',
      contactNumber: '0988990022',
      gender: 'Male',
      tier: 'VIP',
      lastVisit: 'May 20, 2026',
      totalVisits: 9,
      totalSpend: '₱14,200.00',
      status: 'INACTIVE',
      isArchived: true,
      notes: 'Moved out of town temporarily.',
      avatarColor: 'bg-[#2E4A39]',
      bookingHistory: [{ id: 'b19', service: 'Signature Cut', date: 'May 20, 2026', amount: '₱1,800.00' }],
      favoriteService: 'Signature Cut & Blowout'
    },
    {
      id: 'clt_19',
      fullName: 'Marian Rivera',
      email: 'marian@example.com',
      contactNumber: '0999001133',
      gender: 'Female',
      tier: 'VIP',
      lastVisit: 'May 18, 2026',
      totalVisits: 20,
      totalSpend: '₱42,000.00',
      status: 'INACTIVE',
      isArchived: true,
      notes: 'Archived due to prolonged inactivity.',
      avatarColor: 'bg-[#5C4033]',
      bookingHistory: [{ id: 'b20', service: 'Keratin Smoothing', date: 'May 18, 2026', amount: '₱4,000.00' }],
      favoriteService: 'Keratin Smoothing Treatment'
    },
    {
      id: 'clt_20',
      fullName: 'Rocco Nacino',
      email: 'rocco@example.com',
      contactNumber: '0912334455',
      gender: 'Male',
      tier: 'Regular',
      lastVisit: 'Sep 18, 2026',
      totalVisits: 2,
      totalSpend: '₱1,800.00',
      status: 'NEW',
      isArchived: false,
      notes: 'New client referred by Bea Alonzo.',
      avatarColor: 'bg-[#3A342B]',
      bookingHistory: [{ id: 'b21', service: 'Signature Cut', date: 'Sep 18, 2026', amount: '₱1,800.00' }],
      favoriteService: 'Signature Cut & Blowout'
    }
  ]);

  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'ARCHIVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination - Updated to 8 items per page
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedClientProfile, setSelectedClientProfile] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  const [toastMessage, setToastMessage] = useState('');

  // Form States
  const [clientForm, setClientForm] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    gender: 'Female',
    tier: 'Regular',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter logic
  const tabFilteredClients = clients.filter((c) => {
    if (activeTab === 'ACTIVE') return !c.isArchived;
    return c.isArchived;
  });

  const filteredClients = tabFilteredClients.filter((c) => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactNumber.includes(searchQuery);

    const matchesTier = tierFilter === 'ALL' || c.tier === tierFilter;

    return matchesSearch && matchesTier;
  });

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedClientIds(paginatedClients.map((c) => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleSelectClient = (id) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddClientSubmit = (e) => {
    e.preventDefault();
    if (!clientForm.fullName || !clientForm.email) return;

    if (editingClient) {
      setClients(clients.map(c => c.id === editingClient.id ? {
        ...c,
        fullName: clientForm.fullName,
        email: clientForm.email,
        contactNumber: clientForm.contactNumber,
        gender: clientForm.gender,
        tier: clientForm.tier,
        notes: clientForm.notes
      } : c));
      setEditingClient(null);
      showToast(`Successfully updated client "${clientForm.fullName}"`);
    } else {
      const newClient = {
        id: `clt_${Date.now()}`,
        fullName: clientForm.fullName,
        email: clientForm.email,
        contactNumber: clientForm.contactNumber || '09000000000',
        gender: clientForm.gender,
        tier: clientForm.tier,
        lastVisit: 'N/A (New)',
        totalVisits: 0,
        totalSpend: '₱0.00',
        status: 'NEW',
        isArchived: false,
        notes: clientForm.notes || 'No special notes provided.',
        avatarColor: 'bg-[#4A3928]',
        bookingHistory: [],
        favoriteService: 'None yet'
      };
      setClients([newClient, ...clients]);
      showToast(`Successfully added new client "${clientForm.fullName}"`);
    }

    setIsAddClientOpen(false);
    setClientForm({ fullName: '', email: '', contactNumber: '', gender: 'Female', tier: 'Regular', notes: '' });
  };

  const handleToggleArchive = (targetClient) => {
    setClients(clients.map(c => c.id === targetClient.id ? {
      ...c,
      isArchived: !c.isArchived
    } : c));
    setActiveMenuId(null);
    showToast(targetClient.isArchived ? `Restored client ${targetClient.fullName}` : `Archived client ${targetClient.fullName}`);
  };

  const renderStatusBadge = (status, isArchived) => {
    if (isArchived) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full bg-[#EFECE6] text-[#6E6359] border border-[#DFD5C0]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6E6359]" /> ARCHIVED
        </span>
      );
    }
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" /> ACTIVE
        </span>
      );
    }
    if (status === 'NEW') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full bg-[#E1F5FE] text-[#0288D1] border border-[#B3E5FC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0288D1]" /> NEW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3.5 py-1 rounded-full bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C5221F]" /> INACTIVE
      </span>
    );
  };

  const renderTierBadge = (tier) => {
    if (tier === 'VIP') {
      return (
        <span className="ml-2 inline-block bg-[#E8C27B] text-[#5A3810] text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full border border-[#D8B066] shadow-2xs">
          VIP
        </span>
      );
    }
    return (
      <span className="ml-2 inline-block bg-[#F6F4EF] text-[#8A8174] text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border border-[#E9E4D8]">
        Regular
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
      <div>
        <h1 className="text-xl font-bold text-[#2A1E1B]">Client Management</h1>
        <p className="text-xs text-[#8A8174]">Manage customer registry, booking history, lifetime spend, and loyalty tiers</p>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-[#E9E4D8] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Top Controls & Archive Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#2A1E1B]">All clients</h2>
              <span className="bg-[#3A342B] text-[#F5F1EA] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                {tabFilteredClients.length}
              </span>
            </div>

            {/* Active vs Archived Tabs */}
            <div className="flex items-center bg-[#F6F4EF] p-1 rounded-xl border border-[#E9E4D8] ml-2">
              <button
                onClick={() => { setActiveTab('ACTIVE'); setCurrentPage(1); setSelectedClientIds([]); setActiveMenuId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ACTIVE' 
                    ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Active Clients
              </button>
              <button
                onClick={() => { setActiveTab('ARCHIVED'); setCurrentPage(1); setSelectedClientIds([]); setActiveMenuId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'ARCHIVED' 
                    ? 'bg-[#3A342B] text-[#F5F1EA] shadow-xs' 
                    : 'text-[#8A8174] hover:text-[#2A1E1B]'
                }`}
              >
                Archived Clients
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8174]" />
              <input
                type="text"
                placeholder="Search client name, email, or phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs text-[#2A1E1B] placeholder-[#8A8174] outline-none focus:border-[#C5A059] transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={tierFilter}
                onChange={(e) => { setTierFilter(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none cursor-pointer focus:border-[#C5A059]"
              >
                <option value="ALL">All Tiers</option>
                <option value="VIP">VIP</option>
                <option value="Regular">Regular</option>
              </select>
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8A8174] pointer-events-none" />
            </div>

            <button
              onClick={() => {
                setEditingClient(null);
                setClientForm({ fullName: '', email: '', contactNumber: '', gender: 'Female', tier: 'Regular', notes: '' });
                setIsAddClientOpen(true);
              }}
              className="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 border border-[#C5A059]/40"
            >
              <Plus className="h-4 w-4 text-[#F5F1EA]" />
              <span>Add New Client</span>
            </button>
          </div>
        </div>

        {/* Clients Data Table */}
        <div className="overflow-x-auto overflow-y-visible rounded-xl border border-[#E9E4D8]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFFDF8] border-b border-[#E9E4D8] text-[10px] font-semibold text-[#9A907F] uppercase tracking-wider">
                <th className="p-4 pl-5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedClientIds.length === paginatedClients.length && paginatedClients.length > 0}
                    className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-4">Client</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Last Visit</th>
                <th className="p-4">Total Visits</th>
                <th className="p-4">Total Spend</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9E4D8] text-xs">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-[#8A8174]">
                    No {activeTab.toLowerCase()} clients found.
                  </td>
                </tr>
              ) : (
                paginatedClients.map((c, index) => {
                  const isSelected = selectedClientIds.includes(c.id);
                  const isBottomRow = index >= paginatedClients.length - 2;
                  const initials = c.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-[#C5A059]/5 transition-colors ${isSelected ? 'bg-[#FFFDF0]' : ''}`}
                    >
                      <td className="p-4 pl-5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectClient(c.id)}
                          className="rounded border-[#E9E4D8] text-[#3A342B] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${c.avatarColor} text-white font-bold flex items-center justify-center text-xs shrink-0 border border-white shadow-xs`}>
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span 
                                onClick={() => { setSelectedClientProfile(c); setIsProfileModalOpen(true); }}
                                className="font-bold text-[#2A1E1B] hover:text-[#8B5E3C] cursor-pointer"
                              >
                                {c.fullName}
                              </span>
                              {renderTierBadge(c.tier)}
                            </div>
                            <p className="text-[11px] text-[#8A8174]">{c.gender}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="font-semibold text-[#2A1E1B]">{c.email}</p>
                        <p className="text-[11px] text-[#8A8174]">{c.contactNumber}</p>
                      </td>

                      <td className="p-4 text-[#443523] font-medium">
                        {c.lastVisit}
                      </td>

                      <td className="p-4">
                        <span className="bg-[#F6F4EF] text-[#443523] font-bold px-2.5 py-1 rounded-md border border-[#E9E4D8]">
                          {c.totalVisits}
                        </span>
                      </td>

                      <td className="p-4 text-[#2A1E1B] font-bold">
                        {c.totalSpend}
                      </td>

                      <td className="p-4">
                        {renderStatusBadge(c.status, c.isArchived)}
                      </td>

                      <td className="p-4 text-right pr-6 relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                          className="p-2 rounded-lg hover:bg-[#E9E4D8]/50 text-[#8A8174] hover:text-[#2A1E1B] transition-colors"
                          title="Actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === c.id && (
                          <div className={`absolute right-6 w-52 bg-white rounded-xl shadow-xl border border-[#E9E4D8] py-1.5 z-40 text-left animate-fadeIn ${
                            isBottomRow ? 'bottom-12' : 'top-12'
                          }`}>
                            
                            {!c.isArchived ? (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedClientProfile(c);
                                    setIsProfileModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium"
                                >
                                  <User className="h-3.5 w-3.5 text-[#8A8174]" />
                                  View Profile
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingClient(c);
                                    setClientForm({
                                      fullName: c.fullName,
                                      email: c.email,
                                      contactNumber: c.contactNumber,
                                      gender: c.gender || 'Female',
                                      tier: c.tier || 'Regular',
                                      notes: c.notes || ''
                                    });
                                    setActiveMenuId(null);
                                    setIsAddClientOpen(true);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium border-t border-[#E9E4D8]"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-[#8A8174]" />
                                  Edit Details
                                </button>

                                <button
                                  onClick={() => {
                                    alert(`Redirecting to Booking Desk for ${c.fullName}...`);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium border-t border-[#E9E4D8]"
                                >
                                  <Calendar className="h-3.5 w-3.5 text-[#8B5E3C]" />
                                  Book Appointment
                                </button>

                                <button
                                  onClick={() => handleToggleArchive(c)}
                                  className="w-full px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold border-t border-[#E9E4D8]"
                                >
                                  <Archive className="h-3.5 w-3.5" />
                                  Archive Client
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleToggleArchive(c)}
                                  className="w-full px-3.5 py-2 text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 font-semibold"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Restore Client
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedClientProfile(c);
                                    setIsProfileModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-[#2A1E1B] hover:bg-[#FFFDF8] flex items-center gap-2 font-medium border-t border-[#E9E4D8]"
                                >
                                  <Clock className="h-3.5 w-3.5 text-[#8A8174]" />
                                  View History
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
          <span>Showing {paginatedClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredClients.length)} of {filteredClients.length} items</span>
          
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

      {/* ================= MODAL 1: ADD / EDIT CLIENT ================= */}
      {isAddClientOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#F6F4EF] text-[#8B5E3C] rounded-xl border border-[#E9E4D8]">
                  <User className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#2A1E1B]">{editingClient ? 'Edit Client Details' : 'Add New Client'}</h3>
              </div>
              <button onClick={() => setIsAddClientOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddClientSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Natasha Romanoff"
                  value={clientForm.fullName}
                  onChange={(e) => setClientForm({ ...clientForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="client@gmail.com"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="09952347123"
                    value={clientForm.contactNumber}
                    onChange={(e) => setClientForm({ ...clientForm, contactNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Gender</label>
                  <select
                    value={clientForm.gender}
                    onChange={(e) => setClientForm({ ...clientForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Loyalty Tier</label>
                  <select
                    value={clientForm.tier}
                    onChange={(e) => setClientForm({ ...clientForm, tier: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs font-semibold text-[#443523] outline-none focus:border-[#C5A059]"
                  >
                    <option value="Regular">Regular</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Notes & Preferences</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Allergic to ammonia, prefers warm water..."
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8] text-xs outline-none focus:border-[#C5A059] resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8A8174] hover:bg-[#F6F4EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724B2F] text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CLIENT PROFILE DRAWER / MODAL ================= */}
      {isProfileModalOpen && selectedClientProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E9E4D8] shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-[#E9E4D8] pb-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-full ${selectedClientProfile.avatarColor} text-white font-bold flex items-center justify-center text-sm border-2 border-[#C5A059] shadow-sm`}>
                  {selectedClientProfile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#2A1E1B]">{selectedClientProfile.fullName}</h3>
                    {renderTierBadge(selectedClientProfile.tier)}
                  </div>
                  <p className="text-xs text-[#8A8174]">{selectedClientProfile.email} &bull; {selectedClientProfile.contactNumber}</p>
                </div>
              </div>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-[#8A8174] hover:text-[#2A1E1B]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F7F4EF] p-4 rounded-2xl border border-[#E9E4D8] text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">Total Lifetime Spend</p>
                <p className="text-base font-bold text-[#2A1E1B] mt-1">{selectedClientProfile.totalSpend}</p>
              </div>
              <div className="bg-[#F7F4EF] p-4 rounded-2xl border border-[#E9E4D8] text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">Total Visits</p>
                <p className="text-base font-bold text-[#2A1E1B] mt-1">{selectedClientProfile.totalVisits}</p>
              </div>
              <div className="bg-[#F7F4EF] p-4 rounded-2xl border border-[#E9E4D8] text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8174]">Favorite Service</p>
                <p className="text-xs font-bold text-[#8B5E3C] mt-1.5 truncate">{selectedClientProfile.favoriteService}</p>
              </div>
            </div>

            {/* Notes / Preferences */}
            <div className="bg-[#FFFDF3] border border-[#E9DCB3] p-4 rounded-2xl space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#B4833F]">Allergies & Special Notes</p>
              <p className="text-xs text-[#443523] leading-relaxed">{selectedClientProfile.notes}</p>
            </div>

            {/* Past Booking History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8174]">Recent Booking History</h4>
              
              <div className="space-y-2">
                {selectedClientProfile.bookingHistory && selectedClientProfile.bookingHistory.length > 0 ? (
                  selectedClientProfile.bookingHistory.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[#E9E4D8] bg-[#FFFDF8]">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#F6F4EF] text-[#8B5E3C] rounded-lg border border-[#E9E4D8]">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#2A1E1B]">{b.service}</p>
                          <p className="text-[10px] text-[#8A8174]">Completed on {b.date}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#2A1E1B]">{b.amount}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8A8174] text-center py-4">No past bookings recorded yet.</p>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-[#8B5E3C] hover:bg-[#724B2F] text-white text-xs font-bold shadow-md transition-all"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}