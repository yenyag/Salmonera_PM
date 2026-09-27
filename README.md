# SalmoSUR S.A. — Sistema de Gestión + Agente Funcional IA

**Salmonera SalmoSUR S.A.** es un caso de empresa simulada (acuicultura / producción de salmón chileno) que combina un **sistema de gestión web (dashboard)** con un **agente funcional de IA** (LangGraph) capaz de responder consultas operativas en lenguaje natural, consultar la base de datos, generar reportes organizacionales y recordar contexto entre conversaciones.

> **EP1** — RAG (recuperación + generación con fuentes). **EP2** — Agente funcional con herramientas (consulta, escritura, razonamiento), memoria y planificación.

---

## Índice

1. [¿Qué es este proyecto?](#qué-es-este-proyecto)
2. [¿A quién va dirigido?](#a-quién-va-dirigido)
3. [Problemas que resuelve en la industria](#problemas-que-resuelve-en-la-industria)
4. [¿Qué tan realista es?](#qué-tan-realista-es)
5. [Herramientas y stack](#herramientas-y-stack)
6. [Arquitectura](#arquitectura)
7. [Modelos de IA utilizados](#modelos-de-ia-utilizados)
8. [Estructura del repositorio](#estructura-del-repositorio)
9. [Instalación](#instalación)
10. [Uso](#uso)
11. [Endpoints de la API](#endpoints-de-la-api)
12. [Pruebas y evidencias](#pruebas-y-evidencias)
13. [Seguridad](#seguridad)
14. [Lo que está pensado (roadmap)](#lo-que-está-pensado-roadmap)
15. [Contexto de evaluación y ética de IA](#contexto-de-evaluación-y-ética-de-ia)

---

## ¿Qué es este proyecto?

Un sistema web de gestión para una salmonicultora que integra **nueve dimensiones operativas** (ventas, calidad, mortalidad, rentabilidad, RRHH, inventario, compras, exportaciones, lotes) más **incidentes de seguridad y sanidad**, extrayendo además nuevas dimensiones para el asistente (concesiones acuícolas, monitoreo sanitario/ambiental, alimentación de raciones y cartera de clientes).

Sobre esos datos se construye un **agente funcional** (LangGraph) que integra cuatro herramientas: `consultar_rag` (recuperación semántica), `consultar_bd` (consultas SQL exactas), `escribir_reporte` (generación de informes) y `guardar_recuerdo` (memoria persistente). Permite a un usuario no técnico hacer preguntas de negocio en lenguaje natural, incluso tareas de **múltiples etapas**:

- *"¿Qué lote tiene mayor mortalidad?"*
- *"¿Cuál fue la planilla mensual del centro Los Lagos?"*
- *"Suma las ventas del semestre y genera un reporte con recomendaciones."*
- *"¿Qué lote tiene el mayor promedio de caligus según el monitoreo?"*

Cada respuesta cita su **fuente** (tabla de la BD o documento normativo) y el chat muestra la **trazabilidad del agente** (qué herramientas usó), lo que da transparencia a la toma de decisiones del sistema.

---

## ¿A quién va dirigido?

| Perfil | Beneficio |
|--------|-----------|
| **Administradores y jefatura de operaciones** | Consultar indicadores operativos (ventas, mortalidad, biomasa, planilla) sin mover planillas ni esperar al equipo TI. |
| **Analistas de datos** | Punto único de consulta consolidada (BD + normativa) con citación de fuente. |
| **Equipos de sanidad y bioseguridad** | Monitoreo de caligus, temperatura y oxígeno por lote (con alertas visuales) y acceso a normativa Sernapesca. |
| **Área comercial** | Vista de exportaciones FOB por destino y cartera de clientes. |
| **Diseñadores/desarrolladores de soluciones IA** | Referencia didáctica de una implementación RAG completa, con pruebas de coherencia y limitaciones documentadas. |

---

## Problemas que resuelve en la industria

El caso de negocio (documentado en `caso/README.md`) parte de un problema real del sector de acuicultura chilena:

1. **Acceso lento a la información operativa.** Repetir consultas del tipo *"¿qué centro es más rentable?"* requiere navegar el dashboard, cruzar información de varias pantallas o escuchar al equipo de TI. Tiempo estimado por consulta: **15–30 min**. Con el asistente: **respuesta en < 1 minuto**.

2. **Insuficiente aprovechamiento de los datos.** La información existente (BD) no se explota porque el usuario no sabe dónde está ni cómo cruzar indicadores.

3. **Riesgo de decisiones sin sustento normativo.** Todo cultivo de salmónidos en Chile está regulado (Sernapesca): sanitario, bioseguridad, requisitos de exportación y seguridad laboral. Las respuestas del asistente integran esa normativa **real** como fuente externa.

4. **Poco control sanitario proactivo.** El monitoreo de **caligus (piojo de mar)** y **oxígeno disuelto** es crítico; el sistema lo vuelve visible en el dashboard (con umbrales de alerta: caligus > 3-4 exige tratamiento; O₂ < 6 mg/L es riesgo) además de responderlo por consulta.

5. **Dependencia del equipo técnico.** El RAG descentraliza la extracción de información hacia el usuario final, reduciendo el cuello de botella con TI/analista.

---

## ¿Qué tan realista es?

`docs/informe.md` y `docs/arquitectura.md` documentan el detalle. Resumen honesto:

### ✅ Lo que SÍ es realista

| Dimensión | Qué se hizo | Nivel de realismo |
|-----------|-------------|-------------------|
| **Modelo de negocio** | Empresa mediana (~150 empleados), 4 centros (Los Lagos, Quellón, Chiloé, Aysén), producción y exportación de salmón Atlántico/Coho. | Alto — estructuras típicas de la industria |
| **Mercado / precios** | Precios FOB chilenos plausibles por formato: Atlántico HG ~5.800–6.200 CLP/kg, Coho ~4.800–5.200 CLP/kg, filete ~9.700–10.200 CLP/kg. | Alto |
| **Señales contables** | Ventas = exportaciones FOB + ventas locales; total semestral **CLP 11.234.000.000**; exportaciones FOB total **CLP 10.548.900.000**. | Alto — cuadra la aritmética |
| **Producción** | Biomasa = unidades × peso promedio (consistencia al 1.000); FCR 1.20–1.35; mortalidad acumulada 5–14% (rango típico de industria). | Alto |
| **Sanidad** | Caligus 0–9 (umbrales Sernapesca), temperatura 10–14 °C, O₂ 5.5–9.5 mg/L; monitoreo mensual sur-verano (diciembre–marzo). | Alto |
| **Operaciones** | Concesiones acuícolas (superficie, jaulas, especies autorizadas, vigencia), alimentación por raciones, compras por rubro y proveedor. | Alto |
| **Normativa externa** | Documentos públicos reales: Sernapesca, bioseguridad, requisitos de exportación, mercado del salmón, protocolo de accidentes laborales. | Alto (fuentes reales) |
| **Proceso RAG** | Recuperación semántica (FAISS) + refuerzo por keywords de dominio + LLM con temperatura baja + citación de fuente + prueba anti-alucinación. | Alto — técnica de la industria |

### ⚙️ Validaciones automáticas de coherencia (18/18)

El pipeline (`scripts/run_pruebas.py`) comprueba que las respuestas coincidan con los datos esperados **al 100%** y que **citen la fuente**; también que el asistente **reconozca cuándo no tiene un dato** (p. ej. *"¿impuestos a la renta 2024?"* → responde que no tiene información, en vez de inventar). Resultado: **18/18 coherentes** (`pruebas/resultados.md`).

### 🚧 Límites actuales (lo que NO es realista todavía)

- **Los datos son simulados** (generados para demo), no cifras auditadas de una empresa real.
- **Autenticación simplificada**: login fijo (`admin@salmonera.com` / `admin123`) con sesión en `localStorage`; no hay roles ni JWT, ni integración con directorio corporativo.
- **Sin datos en tiempo real**: no hay sensores oceanográficos, telemetría de jaulas ni integración con ERP/SCM o APIs de Sernapesca.
- **El índice RAG se construye manualmente** (`build_index.py`); no hay refrescamiento automático al cambiar la BD.
- **Concurrencia limitada**: embeddings en local (GPU/CPU) con semáforo de máx. 2 consultas RAG simultáneas.
- **Sin serie histórica larga**: solo 6 meses (enero–junio 2025) con granularidad mensual.

Veredicto: **un "8/10"**: creíble como piloto para demostración y didáctica, con coherencia interna verificada; para producción real faltaría conectar datos auténticos y los ítems del [roadmap](#lo-que-está-pensado-roadmap).

---

## Herramientas y stack

| Capa | Tecnología | Rol |
|------|------------|-----|
| **Backend** | Node.js + Express | API REST (`server.js`) y semáforo de concurrencia RAG |
| **Base de datos** | PostgreSQL | 11 tablas + vistas, datos simulados coherentes |
| **Frontend** | HTML + Tailwind CSS + Chart.js | Dashboard con 6 vistas (pestañas) + chat flotante |
| **Embeddings** | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | Vectores multilingües (384 dims), 100% local |
| **Índice vectorial** | FAISS (`faiss-cpu`) | Búsqueda semántica `k=7` (+ refuerzo de keywords) |
| **LLM** | Groq API (`qwen/qwen3.8-27b`, alternativo `openai/gpt-oss-120b`) | Síntesis de respuestas, `temperature=0.1` |
| **RAG / Agente** | LangChain + **LangGraph** | Pipeline RAG → **agente ReAct** (herramientas + memoria + planificación) |
| **Pruebas** | Python + Node (CLI) | Coherencia, **decisión**, **memoria**, estrés, sanitarias y métricas de tokens |

> Los embeddings corren **en local** (Groq no ofrece embeddings), de modo que los datos no salen de la máquina para la vectorización.

---

## Arquitectura

```
        ┌────────────────────────────────────────────────────────────┐
        │                         Navegador                         │
        │  Login → Dashboard (6 pestañas) + Agente IA (chat)         │
        └───────────────┬───────────────────────────────┬────────────┘
                        │ REST /api/…                  │ POST /api/consultar
                ┌───────▼────────┐             ┌───────▼────────┐
                │   Express      │             │   Express      │
                │  (server.js)   │             │  (semáforo ≤2) │
                └───────┬────────┘             └───────┬────────┘
                        │ SQL (pg)                    │ Python (agente_salmosur.py)
                ┌───────▼────────┐             ┌───────▼────────┐
                │  PostgreSQL    │             │  Agente LangGraph│ → Groq (razona)
                │  salmonera_pm  │             │  · consultar_rag │ ──▶ FAISS
                └────────────────┘             │  · consultar_bd  │ ──▶ PostgreSQL
                                               │  · escribir_reporte │─▶ data/reportes
                                               │  · guardar_recuerdo │─▶ data/memoria
                                               │  · memoria LP/CP    │
                                               └──────────────────┘
                                               scripts/query_rag.py (herramienta RAG)
```

Flujo de una consulta:
1. El usuario pregunta en lenguaje natural; el backend ejecuta el agente LangGraph.
2. El agente **decide qué herramientas usar** (consulta semántica, SQL, escritura, memoria).
3. Racionaliza los resultados de varias herramientas (tareas multi-etapa) y responde **citando la fuente**.
4. El chat muestra la respuesta, las fuentes y la **trazabilidad** (herramientas ejecutadas).

---

## Modelos de IA utilizados

| Componente | Modelo / Tecnología | Proveedor | Notas |
|------------|---------------------|-----------|-------|
| LLM principal | `qwen/qwen3.8-27b` | Groq | `temperature=0.1`, `max_tokens=1500` |
| LLM alternativo | `openai/gpt-oss-120b` | Groq | cupo diario independiente (200k tokens/día) |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` | Local (Hugging Face) | 384 dims, optimizado español |
| Vector store | FAISS | Local | Corpus: **21 documentos (14 internos + 7 externos) → 101 chunks** |
| Agente | LangGraph | — | `create_react_agent` con 4 herramientas + checkpointer de memoria |
| RAG | LangChain | — | Splitters + retriever + prompt (herramienta del agente) |

---

## Estructura del repositorio

```
Salmonera_PM/
├── caso/README.md            # Caso organizacional (propuesta, objetivos)
├── db/
│   ├── schema.sql            # Esquema base + datos (ventas, calidad, mortalidad, rentabilidad, usuarios/perfil)
│   ├── schema_modulos.sql    # Módulos: RRHH, inventario, compras, exportaciones, lotes,
│   │                         #   incidentes, concesiones, monitoreo sanitario, alimentación, clientes
│   ├── perfil.sql            # Migración perfil: columnas de usuario (rol, cargo, centro, tema) + chat_historial
│   └── setup-postgres.sh
├── data/
│   ├── interna/              # 14 reportes generados desde la BD (una dimensión por archivo)
│   ├── externa/              # 7 documentos normativos reales (Sernapesca, exportación, bioseguridad, mercado, accidentes)
│   ├── faiss_index/          # Índice vectorial (generado, gitignored)
│   ├── reportes/             # Reportes generados por el agente (herramienta de escritura)
│   └── memoria/              # Recuerdos persistentes del agente por usuario
├── scripts/
│   ├── generate_internal_docs.py   # BD → documentos .txt internos
│   ├── build_index.py              # Construcción del índice FAISS
│   ├── query_rag.py                # Herramienta RAG del agente (consulta + fuentes)
│   ├── agente_salmosur.py          # AGENTE LangGraph (herramientas + memoria + razonamiento)
│   ├── run_pruebas.py              # Pruebas de coherencia
│   ├── prueba_decision.py          # Pruebas de decisión/planificación del agente (EP2)
│   ├── prueba_memoria.py           # Pruebas de memoria del agente (EP2)
│   ├── prueba_accidente.py         # Escenario accidente laboral
│   └── medir_chunks_tokens.py      # Métricas de chunks/tokens
├── pruebas/                   # preguntas.json, resultados.md y demás evidencias
├── docs/                      # arquitectura.md, informe.md, informe_ep2.md, prompts.md
├── public/
│   ├── index.html             # Login
│   ├── dashboard.html         # Panel con 6 pestañas + asistente IA
│   ├── perfil.html            # Mi perfil: ver/editar datos, tema, contraseña e historial IA
│   ├── css/tema.css           # Variante de tema claro (oscuro es el por defecto)
│   └── js/                    # api.js, charts.js, chat.js, perfil.js, theme.js
├── server.js                  # Backend Express (endpoints REST + /api/consultar + /api/reportes)
├── package.json               # npm start / npm run dev
└── .env.example               # Copiar a .env (GROQ_API_KEY, BD, PYTHON_BIN)
```

---

## Instalación

### 1. Base de datos PostgreSQL

```bash
# Crear usuario, BD y cargar esquemas (ver db/setup-postgres.sh)
sudo -u postgres createuser -P salmonera        # contraseña: salmonera123
sudo -u postgres createdb -O salmonera salmonera_pm
PGPASSWORD=salmonera123 psql -h localhost -U salmonera -d salmonera_pm -f db/schema.sql
PGPASSWORD=salmonera123 psql -h localhost -U salmonera -d salmonera_pm -f db/schema_modulos.sql
```

### 2. Backend Node.js

```bash
npm install
cp .env.example .env    # completar GROQ_API_KEY y PYTHON_BIN
npm start               # servidor en http://localhost:4000
```

### 3. Entorno Python (RAG)

```bash
uv pip install psycopg2-binary langchain-text-splitters langchain-community \
  langchain-huggingface langchain-groq langchain-classic faiss-cpu \
  sentence-transformers python-dotenv
```

La variable `PYTHON_BIN` de `.env` debe apuntar a este intérprete.

---

## Uso

```bash
# Regenerar documentos internos desde la BD (opcional)
python scripts/generate_internal_docs.py

# Reconstruir el índice FAISS tras cambiar/añadir documentos
python scripts/build_index.py

# Consulta RAG por consola
python scripts/query_rag.py "¿Qué lote tiene mayor mortalidad?"

# Agente funcional por consola (con herramientas, memoria y razonamiento)
python scripts/agente_salmosur.py "Analiza el lote con mayor mortalidad y genera un reporte" --usuario admin@salmonera.com --json
python scripts/agente_salmosur.py "Recuerda que el presupuesto de sanidad 2026 es 120 millones" --usuario admin@salmonera.com --json
python scripts/agente_salmosur.py "¿Cuál es el presupuesto de sanidad que te dejé guardado?" --usuario admin@salmonera.com --json

# Pruebas de coherencia, decisión y memoria
python scripts/run_pruebas.py
python scripts/prueba_decision.py
python scripts/prueba_memoria.py
node  pruebas/sanitarias.cjs
```

Variables de entorno del agente (opcionales, con su valor por defecto):

| Variable | Defecto | Descripción |
|----------|---------|-------------|
| `GROQ_MODEL` | `qwen/qwen3.8-27b` | Modelo LLM usado por el agente (Groq) |
| `AGENTE_PACING` | `2.5` | Sleep (seg) antes de cada llamada LLM para no romper el TPM del tier gratuito |
| `GROQ_MAX_RETRIES` | `5` | Reintentos con backoff ante HTTP 429 (rate limit) |
| `AGENTE_MAX_TOKENS` | `1400` | Límite de tokens de salida por respuesta |
| `RAG_DEVICE` | `cpu` | Dispositivo de embeddings (`cpu`/`cuda`); `cpu` evita OOM con la GPU compartida |

**Sistema web**: abrir `http://localhost:4000` → credenciales `admin@salmonera.com` / `admin123`. En el dashboard usar las 6 pestañas (Estado de la Empresa, Producción y Lotes, RRHH, Suministros, Comercial y Clientes, Seguridad y Sanidad) y el botón flotante para consultar al asistente. En **"Mi perfil"** (botón del encabezado) se puede ver/editar la información personal, cambiar el tema claro/oscuro, cambiar la contraseña y revisar el historial de consultas al asistente.

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/login` | Autenticación |
| GET | `/api/ventas` | Ventas mensuales (CLP) |
| GET | `/api/calidad` | Cosechas por calidad |
| GET | `/api/mortalidad` | Mortalidad acumulada por lote |
| GET | `/api/rentabilidad` | Ingresos por centro |
| GET | `/api/empleados` · `/api/empleados/planilla` | Dotación y planilla |
| GET | `/api/inventario` · `/api/inventario/bajo` | Inventario por categoría y stock bajo |
| GET | `/api/compras` | Gasto por proveedor |
| GET | `/api/exportaciones` · `/api/exportaciones/mensual` | Destino FOB y resumen mensual |
| GET | `/api/lotes` · `/api/lotes/biomasa` | Lotes y biomasa por centro |
| GET | `/api/incidentes` · `/api/incidentes/severidad` | Incidentes por tipo y severidad |
| GET | `/api/concesiones` | Concesiones acuícolas |
| GET | `/api/monitoreo` · `/api/monitoreo/promedio` | Monitoreo sanitario mensual / promedio |
| GET | `/api/alimentacion` | Alimentación (raciones) por lote |
| GET | `/api/clientes` | Cartera de clientes |
| GET | `/api/perfil/:email` | Datos de perfil del usuario |
| PUT | `/api/perfil/:email` | Actualizar perfil (nombre, cargo, centro, tema) |
| POST | `/api/perfil/clave` | Cambiar contraseña (valida la actual) |
| GET | `/api/perfil/:email/consultas` | Historial de consultas al asistente |
| DELETE | `/api/perfil/:email/consultas` | Limpiar historial de consultas |
| POST | `/api/consultar` | Agente IA `{ pregunta, email }` → `{ respuesta, fuentes, acciones }` (registra historial) |
| GET | `/api/reportes` | Lista los reportes generados por el agente (herramienta de escritura) |
| GET | `/api/reportes/:nombre` | Descarga el contenido Markdown de un reporte |

---

## Pruebas y evidencias

| Evidencia | Archivo | Resultado |
|-----------|---------|-----------|
| Coherencia de respuestas | `pruebas/resultados.md` | **18/18** coherentes, citando fuentes |
| Escenario accidente laboral | `pruebas/resultados_accidente.md` | **9/9** coherentes (incluye anti-alucinación) |
| **Decisión/planificación del agente** | `pruebas/resultados_decision.md` | Tareas multi-etapa, selección de herramienta, escritura de reporte (EP2) |
| **Memoria del agente** | `pruebas/resultados_memoria.md` | Recuerdos persistentes y continuidad por historial (EP2) |
| Salud del sistema (HTTP+BD+FAISS) | `pruebas/resultados_sanitarias.txt` | **100% OK** |
| Estrés REST + RAG (concurrencia) | `pruebas/resultados_estres.txt` | Sin HTTP 500 (semáforo ≤2 subprocesos) |
| Métricas de chunks y tokens | `pruebas/medicion_chunks_tokens.txt` | Corpus 21 docs / 101 chunks |

> **Hallazgo corregido:** con consultas RAG simultáneas, la VRAM (RTX 3050) se agotaba → HTTP 500. Se agregó un **semáforo de concurrencia** en `/api/consultar`; ahora 10 consultas paralelas completan sin errores 500. Se mantiene para las consultas del agente.

---

## Seguridad

- La API key de Groq vive **solo** en `.env` (gitignored). Nunca se sube al repositorio.
- `node_modules/` y `data/faiss_index/` ignorados.
- Los datos de la BD son **simulados** (demostración), no cifras reales de empresa.
- La vectorización se hace en local: los datos no salen de la máquina hacia el proveedor de embeddings.

---

## Lo que está pensado (roadmap)

Priorizado según valor para el caso:

1. **Integración de datos reales**: conectar la BD con un ERP/SCM y datos de sensores (oceanografía, telemetría de jaulas) para alimentar el dashboard en tiempo real.
2. **Autenticación robusta**: roles (admin, sanidad, comercial, RRHH), sesiones seguras (JWT/SSO) y auditoría de accesos.
3. **Refrescamiento automático del índice RAG** al modificar la BD (trigger/CRON) y limpieza incremental de documentos.
4. **Alertas proactivas**: notificaciones cuando caligus supere el umbral, O₂ < 6 mg/L, stock bajo o incidentes críticos (pendiente en dashboard).
5. **Agente multi-herramientas avanzado**: memoria semántica vectorial del historial (embedding de interacciones), agentes especializados por módulo (sanidad, comercial, RRHH) y mecanismo de reflexión/verificación de respuestas.
6. **Más dimensiones**: presupuestos, costos de cosecha desglosados, clima/estacionalidad, huella de carbono (exigencia creciente de sostenibilidad en la acuicultura chilena).
7. **Escalamiento**: embeddings en servicio manejado y caché, worker persistente del agente (evitar recargar el modelo por consulta).
8. **Cumplimiento legal**: ley 19.628 (datos personales), cifrado en reposo y HTTPS.

---

## Contexto de evaluación y ética de IA

- Proyecto académico (EP1 + EP2 — ISY0101) sobre un caso de empresa **simulada**.
- El uso de herramientas de IA está declarado en el repositorio; las justificaciones técnicas se sustentan en `docs/prompts.md`, `docs/arquitectura.md` e `docs/informe_ep2.md`.
- El diseño prioriza **no alucinar**: respuestas solo desde el contexto/herramientas, con citación de fuente y prueba explícita anti-alucinación; el agente decide cuándo no tiene información suficiente.