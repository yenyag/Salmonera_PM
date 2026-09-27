# Análisis de mortalidad y alimentación – Recomendaciones

## Resumen Ejecutivo
- **Lote con mayor mortalidad acumulada:** **LOTE‑E2** con **8 100,00** unidades de mortalidad total.  
  [Fuente: vista_mortalidad_acumulada]
- **Alimentación total entregada al lote LOTE‑A1:** **438 000,00 kg** (costo 385 440 000 CLP).  
  [Fuente: v_alimentacion_resumen]
- **Alimentación en mayo 2025:** No se dispone de datos mensuales por lote en la base actual.  
  [Fuente: No disponible]

## Análisis
1. **Mortalidad alta en LOTE‑E2** indica posibles problemas sanitarios, manejo o alimentación inadecuada.  
2. **LOTE‑A1** muestra el mayor consumo total de alimento, lo que sugiere una biomasa elevada o un programa de alimentación intensivo.
3. La falta de datos mensuales impide correlacionar directamente la mortalidad con la alimentación en periodos específicos.

## Recomendaciones
1. **Auditoría sanitaria del lote E2**:
   - Revisar historial de incidentes (parásitos, enfermedades) en `v_incidentes_por_tipo` y `v_incidentes_por_severidad`.
   - Incrementar monitoreo de caligus y otros patógenos (`v_monitoreo_promedio`).
2. **Optimización de la alimentación**:
   - Implementar registro mensual de raciones por lote (añadir columna `mes` a `v_alimentacion_resumen` o crear vista `v_alimentacion_mensual`).
   - Comparar FCR (`v_lotes_detalle.fcr`) con la cantidad de alimento entregado para detectar sobre‑alimentación.
3. **Gestión de riesgo**:
   - Evaluar la relación mortalidad‑alimentación en los lotes con mayor consumo (A1, B1) para identificar patrones.
   - Ajustar la densidad de siembra en lotes con mortalidad > 7 000 para reducir estrés.
4. **Mejora de datos**:
   - Incorporar reporte mensual de alimentación por lote en el ERP para permitir análisis como el solicitado.
   - Capacitar al personal de planta en registro preciso de entregas diarias.

## Próximos pasos
- Generar consulta a `v_incidentes_por_tipo` y `v_incidentes_por_severidad` para el lote E2.
- Solicitar al área de producción el detalle de raciones entregadas por mes (abril‑julio 2025) para validar la correlación con mortalidad.
- Programar reunión con el equipo de nutrición y sanidad para definir ajustes en la dieta y protocolos de vigilancia.

*Este informe se genera automáticamente a partir de los datos disponibles en el sistema de gestión de SalmoSUR S.A.*
