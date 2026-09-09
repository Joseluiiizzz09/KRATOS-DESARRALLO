<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

// Frontend preview: available only in the local development environment.
if (app()->environment('local')) {
    Route::post('/preview/login', function (\Illuminate\Http\Request $request) {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ], [], ['username' => 'usuario', 'password' => 'contraseña']);

        $request->session()->regenerate();
        $request->session()->put('preview_username', $data['username']);

        return redirect()->route('preview.dashboard');
    })->name('preview.login');

    Route::get('/preview/dashboard', function (\Illuminate\Http\Request $request) {
        if (! $request->session()->has('preview_username')) {
            return redirect()->route('login');
        }

        return view('preview-dashboard', ['username' => $request->session()->get('preview_username')]);
    })->name('preview.dashboard');

    Route::post('/preview/logout', function (\Illuminate\Http\Request $request) {
        $request->session()->forget('preview_username');
        $request->session()->regenerate();

        return redirect()->route('login');
    })->name('preview.logout');
}