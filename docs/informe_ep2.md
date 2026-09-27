# Informe Técnico — Agente Funcional SalmoSUR S.A.

**Evaluación Parcial N°2 · Desarrollo de un Agente Funcional**

| Dato | Valor |
|------|-------|
| **Sigla** | ISY0101 |
| **Asignatura** | Optativo Ingeniería de Soluciones con IA |
| **Institución** | Duoc UC |
| **Ponderación** | 35 % (2 semanas · en parejas) |
| **Integrante 1** | *[Nombre — sección] — completar* |
| **Integrante 2** | *[Nombre — sección] — completar* |
| **Fecha** | Septiembre 2026 |
| **Repositorio** | https://github.com/yenyag/Salmonera_PM · rama `ep2-agente` |

---

## Declaración de uso de IA (obligatoria)

Este proyecto utilizó herramientas de IA como **apoyo en redacción, revisión de código y
generación de diagramas** (asistentes de código y de texto). **Las decisiones técnicas, la
orquestación del agente, los análisis y las conclusiones fueron elaborados y validados por el
equipo**, y las reflexiones individuales fueron redactadas **sin apoyo de IA**. Todo contenido
generado con IA fue revisado y contrastado con la documentación del curso.
(`https://bibliotecas.duoc.cl/ia`)

---

## A. Diseño e implementación del agente (IE1, IE2)

**Objetivo.** Dotar al asistente de SalmoSUR S.A. (empresa simulada de acuicultura chilena,
EP1: RAG) de la capacidad de **ejecutar tareas con autonomía** integrando herramientas de
*consulta*, *escritura* y *razonamiento* sobre el contexto organizacional (PostgreSQL +
normativa del sector).

**Framework.** El agente se implementa con **LangGraph** (`create_react_agent`), framework de
grafos de estados sobre LangChain que permite orquestar un ciclo **ReAct** (razonamiento →
acción → observación). Se eligió LangGraph por su **escalabilidad** (permite migrar de un
agente simple a grafos personalizados con nodos, enrutamiento y control explícito) y su
**compatibilidad** con el stack ya existente (FAISS, Groq, LangChain), sin introducir un nuevo
proveedor ni cambiar la infraestructura.

**Herramientas registradas** (`scripts/agente_salmosur.py`, decorador `@tool`):

| Herramienta | Tipo | Función | Fuente |
|-------------|------|---------|--------|
| `consultar_rag` | Consulta | Recuperación semántica (FAISS, k=5 + keywords de dominio) y síntesis con citación de fuente | data/interna + data/externa (101 chunks) |
| `consultar_bd` | Consulta | Consulta SQL de **solo lectura** sobre 18 vistas PostgreSQL (cifras verificables) | PostgreSQL salmonera_pm |
| `escribir_reporte` | Escritura | Genera informe Markdown en `data/reportes/` y devuelve su ruta (auto-indexable y descargable) | `data/reportes/` |
| `guardar_recuerdo` | Memoria | Persiste un dato (clave=valor) en `data/memoria/*.json` para reutilizarlo en futuras conversaciones | `data/memoria/` |

El razonamiento lo ejecuta el **experto LLM** (`qwen/qwen3.8-27b` de Groq,
`temperature=0.1`), que analiza la pregunta, decide qué herramientas invocar,
procesa sus resultados y compone la respuesta final. Para operar dentro del cupo del
**tier gratuito de Groq (TPD ≈ 200k tokens/día por modelo)**, se incorporó *pacing*
(sleep configurable `AGENTE_PACING`) antes de cada llamada y **reintentos con backoff**
ante HTTP 429 (`GROQ_MAX_RETRIES`), de modo que un agente que encadena varias
llamadas de herramientas no rompe el límite de tokens por minuto (las baterías de
pruebas lo demuestran de forma reproducible). Los embeddings funcionan 100 % en local
y usan CPU por defecto (`RAG_DEVICE=cpu`) para no competir por la VRAM de la tarjeta
compartida; el índice FAISS se conserva en `data/faiss_index`.

> **Nota de ingeniería:** el modelo principal `qwen/qwen3.8-27b` tiene su propio
> cupo diario de 200k tokens (TPD) independiente del `openai/gpt-oss-120b`
> (usado en la fase de desarrollo y validación inicial). Ambos modelos pueden
> alternarse según disponibilidad de cupo; la arquitectura no cambia.

