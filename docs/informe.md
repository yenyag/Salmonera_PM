# Informe Técnico — Asistente IA con RAG para SalmoSUR S.A.

**Evaluación Parcial N°1 · Diseño de Solución con LLM y RAG**

| Dato | Valor |
|------|-------|
| **Sigla** | ISY0101 |
| **Asignatura** | Ingeniería de Soluciones con IA |
| **Institución** | Duoc UC |
| **Tiempo asignado** | 2 horas pedagógicas (ponderación 30%) |
| **Integrante 1** | *[Nombre Integrante 1 — sección] — completar* |
| **Integrante 2** | *[Nombre Integrante 2 — sección] — completar* |
| **Fecha** | Septiembre 2026 |
| **Repositorio** | https://github.com/yenyag/Salmonera_PM · rama `int/ia` |

---

## Declaración de uso de IA (obligatoria)

Este proyecto utilizó herramientas de IA como **apoyo en redacción, revisión de código y generación de diagramas** (GitHub Copilot/assistentes de código, asistentes de texto). **Las decisiones técnicas, el diseño de la solución, los análisis y las conclusiones fueron elaborados y validados por el equipo**, y las reflexiones individuales fueron redactadas sin apoyo de IA. Todo contenido generado con IA fue revisado y contrastado con la documentación del curso. (`https://bibliotecas.duoc.cl/ia`)

---

## A. Análisis del caso organizacional (IE1)

**Organización.** SalmoSUR S.A., empresa chilena de producción y comercialización de salmón, con centros de cultivo en Los Lagos, Chiloé, Quellón y Aysén. Dispone de un sistema de gestión en línea (PostgreSQL + dashboard web).

**Problema identificado.** La información operativa (ventas, mortalidad, biomasa, planilla, stock, exportaciones, incidentes) y la normativa del sector (Sernapesca, bioseguridad, requisitos de exportación) se consultan por separado. Cada consulta exige navegar el dashboard y contactar a TI, con tiempos de 15 a 30 minutos y sin trazabilidad del origen del dato.

**Objetivos de la intervención.**
1. Responder consultas operativas en lenguaje natural en **menos de 1 minuto**.
2. Respuestas **fundamentadas en datos internos y normativa externa**, con **citación de la fuente** de cada dato.
3. Integrar la solución en el **dashboard existente** sin modificar el flujo de trabajo del equipo.
4. Evitar **alucinaciones**: cuando el dato no exista en las fuentes, el asistente debe declarar que no tiene información.

**Datos disponibles.** PostgreSQL con 12 tablas (`ventas`, `cosechas`, `lotes`, `centros`, `empleados`, `inventario`, `proveedores`, `compras`, `exportaciones`, `lotes_detalle`, `incidentes`, `usuarios`), más 6 documentos normativos del sector.

**Requerimientos de la solución con IA:** consulta en lenguaje natural, recuperación simultánea de fuentes internas y externas, trazabilidad, control de contexto, e integración al sistema web existente.

---

## B. Formulación de prompts (IE2)

El prompt del sistema (`scripts/query_rag.py`) sigue la estructura clásica **rol → contexto → pregunta**, con reglas explícitas de control de calidad:

```
Eres el asistente interno de la empresa SalmoSUR S.A. …
REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con la información contenida en el CONTEXTO RECUPERADO.
2. Si la pregunta no puede responderse con el contexto, responde textualmente:
   "No tengo información suficiente para responder eso."
3. Cita la fuente de cada dato al final de tu respuesta: [Fuente: <archivo>]
4. Usa cifras y fechas exactas de los datos. No inventes ni redondees.
5. Responde en español, de forma clara y concisa.
6. Si te preguntan por recomendaciones, basalas únicamente en los datos del contexto.
7. Si la pregunta pide enumerar, respóndela COMPLETA con todos los elementos.

CONTEXTO RECUPERADO: {contexto}
```

**Justificación de elementos clave.**

