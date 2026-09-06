#!/usr/bin/env python3
"""
FASE 2 - Construcción del índice FAISS para RAG (SalmoSUR S.A.)
----------------------------------------------------------------
Carga todos los documentos internos y externos, los divide en chunks,
genera embeddings locales y almacena un índice FAISS consultable.

Cada chunk guarda metadata con su fuente (archivo de origen) para que
las respuestas del LLM puedan citarla (trazabilidad / IE4).

Salida: data/faiss_index/
"""

import os
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR / "data"
INDEX_DIR = BASE_DIR / "data" / "faiss_index"

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)


def load_documents() -> list[Document]:
    """Lee los .txt de data/interna/ y data/externa/ con metadata de fuente."""
    documentos = []
    for subdir in ["interna", "externa"]:
        carpeta = DOCS_DIR / subdir
        for archivo in sorted(carpeta.glob("*.txt")):
            texto = archivo.read_text(encoding="utf-8").strip()
            if texto:
                doc = Document(
                    page_content=texto,
                    metadata={
                        "fuente": archivo.name,
                        "tipo": subdir,  # interna | externa
                    },
                )
                documentos.append(doc)
                print(f"  Cargado: {subdir}/{archivo.name} ({len(texto)} chars)")
    return documentos


def chunk_documents(
    docs: list[Document], chunk_size=600, chunk_overlap=80
) -> list[Document]:
    """Divide los textos en chunks conservando la metadata."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
    )
    return splitter.split_documents(docs)


def main():
    print("📄 Cargando documentos...")
    docs = load_documents()
    print(f"   Total documentos: {len(docs)}\n")

    print("✂️  Dividiendo en chunks...")
    chunks = chunk_documents(docs)
    print(f"   Total chunks: {len(chunks)}\n")

    print("🧮 Generando embeddings y creando índice FAISS...")
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        encode_kwargs={"normalize_embeddings": True},
    )

    vector_db = FAISS.from_documents(documents=chunks, embedding=embeddings)

    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    vector_db.save_local(str(INDEX_DIR))

    print(f"\n✔ Índice FAISS guardado en {INDEX_DIR.relative_to(BASE_DIR)}")
    print(f"  (chunks: {len(chunks)}, modelo: {EMBEDDING_MODEL})")


if __name__ == "__main__":
    main()