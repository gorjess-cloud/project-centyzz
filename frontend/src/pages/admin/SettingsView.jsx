import HeaderActions from '../../components/workspace/HeaderActions';
import { useState } from 'react';
import { 
  CheckCircle2, 
  Building2, 
  Clock, 
  Users, 
  Receipt, 
  Save,
  Plus
} from 'lucide-react';

export default function SettingsView({ showHeaderActions = true }) {
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Salon Profile Form State
  const [profileForm, setProfileForm] = useState({
    salonName: "Centy'zz Hair & Beauty Studio",
    address: 'Unit A, Block 15 Lot 2, Bagumbong, Caloocan City',
    phone: '0917 187 2638',
    email: 'support@centyzzsalon.com',
    tin: '123-456-789-000'
  });

  // Operating Hours State
  const [hoursForm, setHoursForm] = useState({
    tueSun: '09:00 AM - 07:00 PM',
    mondayClosed: true,
    slotInterval: '30 mins',
    bufferTime: '10 mins'
  });

  // POS & Inventory Settings State
  const [posForm, setPosForm] = useState({
    currency: 'PHP (₱)',
    taxRate: '12%',
    lowStockThreshold: '5',
    autoReorderAlert: true
  });

  // Staff Users Mock State
  const [staffUsers] = useState([
    { id: '1', name: 'Millicent Campillos', email: 'MillicentCampillos@example.com', role: 'SUPERADMIN' },
    { id: '2', name: 'Aljean Mark Angeles', email: 'aljean@example.com', role: 'ADMIN' },
    { id: '3', name: 'Staff 2', email: 'staff2@example.com', role: 'STAFF' }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast('Settings successfully updated and saved!');
  };

  const renderRoleBadge = (role) => {
    if (role === 'SUPERADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFE8D6] text-[#D97706] text-[9px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" /> SUPERADMIN
        </span>
      );
    }
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] text-[9px] font-bold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-[#137333]" /> ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F1F3F4] text-[#5F6368] text-[9px] font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9AA0A6]" /> STAFF
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

      {/* Header Bar */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#2A1E1B] truncate">Settings & Configuration</h1>
          <p className="mt-0.5 text-xs text-[#8A8174] truncate">
            Manage salon profile, operating hours, security roles, and system preferences
          </p>
        </div>

        {showHeaderActions && (<HeaderActions />)}
      </header>

      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-[#E7DFD4] shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Horizontal Pill Tabs Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-[#F8F5F0] p-1.5 rounded-xl border border-[#E7DFD4]">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'profile' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <Building2 size={14} /> Salon Profile
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'hours' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <Clock size={14} /> Operating Hours
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'staff' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <Users size={14} /> Staff & Roles
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pos' ? 'bg-[#2A1E1B] text-white shadow-xs' : 'text-[#8A8174] hover:text-[#2A1E1B]'
            }`}
          >
            <Receipt size={14} /> POS & Inventory
          </button>
        </div>

        {/* TAB 1: SALON PROFILE */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 animate-fadeIn">
            <div className="border-b border-[#E7DFD4] pb-3">
              <h3 className="text-base font-bold text-[#2A1E1B]">Salon Profile & Branding</h3>
              <p className="text-xs text-[#8A8174]">Core business details used for receipts, invoices, and purchase orders</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Salon Name</label>
                <input
                  type="text"
                  value={profileForm.salonName}
                  onChange={(e) => setProfileForm({ ...profileForm, salonName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Contact Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Physical Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Business Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">TIN Number</label>
                <input
                  type="text"
                  value={profileForm.tin}
                  onChange={(e) => setProfileForm({ ...profileForm, tin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: OPERATING HOURS */}
        {activeTab === 'hours' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 animate-fadeIn">
            <div className="border-b border-[#E7DFD4] pb-3">
              <h3 className="text-base font-bold text-[#2A1E1B]">Operating Hours & Scheduling</h3>
              <p className="text-xs text-[#8A8174]">Control business availability and client booking slot windows</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Tuesday – Sunday Schedule</label>
                <input
                  type="text"
                  value={hoursForm.tueSun}
                  onChange={(e) => setHoursForm({ ...hoursForm, tueSun: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Appointment Slot Interval</label>
                <select
                  value={hoursForm.slotInterval}
                  onChange={(e) => setHoursForm({ ...hoursForm, slotInterval: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                >
                  <option value="15 mins">15 mins</option>
                  <option value="30 mins">30 mins</option>
                  <option value="1 hour">1 hour</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="mondayClosed"
                checked={hoursForm.mondayClosed}
                onChange={(e) => setHoursForm({ ...hoursForm, mondayClosed: e.target.checked })}
                className="rounded border-gray-300 text-[#8B5E3C] focus:ring-0 cursor-pointer w-4 h-4"
              />
              <label htmlFor="mondayClosed" className="text-xs font-medium text-[#2A1E1B] cursor-pointer">
                Automatically mark Mondays as Closed for salon maintenance and rest.
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: STAFF & ROLES */}
        {activeTab === 'staff' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#E7DFD4] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#2A1E1B]">Staff & Role Permissions</h3>
                <p className="text-xs text-[#8A8174]">Manage team member access levels (Superadmin, Admin, Staff)</p>
              </div>
              <button
                onClick={() => showToast('Invite team member modal opened')}
                className="bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Staff
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E7DFD4]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F5F0] text-[10px] uppercase font-bold text-[#8A8174] tracking-wider border-b border-[#E7DFD4]">
                    <th className="p-4 pl-6">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4 text-center">Assigned Role</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7DFD4]/60 text-xs font-sans">
                  {staffUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-4 pl-6 font-bold text-[#2A1E1B]">{user.name}</td>
                      <td className="p-4 text-[#8A8174]">{user.email}</td>
                      <td className="p-4 text-center">{renderRoleBadge(user.role)}</td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => showToast(`Editing permissions for ${user.name}`)}
                          className="text-xs font-bold text-[#8B5E3C] hover:underline"
                        >
                          Edit Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: POS & INVENTORY */}
        {activeTab === 'pos' && (
          <form onSubmit={handleSaveSettings} className="space-y-5 animate-fadeIn">
            <div className="border-b border-[#E7DFD4] pb-3">
              <h3 className="text-base font-bold text-[#2A1E1B]">POS & Inventory Preferences</h3>
              <p className="text-xs text-[#8A8174]">Configure currency, tax calculations, and automated reorder rules</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Currency</label>
                <input
                  type="text"
                  readOnly
                  value={posForm.currency}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-gray-100 text-xs font-bold text-[#2A1E1B]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Default Tax / VAT Rate</label>
                <input
                  type="text"
                  value={posForm.taxRate}
                  onChange={(e) => setPosForm({ ...posForm, taxRate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8174] mb-1">Low-Stock Default Alert Threshold (Units)</label>
              <input
                type="number"
                value={posForm.lowStockThreshold}
                onChange={(e) => setPosForm({ ...posForm, lowStockThreshold: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7DFD4] bg-[#F8F5F0] text-xs font-medium text-[#2A1E1B] outline-none focus:border-[#C5A059]"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-[#8B5E3C] hover:bg-[#724B2F] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}