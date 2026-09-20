@php
use App\Support\PreviewOperations;

$back = $area === 'backoffice';
$title = $back ? 'Back Office' : 'Seguimiento';
$all = array_values($data[$back ? 'leads' : 'sales']);
$visible = array_slice($items, ($page - 1) * 20, 20);
$states = $back
    ? array_combine(array_unique(array_column($all, 'status')), array_map(fn ($s) => ucfirst(str_replace('_', ' ', $s)), array_unique(array_column($all, 'status'))))
    : PreviewOperations::TRACKING;
$fmt = fn ($date) => $date ? \Carbon\Carbon::parse($date)->timezone('America/Lima')->format('d/m/Y H:i') : '—';
$time = fn ($date) => $date ? \Carbon\Carbon::parse($date)->timezone('America/Lima')->format('H:i') : '—';

// Same icon set used by the Asesor dashboard (public/js/dashboard.js ICONS), kept in sync for visual parity.
$paths = [
    'user' => '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    'users' => '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'phone' => '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'mapPin' => '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    'fileText' => '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    'check' => '<polyline points="20 6 9 17 4 12"/>',
    'x' => '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    'plus' => '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    'download' => '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    'upload' => '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    'search' => '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    'filter' => '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    'clock' => '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'package' => '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'shield' => '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
    'alertTriangle' => '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
];
$icon = fn (string $name, string $class = 'i') => '<svg class="'.$class.'" viewBox="0 0 24 24" aria-hidden="true">'.($paths[$name] ?? '').'</svg>';

