import { api, setUsuario } from './api.js';

const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'index.html';

const email = user.email;

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatearFecha(valor) {
  if (!valor) return '-';
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (soloFecha) {
    return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
      .toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  const d = new Date(valor);
  return isNaN(d) ? String(valor) : d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
}

function iniciales(nombre) {
  if (!nombre) return '-';
  return nombre.split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function marcarTema(tema) {
  const claro = document.getElementById('btnTemaClaro');
  const oscuro = document.getElementById('btnTemaOscuro');
  claro.classList.toggle('ring-2', tema === 'claro');
  claro.classList.toggle('ring-sky-500', tema === 'claro');
  claro.classList.toggle('bg-sky-50', tema === 'claro');
  oscuro.classList.toggle('ring-2', tema === 'oscuro');
  oscuro.classList.toggle('ring-sky-500', tema === 'oscuro');
  oscuro.classList.toggle('bg-sky-50', tema === 'oscuro');
  document.getElementById('temaEstado').textContent =
    tema === 'claro' ? 'Tema claro activo' : 'Tema oscuro activo';
}

function renderPerfil(p) {
  document.getElementById('avatarIniciales').textContent = iniciales(p.nombre);
  document.getElementById('perfilNombre').textContent = p.nombre;
  document.getElementById('perfilRol').textContent = p.rol || 'Sin rol';
  document.getElementById('perfilCorreo').textContent = p.email;
  document.getElementById('perfilCargo').textContent = p.cargo || '-';
  document.getElementById('perfilCentro').textContent = p.centro_nombre || '-';
  document.getElementById('perfilIngreso').textContent = formatearFecha(p.fecha_ingreso);
  document.getElementById('editNombre').value = p.nombre || '';
  document.getElementById('editCargo').value = p.cargo || '';
  document.getElementById('editCentro').value = p.centro_nombre || '';
  marcarTema(p.tema || 'oscuro');
}

// --- Carga inicial del perfil ---
(async function cargarPerfil() {
  try {
    const p = await api.perfil(email);
    setUsuario(p);
    renderPerfil(p);
  } catch (error) {
    console.error('Error cargando perfil:', error);
  }
})();

// --- Editar datos personales ---
document.getElementById('btnEditar').addEventListener('click', () => {
  document.getElementById('formEditar').classList.toggle('hidden');
  document.getElementById('btnEditar').classList.toggle('hidden');
});

document.getElementById('btnCancelarEditar').addEventListener('click', () => {
  document.getElementById('formEditar').classList.add('hidden');
  document.getElementById('btnEditar').classList.remove('hidden');
});

document.getElementById('formEditar').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const p = await api.actualizarPerfil(email, {
      nombre: document.getElementById('editNombre').value.trim(),
      cargo: document.getElementById('editCargo').value.trim() || null,
      centro_nombre: document.getElementById('editCentro').value.trim() || null,
    });
    setUsuario(p);
    renderPerfil(p);
    document.getElementById('formEditar').classList.add('hidden');
    document.getElementById('btnEditar').classList.remove('hidden');
    Swal.fire({ icon: 'success', title: 'Perfil actualizado', timer: 1500, showConfirmButton: false });
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
});

// --- Cambio de tema ---
function guardarTema(tema) {
  return api.actualizarPerfil(email, { tema }).then((p) => {
    setUsuario(p);
    renderPerfil(p);
    Swal.fire({ icon: 'success', title: `Tema ${tema} activado`, timer: 1200, showConfirmButton: false });
  }).catch((error) => Swal.fire('Error', error.message, 'error'));
}

document.getElementById('btnTemaClaro').addEventListener('click', () => guardarTema('claro'));
document.getElementById('btnTemaOscuro').addEventListener('click', () => guardarTema('oscuro'));

// --- Cambiar contraseña ---
document.getElementById('formClave').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nueva = document.getElementById('passNueva').value;
  const confirma = document.getElementById('passConfirma').value;
  if (nueva !== confirma) {
    Swal.fire('Error', 'La nueva contraseña y su confirmación no coinciden', 'error');
    return;
  }
  if (nueva.length < 6) {
    Swal.fire('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  try {
    await api.cambiarClave({
      email,
      password_actual: document.getElementById('passActual').value,
      password_nueva: nueva,
    });
    e.target.reset();
    Swal.fire({ icon: 'success', title: 'Contraseña actualizada', timer: 1500, showConfirmButton: false });
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
});

// --- Historial de consultas ---
function renderConsultas(rows) {
  const contenedor = document.getElementById('listaConsultas');
  const vacio = document.getElementById('emptyConsultas');
  contenedor.innerHTML = '';
  document.getElementById('contadorConsultas').textContent = rows.length;
  document.getElementById('btnLimpiarHistorial').style.display = rows.length === 0 ? 'none' : 'block';

  if (rows.length === 0) {
    vacio.classList.remove('hidden');
    return;
  }
  vacio.classList.add('hidden');

  rows.forEach((c) => {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'border border-gray-200 rounded-xl p-4 bg-white';

    const fecha = new Date(c.created_at);
    const fechaLabel = isNaN(fecha) ? c.created_at : fecha.toLocaleString('es-CL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });

    const fuentes = Array.isArray(c.fuentes) ? c.fuentes : [];
    const fuentesHtml = fuentes.length
      ? `<div class="mt-2 flex flex-wrap gap-1">
           <span class="text-[11px] text-gray-500 font-semibold">📌 Fuentes:</span>
           ${fuentes.map(f => `<span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-md text-gray-600">${f.tipo === 'interna' ? '🏢' : '📄'} ${esc(f.fuente)}</span>`).join('')}
         </div>`
      : '';

    tarjeta.innerHTML = `
      <p class="text-[11px] text-gray-400 mb-1">${esc(fechaLabel)}</p>
      <p class="font-semibold text-gray-800 text-sm">${esc(c.pregunta)}</p>
      <p class="text-sm text-gray-600 mt-1">${esc(c.respuesta).replace(/\n/g, '<br>')}</p>
      ${fuentesHtml}`;
    contenedor.appendChild(tarjeta);
  });
}

async function cargarConsultas() {
  try {
    const rows = await api.consultas(email);
    renderConsultas(rows);
  } catch (error) {
    console.error('Error cargando historial:', error);
  }
}

document.getElementById('btnLimpiarHistorial').addEventListener('click', async () => {
  const confirmacion = await Swal.fire({
    title: '¿Limpiar historial?',
    text: 'Se eliminarán todas tus consultas al asistente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, limpiar',
    cancelButtonText: 'Cancelar',
  });
  if (!confirmacion.isConfirmed) return;
  try {
    await api.limpiarConsultas(email);
    cargarConsultas();
    Swal.fire({ icon: 'success', title: 'Historial limpio', timer: 1200, showConfirmButton: false });
  } catch (error) {
    Swal.fire('Error', error.message, 'error');
  }
});

// --- Cerrar sesión ---
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

cargarConsultas();