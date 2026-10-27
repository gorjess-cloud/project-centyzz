// Safe public fields for the shared User Management table.
// Never include password hashes, PIN hashes, reset tokens, or verification codes.
export function managementUserRecord(user: any) {
  const firstName = String(user.firstName || user.first_name || '');
  const lastName = String(user.lastName || user.last_name || '');
  const created = user.createdAt || user.created_at;
  const archived = Boolean(user.archivedAt ?? user.archived_at);
  const active = Boolean(user.isActive ?? user.is_active);
  return {
    id: user.id,
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.trim() || user.email,
    email: user.email,
    role: String(user.role || 'STAFF').toUpperCase().replace(/[\s_-]+/g, ''),
    status: active ? 'ACTIVE' : 'INACTIVE',
    isActive: active,
    isArchived: archived,
    dateCreated: created ? new Date(created).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    }) : 'N/A',
  };
}
