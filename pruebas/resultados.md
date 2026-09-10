# Resultados de Pruebas de Coherencia - SalmoSUR S.A.

**Fecha de ejecución:** 2026-09-10 13:24
**Resultado general:** 14/14 pruebas coherentes

| ID | Pregunta | ¿Coherente? | Razón |
|----|----------|-------------|-------|
| P1 | ¿Qué lote tiene mayor mortalidad acumulada?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 4 fuente(s) |
| P2 | ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el tot... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P3 | ¿Qué centro es el más rentable y cuánto generó?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 3 fuente(s) |
| P4 | ¿Cuántas unidades se cosecharon de calidad premium y de desc... | ✅ Sí | Coincide con 100% de los datos esperados y cita 3 fuente(s) |
| P5 | ¿Qué lote tiene mayor mortalidad y qué recomiendas según la ... | ✅ Sí | Coincide con 100% de los datos esperados y cita 4 fuente(s) |
| P6 | ¿Qué requisitos debe cumplir el salmón para su exportación?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P7 | ¿Cuánto pagó la empresa en impuestos a la renta durante 2024... | ✅ Sí | El asistente reconoce que no tiene el dato (evita alucinar) |
| P8 | ¿Cuál es la planilla mensual del centro de cultivo Los Lagos... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P9 | ¿Qué productos del inventario están bajo su stock mínimo?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P10 | ¿Qué proveedor facturó más durante el periodo y en qué rubro... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P11 | ¿Cuál es el principal destino de las exportaciones por valor... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P12 | ¿Qué centro de cultivo concentra la mayor biomasa y cuántos ... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P13 | ¿Cuántos incidentes de severidad crítica se registraron y de... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P14 | ¿Qué lote tiene el FCR más bajo y en qué centro se encuentra... | ✅ Sí | Coincide con 67% de los datos esperados y cita 4 fuente(s) |

## Detalle de respuestas

### P1: ¿Qué lote tiene mayor mortalidad acumulada?

**Respuesta del asistente:**

> El lote con mayor mortalidad acumulada es **LOTE‑B2**, con 2 300 unidades mortales.  
[Fuente: tabla lotes / vista vista_mortalidad_acumulada]

**Fuentes citadas:** mortalidad.txt, bioseguridad.txt, sernapesca_normativa.txt, mercado_salmon.txt

### P2: ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el total semestral?

**Respuesta del asistente:**

> - Ventas de enero 2025: **$125,000,000 CLP**.  
- Total semestral (enero‑junio 2025): **$905,000,000 CLP**.

[Fuente: tabla ventas / vista v_ventas_por_mes]  
[Fuente: REPORTE DE VENTAS MENSUALES - SalmoSUR S.A.]

**Fuentes citadas:** ventas.txt, exportaciones.txt

### P3: ¿Qué centro es el más rentable y cuánto generó?

**Respuesta del asistente:**

> El centro más rentable es **Los Lagos**, con ingresos de **$510,000,000 CLP**.  
[Fuente: tabla centros / vista vista_rentabilidad_por_centro]

**Fuentes citadas:** empleados.txt, rentabilidad.txt, ventas.txt

### P4: ¿Cuántas unidades se cosecharon de calidad premium y de descarte?

**Respuesta del asistente:**

> Se cosecharon **320 unidades de calidad premium** y **95 unidades de calidad descarte**.  
[Fuente: tabla cosechas / vista vista_distribucion_por_calidad]

**Fuentes citadas:** calidad.txt, inventario.txt, mercado_salmon.txt

### P5: ¿Qué lote tiene mayor mortalidad y qué recomiendas según la normativa de bioseguridad?

**Respuesta del asistente:**

> El lote con mayor mortalidad es **LOTE‑B2**, que registró **2300 unidades** de mortalidad acumulada【Fuente: tabla lotes / vista vista_mortalidad_acumulada】.

**Recomendaciones según la normativa de bioseguridad**  

1. **Implementar el programa de bioseguridad obligatorio**, que debe incluir:  
   - Control de acceso al centro.  
   - Desinfección de embarcaciones, equipos y personal.  
   - Manejo adecuado de las mortalidades.  

2. **Monitorear y reportar la mortalidad acumulada** del lote.  
   - Al superar los umbrales establecidos por la normativa sanitaria, activar el plan de contingencia sanitaria de la empresa.  

