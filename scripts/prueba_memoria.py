#!/usr/bin/env python3
"""
EP2 - Pruebas de MEMORIA del agente (IE3)
------------------------------------------
Evidencia la configuración de memoria de corto y largo plazo:

  M1. Memoria persistente (largo plazo): el agente guarda un RECUERDO
      (guardar_recuerdo) y lo recupera en una invocación NUEVA (subproceso
      distinto), igual que en la arquitectura real (server → subproceso).
  M2. Continuidad por historial (largo plazo): tras una interacción previa
      persistida en chat_historial, la siguiente consulta retoma el tema
      sin repetir la pregunta completa.

Uso:
    python scripts/prueba_memoria.py [--json]
"""
import argparse
import json
import sys
from pathlib import Path

import psycopg2

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agente_salmosur as ag

USUARIO = "memoria_test@salmonera.com"
HILO = "memoria-test-hilo"


def _guardar_en_historial(email: str, pregunta: str, respuesta: str) -> None:
    """Simula lo que hace el backend: persiste la interacción en chat_historial."""
    conn = psycopg2.connect(**ag.PG_CFG)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO chat_historial (usuario_email, pregunta, respuesta, fuentes)
                   VALUES (%s, %s, %s, '[]'::jsonb)""",
                (email, pregunta, respuesta),
            )
        conn.commit()
    finally:
        conn.close()


def _limpiar_historial(email: str) -> None:
    conn = psycopg2.connect(**ag.PG_CFG)
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM chat_historial WHERE usuario_email = %s", (email,))
        conn.commit()
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(description="Pruebas de memoria del agente (EP2)")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    # limpieza previa del entorno de prueba
    _limpiar_historial(USUARIO)
    archivo_mem = ag._archivo_memoria(USUARIO)
    if archivo_mem.exists():
        archivo_mem.unlink()

    resultados = []

    # ---------------- M1: memoria persistente entre invocaciones ----------------
    t1 = ag.responder(
        "Recuerda para mí que el presupuesto de sanidad 2026 es 120 millones de pesos.",
        usuario=USUARIO, hilo=HILO,
    )
    usos_t1 = [a["herramienta"] for a in t1["acciones"]]
    m1_guardado = archivo_mem.exists()

    t2 = ag.responder(
        "¿Cuál es el presupuesto de sanidad que te dejé guardado?",
        usuario=USUARIO, hilo=HILO,
    )
    m1_recuperado = "120" in t2["respuesta"]
    resultados.append({
        "id": "M1",
        "nombre": "Memoria persistente (recuerdos entre invocaciones)",
        "herramientas_t1": usos_t1,
        "archivo_memoria": str(archivo_mem.relative_to(ag.BASE_DIR)) if m1_guardado else None,
        "respuesta_t2": t2["respuesta"][:300],
        "checks": {
            "guardo_recuerdo": m1_guardado,
            "recupera_en_invocacion_nueva": m1_recuperado,
        },
        "apa": m1_guardado and m1_recuperado,
    })

    # ---------------- M2: continuidad por historial (chat_historial) ----------------
    t1b = ag.responder(
        "¿Qué lote tiene mayor mortalidad acumulada?",
        usuario=None, hilo=None,
    )
    _guardar_en_historial(
        USUARIO,
        "¿Qué lote tiene mayor mortalidad acumulada?",
        t1b["respuesta"],
    )
    t2b = ag.responder(
        "¿Y cuál lote le sigue en mortalidad (el segundo más alto)?",
        usuario=USUARIO, hilo=None,
    )
    m2 = "D1" in t2b["respuesta"] or "LOTE-D1" in t2b["respuesta"]
    resultados.append({
        "id": "M2",
        "nombre": "Continuidad por historial persistido",
        "respuesta_t2": t2b["respuesta"][:300],
        "checks": {"retoma_contexto_previo": m2},
        "apa": m2,
    })

    _limpiar_historial(USUARIO)

    if args.json:
        print(json.dumps(resultados, ensure_ascii=False, indent=2))
        sys.exit(0)

    print("🧠 Pruebas de MEMORIA del agente\n")
    ok = 0
    for r in resultados:
        estado = "✔" if r["apa"] else "✘"
        ok += 1 if r["apa"] else 0
        print(f"{estado} {r['id']} — {r['nombre']}")
        if r.get("archivo_memoria"):
            print(f"   memoria: {r['archivo_memoria']}")
        for k, v in r["checks"].items():
            print(f"   {'✔' if v else '✘'} {k}")
        print(f"   respuesta: {r['respuesta_t2']!r}\n")
    print(f"RESULTADO: {ok}/{len(resultados)} escenarios OK")


if __name__ == "__main__":
    main()