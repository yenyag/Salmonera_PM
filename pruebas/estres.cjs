#!/usr/bin/env node
/*
 * estres.js - Prueba de estrés de SalmoSUR S.A.
 * -------------------------------------------------
 * Estrés 1 (REST): 3 rondas de 15 endpoints en paralelo.
 * Estrés 2 (RAG): 10 consultas /api/consultar lanzadas en paralelo.
 * Mide éxito, latencia p50/p95/max por ronda y memoria del proceso servidor.
 * Los tokens del estrés se estiman con el promedio real medido por el pipeline
 * (1 115 tokens/consulta): el API REST no expone el usage de Groq.
 *
 * Uso:  SVR_PID=<pid node server.js> node pruebas/estres.js
 */
process.loadEnvFile?.() ?? (() => {})();
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:4000';
const BASE_DIR = path.resolve(__dirname, '..');
const SVR_PID = process.env.SVR_PID;
const TOK_AVG = 1115; // promedio real medido en medir_chunks_tokens (14 consultas)

const EPS = [
  '/api/ventas', '/api/calidad', '/api/mortalidad', '/api/rentabilidad',
  '/api/empleados', '/api/empleados/planilla', '/api/inventario', '/api/inventario/bajo',
  '/api/compras', '/api/exportaciones', '/api/exportaciones/mensual',
  '/api/lotes', '/api/lotes/biomasa', '/api/incidentes', '/api/incidentes/severidad',
];

const out = [];
const pr = (s) => { out.push(s); console.log(s); };

function percentil(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
}
function memKB() {
  if (!SVR_PID) return null;
  try {
    const t = fs.readFileSync(`/proc/${SVR_PID}/status`, 'utf8');
    const m = t.match(/VmRSS:\s+(\d+) kB/);
    return m ? parseInt(m[1]) : null;
  } catch (e) { return null; }
}

async function rap(ep) {
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + ep);
    return { ep, status: res.status, ms: Date.now() - t0 };
  } catch (e) {
    return { ep, status: -1, ms: Date.now() - t0, error: String(e.code || e.message) };
  }
}

async function consultar(pregunta) {
  const t0 = Date.now();
  try {
    const res = await fetch(BASE + '/api/consultar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pregunta }),
      signal: AbortSignal.timeout(90000),
    });
    const ms = Date.now() - t0;
    let j = {};
    if (res.status === 200) try { j = await res.json(); } catch (e) { /* noop */ }
    return { pregunta, status: res.status, ms, ok: res.status === 200, respuesta: String(j.respuesta || ''), fuentes: (j.fuentes || []).length, error: res.status === 200 ? null : JSON.stringify(j).slice(0, 140) };
  } catch (e) {
    return { pregunta, status: -1, ms: Date.now() - t0, ok: false, error: String(e.code || e.message) };
  }
}

const RAG_PREGUNTAS = [
  '¿Qué lote tiene mayor mortalidad acumulada?',
  '¿Cuál es la planilla mensual del centro Los Lagos?',
  '¿Cuáles fueron las ventas de enero de 2025?',
  '¿Qué productos del inventario están bajo su stock mínimo?',
  '¿Qué proveedor facturó más en el periodo?',
  '¿Cuántos incidentes de severidad crítica hay y de qué tipo?',
  '¿Cuánto pagó la empresa en impuestos a la renta durante 2024?',
  '¿Qué centro concentra la mayor biomasa?',
  '¿Cuál es el principal destino de exportaciones por valor FOB?',
  '¿Qué lote tiene el FCR más bajo?',
];

