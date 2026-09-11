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
  consultar: (pregunta) => postJSON('/consultar', { pregunta }),
};