// Map each status keyword to the shared badge palette (public/css/dashboard.css .status-badge.*).
$leadBadge = fn (string $status) => match (true) {
    in_array($status, ['venta_cerrada', 'instalado'], true) => 'emerald',
    $status === 'contactado' => 'indigo',
    $status === 'rellamada' => 'amber',
    $status === 'no_contesta' => 'yellow',
    $status === 'rechazado' => 'rose',
    default => 'slate',
};
$trackingBadge = fn (string $status) => match ($status) {
    'instalado' => 'emerald',
    'en_ejecucion' => 'indigo',
    'tecnico_casa', 'tecnicos_camino' => 'blue',
    'levantar_sot' => 'amber',
    'instalado_no_validado' => 'yellow',
    'derivado_planta_externa' => 'disposition-no_califica',
    'caida', 'rechazo', 'rechazo_campo', 'rechazo_mesa' => 'rose',
    default => 'slate',
};
$initials = function (string $name) {
    $parts = array_values(array_filter(explode(' ', trim($name))));
    if (! $parts) {
        return '?';
    }

    return mb_strtoupper(mb_substr($parts[0], 0, 1).mb_substr($parts[1] ?? '', 0, 1));
};
@endphp
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>KRATOS · {{ $title }}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/dashboard.css') }}?v={{ filemtime(public_path('css/dashboard.css')) }}">
<link rel="stylesheet" href="{{ asset('css/operations.css') }}?v={{ filemtime(public_path('css/operations.css')) }}">
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <div class="topbar-brand">
      <div class="brand-logo-container">@include('partials.kratos-logo')</div>
      <div class="brand-text">
        <div class="brand-title-row">
          <h1 class="brand-title">KRATOS</h1>
          <span class="brand-tag">{{ $back ? 'BACK OFFICE' : 'SEGUIMIENTO' }}</span>
        </div>
        <p class="brand-subtitle">{{ $back ? 'Distribución y control de la base de contactos' : 'Gestión postventa y control de instalación' }}</p>
      </div>
    </div>
    <div class="topbar-actions">
      <div class="system-status">
        <span class="status-live-dot"></span>
        <span class="status-live-text">En línea</span>
      </div>
      <div class="user-chip-wrap">
        <span class="user-chip">
          <span class="user-chip-avatar">{{ $initials(session('preview_username', '')) }}</span>
          <span class="user-chip-info">
            <strong class="user-chip-name">{{ session('preview_username') }}</strong>
            <span class="user-chip-sub">{{ $title }}</span>
          </span>
        </span>
      </div>
      <form method="POST" action="{{ route('preview.logout') }}" class="logout-form">
        @csrf
        <button type="submit" class="btn-logout" title="Cerrar sesión">{!! $icon('x') !!}<span>Cerrar sesión</span></button>
      </form>
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

  <div class="kpi-grid">
    @if ($back)
      @php
        $metrics = [
            ['Contactos', count($all), 'Base total', 'users', 'indigo'],
            ['Sin asignar', count(array_filter($all, fn ($l) => ! $l['advisor'])), 'Pendientes de distribución', 'alertTriangle', 'amber'],
            ['Asignados', count(array_filter($all, fn ($l) => (bool) $l['advisor'])), 'En la base del asesor', 'user', 'blue'],
            ['Ventas cerradas', count(array_filter($all, fn ($l) => in_array($l['status'], ['venta_cerrada', 'instalado'], true))), 'Cierres protegidos', 'shield', 'emerald'],
        ];
      @endphp
    @else
      @php
        $metrics = [
            ['Ventas', count($all), 'En seguimiento', 'package', 'indigo'],
            ['En ejecución', count(array_filter($all, fn ($s) => ($s['trackingStatus'] ?? '') === 'en_ejecucion')), 'Pendientes de instalación', 'clock', 'amber'],
            ['Instaladas', count(array_filter($all, fn ($s) => ($s['trackingStatus'] ?? '') === 'instalado')), 'Instalación confirmada', 'check', 'emerald'],
            ['Caídas', count(array_filter($all, fn ($s) => ($s['trackingStatus'] ?? '') === 'caida')), 'Requieren revisión', 'alertTriangle', 'rose'],
        ];
      @endphp
    @endif
    @foreach ($metrics as [$label, $value, $help, $iconName, $tone])
      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-label">{{ $label }}</span>
          <div class="kpi-icon {{ $tone }}">{!! $icon($iconName) !!}</div>
        </div>
        <p class="kpi-value">{{ $value }}</p>
        <p class="kpi-detail">{{ $help }}</p>
      </div>
    @endforeach
  </div>

  <section class="table-card">
    <div class="table-card-header">
      <div class="table-card-header-row">
        <div>
          <h3 class="table-card-title">{{ $back ? 'Base de contactos' : 'Control de ventas' }}</h3>
          <p class="table-card-subtitle">{{ $back ? 'Tipificación, asignación y observaciones de cada contacto.' : 'Estado de instalación, programación y motivo de cada venta.' }}</p>
        </div>
        <span class="pill-badge">{{ $total }} resultados</span>
      </div>
      <form method="get" class="filters-grid">
        <div class="field-with-icon">
          {!! $icon('search') !!}
          <input type="text" name="q" value="{{ request('q') }}" placeholder="Teléfono, cliente, documento o zona">
        </div>
        <div class="field-with-icon">
          {!! $icon('user') !!}
          <select name="advisor">
            <option value="">Todos los asesores</option>
            @foreach ($advisors as $advisor)
              <option @selected(request('advisor') === $advisor)>{{ $advisor }}</option>
            @endforeach
          </select>
        </div>
        <div class="field-with-icon">
          {!! $icon('filter') !!}
          <select name="status">
            <option value="">Todos los estados</option>
            @foreach ($states as $key => $label)
              <option value="{{ $key }}" @selected(request('status') === $key)>{{ $label }}</option>
            @endforeach
          </select>
        </div>
        <input type="date" name="from" value="{{ request('from') }}" class="plain-select" aria-label="Desde">
        <input type="date" name="to" value="{{ request('to') }}" class="plain-select" aria-label="Hasta">
        <div class="filters-actions">
          <button type="submit" class="btn btn-primary-action">{!! $icon('filter') !!}<span>Filtrar</span></button>
          <a class="btn-outline" href="{{ url()->current() }}">Limpiar</a>
        </div>
      </form>
    </div>

    @if ($back)
      <form id="bulk-assign" method="post" action="{{ route('preview.operations.assign') }}" class="bulk-bar">
        @csrf
        <div class="field-with-icon bulk-field">
          {!! $icon('users') !!}
          <input name="advisor" list="advisors" placeholder="Usuario exacto del asesor">
        </div>
        <button type="submit" class="btn btn-primary-action">{!! $icon('check') !!}<span>Aplicar a seleccionados</span></button>
        <span class="bulk-hint">Deja el usuario vacío para liberar la asignación.</span>
      </form>
      <datalist id="advisors">
        @foreach ($advisors as $advisor)
          <option value="{{ $advisor }}">
        @endforeach
      </datalist>
    @endif

    <div class="table-scroll table-scroll-tall">
      <table class="data-table">
        <thead>
          <tr>
            @if ($back)
              <th><input type="checkbox" id="select-all" aria-label="Seleccionar página"></th>
              <th>Contacto</th>
              <th>Campaña / Zona</th>
              <th>Tipif. Back 1</th>
              <th>Tipif. Back 2</th>
              <th>Estado asesor</th>
              <th>Asesor</th>
              <th>Asignado</th>
              <th>Rotaciones</th>
              <th>Observaciones</th>
              <th class="text-right">Acciones</th>
            @else
              <th>Cliente / Documento</th>
              <th>Estado</th>
              <th>SOT</th>
              <th>Programación</th>
              <th>Plan / Asesor</th>
              <th>Zona / Coordenadas</th>
              <th>Comentario / Motivo</th>
              <th class="text-right">Acciones</th>
            @endif
          </tr>
        </thead>
        <tbody>
        @forelse ($visible as $row)
          <tr>
            @if ($back)
              <td><input form="bulk-assign" type="checkbox" name="ids[]" value="{{ $row['id'] }}" aria-label="Seleccionar {{ $row['phone'] }}"></td>
              <td>
                <div class="cell-phone">{{ $row['phone'] }}</div>
                <div class="cell-subtle-phone">{{ $row['phone2'] ?: 'Sin teléfono secundario' }}</div>
                <div class="cell-whatsapp">{{ $row['whatsappUser'] ? '@'.$row['whatsappUser'] : '—' }}</div>
              </td>
              <td>
                <span class="cell-campaign">{{ $row['campaign'] ?: '—' }}</span>
                <div class="cell-zone cell-with-icon">{!! $icon('mapPin') !!}{{ $row['zone'] ?: '—' }}</div>
              </td>
              <td>{{ $row['back1'] ?: '—' }}</td>
              <td>{{ $row['back2'] ?: '—' }}</td>
              <td><span class="status-badge {{ $leadBadge($row['status']) }}"><span class="status-dot"></span>{{ ucfirst(str_replace('_', ' ', $row['status'])) }}</span></td>
              <td>{{ $row['advisor'] ?: 'Sin asignar' }}</td>
              <td>{{ $time($row['assignedAt']) }}</td>
              <td>{{ $row['rotations'] }}</td>
              <td class="cell-notes">{{ $row['backNotes'] ?: $row['notes'] ?: '—' }}</td>
              <td class="text-right">
                <div class="row-actions">
                  <button type="button" class="btn-outline btn-compact" data-open="edit-{{ $row['id'] }}">Editar</button>
                  <button type="button" class="btn-outline btn-compact" data-open="history-{{ $row['id'] }}">{!! $icon('clock') !!}</button>
                </div>
              </td>
            @else
              <td>
                <div class="cell-name">{{ $row['clientName'] ?? 'Sin nombre' }}</div>
                <div class="cell-sub">{{ trim(($row['documentType'] ?? '').' '.($row['documentNumber'] ?? '—')) }}</div>
                <div class="cell-sub">{!! $icon('phone') !!}{{ $row['clientPhone'] ?? '—' }}</div>
              </td>
              <td><span class="status-badge {{ $trackingBadge($row['trackingStatus'] ?? 'en_ejecucion') }}"><span class="status-dot"></span>{{ PreviewOperations::TRACKING[$row['trackingStatus'] ?? 'en_ejecucion'] ?? 'En ejecución' }}</span></td>
              <td>{{ $row['sot'] ?: '—' }}</td>
              <td>{{ $row['scheduledDate'] ?: 'Sin programar' }}<div class="cell-sub">{{ $row['slot'] }}</div></td>
              <td>{{ $row['productName'] ?? '—' }}<div class="cell-sub">{{ $row['advisorName'] }}</div></td>
              <td>
                <div class="cell-sub">{!! $icon('mapPin') !!}{{ $row['zone'] ?? '—' }}</div>
                <div class="cell-sub">{{ $row['coordinates'] ?? '' }}</div>
              </td>
              <td class="cell-notes">{{ $row['comment'] ?: '—' }}<div class="cell-sub">{{ $row['reason'] }}</div></td>
              <td class="text-right">
                <div class="row-actions">
                  <button type="button" class="btn-outline btn-compact" data-open="edit-{{ $row['id'] }}">Gestionar</button>
                  <button type="button" class="btn-outline btn-compact" data-open="history-{{ $row['id'] }}">{!! $icon('clock') !!}</button>
                </div>
              </td>
            @endif
          </tr>
        @empty
          <tr>
            <td colspan="11">
              <div class="table-empty">
                {!! $icon('fileText') !!}
                <p><strong>{{ $back ? 'Tu base está lista para recibir contactos' : 'Todavía no hay ventas en seguimiento' }}</strong></p>
                <p>{{ $back ? 'Crea un contacto o importa un CSV. Las gestiones del Asesor se incorporan al entrar en ese apartado.' : 'Las ventas registradas por el Asesor aparecerán aquí al entrar en su apartado.' }}</p>
              </div>
            </td>
          </tr>
        @endforelse
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      <span>{{ $total }} registros · Página {{ $page }} de {{ max(1, ceil($total / 20)) }}</span>
      <div class="pagination-links">
        @if ($page > 1)
          <a class="btn-outline btn-compact" href="{{ request()->fullUrlWithQuery(['page' => $page - 1]) }}">← Anterior</a>
        @endif
        @if ($page * 20 < $total)
          <a class="btn-outline btn-compact" href="{{ request()->fullUrlWithQuery(['page' => $page + 1]) }}">Siguiente →</a>
        @endif
      </div>
    </div>
  </section>

  @if ($back)
    <details class="import-panel">
      <summary>{!! $icon('upload') !!}<span>Importar contactos desde una hoja de cálculo</span></summary>
      <div class="import-body">
        <p>Exporta tu hoja a CSV. Se admiten hasta 500 filas; los teléfonos duplicados se omiten.</p>
        <a class="btn-outline" href="{{ asset('templates/contactos.csv') }}" download>{!! $icon('download') !!}<span>Descargar plantilla CSV</span></a>
        <form method="post" action="{{ route('preview.operations.import') }}" enctype="multipart/form-data" class="import-form">
          @csrf
          <input type="file" name="csv" accept=".csv,text/csv" required aria-label="Archivo CSV">
          <button type="submit" class="btn btn-primary-action">{!! $icon('upload') !!}<span>Importar contactos</span></button>
        </form>
      </div>
    </details>
  @endif

  <p class="footer-note">Vista local de desarrollo · Los datos se guardan en esta sesión de KRATOS. No se conecta a los datos de producción.</p>
