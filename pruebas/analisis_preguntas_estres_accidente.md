# Análisis por pregunta - Estrés y Escenario de Accidente Laboral

**Fecha:** 2026-09-10 · **Pipeline:** Groq `openai/gpt-oss-120b`, temp 0.1, max_tokens 1500, retriever k=5
**Contexto hardware:** NVIDIA RTX 3050 Laptop (4 GiB VRAM) · 16 núcleos · 30 GiB RAM

---

## 1) TEST DE ESTRÉS

### Comportamiento observado
- **Lote en paralelo (10 consultas a la vez):** 2/10 OK · 8/10 HTTP 500 a ~16,5 s (OOM de VRAM de la GPU al cargar embeddings).
- **Batería en secuencia (1 a la vez):** 10/10 OK → todas las preguntas se responden correctamente si no compiten por la GPU.
- **Endpoints REST al mismo tiempo:** 45/45 OK sin degradación (p95 ≤ 85 ms).

### Detalle por pregunta (medición secuencial: tokens reales + latencia)

| P | Pregunta | Respuesta | Prompt | Comp | Total | Latencia | ¿Correcta? |
|---|----------|-----------|--------|------|-------|----------|-----------|
| E1 | ¿Qué lote tiene mayor mortalidad acumulada? | LOTE-B2, 2 300 unidades | 799 | 158 | **957** | 2,56 s | Sí (fuente: mortalidad/vista_mortalidad) |
| E2 | ¿Cuál es la planilla mensual del centro Los Lagos? | **$18.050.000 CLP** | 746 | 112 | **858** | 0,85 s | Sí (fuente: empleados/v_planilla) |
| E3 | ¿Cuáles fueron las ventas de enero de 2025? | $125.000.000 CLP | 941 | 117 | **1.058** | 0,63 s | Sí (fuente: ventas) |
| E4 | ¿Qué productos del inventario están bajo su stock mínimo? | 3 ítems (Alimento 9mm, Vacuna ISA, Red 30mm) | 767 | 238 | **1.005** | 1,83 s | Sí (fuente: inventario/v_stock_bajo) |
| E5 | ¿Qué proveedor facturó más en el periodo? | Transportes Austral, $60.500.000 | 750 | 282 | **1.032** | 0,98 s | Sí (fuente: compras) |
| E6 | ¿Cuántos incidentes de severidad crítica hay y de qué tipo? | 2, todos del tipo escape | 818 | 194 | **1.012** | 1,87 s | Sí (fuente: incidentes) |
| E7 | ¿Cuánto pagó la empresa en impuestos a la renta durante 2024? | No tengo información suficiente (anti-alucinación) | 1.020 | 140 | **1.160** | 4,81 s | Sí — evita inventar |
| E8 | ¿Qué centro concentra la mayor biomasa? | Los Lagos, 6.750.000 kg | 952 | 214 | **1.166** | 0,88 s | Sí (fuente: lotes_detalle/v_biomasa) |
| E9 | ¿Cuál es el principal destino de exportaciones por FOB? | Estados Unidos, $4.940.000.000 | 1.067 | 122 | **1.189** | 0,99 s | Sí (fuente: exportaciones) |
| E10 | ¿Qué lote tiene el FCR más bajo? | LOTE-K1 (Quellón), FCR 1.09 | 778 | 246 | **1.024** | 2,07 s | Sí (fuente: lotes) |

**Totales batería de estrés (secuencial):** prompt 8.638 · completion 1.823 · **total 10.461 tokens** · promedio 1.046/consulta · latencia media ≈ 1,75 s

**Cuota diaria proyectada (100K tokens):** ≈ 95 consultas

### Conclusión del análisis de estrés
- El contenido y la calidad no son el problema: 10/10 responden bien en secuencia.
- El punto frágil es el **arranque concurrente del modelo de embeddings en GPU**: con ≥3 subprocesos Python simultáneos, la VRAM (4 GiB) se agota y el servidor responde 500. En paralelo, las 2 primeras que lograron cargar el modelo tardaron ~17 s (arranque + Groq).
- Recomendación: **semáforo de concurrencia (máx. 2)** en `/api/consultar` para encolar en lugar de fallar.