| Elemento | Decisión | Fundamento |
|----------|----------|------------|
| Rol explícito | "Asistente interno de SalmoSUR" | Alinea tono, vocabulario y dominio; técnica de rol + tarea |
| Regla 1 (solo contexto) | Barrado anti-alucinación | El LLM no conoce los datos de la empresa; limita la generación a datos reales |
| Regla 2 (no sé) | Manejo de dato ausente | Evita inventar cifras si el retriever no recupera evidencia (IE4) |
| Regla 3 (citar fuente) | Trazabilidad | Cada dato es verificable por el usuario desde su origen |
| Regla 4 (cifras exactas) | Precisión numérica | Evita redondeos/errores típicos de LLM |
| Regla 7 (enumerar completo) | Exhaustividad | Evita respuestas truncadas en listas (requisitos, productos, lotes) |
| `{contexto}` separado | Una variable por consulta | Distingue dato vs regla; el contexto proviene del retriever (k=5) |
| Temperatura 0.1 | Baja | Respuestas deterministas y consistentes con las fuentes |

---

## C. Diseño e implementación del pipeline RAG (IE3, IE4)

**Flujo de ingesta (una vez por actualización de datos).**

```
PostgreSQL ──generate_internal_docs.py──▶ data/interna/ (10 reportes con sumario ejecutivo)
                                                               │
data/externa/ (6 documentos normativos) ───────────────────────┤
                                                               ▼
                               RecursiveCharacterTextSplitter (600 / solap. 80)
                                                               ▼
                              Embeddings locales paraphrase-multilingual-MiniLM-L12-v2 (384 dims)
                                                               ▼
                                              FAISS.save_local(data/faiss_index)
```

- **Fuente interna:** 10 reportes generados desde las vistas PostgreSQL (ventas, calidad, mortalidad, rentabilidad, empleados, inventario, compras, exportaciones, lotes detallados, incidentes). Cada reporte inicia con un **sumario ejecutivo** que enuncia los datos salientes (máximo de planilla, proveedor mayor, mejor FCR, alertas de stock, etc.) para que las consultas puntuales recuperen la conclusión en el primer chunk.
- **Fuente externa:** normativa chilena del sector (Sernapesca, bioseguridad, requisitos y calidad de exportación, mercado del salmón, accidentes laborales / Ley 16.744).
- **Chunking:** tamaño 600 caracteres con solapamiento 80 (ajuste validado empíricamente: elevó la coherencia de las pruebas).
- **Embeddings:** modelo multilingüe local (384 dimensiones) — los datos **no salen de la máquina**.
- **Índice:** FAISS con 16 documentos y 65 chunks.

**Flujo de consulta (por pregunta del usuario).**

```
pregunta → retriever FAISS (k=5, + recuperación ampliada por keywords de dominio)
         → max 8 chunks → prompt (sistema + contexto + pregunta)
         → LLM Groq openai/gpt-oss-120b → respuesta + [Fuente: …] → POST /api/consultar
```

**Recuperación ampliada por keywords.** Cuando la pregunta menciona un módulo con datos reales
(incidentes, inventario/stock, proveedor, exportaciones, planilla, lote, FCR), `query_rag.py` refuerza
el contexto con esos chunks aunque la similitud los deje fuera del top-k. Esto corrigió la pregunta
compleja multi-tabla (ver §C.3) **sin subir k** y **sin anular el anti-alucinación** (las keywords
excluyen términos de seguridad/emergencia como "accidente"/"emergencia").

---

### C.1. Pruebas de coherencia — 14/14 (IE4)

**Propósito:** validar que cada respuesta del asistente contiene los datos correctos y cita al menos una fuente.

**Metodología:** se definieron 14 preguntas de prueba (`pruebas/preguntas.json`) que cubren:
- Datos internos puros (P1–P4, P8–P14): mortalidad, ventas, rentabilidad, calidad, planilla, inventario, compras, exportaciones, lotes, incidentes.
- Combinación interna + externa (P5): mortalidad + bioseguridad/sernapesca.
- Dato externo puro (P6): requisitos de exportación.
- Anti-alucinación (P7): pregunta sin dato disponible (impuestos a la renta 2024).

**Evaluador heurístico** (`scripts/run_pruebas.py`): normaliza texto (acentos, guiones, formato numérico) y verifica que los tokens de interés aparezcan en la respuesta y que el asistente cite al menos una fuente; para preguntas sin dato, exige la respuesta literal "No tengo información suficiente".

