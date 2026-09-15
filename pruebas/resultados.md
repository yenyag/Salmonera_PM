# Resultados de Pruebas de Coherencia - SalmoSUR S.A.

**Fecha de ejecución:** 2026-09-14 10:53
**Resultado general:** 18/18 pruebas coherentes

| ID | Pregunta | ¿Coherente? | Razón |
|----|----------|-------------|-------|
| P1 | ¿Qué lote tiene mayor mortalidad acumulada?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P2 | ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el tot... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P3 | ¿Qué centro es el más rentable y cuánto generó?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 7 fuente(s) |
| P4 | ¿Cuántas toneladas se cosecharon de calidad premium y de des... | ✅ Sí | Coincide con 100% de los datos esperados y cita 6 fuente(s) |
| P5 | ¿Qué lote tiene mayor mortalidad y qué recomiendas según la ... | ✅ Sí | Coincide con 100% de los datos esperados y cita 4 fuente(s) |
| P6 | ¿Qué requisitos debe cumplir el salmón para su exportación?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P7 | ¿Cuánto pagó la empresa en impuestos a la renta durante 2024... | ✅ Sí | El asistente reconoce que no tiene el dato (evita alucinar) |
| P8 | ¿Cuál es la planilla mensual del centro de cultivo Los Lagos... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P9 | ¿Qué productos del inventario están bajo su stock mínimo?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 4 fuente(s) |
| P10 | ¿Qué proveedor facturó más durante el periodo y en qué rubro... | ✅ Sí | Coincide con 100% de los datos esperados y cita 4 fuente(s) |
| P11 | ¿Cuál es el principal destino de las exportaciones por valor... | ✅ Sí | Coincide con 100% de los datos esperados y cita 4 fuente(s) |
| P12 | ¿Qué centro de cultivo concentra la mayor biomasa y cuántos ... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P13 | ¿Cuántos incidentes de severidad crítica se registraron y de... | ✅ Sí | Coincide con 100% de los datos esperados y cita 3 fuente(s) |
| P14 | ¿Qué lote tiene el FCR más bajo y en qué centro se encuentra... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P15 | ¿Qué lote tiene el mayor promedio de caligus según el monito... | ✅ Sí | Coincide con 100% de los datos esperados y cita 2 fuente(s) |
| P16 | ¿Qué concesión de la empresa tiene la mayor superficie autor... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P17 | ¿Cuánto alimento se entregó al lote A1 en mayo de 2025?... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |
| P18 | ¿Qué cliente de Japón compra salmón a la empresa y qué produ... | ✅ Sí | Coincide con 100% de los datos esperados y cita 5 fuente(s) |

## Detalle de respuestas

### P1: ¿Qué lote tiene mayor mortalidad acumulada?

**Respuesta del asistente:**

> El lote con mayor mortalidad acumulada es **LOTE‑E2**, con 8 100 unidades.  
[Fuente: tabla lotes / vista vista_mortalidad_acumulada]

**Fuentes citadas:** mortalidad.txt, monitoreo_sanitario_salmon.txt, monitoreo_sanitario.txt, bioseguridad.txt, sernapesca_normativa.txt

### P2: ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el total semestral?

**Respuesta del asistente:**

> - Ventas de enero 2025: **$1 510 000 000 CLP**.  
- Total semestral (enero – junio 2025): **$11 234 000 000 CLP**.

[Fuente: “REPORTE DE VENTAS MENSUALES - SalmoSUR S.A.” y “El total acumulado del periodo fue de $11,234,000,000 CLP.”]

**Fuentes citadas:** ventas.txt, exportaciones.txt, compras.txt, monitoreo_sanitario.txt, alimentacion.txt

### P3: ¿Qué centro es el más rentable y cuánto generó?

**Respuesta del asistente:**

> El centro más rentable es **Centro Los Lagos**, que generó **$3 550 000 000 CLP** en ingresos.  
[Fuente: tabla centros / vista vista_rentabilidad_por_centro]

**Fuentes citadas:** empleados.txt, rentabilidad.txt, mercado_salmon.txt, concesiones.txt, compras.txt, ventas.txt, alimentacion.txt

### P4: ¿Cuántas toneladas se cosecharon de calidad premium y de descarte?

**Respuesta del asistente:**

