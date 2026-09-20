<?php

namespace Tests\Feature;

use Tests\TestCase;

class BackOfficeTest extends TestCase
{
    private function createContact(array $fields = []): string
    {
        $this->withSession(['preview_username' => 'Back']);
        $this->postJson('/preview/backoffice/action', ['action' => 'create', 'fields' => array_merge(['phone' => '000000009', 'campaign' => 'YURI'], $fields)])->assertOk();

        return array_key_last(session('kratos_operations')['leads']);
    }

    public function test_whatsapp_contact_and_inline_edit_keep_audit_history(): void
    {
        $id = $this->createContact(['phone' => '', 'whatsappUser' => 'prueba']);
        $this->postJson('/preview/backoffice/action', ['action' => 'edit', 'id' => $id, 'fields' => ['back1' => 'LLAMANDO', 'coordinates' => '-12.0, -77.0']])->assertOk();
        $lead = session('kratos_operations')['leads'][$id];
        $this->assertSame('Back', $lead['back1Actor']);
        $this->assertCount(2, $lead['history']);
        $this->postJson('/preview/backoffice/action', ['action' => 'edit', 'id' => $id, 'fields' => ['status' => 'VENTA CERRADA']])->assertUnprocessable();
        $this->assertSame('pendiente', session('kratos_operations')['leads'][$id]['status']);
    }

    public function test_smart_rotation_preserves_disposition_prevents_repetition_and_shares_with_advisor(): void
    {
        $id = $this->createContact();
        $this->postJson('/preview/backoffice/action', ['action' => 'edit', 'id' => $id, 'fields' => ['status' => 'SIN COBERTURA']])->assertOk();
        foreach (['Ana', 'Luis'] as $advisor) {
            $this->postJson('/preview/backoffice/action', ['action' => 'assign', 'ids' => [$id], 'advisor' => $advisor, 'smart' => true])->assertOk();
        }
        $this->postJson('/preview/backoffice/action', ['action' => 'assign', 'ids' => [$id], 'advisor' => 'Ana', 'smart' => true])->assertUnprocessable();
        $lead = session('kratos_operations')['leads'][$id];
        $this->assertSame('sin_cobertura', $lead['status']);
        $this->assertSame('Ana', $lead['firstAdvisor']);
        $this->assertSame(1, $lead['rotations']);
        $this->withSession(['preview_username' => 'Luis'])->getJson('/preview/operations/advisor')->assertJsonPath('leads.0.id', $id);
    }

    public function test_old_base_waits_two_hours_and_bulk_assignment_is_atomic(): void
    {
        $id = $this->createContact(['baseDate' => now()->subDay()->toDateString()]);
        $this->postJson('/preview/backoffice/action', ['action' => 'assign', 'ids' => [$id], 'advisor' => 'Ana'])->assertOk();
        $this->postJson('/preview/backoffice/action', ['action' => 'assign', 'ids' => [$id], 'advisor' => 'Luis', 'smart' => true])->assertUnprocessable();
        $this->travel(121)->minutes();
        $this->postJson('/preview/backoffice/action', ['action' => 'assign', 'ids' => [$id], 'advisor' => 'Luis', 'smart' => true])->assertOk();
        $this->travelBack();
        $this->assertSame('Luis', session('kratos_operations')['leads'][$id]['advisor']);
    }

    public function test_import_deduplicates_campaign_and_day_preserves_legacy_and_rejects_invalid_batch(): void
    {
        $this->withSession(['preview_username' => 'Back']);
        $row = ['phone' => '000000008', 'baseDate' => '2026-08-01', 'campaign' => 'YURI', 'advisorHistory' => ['Ana', 'Luis'], 'advisor' => 'Luis', 'status' => 'VENTA CERRADA'];
        $this->postJson('/preview/backoffice/action', ['action' => 'import', 'rows' => [$row, $row]])->assertOk()->assertJsonPath('count', 1)->assertJsonPath('skipped', 1);
        $lead = array_values(session('kratos_operations')['leads'])[0];
        $this->assertSame('Ana', $lead['firstAdvisor']);
        $this->assertSame('venta_cerrada', $lead['status']);
        $this->postJson('/preview/backoffice/action', ['action' => 'import', 'rows' => [array_merge($row, ['campaign' => 'ADRI'])]])->assertOk()->assertJsonPath('count', 1);
        $this->postJson('/preview/backoffice/action', ['action' => 'import', 'rows' => [array_merge($row, ['baseDate' => '2026-08-02']), ['phone' => '000000003', 'status' => 'INVENTADO']]])->assertUnprocessable();
        $this->assertCount(2, session('kratos_operations')['leads']);
        $this->postJson('/preview/backoffice/action', ['action' => 'assign', 'ids' => [$lead['id']], 'advisor' => 'Maria'])->assertUnprocessable();
    }
}
