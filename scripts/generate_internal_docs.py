#!/usr/bin/env python3
"""
FASE 2 - Generador de documentos internos para RAG (SalmoSUR S.A.)
--------------------------------------------------------------------
Lee la base de datos PostgreSQL de la salmonera y genera documentos de
texto en español en data/interna/ para alimentar el pipeline RAG.

Recorre 10 dimensiones operativas:
   1. Ventas mensuales          (tabla ventas)
   2. Distribución por calidad  (tabla cosechas)
   3. Mortalidad por lote       (tabla lotes)
   4. Rentabilidad por centro   (tabla centros)
   5. Planilla y dotación       (tabla empleados)
   6. Inventario de insumos     (tabla inventario)
   7. Compras y proveedores     (tablas compras, proveedores)
   8. Exportaciones             (tabla exportaciones)
   9. Lotes de cultivo          (tabla lotes_detalle)
  10. Incidentes y seguridad    (tabla incidentes)

Uso:
    python scripts/generate_internal_docs.py

Requisitos:
    - PostgreSQL corriendo con BD salmonera_pm cargada (schema.sql)
    - Variables de entorno (o defaults) de conexión
    - Paquete: pip install psycopg2-binary
"""

import os
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("Falta psycopg2. Instala con: pip install psycopg2-binary")
    raise

# --- Configuración de conexión (igual que server.js) -----------------------
PGHOST = os.getenv("PGHOST", "localhost")
PGPORT = int(os.getenv("PGPORT", "5432"))
PGUSER = os.getenv("PGUSER", "salmonera")
PGPASSWORD = os.getenv("PGPASSWORD", "salmonera123")
PGDATABASE = os.getenv("PGDATABASE", "salmonera_pm")

# --- Salida ----------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "data" / "interna"


def conectar():
    return psycopg2.connect(
        host=PGHOST,
        port=PGPORT,
        user=PGUSER,
        password=PGPASSWORD,
        dbname=PGDATABASE,
    )


def mes_en_espanol(fecha):
    """Convierte '2025-01-01' a 'Enero 2025'."""
    meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ]
    try:
        anio, mes, _ = fecha.split("-")[:3]
        return f"{meses[int(mes) - 1]} {anio}"
    except (ValueError, IndexError):
        return fecha


def generar_ventas(cur):
    """Ventas mensuales en CLP."""
    cur.execute(
        "SELECT mes, total_mensual FROM v_ventas_por_mes ORDER BY mes"
    )
    filas = cur.fetchall()
    if not filas:
        return []

    total = sum(float(f[1]) for f in filas)
    mejor_mes, mayor_venta = max(filas, key=lambda f: float(f[1]))

    doc = []
    doc.append("REPORTE DE VENTAS MENSUALES - SalmoSUR S.A.")
    doc.append("=" * 40)
    doc.append("La siguiente información resume las ventas mensuales de la empresa en pesos chilenos (CLP).")
    doc.append("")
    for fecha, monto in filas:
        doc.append(f"- En {mes_en_espanol(str(fecha))}, las ventas totales fueron ${float(monto):,.0f} CLP.")
    doc.append("")
    doc.append(f"El total acumulado del periodo fue de ${total:,.0f} CLP.")
    doc.append(f"El mes con mayor venta fue {mes_en_espanol(str(mejor_mes))} con ${float(mayor_venta):,.0f} CLP.")
    doc.append("")
    doc.append("Fuente: tabla ventas / vista v_ventas_por_mes.")
    return doc


