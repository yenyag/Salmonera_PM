import { supabase } from './supabase.js'

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const { data, error } = await supabase.rpc('verificar_login', {
      _email: email,
      _pass: password
    });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      localStorage.setItem('user', JSON.stringify(data[0]));
      Swal.fire({
        title: '¡Bienvenido!',
        text: `Hola ${data[0].nombre}`,
        icon: 'success'
      }).then(() => {
        window.location.href = 'dashboard.html';
      });
    } else {
      Swal.fire('Error', 'Credenciales incorrectas', 'error');
    }
  } catch (error) {
    Swal.fire('Error', error.message || 'Error en la autenticación', 'error');
  }
});