**Resultado:**

| Bloque | Preguntas | Fuentes usadas |
|--------|-----------|----------------|
| Datos internos | P1–P4, P8–P14 | mortalidad, ventas, rentabilidad, calidad, empleados, inventario, compras, exportaciones, lotes_detalle, incidentes (.txt) |
| Interna + externa | P5 | mortalidad (interna) + bioseguridad / sernapesca (externa) |
| Dato externo | P6 | exportacion_calidad (externa) |
| Sin dato (anti-alucinación) | P7 | ninguna (responde "No tengo información suficiente") |

Evidencia completa con respuestas literales en `pruebas/resultados.md`.

---

### C.2. Pruebas de accidente laboral — 9/9 (IE4)

**Propósito:** validar el comportamiento del asistente ante un escenario de accidente laboral: dato verificable, procedimiento/normativa, datos legales y anti-alucinación.

**Metodología:** se definieron 9 preguntas (`pruebas/preguntas_accidente.json`) que cubren:
- **Dato verificable** (A1, A3, A7, A8): cantidad de accidentes, severidades, tipos.
- **Procedimiento** (A2, A6): medidas de bioseguridad, notificación a Sernapesca.
- **Dato externo/normativo** (A4, A5): números de emergencia (131/132/133), Ley 16.744, mutualidades.
- **Anti-alucinación** (A9): accidentes fatales 2024 (dato inexistente).

**Ejecución:** `python scripts/prueba_accidente.py` (Groq `openai/gpt-oss-120b`, k=5, temperature 0.1, max_tokens 1500).

**Resultado:**

| ID | Tipo | Pregunta clave | Tokens | ¿Coherente? |
|----|------|---------------|--------|-------------|
| A1 | Dato verificable | 4 accidentes tipo accidente | 1 003 | Sí |
| A2 | Procedimiento | Bioseguridad: control acceso, desinfección, mortalidades | 1 391 | Sí |
| A3 | Dato verificable | 2 críticos tipo escape | 1 109 | Sí |
| A4 | Normativo | 131 SAMU, DIAT, Ley 16.744 | 1 274 | Sí |
| A5 | Normativo | Ley 16.744, mutualidad/ISL | 1 194 | Sí |
| A9 | Anti-alucinación | "No tengo información suficiente" | 1 008 | Sí |
| A6 | Procedimiento | Contingencia + notificar Sernapesca | 1 071 | Sí |
| A7 | Dato verificable | 4 accidente · 4 escape | 1 075 | Sí |
| A8 | Dato verificable | bajo 4 · medio 6 · alto 6 · crítico 2 | 1 156 | Sí |

**Totales:** 10 281 tokens, promedio 1 142/consulta. Proyección: ~88 consultas/día con cuota Groq.

Evidencia: `pruebas/resultados_accidente.md` y `pruebas/analisis_preguntas_estres_accidente.md`.

---

### C.3. Pregunta compleja multi-tabla — resuelta (IE4)

**Propósito:** validar que el asistente integra datos de 3+ dominios en una sola respuesta.

**Problema original:** con k=5, los chunks de `incidentes.txt` (8.º) e `inventario.txt` (10.º) quedaban fuera del ranking por similitud → el asistente respondía "No tengo información suficiente".

**Solución implementada:**
1. Corpus ampliado: detalle de accidentes/críticos en `incidentes.txt` + documento externo `protocolo_accidentes_laborales.txt` (65 chunks totales).
2. Recuperación ampliada por keywords en `query_rag.py`: cuando la pregunta contiene un módulo (incidentes, inventario, stock, etc.), se refuerza el contexto con hasta +3 chunks adicionales.

**Pregunta de prueba:**
> "El LOTE-B2 concentra la mayor mortalidad acumulada, hay 2 incidentes de severidad crítica del tipo escape y el inventario tiene ítems bajo su stock mínimo. Integra estos hechos y recomienda qué debería priorizar SalmoSUR."