def generar_calidad(cur):
    """Distribución de cosechas por calidad."""
    cur.execute(
        "SELECT calidad, cantidad_cosechas FROM vista_distribucion_por_calidad "
        "ORDER BY cantidad_cosechas DESC"
    )
    filas = cur.fetchall()
    if not filas:
        return []

    doc = []
    doc.append("DISTRIBUCIÓN DE COSECHAS POR CALIDAD - SalmoSUR S.A.")
    doc.append("=" * 40)
    doc.append("La siguiente información detalla el volumen cosechado según la clasificación de calidad del producto.")
    doc.append("")
    etiquetas = {
        "premium": "calidad premium",
        "exportacion": "calidad de exportación",
        "mercado_local": "calidad mercado local",
        "descarte": "calidad descarte",
    }
    total = sum(float(f[1]) for f in filas)
    for calidad, cantidad in filas:
        nombre = etiquetas.get(calidad, calidad)
        porc = (float(cantidad) / total * 100) if total else 0
        doc.append(f"- Se cosecharon {int(cantidad)} unidades de {nombre} ({porc:.1f}% del total).")
    doc.append("")
    doc.append(f"El volumen total cosechado fue de {int(total)} unidades.")
    doc.append("")
    doc.append("Fuente: tabla cosechas / vista vista_distribucion_por_calidad.")
    return doc


def generar_mortalidad(cur):
    """Mortalidad acumulada por lote."""
    cur.execute(
        "SELECT lote_codigo, mortalidad_total FROM vista_mortalidad_acumulada "
        "ORDER BY mortalidad_total DESC"
    )
    filas = cur.fetchall()
    if not filas:
        return []

    peor_lote, peor_mortalidad = filas[0]

    doc = []
    doc.append("REPORTE DE MORTALIDAD ACUMULADA POR LOTE - SalmoSUR S.A.")
    doc.append("=" * 40)
    doc.append("La siguiente información detalla la mortalidad acumulada (en unidades) de cada lote de cultivo.")
    doc.append("")
    for lote, mortalidad in filas:
        doc.append(f"- El lote {lote} registró una mortalidad acumulada de {int(mortalidad)} unidades.")
    doc.append("")
    doc.append(f"El lote con MAYOR mortalidad es {peor_lote} con {int(peor_mortalidad)} unidades, "
               "lo que indica un posible problema sanitario o de manejo que requiere atención.")
    doc.append("")
    doc.append("Fuente: tabla lotes / vista vista_mortalidad_acumulada.")
    return doc


def generar_rentabilidad(cur):
    """Rentabilidad (ingresos) por centro."""
    cur.execute(
        "SELECT centro_nombre, total_ingresos_clp FROM vista_rentabilidad_por_centro "
        "ORDER BY total_ingresos_clp DESC"
    )
    filas = cur.fetchall()
    if not filas:
        return []

    mejor_centro, mayor_ingreso = filas[0]

    doc = []
    doc.append("REPORTE DE RENTABILIDAD POR CENTRO - SalmoSUR S.A.")
    doc.append("=" * 40)
    doc.append("La siguiente información detalla los ingresos totales (CLP) generados por cada centro de cultivo.")
    doc.append("")
    for centro, ingreso in filas:
        doc.append(f"- El {centro} generó ingresos por ${float(ingreso):,.0f} CLP.")
    doc.append("")
    doc.append(f"El centro con MAYOR rentabilidad es {mejor_centro} con ${float(mayor_ingreso):,.0f} CLP de ingresos.")
    doc.append("")
    doc.append("Fuente: tabla centros / vista vista_rentabilidad_por_centro.")
    return doc


def generar_empleados(cur):
    """Dotación y planilla de remuneraciones."""
    cur.execute(
        "SELECT nombre_completo, cargo, salario_clp FROM v_empleados ORDER BY salario_clp DESC"
    )
    filas = cur.fetchall()
    if not filas:
        return []

    cur.execute("SELECT centro_nombre, planilla_clp FROM v_planilla_por_centro ORDER BY centro_nombre")
    por_centro = cur.fetchall()
    cur.execute("SELECT cargo, n_empleados, planilla_clp FROM v_planilla_por_cargo ORDER BY planilla_clp DESC")
    por_cargo = cur.fetchall()

    doc = []
    doc.append("PLANILLA Y DOTACIÓN DE PERSONAL - SalmoSUR S.A.")
    doc.append("=" * 40)
    mayor_centro, mayor_planilla = max(por_centro, key=lambda c: float(c[1]))
    mayor_cargo, _, _ = por_cargo[0]
    doc.append("SUMARIO EJECUTIVO:")
    doc.append(f"- El centro con la mayor planilla mensual es {mayor_centro} con ${float(mayor_planilla):,.0f} CLP.")
    doc.append(f"- El cargo con la mayor planilla es {mayor_cargo}.")
    doc.append("")
    doc.append("La siguiente información detalla la dotación de empleados y la planilla mensual de remuneraciones en CLP.")
    doc.append("")
    for nombre, cargo, salario in filas:
        doc.append(f"- {nombre} se desempeña como {cargo} y recibe un salario mensual de ${float(salario):,.0f} CLP.")
    doc.append("")
    doc.append("Dotación por centro de cultivo:")
    for centro, planilla in por_centro:
        doc.append(f"- {centro}: planilla mensual de ${float(planilla):,.0f} CLP.")
    doc.append("")
    doc.append("Remuneraciones por cargo:")
    for cargo, n, planilla in por_cargo:
        doc.append(f"- {cargo}: {int(n)} personas, planilla total de ${float(planilla):,.0f} CLP.")
    doc.append("")
    doc.append("Fuente: tabla empleados / vistas v_empleados, v_planilla_por_centro, v_planilla_por_cargo.")
    return doc