**Integración.** `/api/consultar` (Express) invoca al agente en un subproceso Python con
semáforo de concurrencia (máx. 2), conserva el registro en `chat_historial` y devuelve
`{ respuesta, fuentes, acciones }`, donde `acciones` es la **trazabilidad** de las herramientas
que el agente ejecutó (visible en el chat del dashboard).

---

## B. Configuración de memoria y recuperación de contexto (IE3, IE4)

Para asegurar **continuidad en flujos prolongados**, el agente combina dos niveles de memoria:

1. **Memoria a corto plazo.** `InMemorySaver` (checkpointer de LangGraph) mantiene el **hilo de
   conversación** por sesión: dentro de una tarea multi-paso el agente recuerda sus propias
   acciones intermedias mientras planifica.
2. **Memoria a largo plazo.**
   - **Historial persistido** en PostgreSQL (`chat_historial`): al inicio de cada invocación se
     inyectan al prompt las últimas **6 interacciones del usuario**, de modo que una consulta
     posterior puede retomar el tema de una anterior (continuidad real entre llamadas, dado que
     cada consulta corre en un subproceso nuevo).
   - **Recuerdos explícitos** (`guardar_recuerdo` → `data/memoria/<usuario>.json`): el agente
     guarda datos que el usuario le pide recordar y los re-inyecta como *memoria persistente*.

**Recuperación de contexto semántico (IE4).** Se conserva la recuperación vectorial del EP1:
embeddings locales multilingües (`paraphrase-multilingual-MiniLM-L12-v2`, 384 dims, 100 % local)
sobre FAISS (21 documentos → **101 chunks**), con **recuperación ampliada por keywords de
dominio** para preguntas de módulos específicos (planilla, inventario, proveedores,
exportaciones, FCR, caligus, …), preservando la prueba anti-alucinación.

