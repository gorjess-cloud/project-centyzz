// Presentation metadata only. All counts come from the protected backend API.
export function buildDashboardMetrics(data) {
  return [
    {
      title: 'Managed accounts', subtitle: 'Account status across all roles', label: 'Total accounts', icon: 'users',
      items: [
        { label: 'Active', value: data.accounts.active, color: '#7d9276' },
        { label: 'Inactive', value: data.accounts.inactive, color: '#d1ae64' },
        { label: 'Archived', value: data.accounts.archived, color: '#bd7865' },
      ],
      footer: `${data.totalUsers.toLocaleString()} registered accounts`,
      footnote: 'No suspended/deleted status in schema',
    },
    {
      title: 'Verification & recovery', subtitle: 'Currently stored email codes', label: 'Stored codes', icon: 'key',
      items: [
        { label: 'Email verification', value: data.codes.verification, color: '#c5a05b' },
        { label: 'Password recovery', value: data.codes.recovery, color: '#a99c88' },
        { label: 'Expired', value: data.codes.expired, color: '#c48370' },
      ],
      footer: `${data.codes.recovery} active recovery codes`,
      footnote: 'Not historical reset requests',
    },
    {
      title: 'Recorded system errors', subtitle: 'Server errors by occurrence', label: 'Error records', icon: 'shield',
      items: [
        { label: 'Past 24 hours', value: data.errors.last24Hours, color: '#b86e5d' },
        { label: '1–7 days ago', value: data.errors.previous6Days, color: '#d0ad65' },
        { label: 'Older', value: data.errors.older, color: '#84977d' },
      ],
      footer: `${data.errors.last24Hours} in the past 24 hours`,
      footnote: 'Error logs, not security alerts',
    },
  ];
}

const actions = {
  USER_ROLE_CHANGED: { label: 'Role changed', tone: 'sage', subject: 'User role updated' },
  USER_ARCHIVED: { label: 'Archived', tone: 'rose', subject: 'User account archived' },
  PRICE_CHANGED: { label: 'Price changed', tone: 'gold', subject: 'Service price updated' },
};

export const auditActionOptions = [
  { value: '', label: 'All actions' },
  { value: 'USER_ROLE_CHANGED', label: 'Role changed' },
  { value: 'USER_ARCHIVED', label: 'Archived user' },
  { value: 'PRICE_CHANGED', label: 'Price changed' },
];

export function formatAuditLog(log) {
  const action = actions[log.action] || {
    label: String(log.action || 'Action').replaceAll('_', ' ').toLowerCase(),
    tone: 'blue',
    subject: 'System record changed',
  };
  const timestamp = new Date(log.createdAt);
  const isValidDate = !Number.isNaN(timestamp.getTime());
  const dateOptions = { timeZone: 'Asia/Manila' };
  const role = String(log.actorRole || 'UNKNOWN').toLowerCase();
  const category = String(log.entityType || 'SYSTEM');
  return {
    id: String(log.id),
    name: log.actorName || 'Unknown user',
    role: role === 'superadmin' ? 'Superadmin' : role.charAt(0).toUpperCase() + role.slice(1),
    action: action.label,
    rawAction: log.action,
    subject: `${action.subject}${log.entityId ? ` (#${log.entityId})` : ''}`,
    category: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase(),
    date: isValidDate ? timestamp.toLocaleDateString('en-PH', { ...dateOptions, day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown date',
    time: isValidDate ? timestamp.toLocaleTimeString('en-PH', { ...dateOptions, hour: 'numeric', minute: '2-digit', hour12: true }) : '—',
    tone: action.tone,
  };
}
