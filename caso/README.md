# Propuesta de Caso Organizacional
## Asistente RAG para SalmoSUR S.A.

**Asignatura:** ISY0101 - Ingeniería de Soluciones con IA
**Evaluación:** Parcial 1 - Diseño de Solución con LLM y RAG
**Fecha:** Septiembre 2026

---

## 1. Organización

**SalmoSUR S.A.** es una empresa salmonicultora chilena dedicada a la producción, cosecha y comercialización de salmón del Pacífico. Su operación se concentra en la Región de Los Lagos y Aysén, con centros de cultivo en Quellón, Chiloé, Aysén y Los Lagos.

- **Rubro:** Acuicultura / Producción de salmones
- **Tamaño:** Empresa mediana (~150 empleados directos)
- **Contexto general:** La empresa cuenta con un sistema de gestión (dashboard web) que permite a sus administradores visualizar métricas operativas clave: ventas mensuales, distribución de cosechas por calidad, mortalidad acumulada por lote y rentabilidad por centro. Sin embargo, el acceso a esta información requiere navegación manual por el dashboard y conocimiento previo de dónde se encuentra cada dato.

---

## 2. Problema / Desafío

Los administradores y jefes de operaciones de SalmoSUR S.A. deben consultar indicadores operativos de forma constante para la toma de decisiones (por ejemplo: "¿qué lote tiene mayor mortalidad?", "¿cómo van las ventas de este semestre?", "¿qué centro es más rentable?").

Actualmente, estas consultas implican:

- Navegar manualmente por el dashboard para ubicar el gráfico o tabla correspondiente.
- Cruzar mentalmente información de distintas pantallas (ventas, calidad, mortalidad, rentabilidad).
- Recurrir al equipo de TI o al analista de datos para obtener respuestas consolidadas, lo que retrasa la decisión.

**Impacto:** El tiempo medio de una consulta operativa se estima en 15-30 minutos, y en muchos casos la información disponible no se aprovecha porque los usuarios no saben cómo extraerla. Esto genera retrasos en la toma de decisiones sobre producción, calidad y rentabilidad.

---

## 3. Objetivos de la Intervención

| # | Objetivo | Métrica de éxito |
|---|----------|------------------|
| 1 | Permitir consultas operativas en lenguaje natural | Que un usuario obtenga una respuesta a una pregunta de negocio en menos de 1 minuto |
| 2 | Responder con base en los datos reales del sistema de gestión | Que el 100% de las respuestas del asistente estén respaldadas por los datos recuperados (tablas de la BD o documentos normativos) |
| 3 | Integrar el asistente al dashboard existente | Que la funcionalidad esté disponible dentro de la misma aplicación sin flujo adicional |
| 4 | Reducir la dependencia del equipo de TI para consultas de información | Que las 5-8 preguntas de prueba se respondan correctamente citando su fuente |

---

## 4. Datos Disponibles

### 4.1 Fuente interna: Base de datos PostgreSQL

El sistema de gestión expone las siguientes tablas y vistas (datos simulados para demostración):

| Tabla / Vista | Contenido | Ejemplo |
|---------------|-----------|---------|
| `ventas` / `v_ventas_por_mes` | Total de ventas mensuales (CLP) | Enero 2025: $125.000.000 CLP |
| `cosechas` / `vista_distribucion_por_calidad` | Volumen cosechado por calidad | premium 320, exportación 540, mercado_local 210, descarte 95 |
| `lotes` / `vista_mortalidad_acumulada` | Mortalidad acumulada por lote | LOTE-B2: 2.300 unidades |
| `centros` / `vista_rentabilidad_por_centro` | Rentabilidad (ingresos) por centro | Centro Los Lagos: $510.000.000 CLP |

### 4.2 Fuente externa: Documentos normativos y de mercado

Documentos públicos de libre acceso sobre:

- Normativa sanitaria de Sernapesca para cultivo de salmónidos.
- Requisitos de exportación y certificación de calidad del salmón chileno.
- Buenas prácticas de bioseguridad en centros de cultivo.

Estos documentos se integrarán como fuente externa para enriquecer las respuestas sobre normativa y recomendaciones.

---

## 5. Restricciones o Requerimientos Particulares

1. **Datos simulados:** La base de datos contiene datos de demostración; no son cifras reales de la empresa. Esto debe declararse en el informe.
2. **Proveedor de IA gratuito:** La solución utiliza la capa gratuita de Groq (`llama-3.3-70b-versatile`), con límite de 100.000 tokens/día. El diseño debe ser eficiente en consumo.
3. **Embeddings locales:** Groq no ofrece endpoint de embeddings, por lo que se usará un modelo local gratuito (`paraphrase-multilingual-MiniLM-L12-v2`), lo que además garantiza que los datos no salgan de la máquina.
4. **Seguridad de credenciales:** La API key de Groq se almacena solo en `.env` y nunca se sube al repositorio.
5. **Ética y uso de IA:** El informe debe declarar el uso de herramientas de IA. Las conclusiones y justificaciones técnicas deben ser redactadas por el equipo sin apoyo de IA.
6. **Formato de entrega:** Informe escrito máximo 5 páginas (APA) + repositorio GitHub/GitLab con README de ejecución y evidencia de pruebas.

---

## 6. Motivación para el Uso de Agentes de IA, LLMs y RAG

La arquitectura propuesta combina **RAG (Retrieval-Augmented Generation)** con un **LLM** porque el problema de SalmoSUR S.A. consiste en responder preguntas específicas sobre datos que ya existen en la organización:

- **RAG permite recuperar información relevante** de las fuentes internas (BD) y externas (normativa) antes de responder, asegurando que las respuestas del LLM estén fundamentadas en datos reales y no inventados (evita alucinaciones).
- **El LLM aporta comprensión de lenguaje natural**, permitiendo que un usuario haga preguntas como "¿qué lote tiene mayor mortalidad y qué recomiendas?" sin necesidad de conocer la estructura de la BD.
- **La indexación vectorial (FAISS) con embeddings locales** permite búsquedas semánticas rápidas y gratuitas sobre el corpus de documentos, manteniendo la privacidad de los datos.
- **La recuperación citando la fuente** da trazabilidad: cada respuesta identifica de qué tabla o documento proviene la información, lo que fortalece la credibilidad de la solución.

Esta combinación es la más adecuada versus alternativas como entrenar un modelo propio (costoso e innecesario para este volumen de datos) o usar solo prompts sin recuperación (riesgo alto de alucinaciones y respuestas desactualizadas).

---

## 7. Referencias Relevantes

- Sernapesca. *Normativa para la acuicultura en Chile*. https://www.sernapesca.cl/
- LangChain. *Retrieval-Augmented Generation (RAG)*. https://www.langchain.com/
- Groq. *Documentación oficial y límites de la API*. https://console.groq.com/docs
- Hugging Face. *paraphrase-multilingual-MiniLM-L12-v2*. https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

---

*Documento de propuesta - Evaluación Parcial 1 ISY0101.*