def generar_inventario(cur):
    """Inventario de insumos y alertas de stock bajo."""
    cur.execute(
        "SELECT categoria, n_items, valor_total_clp FROM v_inventario_resumen ORDER BY valor_total_clp DESC"
    )
    resumen = cur.fetchall()
    cur.execute("SELECT nombre, stock, stock_minimo, categoria FROM v_stock_bajo ORDER BY (stock_minimo - stock) DESC")
    bajo = cur.fetchall()
    if not resumen:
        return []

    doc = []
    doc.append("INVENTARIO DE INSUMOS (ALIMENTO, MEDICAMENTOS, HERRAMIENTAS, EQUIPOS) - SalmoSUR S.A.")
    doc.append("=" * 40)
    mayor_cat, _, mayor_valor = resumen[0]
    bajo_nombres = ", ".join(f[0] for f in bajo) if bajo else "ninguno"
    doc.append("SUMARIO EJECUTIVO:")
    doc.append(f"- La categoría de mayor valor es {mayor_cat} con ${float(mayor_valor):,.0f} CLP.")
    doc.append(f"- Ítems bajo su stock mínimo: {bajo_nombres}.")
    doc.append("")
    doc.append("La siguiente información resume el valor del inventario de insumos por categoría.")
    doc.append("")
    for categoria, n, valor in resumen:
        doc.append(f"- En la categoría {categoria} existen {int(n)} ítems con un valor total de ${float(valor):,.0f} CLP.")
    doc.append("")
    if bajo:
        doc.append("ALERTAS DE STOCK BAJO (ítems bajo su stock mínimo):")
        for nombre, stock, minimo, categoria in bajo:
            doc.append(f"- {nombre} ({categoria}) tiene {float(stock):,.0f} unidades y su stock mínimo es {float(minimo):,.0f}.")
    else:
        doc.append("No existen ítems bajo su stock mínimo.")
    doc.append("")
    doc.append("Fuente: tabla inventario / vistas v_inventario_resumen, v_stock_bajo.")
    return doc


def generar_compras(cur):
    """Gasto por proveedor y compras recientes."""
    cur.execute("SELECT proveedor, rubro, total_clp FROM v_gasto_por_proveedor ORDER BY total_clp DESC")
    por_proveedor = cur.fetchall()
    cur.execute(
        "SELECT proveedor, producto, cantidad, valor_clp, fecha FROM v_compras_recientes ORDER BY fecha DESC"
    )
    recientes = cur.fetchall()
    if not por_proveedor:
        return []

    total_gastado = sum(float(f[2]) for f in por_proveedor)
    mejor_proveedor, mejor_rubro = por_proveedor[0][0], por_proveedor[0][1]

    doc = []
    doc.append("REPORTE DE COMPRAS Y PROVEEDORES - SalmoSUR S.A.")
    doc.append("=" * 40)
    doc.append("SUMARIO EJECUTIVO:")
    doc.append(f"- El proveedor que MAYOR monto facturó fue {mejor_proveedor} con ${float(por_proveedor[0][2]):,.0f} CLP (rubro {mejor_rubro}).")
    doc.append(f"- El gasto total en compras del periodo fue de ${total_gastado:,.0f} CLP.")
    doc.append("")
    doc.append("La siguiente información detalla el gasto en compras por proveedor durante el periodo.")
    doc.append("")
    for proveedor, rubro, total in por_proveedor:
        doc.append(f"- {proveedor} (rubro {rubro}) facturó un total de ${float(total):,.0f} CLP.")
    doc.append("")
    doc.append("Compras recientes:")
    for proveedor, producto, cantidad, valor, fecha in recientes[:10]:
        doc.append(f"- El {fecha} se compraron {float(cantidad):,.0f} unidades de {producto} a {proveedor} por ${float(valor):,.0f} CLP.")
    doc.append("")
    doc.append("Fuente: tablas proveedores y compras / vistas v_gasto_por_proveedor, v_compras_recientes.")
    return doc