> Se cosecharon **480 toneladas** de calidad premium y **50 toneladas** de calidad descarte.  
[Fuente: tabla cosechas / vista vista_distribucion_por_calidad]

**Fuentes citadas:** calidad.txt, mercado_salmon.txt, alimentacion.txt, exportaciones.txt, compras.txt, lotes_detalle.txt

### P5: ¿Qué lote tiene mayor mortalidad y qué recomiendas según la normativa de bioseguridad?

**Respuesta del asistente:**

> El lote con mayor mortalidad es **LOTE‑E2**, que acumuló **8 100 unidades** de mortalidad.  

**Recomendaciones según la normativa de bioseguridad**  

1. **Activar el plan de contingencia sanitaria** y notificar a Sernapesca, ya que la mortalidad supera los umbrales establecidos.  
2. **Retirar a diario las mortalidades del agua** para evitar su descomposición y la diseminación de patógenos, gestionándolas conforme a la normativa de Sernapesca.  
3. **Implementar el programa de bioseguridad** que incluye:  
   - Control de acceso al centro.  
   - Desinfección de embarcaciones, equipos y personal.  
   - Manejo adecuado de mortalidades.  
4. **Realizar exámenes de salud periódicos** al stock y vigilar indicadores como la mortalidad acumulada y la condición de los peces.  
5. **Mantener en cuarentena a los peces recién introducidos** o de procedencia desconocida antes de integrarlos a la producción.  
6. **Monitorear el oxígeno disuelto**; si está por debajo de 6 mg/L activar oxigenación o considerar traslado del lote.  
7. **Aplicar tratamientos solo con productos autorizados por Sernapesca**, respetando los tiempos de carencia para garantizar la inocuidad del producto.  

