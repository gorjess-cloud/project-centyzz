/**
 * Visual-only management workspace shown behind mandatory first-login setup.
 * Deliberately does NOT render AdminLayout or fetch protected data: the user's
 * setup token cannot access the authenticated dashboard until onboarding ends.
 */
export default function ManagementSetupDashboardPreview({ role = 'ADMIN' }) {
  const normalizedRole = String(role || 'ADMIN').toUpperCase();
  const isStaff = normalizedRole === 'STAFF';
  const isSuperadmin = normalizedRole === 'SUPERADMIN';
  const roleTitle = isStaff ? 'Staff Workspace' : isSuperadmin ? 'Superadmin Dashboard' : 'Admin Dashboard';
  const navItems = isStaff
    ? ['POS', 'Schedule', 'Inventory', 'Settings']
    : isSuperadmin
      ? ['Dashboard', 'Users', 'Services', 'Clients', 'Inventory', 'Reports', 'Settings']
      : ['Dashboard', 'Users', 'Services', 'Clients', 'Inventory', 'Reports', 'Settings'];
  const metricLabels = isStaff
    ? ['Today’s Sales', 'Transactions', 'Upcoming Appointments', 'Available Services']
    : ['Total Sales', 'Appointments', 'Active Clients', 'Services'];

  return (
    <div
      className="pointer-events-none flex h-screen w-full select-none overflow-hidden bg-[#F6F4EF] text-[#443523]"
      aria-hidden="true"
    >
      <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-[#E5DED4] bg-[#FAF8F4] px-5 py-7 md:flex lg:w-64">
        <div className="mb-11 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#534436] text-xl font-semibold text-white">C</div>
          <div>
            <div className="text-lg font-bold tracking-wide">CENTYZZ</div>
            <div className="text-[11px] tracking-widest text-[#8B7A68]">HAIR & BEAUTY SALON</div>
          </div>
        </div>
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-[#A99A87]">Workspace</p>
        <div className="space-y-1.5">
          {navItems.map((item, index) => (
            <div
              key={item}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${index === 0 ? 'bg-[#E8DED2] font-semibold text-[#483829]' : 'text-[#7F7161]'}`}
            >
              <span className={`h-4 w-4 rounded-[5px] border ${index === 0 ? 'border-[#846B50] bg-[#A58A69]/30' : 'border-[#C6B8A6]'}`} />
              {item}
            </div>
          ))}
        </div>
        <div className="mt-auto rounded-2xl bg-[#EEE9E0] p-4 text-sm">
          <div className="font-semibold">Account setup</div>
          <div className="mt-1 text-xs text-[#8B7A68]">Complete setup to enter your workspace.</div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-[#E6DED3] bg-[#FFFEFC]/90 px-6 lg:px-10">
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-[#9C8D7D]">Overview</div>
            <h1 className="mt-1 text-xl font-bold sm:text-2xl">{roleTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden h-9 w-32 rounded-xl bg-[#EEE8DF] sm:block" />
            <div className="h-10 w-10 rounded-full bg-[#DCC9B4]" />
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-7 px-6 py-8 lg:px-10">
          <div>
            <div className="text-2xl font-bold">Welcome to Centyzz</div>
            <div className="mt-2 text-sm text-[#978776]">Here’s your salon workspace at a glance.</div>
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {metricLabels.map((label, index) => (
              <div key={label} className="h-36 rounded-2xl border border-[#EAE3D9] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8E806F]">{label}</span>
                  <span className="h-8 w-8 rounded-lg bg-[#EFE7DD]" />
                </div>
                <div className="mt-5 h-7 w-20 rounded-lg bg-[#E7DFD4]" />
                <div className={`mt-3 h-2 rounded bg-[#F0EBE3] ${index % 2 ? 'w-24' : 'w-16'}`} />
              </div>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
            <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
              <div className="mb-6 text-base font-semibold">Activity Overview</div>
              <div className="flex h-48 items-end justify-between gap-3 border-b border-[#EFE9DF] pb-2">
                {[33, 55, 45, 74, 62, 87, 69, 91, 65, 81, 58, 76].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-lg bg-[#CAB59C]" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[#EAE3D9] bg-white p-6 shadow-sm">
              <div className="mb-6 text-base font-semibold">Recent Activity</div>
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="mb-5 flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-[#E9DECF]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-4/5 rounded bg-[#EAE3D9]" />
                    <div className="h-2 w-1/2 rounded bg-[#F0EBE3]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
