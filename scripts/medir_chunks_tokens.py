#!/usr/bin/env python3
"""
medir_chunks_tokens.py - Prueba de medición (SalmoSUR S.A.)
-----------------------------------------------------------
1) Cuenta los chunks del índice FAISS y los desglosa por documento.
2) Ejecuta el pipeline RAG sobre las preguntas de pruebas/preguntas.json y
   reporta, por cada consulta, los tokens consumidos por el LLM (Groq),
   usando la metadata 'usage' de la respuesta (prompt/completion/total).
3) Totaliza costos de tokens y lo proyecta contra el límite diario de la capa
   gratuita de Groq (100.000 tokens/día). El reporte se imprime en consola y
   se guarda automáticamente en pruebas/medicion_chunks_tokens.txt.

Uso:
    python scripts/medir_chunks_tokens.py
"""

import sys
from collections import Counter, OrderedDict
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "scripts"))

from query_rag import (  # noqa: E402
    GROQ_MODEL,
    PROMPT_TEMPLATE,
    SYSTEM_TEMPLATE,
    cargar_vector_db,
)
from langchain_groq import ChatGroq  # noqa: E402

LIMITE_DIARIO_TOKENS = 100_000
K = 5
PRUEBAS_FILE = BASE_DIR / "pruebas" / "preguntas.json"
REPORT_FILE = BASE_DIR / "pruebas" / "medicion_chunks_tokens.txt"


def medir_chunks():
    """Devuelve total de chunks y desglose por documento (interno/externo)."""
    db = cargar_vector_db()
    total = db.index.ntotal
    por_fuente = Counter()
    por_doc = Counter()
    for doc in db.docstore._dict.values():
        fuente = doc.metadata.get("fuente", "desconocido")
        tipo = doc.metadata.get("tipo", "desconocido")
        por_fuente[tipo] += 1
        por_doc[fuente] += 1
    return total, por_fuente, por_doc


def medir_consulta(pregunta: str, llm):
    """Ejecuta una consulta y reporta tokens + contexto recuperado."""
    db = cargar_vector_db()
    retriever = db.as_retriever(search_kwargs={"k": K})
    docs = retriever.invoke(pregunta)
    contexto = "\n\n---\n\n".join(d.page_content for d in docs)

    cadena = PROMPT_TEMPLATE | llm
    resp = cadena.invoke({"contexto": contexto, "pregunta": pregunta})

    meta = resp.response_metadata
    usage = meta.get("token_usage") or meta.get("usage") or {}
    details_prompt = usage.get("prompt_tokens_details") or {}
    details_comp = usage.get("completion_tokens_details") or {}
    return {
        "pregunta": pregunta,
        "n_docs": len(docs),
        "chars_ctx": len(contexto),
        "prompt_tokens": usage.get("prompt_tokens", 0),
        "completion_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "cached_tokens": details_prompt.get("cached_tokens", 0),
        "reasoning_tokens": details_comp.get("reasoning_tokens", 0),
        "chars_sistema": len(SYSTEM_TEMPLATE),
        "time_total": usage.get("total_time") or meta.get("total_time") or 0,
        "time_prompt": usage.get("prompt_time") or meta.get("prompt_time") or 0,
        "respuesta": resp.content.strip(),
    }


