@php
use App\Support\PreviewOperations;
$back = $area === 'backoffice';
$title = $back ? 'Back Office' : 'Seguimiento';
$all = array_values($data[$back ? 'leads' : 'sales']);
$visible = array_slice($items, ($page - 1) * 20, 20);
$states = $back ? array_combine(array_unique(array_column($all, 'status')), array_map(fn($s) => ucfirst(str_replace('_', ' ', $s)), array_unique(array_column($all, 'status')))) : PreviewOperations::TRACKING;
$fmt = fn($date) => $date ? \Carbon\Carbon::parse($date)->timezone('America/Lima')->format('d/m/Y H:i') : '—';
$time = fn($date) => $date ? \Carbon\Carbon::parse($date)->timezone('America/Lima')->format('H:i') : '—';
@endphp
<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KRATOS · {{ $title }}</title>
<link rel="stylesheet" href="{{ asset('css/operations.css') }}?v={{ filemtime(public_path('css/operations.css')) }}"></head>
<body>
<aside class="sidebar"><a class="brand" href="{{ route('preview.dashboard') }}">KRATOS<span>Gestión comercial</span></a><p class="nav-label">ESPACIO DE TRABAJO</p>
<a href="{{ route('preview.dashboard') }}"><span>01</span> Asesor</a>
<a href="{{ route('preview.backoffice') }}" @class(['selected'=>$back])><span>02</span> Back Office</a>
<a href="{{ route('preview.seguimiento') }}" @class(['selected'=>!$back])><span>03</span> Seguimiento</a>
<div class="sidebar-bottom"><span class="avatar">{{ mb_strtoupper(mb_substr(session('preview_username'),0,1)) }}</span><div>{{ session('preview_username') }}<small>Entorno de prueba local</small></div></div></aside>
<div class="workspace"><header><span>Operaciones <b>/ {{ $title }}</b></span><form method="post" action="{{ route('preview.logout') }}">@csrf<button class="ghost">Cerrar sesión</button></form></header>
<main><div class="page-heading"><div><p class="eyebrow">{{ $back ? 'DISTRIBUCIÓN Y CONTROL' : 'GESTIÓN POSTVENTA' }}</p><h1>{{ $title }}</h1><p>{{ $back ? 'Organiza la base, asigna contactos y revisa la gestión del equipo.' : 'Supervisa cada venta, su programación y el resultado de instalación.' }}</p></div><div class="actions"><a class="button" href="{{ route('preview.operations.export', ['area'=>$area]) }}">↓ Exportar CSV</a>@if($back)<button class="primary" data-open="new-lead">+ Nuevo contacto</button>@endif</div></div>
@if(session('success'))<div class="notice" role="status">{{ session('success') }}</div>@endif
@if($errors->any())<div class="notice error" role="alert"><strong>No se guardaron los cambios.</strong>@foreach($errors->all() as $error)<p>{{ $error }}</p>@endforeach</div>@endif
<div class="metrics">
@if($back)
@foreach([['Contactos',count($all),'Base total'],['Sin asignar',count(array_filter($all,fn($l)=>!$l['advisor'])),'Pendientes de distribución'],['Asignados',count(array_filter($all,fn($l)=>(bool)$l['advisor'])),'En la base del asesor'],['Ventas cerradas',count(array_filter($all,fn($l)=>in_array($l['status'],['venta_cerrada','instalado']))),'Cierres protegidos']] as [$label,$value,$help])
<article><span>{{ $label }}</span><strong>{{ $value }}</strong><small>{{ $help }}</small></article>@endforeach
@else
@foreach([['Ventas',count($all),'En seguimiento'],['En ejecución',count(array_filter($all,fn($s)=>($s['trackingStatus']??'')==='en_ejecucion')),'Pendientes de instalación'],['Instaladas',count(array_filter($all,fn($s)=>($s['trackingStatus']??'')==='instalado')),'Instalación confirmada'],['Caídas',count(array_filter($all,fn($s)=>($s['trackingStatus']??'')==='caida')),'Requieren revisión']] as [$label,$value,$help])
<article><span>{{ $label }}</span><strong>{{ $value }}</strong><small>{{ $help }}</small></article>@endforeach
@endif
</div>
<section class="panel"><div class="panel-title"><h2>{{ $back ? 'Base de contactos' : 'Control de ventas' }}</h2><span>{{ $total }} resultados</span></div>
<form method="get" class="filters"><label class="search">Buscar<input name="q" value="{{ request('q') }}" placeholder="Teléfono, cliente, documento o zona"></label><label>Asesor<select name="advisor"><option value="">Todos</option>@foreach($advisors as $advisor)<option @selected(request('advisor')===$advisor)>{{ $advisor }}</option>@endforeach</select></label><label>Estado<select name="status"><option value="">Todos</option>@foreach($states as $key=>$label)<option value="{{ $key }}" @selected(request('status')===$key)>{{ $label }}</option>@endforeach</select></label><label>Desde<input type="date" name="from" value="{{ request('from') }}"></label><label>Hasta<input type="date" name="to" value="{{ request('to') }}"></label><button class="primary">Filtrar</button><a class="button" href="{{ url()->current() }}">Limpiar</a></form>
@if($back)
<form id="bulk-assign" method="post" action="{{ route('preview.operations.assign') }}" class="bulk">@csrf<label>Asignar o rotar seleccionados<input name="advisor" list="advisors" placeholder="Usuario exacto del asesor"></label><button>Aplicar asignación</button><span>Deja el usuario vacío para liberar la asignación.</span></form><datalist id="advisors">@foreach($advisors as $advisor)<option value="{{ $advisor }}">@endforeach</datalist>
@endif
<div class="table-scroll"><table><thead><tr>
@if($back)<th><input type="checkbox" id="select-all" aria-label="Seleccionar página"></th><th>Contacto</th><th>Campaña / Zona</th><th>Tipif. Back 1</th><th>Tipif. Back 2</th><th>Estado asesor</th><th>Asesor</th><th>Hora asignada</th><th>Rotaciones</th><th>Observaciones</th><th>Acciones</th>
@else<th>Cliente / Documento</th><th>Estado</th><th>SOT</th><th>Programación</th><th>Plan / Asesor</th><th>Zona / Coordenadas</th><th>Comentario / Motivo</th><th>Acciones</th>@endif
</tr></thead><tbody>
@forelse($visible as $row)
<tr>@if($back)
<td><input form="bulk-assign" type="checkbox" name="ids[]" value="{{ $row['id'] }}" aria-label="Seleccionar {{ $row['phone'] }}"></td>
<td><strong>{{ $row['phone'] }}</strong><small>{{ $row['phone2'] ?: 'Sin teléfono secundario' }}</small><small>{{ $row['whatsappUser'] ? '@'.$row['whatsappUser'] : '—' }}</small></td>
<td>{{ $row['campaign'] ?: '—' }}<small>{{ $row['zone'] ?: '—' }}</small></td><td>{{ $row['back1'] ?: '—' }}</td><td>{{ $row['back2'] ?: '—' }}</td>
<td><span class="badge {{ in_array($row['status'],['venta_cerrada','instalado']) ? 'green' : '' }}">{{ ucfirst(str_replace('_',' ',$row['status'])) }}</span></td><td>{{ $row['advisor'] ?: 'Sin asignar' }}</td><td>{{ $time($row['assignedAt']) }}</td><td>{{ $row['rotations'] }}</td><td class="notes">{{ $row['backNotes'] ?: $row['notes'] ?: '—' }}</td><td><button data-open="edit-{{ $row['id'] }}">Editar</button><button class="ghost" data-open="history-{{ $row['id'] }}">Historial</button></td>
@else
<td><strong>{{ $row['clientName'] ?? 'Sin nombre' }}</strong><small>{{ ($row['documentType']??'').' '.($row['documentNumber']??'—') }}</small><small>{{ $row['clientPhone'] ?? '—' }}</small></td>
<td><span class="badge {{ ($row['trackingStatus']??'')==='instalado' ? 'green' : (($row['trackingStatus']??'')==='caida' ? 'red' : '') }}">{{ PreviewOperations::TRACKING[$row['trackingStatus']??'en_ejecucion'] ?? 'En ejecución' }}</span></td>
<td>{{ $row['sot'] ?: '—' }}</td><td>{{ $row['scheduledDate'] ?: 'Sin programar' }}<small>{{ $row['slot'] }}</small></td><td>{{ $row['productName'] ?? '—' }}<small>{{ $row['advisorName'] }}</small></td><td>{{ $row['zone'] ?? '—' }}<small>{{ $row['coordinates'] ?? '' }}</small></td><td class="notes">{{ $row['comment'] ?: '—' }}<small>{{ $row['reason'] }}</small></td><td><button data-open="edit-{{ $row['id'] }}">Gestionar</button><button class="ghost" data-open="history-{{ $row['id'] }}">Historial</button></td>
@endif</tr>
@empty<tr><td colspan="11"><div class="empty"><strong>{{ $back ? 'Tu base está lista para recibir contactos' : 'Todavía no hay ventas en seguimiento' }}</strong><p>{{ $back ? 'Crea un contacto o importa un CSV. Las gestiones existentes del Asesor se incorporan al entrar en ese apartado.' : 'Las ventas registradas por el Asesor aparecerán aquí al entrar en su apartado.' }}</p></div></td></tr>@endforelse
</tbody></table></div>
<div class="pagination"><span>{{ $total }} registros · Página {{ $page }} de {{ max(1,ceil($total/20)) }}</span><div>@if($page>1)<a class="button" href="{{ request()->fullUrlWithQuery(['page'=>$page-1]) }}">← Anterior</a>@endif @if($page*20<$total)<a class="button" href="{{ request()->fullUrlWithQuery(['page'=>$page+1]) }}">Siguiente →</a>@endif</div></div></section>
@if($back)<details class="panel import"><summary>Importar contactos desde una hoja de cálculo</summary><p>Exporta tu hoja a CSV. Se admiten hasta 500 filas; los teléfonos duplicados se omiten.</p><a href="{{ asset('templates/contactos.csv') }}" download>Descargar plantilla CSV</a><form method="post" action="{{ route('preview.operations.import') }}" enctype="multipart/form-data">@csrf<input type="file" name="csv" accept=".csv,text/csv" required aria-label="Archivo CSV"><button class="primary">Importar contactos</button></form></details>@endif
<p class="footnote">Vista local de desarrollo · Los datos se guardan en esta sesión de KRATOS. No se conecta a los datos de producción.</p>
</main></div>
@if($back)
@foreach(array_merge([null],$visible) as $row)
<dialog id="{{ $row ? 'edit-'.$row['id'] : 'new-lead' }}"><form method="post" action="{{ route('preview.operations.lead') }}">@csrf<h2>{{ $row ? 'Datos del contacto' : 'Nuevo contacto' }}</h2><p class="muted">Información de Back Office</p>@if($row)<input type="hidden" name="id" value="{{ $row['id'] }}">@endif<div class="form-grid">
@foreach(['phone'=>'Teléfono 1','phone2'=>'Teléfono 2','clientName'=>'Nombre del cliente','whatsappUser'=>'Usuario WhatsApp','campaign'=>'Campaña','zone'=>'Zona / Distrito','address'=>'Dirección','coordinates'=>'Coordenadas'] as $key=>$label)<label>{{ $label }}<input name="{{ $key }}" value="{{ $row[$key]??'' }}" maxlength="{{ in_array($key,['phone','phone2']) ? 30 : 150 }}" @required($key==='phone')></label>@endforeach
@foreach(['back1'=>'Tipificación Back 1','back2'=>'Tipificación Back 2'] as $key=>$label)<label>{{ $label }}<select name="{{ $key }}"><option value="">Sin tipificar</option>@foreach(PreviewOperations::BACK as $option)<option @selected(($row[$key]??'')===$option)>{{ $option }}</option>@endforeach</select></label>@endforeach
</div><label>Observaciones de Back Office<textarea name="backNotes" maxlength="2000">{{ $row['backNotes']??'' }}</textarea></label><footer><button type="button" data-close>Cancelar</button><button class="primary">Guardar contacto</button></footer></form></dialog>
@endforeach
@else
@foreach($visible as $row)
<dialog id="edit-{{ $row['id'] }}"><form method="post" action="{{ route('preview.operations.tracking') }}">@csrf<input type="hidden" name="id" value="{{ $row['id'] }}"><h2>Gestionar venta</h2><p class="muted">{{ $row['clientName']??'' }} · {{ $row['clientPhone']??'' }}</p><div class="form-grid"><label>Estado<select name="trackingStatus" required>@foreach(PreviewOperations::TRACKING as $key=>$label)<option value="{{ $key }}" @selected(($row['trackingStatus']??'')===$key)>{{ $label }}</option>@endforeach</select></label><label>Motivo de caída / rechazo<select name="reason"><option value="">Sin motivo</option>@foreach(PreviewOperations::REASONS as $reason)<option @selected($row['reason']===$reason)>{{ $reason }}</option>@endforeach</select></label><label>SOT<input name="sot" value="{{ $row['sot'] }}" maxlength="60"></label><label>Fecha programada<input type="date" name="scheduledDate" value="{{ $row['scheduledDate'] }}"></label><label>Tramo<select name="slot"><option value="">Sin tramo</option>@foreach(['AM','PM','PM 3'] as $slot)<option @selected($row['slot']===$slot)>{{ $slot }}</option>@endforeach</select></label></div><label>Comentario<textarea name="comment" maxlength="2000">{{ $row['comment'] }}</textarea></label><footer><button type="button" data-close>Cancelar</button><button class="primary">Guardar seguimiento</button></footer></form></dialog>
@endforeach
@endif
@foreach($visible as $row)<dialog id="history-{{ $row['id'] }}"><h2>Historial de {{ $back ? 'asignaciones y cambios' : 'seguimiento' }}</h2><ol class="timeline">@forelse(array_reverse($row['history']??[]) as $entry)<li><small>{{ $fmt($entry['at']) }} · {{ $entry['actor'] }}</small><p>{{ $entry['text'] }}</p></li>@empty<li>Sin gestiones registradas.</li>@endforelse</ol>
@if(!$back)<form method="post" action="{{ route('preview.operations.observation') }}">@csrf<input type="hidden" name="id" value="{{ $row['id'] }}"><label>Resultado<select name="result" required>@foreach(PreviewOperations::RESULTS as $result)<option>{{ $result }}</option>@endforeach</select></label><label>Observación<textarea name="note" maxlength="2000" required></textarea></label><button class="primary">Añadir observación</button></form>@endif<footer><button type="button" data-close>Cerrar</button></footer></dialog>@endforeach
<script src="{{ asset('js/operations.js') }}?v={{ filemtime(public_path('js/operations.js')) }}"></script></body></html>
