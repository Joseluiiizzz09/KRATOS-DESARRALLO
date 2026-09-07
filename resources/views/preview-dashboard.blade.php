<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>KRATOS — Asesor</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}">
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <div class="topbar-brand">
      <div class="brand-icon">@include('partials.kratos-logo')</div>
      <div class="brand-text">
        <div class="brand-title-row">
          <h1>KRATOS</h1>
        </div>
        <p class="brand-subtitle">Base de llamadas, métricas y registro de ventas</p>
      </div>
    </div>
    <div class="topbar-actions">
      <span class="user-chip" id="icon-user-chip">{{ $username }}</span>
      <form method="POST" action="{{ route('preview.logout') }}">
        @csrf
        <button type="submit" class="btn btn-ghost" id="btn-logout"></button>
      </form>
    </div>
  </div>
</header>

<main class="page">
  <nav class="tabs" aria-label="Secciones de Asesor">
    <button type="button" class="tab-btn active" data-tab="llamadas" id="tab-btn-llamadas">Base de llamadas</button>
    <button type="button" class="tab-btn" data-tab="tablero" id="tab-btn-tablero">Tablero y métricas</button>
    <button type="button" class="tab-btn" data-tab="ventas" id="tab-btn-ventas">Mis ventas</button>
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
  logoutUrl: @json(route('preview.logout')),
  csrf: @json(csrf_token())
};
</script>
<script src="{{ asset('js/dashboard.js') }}?v={{ filemtime(public_path('js/dashboard.js')) }}"></script>
</body>
</html>
