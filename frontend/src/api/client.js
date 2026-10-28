export async function readJsonResponse(response) {
  const body = await response.text();

  if (!body.trim()) return {};

  try {
    return JSON.parse(body);
  } catch {
    throw new Error('The server returned an invalid response.');
  }
}

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const result = await readJsonResponse(response);

  if (!response.ok) {
    const message = Array.isArray(result.message)
      ? result.message.join(' ')
      : result.message || 'The request could not be completed.';
    throw new Error(message);
  }

  return result;
}

async function get(path, token) {
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const result = await readJsonResponse(response);

  if (!response.ok) {
    const message = Array.isArray(result.message)
      ? result.message.join(' ')
      : result.message || 'The request could not be completed.';
    throw new Error(message);
  }

  return result;
}

async function patch(path, body, token) {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const result = await readJsonResponse(response);
  if (!response.ok) {
    const message = Array.isArray(result.message) ? result.message.join(' ') : result.message || 'The request could not be completed.';
    throw new Error(message);
  }
  return result;
}

export const api = {
  login: (credentials) => post('/api/auth/login', credentials),

  googleLogin: (idToken) => post('/api/auth/google', { idToken }),
  verifyManagementPin: (challengeToken, pin) => post('/api/auth/verify-management-pin', { challengeToken, pin }),
  completeManagementSetup: (setupToken, data) => post('/api/auth/complete-management-setup', { setupToken, ...data }),
  verifyActionPin: (token, pin) => post('/api/auth/check-action-pin', { pin }, token),
  changeManagementCredentials: (token, data) => patch('/api/auth/management-credentials', data, token),
  
  register: (user) => post('/api/auth/register', user),
  verifyEmail: (verification) => post('/api/auth/verify-email', verification),
  forgotPassword: (payload) => post('/api/auth/forgot-password', payload),
  resetPassword: (payload) => post('/api/auth/reset-password', payload),
  getSuperadminDashboardSummary: (token) => get('/api/superadmin/dashboard/summary', token),
  getSuperadminAuditLogs: (token, { page = 1, limit = 10, search = '', action = '' } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (action) params.set('action', action);
    return get(`/api/superadmin/logs?${params.toString()}`, token);
  },
  getMyAppointments: (token) => get('/api/appointments/mine', token),
  getMyProfile: (token) => get('/api/auth/me', token),
  updateMyProfile: (token, profile) => patch('/api/auth/me', profile, token),
  getServices: () => get('/api/services'),
  getPublicPromos: () => get('/api/promos'),
  getStaffAppointments: (token,archived=false) => get('/api/appointments/staff'+(archived?'?archived=true':''), token),
  updateStaffAppointmentStatus: (token, id, status) =>
    patch(`/api/appointments/${encodeURIComponent(id)}/staff-status`, { status }, token),
  validatePromo: (promoCode) => post('/api/promos/validate', { promoCode }),
  getGuestStylists: () => get('/api/appointments/stylists'),
  getGuestAvailableSlots: (date, serviceId, stylistId) =>
    get(`/api/appointments/guest-availability?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(serviceId)}&stylist_id=${encodeURIComponent(stylistId)}`),
  createGuestCheckout: (booking) => post('/api/appointments/guest-checkout', booking),
  finishGuestDemo: (appointmentId, token) =>
    post(`/api/appointments/guest-demo/${encodeURIComponent(appointmentId)}/complete`, { token }),
  getGuestCalendar: (reference, token) => post('/api/appointments/guest-calendar', { reference, token }),
  getAppointmentCalendar: (id, token) => get(`/api/appointments/${encodeURIComponent(id)}/calendar`, token),
  getGuestCheckoutStatus: (reference, token) =>
    get(`/api/appointments/guest-checkout-status?reference=${encodeURIComponent(reference)}&token=${encodeURIComponent(token)}`),
  getAvailableSlots: (date, serviceId) =>
    get(`/api/appointments/available-slots?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(serviceId)}`),
  createMyAppointment: (token, appointment) =>
    post('/api/appointments/mine', appointment, token),
};