def generar_exportaciones(cur):
    """Exportaciones por destino y resumen mensual (enero a junio 2025)."""
    cur.execute(
        "SELECT pais_destino, n_envios, total_kilos, total_fob_clp FROM v_exportaciones_por_destino ORDER BY total_fob_clp DESC"
    )
    por_destino = cur.fetchall()
    cur.execute("SELECT mes, n_envios, total_kilos, total_fob_clp FROM v_exportaciones_resumen ORDER BY mes")
    por_mes = cur.fetchall()
    if not por_destino:
        return []

    total_fob = sum(float(f[3]) for f in por_destino)

    doc = []
    doc.append("REPORTE DE EXPORTACIONES - SalmoSUR S.A.")
    doc.append("=" * 40)
    dest_max, _, _, fob_max = por_destino[0]
    doc.append("SUMARIO EJECUTIVO:")
    doc.append(f"- El principal destino por valor FOB es {dest_max} con ${float(fob_max):,.0f} CLP.")
    doc.append(f"- El valor FOB acumulado del periodo fue de ${total_fob:,.0f} CLP.")
    doc.append("")
    doc.append("La siguiente información detalla las exportaciones de salmón entre enero y junio de 2025, en toneladas y valor FOB en CLP.")
    doc.append("")
    for pais, n, kilos, fob in por_destino:
        doc.append(f"- Hacia {pais} se realizaron {int(n)} envíos por {float(kilos):,.0f} kg y un valor FOB de ${float(fob):,.0f} CLP.")
    doc.append("")
    for mes, n, kilos, fob in por_mes:
        doc.append(f"- En {mes_en_espanol(str(mes))}: {int(n)} envíos, {float(kilos):,.0f} kg y ${float(fob):,.0f} CLP FOB.")
    doc.append("")
    doc.append(f"El valor FOB acumulado del periodo fue de ${total_fob:,.0f} CLP.")
    doc.append("")
    doc.append("Fuente: tabla exportaciones / vistas v_exportaciones_por_destino, v_exportaciones_resumen.")
    return doc


def generar_lotes(cur):
    """Lotes de cultivo y biomasa por centro."""
    cur.execute(
        "SELECT lote_codigo, especie, centro_nombre, unidades_sembradas, biomasa_kg, peso_promedio_kg, fcr, estado FROM v_lotes_detalle ORDER BY estado, lote_codigo"
    )
    filas = cur.fetchall()
    cur.execute("SELECT centro_nombre, biomasa_kg FROM v_biomasa_por_centro ORDER BY biomasa_kg DESC")
    por_centro = cur.fetchall()
    if not filas:
        return []

    doc = []
    doc.append("LOTES DE CULTIVO DETALLADOS - SalmoSUR S.A.")
    doc.append("=" * 40)
    mejor_lote, mejor_especie, mejor_centro, _, _, _, mejor_fcr, _ = min(filas, key=lambda f: float(f[6]))
    mayor_centro, mayor_biomasa = por_centro[0]
    doc.append("SUMARIO EJECUTIVO:")
    doc.append(f"- El lote con el FCR más bajo (mejor eficiencia alimentaria) es {mejor_lote} de {mejor_especie} en {mejor_centro}, con un FCR de {float(mejor_fcr):.2f}.")
    doc.append(f"- El centro con la mayor biomasa es {mayor_centro} con {float(mayor_biomasa):,.0f} kg.")
    doc.append("")
    doc.append("La siguiente información detalla los lotes de cultivo de salmón con su biomasa, peso promedio y FCR.")
    doc.append("")
    for lote, especie, centro, unidades, biomasa, peso, fcr, estado in filas:
        doc.append(
            f"- El lote {lote} de {especie} en {centro} ({estado}) tiene {int(unidades)} unidades sembradas, "
            f"{float(biomasa):,.0f} kg de biomasa, un peso promedio de {float(peso):,.2f} kg y un FCR de {float(fcr):.2f}."
        )
    doc.append("")
    doc.append("Biomasa por centro de cultivo:")
    for centro, biomasa in por_centro:
        doc.append(f"- {centro}: {float(biomasa):,.0f} kg de biomasa.")
    doc.append("")
    doc.append("Fuente: tabla lotes_detalle / vistas v_lotes_detalle, v_biomasa_por_centro.")
    return doc


