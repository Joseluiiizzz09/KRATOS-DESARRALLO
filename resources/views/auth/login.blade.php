<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="csrf-token" content="{{ csrf_token() }}">
<title>KRATOS — Iniciar sesión</title>
<link rel="stylesheet" href="{{ asset('css/login.css') }}?v={{ filemtime(public_path('css/login.css')) }}">
</head>
<body>

  <div class="bg-glow"></div>

  <div class="login-shell">
    <div class="logo-wrap">
      <div class="logo-shadow"></div>
      @include('partials.kratos-logo')
    </div>

    <main class="login-card split" role="main">

      <div class="brand-panel">
        <div class="brand-arc brand-arc-top"></div>
        <div class="brand-arc brand-arc-bottom"></div>
        <h1 class="title">Bienvenido a KRATOS</h1>
        <div class="welcome-user-slot"><span class="welcome-user" id="welcome-user" hidden></span></div>
      </div>

      <div class="panel-divider" aria-hidden="true">
        <svg viewBox="0 0 20 480" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10,0 C6,120 14,120 10,240 C6,360 14,360 10,480" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
        </svg>
      </div>

      <div class="form-panel">
        @if (session('status'))
          <p class="login-success">{{ session('status') }}</p>
        @endif

        <form method="POST" action="{{ app()->environment('local') ? route('preview.login') : route('login') }}" novalidate>
          @csrf

          <div class="field">
            <div class="field-inner">
              <span class="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>
              </span>
              <input type="text" id="email" name="{{ app()->environment('local') ? 'username' : 'email' }}" value="{{ old('username', old('email')) }}" placeholder="Usuario" aria-label="Usuario" autocomplete="username" maxlength="100" autofocus required>
            </div>
          </div>

          <div class="field">
            <div class="field-inner">
              <span class="field-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Z"/></svg>
              </span>
              <input type="password" id="password" name="password" placeholder="Contraseña" aria-label="Contraseña" autocomplete="current-password" required>
              <button type="button" class="toggle-visibility" id="toggle-password" aria-label="Mostrar contraseña">
                <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7Zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"/></svg>
              </button>
            </div>
          </div>

          <div class="remember-row">
            <span>Mantener sesión</span>
            <input type="checkbox" id="remember" name="remember" checked hidden>
            <button type="button" class="switch on" id="remember-toggle" role="switch" aria-checked="true" aria-label="Mantener sesión">
              <span class="knob"></span>
            </button>
          </div>

          @if ($errors->any())
            <p class="form-error">{{ $errors->first() }}</p>
          @endif

          <button type="submit" class="btn-submit">Iniciar sesión</button>
        </form>
      </div>

    </main>
  </div>

  <script src="{{ asset('js/login.js') }}?v={{ filemtime(public_path('js/login.js')) }}"></script>
</body>
</html>
