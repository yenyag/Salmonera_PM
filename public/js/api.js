const BASE = '/api';

async function getJSON(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Error de red');
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Error de red');
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Error de red');
  return res.json();
}

export const api = {
  ventas: () => getJSON('/ventas'),
  calidad: () => getJSON('/calidad'),
  mortalidad: () => getJSON('/mortalidad'),
  rentabilidad: () => getJSON('/rentabilidad'),
  empleados: () => getJSON('/empleados'),
  empleadosPlanilla: () => getJSON('/empleados/planilla'),
  inventario: () => getJSON('/inventario'),
  inventarioBajo: () => getJSON('/inventario/bajo'),
  compras: () => getJSON('/compras'),
  exportaciones: () => getJSON('/exportaciones'),
  exportacionesMensual: () => getJSON('/exportaciones/mensual'),
  lotes: () => getJSON('/lotes'),
  lotesBiomasa: () => getJSON('/lotes/biomasa'),
  incidentes: () => getJSON('/incidentes'),
  incidentesSeveridad: () => getJSON('/incidentes/severidad'),
  concesiones: () => getJSON('/concesiones'),
  monitoreo: () => getJSON('/monitoreo'),
  monitoreoPromedio: () => getJSON('/monitoreo/promedio'),
  alimentacion: () => getJSON('/alimentacion'),
  clientes: () => getJSON('/clientes'),
  perfil: (email) => getJSON(`/perfil/${encodeURIComponent(email)}`),
  actualizarPerfil: (email, data) => putJSON(`/perfil/${encodeURIComponent(email)}`, data),
  cambiarClave: (data) => postJSON('/perfil/clave', data),
  consultas: (email) => getJSON(`/perfil/${encodeURIComponent(email)}/consultas`),
  limpiarConsultas: (email) => deleteJSON(`/perfil/${encodeURIComponent(email)}/consultas`),
  consultar: (pregunta) => postJSON('/consultar', { pregunta, email: usuarioEmail() }),
};

function usuarioEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && user.email ? user.email : null;
  } catch {
    return null;
  }
}

async function putJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Error de red');
  return res.json();
}

async function deleteJSON(path) {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).error || 'Error de red');
  return res.json();
}

export function setUsuario(user) {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('usuario-actualizado', { detail: user }));
}