</main>

@if ($back)
  @foreach (array_merge([null], $visible) as $row)
    <dialog id="{{ $row ? 'edit-'.$row['id'] : 'new-lead' }}" class="modal-dialog">
      <form method="post" action="{{ route('preview.operations.lead') }}">
        @csrf
        <div class="modal-head">
          <div class="modal-head-left">
            <div class="modal-head-icon">{!! $icon($row ? 'fileText' : 'plus') !!}</div>
            <div>
              <h3>{{ $row ? 'Datos del contacto' : 'Nuevo contacto' }}</h3>
              <p>Información de Back Office</p>
            </div>
          </div>
          <button type="button" class="modal-close" data-close>{!! $icon('x') !!}</button>
        </div>
        <div class="modal-body">
          @if ($row)
            <input type="hidden" name="id" value="{{ $row['id'] }}">
          @endif
          <div class="form-grid">
            @foreach (['phone' => 'Teléfono 1', 'phone2' => 'Teléfono 2', 'clientName' => 'Nombre del cliente', 'whatsappUser' => 'Usuario WhatsApp', 'campaign' => 'Campaña', 'zone' => 'Zona / Distrito', 'address' => 'Dirección', 'coordinates' => 'Coordenadas'] as $key => $label)
              <div class="form-group">
                <label>{{ $label }}</label>
                <div class="field-with-icon">
                  {!! $icon('user') !!}
                  <input name="{{ $key }}" value="{{ $row[$key] ?? '' }}" maxlength="{{ in_array($key, ['phone', 'phone2']) ? 30 : 150 }}" @required($key === 'phone')>
                </div>
              </div>
            @endforeach
            @foreach (['back1' => 'Tipificación Back 1', 'back2' => 'Tipificación Back 2'] as $key => $label)
              <div class="form-group">
                <label>{{ $label }}</label>
                <select name="{{ $key }}">
                  <option value="">Sin tipificar</option>
                  @foreach (PreviewOperations::BACK as $option)
                    <option @selected(($row[$key] ?? '') === $option)>{{ $option }}</option>
                  @endforeach
                </select>
              </div>
            @endforeach
          </div>
          <div class="form-group">
            <label>Observaciones de Back Office</label>
            <div class="field-with-icon">
              {!! $icon('fileText') !!}
              <textarea name="backNotes" maxlength="2000">{{ $row['backNotes'] ?? '' }}</textarea>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-outline" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary-action">{!! $icon('check') !!}<span>Guardar contacto</span></button>
        </div>
      </form>
    </dialog>
  @endforeach
