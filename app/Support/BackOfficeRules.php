<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class BackOfficeRules
{
    public const VENDOR = ['VENTA CERRADA', 'PREVENTA', 'AGENDADO', 'EN EJECUCION', 'INSTALADO', 'NO CONTESTA', 'BUZON DE VOZ', 'CORTA LLAMADA', 'NO DESEA', 'NO CALIFICA', 'SIN COBERTURA', 'CONTACTO CON TERCEROS', 'EDIFICIO NO LIBERADO', 'DESEA MOVIL', 'SERVICIO ACTIVO', 'TERNA', 'NO ROTAR', 'VENTA CAIDA'];

    public static function label(string $value): string
    {
        return match (strtoupper(str_replace('_', ' ', $value))) {
            'CAIDA' => 'VENTA CAIDA', 'SH NO TOCAR', 'SH NO ROTAR', 'NO TOCAR' => 'NO ROTAR',
            default => strtoupper(str_replace('_', ' ', $value)),
        };
    }

    public static function effective(array $lead): string
    {
        if (! empty($lead['tipifInterna'])) {
            return self::label($lead['tipifInterna']);
        }
        $status = self::label($lead['status'] ?? 'pendiente');
        if (in_array($status, ['VENTA CERRADA', 'INSTALADO', 'VENTA CAIDA', 'NO ROTAR', 'TERNA'], true)) {
            return $status;
        }
        foreach ($lead['history'] ?? [] as $event) {
            if (self::label($event['status'] ?? '') === 'SIN COBERTURA') {
                return 'SIN COBERTURA';
            }
        }

        return $status;
    }

    public static function eligible(array $lead, string $advisor): array
    {
        $history = array_merge($lead['advisorHistory'] ?? [], array_column($lead['history'] ?? [], 'advisor'), [$lead['advisor'] ?? '']);
        $repeated = in_array(mb_strtoupper(trim($advisor)), array_map(fn ($a) => mb_strtoupper(trim($a)), $history), true);
        $protected = in_array(self::effective($lead), ['VENTA CERRADA', 'INSTALADO', 'INSTALADO NO VALIDADO', 'NO ROTAR', 'TERNA'], true);
        $today = now('America/Lima')->toDateString();
        $date = $lead['baseDate'] ?? Carbon::parse($lead['createdAt'])->timezone('America/Lima')->toDateString();
        $time = $date === $today || empty($lead['assignedAt']) || Carbon::parse($lead['assignedAt'])->lte(now()->subMinutes(120));

        return ['eligible' => $advisor !== '' && ! $repeated && ! $protected && $time, 'repeated' => $repeated, 'protected' => $protected, 'time' => $time];
    }

    public static function assign(array $lead, string $advisor, string $actor, bool $smart = false): array
    {
        if (($lead['advisor'] ?? '') === $advisor) {
            if ($smart) {
                throw ValidationException::withMessages(['advisor' => 'El asesor ya tiene este contacto.']);
            }

            return $lead;
        }
        $rules = self::eligible($lead, $advisor);
        if ($rules['protected'] || ($smart && ! $rules['eligible'])) {
            throw ValidationException::withMessages(['advisor' => 'El contacto está protegido, repite asesor o aún no cumple las dos horas de espera.']);
        }
        $previous = $lead['advisor'] ?? '';
        $lead['advisorHistory'] = array_values(array_unique(array_filter(array_merge($lead['advisorHistory'] ?? [], [$previous, $advisor]))));
        $lead['history'][] = ['at' => now()->toIso8601String(), 'actor' => $actor, 'advisor' => $advisor, 'previousAdvisor' => $previous, 'type' => $previous ? 'ROTACION' : 'ASIGNACION', 'status' => self::effective($lead), 'text' => 'Asignación: '.($previous ?: 'Sin asignar').' → '.($advisor ?: 'Sin asignar')];
        $lead['rotations'] = ($lead['rotations'] ?? 0) + ($previous && $advisor ? 1 : 0);
        $lead['firstAdvisor'] ??= $advisor;
        $lead['firstAssignedAt'] ??= now()->toIso8601String();
        $lead['advisor'] = $advisor;
        $lead['assignedAt'] = $advisor ? now()->toIso8601String() : null;

        return $lead;
    }
}
