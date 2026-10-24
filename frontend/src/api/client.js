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
  
  register: (user) => post('/api/auth/register', user),
  forgotPassword: ({ email }) => post('/api/auth/forgot-password', { email }),
  resetPassword: ({ email, otp, newPassword }) =>
    post('/api/auth/reset-password', { email, otp, newPassword }),
  verifyEmail: (verification) => post('/api/auth/verify-email', verification),
  getMyAppointments: (token) => get('/api/appointments/mine', token),
  getMyProfile: (token) => get('/api/auth/me', token),
  updateMyProfile: (token, profile) => patch('/api/auth/me', profile, token),
  getServices: () => get('/api/services'),
  getPublicPromos: () => get('/api/promos'),
  getStaffAppointments: (token) => get('/api/appointments/staff', token),
  updateStaffAppointmentStatus: (token, id, status) =>
    patch(`/api/appointments/${encodeURIComponent(id)}/staff-status`, { status }, token),
  validatePromo: (promoCode) => post('/api/promos/validate', { promoCode }),
  getAvailableSlots: (date, serviceId) =>
    get(`/api/appointments/available-slots?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(serviceId)}`),
  createMyAppointment: (token, appointment) =>
    post('/api/appointments/mine', appointment, token),
};
