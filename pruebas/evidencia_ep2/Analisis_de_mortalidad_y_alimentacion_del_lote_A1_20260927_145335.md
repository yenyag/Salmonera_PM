# Análisis de mortalidad y alimentación del lote A1

## Resumen de hallazgos
- **Lote con mayor mortalidad acumulada:** LOTE-E2 con 8,100.00 unidades de mortalidad total. [Fuente: vista_mortalidad_acumulada]
- **Alimentación del lote A1 en mayo de 2025:** No se dispone de datos mensuales de alimentación en la vista `v_alimentacion_resumen`; la vista solo contiene totales acumulados por lote sin desglose por mes. [Fuente: v_alimentacion_resumen]

## Recomendaciones
1. **Implementar registro mensual de alimentación:** Crear o habilitar una vista/tablas que capture `mes` y `total_kg` por lote para permitir análisis de correlación entre alimentación y mortalidad.
2. **Revisar protocolos de manejo del lote LOTE-E2:** Dada su alta mortalidad, evaluar factores como densidad, calidad del agua, y programa de alimentación.
3. **Monitoreo continuo:** Establecer indicadores clave (KPIs) de mortalidad y consumo de alimento por lote y mes, con alertas automáticas cuando se superen umbrales definidos.
4. **Auditoría de proveedores de alimento:** Verificar que el costo y la calidad del alimento entregado al lote A1 sean consistentes con los estándares de la empresa.
5. **Capacitación del personal:** Refrescar entrenamiento en detección temprana de enfermedades y ajustes de ración según fase de crecimiento.

## Próximos pasos
- Solicitar al área de TI la creación de una vista `v_alimentacion_mensual(lote_codigo, mes, total_kg, total_costo_clp)`.
- Realizar un análisis comparativo entre mortalidad y alimentación una vez disponible la información mensual.

*Este reporte se genera automáticamente a partir de los datos disponibles en el sistema.*
