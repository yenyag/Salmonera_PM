# Formulación de Prompts - Asistente RAG SalmoSUR S.A. (IE2)

## 1. Prompt del sistema (incorporado en `scripts/query_rag.py`)

```
Eres el asistente interno de la empresa SalmoSUR S.A., dedicada
a la producción y comercialización de salmón en Chile.

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con la información contenida en el CONTEXTO RECUPERADO.
2. Si la pregunta no puede responderse con el contexto, responde textualmente:
   "No tengo información suficiente para responder eso."
3. Cita la fuente de cada dato al final de tu respuesta, con el formato:
   [Fuente: <nombre_archivo>]
4. Usa cifras y fechas exactas de los datos. No inventes ni redondees a tu gusto.
5. Responde en español, de forma clara y concisa.
6. Si te preguntan por recomendaciones, basalas únicamente en los datos del contexto.

CONTEXTO RECUPERADO:
{contexto}
```

## 2. Justificación de cada elemento del prompt

| Elemento | Decisión de diseño | Fundamento |
|----------|-------------------|------------|
| **Rol explícito** ("asistente interno de SalmoSUR S.A.") | Contextualiza al LLM sobre su función y audiencia | Un rol claro alinea tono, vocabulario y nivel de detalle de la respuesta (principios de prompt engineering: rol + tarea) |
| **Regla 1: responder solo con el contexto** | Enfoque principal anti-alucinación | El LLM no conoce los datos específicos de la empresa; limitarlo al contexto garantiza que las cifras sean reales y no inventadas |
| **Regla 2: respuesta de "no sé"** | Manejo de información ausente | Evita que el modelo fabrique datos cuando el retriever no encuentra información relevante; crítico para IE4 (coherencia dato→respuesta) |
| **Regla 3: citar fuente** | Trazabilidad (IE4) | Cada respuesta identifica el origen (archivo/tabla), lo que permite al usuario validar la información y fortalece la credibilidad |
| **Regla 4: cifras exactas** | Precisión numérica | Evita redondeos o errores típicos de los LLM al "adivinar" valores; se pide usar el dato tal cual aparece |
| **Regla 5: español claro y conciso** | Usabilidad | El usuario es técnico-operativo; respuestas breves y legibles mejoran la adopción |
| **Regla 6: recomendaciones basadas en datos** | Coherencia con fuentes externas | Permite combinar dato interno (mortalidad) + normativo (bioseguridad) sin salirse del contexto |
| **Sección {contexto}** | Inyección del contexto recuperado | Es el corazón del RAG: el contexto viene del retriever (top-k chunks FAISS), no es fijo |
| **Sección {pregunta}** | Entrada del usuario | La pregunta del usuario se inserta al final, tras el contexto y el sistema |

## 3. Justificación de la estructura (roles en tres partes)

El prompt sigue la estructura clásica de tres partes:

1. **Instrucciones del sistema** (qué es el asistente y cómo debe comportarse).
2. **Contexto recuperado** (los datos que el modelo puede usar; variables por consulta).
3. **Pregunta del usuario** (la consulta específica).

Esta separación es coherente con las técnicas de prompt engineering del curso
(RA1/IL1.2): instrucción + contexto + tarea, manteniendo el contexto **separado
de las instrucciones** para que el modelo distinga qué es dato y qué es regla.

## 4. Ejemplo de construcción del prompt en tiempo de ejecución

```
Sistema: [prompt del sistema con REGLAS 1-6]

Human: Pregunta del usuario: ¿Qué lote tiene mayor mortalidad?
```

En ejecución, la plantilla se rellena con:
- `contexto` = los 5 chunks recuperados de FAISS (unidos con `\n---\n`).
- `pregunta` = la consulta escrita por el usuario.

## 5. Límites y medición

- **Temperatura:** 0.1 (baja) → respuestas deterministas y consistentes con los datos.
- **Ventana de contexto / límites Groq:** `openai/gpt-oss-120b` dentro de la capa
  gratuita (100K tokens/día). El prompt es compacto y el contexto se limita a k=5
  chunks (~600 chars c/u) para no gastar cuota y mantener latencia baja.
- **Validación:** las 7 preguntas de `pruebas/` (ver `pruebas/resultados.md`)
  confirman que el prompt produce respuestas coherentes con los datos y fuentes.