@else
  @foreach ($visible as $row)
    <dialog id="edit-{{ $row['id'] }}" class="modal-dialog">
      <form method="post" action="{{ route('preview.operations.tracking') }}">
        @csrf
        <input type="hidden" name="id" value="{{ $row['id'] }}">
        <div class="modal-head">
          <div class="modal-head-left">
            <div class="modal-head-icon">{!! $icon('package') !!}</div>
            <div>
              <h3>Gestionar venta</h3>
              <p>{{ $row['clientName'] ?? '' }} · {{ $row['clientPhone'] ?? '' }}</p>
            </div>
          </div>
          <button type="button" class="modal-close" data-close>{!! $icon('x') !!}</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Estado</label>
              <select name="trackingStatus" required>
                @foreach (PreviewOperations::TRACKING as $key => $label)
                  <option value="{{ $key }}" @selected(($row['trackingStatus'] ?? '') === $key)>{{ $label }}</option>
                @endforeach
              </select>
            </div>
            <div class="form-group">
              <label>Motivo de caída / rechazo</label>
              <select name="reason">
                <option value="">Sin motivo</option>
                @foreach (PreviewOperations::REASONS as $reason)
                  <option @selected($row['reason'] === $reason)>{{ $reason }}</option>
                @endforeach
              </select>
            </div>
            <div class="form-group">
              <label>SOT</label>
              <div class="field-with-icon">{!! $icon('fileText') !!}<input name="sot" value="{{ $row['sot'] }}" maxlength="60"></div>
            </div>
            <div class="form-group">
              <label>Fecha programada</label>
              <input type="date" name="scheduledDate" value="{{ $row['scheduledDate'] }}">
            </div>
            <div class="form-group">
              <label>Tramo</label>
              <select name="slot">
                <option value="">Sin tramo</option>
                @foreach (['AM', 'PM', 'PM 3'] as $slot)
                  <option @selected($row['slot'] === $slot)>{{ $slot }}</option>
                @endforeach
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Comentario</label>
            <div class="field-with-icon">
              {!! $icon('fileText') !!}
              <textarea name="comment" maxlength="2000">{{ $row['comment'] }}</textarea>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-outline" data-close>Cancelar</button>
          <button type="submit" class="btn btn-primary-action">{!! $icon('check') !!}<span>Guardar seguimiento</span></button>
        </div>
      </form>
    </dialog>
  @endforeach
