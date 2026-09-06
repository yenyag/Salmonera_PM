# Informe Técnico - Asistente RAG para SalmoSUR S.A.

**Evaluación Parcial 1 - ISY0101 Ingeniería de Soluciones con IA**

---

## Declaración de uso de IA (obligatorio)

*[Completar: qué herramientas de IA se utilizaron y cómo - Únicamente para redacción/apoyo visual, NO para conclusiones ni justificaciones técnicas]*

Este proyecto utilizó herramientas de IA para: [apoyo en redacción de este informe, generación de diagramas iniciales, revisión de código]. Las decisiones técnicas, el diseño de la solución, los análisis y las conclusiones fueron elaborados y validados por el equipo. Toda idea generada con IA fue revisada y contrastada con la documentación del curso.

---

## 1. Análisis del caso organizacional (IE1)

- **Organización:** SalmoSUR S.A. (detalle en `caso/README.md`).
- **Problema:** consultas operativas (ventas, mortalidad, calidad, rentabilidad) requieren navegación manual del dashboard y dependencia del equipo de TI; Tiempo promedio 15-30 min/consulta.
- **Objetivos:** respuesta <1 min, 100% fundamentada en datos, integrada al dashboard, citando fuente.
- **Requerimientos de la solución con IA:** consulta en lenguaje natural, recuperación desde BD + normativa, trazabilidad, integración al sistema existente.

## 2. Formulación de prompts (IE2)

- Prompt de sistema de 3 partes: rol → contexto → pregunta.
- Justificación en `docs/prompts.md`.
- Se eligieron reglas explícitas anti-alucinación (responder solo con contexto, "no sé", citar fuente, cifras exactas).

## 3. Diseño e implementación del pipeline RAG (IE3, IE4)

- **Fuente interna:** BD PostgreSQL → `scripts/generate_internal_docs.py` → `data/interna/` (4 reportes).
- **Fuente externa:** 5 documentos normativos en `data/externa/`.
- **Chunking:** RecursiveCharacterTextSplitter, tamaño 600, solapamiento 80 (ajuste que mejoró la recuperación de 3/7 a 7/7).
- **Embeddings:** `paraphrase-multilingual-MiniLM-L12-v2` (local, 384 dims).
- **Índice:** FAISS (`data/faiss_index`).
- **Recuperación:** top-k=5 · **Generación:** Groq `openai/gpt-oss-120b`.
- **Coherencia (IE4):** 7/7 preguntas aprobadas (evidencias en `pruebas/resultados.md`).

## 4. Arquitectura de la solución (IE5, IE6)

- Diagrama Mermaid en `docs/arquitectura.md`.
- Componentes: Frontend (dashboard+chat), Backend Express (`POST /api/consultar`), Pipeline RAG (FAISS → retriever → LLM), Fuentes (BD + normativa).
- Flujo de datos: ingesta (una vez) y consulta (por pregunta).

## 5. Justificación de decisiones de diseño (IE7)

- **FAISS:** gratuito, local, suficiente para el volumen (+ tabla de comparación con alternativas en `docs/arquitectura.md`).
- **Embeddings locales:** privacidad (los datos no salen de la máquina), costo cero, sin límites de cuota.
- **Groq:** capa gratuita, baja latencia; se respeta el límite diario de 100K tokens (prompt compacto, k=5).
- **Chunk size 600:** balance entre contexto semántico y granularidad (mejora medible en las pruebas).
- **Temperatura 0.1:** determinismo y consistencia con los datos.

## 6. Pruebas y evidencias

- `pruebas/resultados.md`: 7/7 pruebas coherentes con citación de fuentes.
- Capturas de pantalla del asistente integrado al dashboard. *[Insertar capturas]*

## 7. Conclusiones y reflexiones individuales (IE8, IE9)

### Reflexión individual - Integrante 1: *[nombre]*
*[Redacción SIN apoyo de IA - aprender sobre la implementación de RAG, su contribución al proyecto, qué aprendió con los prompts, etc.]*

### Reflexión individual - Integrante 2: *[nombre]*
*[Redacción SIN apoyo de IA]*

### Conclusión del equipo
*[Redacción SIN apoyo de IA - síntesis de hallazgos, limitaciones y proyección]*

## 8. Referencias (APA)

- Groq. (s.f.). *Groq documentation*. https://console.groq.com/docs
- LangChain. (s.f.). *Retrieval augmented generation*. https://www.langchain.com/
- Sernapesca. (s.f.). *Normativa para la acuicultura en Chile*. https://www.sernapesca.cl/
- Hugging Face. (s.f.). *sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2*. https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
- Duoc UC. (s.f.). *Guía de uso educativo de IA*. https://bibliotecas.duoc.cl/ia

---