async function main() {
  const m0 = memKB();
  pr('PRUEBA DE ESTRÉS - SalmoSUR S.A.');
  pr('Fecha: ' + new Date().toLocaleString('sv-SE'));
  pr('Servidor: ' + BASE + (SVR_PID ? ` · PID ${SVR_PID}` : ''));
  pr(m0 ? `Memoria servidor antes del estrés: ${(m0 / 1024).toFixed(1)} MB` : 'Memoria: n/d (define SVR_PID para medir)');

  // ---- ESTRÉS 1: REST --------------------------------------------------------
  pr('');
  pr('[1] RÁFAGAS ENDPOINTS REST (3 rondas x 15 endpoints en paralelo)');
  const resumenRondas = [];
  for (let ronda = 1; ronda <= 3; ronda++) {
    const t0 = Date.now();
    const res = await Promise.all(EPS.map(rap));
    const dur = Date.now() - t0;
    const oks = res.filter((r) => r.status === 200).length;
    const ms = res.map((r) => r.ms);
    const linea = `  Ronda ${ronda}: ${oks}/${EPS.length} OK · dur ${dur} ms · p50 ${percentil(ms, 0.5)} ms · p95 ${percentil(ms, 0.95)} ms · max ${Math.max(...ms)} ms · timeouts/errores ${EPS.length - oks}`;
    pr(linea);
    resumenRondas.push({ ronda, ok: oks, total: EPS.length, durMs: dur, p50: percentil(ms, 0.5), p95: percentil(ms, 0.95), max: Math.max(...ms) });
    res.filter((r) => r.status !== 200).forEach((r) => pr(`    ✘ ${r.ep} → ${r.status}${r.error ? ' ' + r.error : ''}`));
  }

  // ---- ESTRÉS 2: RAG concurrente ---------------------------------------------
  pr('');
  pr('[2] ' + RAG_PREGUNTAS.length + ' CONSULTAS RAG EN PARALELO (/api/consultar)');
  pr('  (cada consulta lanza un subproceso Python: embeddings + Groq)');
  const t0 = Date.now();
  const res = await Promise.all(RAG_PREGUNTAS.map(consultar));
  const dur = Date.now() - t0;
  const oks = res.filter((r) => r.ok).length;
  const ms = res.map((r) => r.ms);
  pr(`  Resultado: ${oks}/${res.length} OK · duración total del lote ${dur} ms · p50 ${percentil(ms, 0.5)} ms · p95 ${percentil(ms, 0.95)} ms · max ${Math.max(...ms)} ms`);
  res.forEach((r) => {
    pr(`  [${r.ok ? 'OK' : '✘'}] ${String(r.pregunta).slice(0, 48).padEnd(50)} HTTP ${r.status} · ${r.ms} ms · fuentes=${r.fuentes}${r.ok ? '' : ' · ' + (r.error || '')}`);
  });

  // Tokens estimados
  pr('');
  pr('[3] TOKENS DEL ESTRÉS RAG');
  const tok = oks * TOK_AVG;
  pr(`  Consultas OK: ${oks} × promedio real 1 115 tokens = ≈ ${tok.toLocaleString('es-CL')} tokens`);
  pr('  Nota: /api/consultar no expone el usage; el promedio 1 115 proviene de `medir_chunks_tokens.py` (usage real de Groq).');

  const m1 = memKB();
  pr('');
  pr(m1 ? `Memoria servidor después del estrés: ${(m1 / 1024).toFixed(1)} MB` : '');
  const fallos = res.filter((r) => !r.ok).length + resumenRondas.reduce((a, x) => a + (x.total - x.ok), 0);
  pr('RESULTADO GENERAL: ' + (fallos === 0 ? 'SIN ERRORES, EL SISTEMA AGUANTÓ ✔' : fallos + ' ERROR(ES) DETECTADO(S) ✘'));

  fs.writeFileSync(path.join(BASE_DIR, 'pruebas', 'resultados_estres.json'), JSON.stringify({
    fecha: new Date().toISOString(), rondas: resumenRondas, rag: { total: res.length, ok: oks, duraMs: dur, p50: percentil(ms, 0.5), p95: percentil(ms, 0.95), max: Math.max(...ms), tokens_estimados: tok, pregunta_avg_tokens: TOK_AVG },
    memoria: { antes_kb: m0, despues_kb: m1 },
  }, null, 2));
  fs.writeFileSync(path.join(BASE_DIR, 'pruebas', 'resultados_estres.txt'), out.join('\n') + '\n');
  process.exit(fallos === 0 ? 0 : 1);
}

main().catch((e) => { console.error('ERROR GLOBAL:', e); process.exit(2); });