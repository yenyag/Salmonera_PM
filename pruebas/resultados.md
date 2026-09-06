# Resultados de Pruebas de Coherencia - SalmoSUR S.A.

**Fecha de ejecución:** 2026-09-06 16:35
**Resultado general:** 7/7 pruebas coherentes

| ID | Pregunta | ¿Coherente? | Razón |
|----|----------|-------------|-------|
| P1 | ¿Qué lote tiene mayor mortalidad acumulada?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P2 | ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el tot... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P3 | ¿Qué centro es el más rentable y cuánto generó?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 3 fuente(s) |
| P4 | ¿Cuántas unidades se cosecharon de calidad premium y de desc... | ✅ Sí | Coincide con 100% de los datos esperados y cita 3 fuente(s) |
| P5 | ¿Qué lote tiene mayor mortalidad y qué recomiendas según la ... | ✅ Sí | Coincide con 75% de los datos esperados y cita 3 fuente(s) |
| P6 | ¿Qué requisitos debe cumplir el salmón para su exportación?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P7 | ¿Quién es el gerente comercial y cuántos empleados tiene la ... | ✅ Sí | El asistente reconoce que no tiene el dato (evita alucinar) |

## Detalle de respuestas

### P1: ¿Qué lote tiene mayor mortalidad acumulada?

**Respuesta del asistente:**

> El lote con mayor mortalidad acumulada es **LOTE‑B2**, con 2 300 unidades mortales.  
[Fuente: tabla lotes / vista vista_mortalidad_acumulada]

**Fuentes citadas:** mortalidad.txt, bioseguridad.txt

### P2: ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el total semestral?

**Respuesta del asistente:**

> - Ventas en enero 2025: **$125,000,000 CLP**.  
- Total semestral (enero‑junio 2025): **$905,000,000 CLP**.

[Fuente: REPORTE DE VENTAS MENSUALES - SalmoSUR S.A.; El total acumulado del periodo fue de $905,000,000 CLP]

**Fuentes citadas:** ventas.txt, calidad.txt

### P3: ¿Qué centro es el más rentable y cuánto generó?

**Respuesta del asistente:**

> El centro más rentable es **Centro Los Lagos**, que generó **$510.000.000 CLP** en ingresos.  
[Fuente: tabla centros / vista vista_rentabilidad_por_centro]

**Fuentes citadas:** rentabilidad.txt, ventas.txt, mercado_salmon.txt

### P4: ¿Cuántas unidades se cosecharon de calidad premium y de descarte?

**Respuesta del asistente:**

> Se cosecharon **320 unidades de calidad premium** y **95 unidades de calidad descarte**.  
[Fuente: tabla cosechas / vista vista_distribucion_por_calidad]

**Fuentes citadas:** calidad.txt, mercado_salmon.txt, mortalidad.txt

### P5: ¿Qué lote tiene mayor mortalidad y qué recomiendas según la normativa de bioseguridad?

**Respuesta del asistente:**

> El lote con mayor mortalidad es **LOTE‑B2**, con **2 300 unidades** fallecidas【Fuente: tabla lotes / vista vista_mortalidad_acumulada】.  

Según la normativa de bioseguridad, se recomienda:

1. **Implementar un programa de bioseguridad** que incluya:
   - Control de acceso al centro.
   - Desinfección de embarcaciones, equipos y personal.
   - Manejo adecuado de mortalidades.  
2. **Monitorear y reportar la mortalidad acumulada** del lote; si supera los umbrales establecidos, activar los planes de contingencia y notificar al organismo competente【Fuente: tabla lotes / vista vista_mortalidad_acumulada】.

**Fuentes citadas:** sernapesca_normativa.txt, bioseguridad.txt, mortalidad.txt

### P6: ¿Qué requisitos debe cumplir el salmón para su exportación?

**Respuesta del asistente:**

> Para que el salmón chileno pueda exportarse, debe cumplir con los siguientes requisitos:

1. Trazabilidad completa del lote de origen: todos los productos exportados deben poder rastrearse hasta el centro de cultivo de procedencia.  
2. Certificado sanitario de exportación emitido por Sernapesca.  
3. Cumplimiento de los estándares del país de destino (Unión Europea, Estados Unidos, Japón y Brasil son los principales mercados).  
4. Control de residuos de medicamentos veterinarios dentro de los límites permitidos.  

[Fuente: Sernapesca - Exportaciones de salmón (https://www.sernapesca.cl/)]

**Fuentes citadas:** exportacion_calidad.txt, requisitos_exportacion.txt

### P7: ¿Quién es el gerente comercial y cuántos empleados tiene la planta de proceso?

**Respuesta del asistente:**

> No tengo información suficiente para responder eso.

**Fuentes citadas:** ventas.txt, mercado_salmon.txt, rentabilidad.txt
