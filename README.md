# Salmonera SalmoSUR S.A. - Sistema de Gestión + Asistente RAG

Sistema de gestión (dashboard) de una empresa salmonera chilena integrado con un
**asistente RAG** que responde consultas operativas en lenguaje natural, con base
en los datos de la base de datos y documentos normativos del sector.

**Evaluación Parcial 1 - ISY0101 Ingeniería de Soluciones con IA**

---

## Estructura del repositorio

```
Salmonera_PM/
├── caso/README.md            # Documento de caso organizacional (propuesta)
├── db/
│   ├── schema.sql            # Esquema base + datos de prueba PostgreSQL
│   ├── schema_modulos.sql    # Módulos ampliados (RRHH, inventario, compras, exportaciones, lotes, incidentes)
│   └── setup-postgres.sh     # Script de instalación de la BD
├── data/
│   ├── interna/              # Reportes generados desde la BD (10 dimensiones operativas)
│   ├── externa/              # Documentos normativos (6 documentos: Sernapesca, exportación, bioseguridad, mercado, ley laboral/accidentes, contingencias)
│   └── faiss_index/          # Índice vectorial FAISS (generado con 16 docs → 65 chunks)
├── scripts/
│   ├── generate_internal_docs.py   # FASE 2: BD -> documentos de texto
│   ├── build_index.py              # FASE 2: construye el índice FAISS
│   ├── query_rag.py                # FASE 3: pipeline RAG (consulta + fuentes)
│   └── run_pruebas.py              # FASE 6: pruebas de coherencia (IE4)
├── pruebas/
│   ├── preguntas.json        # 14 preguntas de prueba
│   └── resultados.md         # Evidencias de coherencia (14/14)
├── docs/
│   ├── arquitectura.md       # Diagramas y justificación de componentes
│   └── prompts.md            # Justificación de prompts (IE2)
├── public/
│   ├── index.html            # Login
│   ├── dashboard.html        # Panel (gráficos + tablas) + Asistente IA
│   └── js/                   # api.js, charts.js, chat.js
├── server.js                 # Backend Express (19 endpoints REST + /api/consultar)
└── .env.example              # Variables de entorno (copiar a .env)
```

---

## Requisitos

| Componente | Versión | Nota |
|------------|---------|------|
| Node.js | >= 20 | Para el backend Express |
| PostgreSQL | >= 14 | BD `salmonera_pm` |
| Python | 3.13 | Entorno con dependencias RAG (`langchain`, `faiss`, `sentence-transformers`) |
| API key Groq | gratuita | https://console.groq.com |

> Los embeddings se ejecutan **en local** (Groq no ofrece embeddings). El modelo
> `paraphrase-multilingual-MiniLM-L12-v2` descarga ~470 MB la primera vez.

---

## Modelos de IA Utilizados

| Componente | Modelo / Tecnología | Proveedor | Descripción |
|------------|---------------------|-----------|-------------|
| **LLM Principal (Razonamiento / RAG)** | `openai/gpt-oss-120b` | Groq Cloud API | Modelo de lenguaje de alta capacidad para la síntesis de respuestas operativas (`temperature=0.1`, `max_tokens=1500`). |
| **LLM Rápido (Alternativo)** | `openai/gpt-oss-20b` | Groq Cloud API | Modelo secundario de alta velocidad (`GROQ_MODEL_FAST`). |
| **Embeddings Vectoriales** | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | Local (Hugging Face / PyTorch) | Generación de embeddings multilingües (384 dimensiones) optimizados para español. |
| **Búsqueda Vectorial (Vector Store)** | FAISS (`faiss-cpu`) | Local | Motor de búsqueda semántica ($k=5$), indexando 16 documentos (10 internos + 6 externos) → 65 chunks. |

---

## Instalación

### 1. Base de datos PostgreSQL

