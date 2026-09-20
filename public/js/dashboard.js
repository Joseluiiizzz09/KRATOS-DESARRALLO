(function () {
  'use strict';

  var CFG = window.__KRATOS__ || {};
  var USERNAME = CFG.username || 'Asesor de prueba';
  var STORAGE_KEY = 'kratos:advisor:v1:' + USERNAME;
  var SIDEBAR_STATE_KEY = 'kratos:sidebar-collapsed:v1:' + USERNAME;
  var ADVISOR = { id: 'current-advisor', name: USERNAME, role: 'Asesor', avatar: '' };

  var CAMPAIGNS = ['Todas las Campañas', 'Portabilidad Fibra 600MB', 'Plan Negocio Pyme', 'Upgrade Plan Móvil 5G', 'Paquete Triple Play Pro', 'Seguro Protección Familiar'];
  var PRODUCTS_CATALOG = [
    { name: 'Plan Max 29.90', category: 'Plan Max', price: 29.90 },
    { name: 'Plan Max 39.90', category: 'Plan Max', price: 39.90 },
    { name: 'Plan Max 49.90', category: 'Plan Max', price: 49.90 },
    { name: 'Plan Max 56.90', category: 'Plan Max', price: 56.90 },
    { name: 'Plan Max 60.90', category: 'Plan Max', price: 60.90 },
    { name: 'Plan Max Ilimitado 69.90', category: 'Plan Max Ilimitado', price: 69.90 },
    { name: 'Plan Max Ilimitado 79.90', category: 'Plan Max Ilimitado', price: 79.90 },
    { name: 'Plan Max Ilimitado 95.90', category: 'Plan Max Ilimitado', price: 95.90 },
    { name: 'Plan Max Ilimitado 109.90', category: 'Plan Max Ilimitado', price: 109.90 },
    { name: 'Plan Max Ilimitado 159.90', category: 'Plan Max Ilimitado', price: 159.90 },
    { name: 'Plan Max Ilimitado 189.90', category: 'Plan Max Ilimitado', price: 189.90 },
    { name: 'Plan Max Ilimitado 289.90', category: 'Plan Max Ilimitado', price: 289.90 }
  ];
  var DOCUMENT_TYPES = ['DNI', 'RUC', 'CE'];
  var SALE_TYPES = ['Alta', 'Portabilidad', 'Renovación'];

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
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userCheck: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    dollar: '<circle cx="12" cy="12" r="9"/><line x1="12" y1="7" x2="12" y2="17"/><path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 3 5 1.5 5 4.5a2.5 2.5 0 0 1-5 0"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checkCircle: '<circle cx="12" cy="12" r="9"/><polyline points="9 12 11 14 15 10"/>',
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
    whatsapp: '<path d="M20 11.8a8 8 0 0 1-11.7 7.1L4 20l1.2-4.1A8 8 0 1 1 20 11.8Z"/><path d="M9.2 7.8c.5 2.9 2.2 4.7 5 5.4l1.3-1.2 1.8 1c-.2 1.1-1 1.8-2.2 1.8-4 0-7.3-3.3-7.3-7.3 0-1.1.7-2 1.8-2.2l1 1.8-1.4 1.1Z"/>',
    alertTriangle: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  };
  function icon(name, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function avatarColorClass(name) {
    var palette = ['avatar-indigo', 'avatar-emerald', 'avatar-amber', 'avatar-rose', 'avatar-cyan', 'avatar-violet'];
    var hash = 0;
    for (var i = 0; i < (name || '').length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
    }
    return palette[Math.abs(hash) % palette.length];
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
        notes: 'Contacto de demostración asignado por Back Office.', advisorNote: '',
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
        if (Array.isArray(data.leads) && Array.isArray(data.sales) && data.leads.length > 0 &&
          data.leads.every(function (l) { return typeof l.id === 'string' && typeof l.clientName === 'string'; }) &&
          data.sales.every(function (s) { return typeof s.id === 'string' && typeof s.amount === 'number'; })) {
          return data;
        }
      }
    } catch (e) { /* ignore */ }
    return seed();
  }

  var CALL_DISPOSITIONS = [
    ["venta_cerrada","disposition-venta_cerrada","Venta Cerrada","#10b981"],
    ["preventa","disposition-preventa","Preventa","#3b82f6"],
    ["agendado","disposition-agendado","Agendado","#f59e0b"],
    ["no_contesta","disposition-no_contesta","No Contesta","#eab308"],
    ["buzon_de_voz","disposition-buzon_de_voz","Buzón de Voz","#38bdf8"],
    ["corta_llamada","disposition-corta_llamada","Corta Llamada","#94a3b8"],
    ["en_ejecucion","disposition-en_ejecucion","En Ejecución","#818cf8"],
    ["sin_cobertura","disposition-sin_cobertura","Sin Cobertura","#f43f5e"],
    ["no_califica","disposition-no_califica","No Califica","#fb923c"],
    ["no_desea","disposition-no_desea","No Desea","#e11d48"],
    ["contacto_con_terceros","disposition-contacto_con_terceros","Contacto con Terceros","#14b8a6"],
    ["desea_hogar","disposition-desea_hogar","Desea Hogar","#6366f1"],
    ["servicio_activo","disposition-servicio_activo","Servicio Activo","#64748b"]
  ];
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
  function normalizeStoredLeadNotes() {
    state.leads = state.leads.map(function (lead) {
      return Object.assign({}, lead, { advisorNote: normalizedAdvisorNote(lead) });
    });
  }
  function persist() {
    normalizeStoredLeadNotes();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageError = false; }
    catch (e) { storageError = true; }
    document.getElementById('storage-error').hidden = !storageError;
    if (operationsReady) queueOperationsSync();
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
      venta_cerrada: ['emerald', 'Venta Cerrada'],
      en_curso: ['blue', 'En Llamada'],
      contactado: ['indigo', 'Contactado'],
      rellamada: ['amber', 'Rellamada'],
      no_contesta: ['yellow', 'No Contesta'],
      rechazado: ['rose', 'No Interesado']
    };
    CALL_DISPOSITIONS.forEach(function (item) { map[item[0]] = [item[1], item[2]]; });
    var trackingLabels = {instalado:'Instalado',caida:'Caída',rechazo_campo:'Rechazo en campo',tecnico_casa:'Técnicos en casa',levantar_sot:'Levantar SOT',tecnicos_camino:'Técnicos en camino',instalado_no_validado:'Instalado no validado',reasignacion:'Reasignación',derivado_planta_externa:'Derivado a planta externa',rechazo:'Rechazo',rechazo_mesa:'Rechazo en mesa'};
    if (trackingLabels[status]) map[status] = [status === 'instalado' ? 'emerald' : 'slate', trackingLabels[status]];
    var m = map[status] || ['slate', 'Pendiente'];
    return '<span class="status-badge ' + m[0] + '"><span class="status-dot"></span><span class="status-text">' + m[1] + '</span></span>';
  }
  function saleStatusBadge(status) {
    var map = {
      aprobada: ['emerald', 'Activa'],
      auditada: ['indigo', 'Auditada QA'],
      en_verificacion: ['amber', 'En Verificación'],
      rechazada: ['rose', 'Caída']
    };
    var m = map[status] || ['slate', status];
    return '<span class="status-badge ' + m[0] + '"><span class="status-dot"></span><span class="status-text">' + m[1] + '</span></span>';
  }
  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '—';
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  /* ---------- render: header labels ---------- */
  function initStaticLabels() {
    var userEl = document.getElementById('icon-user-chip');
    if (userEl) {
      userEl.innerHTML = '<span class="user-chip-avatar">' + esc(initials(USERNAME)) + '</span><span class="user-chip-info"><strong class="user-chip-name">' + esc(USERNAME) + '</strong><span class="user-chip-sub">Asesor Comercial</span></span>';
    }
    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.innerHTML = icon('logout') + '<span>Cerrar sesión</span>';
    }
    document.getElementById('tab-btn-tablero').innerHTML = icon('dashboard') + '<span>Tablero y métricas</span>';
    document.getElementById('tab-btn-llamadas').innerHTML = icon('phone') + '<span>Base de llamadas</span>';
    document.getElementById('tab-btn-ventas').innerHTML = icon('receipt') + '<span>Mis ventas</span>';
  }
  function setSidebarCollapsed(collapsed) {
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    var toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral');
      toggle.title = collapsed ? 'Mostrar menú' : 'Ocultar menú';
    }
    try { localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? '1' : '0'); } catch (err) {}
  }
  function initSidebarToggle() {
    setSidebarCollapsed(false);
    var toggle = document.getElementById('sidebar-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
      });
    }
    // When the panel is hidden, its toggle hides with it — clicking the
    // page title brings the panel back.
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('sidebar-collapsed') &&
        e.target.closest('.table-card-title, .section-banner-title, .chart-card-head h3')) {
        setSidebarCollapsed(false);
      }
    });
  }

  /* ---------- render: metrics banner + kpis ---------- */
  function renderMetrics() {
    var leads = state.leads, sales = state.sales;
    document.getElementById('section-banner').innerHTML =
      '<div class="section-banner-left"><div class="section-banner-icon">' + icon('userCheck') + '</div>' +
      '<div><p class="section-banner-label">Gestión Comercial</p><h2 class="section-banner-title">Panel de Asesor · ' + esc(USERNAME) + '</h2></div></div>' +
      '<div class="section-banner-right"><span class="status-live-dot"></span> ' + leads.length + ' contactos asignados en cartera</div>';

    var todayStr = today();
    var cards = [
      { label: 'Ventas activas', value: sales.filter(function (s) { return s.status === 'aprobada' || s.status === 'auditada'; }).length, detail: 'Confirmadas y validadas', icon: 'check', cls: 'emerald' },
      { label: 'Ventas caídas', value: sales.filter(function (s) { return s.status === 'rechazada'; }).length, detail: 'Rechazos u objeciones', icon: 'trendDown', cls: 'rose' },
      { label: 'Ventas del día', value: sales.filter(function (s) { return s.createdAt && s.createdAt.slice(0, 10) === todayStr; }).length, detail: 'Registradas en la jornada', icon: 'trendUp', cls: 'indigo' },
      { label: 'Total registradas', value: sales.length, detail: sales.filter(function (s) { return s.status === 'en_verificacion'; }).length + ' pendientes de validación', icon: 'fileText', cls: 'amber' }
    ];
    document.getElementById('kpi-grid').innerHTML = cards.map(function (c) {
      return '<div class="kpi-card"><div class="kpi-head"><span class="kpi-label">' + c.label + '</span>' +
        '<div class="kpi-icon ' + c.cls + '">' + icon(c.icon) + '</div></div>' +
        '<p class="kpi-value">' + c.value + '</p><p class="kpi-detail">' + c.detail + '</p></div>';
    }).join('');
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
      '<div class="chart-card-head"><div><h3>' + icon('pieChart') + 'Distribución de contactos</h3><p>Gestión actual de la base asignada</p></div><span class="base-total">' + leads.length + ' contactos</span></div>' +
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
    var statusFilters = [
      ['todos', 'Todos'], ['pendiente', 'Pendiente'], ['contactado', 'Contactado'],
      ['agendado', 'Agendado'], ['venta_cerrada', 'Venta'], ['no_contesta', 'No contesta']
    ];
    var filterChips = statusFilters.map(function (item) {
      var count = item[0] === 'todos' ? state.leads.length : state.leads.filter(function (lead) { return lead.status === item[0]; }).length;
      return '<button type="button" class="call-filter-chip ' + (leadsFilter.status === item[0] ? 'active' : '') + '" data-lead-status="' + item[0] + '"><span></span>' + item[1] + '<b>' + count + '</b></button>';
    }).join('');
    var rowsHtml = leads.length === 0
      ? '<tr><td colspan="4" class="table-empty">' + icon('phone') + '<p>No se encontraron contactos en la base con los filtros seleccionados.</p></td></tr>'
      : leads.map(function (l) {
        var advisorNote = normalizedAdvisorNote(l);
        return '<tr class="' + (l.status === 'en_curso' ? 'in-call' : '') + '" data-lead-id="' + l.id + '">' +
          '<td><div class="contact-cell"><strong>' + esc(l.phone || '—') + '</strong><div class="row-actions">' +
          '<button type="button" class="btn-call" data-action="call" data-lead-id="' + esc(l.id) + '" title="Gestionar llamada con MicroSIP" aria-label="Llamar">' + icon('phone') + '</button>' +
          '<button type="button" class="btn-icon-sale btn-whatsapp-sale" data-action="whatsapp" data-lead-id="' + esc(l.id) + '" title="Abrir WhatsApp" aria-label="Abrir WhatsApp">' + icon('whatsapp') + '</button></div>' +
          (l.phone2 ? '<small>Alt. ' + esc(l.phone2) + '</small>' : '') + '</div></td>' +
          '<td><div class="cell-notes" title="' + esc(l.notes || '') + '">' + esc(l.notes || 'Sin observaciones') + '</div></td>' +
          '<td>' + statusBadge(l.status) + '</td>' +
          '<td><input type="text" class="input-advisor-note" data-lead-id="' + esc(l.id) + '" placeholder="Agregar observación" value="' + esc(advisorNote) + '"></td></tr>';
      }).join('');

    var today = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
    var header = compact ? '' :
      '<div class="table-card-header lead-toolbar"><div class="table-card-header-row lead-toolbar-main"><div>' +
      '<h2 class="table-card-title">Base de llamadas</h2>' +
      '<p class="table-card-subtitle"><strong>' + leads.length + '</strong> registros en pantalla · <strong>' + state.leads.filter(function (lead) { return lead.status === 'pendiente'; }).length + '</strong> pendientes de gestión</p>' +
      '</div><div class="table-card-header-actions lead-toolbar-actions">' +
      '<div class="field-with-icon lead-search-field">' + icon('search') + '<input type="text" id="input-search-leads" placeholder="Filtrar número" value="' + esc(leadsFilter.search) + '"></div>' +
      '<span class="pill-date">' + esc(today) + '</span></div></div></div>';

    var footer = compact ? '' :
      '<div class="table-footer"><span>Mostrando ' + leads.length + ' de ' + state.leads.length + ' contactos asignados</span><span class="table-footer-source">Cartera activa</span></div>';

    return '<div class="lead-table-layout">' + header + (compact ? '' : '<div class="call-filter-bar">' + filterChips + '</div>') + '<div class="table-card lead-table-card">' +
      '<div class="table-scroll"><table class="data-table"><thead><tr>' +
      '<th>Contacto</th><th>Registro del back</th><th>Estado</th><th>Mi observación</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div>' + footer + '</div></div>';
  }

  function renderFullCallBase() {
    document.getElementById('full-call-base').innerHTML = callBaseTableHtml(filteredLeads());
    var managedToday = state.leads.reduce(function (total, lead) {
      return total + (lead.managementHistory || []).filter(function (entry) { return String(entry).slice(0, 10) === today(); }).length;
    }, 0);
    var managed = document.getElementById('rail-managed-today');
    var assigned = document.getElementById('rail-assigned-total');
    var bar = document.getElementById('rail-progress-bar');
    if (managed) managed.textContent = managedToday;
    if (assigned) assigned.textContent = state.leads.length;
    if (bar) bar.style.width = Math.min(100, Math.round((managedToday / Math.max(1, state.leads.length)) * 100)) + '%';
  }

  /* ---------- render: sales feed ---------- */
  function filteredSales() {
    return state.sales.filter(function (s) {
      if (salesFilter.status !== 'todos' && s.status !== salesFilter.status) return false;
      if (salesFilter.search.trim()) {
        var q = salesFilter.search.toLowerCase();
        return [s.folio, s.clientName, s.advisorName, s.productName, s.category, s.clientPhone, s.referencePhone, s.documentType, s.documentNumber, s.saleType, s.notes]
          .some(function (value) { return String(value || '').toLowerCase().indexOf(q) > -1; });
      }
      return true;
    });
  }

  function salesFeedHtml(sales, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var rows = sales.length === 0
      ? '<tr><td colspan="9"><div class="table-empty">' + icon('receipt') + '<p>No hay registros de ventas que coincidan con los filtros aplicados.</p></div></td></tr>'
      : sales.map(function (s) {
        var documentText = s.documentType && s.documentNumber ? s.documentType + ' ' + s.documentNumber : '—';
        var dateStr = s.createdAt ? new Date(s.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : s.timestamp;
        var formattedAmount = Number(s.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return '<tr class="sale-data-row" data-sale-id="' + esc(s.id) + '">' +
          '<td><div class="sale-cell-main"><strong title="' + esc(s.clientName || '') + '">' + esc(s.clientName || '—') + '</strong><span>' + esc(s.folio || '—') + '</span></div></td>' +
          '<td><span class="sale-document" title="' + esc(documentText) + '">' + esc(documentText) + '</span></td>' +
          '<td><span class="sale-phone" title="' + esc(s.clientPhone || '') + '">' + esc(s.clientPhone || '—') + '</span></td>' +
          '<td><span class="sale-phone muted" title="' + esc(s.referencePhone || '') + '">' + esc(s.referencePhone || '—') + '</span></td>' +
          '<td><div class="sale-plan-cell"><strong title="' + esc(s.productName || '') + '">' + esc(s.productName || '—') + '</strong><span>' + esc(s.category || '—') + ' · S/ ' + esc(formattedAmount) + '</span></div></td>' +
          '<td><span class="sale-type-chip" title="' + esc(s.saleType || '') + '">' + esc(s.saleType || '—') + '</span></td>' +
          '<td><div class="sale-notes" title="' + esc(s.notes || '') + '">' + esc(s.notes || 'Sin observaciones') + '</div></td>' +
          '<td><div class="sale-status-cell">' + saleStatusBadge(s.status) + '<span>' + esc(dateStr || '—') + '</span></div></td>' +
          '<td><button type="button" class="btn-detail" data-action="sale-detail" data-sale-id="' + esc(s.id) + '" title="Ver detalles completos">' + icon('fileText') + '</button></td>' +
        '</tr>';
      }).join('');

    var header = compact ? '' :
      '<div class="table-card-header"><div class="table-card-header-row"><div>' +
      '<h2 class="table-card-title">Mis ventas</h2>' +
      '<p class="table-card-subtitle">Información subida desde Registrar nueva venta.</p></div></div>' +
      '<div class="filters-grid sales">' +
      '<div class="field-with-icon">' + icon('search') + '<input type="text" id="input-search-sales" placeholder="Buscar por titular, documento, teléfono, plan u observación..." value="' + esc(salesFilter.search) + '"></div>' +
      '<div class="field-with-icon">' + icon('filter') + '<select id="select-sale-status">' +
      ['todos:Todos los estados', 'aprobada:Activas', 'en_verificacion:En verificación', 'auditada:Auditadas QA', 'rechazada:Caídas']
        .map(function (o) { var p = o.split(':'); return '<option value="' + p[0] + '"' + (salesFilter.status === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') +
      '</select></div></div></div>';

    return '<div class="table-card sales-table-card">' + header + '<div class="table-scroll sales-table-scroll"><table class="data-table sales-data-table"><thead><tr>' +
      '<th>Titular</th><th>Documento</th><th>Teléfono</th><th>Referencia</th><th>Plan contratado</th><th>Tipo op.</th><th>Observaciones</th><th>Estado</th><th>Detalle</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
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
      '<div class="toast-icon">' + icon(type === 'call' ? 'phone' : 'checkCircle') + '</div><div style="flex:1">' +
      '<div class="toast-top"><span class="toast-badge">' + (type === 'call' ? 'Gestión guardada' : 'Venta registrada') + '</span>' +
      '<button type="button" class="toast-close" id="btn-toast-close">' + icon('x') + '</button></div>' +
      '<h4 class="toast-title">' + esc(title) + '</h4><p class="toast-desc">' + esc(description) + '</p>' +
      '<div class="toast-footer"><span>Asesor: <strong>' + esc(USERNAME) + '</strong></span><span>Hace un momento</span></div></div></div></div>';
    document.getElementById('btn-toast-close').addEventListener('click', dismissToast);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(dismissToast, 4500);
  }
  function dismissToast() { document.getElementById('toast-root').innerHTML = ''; if (toastTimer) clearTimeout(toastTimer); }

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
    var clientName = uploadPrefill ? uploadPrefill.name : '';
    var clientPhone = uploadPrefill ? uploadPrefill.phone : '';
    var prefillDocType = uploadPrefill && uploadPrefill.documentType ? uploadPrefill.documentType : '';
    var prefillDocNumber = uploadPrefill && uploadPrefill.documentNumber ? uploadPrefill.documentNumber : '';
    var prefillNotes = uploadPrefill && uploadPrefill.managementNotes ? uploadPrefill.managementNotes : '';
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" id="upload-modal-backdrop"><div class="modal-card md" role="dialog" aria-modal="true" aria-label="Registrar venta">' +
      '<div class="modal-head"><div class="modal-head-left"><div class="modal-head-icon">' + icon('receipt') + '</div>' +
      '<div><h2>Registrar nueva venta</h2><p>Ingresa los datos del cliente y el plan contratado para su verificación.</p></div></div>' +
      '<button type="button" class="modal-close" id="btn-close-upload">' + icon('x') + '</button></div>' +
      '<form id="form-upload-sale" class="modal-body">' +
      '<div id="upload-form-error"></div>' +
      '<div class="form-group"><label>Asesor responsable</label><select disabled>' +
      '<option>' + esc(ADVISOR.name) + ' (Asesor Comercial)</option></select></div>' +
      '<div class="form-group"><label>Nombres y apellidos del titular</label><div class="field-with-icon">' + icon('user') + '<input type="text" id="input-client-name" required placeholder="Ej. Laura González Peña" value="' + esc(clientName) + '"></div></div>' +
      '<div class="form-grid">' +
      '<div class="form-group"><label>Tipo de documento</label><div class="field-with-icon">' + icon('fileText') + '<select id="select-doc-type" required>' +
      '<option value="" disabled' + (prefillDocType ? '' : ' selected') + '>Seleccionar documento</option>' +
      DOCUMENT_TYPES.map(function (d) { return '<option value="' + d + '"' + (prefillDocType === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="form-group"><label>Número de documento</label><div class="field-with-icon">' + icon('fileText') + '<input type="text" id="input-doc-number" required placeholder="Ej. 45219876" inputmode="numeric" value="' + esc(prefillDocNumber) + '"></div></div>' +
      '</div><div class="form-grid">' +
      '<div class="form-group"><label>Teléfono principal</label><div class="field-with-icon">' + icon('phone') + '<input type="tel" id="input-client-phone" required placeholder="Número de contacto titular" value="' + esc(clientPhone) + '"></div></div>' +
      '<div class="form-group"><label>Teléfono de referencia</label><div class="field-with-icon">' + icon('phone') + '<input type="tel" id="input-reference-phone" placeholder="Contacto alternativo"></div></div>' +
      '</div><div class="form-grid">' +
      '<div class="form-group"><label>Plan contratado</label><div class="field-with-icon">' + icon('package') + '<select id="select-product" required>' +
      '<option value="" disabled selected>Seleccionar plan</option>' +
      PRODUCTS_CATALOG.map(function (p) { return '<option value="' + esc(p.name) + '" data-price="' + p.price + '" data-cat="' + esc(p.category) + '">' + esc(p.name) + ' (S/ ' + p.price.toFixed(2) + ')</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="form-group"><label>Tipo de operación</label><div class="field-with-icon">' + icon('package') + '<select id="select-sale-type" required>' +
      '<option value="" disabled selected>Seleccionar tipo</option>' +
      SALE_TYPES.map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('') +
      '</select></div></div>' +
      '</div>' +
      '<div class="form-group"><label>Observaciones / Acuerdos</label><div class="field-with-icon">' + icon('fileText') + '<textarea id="input-notes" rows="2" placeholder="Ej. Grabación de aceptación guardada en carpeta #44.">' + esc(prefillNotes) + '</textarea></div></div>' +
      '<div class="form-actions"><button type="button" class="btn-outline" id="btn-cancel-upload">Cancelar</button>' +
      '<button type="submit" class="btn btn-primary-action">' + icon('check') + '<span>Confirmar venta</span></button></div>' +
      '</form></div></div>';

    document.getElementById('btn-close-upload').addEventListener('click', closeUploadModal);
    document.getElementById('btn-cancel-upload').addEventListener('click', closeUploadModal);
    document.getElementById('upload-modal-backdrop').addEventListener('click', function (e) { if (e.target.id === 'upload-modal-backdrop') closeUploadModal(); });
    document.getElementById('form-upload-sale').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('input-client-name').value.trim();
      var docType = document.getElementById('select-doc-type').value;
      var docNumber = document.getElementById('input-doc-number').value.trim();
      var phone = document.getElementById('input-client-phone').value.trim();
      var saleType = document.getElementById('select-sale-type').value;
      var prodOpt = document.getElementById('select-product').selectedOptions[0];
      if (!name || !docType || !docNumber || !phone || !saleType || !prodOpt.value) {
        document.getElementById('upload-form-error').innerHTML = '<div class="modal-form-error">Completa nombre, documento, teléfono, plan y tipo antes de continuar.</div>';
        return;
      }
      var saleNotes = appendManagementNote(clearAutomaticManagementNotes(document.getElementById('input-notes').value.trim()), docType, docNumber);
      var sale = {
        id: uid(), folio: 'KRT-' + new Date().getFullYear() + '-' + uid().slice(3, 11).toUpperCase(),
        advisorId: ADVISOR.id, advisorName: ADVISOR.name, advisorAvatar: '',
        clientName: name, clientPhone: phone,
        documentType: docType,
        documentNumber: docNumber,
        referencePhone: document.getElementById('input-reference-phone').value.trim(),
        saleType: saleType,
        productName: prodOpt.value, category: prodOpt.getAttribute('data-cat'), amount: Number(prodOpt.getAttribute('data-price')),
        paymentMethod: '',
        status: 'en_verificacion', notes: saleNotes,
        leadId: uploadPrefill ? uploadPrefill.leadId : undefined,
        createdAt: new Date().toISOString(), timestamp: new Date().toISOString()
      };
      if (sale.leadId && state.sales.some(function (s) { return s.leadId === sale.leadId; })) { closeUploadModal(); return; }
      state.sales.unshift(sale);
      if (sale.leadId) {
        state.leads = state.leads.map(function (l) { return l.id === sale.leadId ? Object.assign({}, l, { status: 'venta_cerrada', notes: saleNotes, advisorNote: appendManagementNote(clearAutomaticManagementNotes(l.advisorNote), docType, docNumber), documentType: docType, documentNumber: docNumber, coordinates: '' }) : l; });
      }
      persist(); renderAll();
      showToast('Venta registrada', name + ' · Enviada a verificación', 'sale');
      closeUploadModal();
    });
  }

  /* ---------- active call modal ---------- */
  var callNotesVal = '', callStatusVal = '';
  function appendManagementNote(notes, label, value) {
    var cleanValue = String(value || '').trim();
    if (!cleanValue) return notes;
    var line = label + ': ' + cleanValue;
    var current = String(notes || '').trim();
    return current.indexOf(line) >= 0 ? current : (current ? current + '\n' + line : line);
  }
  function appendPlainManagementNote(notes, value) {
    var cleanValue = String(value || '').trim();
    if (!cleanValue) return notes;
    var current = String(notes || '').trim();
    return current.indexOf(cleanValue) >= 0 ? current : (current ? current + '\n' + cleanValue : cleanValue);
  }
  function clearAutomaticManagementNotes(notes) {
    return String(notes || '')
      .split(/\n+/)
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line && !/^(DNI|RUC|CE|Coordenadas):/i.test(line); })
      .join('\n');
  }
  function normalizedAdvisorNote(lead) {
    var note = String(lead && lead.advisorNote ? lead.advisorNote : '').trim();
    if (!note) return '';
    var coordinatesMatch = note.match(/-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?/);
    var documentMatch = note.match(/\b(?:DNI|RUC|CE):\s*[A-Za-z0-9-]+/i);
    if (lead.status === 'sin_cobertura') {
      return coordinatesMatch ? coordinatesMatch[0] : clearAutomaticManagementNotes(note);
    }
    if (lead.status === 'preventa' || lead.status === 'venta_cerrada') {
      return documentMatch ? documentMatch[0].replace(/^([a-z]+)/i, function (m) { return m.toUpperCase(); }) : clearAutomaticManagementNotes(note);
    }
    return clearAutomaticManagementNotes(note);
  }
  function getCallExtraFields(newStatus) {
    var extra = {};
    var notes = clearAutomaticManagementNotes(callNotesVal);
    var advisorNote = clearAutomaticManagementNotes(activeCallLead ? activeCallLead.advisorNote : '');
    if (newStatus === 'sin_cobertura') {
      var coordinates = document.getElementById('call-coordinates');
      var parts = coordinates.value.trim().split(',').map(function (v) { return v.trim(); });
      if (parts.length !== 2 || parts.some(function (v) { return !v || !isFinite(Number(v)); }) || Math.abs(Number(parts[0])) > 90 || Math.abs(Number(parts[1])) > 180) {
        coordinates.setCustomValidity('Ingresa latitud y longitud válidas separadas por coma.'); coordinates.reportValidity(); return null;
      }
      coordinates.setCustomValidity('');
      var coverageCoordinates = coordinates.value.trim();
      extra.coordinates = '';
      extra.documentType = '';
      extra.documentNumber = '';
      notes = appendManagementNote(notes, 'Coordenadas', coverageCoordinates);
      advisorNote = appendPlainManagementNote(advisorNote, coverageCoordinates);
    }
    if (newStatus === 'preventa') {
      var doc = document.getElementById('call-document');
      if (!doc.value.trim()) { doc.setCustomValidity('Ingresa el número de documento.'); doc.reportValidity(); return null; }
      doc.setCustomValidity('');
      extra.documentType = document.getElementById('call-document-type').value;
      extra.documentNumber = doc.value.trim();
      extra.coordinates = '';
      notes = appendManagementNote(notes, extra.documentType, extra.documentNumber);
      advisorNote = appendManagementNote(advisorNote, extra.documentType, extra.documentNumber);
    }
    extra.notes = notes;
    extra.advisorNote = advisorNote;
    return extra;
  }
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
  function openWhatsAppChat(lead) {
    var number = String(lead.whatsappUser || lead.phone || '').replace(/[^\d+]/g, '');
    if (number.indexOf('+') === 0) number = number.slice(1);
    if (!/^[1-9]\d{7,14}$/.test(number) || /^0+$/.test(number)) {
      var entered = window.prompt('Ingresa el número de WhatsApp con código de país. Ejemplo: 51987654321');
      if (entered === null) return;
      number = entered.replace(/[^\d+]/g, '');
      if (number.indexOf('+') === 0) number = number.slice(1);
      if (!/^[1-9]\d{7,14}$/.test(number) || /^0+$/.test(number)) {
        showToast('WhatsApp no válido', 'Ingresa un número con código de país, sin espacios.', 'call');
        return;
      }
    }
    var message = 'Hola, te saluda KRATOS.';
    var desktopUrl = 'whatsapp://send?phone=' + encodeURIComponent(number) + '&text=' + encodeURIComponent(message);
    var webUrl = 'https://wa.me/' + encodeURIComponent(number) + '?text=' + encodeURIComponent(message);
    showToast('Abriendo WhatsApp', 'Se abrirá el chat del contacto seleccionado.', 'call');
    window.location.href = desktopUrl;
    window.setTimeout(function () {
      window.open(webUrl, '_blank', 'noopener');
    }, 900);
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
    var extra = getCallExtraFields(newStatus);
    if (!extra) return;
    var lead = activeCallLead;
    state.leads = state.leads.map(function (l) {
      if (l.id !== lead.id) return l;
      var hist = (l.managementHistory || []).concat([new Date().toISOString()]);
      return Object.assign({}, l, { status: newStatus, notes: extra.notes, advisorNote: extra.advisorNote, lastContactAt: new Date().toLocaleString('es-PE'), managementHistory: hist }, extra);
    });
    persist(); renderAll();
    showToast('Gestión guardada', 'Estado y observaciones actualizadas.', 'call');
    closeCallModal();
  }
  function convertCallToSale() {
    var lead = activeCallLead;
    if (!lead) return;
    if (state.sales.some(function (s) { return s.leadId === lead.id; })) { showToast('Venta ya registrada', 'Consulta el registro en Mis ventas.', 'sale'); return; }
    var extra = callStatusVal ? getCallExtraFields(callStatusVal) : { notes: callNotesVal };
    if (!extra) return;
    var draftNotes = extra.notes;
    closeCallModal();
    openUploadModal({ name: lead.clientName, phone: lead.phone, leadId: lead.id, managementNotes: draftNotes, documentType: extra.documentType || lead.documentType, documentNumber: extra.documentNumber || lead.documentNumber });
  }
  function renderCallModal() {
    var lead = activeCallLead;
    if (!lead) return;
    var assigned = lead.assignedAt ? (isNaN(Date.parse(lead.assignedAt)) ? lead.assignedAt : new Date(lead.assignedAt).toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit'})) : '—';
    var details = [['Teléfono 1', lead.phone], ['Teléfono 2', lead.phone2], ['Usuario WhatsApp', lead.whatsappUser], ['Zona', lead.zone || lead.city], ['Hora asignada', assigned]];
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" id="call-modal-backdrop"><div class="modal-card lg" role="dialog" aria-modal="true" aria-label="Gestión de llamada">' +
      '<div class="call-topbar"><div class="call-topbar-left"><div class="call-avatar">' + icon('phone') + '</div><div><span class="call-tag">Gestión comercial</span><span class="call-tag-note">MicroSIP activo</span><h3 class="call-phone-number">' + esc(lead.phone) + '</h3></div></div><button type="button" class="modal-close" id="btn-close-call-head">' + icon('x') + '</button></div>' +
      '<div class="modal-body"><div class="call-info-grid">' + details.map(function (item) { return '<div><span class="label">' + item[0] + '</span><span class="value">' + esc(item[1] || '—') + '</span></div>'; }).join('') + '</div>' +
      '<div class="form-group"><label for="call-notes">Observaciones de la llamada</label><textarea id="call-notes" rows="3" placeholder="Ingresa los detalles relevantes de la conversación...">' + esc(callNotesVal) + '</textarea></div>' +
      '<div class="form-group"><label id="call-status-label">Estado de la gestión</label><div class="disposition-grid" role="group" aria-labelledby="call-status-label">' +
      CALL_DISPOSITIONS.map(function (item) { return '<button type="button" class="disposition-btn ' + item[1] + '" data-finish="' + item[0] + '" aria-pressed="false"><span class="disp-dot" style="background:' + item[3] + '"></span><span>' + item[2] + '</span></button>'; }).join('') +
      '</div><p id="call-status-help" role="status" style="font-size:12px;color:var(--text-muted)">Selecciona un estado para registrar la gestión.</p></div>' +
      '<div id="call-coverage-fields" class="form-group call-extra-card" hidden><label for="call-coordinates">Coordenadas</label><div class="field-with-icon">' + icon('mapPin') + '<input id="call-coordinates" type="text" placeholder="Ej. -12.0464, -77.0428" value="' + esc(lead.coordinates || '') + '"></div><p class="field-hint">Se agregará automáticamente a observaciones.</p></div>' +
      '<div id="call-presale-fields" class="form-group call-extra-card" hidden><div class="form-grid compact"><div><label for="call-document-type">Tipo de documento</label><div class="field-with-icon">' + icon('fileText') + '<select id="call-document-type"><option>DNI</option><option>RUC</option><option>CE</option></select></div></div><div><label for="call-document">Número de documento</label><div class="field-with-icon">' + icon('fileText') + '<input id="call-document" type="text" placeholder="Ingresa el número" value="' + esc(lead.documentNumber || '') + '"></div></div></div><p class="field-hint">Se agregará automáticamente a observaciones y al registro de venta.</p></div>' +
      '<div class="call-actions"><button type="button" class="btn-outline" id="btn-cancel-call">Cancelar</button><button type="button" class="btn-secondary-action" id="btn-hangup">' + icon('check') + '<span>Guardar gestión</span></button><button type="button" class="btn btn-primary-action" id="btn-convert-sale">' + icon('check') + '<span>Registrar venta</span></button></div></div></div></div>';
    document.getElementById('call-document-type').value = lead.documentType || 'DNI';
    document.getElementById('call-notes').addEventListener('input', function (e) { callNotesVal = e.target.value; });
    document.getElementById('btn-close-call-head').addEventListener('click', closeCallModal);
    document.querySelectorAll('[data-finish]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        callStatusVal = btn.getAttribute('data-finish');
        var saveButton = document.getElementById('btn-hangup');
        saveButton.hidden = callStatusVal === 'venta_cerrada';
        saveButton.style.display = callStatusVal === 'venta_cerrada' ? 'none' : '';
        document.getElementById('call-coverage-fields').hidden = callStatusVal !== 'sin_cobertura';
        document.getElementById('call-presale-fields').hidden = callStatusVal !== 'preventa';
        document.querySelectorAll('[data-finish]').forEach(function (option) { option.setAttribute('aria-pressed', String(option === btn)); });
        document.getElementById('call-status-help').textContent = 'Estado seleccionado: ' + btn.textContent.trim();
      });
    });
    document.getElementById('btn-cancel-call').addEventListener('click', closeCallModal);
    document.getElementById('btn-hangup').addEventListener('click', function () {
      if (!callStatusVal) { document.getElementById('call-status-help').textContent = 'Selecciona un estado antes de guardar.'; return; }
      finishCall(callStatusVal);
    });
    document.getElementById('btn-convert-sale').addEventListener('click', convertCallToSale);
  }

  /* ---------- sale detail modal ---------- */
  function openSaleDetail(sale) {
    document.getElementById('modal-root').innerHTML =
      '<div class="modal-backdrop" id="detail-modal-backdrop"><div class="modal-card sm">' +
      '<div class="modal-head dark"><div><span class="sale-detail-folio">' + esc(sale.folio) + '</span><h3 class="sale-detail-title">Detalle de la venta</h3></div>' +
      '<button type="button" class="modal-close" id="btn-close-detail">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' +
      detailRow('Cliente titular:', esc(sale.clientName)) +
      detailRow('Documento:', sale.documentType ? esc(sale.documentType) + ' ' + esc(sale.documentNumber) : '—') +
      detailRow('Teléfono principal:', esc(sale.clientPhone)) +
      detailRow('Teléfono de referencia:', esc(sale.referencePhone) || '—') +
      detailRow('Asesor comercial:', esc(sale.advisorName)) +
      detailRow('Tipo de operación:', esc(sale.saleType) || '—') +
      detailRow('Plan contratado:', esc(sale.productName)) +
      detailRow('Monto facturado:', '<span class="sale-amount-detail">S/ ' + Number(sale.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</span>') +
      (sale.paymentMethod ? detailRow('Método de pago:', esc(sale.paymentMethod)) : '') + detailRow('Estado actual:', saleStatusBadge(sale.status)) +
      '<div class="sale-notes-box"><span class="notes-label">Observaciones y acuerdos:</span>' +
      '<p class="notes-text">' + esc(sale.notes || 'Sin observaciones registradas.') + '</p></div>' +
      '<div class="form-actions"><button type="button" class="btn-outline" id="btn-accept-detail">Cerrar</button></div>' +
      '</div></div></div>';
    function detailRow(label, value) {
      return '<div class="detail-row"><span class="detail-label">' + label + '</span><span class="detail-val">' + value + '</span></div>';
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

    var statusFilter = t.closest('[data-lead-status]');
    if (statusFilter) { leadsFilter.status = statusFilter.getAttribute('data-lead-status'); renderFullCallBase(); return; }

    var callBtn = t.closest('[data-action="call"]');
    if (callBtn) { var lead = findLead(callBtn.getAttribute('data-lead-id')); if (lead) dialWithMicroSip(lead); return; }

    var saleBtn = t.closest('[data-action="sale"]');
    if (saleBtn && !saleBtn.disabled) { var l2 = findLead(saleBtn.getAttribute('data-lead-id')); if (l2) tryOpenSaleFor(l2); return; }

    var whatsAppBtn = t.closest('[data-action="whatsapp"]');
    if (whatsAppBtn) { var l3 = findLead(whatsAppBtn.getAttribute('data-lead-id')); if (l3) openWhatsAppChat(l3); return; }

    var detailBtn = t.closest('[data-action="sale-detail"]');
    if (detailBtn) { var s = findSale(detailBtn.getAttribute('data-sale-id')); if (s) openSaleDetail(s); return; }

    var typifyBtn = t.closest('[data-action="typify"]');
    if (typifyBtn) { var l4 = findLead(typifyBtn.getAttribute('data-lead-id')); if (l4) openCallModal(l4); return; }

  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'input-search-leads') { leadsFilter.search = e.target.value; renderFullCallBase(); }
    if (e.target.id === 'input-search-sales') { salesFilter.search = e.target.value; renderFullSalesFeed(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'select-sale-status') { salesFilter.status = e.target.value; renderFullSalesFeed(); }
    if (e.target.classList.contains('input-advisor-note')) {
      var noteLeadId = e.target.getAttribute('data-lead-id');
      state.leads = state.leads.map(function (l) { return l.id === noteLeadId ? Object.assign({}, l, { advisorNote: e.target.value }) : l; });
      persist();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (uploadOpen) closeUploadModal();
      if (activeCallLead) closeCallModal();
    }
  });

  var operationsReady = false, operationsQueue = Promise.resolve();
  function queueOperationsSync() {
    if (!CFG.operationsSync) return Promise.resolve();
    var snapshot = JSON.stringify({ leads: state.leads, sales: state.sales });
    operationsQueue = operationsQueue.catch(function () {}).then(function () {
      return fetch(CFG.operationsSync, {method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':CFG.csrf},body:snapshot}).then(function (response) {
        if (!response.ok) throw new Error('No se sincronizó la gestión');
        var el = document.getElementById('operations-sync-status'); if (el) el.textContent = '';
      }).catch(function (error) {
        var el = document.getElementById('operations-sync-status'); if (el) el.textContent = 'Sin sincronizar. Vuelve a intentar al cambiar de área.';
        throw error;
      });
    });
    // The local copy remains available when the server is temporarily unavailable.
    operationsQueue.catch(function () {});
    return operationsQueue;
  }
  function loadOperations() {
    if (!CFG.operationsAdvisor) return Promise.resolve();
    return fetch(CFG.operationsAdvisor, {headers:{Accept:'application/json'}}).then(function (response) {
      if (!response.ok) throw new Error('No se pudo cargar Back Office');
      return response.json();
    }).then(function (data) {
      var assigned = new Set(data.leads.map(function (lead) { return lead.id; }));
      state.leads = state.leads.filter(function (lead) { return !data.knownIds.includes(lead.id) || assigned.has(lead.id); });
      data.leads.forEach(function (lead) {
        var existing = state.leads.findIndex(function (l) { return l.id === lead.id; });
        var merged = Object.assign({}, existing >= 0 ? state.leads[existing] : {}, lead, {assignedAdvisorId:ADVISOR.id,assignedAdvisorName:USERNAME,city:lead.zone});
        if (existing >= 0) state.leads[existing] = merged; else state.leads.unshift(merged);
      });
      data.sales.forEach(function (sale) {
        var existing = state.sales.findIndex(function (s) { return s.id === sale.id; });
        if (existing >= 0 && sale.trackingUpdatedAt) state.sales[existing] = Object.assign({}, state.sales[existing], {status:sale.status});
      });
      operationsReady = true; renderAll(); persist();
    }).catch(function () { var el=document.getElementById('operations-sync-status');if(el)el.textContent='No se pudo cargar la base de Back Office. Recarga para reintentar.'; });
  }
  document.addEventListener('click', function (event) {
    var link=event.target.closest('[data-operation-link]'); if(!link)return;
    event.preventDefault();
    (operationsReady ? queueOperationsSync() : loadOperations().then(function(){if(!operationsReady)throw new Error('Sin conexión');return queueOperationsSync();})).then(function(){window.location.href=link.href;}).catch(function(){});
  });
  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initStaticLabels();
    initSidebarToggle();
    loadOperations();
    setTab('llamadas');
    renderAll();
    document.getElementById('storage-error').hidden = !storageError;
    persist();
  });
})();
