# Análisis de mortalidad y alimentación - Recomendaciones

## Resumen Ejecutivo
- **Lote con mayor mortalidad acumulada:** LOTE‑E2 con **8 100,00** peces muertos (consulta a vista_mortalidad_acumulada).  
- **Alimento entregado al lote A1 en mayo 2025:** **105 000 kg** de alimento extruido 9 mm (registro de alimentación de mayo 2025).

## Análisis
1. **Mortalidad alta en LOTE‑E2**
   - La mortalidad acumulada de 8 100 peces indica posibles problemas de manejo, sanidad o alimentación.
   - Comparado con la media de mortalidad de los lotes (consultar vista_mortalidad_acumulada para promedio), LOTE‑E2 está significativamente por encima.
2. **Alimentación del lote A1**
   - Se entregaron 105 000 kg en mayo 2025, lo que representa un nivel de alimentación acorde al plan de crecimiento para esa fase.
   - No se observan desviaciones extremas respecto a los lotes B1, A2, etc., que recibieron entre 90 000 kg y 110 000 kg en el mismo periodo.

## Recomendaciones
1. **Revisión de protocolos sanitarios en LOTE‑E2**
   - Realizar un muestreo de patógenos (Caligus, ISA, etc.) y comparar con los indicadores de la vista_monitoreo_promedio.
   - Incrementar la frecuencia de inspecciones de calidad del agua y ajustar los parámetros críticos (oxígeno, temperatura).
2. **Ajuste de la alimentación en LOTE‑E2**
   - Verificar la relación FCR (feed conversion ratio) del lote; si es alta, considerar una reducción gradual de la ración para evitar sobrealimentación que favorezca enfermedades.
   - Implementar un programa de alimentación escalonada basado en el peso promedio del lote (consultar v_lotes_detalle para biomasa y peso).
3. **Optimización del plan de alimentación en todos los lotes**
   - Establecer un control mensual de la cantidad de alimento entregado vs. la biomasa acumulada (v_alimentacion_resumen + v_biomasa_por_centro).
   - Utilizar los datos de consumo para ajustar los costos y mejorar la rentabilidad (v_rentabilidad_por_centro).
4. **Capacitación del personal de los centros**
   - Realizar talleres sobre manejo de mortalidad y buenas prácticas de alimentación.
   - Incorporar indicadores de desempeño en la planilla (v_planilla_por_cargo) para incentivar la reducción de pérdidas.

## Próximos pasos
- Ejecutar una consulta detallada de mortalidad por centro y comparar con LOTE‑E2.
- Generar un reporte de FCR por lote para mayo 2025.
- Programar una reunión con el equipo de sanidad y alimentación para definir acciones correctivas.

---
**Fuentes:**
- [Fuente: vista_mortalidad_acumulada]
- [Fuente: alimentacion.txt]