```bash
# Crear usuario, BD y cargar esquema (detalles en db/setup-postgres.sh)
sudo -u postgres createuser -P salmonera        # contraseña: salmonera123
sudo -u postgres createdb -O salmonera salmonera_pm
cp db/schema.sql /tmp/schema.sql
sudo -u postgres psql -d salmonera_pm -f /tmp/schema.sql

# Módulos ampliados (RRHH, inventario, compras, exportaciones, lotes, incidentes)
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
# Con uv (gestor del curso) o clonando el entorno:
uv pip install psycopg2-binary
uv pip install langchain-text-splitters langchain-community langchain-huggingface \
             langchain-groq langchain-classic faiss-cpu sentence-transformers python-dotenv
```

La variable `PYTHON_BIN` en `.env` debe apuntar al intérprete con estas dependencias.

---

## Uso

### 1. Generar documentos internos desde la BD (opcional, ya existen en data/interna/)

```bash
python scripts/generate_internal_docs.py
```

### 2. Construir el índice FAISS (tras cambiar o añadir documentos)

```bash
python scripts/build_index.py
```

### 3. Probar el RAG por consola

```bash
python scripts/query_rag.py "¿Qué lote tiene mayor mortalidad?"
python scripts/query_rag.py "¿Qué lote tiene mayor mortalidad y qué recomiendas?"  --json
```

### 4. Ejecutar pruebas de coherencia (IE4)

```bash
python scripts/run_pruebas.py    # genera pruebas/resultados.md
```

### 4b. Medición de chunks y tokens, y pruebas operativas

```bash
python scripts/medir_chunks_tokens.py    # 65 chunks + tokens por consulta → pruebas/medicion_chunks_tokens.txt
python scripts/prueba_accidente.py       # escenario de accidente laboral (9/9) → pruebas/resultados_accidente.md
node pruebas/sanitarias.cjs              # salud del sistema (HTTP + BD + FAISS) → pruebas/resultados_sanitarias.txt
node pruebas/estres.cjs                  # estrés REST + RAG (medir SVR_PID=$$ para memoria) → pruebas/resultados_estres.txt
```

- **Índice FAISS reconstruido:** 16 documentos (10 reportes internos BD + 6 normativos externos) → **65 chunks** (antes 57/15).
- **Pruebas sanitarias (`sanitarias.cjs`):** Validado a 65 chunks → **100% OK** (HTTP, BD y FAISS).
- **Escenario Accidente (`preguntas_accidente.json` / `prueba_accidente.py`):** **9/9 preguntas coherentes** (10 281 tokens). A4/A5 pasaron de `sin_dato` a `dato_externo` (al integrarse la normativa); se agregó A9 como nuevo caso `sin_dato` (accidentes fatales 2024) para conservar la prueba anti-alucinación.
- **Resultados:** Accidente 9/9 (10 281 tokens), preguntas base 14/14 sin regresión, pregunta compleja resuelta (2 153 tokens), API verificado en vivo.

> **Hallazgo del estrés (corregido):** con consultas RAG simultáneas, cada subproceso Python carga el modelo de
> embeddings en la GPU (RTX 3050, 4 GiB) y la VRAM se agotaba → HTTP 500. Se implementó un **semáforo
> de concurrencia** (máx. 2 subprocesos simultáneos) en `/api/consultar` (`server.js`): ahora 10
> consultas paralelas completan 8/10 OK sin errores 500 (2 timeout de cola, no fallo del servidor).

### 5. Usar el sistema web

```bash
# 1. Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# 2. Iniciar el servidor backend (Express + Node.js)
npm start
# El servidor arranca en http://localhost:4000 (semáforo RAG: máx. 2 consultas simultáneas)

# 3. Abrir en el navegador
# http://localhost:4000

# 4. Credenciales de acceso
#    Correo:    admin@salmonera.com
#    Password:  admin123
```

Una vez dentro del dashboard, usar el botón flotante **"Consultar al Asistente IA"** para preguntar en lenguaje natural sobre ventas, mortalidad, planilla, inventario, compras, exportaciones, lotes e incidentes.