def main():
    import json

    out = []
    emit = out.append
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M")

    emit("=" * 72)
    emit("PRUEBA DE MEDICIÓN - CHUNKS DEL ÍNDICE Y TOKENS DEL LLM")
    emit("Ejecución: " + ahora)
    emit("=" * 72)

    # --- 1) CHUNKS ------------------------------------------------------------
    emit("\n[1] CHUNKS DEL ÍNDICE FAISS")
    emit("-" * 72)
    total, por_fuente, por_doc = medir_chunks()
    emit(f"Chunks totales en data/faiss_index: {total}")
    for tipo, n in por_fuente.items():
        emit(f"  - {tipo}: {n} chunks")
    emit("  Desglose por documento:")
    for doc, n in por_doc.most_common():
        emit(f"    - {doc}: {n} chunks")
    emit("  Modelo de embeddings: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384 dims)")

    # --- 2) TOKENS DEL LLM POR CONSULTA --------------------------------------
    emit("\n[2] TOKENS DEL LLM POR CONSULTA (Groq, modelo " + GROQ_MODEL + ", k=" + str(K) + ")")
    emit("    (temperature=0.1, max_tokens=1500)")
    emit("-" * 72)

    llm = ChatGroq(model=GROQ_MODEL, temperature=0.1, max_tokens=1500)

    preguntas = json.loads(PRUEBAS_FILE.read_text(encoding="utf-8"))["preguntas"]
    resultados = OrderedDict()
    total_prompt = total_completion = total_general = 0
    total_cached = total_reasoning = 0
    total_chars_ctx = 0
    total_time = 0.0

    emit(f"  {'ID':<4} {'Pregunta':<56} {'prompt':>6} {'comp':>5} {'total':>6} "
         f"{'cache':>6} {'razonam':>7} {'latencia(s)':>10}")
    for p in preguntas:
        r = medir_consulta(p["pregunta"], llm)
        resultados[p["id"]] = r
        total_prompt += r["prompt_tokens"]
        total_completion += r["completion_tokens"]
        total_general += r["total_tokens"]
        total_cached += r["cached_tokens"]
        total_reasoning += r["reasoning_tokens"]
        total_chars_ctx += r["chars_ctx"]
        total_time += r["time_total"]
        emit(f"  {p['id']:<4} {p['pregunta'][:55]:<56} {r['prompt_tokens']:>6} "
             f"{r['completion_tokens']:>5} {r['total_tokens']:>6} "
             f"{r['cached_tokens']:>6} {r['reasoning_tokens']:>7} {r['time_total']:>10.2f}")

    # --- 3) TOTALES ------------------------------------------------------------
    n = len(preguntas)
    emit("\n[3] TOTALES DE LA PRUEBA (" + str(n) + " consultas)")
    emit("-" * 72)
    emit(f"  Tokens de entrada (prompt) sumados  : {total_prompt:,}")
    emit(f"  Tokens de salida (completion) sumad.: {total_completion:,}")
    emit(f"  Tokens totales de la prueba          : {total_general:,}")
    if total_cached:
        emit(f"  Tokens en caché (prompt)            : {total_cached:,} "
             f"({100 * total_cached / max(total_prompt, 1):.1f}% del prompt)")
    if total_reasoning:
        emit(f"  Tokens de razonamiento (completion) : {total_reasoning:,} "
             f"({100 * total_reasoning / max(total_completion, 1):.1f}% del completion)")
    emit(f"  Caracteres de contexto recuperados  : {total_chars_ctx:,}")
    emit(f"  Latencia total (suma)               : {total_time:.1f} s")
    prom = total_general / n if n else 0
    prom_t = total_time / n if n else 0
    emit(f"  Promedio tokens por consulta         : {prom:,.0f}")
    emit(f"  Promedio latencia por consulta       : {prom_t:.2f} s")
    if total_prompt:
        emit(f"  Proporción entrada/salida            : {total_prompt / max(total_completion, 1):.2f}:1")
    cuota = (LIMITE_DIARIO_TOKENS / prom) if prom else 0
    emit(f"  Consultas aproximadas con cuota diaria ({LIMITE_DIARIO_TOKENS:,} tokens): ~{cuota:,.0f}")

    # --- 4) MUESTRA DE RESPUESTAS (evidencia) ----------------------------------
    emit("\n[4] MUESTRA DE RESPUESTAS (evidencia de coherencia)")
    emit("-" * 72)
    for pid, r in resultados.items():
        resp = r["respuesta"].replace("\n", " ")[:110]
        emit(f"  [{pid}] {resp}")

    emit("\n✔ Medición completada.")

    salida = "\n".join(out)
    print(salida)
    REPORT_FILE.write_text(salida + "\n", encoding="utf-8")
    print(f"\n→ Reporte guardado en: {REPORT_FILE.relative_to(BASE_DIR)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())