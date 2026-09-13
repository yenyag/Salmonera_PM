# Prueba de Escenario de Accidente Laboral - SalmoSUR S.A.

**Fecha de ejecución:** 2026-09-10 13:16
**Pipeline:** Groq `openai/gpt-oss-120b`, temperature 0.1, max_tokens 1500, retriever k=5
**Resultado de coherencia:** 9/9

| ID | Pregunta | Total tokens | Prompt | Completion | ¿Coherente? | Razón |
|----|----------|-------------|--------|------------|-------------|-------|
| A1 | ¿Cuántos incidentes de tipo accidente se registrar… | 1003 | 898 | 105 | Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| A2 | Durante la faena de cosecha se registró un acciden… | 1391 | 800 | 591 | Sí | Coincide con 86% de los datos esperados y cita 5 fuente(s) |
| A3 | ¿Cuántos incidentes de severidad crítica se regist… | 1109 | 924 | 185 | Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| A4 | Un trabajador sufrió un accidente laboral en el ce… | 1274 | 928 | 346 | Sí | Coincide con 78% de los datos esperados y cita 5 fuente(s) |
| A5 | ¿Con qué seguro de accidentes del trabajo cuenta u… | 1194 | 921 | 273 | Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| A9 | ¿Cuántos accidentes laborales fatales registró Sal… | 1008 | 880 | 128 | Sí | El asistente reconoce que no tiene el dato (evita alucinar) |
| A6 | Ante una mortalidad acumulada elevada tras un inci… | 1071 | 801 | 270 | Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| A7 | Del total de incidentes registrados, ¿cuántos fuer… | 1075 | 901 | 174 | Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| A8 | ¿Cuántos incidentes registró SalmoSUR por severida… | 1156 | 928 | 228 | Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |

**Totales (9 consultas):** prompt 7,981 · completion 2,300 · **total 10,281 tokens** · promedio 1,142/consulta
Proyección con cuota diaria Groq (100 000 tokens): ~88 consultas

## Detalle de respuestas

### A1: ¿Cuántos incidentes de tipo accidente se registraron en SalmoSUR durante el periodo?

**Respuesta del asistente:** Se registraron **4 incidentes de tipo accidente** en el periodo.   [Fuente: tabla incidentes / vistas v_incidentes_por_tipo, v_incidentes_por_severidad]

**Fuentes citadas:** incidentes.txt, incidentes.txt, incidentes.txt, protocolo_accidentes_laborales.txt, incidentes.txt

### A2: Durante la faena de cosecha se registró un accidente laboral en el centro Quellón. ¿Qué medidas de bioseguridad recomiendas aplicar por riesgo sanitario?

**Respuesta del asistente:** **Medidas de bioseguridad recomendadas por riesgo sanitario**  1. **Control de acceso** – Restringir y registrar el ingreso de personas, vehículos y embarcaciones al centro de cultivo. Todo visitante debe cumplir el protocolo de ingreso.   2. **Desinfección** – Instalar estaciones de desinfección para calzado, manos y equipos; desinfectar embarcaciones y redes al entrar y salir del centro.   3. **Investigación** – Investigar la causa del accidente laboral para definir medidas correctivas y preventivas según la normativa.   4. **Prevención** – Mantener los elementos de protección personal (EPP) en buen estado y aplicar un programa de prevención de riesgos.   5. **Manejo de mortalidades** – Monitorear la mortalidad acumulada del lote y, si supera los umbrales establecidos, activar planes de contingencia y notificar al organismo competente.    [Fuente: contexto.txt]

**Fuentes citadas:** sernapesca_normativa.txt, bioseguridad.txt, bioseguridad.txt, protocolo_accidentes_laborales.txt, incidentes.txt

### A3: ¿Cuántos incidentes de severidad crítica se registraron y de qué tipo fueron?

**Respuesta del asistente:** Se registraron **2 incidentes de severidad crítica** y **ambos fueron del tipo escape**.   [Fuente: tabla incidentes / vistas v_incidentes_por_tipo, v_incidentes_por_severidad]

