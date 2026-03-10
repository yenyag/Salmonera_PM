import { supabase } from './supabase.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    // Llamar a la función PostgreSQL
    const { data, error } = await supabase.rpc('verificar_login', {
      _email: email,
      _pass: password
    });

    if (error) throw error;

    if (data && data.length > 0) {
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(data[0]));
      
      Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: `Hola ${data[0].nombre}`,
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        window.location.href = 'dashboard.html';
      });
    } else {
      Swal.fire('Error', 'Credenciales incorrectas', 'error');
    }
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