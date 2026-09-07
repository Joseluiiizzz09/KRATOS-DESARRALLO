(function () {
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const rememberToggle = document.getElementById('remember-toggle');
  const rememberCheckbox = document.getElementById('remember');

  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  rememberToggle.addEventListener('click', () => {
    const isOn = rememberToggle.classList.toggle('on');
    rememberToggle.setAttribute('aria-checked', String(isOn));
    rememberCheckbox.checked = isOn;
  });
})();

(function () {
  const userInput = document.getElementById('email');
  const userBadge = document.getElementById('welcome-user');
  if (!userInput || !userBadge) return;

  function updateWelcomeUser() {
    const username = userInput.value.trim();
    userBadge.textContent = username;
    userBadge.hidden = username.length === 0;
  }

  userInput.addEventListener('input', updateWelcomeUser);
  userInput.addEventListener('change', updateWelcomeUser);
  window.addEventListener('pageshow', updateWelcomeUser);
  updateWelcomeUser();
})();