**Resultado:** el asistente integra mortalidad B2 (2 300 unidades), 2 escapes críticos y bioseguridad, con 4 fuentes citadas (2 330 tokens). Ver `pruebas/analisis_pregunta_compleja.md`.

---

### C.4. Medición de chunks y consumo de tokens (IE3, IE7)

Prueba reproducible con `python scripts/medir_chunks_tokens.py` (reporte completo en `pruebas/medicion_chunks_tokens.txt`).

| Métrica | Valor |
|---------|-------|
| Chunks indexados | **65** (45 internos + 20 externos) |
| Documentos indexados | 16 (10 internos + 6 externos) |
| Contexto recuperado por consulta | 5 chunks por similitud (~2 000 caracteres) + hasta 3 refuerzos por keywords |
| Tokens por consulta (promedio) | **1 115** (entrada ≈ 870, salida ≈ 246) |

| Total en 14 consultas | Tokens |
|-----------------------|--------|
| Entrada (prompt) | 12 174 |
| Salida (completion) | 3 441 |
| **Total de la prueba** | **15 615** |
| En caché (contexto repetido) | 2 560 (21 % del prompt) |
| De razonamiento | 2 115 (61 % de la salida) |

- **Latencia media:** 1,13 s por consulta (Groq, `openai/gpt-oss-120b`, temperature 0.1, max_tokens 1500).
- **Proyección de costo:** con el límite diario de la capa gratuita de Groq (100 000 tokens), caben ≈ 90 consultas como las de la batería.

---

### C.5. Pruebas operativas: sanitarias, estrés y accidente (IE3, IE4, IE9)

#### C.5.1. Pruebas sanitarias — 100 % OK

**Script:** `node pruebas/sanitarias.cjs`

**Qué verifica:**
- HTTP: dashboard (200), login válido (200), login inválido (401).
- 15 endpoints de módulos: ventas, calidad, mortalidad, rentabilidad, empleados, planilla, inventario, bajo stock, compras, exportaciones, exportaciones mensual, lotes, biomasa, incidentes, severidad — todos responden 200 con datos.
- `/api/consultar`: POST con pregunta → 200 + dato + fuentes; POST sin pregunta → 400.
- BD PostgreSQL: 7 tablas con registros (25 empleados, 22 ítems inventario, 30 compras, 28 exportaciones, 20 lotes, 18 incidentes, 6 ventas).
- Índice FAISS: 65 chunks (validación dinámica).

**Resultado:** 27/27 checks OK.

Evidencia: `pruebas/resultados_sanitarias.txt`.

#### C.5.2. Prueba de estrés — semáforo implementado

**Script:** `node pruebas/estres.cjs`

**Fase 1 — REST (3 ráfagas × 15 endpoints en paralelo):**
- 45/45 peticiones OK, p95 ≤ 85 ms, sin errores.

**Fase 2 — RAG en secuencia (10 consultas):**
- 10/10 respuestas correctas, 10 461 tokens (promedio 1 046/consulta, latencia media 1,75 s).

**Fase 3 — RAG en paralelo (10 consultas simultáneas):**

| Métrica | Antes (sin semáforo) | Después (con semáforo) |
|---------|---------------------|----------------------|
| OK | 2/10 | 8/10 |
| HTTP 500 (OOM VRAM) | 8/10 | **0/10** |
| Timeout de cola | 0 | 2/10 |

**Causa del fallo original:** cada `/api/consultar` lanzaba un subproceso Python que carga el modelo de embeddings en la GPU (RTX 3050, 4 GiB VRAM); con varias simultáneas la VRAM se agota → `torch.OutOfMemoryError` → HTTP 500.

**Mitigación implementada:** semáforo de concurrencia (máx. 2 subprocesos simultáneos) en `server.js`: las consultas adicionales se encolan en vez de fallar. El servidor no se cae (memoria estable, 67→72 MB).

Evidencia: `pruebas/resultados_estres.txt` y `pruebas/resultados_estres.json`.

---

## D. Arquitectura de la solución (IE5, IE6)