def generar_incidentes(cur):
    """Incidentes y seguridad por tipo y severidad."""
    cur.execute("SELECT tipo, n_incidentes FROM v_incidentes_por_tipo ORDER BY n_incidentes DESC")
    por_tipo = cur.fetchall()
    cur.execute("SELECT severidad, n_incidentes FROM v_incidentes_por_severidad ORDER BY n_incidentes DESC")
    por_severidad = cur.fetchall()
    if not por_tipo:
        return []

    total = sum(int(f[1]) for f in por_tipo)

    doc = []
    doc.append("REPORTE DE INCIDENTES Y SEGURIDAD - SalmoSUR S.A.")
    doc.append("=" * 40)
    criticos = [n for s, n in por_severidad if s == "critico"]
    criticos_n = criticos[0] if criticos else 0
    doc.append("SUMARIO EJECUTIVO:")
    doc.append(f"- Se registraron {criticos_n} incidentes de severidad crítica, todos del tipo escape.")
    doc.append(f"- El total de incidentes registrados en el periodo fue de {total}.")
    doc.append("")
    doc.append("La siguiente información resume los incidentes registrados entre enero y agosto de 2025.")
    doc.append("")
    for tipo, n in por_tipo:
        doc.append(f"- Se registraron {int(n)} incidentes de tipo {tipo}.")
    doc.append("")
    for severidad, n in por_severidad:
        doc.append(f"- {int(n)} incidentes fueron de severidad {severidad}.")
    doc.append("")
    doc.append(f"El total de incidentes registrados en el periodo fue de {total}.")
    doc.append("")
    doc.append("Fuente: tabla incidentes / vistas v_incidentes_por_tipo, v_incidentes_por_severidad.")
    return doc


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        conn = conectar()
    except psycopg2.OperationalError as e:
        print(f"❌ No se pudo conectar a PostgreSQL: {e}")
        print("   Verifica que el servicio esté activo y las credenciales.")
        raise SystemExit(1)

    cur = conn.cursor()
    generadores = {
        "ventas.txt": generar_ventas,
        "calidad.txt": generar_calidad,
        "mortalidad.txt": generar_mortalidad,
        "rentabilidad.txt": generar_rentabilidad,
        "empleados.txt": generar_empleados,
        "inventario.txt": generar_inventario,
        "compras.txt": generar_compras,
        "exportaciones.txt": generar_exportaciones,
        "lotes_detalle.txt": generar_lotes,
        "incidentes.txt": generar_incidentes,
    }

    for nombre, fn in generadores.items():
        try:
            lineas = fn(cur)
            ruta = OUTPUT_DIR / nombre
            ruta.write_text("\n".join(lineas), encoding="utf-8")
            print(f"✓ Generado {ruta.relative_to(BASE_DIR)} ({len(lineas)} líneas)")
        except Exception as e:
            print(f"❌ Error generando {nombre}: {e}")

    cur.close()
    conn.close()
    print("\n✔ Documentos internos generados en data/interna/")
    print("  (ventas, calidad, mortalidad, rentabilidad, empleados, inventario, compras, exportaciones, lotes_detalle, incidentes)")


if __name__ == "__main__":
    main()
