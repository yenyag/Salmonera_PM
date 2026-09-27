# Resultados de Pruebas de Coherencia - SalmoSUR S.A.

**Fecha de ejecución:** 2026-09-27 17:10
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

> El lote con mayor mortalidad acumulada es LOTE-E2, con un total de 8100 unidades.

[Fuente: tabla lotes / vista vista_mortalidad_acumulada]

**Fuentes citadas:** mortalidad.txt, monitoreo_sanitario_salmon.txt, monitoreo_sanitario.txt, bioseguridad.txt, sernapesca_normativa.txt

### P2: ¿Cuáles fueron las ventas de enero de 2025 y cuál fue el total semestral?

**Respuesta del asistente:**

> Las ventas de enero de 2025 fueron de $1,510,000,000 CLP. El total acumulado del periodo (semestral) fue de $11,234,000,000 CLP.

[Fuente: tabla ventas / vista v_ventas_por_mes]

**Fuentes citadas:** ventas.txt, exportaciones.txt, compras.txt, monitoreo_sanitario.txt, alimentacion.txt

### P3: ¿Qué centro es el más rentable y cuánto generó?

**Respuesta del asistente:**

> El centro más rentable es el Centro Los Lagos, el cual generó ingresos por $3,550,000,000 CLP.

[Fuente: REPORTE DE RENTABILIDAD POR CENTRO - SalmoSUR S.A.]

**Fuentes citadas:** empleados.txt, rentabilidad.txt, mercado_salmon.txt, concesiones.txt, compras.txt, ventas.txt, alimentacion.txt

### P4: ¿Cuántas toneladas se cosecharon de calidad premium y de descarte?

**Respuesta del asistente:**

> Se cosecharon 480 toneladas de calidad premium y 50 toneladas de calidad descarte.

[Fuente: DISTRIBUCIÓN DE COSECHAS POR CALIDAD - SalmoSUR S.A.]

**Fuentes citadas:** calidad.txt, mercado_salmon.txt, alimentacion.txt, exportaciones.txt, compras.txt, lotes_detalle.txt

### P5: ¿Qué lote tiene mayor mortalidad y qué recomiendas según la normativa de bioseguridad?

**Respuesta del asistente:**

> El lote con mayor mortalidad acumulada es el **LOTE-E2**, con **8100 unidades**.

Según la normativa de bioseguridad y las buenas prácticas descritas, se recomienda:
1. Activar los planes de contingencia sanitaria de la empresa.
2. Notificar a Sernapesca, ya que una mortalidad acumulada elevada es un indicador de alerta temprana.
3. Retirar a diario las mortalidades del agua para evitar su descomposición y la diseminación de patógenos, manejándolas conforme a la normativa de Sernapesca.
4. Realizar monitoreo sanitario periódico del stock.

