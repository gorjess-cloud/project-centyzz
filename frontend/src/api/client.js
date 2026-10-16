async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json();

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
};