3. **Notificar al organismo competente** (Sernapesca) cuando la mortalidad sea considerada elevada, tal como indica la guía de buenas prácticas en acuicultura【Fuente: Sernapesca - Buenas prácticas en acuicultura (https://www.sernapesca.cl/)】.

**Fuentes citadas:** sernapesca_normativa.txt, bioseguridad.txt, mortalidad.txt, mercado_salmon.txt

### P6: ¿Qué requisitos debe cumplir el salmón para su exportación?

**Respuesta del asistente:**

> Los requisitos que debe cumplir el salmón chileno para ser exportado son:

1. Trazabilidad completa del lote de origen: poder rastrear el producto hasta el centro de cultivo de procedencia.  
2. Certificado sanitario de exportación emitido por Sernapesca.  
3. Cumplimiento de los estándares del país de destino (Unión Europea, Estados Unidos, Japón y Brasil son los principales mercados).  
4. Control de residuos de medicamentos veterinarios dentro de los límites permitidos.  

[Fuente: Sernapesca - Exportaciones de salmón]

**Fuentes citadas:** exportacion_calidad.txt, requisitos_exportacion.txt

### P7: ¿Cuánto pagó la empresa en impuestos a la renta durante 2024?

**Respuesta del asistente:**

> No tengo información suficiente para responder eso.

**Fuentes citadas:** ventas.txt, compras.txt, exportaciones.txt

### P8: ¿Cuál es la planilla mensual del centro de cultivo Los Lagos?

**Respuesta del asistente:**

> La planilla mensual del centro de cultivo Los Lagos es **$18,050,000 CLP**.  
[Fuente: tabla empleados / vistas v_empleados, v_planilla_por_centro, v_planilla_por_cargo]

**Fuentes citadas:** empleados.txt, rentabilidad.txt

### P9: ¿Qué productos del inventario están bajo su stock mínimo?

**Respuesta del asistente:**

> Los ítems que están bajo su stock mínimo son:

- **Alimento Extruido 9 mm** (alimento) – 8 500 unidades (stock mínimo 16 000).  
- **Vacuna ISA** (medicamentos) – 600 unidades (stock mínimo 800).  
- **Red de cultivo 30 mm** (herramientas) – 15 unidades (stock mínimo 18).  

[Fuente: tabla inventario / vistas v_inventario_resumen, v_stock_bajo]

**Fuentes citadas:** inventario.txt, exportacion_calidad.txt

### P10: ¿Qué proveedor facturó más durante el periodo y en qué rubro?

**Respuesta del asistente:**

> El proveedor que facturó más durante el periodo fue **Transportes Austral**, con un total de **$60.500.000 CLP**, correspondiente al **rubro Logística y transporte**.  
[Fuente: tablas proveedores y compras / vistas v_gasto_por_proveedor, v_compras_recientes]

**Fuentes citadas:** compras.txt, ventas.txt

### P11: ¿Cuál es el principal destino de las exportaciones por valor FOB?

**Respuesta del asistente:**

> El principal destino de nuestras exportaciones por valor FOB es **Estados Unidos**, con un valor de $4 940 000 000 CLP.  
[Fuente: tabla exportaciones / vistas v_exportaciones_por_destino, v_exportaciones_resumen]

**Fuentes citadas:** exportaciones.txt, exportacion_calidad.txt

### P12: ¿Qué centro de cultivo concentra la mayor biomasa y cuántos kilos tiene?

**Respuesta del asistente:**

> El centro de cultivo que concentra la mayor biomasa es **Los Lagos**, con **6,750,000 kg** de biomasa.  
[Fuente: tabla lotes_detalle / vistas v_lotes_detalle, v_biomasa_por_centro]

**Fuentes citadas:** lotes_detalle.txt, calidad.txt

### P13: ¿Cuántos incidentes de severidad crítica se registraron y de qué tipo son?

**Respuesta del asistente:**

> Se registraron **2 incidentes de severidad crítica**, y **ambos son del tipo escape**. [Fuente: tabla incidentes / vistas v_incidentes_por_tipo, v_incidentes_por_severidad]

**Fuentes citadas:** incidentes.txt, protocolo_accidentes_laborales.txt

### P14: ¿Qué lote tiene el FCR más bajo y en qué centro se encuentra?

**Respuesta del asistente:**

> El lote con el FCR más bajo es **LOTE‑K1**, y se encuentra en el centro de **Quellón**.  
[Fuente: LOTES DE CULTIVO DETALLADOS - SalmoSUR S.A.]

**Fuentes citadas:** lotes_detalle.txt, inventario.txt, empleados.txt, mortalidad.txt
