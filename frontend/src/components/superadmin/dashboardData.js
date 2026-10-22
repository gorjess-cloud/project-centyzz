export const metrics = [
  { title: 'Managed accounts', subtitle: 'Your community, at a glance', label: 'Total accounts', icon: 'users', items: [
    { label: 'Active', value: 198, color: '#7d9276' }, { label: 'Inactive', value: 36, color: '#d1ae64' },
    { label: 'Suspended', value: 14, color: '#b9aa97' }, { label: 'Deleted', value: 8, color: '#bd7865' },
  ] },
  { title: 'Password reset requests', subtitle: 'Account access & recovery', label: 'Total requests', icon: 'key', items: [
    { label: 'Requested', value: 18, color: '#c5a05b' }, { label: 'Pending', value: 6, color: '#a99c88' },
    { label: 'Expired', value: 3, color: '#c48370' },
  ] },
  { title: 'Security audit alerts', subtitle: 'Keep an eye on what matters', label: 'Total alerts', icon: 'shield', items: [
    { label: 'High', value: 2, color: '#b86e5d' }, { label: 'Medium', value: 5, color: '#d0ad65' },
    { label: 'Low', value: 7, color: '#84977d' },
  ] },
];

export const activity = [
  { id: 'AUD-1048', name: 'Millicent Campillos', role: 'Admin', action: 'Changed', subject: 'Changed service price for Hair Coloring', category: 'Services', time: '10:05 AM', date: '21 Aug 2026', tone: 'sage' },
  { id: 'AUD-1047', name: 'Millicent Campillos', role: 'Admin', action: 'Updated', subject: 'Updated salon operating hours', category: 'Settings', time: '10:03 AM', date: '21 Aug 2026', tone: 'gold' },
  { id: 'AUD-1046', name: 'Millicent Campillos', role: 'Admin', action: 'Deleted', subject: 'Removed discontinued Hair Treatment', category: 'Services', time: '09:48 AM', date: '21 Aug 2026', tone: 'rose' },
  { id: 'AUD-1045', name: 'Millicent Campillos', role: 'Admin', action: 'Updated', subject: 'Updated client appointment #APT-2041', category: 'Schedule', time: '09:32 AM', date: '21 Aug 2026', tone: 'blue' },
  { id: 'AUD-1044', name: 'Aljean Mark Angeles', role: 'Super admin', action: 'Granted', subject: 'Granted reports access to the Admin role', category: 'Permissions', time: '09:15 AM', date: '21 Aug 2026', tone: 'sage' },
  { id: 'AUD-1043', name: 'Jessica Palma', role: 'Staff', action: 'Created', subject: 'Added a new client account', category: 'Clients', time: '09:02 AM', date: '21 Aug 2026', tone: 'gold' },
];