@endif

@foreach ($visible as $row)
  <dialog id="history-{{ $row['id'] }}" class="modal-dialog">
    <div class="modal-head">
      <div class="modal-head-left">
        <div class="modal-head-icon">{!! $icon('clock') !!}</div>
        <div><h3>Historial de {{ $back ? 'asignaciones y cambios' : 'seguimiento' }}</h3></div>
      </div>
      <button type="button" class="modal-close" data-close>{!! $icon('x') !!}</button>
    </div>
    <div class="modal-body">
      <ol class="timeline">
        @forelse (array_reverse($row['history'] ?? []) as $entry)
          <li><small>{{ $fmt($entry['at']) }} · {{ $entry['actor'] }}</small><p>{{ $entry['text'] }}</p></li>
        @empty
          <li class="timeline-empty"><p>Sin gestiones registradas.</p></li>
        @endforelse
      </ol>
      @if (! $back)
        <form method="post" action="{{ route('preview.operations.observation') }}" class="observation-form">
          @csrf
          <input type="hidden" name="id" value="{{ $row['id'] }}">
          <div class="form-group">
            <label>Resultado</label>
            <select name="result" required>
              @foreach (PreviewOperations::RESULTS as $result)
                <option>{{ $result }}</option>
              @endforeach
            </select>
          </div>
          <div class="form-group">
            <label>Observación</label>
            <div class="field-with-icon">{!! $icon('fileText') !!}<textarea name="note" maxlength="2000" required></textarea></div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary-action">{!! $icon('check') !!}<span>Añadir observación</span></button>
          </div>
        </form>
      @endif
    </div>
    <div class="form-actions modal-footer-close">
      <button type="button" class="btn-outline" data-close>Cerrar</button>
    </div>
  </dialog>
@endforeach

<script src="{{ asset('js/operations.js') }}?v={{ filemtime(public_path('js/operations.js')) }}"></script>
</body>
</html>
