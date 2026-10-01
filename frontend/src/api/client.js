import { ncHeaders } from '../operaciones/services/api.js';

const API_URL = import.meta.env.VITE_API_URL || '/api/kr';

/** Envoltorio de fetch: agrega la sesión (y el "ver como" de Jefatura), arma JSON y lanza con el mensaje del backend. */
async function request(path, { method = 'GET', body } = {}) {
  const headers = ncHeaders();

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.mensaje || 'Ocurrió un error al comunicarse con el servidor.');
  }
  return data;
}

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

/** Descarga un CSV protegido: se pide con el token y se guarda como archivo. */
async function download(path, token, fileName) {
  const response = await fetch(`${API_URL}${path}`, { headers: ncHeaders() });
  if (!response.ok) throw new Error('No se pudo exportar el archivo.');
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const api = {
  getLeads: (token) => request('/leads', { token }),
  updateLead: (token, id, changes) => request(`/leads/${id}`, { method: 'PATCH', body: changes, token }),
  getSales: (token) => request('/sales', { token }),
  createSale: (token, sale) => request('/sales', { method: 'POST', body: sale, token }),

  /* Supervisor */
  supAdvisors: (token) => request('/supervisor/advisors', { token }),
  supMetrics: (token) => request('/supervisor/metrics', { token }),
  supLeads: (token, params) => request(`/supervisor/leads${toQuery(params)}`, { token }),
  supSales: (token, params) => request(`/supervisor/sales${toQuery(params)}`, { token }),
  supUpdateSale: (token, id, sale) => request(`/supervisor/sales/${id}`, { method: 'PATCH', body: sale, token }),
};
