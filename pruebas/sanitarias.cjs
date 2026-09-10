#!/usr/bin/env node
/*
 * sanitarias.js - Pruebas sanitarias de SalmoSUR S.A. (salud del sistema)
 * ---------------------------------------------------------------------------
 * Verifica HTTP (dashboard, login, 15 endpoints de módulos, /api/consultar),
 001; * base de datos (tablas y vistas con datos) e índice FAISS (65 chunks).
 * Genera pruebas/resultados_sanitarias.txt
 *
 * Uso:  node pruebas/sanitarias.js      (el servidor debe estar en :4000)
 */
process.loadEnvFile?.() ?? (() => {})();
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const BASE = 'http://localhost:4000';
const PYTHON = process.env.PYTHON_BIN || '/home/vrayirax/Documentos/actualizada⁄IngenierInteligencia-Artificial/.venv/bin/python';
const BASE_DIR = path.resolve(__dirname, '..');

const out = [];
const pr = (s) => out.push(s);
let fallos = 0;
async function r(label, cond, detalle) {
  if (cond) pr(`  [OK] ${label}: ${detalle}`);
  else { pr(`  [FALLO] ${label}: ${detalle}`); fallos++; }
}

const EPS = [
  '/api/ventas', '/api/calidad', '/api/mortalidad', '/api/rentabilidad',
  '/api/empleados', '/api/empleados/planilla', '/api/inventario', '/api/inventario/bajo',
  '/api/compras', '/api/exportaciones', '/api/exportaciones/mensual',
  '/api/lotes', '/api/lotes/biomasa', '/api/incidentes', '/api/incidentes/severidad',
];

async function main() {
  pr('PRUEBAS SANITARIAS - SalmoSUR S.A.');
  pr('Fecha: ' + new Date().toLocaleString('sv-SE'));
  pr('');
  pr('[HTTP]');
  pr('  Entorno: ' + BASE);

  // 1) Dashboard
  const home = await fetch(BASE + '/');
  const homeBody = await home.text();
  await r('GET / (login)', home.status === 200 && homeBody.includes('Sistema Salmonero'), home.status + ' (login servido)');
  const dash = await fetch(BASE + '/dashboard.html');
  const dashBody = await dash.text();
  await r('GET /dashboard.html', dash.status === 200 && dashBody.includes('chat-panel'), dash.status + ' (panel de chat presente: ' + dashBody.includes('chat-panel') + ')');

  // 2) Login
  const lr = await fetch(BASE + '/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@salmonera.com', password: 'admin123' }),
  });
  await r('POST /api/login (válido)', lr.status === 200, lr.status + '');
  const lrBad = await fetch(BASE + '/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@salmonera.com', password: 'clave123' }),
  });
  await r('POST /api/login (inválido → 401)', lrBad.status === 401, lrBad.status + '');

  // 3) Endpoints de módulos
  for (const ep of EPS) {
    let res;
    try { res = await fetch(BASE + ep); } catch (e) { res = { status: -1 }; }
    let cuerpo = null;
    if (res.status === 200) try { cuerpo = await res.json(); } catch (e) { /* noop */ }
    await r('GET ' + ep, res.status === 200 && Array.isArray(cuerpo), `${res.status} · array de ${Array.isArray(cuerpo) ? cuerpo.length : '?'} filas`);
  }

  // 4) /api/consultar
  const c1 = await fetch(BASE + '/api/consultar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pregunta: '¿Cuál es la planilla mensual del centro Los Lagos?' }),
  });
  let j1 = {};
  if (c1.status === 200) try { j1 = await c1.json(); } catch (e) { /* noop */ }
  const respOk = String(j1.respuesta || '').includes('18') && (j1.fuentes || []).length > 0;
  await r('POST /api/consultar (dato + fuentes)', c1.status === 200 && respOk, c1.status + ' · fuentes=' + (j1.fuentes || []).length + ' · dato 18 presente=' + String(j1.respuesta || '').includes('18'));
  const cB = await fetch(BASE + '/api/consultar', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
  });
  await r('POST /api/consultar (sin pregunta → 400)', cB.status === 400, cB.status + '');

  // [BD]
  pr('');
  pr('[BASE DE DATOS (PostgreSQL salmonera_pm)]');
  const pool = new Pool({
    host: process.env.PGHOST || 'localhost', port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'salmonera', password: process.env.PGPASSWORD || 'salmonera123',
    database: process.env.PGDATABASE || 'salmonera_pm',
  });
  const conteos = [
    ['ventas', 'SELECT COUNT(*)::int AS n FROM ventas'],
    ['empleados', 'SELECT COUNT(*)::int AS n FROM empleados'],
    ['inventario', 'SELECT COUNT(*)::int AS n FROM inventario'],
    ['compras', 'SELECT COUNT(*)::int AS n FROM compras'],
    ['exportaciones', 'SELECT COUNT(*)::int AS n FROM exportaciones'],
    ['lotes_detalle', 'SELECT COUNT(*)::int AS n FROM lotes_detalle'],
    ['incidentes', 'SELECT COUNT(*)::int AS n FROM incidentes'],
  ];
  for (const [tabla, q] of conteos) {
    try {
      const { rows } = await pool.query(q);
      await r('Tabla ' + tabla, rows[0].n > 0, rows[0].n + ' filas');
    } catch (e) {
      await r('Tabla ' + tabla, false, e.message);
    }
  }
  try {
    const rT = await pool.query('SELECT COUNT(*)::int AS n FROM v_incidentes_por_tipo');
    await r('Vista v_incidentes_por_tipo', rT.rows[0].n === 5, rT.rows[0].n + ' filas (5 tipos)');
  } catch (e) {
    await r('Vista v_incidentes_por_tipo', false, e.message);
  }
  await pool.end();

  // [ÍNDICE FAISS]
  pr('');
  pr('[ÍNDICE VECTORIAL (FAISS)]');
  try {
    const script = `
import sys; sys.path.insert(0, '${BASE_DIR}/scripts')
from query_rag import cargar_vector_db
db = cargar_vector_db()
print(db.index.ntotal)`;
    const salida = execFileSync(PYTHON, ['-c', script], { timeout: 120000 }).toString().trim();
    await r('Índice FAISS', parseInt(salida) === 65, salida + ' chunks (esperado 65)');
  } catch (e) {
    await r('Índice FAISS', false, String(e.message || e).split('\n')[0]);
  }

  pr('');
  pr('RESULTADO: ' + (fallos === 0 ? 'TODAS LAS PRUEBAS SANITARIAS PASARON ✔' : 'FALLARON ' + fallos + ' PRUEBA(S) ✘'));
  console.log(out.join('\n'));
  fs.writeFileSync(path.join(BASE_DIR, 'pruebas', 'resultados_sanitarias.txt'), out.join('\n') + '\n');
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERROR GLOBAL:', e); process.exit(2); });