[Fuente: tabla lotes / vista vista_mortalidad_acumulada]  
[Fuente: Sernapesca - Buenas prácticas en acuicultura (https://www.sernapesca.cl/)]

**Fuentes citadas:** sernapesca_normativa.txt, bioseguridad.txt, monitoreo_sanitario_salmon.txt, mortalidad.txt

### P6: ¿Qué requisitos debe cumplir el salmón para su exportación?

**Respuesta del asistente:**

> Los requisitos que debe cumplir el salmón chileno para ser exportado son:

1. **Trazabilidad completa del lote de origen**: poder rastrear el producto hasta el centro de cultivo de procedencia.  
2. **Certificado sanitario de exportación** emitido por Sernapesca.  
3. **Cumplimiento de los estándares de calidad e inocuidad del país de destino** (principalmente Unión Europea, Estados Unidos, Japón y Brasil).  
4. **Control de residuos de medicamentos veterinarios** dentro de los límites permitidos por la normativa internacional.  

[Fuente: Sernapesca - Exportaciones de salmón]  
[Fuente: Sernapesca - Requisitos de exportación de salmón]

**Fuentes citadas:** exportacion_calidad.txt, requisitos_exportacion.txt, sernapesca_normativa.txt, exportaciones.txt, mercado_salmon.txt

### P7: ¿Cuánto pagó la empresa en impuestos a la renta durante 2024?

**Respuesta del asistente:**

> No tengo información suficiente para responder eso.

**Fuentes citadas:** compras.txt, exportaciones.txt, ventas.txt, alimentacion.txt, rentabilidad.txt

### P8: ¿Cuál es la planilla mensual del centro de cultivo Los Lagos?

**Respuesta del asistente:**

> La planilla mensual del centro de cultivo Los Lagos es **$18,050,000 CLP**.  
[Fuente: tabla empleados / vistas v_empleados, v_planilla_por_centro, v_planilla_por_cargo]

**Fuentes citadas:** empleados.txt, rentabilidad.txt, concesiones.txt, lotes_detalle.txt, calidad.txt

### P9: ¿Qué productos del inventario están bajo su stock mínimo?

**Respuesta del asistente:**

> Los ítems que están bajo su stock mínimo son:

- **Alimento Extruido 9 mm** (alimento): 8 500 unidades (stock mínimo 16 000).  
- **Vacuna ISA** (medicamentos): 600 unidades (stock mínimo 800).  
- **Red de cultivo 30 mm** (herramientas): 15 unidades (stock mínimo 18).  

[Fuente: tabla inventario / vistas v_inventario_resumen, v_stock_bajo]

**Fuentes citadas:** inventario.txt, clientes.txt, exportacion_calidad.txt, requisitos_exportacion.txt

### P10: ¿Qué proveedor facturó más durante el periodo y en qué rubro?

**Respuesta del asistente:**

> El proveedor que facturó más durante el periodo fue **Transportes Austral**, con un total de **$60 500 000 CLP**, perteneciente al rubro **Logística y transporte**.  
[Fuente: REPORTE DE COMPRAS Y PROVEEDORES - SalmoSUR S.A.]

**Fuentes citadas:** compras.txt, clientes.txt, ventas.txt, inventario.txt

### P11: ¿Cuál es el principal destino de las exportaciones por valor FOB?

**Respuesta del asistente:**

> El principal destino de las exportaciones por valor FOB es **Estados Unidos**, con un valor FOB de $3 435 300 000 CLP.  
[Fuente: tabla exportaciones / vistas v_exportaciones_por_destino, v_exportaciones_resumen]

**Fuentes citadas:** exportaciones.txt, exportacion_calidad.txt, calidad.txt, compras.txt

### P12: ¿Qué centro de cultivo concentra la mayor biomasa y cuántos kilos tiene?

**Respuesta del asistente:**

> El centro de cultivo que concentra la mayor biomasa es **Los Lagos**, con **835 200 kg** de biomasa.  
[Fuente: tabla lotes_detalle / vistas v_lotes_detalle, v_biomasa_por_centro]

**Fuentes citadas:** lotes_detalle.txt, calidad.txt

### P13: ¿Cuántos incidentes de severidad crítica se registraron y de qué tipo son?

**Respuesta del asistente:**

> Se registraron **2 incidentes de severidad crítica**, y **ambos fueron del tipo escape**.  
[Fuente: REPORTE DE INCIDENTES Y SEGURIDAD - SalmoSUR S.A.]

**Fuentes citadas:** incidentes.txt, protocolo_accidentes_laborales.txt, mortalidad.txt

### P14: ¿Qué lote tiene el FCR más bajo y en qué centro se encuentra?

**Respuesta del asistente:**

> El lote con el FCR más bajo es **LOTE‑H1** (Salmón Coho) y se encuentra en el centro de **Quellón**, con un FCR de 1.10.  
[Fuente: LOTES DE CULTIVO DETALLADOS]

**Fuentes citadas:** lotes_detalle.txt, inventario.txt, empleados.txt, monitoreo_sanitario.txt, concesiones.txt

### P15: ¿Qué lote tiene el mayor promedio de caligus según el monitoreo sanitario?

**Respuesta del asistente:**

> El lote con el mayor promedio de caligus (hembras ovígeras) del periodo es **LOTE‑B1**. [Fuente: MONITOREO_SANITARIO_Y_AMBIENTAL_MENSUAL]

**Fuentes citadas:** monitoreo_sanitario.txt, monitoreo_sanitario_salmon.txt

### P16: ¿Qué concesión de la empresa tiene la mayor superficie autorizada y cuántas hectáreas son?

**Respuesta del asistente:**

> La concesión con la mayor superficie autorizada es **Centro Aysén**, con **18.00 hectáreas**.  
[Fuente: CONCESIONES ACUÍCOLAS - SalmoSUR S.A.]

**Fuentes citadas:** concesiones.txt, empleados.txt, calidad.txt, mercado_salmon.txt, rentabilidad.txt

### P17: ¿Cuánto alimento se entregó al lote A1 en mayo de 2025?

**Respuesta del asistente:**

> Se entregaron **105 000 kg** de alimento (Extruido 9 mm) al lote A1 en mayo de 2025.  
[Fuente: ALIMENTACIÓN POR LOTE (RACIONES ENTREGADAS)]

**Fuentes citadas:** alimentacion.txt, exportaciones.txt, ventas.txt, inventario.txt, lotes_detalle.txt

### P18: ¿Qué cliente de Japón compra salmón a la empresa y qué producto principal adquiere?

**Respuesta del asistente:**

> Nippon Marine Trading (Japón) es el cliente que compra salmón a la empresa, y su producto principal es **Salmón Coho entero fresco**.  
[Fuente: contexto]

**Fuentes citadas:** clientes.txt, mercado_salmon.txt, exportacion_calidad.txt, exportaciones.txt, requisitos_exportacion.txt