**Fuentes citadas:** incidentes.txt, incidentes.txt, protocolo_accidentes_laborales.txt, incidentes.txt, incidentes.txt

### A4: Un trabajador sufrió un accidente laboral en el centro Quellón. ¿A qué número de emergencia debe llamar y qué debe hacer la empresa según la normativa chilena?

**Respuesta del asistente:** En caso de accidente laboral en Quellón debe llamarse al número de emergencias de salud **131 (SAMU)**.    Según la normativa chilena (Ley 16.744) la empresa debe:  1. **Prestar primeros auxilios** al trabajador de forma inmediata y, si corresponde, trasladarlo al centro de salud de la mutualidad o a urgencia.   2. **Denunciar el accidente** mediante el formulario DIAT (Denuncia de Accidente del Trabajo) al organismo administrador (mutualidad de empleadores o ISL) dentro de los plazos legales.   3. **Investigar las causas** del accidente para definir y aplicar medidas preventivas.    [Fuente: CONTEXTO RECUPERADO]

**Fuentes citadas:** protocolo_accidentes_laborales.txt, protocolo_accidentes_laborales.txt, protocolo_accidentes_laborales.txt, protocolo_accidentes_laborales.txt, incidentes.txt

### A5: ¿Con qué seguro de accidentes del trabajo cuenta un operario de SalmoSUR según la legislación chilena y quién lo administra?

**Respuesta del asistente:** Según la legislación chilena (Ley 16.744), todo operario de SalmoSUR cuenta con **seguro obligatorio contra accidentes del trabajo y enfermedades profesionales**.   La cobertura la administra **una mutualidad de empleadores** (por ejemplo ACHS, IST o Mutual de Seguridad); si la empresa no está afiliada a alguna de ellas, la administra el **Instituto de Seguridad Laboral (ISL)**.    [Fuente: SEGURIDAD LABORAL Y ACCIDENTES DEL TRABAJO EN CHILE]

**Fuentes citadas:** protocolo_accidentes_laborales.txt, protocolo_accidentes_laborales.txt, protocolo_accidentes_laborales.txt, protocolo_accidentes_laborales.txt, incidentes.txt

### A9: ¿Cuántos accidentes laborales fatales registró SalmoSUR durante 2024?

**Respuesta del asistente:** No tengo información suficiente para responder eso.

**Fuentes citadas:** incidentes.txt, mortalidad.txt, incidentes.txt, incidentes.txt, mortalidad.txt

### A6: Ante una mortalidad acumulada elevada tras un incidente en un lote, ¿qué debe hacer la empresa según Sernapesca?

**Respuesta del asistente:** Ante una mortalidad acumulada elevada, la empresa debe activar de inmediato el plan de contingencia sanitaria y notificar al organismo regulador Sernapesca, conforme a los umbrales establecidos por la normativa sanitaria. [Fuente: Sernapesca - Buenas prácticas en acuicultura]

**Fuentes citadas:** bioseguridad.txt, sernapesca_normativa.txt, mortalidad.txt, mercado_salmon.txt, bioseguridad.txt

### A7: Del total de incidentes registrados, ¿cuántos fueron de tipo accidente y cuántos de tipo escape?

**Respuesta del asistente:** Del total de incidentes registrados, **4 fueron de tipo accidente** y **4 fueron de tipo escape**.   [Fuente: REPORTE DE INCIDENTES Y SEGURIDAD]

**Fuentes citadas:** incidentes.txt, incidentes.txt, incidentes.txt, protocolo_accidentes_laborales.txt, incidentes.txt

### A8: ¿Cuántos incidentes registró SalmoSUR por severidad (bajo, medio, alto y crítico)?

**Respuesta del asistente:** - Severidad bajo: 4 incidentes.   - Severidad medio: 6 incidentes.   - Severidad alto: 6 incidentes.   - Severidad crítico: 2 incidentes.    [Fuente: REPORTE DE INCIDENTES Y SEGURIDAD - SalmoSUR S.A.]

**Fuentes citadas:** incidentes.txt, incidentes.txt, incidentes.txt, protocolo_accidentes_laborales.txt, mortalidad.txt
