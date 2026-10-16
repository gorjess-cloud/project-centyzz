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

export const api = {
  login: (credentials) => post('/api/auth/login', credentials),
  register: (user) => post('/api/auth/register', user),
  verifyEmail: (verification) => post('/api/auth/verify-email', verification),
  getMyAppointments: (token) => get('/api/appointments/mine', token),
  getServices: () => get('/api/services'),
  getAvailableSlots: (date, serviceId) =>
    get(`/api/appointments/available-slots?date=${encodeURIComponent(date)}&service_id=${encodeURIComponent(serviceId)}`),
  createMyAppointment: (token, appointment) =>
    post('/api/appointments/mine', appointment, token),
};
