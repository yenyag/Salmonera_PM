#!/usr/bin/env python3
"""
FASE 3 - Pipeline RAG de consulta (SalmoSUR S.A.)
-------------------------------------------------
Carga el índice FAISS, recupera los chunks más relevantes y genera una
respuesta con el LLM (Groq) citando la fuente de cada dato.

Uso (modo CLI de prueba):
    python scripts/query_rag.py "¿Qué lote tiene mayor mortalidad?"

Uso (modo función, usado por el backend Node):
    from rag_wrapper import consultar
    respuesta = consultar("¿...?")   # dict con respuesta + fuentes
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq

BASE_DIR = Path(__file__).resolve().parent.parent

# Carga de credenciales desde .env del proyecto
load_dotenv(BASE_DIR / ".env")

INDEX_DIR = BASE_DIR / "data" / "faiss_index"

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)
GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

SYSTEM_TEMPLATE = """Eres el asistente interno de la empresa SalmoSUR S.A., dedicada
a la producción y comercialización de salmón en Chile.

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con la información contenida en el CONTEXTO RECUPERADO.
2. Si la pregunta no puede responderse con el contexto, responde textualmente:
   "No tengo información suficiente para responder eso."
3. Cita la fuente de cada dato al final de tu respuesta, con el formato:
   [Fuente: <nombre_archivo>]
4. Usa cifras y fechas exactas de los datos. No inventes ni redondees a tu gusto.
5. Responde en español, de forma clara y concisa.
6. Si te preguntan por recomendaciones, basalas únicamente en los datos del contexto.

CONTEXTO RECUPERADO:
{contexto}
"""

PROMPT_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_TEMPLATE),
        ("human", "Pregunta del usuario: {pregunta}"),
    ]
)


def cargar_vector_db():
    """Carga el índice FAISS desde data/faiss_index."""
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        encode_kwargs={"normalize_embeddings": True},
    )
    return FAISS.load_local(
        str(INDEX_DIR), embeddings, allow_dangerous_deserialization=True
    )


def formatear_fuentes(documentos):
    """Extrae las fuentes únicas (archivos) de los documentos recuperados."""
    fuentes = []
    for doc in documentos:
        nombre = doc.metadata.get("fuente", "desconocido")
        if nombre not in [f["fuente"] for f in fuentes]:
            tipo = doc.metadata.get("tipo", "desconocido")
            fuentes.append({"fuente": nombre, "tipo": tipo})
    return fuentes


def consultar(pregunta: str, k: int = 5) -> dict:
    """
    Ejecuta el pipeline RAG completo.

    Args:
        pregunta: consulta en lenguaje natural del usuario.
        k: número de chunks relevantes a recuperar.

    Returns:
        dict con keys: respuesta (str), fuentes (list[dict]).
    """
    vector_db = cargar_vector_db()
    retriever = vector_db.as_retriever(search_kwargs={"k": k})

    # 1. Recuperación
    documentos = retriever.invoke(pregunta)

    # 2. Construcción del contexto
    contexto = "\n\n---\n\n".join(d.page_content for d in documentos)

    # 3. Generación con el LLM
    llm = ChatGroq(model=GROQ_MODEL, temperature=0.1)
    cadena = PROMPT_TEMPLATE | llm
    respuesta = cadena.invoke({"contexto": contexto, "pregunta": pregunta})

    # 4. Fuentes citadas (trazabilidad)
    fuentes = formatear_fuentes(documentos)

    return {
        "respuesta": respuesta.content.strip(),
        "fuentes": fuentes,
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python scripts/query_rag.py \"tu pregunta\" [--json]")
        sys.exit(1)

    texto_pregunta = " ".join(a for a in sys.argv[1:] if a != "--json")
    salida_json = "--json" in sys.argv

    resultado = consultar(texto_pregunta)

    if salida_json:
        # Salida JSON simple para ser consumida por el backend Node.js
        import json as _json

        print(_json.dumps(resultado, ensure_ascii=False))
        sys.exit(0)

    print(f"❓ Pregunta: {texto_pregunta}\n")
    print("💬 Respuesta del asistente:")
    print(resultado["respuesta"])
    print("\n📌 Fuentes citadas:")
    for f in resultado["fuentes"]:
        nombre = f["fuente"]
        tipo = "interna" if f["tipo"] == "interna" else "externa"
        print(f"  - {nombre} ({tipo})")