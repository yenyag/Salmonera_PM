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
│   ├── externa/              # Documentos normativos (Sernapesca, exportación, bioseguridad, mercado)
│   └── faiss_index/          # Índice vectorial FAISS (generado)
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

### 5. Usar el sistema web

1. `npm start`
2. Abrir http://localhost:4000
3. Ingresar con `admin@salmonera.com` / `admin123`
4. En el dashboard, usar el **Asistente IA** (botón flotante) para consultar en
   lenguaje natural sobre ventas, mortalidad, planilla, inventario, compras,
   exportaciones, lotes e incidentes.

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
| Arquitectura y diagramas | `docs/arquitectura.md` | IE5, IE6 |
| Integración backend/frontend | `server.js`, `public/` | IE5, IE6 |

---

## Seguridad

- La API key de Groq vive **solo** en `.env` (ignorado por `.gitignore`). Nunca se sube al repositorio.
- `node_modules/` y `data/faiss_index/` están en `.gitignore`.
- Los datos de la BD son **simulados** (demostración), no cifras reales de empresa.