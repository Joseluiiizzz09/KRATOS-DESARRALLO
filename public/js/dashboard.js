(function () {
  'use strict';

  var CFG = window.__KRATOS__ || {};
  var USERNAME = CFG.username || 'Asesor de prueba';
  var STORAGE_KEY = 'kratos:advisor:v5:' + USERNAME;
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
    whatsapp: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.7 8.6c.2-.5.6-.5.9-.4.2.5.6 1.3.6 1.5 0 .3-.4.7-.6 1 .6 1.1 1.4 1.9 2.6 2.5.3-.3.6-.8.9-.8.3 0 1.2.5 1.5.7.1.3-.1 1-.6 1.3-.7.4-1.7.3-3-.4a7.6 7.6 0 0 1-3-3c-.4-1-.3-1.7.7-2.4z"/>',
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
  /* Contactos de demostración de versiones anteriores: ya no se muestran. */
  function isDemoLeadId(id) { return /^lead-\d+$/.test(id); }

  function seed() {
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
    /* Los contactos llegan desde Back Data; sin asignaciones la base queda vacía. */
    return { leads: [], sales: sales };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (Array.isArray(data.leads) && Array.isArray(data.sales) &&
          data.leads.every(function (l) { return typeof l.id === 'string' && typeof l.clientName === 'string'; }) &&
          data.sales.every(function (s) { return typeof s.id === 'string' && typeof s.amount === 'number'; })) {
          data.leads = data.leads.filter(function (l) { return !isDemoLeadId(l.id); });
          return data;
        }
      }
    } catch (e) { /* ignore */ }
    return seed();
  }

  var CALL_DISPOSITIONS = [
    ["venta_cerrada","disposition-venta_cerrada","Venta Cerrada","#10b981"],
    ["interesado","disposition-interesado","Interesado","#059669"],
    ["nuevo","disposition-nuevo","Nuevo","#2563eb"],
    ["rellamada","disposition-rellamada","Rellamada","#d97706"],
    ["contactado","disposition-contactado","Contactado","#7c3aed"],
    ["no_contesta","disposition-no_contesta","No contesta","#6b7280"],
    ["no_interesado","disposition-no_interesado","No le interesa","#dc2626"]
  ];
  var state = load();

  var storageError = false;
  function persist() {
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
      interesado: ['badge-interesado', 'Interesado'],
      nuevo: ['badge-nuevo', 'Nuevo'],
      rellamada: ['badge-rellamada', 'Rellamada'],
      contactado: ['badge-contactado', 'Contactado'],
      venta_cerrada: ['badge-venta-cerrada', 'Venta Cerrada'],
      no_contesta: ['badge-no-contesta', 'No contesta'],
      no_interesado: ['badge-no-interesa', 'No le interesa'],
      rechazado: ['badge-no-interesa', 'No le interesa'],
      pendiente: ['badge-nuevo', 'Nuevo'],
      en_curso: ['badge-contactado', 'En Llamada']
    };
    var m = map[status] || ['badge-nuevo', status || 'Nuevo'];
    return '<span class="status-pill ' + m[0] + '">' + esc(m[1]) + '</span>';
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

  /* ---------- topbar title map ---------- */
  var TAB_TITLES = {
    llamadas: ['Base de llamadas', 'Contactos asignados para gestión comercial'],
    ventas: ['Mis ventas', 'Registro consolidado de ventas y verificación'],
    tablero: ['Tablero y métricas', 'Resumen de actividad comercial del asesor']
  };

  /* ---------- render: header labels ---------- */
  function initStaticLabels() {
    /* Sidebar user avatar */
    var avatarEl = document.getElementById('sidebar-avatar');
    if (avatarEl) avatarEl.textContent = initials(USERNAME);
    var nameEl = document.getElementById('sidebar-user-name');
    if (nameEl) nameEl.textContent = USERNAME;
  }

  /* Un contacto cuenta como gestionado cuando ya salió de la bandeja inicial. */
  function isManaged(lead) { return lead.status !== 'pendiente' && lead.status !== 'nuevo'; }
  function plural(n, one, many) { return n === 1 ? one : many; }

  /* ---------- render: metrics banner + kpis ---------- */
  function renderMetrics() {
    var leads = state.leads, sales = state.sales;
    document.getElementById('section-banner').innerHTML =
      '<div class="section-banner-left"><div class="section-banner-icon">' + icon('userCheck') + '</div>' +
      '<div><p class="section-banner-label">Gestión Comercial</p><h2 class="section-banner-title">Panel de Asesor · ' + esc(USERNAME) + '</h2></div></div>' +
      '<div class="section-banner-right"><span class="status-live-dot"></span> ' + leads.length + ' contactos asignados en cartera</div>';

    var todayStr = today();
    var managed = leads.filter(isManaged).length;
    var pending = leads.length - managed;
    var salesToday = sales.filter(function (s) { return s.createdAt && s.createdAt.slice(0, 10) === todayStr; }).length;
    var active = sales.filter(function (s) { return s.status === 'aprobada' || s.status === 'auditada'; }).length;
    var dropped = sales.filter(function (s) { return s.status === 'rechazada'; }).length;
    var checking = sales.filter(function (s) { return s.status === 'en_verificacion'; }).length;
    var coverage = leads.length ? Math.round((managed / leads.length) * 100) : 0;

    var cards = [
      { label: 'Contactos asignados', value: leads.length, detail: leads.length ? pending + plural(pending, ' pendiente', ' pendientes') + ' de gestión' : 'Back Data aún no asigna registros', icon: 'phone', cls: 'indigo' },
      { label: 'Gestionados hoy', value: managed, detail: leads.length ? coverage + '% de la cartera' : 'Sin cartera asignada', icon: 'checkCircle', cls: 'emerald' },
      { label: 'Ventas del día', value: salesToday, detail: 'Registradas en la jornada', icon: 'trendUp', cls: 'amber' },
      { label: 'Ventas activas', value: active, detail: checking + ' en verificación · ' + dropped + plural(dropped, ' caída', ' caídas'), icon: 'receipt', cls: 'rose' }
    ];
    document.getElementById('kpi-grid').innerHTML = cards.map(function (c) {
      return '<div class="kpi-card"><div class="kpi-head"><span class="kpi-label">' + c.label + '</span>' +
        '<div class="kpi-icon ' + c.cls + '">' + icon(c.icon) + '</div></div>' +
        '<p class="kpi-value">' + c.value + '</p><p class="kpi-detail">' + esc(c.detail) + '</p></div>';
    }).join('');

    document.getElementById('count-llamadas').textContent = leads.length;
    document.getElementById('count-ventas').textContent = sales.length;
    var progressCount = document.getElementById('sidebar-progress-count');
    var progressBar = document.getElementById('sidebar-progress-bar');
    var managedToday = leads.filter(isManaged).length;
    if (progressCount) progressCount.textContent = managedToday;
    if (progressBar) progressBar.style.width = (leads.length ? Math.max(6, Math.round((managedToday / leads.length) * 100)) : 0) + '%';
  }

  /* ---------- render: charts ---------- */
  /* Par validado para daltonismo sobre superficie clara (ver dataviz). */
  var SERIES = { calls: { color: '#2f6fb0', label: 'Gestiones' }, sales: { color: '#2f8f57', label: 'Ventas' } };
  /* Mismos colores que los badges de Estado de la tabla. */
  var STATUS_COLORS = { pendiente: '#9a6414', contactado: '#1a6598', agendado: '#8a1c2b', venta: '#2c7048', 'no-contesta': '#6b7280' };

  function chartEmpty(title, hint) {
    return '<div class="chart-empty"><p>' + esc(title) + '</p><small>' + esc(hint) + '</small></div>';
  }

  function renderCharts() {
    var leads = state.leads, sales = state.sales;

    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(); d.setDate(d.getDate() - 6 + i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      days.push({
        label: String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
        calls: leads.reduce(function (n, l) { return n + (l.managementHistory || []).filter(function (h) { return h.slice(0, 10) === key; }).length; }, 0),
        sales: sales.filter(function (s) { return s.createdAt && s.createdAt.slice(0, 10) === key; }).length
      });
    }
    var totalCalls = days.reduce(function (n, d) { return n + d.calls; }, 0);
    var totalSales = days.reduce(function (n, d) { return n + d.sales; }, 0);
    /* Escala redondeada para que la línea superior sea un número legible. */
    var peak = Math.max.apply(null, days.map(function (d) { return Math.max(d.calls, d.sales); }));
    var top = peak <= 4 ? 4 : Math.ceil(peak / 2) * 2;

    var head =
      '<div class="chart-card-head"><div><h3>' + icon('barChart') + 'Actividad comercial</h3>' +
      '<p>Últimos 7 días · Gestiones registradas y ventas</p></div>' +
      '<div class="chart-legend">' +
      '<span><span class="legend-dot" style="background:' + SERIES.calls.color + '"></span>' + SERIES.calls.label + '</span>' +
      '<span><span class="legend-dot" style="background:' + SERIES.sales.color + '"></span>' + SERIES.sales.label + '</span>' +
      '</div></div>';

    var body;
    if (totalCalls === 0 && totalSales === 0) {
      body = chartEmpty('Sin actividad en los últimos 7 días', 'Las gestiones y ventas que registres aparecerán aquí.');
    } else {
      var busiest = days.reduce(function (best, d) { return (d.calls + d.sales) > (best.calls + best.sales) ? d : best; }, days[0]);
      var bar = function (kind, value, label) {
        var serie = SERIES[kind];
        return '<div class="bar" style="height:' + (value / top * 100) + '%;background:' + serie.color + '" ' +
          'title="' + value + ' ' + serie.label.toLowerCase() + ' el ' + label + '">' +
          (value > 0 ? '<b>' + value + '</b>' : '') + '</div>';
      };
      body =
        '<div class="activity-summary">' +
        '<div><span>Gestiones en el período</span><strong>' + totalCalls + '</strong></div>' +
        '<div><span>Ventas en el período</span><strong>' + totalSales + '</strong></div>' +
        '<div><span>Día más activo</span><strong>' + esc(busiest.label) + '<small>' + (busiest.calls + busiest.sales) + ' registros</small></strong></div>' +
        '</div>' +
        '<div class="chart-plot">' +
        '<div class="chart-axis"><span>' + top + '</span><span>' + (top / 2) + '</span><span>0</span></div>' +
        '<div class="chart-area">' +
        '<i class="gridline"></i><i class="gridline"></i><i class="gridline base"></i>' +
        '<div class="bar-chart">' + days.map(function (d) {
          return '<div class="bar-col"><div class="bar-group">' +
            bar('calls', d.calls, d.label) + bar('sales', d.sales, d.label) +
            '</div><span class="bar-label">' + d.label + '</span></div>';
        }).join('') + '</div></div></div>';
    }
    document.getElementById('chart-bars').innerHTML = head + body;

    /* Distribución por el mismo estado que muestra la columna Estado. */
    var buckets = ['pendiente', 'contactado', 'agendado', 'venta', 'no-contesta'].map(function (key) {
      return { key: key, label: displayLeadStatusLabel(key), count: leads.filter(function (l) { return displayLeadStatus(l.status) === key; }).length };
    });
    var statusHead =
      '<div class="chart-card-head"><div><h3>' + icon('pieChart') + 'Distribución de contactos</h3>' +
      '<p>Estado actual de la base asignada</p></div>' +
      '<span class="base-total">' + leads.length + ' contacto' + (leads.length === 1 ? '' : 's') + '</span></div>';

    document.getElementById('chart-status').innerHTML = statusHead + (leads.length === 0
      ? chartEmpty('Sin contactos en la base', 'Back Data asignará registros a tu usuario.')
      : '<div class="status-bars">' + buckets.map(function (item) {
          var pct = Math.round(item.count / leads.length * 100);
          return '<div class="distribution-item' + (item.count === 0 ? ' empty' : '') + '">' +
            '<div class="status-row-head"><span class="name">' +
            '<span class="dot" style="background:' + STATUS_COLORS[item.key] + '"></span>' + item.label + '</span>' +
            '<span class="val">' + item.count + '<small> · ' + pct + '%</small></span></div>' +
            '<div class="status-track"><div class="status-fill" style="width:' + pct + '%"></div></div></div>';
        }).join('') + '</div>');
  }

  /* ---------- render: call base table ---------- */
  function displayLeadStatus(status) {
    var statuses = {
      venta_cerrada: 'venta',
      no_contesta: 'no-contesta',
      no_interesado: 'no-contesta',
      rellamada: 'agendado',
      interesado: 'contactado',
      nuevo: 'pendiente',
      en_curso: 'pendiente',
      sin_cobertura: 'pendiente'
    };
    return statuses[status] || status || 'pendiente';
  }

  function displayLeadStatusLabel(status) {
    var labels = { pendiente: 'Pendiente', contactado: 'Contactado', agendado: 'Agendado', venta: 'Venta', 'no-contesta': 'No contesta' };
    return labels[displayLeadStatus(status)] || 'Pendiente';
  }

  function storedLeadStatus(displayStatus) {
    var statuses = { pendiente: 'pendiente', contactado: 'contactado', agendado: 'rellamada', venta: 'venta_cerrada', 'no-contesta': 'no_contesta' };
    return statuses[displayStatus] || 'pendiente';
  }

  function filteredLeads() {
    return state.leads.filter(function (l) {
      if (leadsFilter.status !== 'todos' && displayLeadStatus(l.status) !== leadsFilter.status) return false;
      if (leadsFilter.campaign !== 'Todas las Campañas' && l.campaign !== leadsFilter.campaign) return false;
      if (leadsFilter.search.trim()) {
        var q = leadsFilter.search.toLowerCase();
        return [l.clientName, l.phone, l.phone2, l.whatsappUser, l.zone, l.city, l.notes, l.assignedBy].some(function (value) { return String(value || '').toLowerCase().indexOf(q) > -1; });
      }
      return true;
    });
  }

  function callBaseTableHtml(leads, opts) {
    opts = opts || {};
    var compact = !!opts.compact;
    var waitingForAssignment = state.leads.length === 0;
    var rowsHtml = leads.length === 0
      ? (waitingForAssignment
        ? '<tr><td colspan="9" class="table-waiting"><p>Esperando asignación de Back Data…</p><small>Back Data asignará registros a tu usuario.</small></td></tr>'
        : '<tr><td colspan="9" class="table-empty">' + icon('phone') + '<p>No se encontraron contactos en la base con los filtros seleccionados.</p></td></tr>')
      : leads.map(function (l) {
        var displayStatus = displayLeadStatus(l.status);
        var assignedTime = l.assignedAt ? (isNaN(Date.parse(l.assignedAt)) ? l.assignedAt : new Date(l.assignedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })) : '—';
        return '<tr class="' + (l.status === 'en_curso' ? 'in-call' : '') + '" data-lead-id="' + l.id + '">' +
          '<td><div class="contact-cell"><button type="button" class="contact-action btn-call" data-action="call" data-lead-id="' + esc(l.id) + '" title="Llamar">' + icon('phone') + '</button><strong>' + esc(l.phone || '—') + '</strong></div></td>' +
          '<td class="cell-plain">' + esc(l.phone2 && l.phone2 !== '—' ? l.phone2 : '—') + '</td>' +
          '<td><div class="contact-cell"><button type="button" class="contact-action btn-icon-sale btn-whatsapp-sale" data-action="whatsapp" data-lead-id="' + esc(l.id) + '" title="WhatsApp">' + icon('whatsapp') + '</button><span class="cell-plain">' + esc(l.whatsappUser || '—') + '</span></div></td>' +
          '<td><div class="cell-notes" title="' + esc(l.backNotes || l.notes || '') + '">' + esc(l.backNotes || l.notes || 'Sin observaciones') + '</div></td>' +
          '<td><select class="artifact-status status-' + displayStatus + '" data-lead-id="' + esc(l.id) + '" aria-label="Estado de ' + esc(l.phone || l.clientName || 'contacto') + '">' +
            ['pendiente', 'contactado', 'agendado', 'venta', 'no-contesta'].map(function (status) { return '<option value="' + status + '"' + (displayStatus === status ? ' selected' : '') + '>' + displayLeadStatusLabel(status) + '</option>'; }).join('') +
          '</select></td>' +
          '<td><input type="text" class="input-advisor-note" data-lead-id="' + esc(l.id) + '" placeholder="Escribe una observación" value="' + esc(l.advisorNote || '') + '"></td>' +
          '<td class="lead-location">' + esc(l.zone || l.city || '—') + '</td>' +
          '<td class="lead-location">' + esc(l.coordinates || l.address || '—') + '</td>' +
          '<td class="cell-plain">' + esc(assignedTime) + '</td>' +
        '</tr>';
      }).join('');

    var header = compact ? '' :
      '<div class="artifact-head"><div class="artifact-head-row"><div>' +
      '<h2 class="table-card-title">Base de llamadas</h2>' +
      '</div>' +
      '<div class="artifact-tools"><div class="field-with-icon">' + icon('search') + '<input type="text" id="input-search-leads" placeholder="Filtrar número" value="' + esc(leadsFilter.search) + '"></div><span class="lead-reference-date">' + new Date().toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' }) + '</span></div></div></div>';

    return header + '<div class="table-card' + (waitingForAssignment ? ' table-card--waiting' : '') + '">' +
      '<div class="table-scroll"><table class="data-table"><thead><tr>' +
      '<th>Teléfono</th><th>Teléfono 2</th><th>Usuario WhatsApp</th><th>Obs. Back</th><th>Estado</th><th>Observación Asesor</th><th>Zona</th><th>Dirección / Coord.</th><th>Hora asig.</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table></div><div class="artifact-sheet-foot">Mostrando ' + leads.length + ' de ' + state.leads.length + ' contactos asignados</div></div>';
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
      ? '<div class="table-empty">' + icon('receipt') + '<p>No hay registros de ventas que coincidan con los filtros aplicados.</p></div>'
      : sales.map(function (s) {
        var dateStr = s.createdAt ? new Date(s.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : s.timestamp;
        var init = initials(s.clientName);
        var avatarCls = avatarColorClass(s.clientName);
        var formattedAmount = Number(s.amount || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return '<div class="sale-row" data-sale-id="' + s.id + '">' +
          '<div class="sale-left">' +
            '<div class="sale-avatar ' + avatarCls + '" title="' + esc(s.clientName) + '">' + esc(init) + '</div>' +
            '<div class="sale-info">' +
              '<div class="sale-top-row">' +
                '<span class="sale-folio">' + esc(s.folio) + '</span>' +
                '<span class="sale-client">' + esc(s.clientName) + '</span>' +
                '<span class="sale-dot-sep">·</span>' +
                '<span class="sale-phone">' + esc(s.clientPhone) + '</span>' +
              '</div>' +
              '<div class="sale-mid-row">' +
                '<span class="sale-product">' + esc(s.productName) + '</span>' +
                '<span class="sale-category">' + esc(s.category) + '</span>' +
                '<span class="sale-advisor">Asesor: <strong>' + esc(s.advisorName) + '</strong></span>' +
              '</div>' +
              (s.notes ? '<p class="sale-notes">“' + esc(s.notes) + '”</p>' : '') +
            '</div>' +
          '</div>' +
          '<div class="sale-right">' +
            '<div class="sale-financials">' +
              '<div class="sale-amount"><span class="sale-currency">S/</span> ' + esc(formattedAmount) + '</div>' +
              '<div class="sale-date">' + esc(dateStr) + '</div>' +
            '</div>' +
            '<div class="sale-actions">' +
              saleStatusBadge(s.status) +
              '<button type="button" class="btn-detail" data-action="sale-detail" data-sale-id="' + s.id + '" title="Ver detalles completos">' + icon('fileText') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');

    var header = compact ? '' :
      '<div class="table-card-header"><div class="table-card-header-row"><div>' +
      '<h2 class="table-card-title">Mis ventas</h2>' +
      '<p class="table-card-subtitle">Registro consolidado de ventas, estado de verificación y observaciones.</p></div>' +
      '<button type="button" id="btn-trigger-upload-sale" class="btn btn-primary-action">' + icon('plus') + '<span>Nueva venta</span></button></div>' +
      '<div class="filters-grid sales">' +
      '<div class="field-with-icon">' + icon('search') + '<input type="text" id="input-search-sales" placeholder="Buscar por folio, cliente, asesor o producto..." value="' + esc(salesFilter.search) + '"></div>' +
      '<div class="field-with-icon">' + icon('filter') + '<select id="select-sale-status">' +
      ['todos:Todos los estados', 'aprobada:Activas', 'en_verificacion:En verificación', 'auditada:Auditadas QA', 'rechazada:Caídas']
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
      var tabBtn = document.getElementById('tab-btn-' + t);
      if (tabBtn) tabBtn.classList.toggle('active', t === tab);
      /* Sidebar nav items */
      var navItem = document.getElementById('nav-' + t);
      if (navItem) navItem.classList.toggle('active', t === tab);
    });
    /* Update topbar title */
    var info = TAB_TITLES[tab];
    if (info) {
      var titleEl = document.getElementById('topbar-title');
      var subEl = document.getElementById('topbar-subtitle');
      if (titleEl) titleEl.textContent = info[0];
      if (subEl) subEl.textContent = info[1];
    }
    /* Close sidebar on mobile */
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
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
      '<option value="" disabled selected>Seleccionar documento</option>' +
      DOCUMENT_TYPES.map(function (d) { return '<option value="' + d + '">' + d + '</option>'; }).join('') +
      '</select></div></div>' +
      '<div class="form-group"><label>Número de documento</label><div class="field-with-icon">' + icon('fileText') + '<input type="text" id="input-doc-number" required placeholder="Ej. 45219876" inputmode="numeric"></div></div>' +
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
      '<div class="form-group"><label>Observaciones / Acuerdos</label><div class="field-with-icon">' + icon('fileText') + '<textarea id="input-notes" rows="2" placeholder="Ej. Grabación de aceptación guardada en carpeta #44."></textarea></div></div>' +
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
      showToast('Venta registrada', name + ' · Enviada a verificación', 'sale');
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
    showToast('Gestión guardada', 'Tipificación y observaciones actualizadas.', 'call');
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
      '<div class="call-topbar"><div class="call-topbar-left"><div class="call-avatar">' + icon('phone') + '</div><div><span class="call-tag">Gestión comercial</span><span class="call-tag-note">MicroSIP activo</span><h3 class="call-phone-number">' + esc(lead.phone) + '</h3></div></div><button type="button" class="modal-close" id="btn-close-call-head">' + icon('x') + '</button></div>' +
      '<div class="modal-body"><div class="call-info-grid">' + details.map(function (item) { return '<div><span class="label">' + item[0] + '</span><span class="value">' + esc(item[1] || '—') + '</span></div>'; }).join('') + '</div>' +
      '<div class="form-group"><label for="call-notes">Observaciones de la llamada</label><textarea id="call-notes" rows="3" placeholder="Ingresa los detalles relevantes de la conversación...">' + esc(callNotesVal) + '</textarea></div>' +
      '<div class="form-group"><label id="call-status-label">Tipificación del contacto</label><div class="disposition-grid" role="group" aria-labelledby="call-status-label">' +
      CALL_DISPOSITIONS.map(function (item) { return '<button type="button" class="disposition-btn ' + item[1] + '" data-finish="' + item[0] + '" aria-pressed="false"><span class="disp-dot" style="background:' + item[3] + '"></span><span>' + item[2] + '</span></button>'; }).join('') +
      '</div><p id="call-status-help" role="status" style="font-size:12px;color:var(--text-muted)">Selecciona una tipificación para registrar la gestión.</p></div>' +
      '<div id="call-coverage-fields" class="form-group" hidden><label for="call-coordinates">Coordenadas · Latitud, longitud</label><input id="call-coordinates" type="text" placeholder="Ej. -12.0464, -77.0428" value="' + esc(lead.coordinates || '') + '"></div>' +
      '<div id="call-presale-fields" class="form-group" hidden><label for="call-document-type">Documento de preventa</label><select id="call-document-type"><option>DNI</option><option>RUC</option><option>CE</option></select><label for="call-document">Número de documento</label><input id="call-document" type="text" placeholder="Ingresa DNI, RUC o CE" value="' + esc(lead.documentNumber || '') + '"></div>' +
      '<div class="call-actions"><button type="button" class="btn-outline" id="btn-cancel-call">Cancelar</button><button type="button" class="btn-secondary-action" id="btn-hangup">' + icon('check') + '<span>Guardar gestión</span></button><button type="button" class="btn btn-primary-action" id="btn-convert-sale">' + icon('check') + '<span>Registrar venta</span></button></div></div></div></div>';
    document.getElementById('call-document-type').value = lead.documentType || 'DNI';
    document.getElementById('call-notes').addEventListener('input', function (e) { callNotesVal = e.target.value; });
    document.getElementById('btn-close-call-head').addEventListener('click', closeCallModal);
    document.querySelectorAll('[data-finish]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        callStatusVal = btn.getAttribute('data-finish');
        document.getElementById('btn-hangup').hidden = callStatusVal === 'venta_cerrada';
        document.getElementById('call-coverage-fields').hidden = callStatusVal !== 'sin_cobertura';
        document.getElementById('call-presale-fields').hidden = callStatusVal !== 'preventa';
        document.querySelectorAll('[data-finish]').forEach(function (option) { option.setAttribute('aria-pressed', String(option === btn)); });
        document.getElementById('call-status-help').textContent = 'Tipificación seleccionada: ' + btn.textContent.trim();
      });
    });
    document.getElementById('btn-cancel-call').addEventListener('click', closeCallModal);
    document.getElementById('btn-hangup').addEventListener('click', function () {
      if (!callStatusVal) { document.getElementById('call-status-help').textContent = 'Selecciona una tipificación antes de guardar.'; return; }
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

    /* Sidebar nav items */
    var navItem = t.closest('.nav-item[data-tab]');
    if (navItem) { setTab(navItem.getAttribute('data-tab')); return; }

    var tabBtn = t.closest('.tab-btn');
    if (tabBtn) { setTab(tabBtn.getAttribute('data-tab')); return; }

    var statusFilter = t.closest('[data-lead-status]');
    if (statusFilter) { leadsFilter.status = statusFilter.getAttribute('data-lead-status'); renderFullCallBase(); return; }

    if (t.closest('#btn-sync-top')) {
      var syncBtn = document.getElementById('btn-sync-top');
      if (syncBtn) syncBtn.classList.add('rotating');
      setTimeout(function () {
        if (syncBtn) syncBtn.classList.remove('rotating');
        showToast('Sincronización Completa', 'Contactos y asignaciones actualizados con Back Office.', 'call');
      }, 600);
      return;
    }

    /* Mobile menu toggle */
    if (t.closest('#btn-menu')) {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('visible');
      return;
    }
    if (t.closest('#sidebar-overlay')) {
      var sb = document.getElementById('sidebar');
      var ov = document.getElementById('sidebar-overlay');
      if (sb) sb.classList.remove('open');
      if (ov) ov.classList.remove('visible');
      return;
    }

    var callBtn = t.closest('[data-action="call"]');
    if (callBtn) { var lead = findLead(callBtn.getAttribute('data-lead-id')); if (lead) dialWithMicroSip(lead); return; }

    var whatsappBtn = t.closest('[data-action="whatsapp"]');
    if (whatsappBtn) {
      var waLead = findLead(whatsappBtn.getAttribute('data-lead-id'));
      var waNumber = waLead ? String(waLead.whatsappUser || waLead.phone || '').replace(/\D/g, '') : '';
      if (waNumber) window.open('https://wa.me/' + waNumber, '_blank', 'noopener');
      else showToast('Sin WhatsApp', 'Este contacto no tiene un número de WhatsApp válido.', 'call');
      return;
    }

    var saleBtn = t.closest('[data-action="sale"]');
    if (saleBtn && !saleBtn.disabled) { var l2 = findLead(saleBtn.getAttribute('data-lead-id')); if (l2) tryOpenSaleFor(l2); return; }

    var detailBtn = t.closest('[data-action="sale-detail"]');
    if (detailBtn) { var s = findSale(detailBtn.getAttribute('data-sale-id')); if (s) openSaleDetail(s); return; }

    if (t.closest('#btn-trigger-upload-sale')) { openUploadModal(null); return; }
  });

  /* El buscador vive dentro del bloque que se vuelve a dibujar: se devuelve el foco tras cada render. */
  function renderKeepingFocus(inputId, render) {
    var current = document.getElementById(inputId);
    var caret = current ? current.selectionStart : 0;
    render();
    var input = document.getElementById(inputId);
    if (!input) return;
    input.focus();
    input.setSelectionRange(caret, caret);
  }

  document.addEventListener('input', function (e) {
    if (e.target.id === 'input-search-leads') { leadsFilter.search = e.target.value; renderKeepingFocus('input-search-leads', renderFullCallBase); }
    if (e.target.id === 'input-search-sales') { salesFilter.search = e.target.value; renderKeepingFocus('input-search-sales', renderFullSalesFeed); }
    if (e.target.classList.contains('input-advisor-note')) {
      var noteLead = findLead(e.target.getAttribute('data-lead-id'));
      if (noteLead) { noteLead.advisorNote = e.target.value; persist(); }
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('artifact-status')) {
      var statusLead = findLead(e.target.getAttribute('data-lead-id'));
      if (statusLead) {
        /* La primera vez que sale de pendiente cuenta como gestión en el tablero. */
        var wasManaged = isManaged(statusLead);
        statusLead.status = storedLeadStatus(e.target.value);
        if (!wasManaged && isManaged(statusLead)) {
          statusLead.managementHistory = (statusLead.managementHistory || []).concat([new Date().toISOString()]);
        }
        persist(); renderAll();
      }
      return;
    }
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
      var before = JSON.stringify([state.leads, state.sales]);
      data.leads = data.leads.filter(function (lead) { return !isDemoLeadId(lead.id); });
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
      var firstLoad = !operationsReady;
      operationsReady = true;
      if (firstLoad || before !== JSON.stringify([state.leads, state.sales])) { renderAll(); persist(); }
    }).catch(function () { var el=document.getElementById('operations-sync-status');if(el)el.textContent='No se pudo cargar la base de Back Office. Recarga para reintentar.'; });
  }
  document.addEventListener('click', function (event) {
    var link=event.target.closest('[data-operation-link]'); if(!link)return;
    event.preventDefault();
    (operationsReady ? queueOperationsSync() : loadOperations().then(function(){if(!operationsReady)throw new Error('Sin conexión');return queueOperationsSync();})).then(function(){window.location.href=link.href;}).catch(function(){});
  });
  /* Las asignaciones de Back Data aparecen solas: se consulta cada pocos segundos sin interrumpir lo que se está escribiendo. */
  var ASSIGNMENT_POLL_MS = 5000;
  function pollAssignments() {
    if (document.hidden || !operationsReady) return;
    var editing = document.activeElement && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (editing || activeCallLead || uploadOpen) return;
    loadOperations();
  }
  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initStaticLabels();
    loadOperations();
    setTab('llamadas');
    renderAll();
    document.getElementById('storage-error').hidden = !storageError;
    persist();
    setInterval(pollAssignments, ASSIGNMENT_POLL_MS);
  });
})();
