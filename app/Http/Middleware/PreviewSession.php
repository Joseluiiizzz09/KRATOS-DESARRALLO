<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreviewSession
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->has('preview_username')) {
            return $request->expectsJson() ? response()->json(['message' => 'Inicia sesión para continuar.'], 401) : redirect()->route('login');
        }

        return $next($request);
    }
}
