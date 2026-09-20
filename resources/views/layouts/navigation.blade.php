<nav class="sidebar">
  <!-- Parte superior: Logo y subtítulo -->
  <div class="sidebar-header">
    <span class="sidebar-logo">KRATOS</span>
    <span class="sidebar-subtitle">Plataforma Comercial</span>
  </div>

  <!-- Categorías de navegación -->
  <ul class="sidebar-nav">
    <li>
      <a href="{{ route('dashboard') }}" class="active">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
        <span>Base de llamadas</span>
        <span class="sidebar-badge" id="count-llamadas">0</span>
      </a>
    </li>

    <li>
      <a href="{{ route('preview.seguimiento') }}">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2v2l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
        <span>Mis ventas</span>
        <span class="sidebar-badge" id="count-ventas">5</span>
      </a>
    </li>

    <!-- Separador visual -->
    <li>
      <span class="sidebar-section">REPORTES</span>
    </li>

    <li>
      <a href="#">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
        <span>Tablero y métricas</span>
      </a>
    </li>

    <li>
      <a href="#">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>Áreas</span>
      </a>
    </li>
  </ul>
</nav>

<!-- Perfil en parte inferior del sidebar -->
<div class="sidebar-footer">
  <div class="sidebar-profile">
    <div class="sidebar-avatar">SS</div>
    <div class="sidebar-profile-info">
      <span class="sidebar-profile-name">Sergio Salazar</span>
      <span class="sidebar-profile-role">Asesor Comercial</span>
    </div>
  </div>

  <button class="sidebar-logout" title="Cerrar sesión">
    Cerrar sesión
  </button>
</div>