---

## Observabilidad con LangSmith

El proyecto está integrado con [LangSmith](https://smith.langchain.com/) para monitorear y analizar las trazas del pipeline RAG. Cada consulta al asistente genera una traza completa que incluye:

- **Retrieval:** qué chunks recuperó FAISS y su score de similitud.
- **Generación:** tokens de entrada/salida, latencia y la respuesta completa.
- **Cadena completa:** desde la pregunta del usuario hasta la respuesta final.

### Configuración

1. Crear una API key en https://smith.langchain.com/settings (tipo Personal Access Token).
2. Copiar las variables de LangSmith a `.env`:
   ```
   LANGCHAIN_TRACING_V2="true"
   LANGSMITH_ENDPOINT="https://api.smith.langchain.com"
   LANGSMITH_API_KEY="lsv2_pt_tu_api_key"
   LANGSMITH_PROJECT="SalmoSUR-EP1"
   ```
3. Verificar la conexión:
   ```bash
   python -c "from langsmith import Client; c=Client(); print('OK:', c.read_project(project_name='SalmoSUR-EP1').name)"
   ```

### Visualizar trazas

Abrir https://smith.langchain.com/ → proyecto **SalmoSUR-EP1** para ver:
- Historial de consultas con timestamps.
- Detalle de cada traza (chunks recuperados, tokens, latencia).
- Comparación entre consultas para optimizar el pipeline.

---

## Endpoints de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/login` | Autenticación de usuario |
| GET | `/api/ventas` | Ventas mensuales (CLP) |
| GET | `/api/calidad` | Distribución de cosechas por calidad |
| GET | `/api/mortalidad` | Mortalidad acumulada por lote |
| GET | `/api/rentabilidad` | Ingresos por centro |
| GET | `/api/empleados` · `/api/empleados/planilla` | Dotación y planilla (RRHH) |
| GET | `/api/inventario` · `/api/inventario/bajo` | Valor por categoría y alertas de stock |
| GET | `/api/compras` | Gasto por proveedor |
| GET | `/api/exportaciones` · `/api/exportaciones/mensual` | Destino FOB y resumen mensual |
| GET | `/api/lotes` · `/api/lotes/biomasa` | Lotes detallados y biomasa por centro |
| GET | `/api/incidentes` · `/api/incidentes/severidad` | Incidentes por tipo y severidad |
| POST | `/api/consultar` | Asistente RAG `{ pregunta }` |

---

## Descripción de los módulos (indicadores de logro)

| Módulo | Archivo | Indicador |
|--------|---------|-----------|
| Caso organizacional | `caso/README.md` | IE1 |
| Justificación de prompts | `docs/prompts.md` | IE2 |
| Generación de documentos (BD→texto) | `scripts/generate_internal_docs.py` | IE3 |
| Índice vectorial FAISS | `scripts/build_index.py` | IE3 |
| Pipeline RAG + citación | `scripts/query_rag.py` | IE3, IE4 |
| Pruebas de coherencia | `scripts/run_pruebas.py` + `pruebas/` | IE4 |
| Medición de chunks/tokens | `scripts/medir_chunks_tokens.py` + `pruebas/medicion_chunks_tokens.txt` | IE3, IE7 |
| Pruebas operativas (sanidad, estrés, accidente) | `pruebas/sanitarias.cjs`, `pruebas/estres.cjs`, `scripts/prueba_accidente.py` | IE3, IE4, IE9 |
| Arquitectura y diagramas | `docs/arquitectura.md` | IE5, IE6 |
| Integración backend/frontend | `server.js`, `public/` | IE5, IE6 |

---

## Seguridad

- La API key de Groq vive **solo** en `.env` (ignorado por `.gitignore`). Nunca se sube al repositorio.
- `node_modules/` y `data/faiss_index/` están en `.gitignore`.
- Los datos de la BD son **simulados** (demostración), no cifras reales de empresa.