---

## 2) ESCENARIO DE ACCIDENTE LABORAL (prueba específica)

**Coherencia: 9/9** · **Tokens totales: 10.281** · promedio 1.142/consulta

### Detalle por pregunta

| ID | Pregunta | Respuesta clave | Prompt | Comp | Total | ¿Coherente? |
|----|----------|-----------------|--------|------|-------|-------------|
| A1 | ¿Cuántos incidentes de tipo accidente se registraron? | 4 incidentes de tipo accidente | 898 | 105 | **1.003** | Sí (dato + fuente) |
| A2 | Accidente en cosecha en Quellón: ¿qué medidas de bioseguridad aplicar? | Control de acceso, desinfección, manejo de mortalidades, programa de bioseguridad; activar contingencia y notificar | 800 | 591 | **1.391** | Sí (bioseguridad + Sernapesca) |
| A3 | ¿Cuántos incidentes de severidad crítica y de qué tipo? | 2, todos del tipo escape | 924 | 185 | **1.109** | Sí (incidentes) |
| A4 | ¿A qué número de emergencia llamar y qué hacer en un accidente laboral? | 131 (SAMU), 132, 133; primeros auxilios, denuncia DIAT, Ley 16.744 | 928 | 346 | **1.274** | Sí (protocolo externo) |
| A5 | ¿Con qué seguro de accidentes del trabajo cuenta un operario? | Ley 16.744, administrado por mutualidad de empleadores o ISL | 921 | 273 | **1.194** | Sí (protocolo externo) |
| A9 | ¿Cuántos accidentes laborales fatales registró SalmoSUR en 2024? | **No tengo información suficiente** (anti-alucinación) | 880 | 128 | **1.008** | Sí |
| A6 | Mortalidad elevada tras incidente: ¿qué debe hacer según Sernapesca? | Activar plan de contingencia, notificar a Sernapesca, manejo de mortalidades | 801 | 270 | **1.071** | Sí (bioseguridad + Sernapesca) |
| A7 | Del total: ¿cuántos accidente y cuántos escape? | 4 accidente · 4 escape | 901 | 174 | **1.075** | Sí (incidentes) |
| A8 | ¿Cuántos incidentes por severidad? | bajo 4 · medio 6 · alto 6 · crítico 2 | 928 | 228 | **1.156** | Sí (incidentes) |

**Totales de la batería ampliada (9 consultas):** prompt 7.981 · completion 2.300 · **total 10.281** · promedio 1.142/consulta (rango 1.003–1.391)

### Conclusión del análisis de accidente
- En un momento de accidente laboral el asistente **reacciona correctamente en los 3 frentes**:
  1. **Dato verificable:** responde con cifras exactas y cita la fuente (incidentes.txt).
  2. **Procedimiento/normativa:** ante números de emergencia o seguro laboral responde la normativa chilena aplicable (131/132/133, Ley 16.744, mutualidad/ISL) citando el documento externo.
  3. **Sin datos (anti-alucinación):** ante un dato que no existe en el corpus (accidentes fatales registrados), responde "No tengo información suficiente" — no alucina una cifra, lo cual es crítico en una emergencia.

---

## 3) TOKENS TOTALES GASTADOS EN ESTA JORNADA DE PRUEBAS

| Prueba | Consultas | Tokens |
|--------|----------|--------|
| Medición base (14 preguntas) | 14 | 15.615 |
| Sanitarias (2 RAG) | 2 | ≈ 2.100 |
| Estrés en secuencia | 10 | 10.461 |
| Estrés en paralelo (éxitos) | 2 | ≈ 2.230 |
| Accidente laboral (corrida inicial) | 8 | 8.503 |
| Accidente laboral ampliado (9 preguntas, corpus nuevo) | 9 | 10.281 |
| Pregunta compleja (2 intentos + 1 post-mejora) | 3 | ≈ 4.800 |
| **Total acumulado** | 48 | **≈ 53.990** |