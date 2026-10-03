import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App.jsx';

// Si la sesión venció (el servidor responde 401), se limpia y se vuelve al login en vez de mostrar pantallas vacías.
const fetchOriginal = window.fetch.bind(window);
window.fetch = async (...args) => {
  const respuesta = await fetchOriginal(...args);
  const url = String(typeof args[0] === 'string' ? args[0] : args[0]?.url || '');
  if (respuesta.status === 401 && url.includes('/api/') && !url.includes('/api/login') && window.location.pathname !== '/login') {
    try { sessionStorage.clear(); } catch { /* sin almacenamiento */ }
    window.location.assign('/login');
  }
  return respuesta;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
