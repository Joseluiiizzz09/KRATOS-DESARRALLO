<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>KRATOS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{{ asset('css/login.css') }}?v={{ time() }}">
</head>
<body>
  <div class="split-layout">
    <!-- PANEL IZQUIERDO -->
    <div class="left-panel">
      <div class="grid-overlay"></div>
      
      <div class="brand-content">
        <h1 class="logo">KRATOS</h1>
        <p class="tagline">Gestión comercial con control total.</p>
        
        <div class="features-row">
          <div class="feature">
            <div class="icon">
              <!-- Arrow Right in Circle -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 16 16 12 12 8"></polyline>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            </div>
            <span>PORTABILIDAD</span>
          </div>
          <div class="feature">
            <div class="icon">
              <!-- Plus -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <span>ALTAS DE LÍNEA</span>
          </div>
          <div class="feature">
            <div class="icon">
              <!-- Chart -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
                <polyline points="4 14 12 4 18 10 22 2"></polyline>
              </svg>
            </div>
            <span>VENTAS</span>
          </div>
          <div class="feature">
            <div class="icon">
              <!-- Gears -->
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <span>OPERACIONES</span>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL DERECHO -->
    <div class="right-panel">
      <div class="form-container">
        <h2 class="welcome-title">Bienvenido a <strong>KRATOS</strong></h2>
        <p class="welcome-subtitle">Ingrese sus credenciales para continuar.</p>

        @if ($errors->any())
          <div class="alert alert-error">
            {{ $errors->first() }}
          </div>
        @endif

        <form method="POST" action="{{ app()->environment('local') ? route('preview.login') : route('login') }}" class="login-form">
          @csrf
          
          <div class="form-group">
            <label for="username">Nombre de usuario</label>
            <input type="text" id="username" name="username" placeholder="Ingrese su nombre de usuario" value="{{ old('username') }}" required autofocus>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="input-with-icon">
              <input type="password" id="password" name="password" placeholder="Ingrese su contraseña" required>
              <button type="button" class="eye-btn" id="toggle-password">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-group-checkbox">
            <div class="checkbox-wrapper">
              <input type="checkbox" id="remember" name="remember" {{ old('remember') ? 'checked' : '' }}>
              <label for="remember">Mantener sesión iniciada</label>
            </div>
          </div>

          <button type="submit" class="submit-btn">Iniciar sesión</button>
        </form>

        <div class="footer-text">
          <p>Acceso solo para usuarios autorizados.</p>
          <p>&copy; 2026 KRATOS &middot; Plataforma de Gestión Empresarial</p>
        </div>
      </div>
    </div>
  </div>
  
  <script src="{{ asset('js/login.js') }}?v={{ time() }}"></script>
</body>
</html>
