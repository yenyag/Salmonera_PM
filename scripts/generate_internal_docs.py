#!/usr/bin/env python3
"""
FASE 2 - Generador de documentos internos para RAG (SalmoSUR S.A.)
--------------------------------------------------------------------
Lee la base de datos PostgreSQL de la salmonera y genera documentos de
texto en español en data/interna/ para alimentar el pipeline RAG.

Recorre 4 dimensiones operativas:
  1. Ventas mensuales          (tabla ventas)
  2. Distribución por calidad  (tabla cosechas)
  3. Mortalidad por lote       (tabla lotes)
  4. Rentabilidad por centro   (tabla centros)

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
    print("  (ventas.txt, calidad.txt, mortalidad.txt, rentabilidad.txt)")


if __name__ == "__main__":
    main()
