import { login } from './api.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const user = await login(email, password);

    localStorage.setItem('user', JSON.stringify(user));

    Swal.fire({
      icon: 'success',
      title: '¡Bienvenido!',
      text: `Hola ${user.nombre}`,
      showConfirmButton: false,
      timer: 1500,
    }).then(() => {
      window.location.href = 'dashboard.html';
    });
  } catch (error) {
    Swal.fire('Error', error.message || 'Error en el login', 'error');
  }
});

// Mostrar/ocultar contraseña
document.getElementById('togglePassword').addEventListener('click', () => {
  const passwordInput = document.getElementById('password');
  const icon = document.querySelector('#togglePassword i');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
});
