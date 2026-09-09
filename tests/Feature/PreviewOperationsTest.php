<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class PreviewOperationsTest extends TestCase
{
    public function test_preview_requires_session(): void
    {
        $this->get('/preview/backoffice')->assertRedirect('/login');
        $this->postJson('/preview/operations/sync', [])->assertUnauthorized();
    }

    public function test_both_pages_render_empty_and_populated(): void
    {
        $this->withSession(['preview_username' => 'Ana']);
        $this->get('/preview/backoffice')->assertOk()->assertSee('Nuevo contacto');
        $this->get('/preview/seguimiento')->assertOk()->assertSee('Control de ventas');
        $this->postJson('/preview/operations/sync', ['leads' => [['id' => 'l1', 'phone' => '000000001', 'clientName' => 'Prueba']], 'sales' => [['id' => 's1', 'leadId' => 'l1', 'clientName' => 'Prueba', 'amount' => 39.9]]])->assertOk();
        $this->get('/preview/backoffice')->assertOk()->assertSee('000000001');
        $this->get('/preview/seguimiento')->assertOk()->assertSee('Prueba');
    }

    public function test_assignment_reaches_only_selected_advisor_and_protected_sales_cannot_rotate(): void
    {
        $this->withSession(['preview_username' => 'Back']);
        $this->post('/preview/operations/contact', ['phone' => '000000002', 'zone' => 'Lima'])->assertSessionHasNoErrors();
        $data = session('kratos_operations');
        $id = array_key_first($data['leads']);
        $this->post('/preview/operations/assign', ['ids' => [$id], 'advisor' => 'Ana'])->assertSessionHasNoErrors();
        $this->withSession(['preview_username' => 'Ana'])->getJson('/preview/operations/advisor')->assertJsonCount(1, 'leads');
        $this->withSession(['preview_username' => 'Luis'])->getJson('/preview/operations/advisor')->assertJsonCount(0, 'leads');
        $data = session('kratos_operations');
        $data['leads'][$id]['status'] = 'venta_cerrada';
        $this->withSession(['kratos_operations' => $data])->post('/preview/operations/assign', ['ids' => [$id], 'advisor' => 'Luis'])->assertSessionHasErrors('advisor');
        $this->assertSame('Ana', session('kratos_operations')['leads'][$id]['advisor']);
    }

    public function test_tracking_updates_sale_and_source_and_cannot_be_overwritten_by_stale_advisor(): void
    {
        $this->withSession(['preview_username' => 'Ana']);
        $payload = ['leads' => [['id' => 'l1', 'phone' => '000000001', 'status' => 'venta_cerrada']], 'sales' => [['id' => 's1', 'leadId' => 'l1', 'clientName' => 'Prueba']]];
        $this->postJson('/preview/operations/sync', $payload)->assertOk();
        $this->post('/preview/operations/tracking', ['id' => 's1', 'trackingStatus' => 'instalado', 'sot' => 'SOT-TEST', 'scheduledDate' => '2026-09-10', 'slot' => 'AM'])->assertSessionHasNoErrors();
        $this->postJson('/preview/operations/sync', $payload)->assertOk();
        $this->getJson('/preview/operations/advisor')->assertJsonPath('leads.0.status', 'instalado')->assertJsonPath('sales.0.status', 'aprobada')->assertJsonPath('sales.0.sot', 'SOT-TEST');
        $this->post('/preview/operations/tracking', ['id' => 's1', 'trackingStatus' => 'caida'])->assertSessionHasErrors('reason');
    }

    public function test_csv_import_is_atomic_and_omits_duplicates(): void
    {
        $this->withSession(['preview_username' => 'Back']);
        $csv = UploadedFile::fake()->createWithContent('contacts.csv', "telefono1;cliente\n000000003;Prueba\n000000003;Duplicado\n");
        $this->post('/preview/operations/import', ['csv' => $csv])->assertSessionHasNoErrors();
        $this->assertCount(1, session('kratos_operations')['leads']);
        $bad = UploadedFile::fake()->createWithContent('bad.csv', "telefono1\n000000004\ninvalid\n");
        $this->post('/preview/operations/import', ['csv' => $bad])->assertSessionHasErrors('csv');
        $this->assertCount(1, session('kratos_operations')['leads']);
    }
}