**Evidencia:** `scripts/prueba_memoria.py` valida (M1) que un recuerdo guardado en una
invocación se recupera en una invocación **nueva** (subproceso distinto) y (M2) que la consulta
retoma el contexto de una consulta previa (por ejemplo, "…el lote con la *segunda* mayor
mortalidad" usa la referencia al primero); resultado en `pruebas/resultados_memoria.md`.
Observación de diseño: cuando el historial ya contiene la respuesta, el agente **puede**
responder desde la memoria sin invocar herramientas (continuidad real, no alucinación);
por eso las pruebas de herramienta se ejecutan con un usuario nuevo.

---

## C. Planificación y toma de decisiones (IE5, IE6)

El agente **planifica explícitamente** tareas de múltiples etapas y **adapta su
comportamiento** según la condición de cada consulta. El ciclo de decisión es:

```
analiza la pregunta → decide herramienta(s) → ejecuta → razona resultados → responde citando
```

**Ejemplos de toma de decisiones demostrables** (`scripts/prueba_decision.py`):

- **Tarea de múltiples etapas (D1):** *"Analiza el lote con mayor mortalidad, consulta cuánto
  alimento se entregó al lote A1 en mayo de 2025 y genera un reporte con recomendaciones."* El
  agente ejecuta `consultar_rag` (mortalidad), vuelve a consultar (alimentación) y finalmente
  `escribir_reporte` generando el archivo de reporte. Se evidencia la **secuenciación** de
  etapas según prioridad (dato → cruce → documento).
- **Selección de herramienta (D2):** una pregunta de cálculo exacto ("suma las ventas del
  semestre") deriva a `consultar_bd` (SQL), mientras una pregunta de negocio/normativa (D4)
  deriva a `consultar_rag`. El agente **elige la herramienta según la condición** de la tarea.
- **Condiciones cambiantes / anti-alucinación (D3):** ante un dato inexistente, el agente
  responde *"No tengo información suficiente para responder eso"* en lugar de inventar; y ante
  un pedido de documento, cambia su salida hacia **escritura** (no solo texto).
- **Ajuste por contexto (memoria):** si el usuario entrega una preferencia previa, el agente la
  usa en decisiones posteriores (ver sección B).

Se generó como evidencia el reporte de decisión en `pruebas/resultados_decision.md` y los
archivos de reporte producidos por el agente se archivan en `pruebas/evidencia_ep2/` (5 reportes
generados durante las pruebas).

---

## D. Documentación técnica: README y diagrama de orquestación (IE7, IE8)

**README** (`README.md`): instrucciones precisas de instalación y ejecución (PostgreSQL,
backend Node, entorno Python), credenciales del dashboard, comandos para reconstruir el índice
y ejecutar el agente por consola, y la lista de endpoints.

**Diagrama de orquestación de componentes** (`docs/arquitectura.md`): grafo Mermaid que muestra
el flujo usuario → `/api/consultar` → agente LangGraph → (herramientas `consultar_rag`,
`consultar_bd`, `escribir_reporte`, `guardar_recuerdo`) con sus fuentes (FAISS, PostgreSQL,
`data/reportes`, `data/memoria`) y la memoria de corto/largo plazo.

**Justificación de componentes clave (IE8):**

| Componente | Alternativas | Justificación (alineada al flujo de trabajo) |
|------------|--------------|----------------------------------------------|
| **LangGraph** | Agentes haystack, Autogen, RAG lineal | Un solo framework que añade **ítem de escritura, memoria y planificación** con compatibilidad total con el RAG existente; costo incremental bajo y trazabilidad por nodos |
| **FAISS local (k=5 + keywords)** | Embeddings de pago, k=7 fijo | Privacidad, costo cero y recuperación consolidada del EP1; no cambia el flujo del usuario |
| **SQL a vistas** | Contexto solo textual | Da **autonomía** para cruces exactos y escalabilidad a nuevas vistas sin regenerar documentos |
| **`data/reportes/` + `/api/reportes`** | Reportes solo en memoria | Respeta el flujo organizacional: el analista recibe un documento persistente descargable |
| **Memoria PG + JSON / checkpointer** | Memoria solo en sesión | Garantiza continuidad **entre** consultas (subprocesos independientes) y persistencia real de contexto |

---

## E. Redacción técnica (IE10)

Este informe describe los componentes con lenguaje técnico preciso (grafo ReAct, herramientas
registradas como JSON-schema, checkpointer, recuperación vectorial, semáforo de concurrencia) y
**argumenta cada decisión con evidencia** concreta: scripts reproducibles
(`prueba_decision.py`, `prueba_memoria.py`, `sanitarias.cjs`), rutas de fuentes y resultados
guardados en `pruebas/`. Las cifras de coherencia y consumo de tokens del EP1 se conservan como
línea base en `docs/informe.md`.

---

## F. Diagramas y ejemplos de flujos de trabajo (IE9)

- Diagrama de orquestación y flujo de datos completos en `docs/arquitectura.md` (Mermaid).
- Flujo de una tarea de **escritura** (reporte) descrito textualmente en la sección A/C y
  demostrado por `prueba_decision.py` (D1).
- Los reportes generados por el agente durante las pruebas quedan disponibles vía
  `GET /api/reportes`.

---

## G. Referencias (formato APA) (IE9)

- Duoc UC. (s.f.). *Guía de uso educativo de inteligencia artificial*. https://bibliotecas.duoc.cl/ia
- Groq. (s.f.). *Groq documentation*. https://console.groq.com/docs
- Hugging Face. (s.f.). *sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2*. https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- Johnson, J., Douze, M., & Jégou, H. (2019). *Billion-scale similarity search with GPUs* (FAISS). https://github.com/facebookresearch/faiss
- LangChain. (s.f.). *LangGraph — Low-level orchestration of agent and multi-agent applications*. https://www.langchain.com/
- LangChain. (s.f.). *Agents with tools (create_react_agent)*. https://python.langchain.com/
- Sernapesca. (s.f.). *Normativa para la acuicultura en Chile*. https://www.sernapesca.cl/

---

## Conclusiones y reflexiones individuales

> **Nota de la rúbrica:** conclusiones, justificaciones técnicas y reflexiones individuales deben
> redactarse **sin apoyo de IA**.

### Reflexión individual — Integrante 1
*[Redactar aquí, sin IA: qué aprendí sobre orquestación de agentes, herramientas, memoria y qué
aporté al proyecto.]*

### Reflexión individual — Integrante 2
*[Redactar aquí, sin IA: qué aprendí sobre planificación/toma de decisiones del agente y sobre la
integración con el sistema web/dashboard.]*

### Conclusión del equipo
*[Redactar aquí, sin IA: síntesis de hallazgos, limitaciones (cuota de tokens, corpus simulado) y
proyección (agentes especializados por módulo, memoria vectorial del historial, guardrails).]*