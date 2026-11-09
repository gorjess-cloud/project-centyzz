// Used only by the explicitly marked frontend preview, never as a live-data fallback.
export const previewSummary = {
  totalUsers: 72,
  accounts: { active: 62, inactive: 6, archived: 4 },
  codes: { verification: 3, recovery: 2, expired: 1 },
  errors: { last24Hours: 2, previous6Days: 5, older: 12 },
};

const previewEvents = [
  { id: '1062', actorName: 'Aljean Mark Angeles', actorRole: 'SUPERADMIN', action: 'USER_ROLE_CHANGED', entityType: 'USER', entityId: '24' },
  { id: '1061', actorName: 'Millicent Campillos', actorRole: 'ADMIN', action: 'PRICE_CHANGED', entityType: 'SERVICE', entityId: '8' },
  { id: '1060', actorName: 'Aljean Mark Angeles', actorRole: 'SUPERADMIN', action: 'USER_ARCHIVED', entityType: 'USER', entityId: '18' },
  { id: '1059', actorName: 'Millicent Campillos', actorRole: 'ADMIN', action: 'PRICE_CHANGED', entityType: 'SERVICE', entityId: '12' },
  { id: '1058', actorName: 'Aljean Mark Angeles', actorRole: 'SUPERADMIN', action: 'USER_ROLE_CHANGED', entityType: 'USER', entityId: '31' },
  { id: '1057', actorName: 'Aljean Mark Angeles', actorRole: 'SUPERADMIN', action: 'USER_ARCHIVED', entityType: 'USER', entityId: '9' },
];

const previewTime = Date.now();
export const previewAuditLogs = previewEvents.map((event, index) => ({
  ...event,
  createdAt: new Date(previewTime - (index + 1) * 17 * 60 * 1000).toISOString(),
}));

export const defaultMaintenancePreview = {
  enabled: false,
  message: 'We’re making a few improvements. Please check back shortly.',
  duration: '1 hour',
  updatedAt: null,
};

export function createPreviewBackups() {
  return [0, 1, 2].map((days, index) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    date.setHours(8, 0, 0, 0);
    return {
      id: `sample-backup-${index + 1}`,
      name: `centyzz-${date.toLocaleDateString('en-CA')}.backup`,
      createdAt: date.toISOString(),
      sizeMb: [148, 146, 145][index],
      type: index === 0 ? 'Manual' : 'Scheduled',
      status: 'Preview ready',
    };
  });
}
