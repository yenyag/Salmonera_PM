# Prueba de Pregunta Compleja Multi-Tabla

**Fecha:** 2026-09-10 · **Pipeline:** Groq `openai/gpt-oss-120b`, temp 0.1, max_tokens 1500, retriever k=5

## Pregunta 1 (5 dominios: rentabilidad + biomasa/FCR + planilla + mortalidad + incidentes)

> El centro Los Lagos lidera en rentabilidad, biomasa y planilla mensual, mientras que Quellón tiene
> el mejor FCR. Integra estos datos con la mortalidad acumulada del lote crítico y con la severidad de
> los incidentes registrados en el periodo, y determina cuál es el mayor riesgo operacional que
> SalmoSUR debería gestionar hacia fin de año.

**Chunks recuperados (k=5):** empleados.txt · mercado_salmon.txt · rentabilidad.txt · mercado_salmon.txt · lotes_detalle.txt
→ **No recuperó** mortalidad ni incidentes (los datos no estaban en el contexto).

**Tokens:** prompt 913 · completion 188 · **total 1.101** · latencia 1,00 s

**Respuesta:** "No tengo información suficiente para responder eso." (con citación de las 3 fuentes recuperadas)

## Pregunta 2 (3 evidencias: mortalidad + incidentes + inventario)

> El LOTE-B2 concentra la mayor mortalidad acumulada, hay 2 incidentes de severidad crítica del tipo
> escape y el inventario tiene ítems bajo su stock mínimo. Integra estos hechos y recomienda qué
> debería priorizar SalmoSUR para reducir su riesgo operacional durante el próximo trimestre.

**Chunks recuperados (k=5):** mortalidad.txt · sernapesca_normativa.txt · mortalidad.txt · mercado_salmon.txt · bioseguridad.txt
→ Recuperó mortalidad y normativa, pero **no** incidentes ni inventario.

**Tokens:** prompt 859 · completion 175 · **total 1.034** · latencia 0,84 s

**Respuesta:** "No tengo información suficiente para responder eso."

## Pregunta 2bis (post-mejora: corpus ampliado + recuperación por keywords)

Tras ampliar el corpus con el detalle de accidentes/críticos (reporte interno de incidentes) y la
normativa de accidentes laborales (documento externo, 65 chunks), se añadió a `query_rag.py` una
**recuperación ampliada por palabras clave de dominio** (incidentes, inventario, stock, proveedor,
exportaciones, planilla, lote, FCR): cuando la pregunta menciona un módulo, el contexto se refuerza
con los chunks que lo contienen aunque la similitud los deje fuera del top-k. La misma pregunta 2:

**Tokens:** prompt 1.160 · completion 993 · **total 2.153** · latencia 2,68 s

**Chunks recuperados (k=5 → +extras):** mortalidad.txt · sernapesca_normativa.txt · bioseguridad.txt ·
mercado_salmon.txt · **incidentes.txt** (ahora sí integra los escapes críticos).

**Respuesta:** ahora **integra** los tres frentes y recomienda (1) activar el plan de contingencia
sanitaria del LOTE-B2 (2 300 unidades de mortalidad acumulada), (2) fortalecer bioseguridad y medidas
anti-escape por los 2 incidentes críticos, y (3) monitoreo/reporte diario a Sernapesca — sin inventar
cifras y citando la normativa de bioseguridad.

## Conclusión de la prueba compleja

1. **Comportamiento sólido anti-alucinación:** ante preguntas que cruzan muchas tablas y quedan sin
   contexto suficiente, el asistente responde "No tengo información suficiente" y cita lo que sí recuperó.
   En un contexto de emergencia o reporte es preferible a inventar cifras (IE4).
2. **Límite real de integración:** con k=5, una pregunta que requiere evidencias de 3+ documentos
   distintos no siempre reúne todos los chunks necesarios; la integración multi-tabla profunda queda
   limitada a ~2-3 fuentes por consulta. La **recuperación ampliada por keywords** mitigó el problema:
   la pregunta 2 pasó de "no tengo información" a una recomendación integrada y citada, sin subir k
   (mismo costo base de retrieval) y sin anular el anti-alucinación (las keywords excluyen términos de
   seguridad/emergencia). Se puede profundizar además con preguntas más acotadas o con los paneles del
   dashboard (que ya cruzan las vistas).
3. **Tokens:** tras la mejora, la pregunta compleja 2 costó 2.153 tokens frente a 1.034 antes; el
   aumento (~+88 % de completion, por respuesta más elaborada) está dentro del presupuesto diario.