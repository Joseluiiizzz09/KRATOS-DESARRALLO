<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>KRATOS — Portal Asesor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}">
<link rel="stylesheet" href="{{ asset('css/dashboard-formal.css') }}?v={{ filemtime(public_path('css/dashboard-formal.css')) }}">
<link rel="stylesheet" href="{{ asset('css/dashboard-backoffice.css') }}?v={{ filemtime(public_path('css/dashboard-backoffice.css')) }}">
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <div class="topbar-brand">
      <div class="brand-logo-container">@include('partials.kratos-logo')</div>
      <div class="brand-text">
        <div class="brand-title-row">
          <h1 class="brand-title">KRATOS</h1>
        </div>
        <p class="brand-subtitle">Sistema de llamadas</p>
      </div>
      <button type="button" class="sidebar-toggle" id="sidebar-toggle" aria-label="Ocultar menú lateral" aria-expanded="true">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    <div class="topbar-actions">
      <div class="system-status">
        <span class="status-live-dot"></span>
        <span class="status-live-text">En línea</span>
      </div>
      <div class="user-chip-wrap">
        <span class="user-chip" id="icon-user-chip">{{ $username }}</span>
      </div>
      <form method="POST" action="{{ route('preview.logout') }}" class="logout-form">
        @csrf
        <button type="submit" class="btn-logout" id="btn-logout" title="Cerrar sesión"></button>
      </form>
    </div>
  </div>
</header>

<main class="page">
  <nav class="tabs" aria-label="Secciones del Asesor">
    <button type="button" class="tab-btn active" data-tab="llamadas" id="tab-btn-llamadas">Base de llamadas</button>
    <button type="button" class="tab-btn" data-tab="tablero" id="tab-btn-tablero">Tablero y métricas</button>
    <button type="button" class="tab-btn" data-tab="ventas" id="tab-btn-ventas">Mis ventas</button>
    <div class="advisor-rail-footer"><div class="rail-progress-head"><span>Gestionadas hoy</span><strong id="rail-managed-today">0</strong></div><div class="rail-progress"><span id="rail-progress-bar"></span></div><small>de <span id="rail-assigned-total">0</span> registros asignados</small><form method="POST" action="{{ route('preview.logout') }}" class="logout-form">@csrf<button type="submit" class="btn-logout" title="Cerrar sesión">↪ <span>Cerrar sesión</span></button></form></div>
  </nav>

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

  <p class="footer-note">KRATOS · Asesor · Datos de demostración guardados en este navegador</p>
</main>

<div id="modal-root"></div>
<div id="toast-root"></div>

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
