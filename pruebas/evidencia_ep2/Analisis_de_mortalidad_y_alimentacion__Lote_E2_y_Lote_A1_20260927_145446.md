# Análisis de mortalidad y alimentación – Lote E2 y Lote A1

## Resumen de hallazgos
- **Lote con mayor mortalidad acumulada:** LOTE‑E2 con **8 100,00** unidades de mortalidad total. [Fuente: vista_mortalidad_acumulada]
- **Alimentación del Lote A1:** El registro disponible en la vista *v_alimentacion_resumen* indica que el lote A1 recibió **438 000,00 kg** de alimento, con un costo total de **385 440 000,00 CLP**. No se dispone de desglose por mes, por lo que no es posible confirmar la cantidad entregada específicamente en mayo de 2025. [Fuente: v_alimentacion_resumen]

## Recomendaciones basadas en los datos
1. **Investigación de la alta mortalidad en LOTE‑E2**
   - Revisar los indicadores de salud (p.ej., monitoreo de caligus, calidad del agua) del lote E2.
   - Comparar el FCR y la biomasa del lote con los promedios de la granja para identificar desviaciones.
   - Implementar un plan de mitigación de enfermedades y ajustar la densidad de cultivo si corresponde.
2. **Optimización de la alimentación del Lote A1**
   - Dado el alto volumen de alimento (438 000 kg), validar que el FCR del lote se mantenga dentro del rango objetivo (≤1.2).
   - Establecer un registro mensual de raciones para poder analizar la relación entre alimentación y mortalidad.
   - Evaluar la posibilidad de ajustar la dieta según la fase de crecimiento para reducir costos sin afectar el crecimiento.
3. **Integración de datos mensuales**
   - Incorporar un detalle mensual de alimentación en la vista *v_alimentacion_resumen* (columna `mes`) para permitir análisis más finos como el solicitado para mayo 2025.
   - Automatizar la generación de reportes mensuales que crucen mortalidad y alimentación por lote.
4. **Seguimiento continuo**
   - Generar alertas automáticas cuando la mortalidad mensual supere el 5 % del total del lote.
   - Implementar un dashboard que muestre en tiempo real la mortalidad acumulada y el consumo de alimento por lote.

## Próximos pasos
- Solicitar al equipo de datos la inclusión del campo `mes` en la vista de alimentación.
- Realizar una auditoría de salud del lote E2 en la próxima visita de campo.
- Programar una reunión con el área de nutrición para revisar la formulación de la dieta del lote A1.

*Este informe se genera automáticamente a partir de los datos disponibles en el sistema de gestión de SalmoSUR.*