```mermaid
flowchart TD
    subgraph Usuario
        U[Administrador / Jefe de Operaciones]
    end
    subgraph Frontend
        D[Dashboard.html + charts.js + chat.js]
    end
    subgraph BE["Backend Node.js / Express :4000"]
        API[/POST api/consultar/]
        REST[/api/ventas · empleados · inventario · compras · exportaciones · lotes · incidentes/]
    end
    subgraph FUENTES["Fuentes de datos"]
        PG[(PostgreSQL salmonera_pm)]
        DOCS["data/interna (10 reportes)"]
        EXT["data/externa (6 normativos)"]
    end
    subgraph RAG["Pipeline RAG (Python)"]
        GEN["generate_internal_docs.py BD→texto"]
        CH["Chunking 600/80"]
        EMB["Embeddings locales 384-d"]
        FA[(FAISS 65 chunks)]
        RET["Retriever k=5"]
        LLM["LLM Groq gpt-oss-120b"]
    end
    U --> D
    D --> REST --> PG
    D --> API --> RET
    GEN --> PG --> DOCS
    DOCS --> CH
    EXT --> CH --> EMB --> FA
    RET --> FA
    RET --> LLM
    API --> LLM
    LLM -->|respuesta + fuentes| API --> D
```

**Componentes clave y su rol.**

| Componente | Tecnología | Rol en la operación |
|------------|------------|---------------------|
| Frontend | HTML + Tailwind + Chart.js | Dashboard con 16 paneles (gráficos + tablas) y chat flotante del asistente |
| Backend | Node.js + Express | 19 endpoints REST + `POST /api/consultar` que ejecuta el pipeline RAG |
| Fuente interna | PostgreSQL → `data/interna/` | Datos operativos transformados a texto para su indexación |
| Fuente externa | `data/externa/` | Normativa del sector para recomendaciones con respaldo |
| Vector store | FAISS (local) | Búsqueda por similitud sobre embeddings |
| Generación | Groq `openai/gpt-oss-120b` | Compendio final fundamentado en el contexto recuperado |
| Observabilidad | LangSmith | Trazas completas de cada consulta (retrieval, tokens, latencia, respuesta) para monitoreo y optimización |

**Flujo de datos:** ruta de ingesta (BD → reportes → chunks → embeddings → FAISS) y ruta de consulta (pregunta → retriever → prompt → LLM → respuesta con fuentes → dashboard). Los datos no abandonan la máquina en la fase de embedding.

---

## E. Justificación de decisiones de diseño (IE7, IE8)

| Decisión | Alternativas | Justificación (objetivos organizacionales) |
|----------|--------------|---------------------------------------------|
| **FAISS** en vez de Chroma/Pinecone | Pinecone (nube, pago), Chroma | Corpus pequeño (65 chunks): FAISS es gratuito, local y suficiente; evita costos y la salida de datos |
| **Embeddings locales** | OpenAI embeddings (pago, externo) | Groq no ofrece embeddings; el modelo multilingüe local garantiza privacidad y costo cero |
| **Groq gpt-oss-120b** | OpenAI, Anthropic | Capa gratuita, baja latencia; el volumen de consultas cabe en el límite diario (≈90 consultas/día con la configuración actual) |
| **Chunk 600 / overlap 80** | Tamaños 300 y 900 | 600 con overlap preserva contexto y mejora recuperación (validado: coherencia subió en las pruebas) |
| **k=5** | k=3, k=7 | Equilibrio costo/precisión: las consultas puntuales (1-2 dominios) se responden exactas; con k=5 se ahorran tokens frente a k=7. La pregunta compleja multi-tabla se resolvió con la **recuperación ampliada por keywords** (refuerza el contexto cuando la pregunta menciona un módulo) en vez de subir k |
| **RAG vía subproceso Python por consulta** | Pool persistente de workers | Simple de integrar con el dashboard Node.js; hallazgo del estrés: la carga simultánea del modelo de embeddings satura la VRAM de la GPU (RTX 3050 4 GiB) → 500 en paralelo; **mitigación implementada**: semáforo con máx. 2 subprocesos (validado: 8/10 OK sin errores 500) |
| **Prompt con reglas + "no sé"** | Prompt libre | Controla alucinaciones y garantiza trazabilidad (IE4) |
| **LangSmith para observabilidad** | Sin trazas, Logging básico | Permite monitorear cada paso del pipeline (retrieval, generación, tokens) para detectar problemas y optimizar; gratis para desarrollo | |
| **Sumario ejecutivo por reporte** | Reportes planos | La conclusión queda en el primer chunk y las consultas puntuales se responden con exactitud |
| **Vistas SQL** | Consultas ad-hoc | Reutilizables para API y reportes RAG; fuente única de verdad |

