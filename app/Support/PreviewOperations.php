<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Local frontend workspace shared by the three preview areas, never production data. */
class PreviewOperations
{
    public const TRACKING = [
        'en_ejecucion' => 'En ejecución', 'instalado' => 'Instalado', 'caida' => 'Caída',
        'rechazo_campo' => 'Rechazo en campo', 'tecnico_casa' => 'Técnicos en casa',
        'levantar_sot' => 'Levantar SOT', 'tecnicos_camino' => 'Técnicos en camino',
        'instalado_no_validado' => 'Instalado no validado', 'reasignacion' => 'Reasignación',
        'derivado_planta_externa' => 'Derivado a planta externa', 'servicio_activo' => 'Servicio activo',
        'rechazo' => 'Rechazo', 'rechazo_mesa' => 'Rechazo en mesa',
    ];

    public const BACK = ['BUZON DE VOZ', 'NO CONTESTA', 'CORTA LLAMADA', 'DERIVADO', 'LLAMANDO', 'SIN COBERTURA'];

    public const RESULTS = ['Contactado — conforme', 'Contactado — con problema', 'No contesta', 'Buzón de voz', 'Número equivocado', 'Solicita rellamada', 'Se levantó', 'Masivo enviado', 'Derivado a grabar', 'Derivado a agilizar', 'En agenda'];

    public const REASONS = ['FRAUDE', 'EXCESO DE ACOMETIDA', 'INFRAESTRUCTURA', 'RED SATURADA', 'EDIFICIO NO LIBERADO', 'SERVICIO ACTIVO', 'RECHAZO POR AUDIO', 'MALA OFERTA', 'NO DESEA', 'FALTA DE CONTACTO', 'SOT CON ERRORES DE SISTEMA', 'FACILIDADES TECNICAS DEL CLIENTE', 'MAL INGRESO DIRECCION'];

    public function data(Request $request): array
    {
        return $request->session()->get('kratos_operations', ['leads' => [], 'sales' => []]);
    }

    public function save(Request $request, array $data): void
    {
        $request->session()->put('kratos_operations', $data);
    }

    public function assign(array $lead, string $advisor, string $actor): array
    {
        if (($lead['advisor'] ?? '') === $advisor) {
            return $lead;
        }
        if (in_array($lead['status'] ?? '', ['venta_cerrada', 'instalado', 'instalado_no_validado', 'no_tocar', 'no_rotar', 'terna'], true)) {
            throw ValidationException::withMessages(['advisor' => 'Este contacto tiene un cierre protegido y no se puede rotar.']);
        }
        $lead['history'][] = ['at' => now()->toIso8601String(), 'actor' => $actor, 'text' => 'Asignación: '.($lead['advisor'] ?: 'Sin asignar').' → '.($advisor ?: 'Sin asignar')];
        $lead['rotations'] = ($lead['rotations'] ?? 0) + (($lead['advisor'] ?? '') !== '' && $advisor !== '' ? 1 : 0);
        $lead['advisor'] = $advisor;
        $lead['assignedAt'] = $advisor !== '' ? now()->toIso8601String() : null;
        $lead['status'] = 'pendiente';

        return $lead;
    }

    public function lead(array $input, string $actor): array
    {
        return array_merge([
            'id' => 'bo-'.Str::uuid(), 'phone' => '', 'phone2' => '', 'whatsappUser' => '',
            'clientName' => '', 'campaign' => '', 'zone' => '', 'address' => '', 'coordinates' => '',
            'advisor' => '', 'assignedAt' => null, 'status' => 'pendiente', 'back1' => '', 'back2' => '',
            'notes' => '', 'backNotes' => '', 'rotations' => 0, 'createdAt' => now()->toIso8601String(),
            'history' => [['at' => now()->toIso8601String(), 'actor' => $actor, 'text' => 'Contacto creado en Back Office']],
        ], $input);
    }

    public function updateTracking(array $sale, array $input, string $actor): array
    {
        $sale = array_merge($sale, $input);
        $sale['history'][] = ['at' => now()->toIso8601String(), 'actor' => $actor, 'text' => 'Estado: '.self::TRACKING[$sale['trackingStatus']].($sale['reason'] ? ' · '.$sale['reason'] : '')];
        $sale['status'] = match ($sale['trackingStatus']) {
            'instalado' => 'aprobada',
            'caida', 'rechazo', 'rechazo_campo', 'rechazo_mesa' => 'rechazada',
            default => 'en_verificacion',
        };
        $sale['trackingUpdatedAt'] = now()->toIso8601String();

        return $sale;
    }
}
