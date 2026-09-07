(function () {
  'use strict';

  var CFG = window.__KRATOS__ || {};
  var USERNAME = CFG.username || 'Asesor de prueba';
  var STORAGE_KEY = 'kratos:advisor:v1:' + USERNAME;
  var ADVISOR = { id: 'current-advisor', name: USERNAME, role: 'Asesor', avatar: '' };

  var CAMPAIGNS = ['Todas las Campañas', 'Portabilidad Fibra 600MB', 'Plan Negocio Pyme', 'Upgrade Plan Móvil 5G', 'Paquete Triple Play Pro', 'Seguro Protección Familiar'];
  var PRODUCTS_CATALOG = [
    { name: 'Fibra Óptica 500MB Simétrica', category: 'Residencial', price: 299 },
    { name: 'Fibra Óptica 800MB Gamer + IP Fija', category: 'Residencial Premium', price: 390 },
    { name: 'Plan Negocio Fibra 1GB + 3 Líneas', category: 'Empresarial', price: 540 },
    { name: 'Portabilidad Móvil Ilimitada 5G', category: 'Móvil', price: 280 },
    { name: 'Triple Play Fibra 400MB + Streaming', category: 'Residencial', price: 340 },
    { name: 'Seguro Protección Plus Integral', category: 'Servicios Adicionales', price: 190 },
    { name: 'Ciberseguridad Pyme Cloud Endpoint', category: 'Empresarial', price: 420 }
  ];

  var INITIAL_LEADS_RAW = [
    { id: 'lead-101', clientName: 'Mariana Silva Morales', city: 'CDMX', campaign: 'Portabilidad Fibra 600MB', priority: 'alta' },
    { id: 'lead-102', clientName: 'Roberto Garza Treviño', city: 'Monterrey', campaign: 'Plan Negocio Pyme', priority: 'alta' },
    { id: 'lead-103', clientName: 'Andrea Beltrán Castro', city: 'Guadalajara', campaign: 'Upgrade Plan Móvil 5G', priority: 'media' },
    { id: 'lead-104', clientName: 'Fernando Páez Luna', city: 'Puebla', campaign: 'Portabilidad Fibra 600MB', priority: 'baja' },
    { id: 'lead-105', clientName: 'Sofía Domínguez Solís', city: 'Cancún', campaign: 'Paquete Triple Play Pro', priority: 'alta' },
    { id: 'lead-106', clientName: 'Jorge Alberto Rivas', city: 'Querétaro', campaign: 'Portabilidad Fibra 600MB', priority: 'alta' },
    { id: 'lead-107', clientName: 'Camila Herrera Vega', city: 'Tijuana', campaign: 'Upgrade Plan Móvil 5G', priority: 'baja' },
    { id: 'lead-108', clientName: 'Ignacio Valenzuela Prieto', city: 'Toluca', campaign: 'Plan Negocio Pyme', priority: 'media' }
  ];

  var INITIAL_SALES_RAW = [
    { id: 'sale-301', productName: 'Plan Negocio Fibra 1GB + 3 Líneas', category: 'Empresarial', amount: 540, paymentMethod: 'Tarjeta Domiciliada', status: 'aprobada', clientName: 'Roberto Garza Treviño', notes: 'Instalación programada para el martes.', dayOffset: 0 },
    { id: 'sale-302', productName: 'Paquete Gamer 800MB + IP Fija', category: 'Residencial Premium', amount: 390, paymentMethod: 'Transferencia SPEI', status: 'en_verificacion', clientName: 'Patricia Morales Soto', notes: 'Comprobante de domicilio cargado en el portal.', dayOffset: 0 },
    { id: 'sale-303', productName: 'Portabilidad Ilimitada 5G + Roaming', category: 'Móvil', amount: 280, paymentMethod: 'Tarjeta de Crédito', status: 'aprobada', clientName: 'Guillermo Estrada Ruiz', notes: 'SIM express enviada por paquetería.', dayOffset: 1 },
    { id: 'sale-304', productName: 'Triple Play Fibra 400MB + HBO Max', category: 'Residencial', amount: 340, paymentMethod: 'Débito Automático', status: 'auditada', clientName: 'Sandra Vivanco Meza', notes: 'Grabación de voz validada sin incidencias.', dayOffset: 1 },
    { id: 'sale-305', productName: 'Seguro Protección Hogar Plus', category: 'Servicios Adicionales', amount: 190, paymentMethod: 'Tarjeta de Crédito', status: 'rechazada', clientName: 'Héctor Cárdenas Gil', notes: 'Póliza digital enviada por WhatsApp y email.', dayOffset: 2 }
  ];

  /* ---------- icons ---------- */
  var ICONS = {
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    dollar: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    check: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    trendUp: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    trendDown: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
    fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    barChart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    pieChart: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    package: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sparkles: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 4.9a10 10 0 0 1 0 14.2"/>',
    phoneOff: '<path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.27a2 2 0 0 1 2.1-.45c.86.31 1.77.53 2.7.65A2 2 0 0 1 22 16.92z"/><line x1="23" y1="1" x2="1" y2="23"/>',
    alertTriangle: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  };
  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24">' + (ICONS[name] || '') + '</svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- seed & storage ---------- */
  function seed() {
    var leads = INITIAL_LEADS_RAW.map(function (l, i) {
      return {
        id: l.id, clientName: l.clientName,
        phone: '000 000 ' + String(i + 1).padStart(3, '0'),
        phone2: '', whatsappUser: '', zone: 'Demostración', assignedAt: new Date().toISOString(),
        city: 'Demostración', campaign: l.campaign,
        assignedAdvisorId: ADVISOR.id, assignedAdvisorName: ADVISOR.name,
        status: 'pendiente', lastContactAt: 'Sin gestión registrada',
        notes: 'Contacto de demostración asignado por Back Office.',
        priority: l.priority, attempts: 0, contactHistory: []
      };
    });
    var sales = INITIAL_SALES_RAW.map(function (s, i) {
      var d = new Date(); d.setDate(d.getDate() - Math.floor(i / 2));
      return {
        id: s.id, folio: 'VTA-2026-' + (8941 - i),
        advisorId: ADVISOR.id, advisorName: ADVISOR.name, advisorAvatar: '',
        clientName: s.clientName, clientPhone: '000 001 ' + String(i + 1).padStart(3, '0'),
        productName: s.productName, category: s.category, amount: s.amount,
        paymentMethod: s.paymentMethod, status: i === 4 ? 'rechazada' : s.status,
        notes: 'Venta de demostración', leadId: undefined,
        createdAt: d.toISOString(), timestamp: d.toISOString()
      };
    });
    return { leads: leads, sales: sales };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data.leads) && Array.isArray(data.sales) &&
          data.leads.every(function (l) { return typeof l.id === 'string' && typeof l.clientName === 'string'; }) &&
          data.sales.every(function (s) { return typeof s.id === 'string' && typeof s.amount === 'number'; })) {
          return data;
        }
      }
    } catch (e) { /* ignore */ }
    return seed();
  }

  var CALL_DISPOSITIONS = [["venta_cerrada","disposition-venta_cerrada","VENTA CERRADA","#00ff00"],["preventa","disposition-preventa","PREVENTA","#0b5394"],["agendado","disposition-agendado","AGENDADO","#ff9900"],["no_contesta","disposition-no_contesta","NO CONTESTA","#ffff00"],["buzon_de_voz","disposition-buzon_de_voz","BUZON DE VOZ","#bfe1f6"],["corta_llamada","disposition-corta_llamada","CORTA LLAMADA","#bfe1f6"],["en_ejecucion","disposition-en_ejecucion","EN EJECUCION","#3c4043"],["sin_cobertura","disposition-sin_cobertura","SIN COBERTURA","#ff0000"],["no_califica","disposition-no_califica","NO CALIFICA","#ffe599"],["no_desea","disposition-no_desea","NO DESEA","#783f04"],["contacto_con_terceros","disposition-contacto_con_terceros","CONTACTO CON TERCEROS","#13764f"],["desea_hogar","disposition-desea_hogar","DESEA HOGAR","#3c4043"],["servicio_activo","disposition-servicio_activo","SERVICIO ACTIVO","#3c4043"]];
  var state = load();
  // Contacto solicitado para probar la marcación desde la base existente.
  if (!state.leads.some(function (lead) { return String(lead.phone || '').replace(/\D/g, '') === '930929211'; })) {
    state.leads.unshift({
      id: 'lead-test-930929211', clientName: 'Contacto de prueba', phone: '930929211',
      phone2: '', whatsappUser: '', zone: '', city: '', campaign: '',
      assignedAt: new Date().toISOString(), assignedAdvisorId: ADVISOR.id,
      assignedAdvisorName: ADVISOR.name, status: 'pendiente',
      lastContactAt: 'Sin gestión registrada', notes: 'Prueba de marcación con MicroSIP.',
      priority: 'normal', managementHistory: []
    });
  }

  var storageError = false;
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageError = false; }
    catch (e) { storageError = true; }
    document.getElementById('storage-error').hidden = !storageError;
  }

  /* ---------- filters (per-section local state) ---------- */
  var leadsFilter = { search: '', status: 'todos', campaign: 'Todas las Campañas' };
  var salesFilter = { search: '', status: 'todos' };
  var activeTab = 'llamadas';
  var activeCallLead = null;
  var uploadPrefill = null;
  var uploadOpen = false;

  /* ---------- helpers ---------- */
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function statusBadge(status) {
    var map = {
      venta_cerrada: ['emerald', 'check', 'Venta Cerrada'],
      en_curso: ['blue', 'phone', 'En Llamada'],
      contactado: ['indigo', 'userCheck', 'Contactado'],
      rellamada: ['amber', 'clock', 'Rellamada'],
      no_contesta: ['slate', 'phone', 'No Contesta'],
      rechazado: ['rose', 'alertTriangle', 'No Interesado']
    };
    CALL_DISPOSITIONS.forEach(function (item) { map[item[0]] = [item[1], '', item[2]]; });
    var m = map[status] || ['slate', '', 'Pendiente'];
    return '<span class="status-badge ' + m[0] + '">' + (m[1] ? icon(m[1]) : '') + m[2] + '</span>';
  }
  function saleStatusBadge(status) {
    var map = {
      aprobada: ['emerald', 'check', 'Activa'],
      auditada: ['indigo', 'shield', 'Auditada QA'],
      en_verificacion: ['amber', 'clock', 'En Verificación'],
      rechazada: ['rose', '', 'Caída']
    };
    var m = map[status] || ['slate', '', status];
    return '<span class="status-badge ' + m[0] + '">' + (m[1] ? icon(m[1]) : '') + m[2] + '</span>';
  }

  /* ---------- render: header labels ---------- */
  function initStaticLabels() {
    document.getElementById('icon-user-chip').innerHTML = icon('user') + esc(USERNAME);
    document.getElementById('btn-logout').innerHTML = icon('logout') + 'Salir';
    document.getElementById('tab-btn-tablero').innerHTML = icon('dashboard') + 'Tablero y métricas';
    document.getElementById('tab-btn-llamadas').innerHTML = icon('phone') + 'Base de llamadas <span class="tab-count" id="count-llamadas"></span>';
    document.getElementById('tab-btn-ventas').innerHTML = icon('dollar') + 'Mis ventas <span class="tab-count" id="count-ventas"></span>';
  }

  /* ---------- render: metrics banner + kpis ---------- */
  function renderMetrics() {
    var leads = state.leads, sales = state.sales;
    document.getElementById('section-banner').innerHTML =
      '<div class="section-banner-left"><div class="section-banner-icon">' + icon('userCheck') + '</div>' +
      '<div><p class="section-banner-label">Mi gestión comercial</p><p class="section-banner-title">Bienvenido, ' + esc(USERNAME) + '</p></div></div>' +
      '<p class="section-banner-right">' + leads.length + ' contactos asignados por Back Office</p>';

    var todayStr = today();
    var cards = [
      { label: 'Ventas activas', value: sales.filter(function (s) { return s.status === 'aprobada' || s.status === 'auditada'; }).length, detail: 'Confirmadas o auditadas', icon: 'check', cls: 'emerald' },
      { label: 'Ventas caídas', value: sales.filter(function (s) { return s.status === 'rechazada'; }).length, detail: 'Ventas rechazadas', icon: 'trendDown', cls: 'rose' },
      { label: 'Ventas diarias', value: sales.filter(function (s) { return s.createdAt && s.createdAt.slice(0, 10) === todayStr; }).length, detail: 'Registradas hoy', icon: 'trendUp', cls: 'indigo' },
      { label: 'Mis ventas', value: sales.length, detail: sales.filter(function (s) { return s.status === 'en_verificacion'; }).length + ' pendientes de verificación', icon: 'fileText', cls: 'amber' }
    ];
    document.getElementById('kpi-grid').innerHTML = cards.map(function (c) {
      return '<div class="kpi-card"><div class="kpi-head"><span class="kpi-label">' + c.label + '</span>' +
        '<div class="kpi-icon ' + c.cls + '">' + icon(c.icon) + '</div></div>' +
        '<p class="kpi-value">' + c.value + '</p><p class="kpi-detail">' + c.detail + '</p></div>';
    }).join('');

    document.getElementById('count-llamadas').textContent = leads.length;
    document.getElementById('count-ventas').textContent = sales.length;
  }

  /* ---------- render: charts ---------- */
  function renderCharts() {
    var leads = state.leads, sales = state.sales;
    var statusCounts = { venta_cerrada: 0, contactado: 0, rellamada: 0, no_contesta: 0, rechazado: 0, pendiente: 0 };
    leads.forEach(function (l) { if (statusCounts[l.status] !== undefined) statusCounts[l.status]++; });
    var totalLeads = leads.length || 1;

    var hourlyData = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(); d.setDate(d.getDate() - 6 + i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      var calls = leads.reduce(function (n, l) { return n + (l.managementHistory || []).filter(function (h) { return h.slice(0, 10) === key; }).length; }, 0);
      var salesCount = sales.filter(function (s) { return s.createdAt && s.createdAt.slice(0, 10) === key; }).length;
      hourlyData.push({ label: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'), calls: calls, sales: salesCount });
    }
    var maxVal = Math.max(1, Math.max.apply(null, hourlyData.map(function (h) { return h.calls; }).concat(hourlyData.map(function (h) { return h.sales; }))));

    document.getElementById('chart-bars').innerHTML =
      '<div class="chart-card-head"><div><h3>' + icon('barChart') + 'Actividad comercial</h3><p>Últimos 7 días · Gestiones registradas y ventas</p></div>' +
      '<div class="chart-legend"><span><span class="legend-dot" style="background:var(--indigo-500)"></span>Gestiones</span><span><span class="legend-dot" style="background:var(--emerald-500)"></span>Ventas</span></div></div>' +
      '<div class="activity-summary"><div><span>Gestiones en el período</span><strong>' + hourlyData.reduce(function (n, d) { return n + d.calls; }, 0) + '</strong></div><div><span>Ventas en el período</span><strong>' + hourlyData.reduce(function (n, d) { return n + d.sales; }, 0) + '</strong></div><div><span>Escala del gráfico</span><strong>' + maxVal + '<small> registros</small></strong></div></div>' +
      '<div class="bar-chart">' + hourlyData.map(function (h) {
        var ch = Math.round((h.calls / maxVal) * 100), sh = Math.round((h.sales / maxVal) * 100);
        return '<div class="bar-col"><div class="bar-group">' +
          '<div class="bar indigo" style="height:' + ch + '%" title="' + h.calls + ' gestiones el ' + h.label + '"></div>' +
          '<div class="bar emerald" style="height:' + sh + '%" title="' + h.sales + ' ventas el ' + h.label + '"></div>' +
          '</div><span class="bar-label">' + h.label + '</span></div>';
      }).join('') + '</div>';

    function row(label, dotColor, count, cls) {
      var pct = Math.round((count / totalLeads) * 100);
      return '<div class="distribution-item' + (count === 0 ? ' empty' : '') + '"><div class="status-row-head"><span class="name">' + (dotColor ? '<span class="dot" style="background:' + dotColor + '"></span>' : '') + label + '</span>' +
        '<span class="val">' + count + ' (' + pct + '%)</span></div>' +
        '<div class="status-track"><div class="status-fill" style="width:' + pct + '%;background:' + (dotColor || '#94a3b8') + '"></div></div></div>';
    }
    document.getElementById('chart-status').innerHTML =
      '<div class="chart-card-head"><div><h3>' + icon('pieChart') + 'Distribución de contactos</h3><p>Tipificación actual de la base asignada</p></div><span class="base-total">' + leads.length + ' contactos</span></div>' +
      '<div class="status-bars">' +
      row('Pendientes de gestión', null, statusCounts.pendiente) +
      CALL_DISPOSITIONS.map(function (item) { return row(item[2], item[3], leads.filter(function (lead) { return lead.status === item[0]; }).length); }).join('') +
      '</div>';
  }

  /* ---------- render: call base table ---------- */
  function filteredLeads() {
    return state.leads.filter(function (l) {
      if (leadsFilter.status !== 'todos' && l.status !== leadsFilter.status) return false;
      if (leadsFilter.campaign !== 'Todas las Campañas' && l.campaign !== leadsFilter.campaign) return false;
      if (leadsFilter.search.trim()) {
        var q = leadsFilter.search.toLowerCase();
        return [l.clientName, l.phone, l.phone2, l.whatsappUser, l.zone, l.city, l.notes].some(function (value) { return String(value || '').toLowerCase().indexOf(q) > -1; });
      }
      return true;
    });
  }

  function callBaseTableHtml(leads, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var rowsHtml = leads.length === 0
      ? '<tr><td colspan="8" class="table-empty">' + icon('phone') + 'No se encontraron contactos en la base con los filtros seleccionados.</td></tr>'
      : leads.map(function (l) {
        return '<tr class="' + (l.status === 'en_curso' ? 'in-call' : '') + '" data-lead-id="' + l.id + '">' +
          '<td><div class="cell-name">' + esc(l.phone || '—') + '</div></td><td><div class="row-actions">' +
          '<button type="button" class="btn-call" data-action="call" data-lead-id="' + esc(l.id) + '" title="Gestionar llamada">' + icon('phone') + 'Llamar</button>' +
          '<button type="button" class="btn-icon-outline" data-action="sale" data-lead-id="' + esc(l.id) + '" ' + (l.status === 'venta_cerrada' ? 'disabled' : '') + ' title="Registrar venta directa" aria-label="Registrar venta directa">' + icon('check') + '</button></div></td>' +
          '<td><span class="cell-name">' + esc(l.phone2 || '—') + '</span></td>' +
          '<td>' + esc(l.whatsappUser || '—') + '</td>' +
          '<td><span class="cell-notes">' + esc(l.notes || 'Sin observaciones') + '</span></td>' +
          '<td>' + statusBadge(l.status) + '</td>' +
          '<td>' + esc(l.zone || l.city || '—') + '</td>' +
          '<td><span class="attempts-date">' + esc(l.assignedAt ? (isNaN(Date.parse(l.assignedAt)) ? l.assignedAt : new Date(l.assignedAt).toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'})) : '—') + '</span></td></tr>';
      }).join('');

    var filtersHtml = compact ? '' :
      '<div class="filters-grid">' +
      '<div class="field-with-icon">' + icon('search') + '<input type="text" id="input-search-leads" placeholder="Buscar por teléfono, WhatsApp o zona..." value="' + esc(leadsFilter.search) + '"></div>' +
      '<div class="field-with-icon">' + icon('filter') + '<select id="select-lead-status">' +
      ['todos:Todos los Estados', 'pendiente:Pendientes'].concat(CALL_DISPOSITIONS.map(function (item) { return item[0] + ':' + item[2]; }), ['contactado:Contactado (anterior)', 'rellamada:Rellamada (anterior)', 'rechazado:Rechazado (anterior)', 'en_curso:En llamada (anterior)'])
        .map(function (o) { var p = o.split(':'); return '<option value="' + p[0] + '"' + (leadsFilter.status === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '</select></div>' +
      '<select id="select-lead-campaign" class="plain-select">' +
      CAMPAIGNS.map(function (c) { return '<option value="' + esc(c) + '"' + (leadsFilter.campaign === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
      '</select></div>';

    var header = compact ? '' :
      '<div class="table-card-header"><div class="table-card-header-row"><div>' +
      '<h2 class="table-card-title">' + icon('phone') + 'Mi base de llamadas</h2>' +
      '<p class="table-card-subtitle">Tus contactos asignados por Back Office para llamadas y seguimiento.</p></div>' +
      '<span class="pill-badge">Asignado por Back Office</span></div>' + filtersHtml + '</div>';

    var footer = compact ? '' :
      '<div class="table-footer"><span>Mostrando ' + leads.length + ' contactos de ' + state.leads.length + ' totales en la base</span><span>Base de demostración</span></div>';

    return '<div class="table-card">' + header +
      '<div class="table-scroll"><table class="data-table"><thead><tr>' +
      '<th>Teléfono 1</th><th>Tipificación</th><th>Teléfono 2</th><th>Usuario WhatsApp</th><th>Observaciones</th><th>Estado</th><th>Zona</th><th>Hora asignada</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' + footer + '</div>';
  }

  function renderFullCallBase() {
    document.getElementById('full-call-base').innerHTML = callBaseTableHtml(filteredLeads());
  }

  /* ---------- render: sales feed ---------- */
  function filteredSales() {
    return state.sales.filter(function (s) {
      if (salesFilter.status !== 'todos' && s.status !== salesFilter.status) return false;
      if (salesFilter.search.trim()) {
        var q = salesFilter.search.toLowerCase();
        return s.folio.toLowerCase().indexOf(q) > -1 || s.clientName.toLowerCase().indexOf(q) > -1 ||
          s.advisorName.toLowerCase().indexOf(q) > -1 || s.productName.toLowerCase().indexOf(q) > -1 || s.clientPhone.indexOf(q) > -1;
      }
      return true;
    });
  }

  function salesFeedHtml(sales, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var rows = sales.length === 0
      ? '<div class="table-empty">' + icon('dollar') + 'No hay registros de ventas que coincidan con la búsqueda.</div>'
      : sales.map(function (s) {
        var dateStr = s.createdAt ? new Date(s.createdAt).toLocaleString('es-PE') : s.timestamp;
        return '<div class="sale-row" data-sale-id="' + s.id + '"><div class="sale-left">' +
          '<div class="sale-avatar">' + icon('user') + '</div><div>' +
          '<div class="sale-top-row"><span class="sale-folio">' + esc(s.folio) + '</span><span class="sale-client">' + esc(s.clientName) + '</span><span>•</span><span style="font-size:12px;color:var(--slate-500)">' + esc(s.clientPhone) + '</span></div>' +
          '<div class="sale-mid-row"><span class="sale-product">' + esc(s.productName) + '</span><span>•</span><span class="sale-category">' + esc(s.category) + '</span><span>•</span><span style="font-size:11px;color:var(--slate-500)">Asesor: <strong>' + esc(s.advisorName) + '</strong></span></div>' +
          (s.notes ? '<p class="sale-notes">"' + esc(s.notes) + '"</p>' : '') +
          '</div></div><div class="sale-right"><div><div class="sale-amount">$' + s.amount.toLocaleString() + '</div><div class="sale-date">' + esc(dateStr) + '</div></div>' +
          '<div class="sale-actions">' + saleStatusBadge(s.status) + '<button type="button" class="btn-detail" data-action="sale-detail" data-sale-id="' + s.id + '" title="Ver detalles completos">' + icon('fileText') + '</button></div></div></div>';
      }).join('');

    var header = compact ? '' :
      '<div class="table-card-header"><div class="table-card-header-row"><div>' +
      '<h2 class="table-card-title">' + icon('dollar') + 'Mis ventas</h2>' +
      '<p class="table-card-subtitle">Tus ventas registradas, su estado y sus observaciones.</p></div>' +
      '<button type="button" id="btn-trigger-upload-sale" class="btn btn-emerald">' + icon('plus') + 'Subir Nueva Venta</button></div>' +
      '<div class="filters-grid sales">' +
      '<div class="field-with-icon">' + icon('search') + '<input type="text" id="input-search-sales" placeholder="Buscar por folio, cliente, asesor o producto..." value="' + esc(salesFilter.search) + '"></div>' +
      '<div class="field-with-icon">' + icon('filter') + '<select id="select-sale-status">' +
      ['todos:Todos los Estados de Venta', 'aprobada:Activas', 'en_verificacion:En Verificación', 'auditada:Auditadas', 'rechazada:Caídas']
        .map(function (o) { var p = o.split(':'); return '<option value="' + p[0] + '"' + (salesFilter.status === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '</select></div></div></div>';

    return '<div class="table-card">' + header + '<div class="sales-list">' + rows + '</div></div>';
  }

  function renderFullSalesFeed() {
    document.getElementById('full-sales-feed').innerHTML = salesFeedHtml(filteredSales());
  }

  /* ---------- full render ---------- */
  function renderAll() {
    renderMetrics();
    renderCharts();
    renderFullCallBase();
    renderFullSalesFeed();
  }

  /* ---------- tabs ---------- */
  function setTab(tab) {
    activeTab = tab;
    ['tablero', 'llamadas', 'ventas'].forEach(function (t) {
      document.getElementById('panel-' + t).hidden = t !== tab;
      document.getElementById('tab-btn-' + t).classList.toggle('active', t === tab);
    });
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function showToast(title, description, type) {
    var root = document.getElementById('toast-root');
    root.innerHTML = '<div class="toast" role="status"><div class="toast-inner">' +
      '<div class="toast-icon">' + icon(type === 'call' ? 'phone' : 'dollar') + '</div><div style="flex:1">' +
      '<div class="toast-top"><span class="toast-badge">' + (type === 'call' ? 'Llamada Registrada' : 'Venta registrada') + '</span>' +
      '<button type="button" class="toast-close" id="btn-toast-close">' + icon('x') + '</button></div>' +
      '<h4 class="toast-title">' + esc(title) + '</h4><p class="toast-desc">' + esc(description) + '</p>' +
      '<div class="toast-footer"><span>Asesor: <strong>' + esc(USERNAME) + '</strong></span><span>Ahora</span></div></div></div></div>';
    document.getElementById('btn-toast-close').addEventListener('click', dismissToast);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(dismissToast, 5500);
  }
  function dismissToast() { document.getElementById('toast-root').innerHTML = ''; if (toastTimer) clearTimeout(toastTimer); }

  /* ---------- confetti (lightweight) ---------- */
  function burstConfetti() {
    var colors = ['#10B981', '#3B82F6', '#6366F1', '#F59E0B'];
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:70;overflow:hidden;';
    document.body.appendChild(container);
    for (var i = 0; i < 40; i++) {
      var p = document.createElement('span');
      var size = 6 + Math.random() * 6;
      p.style.cssText = 'position:absolute;left:' + (45 + Math.random() * 10) + '%;top:70%;width:' + size + 'px;height:' + size + 'px;' +
        'background:' + colors[i % colors.length] + ';border-radius:' + (Math.random() > .5 ? '50%' : '2px') + ';opacity:.95;';
      var dx = (Math.random() - 0.5) * 360, dy = -(200 + Math.random() * 220), rot = Math.random() * 720 - 360;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)', opacity: 1, offset: 0.7 },
        { transform: 'translate(' + dx + 'px,' + (dy + 260) + 'px) rotate(' + (rot * 1.4) + 'deg)', opacity: 0 }
      ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.25,.46,.45,.94)' });
      container.appendChild(p);
    }
    setTimeout(function () { container.remove(); }, 1700);
  }

  /* ---------- upload sale modal ---------- */
  function openUploadModal(prefill) {
    uploadPrefill = prefill || null;
    uploadOpen = true;
    renderUploadModal();
  }
  function closeUploadModal() {
    uploadOpen = false;
    document.getElementById('modal-root').innerHTML = '';
  }
  function renderUploadModal() {
    if (!uploadOpen) return;
    var p0 = PRODUCTS_CATALOG[0];
    var clientName = uploadPrefill ? uploadPrefill.name : '';
    var clientPhone = uploadPrefill ? uploadPrefill.phone : '';
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" id="upload-modal-backdrop"><div class="modal-card md" role="dialog" aria-modal="true" aria-label="Registrar venta">' +
      '<div class="modal-head emerald"><div class="modal-head-left"><div class="modal-head-icon">' + icon('dollar') + '</div>' +
      '<div><h2>Subir Registro de Venta</h2><p>Registra tu venta y envíala a verificación.</p></div></div>' +
      '<button type="button" class="modal-close" id="btn-close-upload">' + icon('x') + '</button></div>' +
      '<form id="form-upload-sale" class="modal-body">' +
      '<div id="upload-form-error"></div>' +
      '<div class="form-group"><label>Asesor que realizó la venta</label><select disabled>' +
      '<option>' + esc(ADVISOR.name) + ' (Asesor)</option></select></div>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Nombre Completo del Cliente</label><div class="field-with-icon">' + icon('user') + '<input type="text" id="input-client-name" required placeholder="Ej. Laura González Peña" value="' + esc(clientName) + '"></div></div>' +
      '<div class="form-group"><label>Teléfono de Contacto</label><div class="field-with-icon">' + icon('phone') + '<input type="tel" id="input-client-phone" required placeholder="Número de contacto" value="' + esc(clientPhone) + '"></div></div>' +
      '</div><div class="form-grid">' +
      '<div class="form-group"><label>Producto o Plan Vendido</label><div class="field-with-icon">' + icon('package') + '<select id="select-product">' +
      PRODUCTS_CATALOG.map(function (p) { return '<option value="' + esc(p.name) + '" data-price="' + p.price + '" data-cat="' + esc(p.category) + '">' + esc(p.name) + ' ($' + p.price + ')</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="form-group"><label>Monto Facturado ($)</label><div class="field-with-icon">' + icon('dollar') + '<input type="number" id="input-amount" min="1" step="0.01" required value="' + p0.price + '"></div></div>' +
      '</div><div class="form-grid">' +
      '<div class="form-group"><label>Método de Pago</label><div class="field-with-icon">' + icon('card') + '<select id="select-payment">' +
      ['Tarjeta Domiciliada', 'Tarjeta de Crédito', 'Transferencia bancaria', 'Débito Automático', 'Pago en sucursal'].map(function (m) { return '<option>' + m + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="form-group"><label>Estado Inicial de Validación</label><select id="select-status" disabled>' +
      '<option value="en_verificacion" selected>En verificación (Pendiente docs)</option></select></div>' +
      '</div>' +
      '<div class="form-group"><label>Observaciones / Número de Contrato / Folio</label><div class="field-with-icon">' + icon('fileText') + '<textarea id="input-notes" rows="2" placeholder="Ej. Grabación de aceptación guardada en carpeta #44."></textarea></div></div>' +
      '<div class="form-actions"><button type="button" class="btn-outline" id="btn-cancel-upload">Cancelar</button>' +
      '<button type="submit" class="btn-close-sale">' + icon('check') + 'Confirmar y Subir Venta</button></div>' +
      '</form></div></div>';

    document.getElementById('btn-close-upload').addEventListener('click', closeUploadModal);
    document.getElementById('btn-cancel-upload').addEventListener('click', closeUploadModal);
    document.getElementById('upload-modal-backdrop').addEventListener('click', function (e) { if (e.target.id === 'upload-modal-backdrop') closeUploadModal(); });
    document.getElementById('select-product').addEventListener('change', function (e) {
      var opt = e.target.selectedOptions[0];
      document.getElementById('input-amount').value = opt.getAttribute('data-price');
    });
    document.getElementById('form-upload-sale').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('input-client-name').value.trim();
      var phone = document.getElementById('input-client-phone').value.trim();
      var amount = Number(document.getElementById('input-amount').value);
      if (!name || !phone || !isFinite(amount) || amount <= 0) {
        document.getElementById('upload-form-error').innerHTML = '<div class="modal-form-error">Ingresa nombre, teléfono y un importe válido mayor que cero.</div>';
        return;
      }
      var prodOpt = document.getElementById('select-product').selectedOptions[0];
      var sale = {
        id: uid(), folio: 'KRT-' + new Date().getFullYear() + '-' + uid().slice(3, 11).toUpperCase(),
        advisorId: ADVISOR.id, advisorName: ADVISOR.name, advisorAvatar: '',
        clientName: name, clientPhone: phone,
        productName: prodOpt.value, category: prodOpt.getAttribute('data-cat'), amount: amount,
        paymentMethod: document.getElementById('select-payment').value,
        status: 'en_verificacion', notes: document.getElementById('input-notes').value.trim(),
        leadId: uploadPrefill ? uploadPrefill.leadId : undefined,
        createdAt: new Date().toISOString(), timestamp: new Date().toISOString()
      };
      if (sale.leadId && state.sales.some(function (s) { return s.leadId === sale.leadId; })) { closeUploadModal(); return; }
      state.sales.unshift(sale);
      if (sale.leadId) {
        state.leads = state.leads.map(function (l) { return l.id === sale.leadId ? Object.assign({}, l, { status: 'venta_cerrada', notes: uploadPrefill && uploadPrefill.managementNotes !== undefined ? uploadPrefill.managementNotes : l.notes }) : l; });
      }
      persist(); renderAll();
      try { burstConfetti(); } catch (err) { /* ignore */ }
      showToast('¡Venta registrada!', name + ' · Pendiente de verificación', 'sale');
      closeUploadModal();
    });
  }

  /* ---------- active call modal ---------- */
  var callNotesVal = '', callStatusVal = '';
  function dialWithMicroSip(lead) {
    var number = String(lead.phone || '').replace(/[\s().-]/g, '');
    if (!/^\+?[1-9]\d{2,14}$/.test(number)) {
      var entered = window.prompt('Este contacto tiene un teléfono de ejemplo. Ingresa el número que deseas llamar con MicroSIP:');
      if (entered === null) return;
      number = entered.replace(/[\s().-]/g, '');
      if (!/^\+?\d{3,15}$/.test(number) || /^0+$/.test(number)) {
        showToast('Número no válido', 'Ingresa un teléfono o extensión válido.', 'call');
        return;
      }
    }
    openCallModal(lead);
    var note = document.querySelector('.call-tag-note');
    if (note) note.textContent = 'Marcación solicitada: ' + number;
    window.location.href = 'callto:' + encodeURIComponent(number);
  }
  function openCallModal(lead) {
    activeCallLead = lead; callNotesVal = lead.notes || ''; callStatusVal = '';
    renderCallModal();

  }
  function closeCallModal() {
    activeCallLead = null;
    document.getElementById('modal-root').innerHTML = '';
  }

  function finishCall(newStatus) {
    if (newStatus === 'venta_cerrada') return;
    var extra = {};
    if (newStatus === 'sin_cobertura') {
      var coordinates = document.getElementById('call-coordinates');
      var parts = coordinates.value.trim().split(',').map(function (v) { return v.trim(); });
      if (parts.length !== 2 || parts.some(function (v) { return !v || !isFinite(Number(v)); }) || Math.abs(Number(parts[0])) > 90 || Math.abs(Number(parts[1])) > 180) {
        coordinates.setCustomValidity('Ingresa latitud y longitud válidas separadas por coma.'); coordinates.reportValidity(); return;
      }
      coordinates.setCustomValidity(''); extra.coordinates = coordinates.value.trim();
    }
    if (newStatus === 'preventa') {
      var doc = document.getElementById('call-document');
      if (!doc.value.trim()) { doc.setCustomValidity('Ingresa el número de documento.'); doc.reportValidity(); return; }
      doc.setCustomValidity(''); extra.documentType = document.getElementById('call-document-type').value; extra.documentNumber = doc.value.trim();
    }
    var lead = activeCallLead;
    state.leads = state.leads.map(function (l) {
      if (l.id !== lead.id) return l;
      var hist = (l.managementHistory || []).concat([new Date().toISOString()]);
      return Object.assign({}, l, { status: newStatus, notes: callNotesVal, lastContactAt: new Date().toLocaleString('es-PE'), managementHistory: hist }, extra);
    });
    persist(); renderAll();
    showToast('Gestión guardada', 'Estado y observaciones actualizados.', 'call');
    closeCallModal();
  }
  function convertCallToSale() {
    var lead = activeCallLead;
    if (!lead) return;
    if (state.sales.some(function (s) { return s.leadId === lead.id; })) { showToast('Venta ya registrada', 'Consulta el registro en Mis ventas.', 'sale'); return; }
    var draftNotes = callNotesVal;
    closeCallModal();
    openUploadModal({ name: lead.clientName, phone: lead.phone, leadId: lead.id, managementNotes: draftNotes });
  }
  function renderCallModal() {
    var lead = activeCallLead;
    if (!lead) return;
    var assigned = lead.assignedAt ? (isNaN(Date.parse(lead.assignedAt)) ? lead.assignedAt : new Date(lead.assignedAt).toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'})) : '—';
    var details = [['Teléfono 1', lead.phone], ['Teléfono 2', lead.phone2], ['Usuario WhatsApp', lead.whatsappUser], ['Zona', lead.zone || lead.city], ['Hora asignada', assigned]];
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" id="call-modal-backdrop"><div class="modal-card lg" role="dialog" aria-modal="true" aria-label="Gestión de llamada">' +
      '<div class="call-topbar"><div class="call-topbar-left"><div class="call-avatar">' + icon('phone') + '</div><div><span class="call-tag">Gestión de llamada</span><span class="call-tag-note">Registro manual</span><h3>' + esc(lead.phone) + '</h3></div></div></div>' +
      '<div class="modal-body"><div class="call-info-grid">' + details.map(function (item) { return '<div><span class="label">' + item[0] + '</span><span class="value">' + esc(item[1] || '—') + '</span></div>'; }).join('') + '</div>' +
      '<div class="form-group"><label for="call-notes">Observaciones</label><textarea id="call-notes" rows="4" placeholder="Escribe el resultado de la llamada y los acuerdos con el contacto...">' + esc(callNotesVal) + '</textarea></div>' +
      '<div class="form-group"><label id="call-status-label">Tipificación · Estado de la llamada</label><div class="disposition-grid" role="group" aria-labelledby="call-status-label">' +
      CALL_DISPOSITIONS.map(function (item) { return '<button type="button" class="disposition-btn ' + item[1] + '" data-finish="' + item[0] + '" aria-pressed="false">' + item[2] + '</button>'; }).join('') +
      '</div><p id="call-status-help" role="status" style="font-size:12px;color:var(--text-muted)">Selecciona un estado para guardar la gestión.</p></div>' +
      '<div id="call-coverage-fields" class="form-group" hidden><label for="call-coordinates">Coordenadas · Latitud, longitud</label><input id="call-coordinates" type="text" placeholder="Ej. -12.0464, -77.0428" value="' + esc(lead.coordinates || '') + '"></div>' +
      '<div id="call-presale-fields" class="form-group" hidden><label for="call-document-type">Documento de preventa</label><select id="call-document-type"><option>DNI</option><option>RUC</option><option>CE</option></select><label for="call-document">Número de documento</label><input id="call-document" type="text" placeholder="Ingresa DNI, RUC o CE" value="' + esc(lead.documentNumber || '') + '"></div>' +
      '<div class="call-actions"><button type="button" class="btn-outline" id="btn-cancel-call">Cancelar</button><button type="button" class="btn-outline" id="btn-hangup">' + icon('check') + 'Guardar gestión</button><button type="button" class="btn-close-sale" id="btn-convert-sale">' + icon('check') + 'Registrar venta</button></div></div></div></div>';
    document.getElementById('call-document-type').value = lead.documentType || 'DNI';
    document.getElementById('call-notes').addEventListener('input', function (e) { callNotesVal = e.target.value; });
    document.querySelectorAll('[data-finish]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        callStatusVal = btn.getAttribute('data-finish');
        document.getElementById('btn-hangup').hidden = callStatusVal === 'venta_cerrada';
        document.getElementById('call-coverage-fields').hidden = callStatusVal !== 'sin_cobertura';
        document.getElementById('call-presale-fields').hidden = callStatusVal !== 'preventa';
        document.querySelectorAll('[data-finish]').forEach(function (option) { option.setAttribute('aria-pressed', String(option === btn)); });
        document.getElementById('call-status-help').textContent = 'Estado seleccionado: ' + btn.textContent;
      });
    });
    document.getElementById('btn-cancel-call').addEventListener('click', closeCallModal);
    document.getElementById('btn-hangup').addEventListener('click', function () {
      if (!callStatusVal) { document.getElementById('call-status-help').textContent = 'Selecciona el estado de la llamada antes de guardar.'; return; }
      finishCall(callStatusVal);
    });
    document.getElementById('btn-convert-sale').addEventListener('click', convertCallToSale);
  }

  /* ---------- sale detail modal ---------- */
  function openSaleDetail(sale) {
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" id="detail-modal-backdrop"><div class="modal-card sm">' +
      '<div class="modal-head dark"><div><span style="font-size:11px;font-family:ui-monospace,monospace;font-weight:700;color:#818cf8">' + esc(sale.folio) + '</span><h3>Detalles de Venta</h3></div>' +
      '<button type="button" class="modal-close" id="btn-close-detail">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
      detailRow('Cliente:', esc(sale.clientName)) + detailRow('Teléfono:', esc(sale.clientPhone)) +
      detailRow('Asesor:', esc(sale.advisorName)) + detailRow('Producto:', esc(sale.productName)) +
      detailRow('Monto Facturado:', '<span style="color:var(--emerald-600);font-family:ui-monospace,monospace;font-weight:800">$' + sale.amount.toLocaleString() + '</span>') +
      detailRow('Método de Pago:', esc(sale.paymentMethod)) + detailRow('Estado:', saleStatusBadge(sale.status)) +
      '<div><span style="color:var(--slate-500);font-weight:600;display:block;margin-bottom:4px;">Notas / Observaciones:</span>' +
      '<p style="background:var(--slate-50);padding:10px;border-radius:12px;border:1px solid var(--slate-200);color:var(--slate-700);margin:0;">' + esc(sale.notes || 'Sin observaciones registradas.') + '</p></div>' +
      '<div class="form-actions"><button type="button" class="btn-dark" id="btn-accept-detail" style="border-radius:12px;">Aceptar</button></div>' +
      '</div></div></div>';
    function detailRow(label, value) {
      return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--slate-100);font-size:12px;"><span style="color:var(--slate-500);font-weight:600;">' + label + '</span><span style="font-weight:700;color:var(--slate-800);text-align:right">' + value + '</span></div>';
    }
    var close = function () { document.getElementById('modal-root').innerHTML = ''; };
    document.getElementById('btn-close-detail').addEventListener('click', close);
    document.getElementById('btn-accept-detail').addEventListener('click', close);
    document.getElementById('detail-modal-backdrop').addEventListener('click', function (e) { if (e.target.id === 'detail-modal-backdrop') close(); });
  }

  /* ---------- csv export ---------- */
  /* ---------- event delegation ---------- */
  function findLead(id) { return state.leads.find(function (l) { return l.id === id; }); }
  function findSale(id) { return state.sales.find(function (s) { return s.id === id; }); }

  function tryOpenSaleFor(lead) {
    if (state.sales.some(function (s) { return s.leadId === lead.id; })) { showToast('Venta ya registrada', 'Consulta el registro en Mis ventas.', 'sale'); return; }
    openUploadModal({ name: lead.clientName, phone: lead.phone, leadId: lead.id });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;

    var gotoBtn = t.closest('[data-goto]');
    if (gotoBtn) { setTab(gotoBtn.getAttribute('data-goto')); return; }

    var tabBtn = t.closest('.tab-btn');
    if (tabBtn) { setTab(tabBtn.getAttribute('data-tab')); return; }

    var callBtn = t.closest('[data-action="call"]');
    if (callBtn) { var lead = findLead(callBtn.getAttribute('data-lead-id')); if (lead) dialWithMicroSip(lead); return; }

    var saleBtn = t.closest('[data-action="sale"]');
    if (saleBtn && !saleBtn.disabled) { var l2 = findLead(saleBtn.getAttribute('data-lead-id')); if (l2) tryOpenSaleFor(l2); return; }

    var detailBtn = t.closest('[data-action="sale-detail"]');
    if (detailBtn) { var s = findSale(detailBtn.getAttribute('data-sale-id')); if (s) openSaleDetail(s); return; }

    if (t.closest('#btn-trigger-upload-sale')) { openUploadModal(null); return; }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'input-search-leads') { leadsFilter.search = e.target.value; renderFullCallBase(); }
    if (e.target.id === 'input-search-sales') { salesFilter.search = e.target.value; renderFullSalesFeed(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'select-lead-status') { leadsFilter.status = e.target.value; renderFullCallBase(); }
    if (e.target.id === 'select-lead-campaign') { leadsFilter.campaign = e.target.value; renderFullCallBase(); }
    if (e.target.id === 'select-sale-status') { salesFilter.status = e.target.value; renderFullSalesFeed(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (uploadOpen) closeUploadModal();
      if (activeCallLead) closeCallModal();
    }
  });

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initStaticLabels();
    setTab('llamadas');
    renderAll();
    document.getElementById('storage-error').hidden = !storageError;
    persist();
  });
})();
