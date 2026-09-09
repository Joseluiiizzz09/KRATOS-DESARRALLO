<?php

use App\Http\Controllers\PreviewOperationsController;
use App\Http\Middleware\PreviewSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Same local-only, session-based preview boundary as the existing Asesor.
if (app()->environment('local', 'testing')) {
    Route::prefix('preview')->middleware(PreviewSession::class)->group(function () {
        Route::get('backoffice', fn (Request $request, PreviewOperationsController $controller) => $controller->index($request, 'backoffice'))->name('preview.backoffice');
        Route::get('seguimiento', fn (Request $request, PreviewOperationsController $controller) => $controller->index($request, 'seguimiento'))->name('preview.seguimiento');
        Route::post('operations/contact', [PreviewOperationsController::class, 'lead'])->name('preview.operations.lead');
        Route::post('operations/assign', [PreviewOperationsController::class, 'assign'])->name('preview.operations.assign');
        Route::post('operations/tracking', [PreviewOperationsController::class, 'tracking'])->name('preview.operations.tracking');
        Route::post('operations/observation', [PreviewOperationsController::class, 'observation'])->name('preview.operations.observation');
        Route::post('operations/import', [PreviewOperationsController::class, 'import'])->name('preview.operations.import');
        Route::get('operations/export/{area}', [PreviewOperationsController::class, 'export'])->whereIn('area', ['backoffice', 'seguimiento'])->name('preview.operations.export');
        Route::post('operations/sync', [PreviewOperationsController::class, 'sync'])->name('preview.operations.sync');
        Route::get('operations/advisor', [PreviewOperationsController::class, 'advisor'])->name('preview.operations.advisor');
    });
}
