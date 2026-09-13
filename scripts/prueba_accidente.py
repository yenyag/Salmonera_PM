#!/usr/bin/env python3
"""
prueba_accidente.py - Escenario de accidente laboral + medición de tokens
--------------------------------------------------------------------------
Ejecuta pruebas/preguntas_accidente.json contra el pipeline RAG (k=5),
mide por cada pregunta los tokens consumidos por el LLM (Groq, usage real),
evalúa coherencia con el mismo criterio heurístico de run_pruebas.py y
genera pruebas/resultados_accidente.md.

Uso:
    python scripts/prueba_accidente.py
"""

import json
import sys
from collections import OrderedDict
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

from query_rag import GROQ_MODEL, PROMPT_TEMPLATE, cargar_vector_db  # noqa: E402
from langchain_groq import ChatGroq  # noqa: E402
from run_pruebas import RESPUESTA_NO_INFO, evaluar, normalizar  # noqa: E402

PRUEBAS_FILE = BASE_DIR / "pruebas" / "preguntas_accidente.json"
RESULTADOS_FILE = BASE_DIR / "pruebas" / "resultados_accidente.md"
K = 5


def main():
    preguntas = json.loads(PRUEBAS_FILE.read_text(encoding="utf-8"))["preguntas"]
    llm = ChatGroq(model=GROQ_MODEL, temperature=0.1, max_tokens=1500)
    db = cargar_vector_db()
    retriever = db.as_retriever(search_kwargs={"k": K})
    cadena = PROMPT_TEMPLATE | llm

    casos = OrderedDict()
    tot_prompt = tot_comp = tot_total = 0

    print(f"Ejecutando {len(preguntas)} preguntas de accidente laboral (Groq {GROQ_MODEL}, k={K})...\n")
    for p in preguntas:
        docs = retriever.invoke(p["pregunta"])
        contexto = "\n\n---\n\n".join(d.page_content for d in docs)
        fuentes = [{"fuente": d.metadata.get("fuente")} for d in docs]

        resp_obj = cadena.invoke({"contexto": contexto, "pregunta": p["pregunta"]})
        respuesta = resp_obj.content.strip()

        meta = resp_obj.response_metadata
        usage = meta.get("token_usage") or meta.get("usage") or {}
        details = usage.get("completion_tokens_details") or {}
        prom = usage.get("prompt_tokens", 0)
        comp = usage.get("completion_tokens", 0)
        tot = usage.get("total_tokens", 0)
        razon = details.get("reasoning_tokens", 0)
        tot_prompt += prom
        tot_comp += comp
        tot_total += tot

        caso = evaluar(p, p["dato_esperado"], respuesta, fuentes, p["tipo"])
        caso["prompt_tokens"] = prom
        caso["completion_tokens"] = comp
        caso["total_tokens"] = tot
        caso["reasoning_tokens"] = razon
        casos[p["id"]] = caso

        print(f"  [{p['id']}] {'OK' if caso['coherente'] else 'NO'}  prompt={prom:>5} completion={comp:>5} "
              f"total={tot:>5} razonam={razon:>5}  {p['pregunta'][:55]}")

    aciertos = sum(1 for c in casos.values() if c["coherente"])
    n = len(casos)
    print(f"\nResultado coherencia: {aciertos}/{n}")

    # --- Generar reporte markdown con tokens por pregunta -----------------------
    lineas = [
        "# Prueba de Escenario de Accidente Laboral - SalmoSUR S.A.",
        "",
        f"**Fecha de ejecución:** {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"**Pipeline:** Groq `{GROQ_MODEL}`, temperature 0.1, max_tokens 1500, retriever k={K}",
        f"**Resultado de coherencia:** {aciertos}/{n}",
        "",
        "| ID | Pregunta | Total tokens | Prompt | Completion | ¿Coherente? | Razón |",
        "|----|----------|-------------|--------|------------|-------------|-------|",
    ]
    for pid, c in casos.items():
        estado = "Sí" if c["coherente"] else "No"
        preg = c["pregunta"].replace("|", "\\|")[:50]
        lineas.append(
            f"| {pid} | {preg}… | {c['total_tokens']} | {c['prompt_tokens']} | "
            f"{c['completion_tokens']} | {estado} | {c['razon']} |"
        )

    lineas.append("")
    lineas.append(f"**Totales ({n} consultas):** prompt {tot_prompt:,} · completion {tot_comp:,} · "
                  f"**total {tot_total:,} tokens** · promedio {tot_total / n:,.0f}/consulta")
    lineas.append("Proyección con cuota diaria Groq (100 000 tokens): "
                  f"~{100_000 / (tot_total / n):,.0f} consultas")

    lineas.append("")
    lineas.append("## Detalle de respuestas")
    lineas.append("")
    for pid, c in casos.items():
        resp = c["respuesta"].replace("\n", " ")
        seg = "### " + pid + ": " + c["pregunta"]
        lineas.append(seg)
        lineas.append("")
        lineas.append(f"**Respuesta del asistente:** {resp}")
        lineas.append("")
        lineas.append(
            f"**Fuentes citadas:** {', '.join(f['fuente'] for f in c['fuentes']) if c['fuentes'] else 'ninguna'}"
        )
        lineas.append("")

    RESULTADOS_FILE.write_text("\n".join(lineas), encoding="utf-8")
    print(f"Reporte guardado en {RESULTADOS_FILE.relative_to(BASE_DIR)}")

    return 0 if aciertos == n else 1


if __name__ == "__main__":
    sys.exit(main())