---

## F. Redacción técnica y evidencias (IE9)

- **Lenguaje:** descripción precisa de componentes (retriever, índice vectorial, embeddings, chunking) y cifras exactas de la validación.
- **Evidencia empírica:** 14/14 pruebas de coherencia con citación de fuentes (reproducción: `python scripts/run_pruebas.py`, ver `pruebas/resultados.md`).
- **Evidencia de medición:** 65 chunks en el índice actual (medición original: 57 chunks, 15 615 tokens consumidos en 14 consultas, promedio 1 115/consulta; detalle en `pruebas/medicion_chunks_tokens.txt`, reproducible con `python scripts/medir_chunks_tokens.py`).
- **Evidencia de pruebas operativas:** sanitarias 100 % OK (`pruebas/resultados_sanitarias.txt`); accidente laboral 9/9 con 10 281 tokens (`pruebas/resultados_accidente.md`); estrés REST 45/45, RAG secuencial 10/10 (10 461 tokens) y RAG paralelo 8/10 con semáforo implementado, 0 errores 500 (`pruebas/resultados_estres.txt`); análisis pregunta por pregunta y cruce multi-tabla resuelto (`pruebas/analisis_preguntas_estres_accidente.md`, `pruebas/analisis_pregunta_compleja.md`).
- **Evidencia de integración:** login (`admin@salmonera.com`), dashboard, 16 paneles con gráficos/tablas y 11 endpoints de módulos respondiendo HTTP 200; asistente respondiendo con `[Fuente: …]` dentro del dashboard.

### Comandos para reproducir (desde `README.md`)

```bash
PGPASSWORD=salmonera123 psql -h localhost -U salmonera -d salmonera_pm -f db/schema_modulos.sql
python scripts/generate_internal_docs.py     # BD → 10 reportes
python scripts/build_index.py                # → índice FAISS
python scripts/run_pruebas.py                # → 14/14 pruebas
python scripts/medir_chunks_tokens.py       # → 65 chunks, tokens por consulta
python scripts/prueba_accidente.py          # → 9/9 accidente laboral + tokens
node pruebas/sanitarias.cjs                 # → sanitarias (100 % OK)
node pruebas/estres.cjs                     # → estrés REST + RAG (SVR_PID=<pid>)
npm install && npm start                     # servidor http://localhost:4000
```

---

## Conclusiones y reflexiones individuales

> **Nota de la rúbrica:** conclusiones, justificaciones técnicas y reflexiones individuales deben redactarse **sin apoyo de IA**.

### Reflexión individual — Integrante 1
*[Redactar aquí, sin IA: qué aprendí sobre prompts, RAG, arquitectura y qué aporté al proyecto.]*

### Reflexión individual — Integrante 2
*[Redactar aquí, sin IA: qué aprendí sobre la integración LLM + recuperación y qué aporté al proyecto.]*

### Conclusión del equipo
*[Redactar aquí, sin IA: síntesis de hallazgos, limitaciones (límites de cuota, corpus simulado) y proyección (más fuentes, agentes autónomos, índices híbridos).]*

---

## G. Referencias (formato APA)

- Duoc UC. (s.f.). *Guía de uso educativo de inteligencia artificial*. https://bibliotecas.duoc.cl/ia
- Groq. (s.f.). *Groq documentation*. https://console.groq.com/docs
- Hugging Face. (s.f.). *sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2*. https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- Johnson, J., Douze, M., & Jégou, H. (2019). *Billion-scale similarity search with GPUs* (FAISS). https://github.com/facebookresearch/faiss
- LangChain. (s.f.). *Retrieval augmented generation*. https://www.langchain.com/
- Sernapesca. (s.f.). *Normativa para la acuicultura en Chile*. https://www.sernapesca.cl/