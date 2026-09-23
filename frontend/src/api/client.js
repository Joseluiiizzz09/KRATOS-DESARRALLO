const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001/api';

/** Envoltorio de fetch: agrega el token, arma JSON y lanza con el mensaje del backend. */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error al comunicarse con el servidor.');
  }
  return data;
}

export const api = {
  login: (usuario, password) => request('/auth/login', { method: 'POST', body: { usuario, password } }),
  me: (token) => request('/auth/me', { token }),
  getLeads: (token) => request('/leads', { token }),
  updateLead: (token, id, changes) => request(`/leads/${id}`, { method: 'PATCH', body: changes, token }),
  getSales: (token) => request('/sales', { token }),
  createSale: (token, sale) => request('/sales', { method: 'POST', body: sale, token }),
};
