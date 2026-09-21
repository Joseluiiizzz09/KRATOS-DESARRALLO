<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>KRATOS — Portal Asesor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/portal-asesor-base.css') }}?v={{ filemtime(public_path('css/portal-asesor-base.css')) }}">
<link rel="stylesheet" href="{{ asset('css/portal-asesor.css') }}?v={{ filemtime(public_path('css/portal-asesor.css')) }}">
</head>
<body>

<aside class="sidebar" id="sidebar">
  <div class="sidebar-header">
    <div class="sidebar-logo" aria-hidden="true">K</div>
    <div class="sidebar-brand">
      <div class="sidebar-brand-row">
        <h1 class="sidebar-brand-name">KRATOS</h1>
      </div>
      <span class="sidebar-brand-sub">Sistema de llamadas</span>
    </div>
    <button type="button" class="sidebar-collapse-btn" id="sidebar-toggle" aria-label="Ocultar menú lateral" aria-expanded="true" title="Ocultar menú">
      <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
  </div>

  <nav class="sidebar-nav" aria-label="Navegación principal">
    <button type="button" class="nav-item active" data-tab="llamadas" id="nav-llamadas">
      <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span>Base de llamadas</span>
      <span class="nav-item-count badge-red" id="count-llamadas">0</span>
    </button>
    <button type="button" class="nav-item" data-tab="tablero" id="nav-tablero">
      <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
      <span>Tablero y métricas</span>
    </button>
    <button type="button" class="nav-item" data-tab="ventas" id="nav-ventas">
      <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
      <span>Mis ventas</span>
      <span class="nav-item-count badge-gray" id="count-ventas">5</span>
    </button>

    <a class="nav-item nav-operation-link" data-operation-link href="{{ route('preview.backoffice') }}">Back Office</a><a class="nav-item nav-operation-link" data-operation-link href="{{ route('preview.seguimiento') }}">Seguimiento</a><span id="operations-sync-status" role="status"></span>
  </nav>

  <div class="sidebar-footer" id="sidebar-footer">
    <div class="sidebar-progress"><div><span>Gestionadas hoy</span><strong id="sidebar-progress-count">0</strong></div><i><b id="sidebar-progress-bar"></b></i><small>de contactos asignados</small></div>
    <form method="POST" action="{{ route('preview.logout') }}" class="logout-form">
      @csrf
      <button type="submit" class="sidebar-logout" id="btn-logout" title="Cerrar sesion">
        <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      </button>
    </form>
  </div>
</aside>

<div class="sidebar-overlay" id="sidebar-overlay"></div>

<div class="main-wrap">
  <header class="topbar">
    <div class="topbar-left">
      <button type="button" class="topbar-menu-btn" id="btn-menu" aria-label="Menu">
        <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <h2 class="topbar-title" id="topbar-title">Base de llamadas</h2>
      <p class="topbar-subtitle" id="topbar-subtitle">Contactos asignados para gestion comercial</p>
    </div>
    <div class="topbar-right">
      <button type="button" class="btn-top-sync" id="btn-sync-top">
        <svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
        <span>Sincronizar</span>
      </button>
      <div class="topbar-status">
        <span class="status-live-dot"></span>
        <span class="status-live-text">En linea</span>
      </div>
    </div>
  </header>

  <div class="content-area">
    <p id="storage-error" class="alert-warning" hidden>No se pudieron guardar los cambios en este navegador. Exporta tus ventas antes de salir.</p>

    <section id="panel-tablero" class="tab-panel" hidden>
      <div id="section-banner"></div>
      <div class="kpi-grid" id="kpi-grid"></div>
      <div class="charts-grid">
        <div class="chart-card" id="chart-bars"></div>
        <div class="chart-card" id="chart-status"></div>
      </div>
    </section>

    <section id="panel-llamadas" class="tab-panel">
      <div id="full-call-base"></div>
    </section>

    <section id="panel-ventas" class="tab-panel" hidden>
      <div id="full-sales-feed"></div>
    </section>

    <p class="footer-note">KRATOS · Asesor · Datos de demostracion guardados en este navegador</p>
  </div>
</div>

<a href="{{ route('login') }}" class="btn-floating-login" title="Ver Pantalla de Login KRATOS">
  <span class="floating-login-arrow">&rarr;</span>
  <span>Ver Pantalla de Login KRATOS</span>
</a>

<div id="modal-root"></div>
<div id="toast-root"></div>

<!-- Hidden elements for backward compatibility with dashboard.js -->
<button type="button" class="tab-btn active" data-tab="llamadas" id="tab-btn-llamadas" hidden></button>
<button type="button" class="tab-btn" data-tab="tablero" id="tab-btn-tablero" hidden></button>
<button type="button" class="tab-btn" data-tab="ventas" id="tab-btn-ventas" hidden></button>

<script>
window.__KRATOS__ = {
  username: @json($username),
  operationsSync: @json(route('preview.operations.sync')),
  operationsAdvisor: @json(route('preview.operations.advisor')),
  logoutUrl: @json(route('preview.logout')),
  csrf: @json(csrf_token())
};
</script>
<script src="{{ asset('js/dashboard.js') }}?v={{ filemtime(public_path('js/dashboard.js')) }}"></script>
</body>
</html>
