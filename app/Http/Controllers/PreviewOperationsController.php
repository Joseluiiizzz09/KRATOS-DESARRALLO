<?php

namespace App\Http\Controllers;

use App\Support\PreviewOperations;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PreviewOperationsController extends Controller
{
    public function __construct(private PreviewOperations $store) {}

    public function index(Request $request, string $area): View
    {
        $data = $this->store->data($request);
        $items = array_values($data[$area === 'backoffice' ? 'leads' : 'sales']);
        $advisors = array_values(array_unique(array_filter(array_merge([$request->session()->get('preview_username')], array_column($data['leads'], 'advisor'), array_column($data['sales'], 'advisorName')))));
        $items = array_values(array_filter($items, function ($item) use ($request, $area) {
            $search = mb_strtolower($request->string('q')->toString());
            $text = implode(' ', array_intersect_key($item, array_flip(['phone', 'phone2', 'whatsappUser', 'clientName', 'clientPhone', 'documentNumber', 'zone', 'sot', 'advisor', 'advisorName', 'campaign'])));
            if ($search && ! str_contains(mb_strtolower($text), $search)) {
                return false;
            }
            if ($request->filled('advisor') && ($item[$area === 'backoffice' ? 'advisor' : 'advisorName'] ?? '') !== $request->input('advisor')) {
                return false;
            }
            if ($request->filled('status') && ($item[$area === 'backoffice' ? 'status' : 'trackingStatus'] ?? 'en_ejecucion') !== $request->input('status')) {
                return false;
            }
            $date = substr($item['createdAt'] ?? '', 0, 10);

            return ! ($request->filled('from') && $date < $request->input('from')) && ! ($request->filled('to') && $date > $request->input('to'));
        }));
        $total = count($items);
        $page = max(1, min((int) $request->input('page', 1), max(1, (int) ceil($total / 20))));

        return view('operations.index', compact('data', 'items', 'advisors', 'area', 'total', 'page'));
    }

    public function lead(Request $request): RedirectResponse
    {
        $input = $request->validate([
            'id' => 'nullable|string|max:100', 'phone' => 'required|string|max:30', 'phone2' => 'nullable|string|max:30',
            'whatsappUser' => 'nullable|string|max:100', 'clientName' => 'nullable|string|max:150', 'campaign' => 'nullable|string|max:100',
            'zone' => 'nullable|string|max:150', 'address' => 'nullable|string|max:250', 'coordinates' => 'nullable|string|max:100',
            'backNotes' => 'nullable|string|max:2000', 'back1' => ['nullable', Rule::in(PreviewOperations::BACK)], 'back2' => ['nullable', Rule::in(PreviewOperations::BACK)],
        ]);
        $data = $this->store->data($request);
        $id = $input['id'] ?? null;
        unset($input['id']);
        $input = array_map(fn ($v) => $v ?? '', $input);
        if ($id) {
            abort_unless(isset($data['leads'][$id]), 404);
            $data['leads'][$id] = array_merge($data['leads'][$id], $input);
            $data['leads'][$id]['history'][] = ['at' => now()->toIso8601String(), 'actor' => $request->session()->get('preview_username'), 'text' => 'Datos de Back Office actualizados'];
        } else {
            $lead = $this->store->lead($input, $request->session()->get('preview_username'));
            $data['leads'][$lead['id']] = $lead;
        }
        $this->store->save($request, $data);

        return back()->with('success', 'Contacto guardado.');
    }

    public function assign(Request $request): RedirectResponse
    {
        $input = $request->validate(['ids' => 'required|array|min:1|max:500', 'ids.*' => 'required|string', 'advisor' => 'nullable|string|max:100']);
        $data = $this->store->data($request);
        foreach ($input['ids'] as $id) {
            abort_unless(isset($data['leads'][$id]), 404);
            $data['leads'][$id] = $this->store->assign($data['leads'][$id], $input['advisor'] ?? '', $request->session()->get('preview_username'));
        }
        $this->store->save($request, $data);

        return back()->with('success', 'Asignación actualizada. Los contactos aparecerán en la base del asesor indicado.');
    }

    public function tracking(Request $request): RedirectResponse
    {
        $input = $request->validate([
            'id' => 'required|string', 'trackingStatus' => ['required', Rule::in(array_keys(PreviewOperations::TRACKING))],
            'reason' => ['nullable', Rule::in(PreviewOperations::REASONS)], 'comment' => 'nullable|string|max:2000',
            'sot' => 'nullable|string|max:60', 'scheduledDate' => 'nullable|date_format:Y-m-d',
            'slot' => ['nullable', Rule::in(['AM', 'PM', 'PM 3'])],
        ]);
        if (in_array($input['trackingStatus'], ['caida', 'rechazo', 'rechazo_campo', 'rechazo_mesa']) && empty($input['reason'])) {
            throw ValidationException::withMessages(['reason' => 'Indica el motivo de la caída o rechazo.']);
        }
        $data = $this->store->data($request);
        $id = $input['id'];
        unset($input['id']);
        abort_unless(isset($data['sales'][$id]), 404);
        $sale = $this->store->updateTracking($data['sales'][$id], array_map(fn ($v) => $v ?? '', $input), $request->session()->get('preview_username'));
        $data['sales'][$id] = $sale;
        if (isset($data['leads'][$sale['leadId'] ?? ''])) {
            $data['leads'][$sale['leadId']]['status'] = $sale['trackingStatus'];
        }
        $this->store->save($request, $data);

        return back()->with('success', 'Seguimiento actualizado y reflejado en el contacto de origen.');
    }

    public function observation(Request $request): RedirectResponse
    {
        $input = $request->validate(['id' => 'required|string', 'result' => ['required', Rule::in(PreviewOperations::RESULTS)], 'note' => 'required|string|max:2000']);
        $data = $this->store->data($request);
        abort_unless(isset($data['sales'][$input['id']]), 404);
        $data['sales'][$input['id']]['history'][] = ['at' => now()->toIso8601String(), 'actor' => $request->session()->get('preview_username'), 'text' => $input['result'].' · '.$input['note']];
        $this->store->save($request, $data);

        return back()->with('success', 'Observación registrada en el historial.');
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate(['csv' => 'required|file|max:2048']);
        $stream = fopen($request->file('csv')->getRealPath(), 'r');
        $first = fgets($stream);
        if ($first === false) {
            throw ValidationException::withMessages(['csv' => 'El archivo está vacío.']);
        }
        $delimiter = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
        rewind($stream);
        $header = array_map(fn ($v) => strtolower(trim(ltrim($v ?? '', "\xEF\xBB\xBF"))), fgetcsv($stream, 0, $delimiter, '"', ''));
        if (! in_array('telefono1', $header)) {
            throw ValidationException::withMessages(['csv' => 'Falta la columna telefono1. Descarga la plantilla.']);
        }
        $data = $this->store->data($request);
        $count = 0;
        $skipped = 0;
        $phones = array_map(fn ($l) => preg_replace('/\D/', '', $l['phone']), $data['leads']);
        while (($row = fgetcsv($stream, 0, $delimiter, '"', '')) !== false) {
            if (++$count > 500) {
                throw ValidationException::withMessages(['csv' => 'Importa como máximo 500 contactos por archivo.']);
            }
            $values = array_combine($header, array_slice(array_pad($row, count($header), ''), 0, count($header)));
            $phone = trim($values['telefono1']);
            if (! $phone || ! preg_match('/^[+\d\s()-]{3,30}$/', $phone)) {
                throw ValidationException::withMessages(['csv' => 'Teléfono inválido en la fila '.($count + 1).'.']);
            }
            if (in_array(preg_replace('/\D/', '', $phone), $phones)) {
                $skipped++;

                continue;
            }
            $lead = $this->store->lead(['phone' => $phone, 'phone2' => mb_substr($values['telefono2'] ?? '', 0, 30), 'whatsappUser' => mb_substr($values['whatsapp'] ?? '', 0, 100), 'clientName' => mb_substr($values['cliente'] ?? '', 0, 150), 'zone' => mb_substr($values['zona'] ?? '', 0, 150), 'campaign' => mb_substr($values['campana'] ?? '', 0, 100), 'backNotes' => mb_substr($values['observaciones'] ?? '', 0, 2000)], $request->session()->get('preview_username'));
            $data['leads'][$lead['id']] = $lead;
            $phones[] = preg_replace('/\D/', '', $phone);
        }
        fclose($stream);
        $this->store->save($request, $data);

        return back()->with('success', ($count - $skipped).' contactos importados; '.$skipped.' duplicados omitidos.');
    }

    public function export(Request $request, string $area): StreamedResponse
    {
        $data = $this->store->data($request);
        $rows = $area === 'backoffice' ? $data['leads'] : $data['sales'];
        $fields = $area === 'backoffice' ? ['phone', 'phone2', 'whatsappUser', 'clientName', 'zone', 'campaign', 'advisor', 'status', 'backNotes'] : ['clientName', 'clientPhone', 'documentNumber', 'advisorName', 'productName', 'trackingStatus', 'sot', 'scheduledDate', 'slot', 'comment'];

        return response()->streamDownload(function () use ($rows, $fields) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $fields, ';', '"', '');
            foreach ($rows as $row) {
                fputcsv($out, array_map(function ($key) use ($row) {
                    $value = (string) ($row[$key] ?? '');

                    return preg_match('/^[=+@\-\t\r]/', $value) ? "'".$value : $value;
                }, $fields), ';', '"', '');
            }
            fclose($out);
        }, 'kratos-'.$area.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function sync(Request $request): JsonResponse
    {
        $input = $request->validate(['leads' => 'array|max:2000', 'leads.*.id' => 'required|string|max:100', 'leads.*.phone' => 'nullable|string|max:30', 'sales' => 'array|max:2000', 'sales.*.id' => 'required|string|max:100']);
        $data = $this->store->data($request);
        $user = $request->session()->get('preview_username');
        foreach ($request->input('leads', []) as $raw) {
            $id = $raw['id'];
            if (! isset($data['leads'][$id])) {
                $lead = $this->store->lead(['id' => $id, 'phone' => (string) ($raw['phone'] ?? ''), 'advisor' => $user], $user);
                foreach (['phone2', 'whatsappUser', 'clientName', 'campaign', 'zone', 'assignedAt', 'status', 'notes', 'coordinates', 'documentType', 'documentNumber'] as $key) {
                    if (isset($raw[$key]) && is_string($raw[$key])) {
                        $lead[$key] = mb_substr($raw[$key], 0, 2000);
                    }
                }
                $data['leads'][$id] = $lead;
            } elseif ($data['leads'][$id]['advisor'] === $user) {
                foreach (['notes', 'coordinates', 'documentType', 'documentNumber'] as $key) {
                    if (isset($raw[$key]) && is_string($raw[$key])) {
                        $data['leads'][$id][$key] = mb_substr($raw[$key], 0, 2000);
                    }
                }
                $hasTracking = collect($data['sales'])->contains(fn ($sale) => ($sale['leadId'] ?? '') === $id && ! empty($sale['trackingUpdatedAt']));
                if (! $hasTracking && isset($raw['status']) && is_string($raw['status'])) {
                    $data['leads'][$id]['status'] = mb_substr($raw['status'], 0, 80);
                }
            }
        }
        foreach ($request->input('sales', []) as $raw) {
            $id = $raw['id'];
            if (isset($data['sales'][$id])) {
                continue;
            }
            $sale = ['id' => $id, 'advisorName' => $user, 'trackingStatus' => 'en_ejecucion', 'status' => 'en_verificacion', 'history' => [], 'reason' => '', 'comment' => '', 'sot' => '', 'scheduledDate' => '', 'slot' => ''];
            foreach (['leadId', 'clientName', 'clientPhone', 'documentType', 'documentNumber', 'productName', 'createdAt', 'notes', 'status'] as $key) {
                if (isset($raw[$key]) && is_string($raw[$key])) {
                    $sale[$key] = mb_substr($raw[$key], 0, 2000);
                }
            }
            $sale['amount'] = is_numeric($raw['amount'] ?? null) ? (float) $raw['amount'] : 0;
            if (isset($data['leads'][$sale['leadId'] ?? ''])) {
                $sale['zone'] = $data['leads'][$sale['leadId']]['zone'];
                $sale['coordinates'] = $data['leads'][$sale['leadId']]['coordinates'];
            }
            $data['sales'][$id] = $sale;
        }
        $this->store->save($request, $data);

        return response()->json(['ok' => true]);
    }

    public function advisor(Request $request): JsonResponse
    {
        $data = $this->store->data($request);
        $username = $request->session()->get('preview_username');

        return response()->json(['leads' => array_values(array_filter($data['leads'], fn ($l) => $l['advisor'] === $username)), 'knownIds' => array_keys($data['leads']), 'sales' => array_values(array_filter($data['sales'], fn ($s) => $s['advisorName'] === $username))]);
    }
}