[Fuente: tabla lotes / vista vista_mortalidad_acumulada]
[Fuente: Sernapesca - Buenas prácticas en acuicultura (https://www.sernapesca.cl/)]
[Fuente: Buenas prácticas de bioseguridad en centros de cultivo de salmón]

**Fuentes citadas:** sernapesca_normativa.txt, bioseguridad.txt, monitoreo_sanitario_salmon.txt, mortalidad.txt

### P6: ¿Qué requisitos debe cumplir el salmón para su exportación?

**Respuesta del asistente:**

> El salmón chileno debe cumplir con los siguientes requisitos para ser exportado:

1. Trazabilidad completa del lote de origen: todos los productos exportados deben poder rastrearse hasta el centro de cultivo de procedencia.
2. Certificado sanitario de exportación emitido por Sernapesca.
3. Cumplimiento de los estándares de calidad e inocuidad del país de destino (los principales mercados son Unión Europea, Estados Unidos, Japón y Brasil).
4. Control de residuos de medicamentos veterinarios dentro de los límites permitidos por la normativa internacional.

Adicionalmente, se establecen los siguientes requisitos normativos:
5. Los centros de cultivo deben cumplir con los protocolos de vacunación contra las enfermedades que afectan a los salmónidos, como la anemia infecciosa del salmón (ISA), la piscirickettsiosis y la caligidosis.
6. Todo movimiento de peces (siembra, traslado, cosecha) debe contar con la autorización sanitaria correspondiente emitida por Sernapesca.

[Fuente: Sernapesca - Exportaciones de salmón (https://www.sernapesca.cl/)]
[Fuente: Sernapesca - Requisitos de exportación de salmón (https://www.sernapesca.cl/)]
[Fuente: Sernapesca - Normativa de acuicultura (https://www.sernapesca.cl/)]

**Fuentes citadas:** exportacion_calidad.txt, requisitos_exportacion.txt, sernapesca_normativa.txt, exportaciones.txt, mercado_salmon.txt

### P7: ¿Cuánto pagó la empresa en impuestos a la renta durante 2024?

**Respuesta del asistente:**

> No tengo información suficiente para responder eso.

**Fuentes citadas:** compras.txt, exportaciones.txt, ventas.txt, alimentacion.txt, rentabilidad.txt

### P8: ¿Cuál es la planilla mensual del centro de cultivo Los Lagos?

**Respuesta del asistente:**

> La planilla mensual del centro de cultivo Los Lagos es de $18,050,000 CLP.

[Fuente: PLANILLA Y DOTACIÓN DE PERSONAL - SalmoSUR S.A.]

**Fuentes citadas:** empleados.txt, rentabilidad.txt, concesiones.txt, lotes_detalle.txt, calidad.txt

### P9: ¿Qué productos del inventario están bajo su stock mínimo?

**Respuesta del asistente:**

> Los productos del inventario que están bajo su stock mínimo son:

1. **Alimento Extruido 9mm** (categoría: alimento): tiene 8,500 unidades, con un stock mínimo de 16,000.
2. **Vacuna ISA** (categoría: medicamentos): tiene 600 unidades, con un stock mínimo de 800.
3. **Red de cultivo 30mm** (categoría: herramientas): tiene 15 unidades, con un stock mínimo de 18.

[Fuente: tabla inventario / vistas v_inventario_resumen, v_stock_bajo]

**Fuentes citadas:** inventario.txt, clientes.txt, exportacion_calidad.txt, requisitos_exportacion.txt

### P10: ¿Qué proveedor facturó más durante el periodo y en qué rubro?

**Respuesta del asistente:**

> El proveedor que mayor monto facturó fue Transportes Austral, con un total de $60,500,000 CLP, en el rubro de Logística y transporte.

[Fuente: REPORTE DE COMPRAS Y PROVEEDORES - SalmoSUR S.A.]

**Fuentes citadas:** compras.txt, clientes.txt, ventas.txt, inventario.txt

### P11: ¿Cuál es el principal destino de las exportaciones por valor FOB?

**Respuesta del asistente:**

> El principal destino de las exportaciones por valor FOB es Estados Unidos, con un monto de $3,435,300,000 CLP.

[Fuente: REPORTE DE EXPORTACIONES - SalmoSUR S.A.]

**Fuentes citadas:** exportaciones.txt, exportacion_calidad.txt, calidad.txt, compras.txt

### P12: ¿Qué centro de cultivo concentra la mayor biomasa y cuántos kilos tiene?

**Respuesta del asistente:**

> El centro de cultivo que concentra la mayor biomasa es Los Lagos, con 835,200 kg.

[Fuente: tabla lotes_detalle / vistas v_lotes_detalle, v_biomasa_por_centro]

**Fuentes citadas:** lotes_detalle.txt, calidad.txt

### P13: ¿Cuántos incidentes de severidad crítica se registraron y de qué tipo son?

**Respuesta del asistente:**

> Se registraron 2 incidentes de severidad crítica, todos del tipo escape.

[Fuente: REPORTE DE INCIDENTES Y SEGURIDAD - SalmoSUR S.A.]

**Fuentes citadas:** incidentes.txt, protocolo_accidentes_laborales.txt, mortalidad.txt

### P14: ¿Qué lote tiene el FCR más bajo y en qué centro se encuentra?

**Respuesta del asistente:**

> El lote con el FCR más bajo es el LOTE-H1 de Salmón Coho, con un FCR de 1.10, y se encuentra en el centro de Quellón.

[Fuente: LOTES DE CULTIVO DETALLADOS - SalmoSUR S.A.]

**Fuentes citadas:** lotes_detalle.txt, inventario.txt, empleados.txt, monitoreo_sanitario.txt, concesiones.txt

### P15: ¿Qué lote tiene el mayor promedio de caligus según el monitoreo sanitario?

**Respuesta del asistente:**

> El lote con el mayor promedio de caligus (hembras ovígeras) del periodo es el LOTE-B1, con un promedio de 4.48.

[Fuente: MONITOREO SANITARIO Y AMBIENTAL MENSUAL - SalmoSUR S.A.]

**Fuentes citadas:** monitoreo_sanitario.txt, monitoreo_sanitario_salmon.txt

### P16: ¿Qué concesión de la empresa tiene la mayor superficie autorizada y cuántas hectáreas son?

**Respuesta del asistente:**

> La concesión con la mayor superficie autorizada es Centro Aysén, con 18.00 hectáreas.

[Fuente: CONCESIONES ACUÍCOLAS - SalmoSUR S.A.]

**Fuentes citadas:** concesiones.txt, empleados.txt, calidad.txt, mercado_salmon.txt, rentabilidad.txt

### P17: ¿Cuánto alimento se entregó al lote A1 en mayo de 2025?

**Respuesta del asistente:**

> Al lote A1 se le entregaron 105,000 kg de alimento (Extruido 9mm) en mayo de 2025.

[Fuente: ALIMENTACIÓN POR LOTE (RACIONES ENTREGADAS) - SalmoSUR S.A.]

**Fuentes citadas:** alimentacion.txt, exportaciones.txt, ventas.txt, inventario.txt, lotes_detalle.txt

### P18: ¿Qué cliente de Japón compra salmón a la empresa y qué producto principal adquiere?

**Respuesta del asistente:**

> El cliente de Japón es Nippon Marine Trading, cuyo contacto es Kenji Tanaka, gerente de importación. El producto principal que adquiere es Salmón Coho entero fresco.

[Fuente: CLIENTES VIGENTES - SalmoSUR S.A.]

**Fuentes citadas:** clientes.txt, mercado_salmon.txt, exportacion_calidad.txt, exportaciones.txt, requisitos_exportacion.txt
