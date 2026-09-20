<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>KRATOS · {{ $back ? 'Back Office' : 'Seguimiento' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/operations.css') }}?v={{ filemtime(public_path('css/operations.css')) }}">
    <link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}">
</head>
<body>

<!-- Header superior -->
<header class="topbar">
  <div class="topbar-inner">
    <div class="topbar-brand">
      <span class="topbar-logo">KRATOS</span>
      <span>Oficina Regional</span>
    </div>

    <div class="topbar-left">
      <h2 class="topbar-title">Base de llamadas</h2>
      <p class="topbar-sub-detail">Contactos asignados para gestión comercial</p>
    </div>

    <div class="topbar-right">
      <button class="topbar-action secondary">Sincronizar</button>
      <span class="badge-online">En línea</span>
    </div>
  </div>
</header>

<main class="page">
  <nav class="tabs area-switch" aria-label="Áreas de KRATOS">
    <a class="tab-btn" data-operation-link href="{{ route('preview.dashboard') }}">Asesor</a>
    <a class="tab-btn {{ $back ? 'active' : '' }}" @if($back) aria-current="page" @endif href="{{ route('preview.backoffice') }}">Back Office</a>
    <a class="tab-btn {{ ! $back ? 'active' : '' }}" @if(! $back) aria-current="page" @endif href="{{ route('preview.seguimiento') }}">Seguimiento</a>
  </nav>

  @if (session('success'))
    <p class="alert-success">{!! $icon('check') !!}{{ session('success') }}</p>
  @endif
  @if ($errors->any())
    <div class="alert-warning">
      <strong>No se guardaron los cambios.</strong>
      @foreach ($errors->all() as $error)
        <p>{{ $error }}</p>
      @endforeach
    </div>
  @endif

  <div class="page-heading">
    <div>
      <p class="eyebrow">{{ $back ? 'DISTRIBUCIÓN Y CONTROL' : 'GESTIÓN POSTVENTA' }}</p>
      <h2 class="page-title">{{ $title }}</h2>
      <p class="page-lead">{{ $back ? 'Organiza la base, asigna contactos y revisa la gestión del equipo.' : 'Supervisa cada venta, su programación y el resultado de instalación.' }}</p>
    </div>
    <div class="page-actions">
      <a class="btn-outline" href="{{ route('preview.operations.export', ['area' => $area]) }}">{!! $icon('download') !!}<span>Exportar CSV</span></a>
      @if ($back)
        <button type="button" class="btn btn-primary-action" data-open="new-lead">{!! $icon('plus') !!}<span>Nuevo contacto</span></button>
      @endif
    </div>
  </div>

  <div class="container-max">

    <!-- Sección: Base de llamadas -->
    <div class="col-12 mb-30">

      <!-- Bloque superior oscuro -->
      <div class="call-block-dark">
        <h3 class="section-title">Base de llamadas</h3>
        <p class="section-subtitle">Contactos asignados por Back Office para gestión y seguimiento comercial.</p>
      </div>

      <!-- Filtros -->
      <div class="filters-row">
        <input type="text" class="call-search" placeholder="🔍 Buscar por teléfono, WhatsApp o zona...">
        <select class="select">
          <option>Todos los estados</option>
          <option>Pendiente</option>
          <option>En ejecución</option>
        </select>
      </div>

    </div>

    <!-- Tarjetas KPIs -->
    <div class="kpi-cards">
      <div class="kpi-card kpi--odd">
        <div class="kpi-number">3</div>
        <div class="kpi-label">Ventas cerradas</div>
      </div>
      <div class="kpi-card kpi--even">
        <div class="kpi-number">5</div>
        <div class="kpi-label">Totales registradas</div>
      </div>
      <div class="kpi-card kpi--odd">
        <div class="kpi-number">2</div>
        <div class="kpi-label">Del día</div>
      </div>
      <div class="kpi-card kpi--even">
        <div class="kpi-number">1</div>
        <div class="kpi-label">Caídas</div>
      </div>
    </div>

    <!-- Tabla Base de Llamadas -->
    <div class="card">
      <div class="table-call">
        <thead>
          <tr>
            <th>Contacto</th>
            <th>Teléfono</th>
            <th>Campaña</th>
            <th>Zona</th>
            <th>Asesor</th>
            <th>Estado</th>
            <th class="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
        @forelse ($visible as $row)
          <tr>
            <td>
              <div class="cell-name">{{ $row['clientName'] ?? 'Sin nombre' }}</div>
              <div class="cell-sub">{{ trim(($row['documentType'] ?? '').' '.($row['documentNumber'] ?? '—')) }}</div>
            </td>
            <td>
              <span class="phone-number">{{ $row['phone'] }}</span>
              <span class="phone-sub">{{ $row['phone2'] ?: 'Sin teléfono secundario' }}</span>
            </td>
            <td>
              <span class="cell-campaign">{{ $row['campaign'] ?: '—' }}</span>
              <div class="cell-zone cell-with-icon">{!! $icon('mapPin') !!}{{ $row['zone'] ?: '—' }}</div>
            </td>
            <td>{{ $row['back1'] ?: '—' }}</td>
            <td>{{ $row['back2'] ?: '—' }}</td>
            <td><span class="status-badge {{ $leadBadge($row['status']) }}"><span class="status-dot"></span>{{ ucfirst(str_replace('_', ' ', $row['status'])) }}</span></td>
            <td class="text-right">
              <div class="row-actions">
                <button type="button" class="action-btn">Gestionar</button>
                <button type="button" class="action-btn secondary">Ver</button>
              </div>
            </td>
          </tr>
        @empty
          <tr>
            <td colspan="7">
              <div class="table-empty">
                {!! $icon('fileText') !!}
                <p><strong>Tu base está lista para recibir contactos</strong></p>
                <p>Crea un contacto o importa un CSV. Las gestiones del Asesor se incorporan al entrar en ese apartado.</p>
              </div>
            </td>
          </tr>
        @endforelse
        </tbody>
      </table>
    </div>

    <!-- Sección: Mis Ventas -->
    <div class="sales-section mb-30">
      <div class="sales-header">
        <h3 class="sales-section-title">Mis ventas</h3>
        <p class="sales-section-desc">Histórico y comisiones de altas, portabilidades y contratos</p>
      </div>

      <!-- KPIs de ventas -->
      <div class="kpi-cards">
        <div class="kpi-card kpi--odd">
          <div class="kpi-number">12</div>
          <div class="kpi-label">Ventas registradas</div>
        </div>
        <div class="kpi-card kpi--even">
          <div class="kpi-number">S/ 3,800</div>
          <div class="kpi-label">Comisión estimada acumulada</div>
        </div>
        <div class="kpi-card kpi--odd">
          <div class="kpi-number">S/ 5,396</div>
          <div class="kpi-label">Facturación mensual generada</div>
        </div>
        <div class="kpi-card kpi--even">
          <div class="kpi-number">Recurrente</div>
          <div class="kpi-label">Tipo de facturación</div>
        </div>
      </div>

      <!-- Tabla de ventas -->
      <div class="card">
        <div class="table-sales">
          <thead>
            <tr>
              <th>Folio Contrato</th>
              <th>Cliente Titular</th>
              <th>Producto / Plan</th>
              <th>Renta Mensual</th>
              <th>Comisión</th>
              <th>Fecha Venta</th>
              <th>Estado Contrato</th>
            </tr>
          </thead>
          <tbody>
          @forelse ($visible as $row)
            <tr>
              <td>{{ $row['folio'] ?? '-' }}</td>
              <td>{{ $row['clientName'] ?? 'Sin nombre' }}</td>
              <td>{{ $row['productName'] ?? '—' }}<div class="cell-sub">{{ $row['advisorName'] }}</div></td>
              <td>S/ {{ $row['monthlyRent'] ?? '—' }}</td>
              <td><span class="commission-positive">+S/ 150</span></td>
              <td>{{ $row['saleDate'] ?? '—' }}</td>
              <td>
                <span class="badge badge--contacted">Pendiente</span>
              </td>
            </tr>
          @empty
            <tr>
              <td colspan="7">
                <p>Aún no hay ventas registradas.</p>
              </td>
            </tr>
          @endforelse
          </tbody>
        </table>
      </div>
    </div>

    <!-- Barra de acciones en Mis Ventas -->
    <div class="sales-actions">
      <div class="search">
        <input type="text" placeholder="Buscar por cliente, folio o producto...">
      </div>
      <button class="btn-primary">+ Registrar Nueva Venta</button>
    </div>

    <!-- Sección: Tablero y Métricas -->
    <div class="dashboard-premium">
      <div class="section-title">Tablero y métricas</div>
      <div class="section-subtitle">Resumen de actividad comercial del asesor</div>
      
      <div class="kpi-small">
        <span>X contactos asignados en cartera</span>
      </div>
    </div>

    <!-- Sección: Distribución de contactos -->
    <div class="distribution-card">
      <div class="section-title">Distribución de contactos</div>
      <div class="section-subtitle">Tipificación actual de la base asignada</div>
      
      <div class="distribution-states">
        <div class="distribution-state">
          <span class="name">Pendientes de gestión</span>
          <span class="percentage">12 (30%)</span>
        </div>
        <div class="distribution-state">
          <span class="name">Venta cerrada</span>
          <span class="percentage">5 (15%)</span>
        </div>
        <div class="distribution-state">
          <span class="name">Interesado</span>
        </div>
        <div class="distribution-state">
          <span class="name">Nuevo</span>
        </div>
        <div class="distribution-state">
          <span class="name">Rellamada</span>
        </div>
        <div class="distribution-state">
          <span class="name">Contactado</span>
        </div>
        <div class="distribution-state">
          <span class="name">No le interesa</span>
        </div>
      </div>
      
      <!-- Barras de progreso -->
      <div class="progress-bar">
        <div class="progress progress--new" style="width: 30%"></div>
      </div>
    </div>

  </div>
</main>

</body>
</html>