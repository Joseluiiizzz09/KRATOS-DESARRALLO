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
  const response = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('No se pudo exportar el archivo.');
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const api = {
  login: (usuario, password) => request('/auth/login', { method: 'POST', body: { usuario, password } }),
  me: (token) => request('/auth/me', { token }),
  getLeads: (token) => request('/leads', { token }),
  updateLead: (token, id, changes) => request(`/leads/${id}`, { method: 'PATCH', body: changes, token }),
  getSales: (token) => request('/sales', { token }),
  createSale: (token, sale) => request('/sales', { method: 'POST', body: sale, token }),

  /* Back Office */
  boAdvisors: (token) => request('/backoffice/advisors', { token }),
  boLeads: (token, params) => request(`/backoffice/leads${toQuery(params)}`, { token }),
  boCreateLead: (token, lead) => request('/backoffice/leads', { method: 'POST', body: lead, token }),
  boUpdateLead: (token, id, lead) => request(`/backoffice/leads/${id}`, { method: 'PUT', body: lead, token }),
  boAssign: (token, ids, advisorId) => request('/backoffice/leads/assign', { method: 'POST', body: { ids, advisorId }, token }),
  boImport: (token, csv) => request('/backoffice/leads/import', { method: 'POST', body: { csv }, token }),
  boExportLeads: (token, params) => download(`/backoffice/leads/export${toQuery(params)}`, token, 'kratos-backoffice.csv'),
  boSales: (token, params) => request(`/backoffice/sales${toQuery(params)}`, { token }),
  boTracking: (token, id, changes) => request(`/backoffice/sales/${id}/tracking`, { method: 'PATCH', body: changes, token }),
  boObservation: (token, id, body) => request(`/backoffice/sales/${id}/observation`, { method: 'POST', body, token }),
  boExportSales: (token, params) => download(`/backoffice/sales/export${toQuery(params)}`, token, 'kratos-seguimiento.csv'),
  boCampaigns: (token) => request('/backoffice/campaigns', { token }),
  boRotate: (token, fromAdvisorId, toAdvisorIds) => request('/backoffice/leads/rotate', { method: 'POST', body: { fromAdvisorId, toAdvisorIds }, token }),
  boReportAdvisors: (token) => request('/backoffice/reports/advisors', { token }),
  boReportPerformance: (token, days) => request(`/backoffice/reports/performance${toQuery({ days })}`, { token }),

  /* Supervisor */
  supAdvisors: (token) => request('/supervisor/advisors', { token }),
  supMetrics: (token) => request('/supervisor/metrics', { token }),
  supLeads: (token, params) => request(`/supervisor/leads${toQuery(params)}`, { token }),
  supSales: (token, params) => request(`/supervisor/sales${toQuery(params)}`, { token }),
};
