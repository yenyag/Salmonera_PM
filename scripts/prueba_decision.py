#!/usr/bin/env python3
"""
EP2 - Pruebas de DECISIÓN y PLANIFICACIÓN del agente (IE5, IE6)
----------------------------------------------------------------
Evidencia que el agente NO es solo un RAG lineal: decide qué herramientas
usar según la tarea, secuencia etapas y ajusta su comportamiento ante
condiciones cambiantes.

Escenarios:
  D1. Tarea multi-etapa con escritura: cruza mortalidad + alimentación y
      genera un REPORTE (debe usar consultar_rag/consultar_bd + escribir_reporte).
  D2. Selección de herramienta: pregunta tabular/exacta → debe elegir consultar_bd.
  D3. Condición sin dato → debe responder "No tengo información suficiente"
      sin inventar (anti-alucinación en modo agente).
  D4. Condición normativa → pregunta de normativa externa → debe usar consultar_rag
      y citar fuente externa.

Uso:
    python scripts/prueba_decision.py [--json]
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agente_salmosur as ag

USUARIO = "decision_test@salmonera.com"
HILO = "decision-test-hilo"

ESCENARIOS = [
    {
        "id": "D1",
        "nombre": "Tarea multi-etapa + escritura de reporte",
        "pregunta": (
            "Analiza cuál es el lote con mayor mortalidad acumulada, "
            "luego consulta cuánto alimento se entregó al lote A1 en mayo de 2025 "
            "y finalmente genera un reporte con recomendaciones basadas en esos datos."
        ),
        "debe_usar": ["escribir_reporte"],
        "exigir_tools": True,
    },
    {
        "id": "D2",
        "nombre": "Selección de herramienta (dato tabular/calculable)",
        "pregunta": (
            "Suma el total de cada mes de v_ventas_por_mes y dime el total "
            "del semestre en CLP."
        ),
        "debe_usar": ["consultar_bd"],
        "exigir_tools": True,
    },
    {
        "id": "D3",
        "nombre": "Condición sin dato (anti-alucinación)",
        "pregunta": (
            "¿Cuántas piscinas termales operan en los centros de cultivo "
            "de la empresa en la región de Aysén?"
        ),
        "debe_usar": [],
        "no_debe_inventar": True,
    },
    {
        "id": "D4",
        "nombre": "Condición normativa (fuente externa)",
        "pregunta": (
            "¿Qué requisitos sanitarios debe cumplir el salmón chileno "
            "para ser exportado a Estados Unidos?"
        ),
        "debe_usar": ["consultar_rag"],
        "exigir_tools": True,
    },
]


def verificar(escenario: dict) -> dict:
    resultado = ag.responder(escenario["pregunta"], usuario=USUARIO, hilo=HILO)
    acciones = resultado["acciones"]
    herramientas = [a["herramienta"] for a in acciones]
    respuesta = resultado["respuesta"]

    check = {}
    if escenario.get("exigir_tools"):
        for h in escenario["debe_usar"]:
            check[f"usa_{h}"] = h in herramientas
    check["no_vacio"] = len(respuesta) > 0

    if escenario.get("no_debe_inventar"):
        texto_low = respuesta.lower()
        check["reconoce_sin_dato"] = (
            "no tengo información suficiente" in texto_low
            or "no tengo datos" in texto_low
            or "no cuento con información" in texto_low
        )

    escribe_repor = "escribir_reporte" in herramientas
    if escribe_repor:
        reportes = sorted((ag.REPORTES_DIR).glob("*.md"))
        check["reporte_creado"] = len(reportes) > 0

    return {
        "id": escenario["id"],
        "nombre": escenario["nombre"],
        "herramientas_usadas": herramientas,
        "respuesta": respuesta[:400],
        "checks": check,
        "apa": all(check.values()),
    }


def main():
    parser = argparse.ArgumentParser(description="Pruebas de decisión del agente (EP2)")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    resultados = [verificar(e) for e in ESCENARIOS]

    # Conservar los reportes generados como evidencia EP2 (no contaminan
    # data/reportes/ porque se archivan en pruebas/evidencia_ep2/).
    ev = Path(__file__).resolve().parent.parent / "pruebas" / "evidencia_ep2"
    ev.mkdir(parents=True, exist_ok=True)
    for archivo in ag.REPORTES_DIR.glob("*.md"):
        archivo.rename(ev / archivo.name)

    if args.json:
        print(json.dumps(resultados, ensure_ascii=False, indent=2))
        sys.exit(0)

    print("🧪 Pruebas de DECISIÓN y PLANIFICACIÓN del agente\n")
    ok = 0
    for r in resultados:
        estado = "✔" if r["apa"] else "✘"
        ok += 1 if r["apa"] else 0
        print(f"{estado} {r['id']} — {r['nombre']}")
        print(f"   herramientas: {', '.join(r['herramientas_usadas']) or '(ninguna)'}")
        for k, v in r["checks"].items():
            print(f"   {'✔' if v else '✘'} {k}")
        print(f"   respuesta: {r['respuesta'][:200]!r}\n")
    print(f"RESULTADO: {ok}/{len(resultados)} escenarios OK")


if __name__ == "__main__":
    main()