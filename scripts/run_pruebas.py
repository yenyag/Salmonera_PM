#!/usr/bin/env python3
"""
FASE 6 - Ejecución de pruebas de coherencia RAG (IE4)
-----------------------------------------------------
Ejecuta las preguntas de pruebas/preguntas.json contra el pipeline RAG
y genera pruebas/resultados.md con la evaluación de cada respuesta.

Uso:
    python scripts/run_pruebas.py
"""

import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

from query_rag import consultar  # noqa: E402

PRUEBAS_FILE = BASE_DIR / "pruebas" / "preguntas.json"
RESULTADOS_FILE = BASE_DIR / "pruebas" / "resultados.md"

RESPUESTA_NO_INFO = "No tengo información suficiente para responder eso."


def normalizar(texto: str) -> str:
    """
    Normaliza texto para comparación robusta:
      - quita acentos y normaliza Unicode (NFKD)
      - normaliza guiones (incluye ‑ U+2011 -> -)
      - elimina separador de miles (.-comas entre dígitos) y signos $/CLP
      - colapsa espacios
      -> p.ej. "$510,000,000 CLP" == "510000000" == "$510.000.000"
    """
    if not texto:
        return ""
    t = unicodedata.normalize("NFKD", texto)
    t = "".join(c for c in t if not unicodedata.combining(c))  # quita acentos
    # normaliza todas las variantes de guion a '-' (U+002D)
    for codepoint in range(0x2010, 0x2016):  # U+2010-U+2015 (hyphens/figure/question)
        t = t.replace(chr(codepoint), "-")
    t = t.replace("\u2212", "-").replace("_", "-")
    t = t.lower()
    t = re.sub(r"[\s]+", " ", t)
    # normaliza números: quita separadores de miles (comas/puntos) y símbolos
    t = re.sub(r"[\.,]", "", t)
    t = re.sub(r"[$%]|clp", "", t)
    t = t.replace(" ", "")
    return t


def evaluar(pregunta, esperado, respuesta, fuentes, tipo) -> dict:
    """Evalúa heurísticamente si la respuesta es coherente."""
    caso = {
        "id": pregunta["id"],
        "pregunta": pregunta["pregunta"],
        "respuesta": respuesta,
        "fuentes": fuentes,
        "dato_esperado": esperado,
        "coherente": None,
        "razon": "",
    }

    if tipo == "sin_dato":
        # Debe responder que NO tiene información
        ok = RESPUESTA_NO_INFO.lower() in respuesta.lower()
        caso["coherente"] = ok
        caso["razon"] = (
            "El asistente reconoce que no tiene el dato (evita alucinar)"
            if ok
            else "Debería responder que no tiene información (riesgo de alucinación)"
        )
        return caso

    # Las pistas del dato esperado se separan por espacios (cada token relevante)
    resp_norm = normalizar(respuesta)
    pistas = [p for p in esperado.split() if len(p.strip()) >= 2]
    aciertos = sum(1 for p in pistas if normalizar(p) in resp_norm)
    ratio = aciertos / len(pistas) if pistas else 0

    tiene_fuentes = len(fuentes) > 0

    caso["coherente"] = ratio >= 0.5 and tiene_fuentes
    caso["razon"] = (
        f"Coincide con {ratio:.0%} de los datos esperados y cita {len(fuentes)} fuente(s)"
        if caso["coherente"]
        else f"Solo coincide con {ratio:.0%} de los datos esperados o no cita fuentes"
    )
    return caso


def main():
    datos = json.loads(PRUEBAS_FILE.read_text(encoding="utf-8"))
    preguntas = datos["preguntas"]

    print(f"🧪 Ejecutando {len(preguntas)} pruebas de coherencia...\n")

    resultados = []
    for p in preguntas:
        print(f"  • [{p['id']}] {p['pregunta'][:60]}...")
        resultado = consultar(p["pregunta"], k=3)
        caso = evaluar(
            p, p["dato_esperado"], resultado["respuesta"], resultado["fuentes"], p["tipo"]
        )
        resultados.append(caso)

    aciertos = sum(1 for r in resultados if r["coherente"])
    print(f"\n📊 Resultado: {aciertos}/{len(resultados)} pruebas coherentes")

    # Generar markdown
    lineas = [
        "# Resultados de Pruebas de Coherencia - SalmoSUR S.A.",
        "",
        f"**Fecha de ejecución:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"**Resultado general:** {aciertos}/{len(resultados)} pruebas coherentes",
        "",
        "| ID | Pregunta | ¿Coherente? | Razón |",
        "|----|----------|-------------|-------|",
    ]
    for r in resultados:
        estado = "✅ Sí" if r["coherente"] else "❌ No"
        preg = r["pregunta"].replace("|", "\\|")[:60]
        lineas.append(f"| {r['id']} | {preg}... | {estado} | {r['razon']} |")

    lineas.append("")
    lineas.append("## Detalle de respuestas")
    lineas.append("")
    for r in resultados:
        lineas.append(f"### {r['id']}: {r['pregunta']}")
        lineas.append("")
        lineas.append(f"**Respuesta del asistente:**")
        lineas.append("")
        lineas.append(f"> {r['respuesta']}")
        lineas.append("")
        lineas.append(f"**Fuentes citadas:** {', '.join(f['fuente'] for f in r['fuentes']) if r['fuentes'] else 'ninguna'}")
        lineas.append("")

    RESULTADOS_FILE.write_text("\n".join(lineas), encoding="utf-8")
    print(f"✔ Resultados guardados en {RESULTADOS_FILE.relative_to(BASE_DIR)}")

    return 0 if aciertos == len(resultados) else 1


if __name__ == "__main__":
    sys.exit(main())