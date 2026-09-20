<?php

namespace App\Http\Controllers;

use App\Support\BackOfficeRules;
use App\Support\PreviewOperations;
use Carbon\Carbon;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class BackOfficeController extends Controller
{
    public function __construct(private PreviewOperations $store) {}

    private function payload(Request $request): array
    {
        $data = $this->store->data($request);
        $advisors = array_values(array_unique(array_filter(array_merge([$request->session()->get('preview_username')], array_column($data['leads'], 'advisor'), array_column($data['sales'], 'advisorName'), $data['advisors'] ?? []))));
        $leads = array_values($data['leads']);
        foreach ($leads as &$lead) {
            $lead['effective'] = BackOfficeRules::effective($lead);
            $lead['baseDate'] ??= Carbon::parse($lead['createdAt'])->timezone('America/Lima')->toDateString();
        }

        return ['leads' => $leads, 'sales' => array_values($data['sales']), 'advisors' => $advisors, 'actor' => $request->session()->get('preview_username'), 'today' => now('America/Lima')->toDateString(), 'vendor' => BackOfficeRules::VENDOR, 'back' => PreviewOperations::BACK];
    }

    public function index(Request $request): View
    {
        return view('operations.backoffice', ['boot' => $this->payload($request)]);
    }

    public function data(Request $request): JsonResponse
    {
        return response()->json($this->payload($request));
    }

    public function action(Request $request): JsonResponse
    {
        $input = $request->validate([
            'action' => ['required', Rule::in(['create', 'edit', 'assign', 'delete', 'import', 'advisor', 'other-address'])],
            'id' => 'nullable|string|max:100', 'ids' => 'nullable|array|max:500', 'ids.*' => 'string|max:100',
            'advisor' => 'nullable|string|max:100', 'smart' => 'boolean', 'includeDuplicates' => 'boolean',
            'rows' => 'nullable|array|max:499', 'rows.*' => 'array', 'fields' => 'nullable|array',
        ]);
        $data = $this->store->data($request);
        $actor = $request->session()->get('preview_username');
        $action = $input['action'];
        $count = 0;
        $skipped = 0;
        if ($action === 'advisor') {
            if (empty($input['advisor'])) {
                throw ValidationException::withMessages(['advisor' => 'Escribe el nombre del asesor.']);
            }
            $data['advisors'] = array_values(array_unique(array_merge($data['advisors'] ?? [], [$input['advisor']])));
        } elseif ($action === 'assign') {
            if (empty($input['ids']) || empty($input['advisor'])) {
                throw ValidationException::withMessages(['advisor' => 'Selecciona contactos y un asesor.']);
            }
            foreach ($input['ids'] as $id) {
                abort_unless(isset($data['leads'][$id]), 404);
                $data['leads'][$id] = BackOfficeRules::assign($data['leads'][$id], $input['advisor'], $actor, $input['smart'] ?? false);
                $count++;
            }
        } elseif ($action === 'delete') {
            $id = $input['id'] ?? '';
            abort_unless(isset($data['leads'][$id]), 404);
            if (array_filter($data['sales'], fn ($s) => ($s['leadId'] ?? '') === $id)) {
                throw ValidationException::withMessages(['id' => 'El contacto tiene ventas vinculadas. Conserva su historial.']);
            }
            unset($data['leads'][$id]);
        } elseif ($action === 'other-address') {
            $id = $input['id'] ?? '';
            abort_unless(isset($data['leads'][$id]), 404);
            $lead = $data['leads'][$id];
            $sales = array_filter($data['sales'], fn ($s) => ($s['leadId'] ?? '') === $id);
            $open = array_filter($sales, fn ($s) => ! in_array($s['trackingStatus'] ?? '', ['instalado', 'caida', 'rechazo', 'rechazo_campo', 'rechazo_mesa'], true));
            if ($open || ! in_array(BackOfficeRules::effective($lead), ['VENTA CERRADA', 'INSTALADO'], true)) {
                throw ValidationException::withMessages(['id' => 'Finaliza el ciclo de venta actual antes de abrir otra dirección.']);
            }
            $lead['status'] = 'pendiente';
            unset($lead['tipifInterna']);
            $lead['address'] = $request->validate(['fields.address' => 'required|string|max:250'])['fields']['address'];
            $lead['history'][] = ['at' => now()->toIso8601String(), 'actor' => $actor, 'type' => 'OTRA_DIRECCION', 'text' => 'Nuevo ciclo de venta: '.$lead['address']];
            $data['leads'][$id] = $lead;
        } else {
            $rows = $action === 'import' ? ($input['rows'] ?? []) : [$input['fields'] ?? []];
            foreach ($rows as $row) {
                $fields = validator($row, [
                    'phone' => 'nullable|string|max:30', 'phone2' => 'nullable|string|max:30', 'whatsappUser' => 'nullable|string|max:100',
                    'campaign' => 'nullable|string|max:100', 'department' => 'nullable|string|max:100', 'province' => 'nullable|string|max:100', 'zone' => 'nullable|string|max:150',
                    'address' => 'nullable|string|max:250', 'coordinates' => 'nullable|string|max:100', 'documentNumber' => 'nullable|string|max:30',
                    'back1' => ['nullable', Rule::in(PreviewOperations::BACK)], 'back2' => ['nullable', Rule::in(PreviewOperations::BACK)],
                    'status' => ['nullable', Rule::in(array_merge(BackOfficeRules::VENDOR, ['PENDIENTE']))],
                    'backNotes' => 'nullable|string|max:4000', 'baseDate' => 'nullable|date_format:Y-m-d', 'advisor' => 'nullable|string|max:100',
                    'advisorHistory' => 'nullable|array|max:6', 'advisorHistory.*' => 'string|max:100', 'room' => 'nullable|string|max:100',
                ])->validate();
                $fields = array_map(fn ($v) => $v ?? '', $fields);
                if (isset($fields['status'])) {
                    $fields['status'] = strtolower(str_replace(' ', '_', $fields['status']));
                }
                if ($action === 'edit') {
                    $id = $input['id'] ?? '';
                    abort_unless(isset($data['leads'][$id]), 404);
                    $lead = $data['leads'][$id];
                    if (($fields['status'] ?? '') === 'venta_cerrada' && ! array_filter($data['sales'], fn ($s) => ($s['leadId'] ?? '') === $id)) {
                        throw ValidationException::withMessages(['status' => 'Registra la venta desde Asesor para confirmar el cierre.']);
                    }
                    unset($fields['advisor'], $fields['advisorHistory']);
                    $lead = array_merge($lead, $fields);
                    $lead['history'][] = ['at' => now()->toIso8601String(), 'actor' => $actor, 'type' => 'EDICION', 'status' => $lead['status'], 'text' => 'Actualización: '.implode(', ', array_keys($fields))];
                    foreach (['back1', 'back2'] as $key) {
                        if (array_key_exists($key, $fields)) {
                            $lead[$key.'Actor'] = $actor;
                        }
                    }
                } else {
                    if (empty($fields['phone']) && empty($fields['whatsappUser'])) {
                        throw ValidationException::withMessages(['phone' => 'Indica el número principal o el usuario WhatsApp.']);
                    }
                    $fields['baseDate'] = ($fields['baseDate'] ?? '') ?: now('America/Lima')->toDateString();
                    $key = preg_replace('/\s+/', '', $fields['phone'] ?? '') ?: mb_strtolower($fields['whatsappUser'] ?? '');
                    $duplicate = array_filter($data['leads'], fn ($l) => (preg_replace('/\s+/', '', $l['phone'] ?? '') ?: mb_strtolower($l['whatsappUser'] ?? '')) === $key && ($l['baseDate'] ?? substr($l['createdAt'], 0, 10)) === $fields['baseDate'] && ($l['campaign'] ?? '') === ($fields['campaign'] ?? ''));
                    $terna = array_filter($data['leads'], fn ($l) => preg_replace('/\s+/', '', $l['phone'] ?? '') === $key && BackOfficeRules::effective($l) === 'TERNA');
                    if ($terna || ($duplicate && ! ($input['includeDuplicates'] ?? false))) {
                        $skipped++;

                        continue;
                    }
                    $advisor = $fields['advisor'] ?? '';
                    unset($fields['advisor']);
                    $status = $fields['status'] ?? 'pendiente';
                    $fields['status'] = 'pendiente';
                    $lead = $this->store->lead($fields, $actor);
                    if ($advisor) {
                        $lead = BackOfficeRules::assign($lead, $advisor, $actor);
                    }
                    $lead['status'] = $status;
                    if (! empty($fields['advisorHistory'])) {
                        $lead['firstAdvisor'] = $fields['advisorHistory'][0];
                        $lead['firstAssignedAt'] = $fields['baseDate'].'T12:00:00-05:00';
                        $lead['rotations'] = max(0, count($fields['advisorHistory']) - 1);
                    }
                }
                $data['leads'][$lead['id']] = $lead;
                $count++;
            }
        }
        $this->store->save($request, $data);

        return response()->json(['message' => "Guardado. {$count} registros procesados; {$skipped} omitidos.", 'count' => $count, 'skipped' => $skipped] + $this->payload($request));
    }
}
