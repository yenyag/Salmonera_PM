#!/usr/bin/env python3
"""
FASE EP2 - Agente funcional SalmoSUR S.A. (LangGraph)
------------------------------------------------------
Agente capaz de integrar herramientas de CONSULTA, ESCRITURA y RAZONAMIENTO
en un flujo de trabajo organizacional, con memoria de corto y largo plazo.

Herramientas registradas:
  - consultar_rag(pregunta)   : recuperación semántica (FAISS) + síntesis LLM con fuentes
  - consultar_bd(sql)         : consulta SQL de SOLO LECTURA sobre vista PostgreSQL
  - escribir_reporte(titulo)  : guarda un informe en data/reportes/ (auto-indexable)
  - guardar_recuerdo(clave)   : memoria persistente de largo plazo (data/memoria/)

Memoria:
  - Corto plazo  : LangGraph checkpointer (hilo de la conversación en una llamada)
  - Largo plazo  : historial del usuario (chat_historial) + recuerdos persistidos,
                   re-inyectados como contexto al inicio de cada invocación.

Uso CLI:
    python scripts/agente_salmosur.py "tu pregunta" [--usuario mail] [--hilo id] [--json]

Salida JSON (consumida por el backend Node):
    { respuesta, fuentes: [{fuente, tipo}], acciones: [{herramienta, detalle}] }
"""

import json
import os
import re
import sys
import time
import unicodedata
import warnings
from datetime import datetime
from pathlib import Path
from typing import Any

warnings.filterwarnings(
    "ignore", message=".*create_react_agent has been moved to.*"
)

import psycopg2
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import create_react_agent

BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = Path(__file__).resolve().parent
REPORTES_DIR = BASE_DIR / "data" / "reportes"
MEMORIA_DIR = BASE_DIR / "data" / "memoria"

# Permite importar query_rag tanto si se ejecuta como script como si se importa como módulo
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

load_dotenv(BASE_DIR / ".env")

from query_rag import consultar as rag_consultar

GROQ_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
PG_CFG = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": os.getenv("PGPORT", "5432"),
    "user": os.getenv("PGUSER", "salmonera"),
    "password": os.getenv("PGPASSWORD", "salmonera123"),
    "database": os.getenv("PGDATABASE", "salmonera_pm"),
}

MAX_HISTORIAL_TURNS = 10  # interacciones previas inyectadas como memoria


class _PacedGroq(ChatGroq):
    """ChatGroq con pacing entre llamadas LLM y reintentos ante 429.

    El tier gratuito de Groq limita los tokens por minuto (TPM ≈ 8000). Un
    agente que encadena varias llamadas de herramientas estalla ese límite;
    un pequeño sleep antes de cada POST + reintentos con backoff mantiene la
    tasa dentro del cupo sin degradar la calidad de las respuestas."""

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        time.sleep(float(os.getenv("AGENTE_PACING", "2.5")))
        return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)


# ---------------------------------------------------------------------------
# Herramienta 1: consulta de contexto semántico (RAG)
# ---------------------------------------------------------------------------
@tool
def consultar_rag(pregunta: str) -> str:
    """Recupera información del corpus de la empresa (datos operativos internos y
    normativa externa) usando búsqueda semántica. ÚSALA para preguntas de negocio
    en lenguaje natural: ventas, mortalidad, rentabilidad, calidad, planilla,
    stock, exportaciones, normativa Sernapesca, requisitos de exportación, etc.
    Devuelve la respuesta con sus fuentes citadas."""
    resultado = rag_consultar(pregunta)
    fuentes = ", ".join(f["fuente"] for f in resultado["fuentes"])
    return (
        f"{resultado['respuesta']}\n\n"
        f"[FUENTES_INTERNAS] {fuentes if fuentes else 'sin fuentes'}"
    )


# ---------------------------------------------------------------------------
# Herramienta 2: consulta SQL (base de datos operativa)
# ---------------------------------------------------------------------------
@tool
def consultar_bd(sql: str) -> str:
    """Ejecuta una consulta SQL de SOLO LECTURA (SELECT) sobre las vistas PostgreSQL
    del sistema de gestión de SalmoSUR.

    Vistas disponibles y sus columnas:
      v_ventas_por_mes(mes, total_mensual)
      vista_distribucion_por_calidad(calidad, cantidad_cosechas)
      vista_mortalidad_acumulada(lote_codigo, mortalidad_total)
      vista_rentabilidad_por_centro(centro_nombre, total_ingresos_clp)
      v_empleados(id, nombre, cargo, centro_nombre, sueldo_base, ...)
      v_planilla_por_cargo(cargo, total_planilla, cantidad_empleados)
      v_inventario_resumen(categoria, cantidad, valor_total_clp)
      v_stock_bajo(nombre_producto, stock_actual, stock_minimo)
      v_gasto_por_proveedor(proveedor, rubro, total_gasto_clp)
      v_exportaciones_por_destino(pais_destino, total_fob_clp)
      v_exportaciones_resumen(mes, total_fob_clp)
      v_lotes_detalle(lote_codigo, especie, centro_nombre, fecha_siembra, biomasa_kg, peso_promedio_kg, fcr, estado)
      v_biomasa_por_centro(centro_nombre, biomasa_total_kg)
      v_incidentes_por_tipo(tipo, total)
      v_incidentes_por_severidad(severidad, total)
      v_concesiones(centro_nombre, superficie_ha, ...)
      v_monitoreo_promedio(lote_codigo, caligus_prom, ...)
      v_alimentacion_resumen(lote_codigo, mes, total_raciones_kg)

    REGLAS para consultas correctas:
      - Para el máximo usa ORDER BY <columna> DESC LIMIT 1; para el mínimo ASC LIMIT 1.
      - Compara/ordena siempre por la columna numérica correcta (NO ordenes alfabético).
      - Si dudas de las columnas, primero ejecuta SELECT * FROM <vista> LIMIT 5 para verlas.
      - Nunca hagas LIMIT sin ORDER BY cuando quieras el mayor/menor.

    Devuelve las filas en texto plano."""
    sql = re.sub(r";.*", "", sql.strip())  # una sola sentencia
    sql = sql.strip()
    if not sql.lower().startswith("select"):
        return "ERROR: solo se permiten consultas SELECT."
    try:
        conn = psycopg2.connect(**PG_CFG)
        try:
            with conn.cursor() as cur:
                cur.execute(sql)
                columnas = [d[0] for d in cur.description or []]
                filas = cur.fetchall()
        finally:
            conn.close()
    except Exception as e:  # noqa: BLE001
        # Si el error es por columnas/vistas desconocidas, entregamos el esquema
        # real de la tabla usada para que el agente corrija su consulta.
        m = re.search(r"\bfrom\s+([a-z_0-9]+)", sql, re.IGNORECASE)
        if m:
            try:
                conn = psycopg2.connect(**PG_CFG)
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            """SELECT column_name FROM information_schema.columns
                               WHERE table_schema = 'public' AND table_name = %s
                               ORDER BY ordinal_position""",
                            (m.group(1),),
                        )
                        cols = [r[0] for r in cur.fetchall()]
                finally:
                    conn.close()
                if cols:
                    return (
                        f"ERROR en la consulta SQL: {e}\n"
                        f"Columnas reales de {m.group(1)}: {', '.join(cols)}"
                    )
            except Exception:  # noqa: BLE001
                pass
        return f"ERROR en la consulta SQL: {e}"
    if not filas:
        return "La consulta no devolvió filas."
    encabezado = " | ".join(columnas)
    cuerpo = "\n".join(" | ".join(str(c) for c in fila) for fila in filas)
    return f"{encabezado}\n{cuerpo}"


# ---------------------------------------------------------------------------
# Herramienta 3: escritura de reportes
# ---------------------------------------------------------------------------
def _slug(nombre: str) -> str:
    nombre = unicodedata.normalize("NFKD", nombre)
    nombre = "".join(c for c in nombre if not unicodedata.combining(c))
    nombre = re.sub(r"[^a-zA-Z0-9 _-]", "", nombre).strip().replace(" ", "_")
    return nombre[:60] or "reporte"


@tool
def escribir_reporte(titulo: str, contenido: str) -> str:
    """Genera y guarda un reporte organizacional en Markdown dentro de
    data/reportes/. Pasa el TÍTULO y el CONTENIDO completo del informe.
    Devuelve la ruta del archivo creado. ÚSALA cuando el usuario pida
    'generar/crear/escribir/guardar un reporte, informe o documentación'
    a partir del análisis realizado."""
    REPORTES_DIR.mkdir(parents=True, exist_ok=True)
    nombre = _slug(titulo) + f"_{datetime.now():%Y%m%d_%H%M%S}.md"
    ruta = REPORTES_DIR / nombre
    ruta.write_text(f"# {titulo}\n\n{contenido}\n", encoding="utf-8")
    return f"Reporte guardado en {ruta.relative_to(BASE_DIR)}"


# ---------------------------------------------------------------------------
# Herramienta 4: memoria persistente (largo plazo)
# ---------------------------------------------------------------------------
def _archivo_memoria(email: str | None) -> Path:
    MEMORIA_DIR.mkdir(parents=True, exist_ok=True)
    clave = _slug(email or "anon")
    return MEMORIA_DIR / f"{clave}.json"


def _leer_recuerdos(email: str | None) -> dict[str, Any]:
    archivo = _archivo_memoria(email)
    if archivo.exists():
        try:
            return json.loads(archivo.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            return {}
    return {}


@tool
def guardar_recuerdo(clave: str, valor: str) -> str:
    """Guarda un dato en la MEMORIA PERSISTENTE del usuario para recordarlo en
    futuras conversaciones (p. ej. preferencias, decisiones tomadas, fechas).
    El agente recibirá estos recuerdos como contexto en consultas posteriores."""
    try:
        recuerdos = _leer_recuerdos(CONTEXTO_ACTUAL_USUARIO)
    except Exception:  # noqa: BLE001
        recuerdos = {}
    recuerdos[clave] = valor
    _archivo_memoria(CONTEXTO_ACTUAL_USUARIO).write_text(
        json.dumps(recuerdos, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return f"Recuerdo guardado: {clave}"


# ---------------------------------------------------------------------------
# Memoria de largo plazo: historial del usuario (chat_historial)
# ---------------------------------------------------------------------------
def _leer_historial_usuario(email: str | None, max_turnos: int = MAX_HISTORIAL_TURNS) -> str:
    if not email:
        return ""
    try:
        conn = psycopg2.connect(**PG_CFG)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT pregunta, respuesta FROM chat_historial
                       WHERE usuario_email = %s
                       ORDER BY created_at DESC, id DESC LIMIT %s""",
                    (email, max_turnos),
                )
                filas = list(reversed(cur.fetchall()))
        finally:
            conn.close()
    except Exception as e:  # noqa: BLE001
        sys.stderr.write(f"[memoria] no se pudo leer historial: {e}\n")
    if filas:
        sys.stderr.write(f"[memoria] historial inyectado para {email}: {len(filas)} turnos\n")
        for i, (preg, resp) in enumerate(filas):
            sys.stderr.write(f"  {i+1}. Q: {preg[:80]}\n")
            sys.stderr.write(f"     A: {resp[:80]}\n")
    else:
        sys.stderr.write(f"[memoria] sin historial previo para {email}\n")
        return ""
    if not filas:
        return ""
    bloques = []
    for pregunta, respuesta in filas:
        respuesta_corta = respuesta[:400].replace("\n", " ")
        bloques.append(f"- P: {pregunta}\n  R: {respuesta_corta}")
    return "\n".join(bloques)


# ---------------------------------------------------------------------------
# Prompt del sistema (rol + reglas + memoria inyectada)
# ---------------------------------------------------------------------------
SYSTEM_TEMPLATE = """Eres el agente funcional de la empresa SalmoSUR S.A., dedicada a la
producción y comercialización de salmón en Chile.

Tienes acceso a estas HERRAMIENTAS. Decide cuál usar según la pregunta:
1. consultar_rag(pregunta): información de negocio o normativa en lenguaje natural.
   Es tu primera opción para cualquier pregunta de negocio o normativa.
2. consultar_bd(sql): cuando necesites cifras verificables, cruces o cálculos exactos
   sobre las vistas PostgreSQL.
3. escribir_reporte(titulo, contenido): cuando el usuario pida generar/guardar un
   informe o documentación con el análisis realizado.
4. guardar_recuerdo(clave, valor): cuando el usuario entregue un dato/personalización
   que convenga recordar.

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con la información obtenida por tus herramientas o memoria.
2. Si no puedes responder, responde textualmente:
   "No tengo información suficiente para responder eso."
3. Cita la fuente de cada dato (ej. [Fuente: ventas.txt] o [Fuente: v_ventas_por_mes]).
4. Usa cifras y fechas exactas. No inventes ni redondees.
5. Responde en español, de forma clara y concisa.
6. Si te piden recomendaciones, basálas solo en datos verificados.
7. Si la pregunta pide enumerar, respóndela COMPLETA con todos los elementos.
8. Para tareas con varias etapas, PLANIFICA: identifica qué herramientas necesitas,
   ejecútalas en orden y razona sobre sus resultados antes de responder.
9. Si la tarea lo pide (reporte/informe), usa escribir_reporte y menciona la ruta
   del archivo generado en tu respuesta."""


def _render_recuerdos(recuerdos: dict[str, Any]) -> str:
    if not recuerdos:
        return ""
    return "\n".join(f"- {k}: {v}" for k, v in recuerdos.items())


def _construir_prompt_sistema(usuario: str | None, hilo: str | None) -> str:
    bloques = [SYSTEM_TEMPLATE]

    historial = _leer_historial_usuario(usuario, MAX_HISTORIAL_TURNS)
    if historial:
        bloques.append(
            "\n\nCONTEXTO DE CONVERSACIONES PREVIAS DE ESTE USUARIO (memoria de largo plazo):\n"
            + historial
        )

    recuerdos = _leer_recuerdos(usuario)
    if recuerdos:
        bloques.append(
            "\n\nMEMORIA PERSISTENTE DEL USUARIO (recuerdos por clave):\n"
            + _render_recuerdos(recuerdos)
        )

    return "\n".join(bloques)


# ---------------------------------------------------------------------------
# Ejecución del agente
# ---------------------------------------------------------------------------
CONTEXTO_ACTUAL_USUARIO: str | None = None
TOOLS = [consultar_rag, consultar_bd, escribir_reporte, guardar_recuerdo]


def _limpiar_fuentes(salida_rag: str) -> list[dict]:
    m = re.search(r"\[FUENTES_INTERNAS\] (.*)$", salida_rag, re.MULTILINE)
    if not m:
        return []
    nombres = [n.strip() for n in m.group(1).split(",") if n.strip()]
    if not nombres or nombres == ["sin fuentes"]:
        return []
    return [
        {
            "fuente": n,
            "tipo": "interna" if "(" not in n else "externa",
        }
        for n in nombres
    ]


def _extraer_plan(mensajes: list) -> list[dict]:
    """Recorre los mensajes del grafo y reporta las herramientas usadas (evidencia
    de planificación y toma de decisiones del agente)."""
    acciones = []
    fuentes = []
    for msg in mensajes:
        type_name = getattr(msg, "type", "")
        tool_name = getattr(msg, "name", "")
        if type_name == "ai" and getattr(msg, "tool_calls", None):
            for call in msg.tool_calls:
                nombre = call.get("name", "")
                args = call.get("args", {})
                detalle = ""
                if nombre == "consultar_rag":
                    detalle = str(args.get("pregunta", ""))[:120]
                elif nombre == "consultar_bd":
                    detalle = str(args.get("sql", ""))[:120]
                    fuentes.append({"fuente": "PostgreSQL", "tipo": "interna"})
                elif nombre == "escribir_reporte":
                    detalle = str(args.get("titulo", ""))[:120]
                elif nombre == "guardar_recuerdo":
                    detalle = f"{args.get('clave', '')} = {args.get('valor', '')[:60]}"
                acciones.append({"herramienta": nombre, "detalle": detalle})
        elif type_name == "tool" and "_salmo" not in type_name:
            if getattr(msg, "name", "") == "consultar_rag":
                fuentes.extend(_limpiar_fuentes(str(msg.content)))
    # Deduplicar fuentes conservando orden
    vistos = set()
    fuentes_unicas = []
    for f in fuentes:
        if f["fuente"] not in vistos:
            fuentes_unicas.append(f)
            vistos.add(f["fuente"])
    return acciones, fuentes_unicas


def responder(
    pregunta: str,
    usuario: str | None = None,
    hilo: str | None = None,
) -> dict:
    """Ejecuta el agente LangGraph y devuelve {respuesta, fuentes, acciones}."""
    global CONTEXTO_ACTUAL_USUARIO
    CONTEXTO_ACTUAL_USUARIO = usuario

    llm = _PacedGroq(
        model=GROQ_MODEL,
        temperature=0.1,
        max_tokens=int(os.getenv("AGENTE_MAX_TOKENS", "1400")),
        max_retries=int(os.getenv("GROQ_MAX_RETRIES", "5")),
        request_timeout=60,
    )
    system_prompt = _construir_prompt_sistema(usuario, hilo)

    checkpointer = InMemorySaver()
    agente = create_react_agent(
        model=llm,
        tools=TOOLS,
        prompt=system_prompt,
        checkpointer=checkpointer,
    )

    config = {
        "configurable": {"thread_id": hilo or (usuario or "anon")},
    }
    resultado = agente.invoke(
        {"messages": [("human", pregunta)]},
        config=config,
    )

    mensajes = resultado["messages"]
    acciones, fuentes = _extraer_plan(mensajes)

    # Respuesta final: último mensaje de texto del asistente (sin tool_calls)
    respuesta = ""
    for msg in reversed(mensajes):
        if getattr(msg, "type", "") == "ai" and not getattr(msg, "tool_calls", None):
            respuesta = str(msg.content).strip()
            break
    if not respuesta:
        respuesta = str(mensajes[-1].content).strip()

    return {
        "respuesta": respuesta,
        "fuentes": fuentes,
        "acciones": acciones,
    }


# ---------------------------------------------------------------------------
# Persistencia en chat_historial (para CLI y servidor)
# ---------------------------------------------------------------------------
def _guardar_en_historial(usuario: str | None, pregunta: str, respuesta: str, fuentes: list, acciones: list) -> None:
    if not usuario:
        return
    try:
        import json as _json
        conn = psycopg2.connect(**PG_CFG)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO chat_historial (usuario_email, pregunta, respuesta, fuentes, acciones)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (usuario, pregunta, respuesta, _json.dumps(fuentes), _json.dumps(acciones)),
                )
                conn.commit()
        finally:
            conn.close()
    except Exception as e:  # noqa: BLE001
        sys.stderr.write(f"[memoria] no se pudo guardar historial: {e}\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Agente funcional SalmoSUR (EP2)")
    parser.add_argument("pregunta", help="pregunta en lenguaje natural")
    parser.add_argument("--usuario", default=None, help="email del usuario (memoria LP)")
    parser.add_argument("--hilo", default=None, help="id de hilo de conversación")
    parser.add_argument("--json", action="store_true", help="salida JSON")
    args = parser.parse_args()

    resultado = responder(args.pregunta, usuario=args.usuario, hilo=args.hilo)

    # Guardar en historial si hay usuario (memoria larga plazo)
    _guardar_en_historial(args.usuario, args.pregunta, resultado["respuesta"], resultado["fuentes"], resultado["acciones"])

    if args.json:
        print(json.dumps(resultado, ensure_ascii=False))
        sys.exit(0)

    print(f"❓ Pregunta: {args.pregunta}\n")
    print("🧠 Plan del agente:")
    if resultado["acciones"]:
        for a in resultado["acciones"]:
            print(f"   → {a['herramienta']}: {a['detalle']}")
    else:
        print("   (respondió directamente, sin herramientas)")
    print("\n💬 Respuesta:")
    print(resultado["respuesta"])
    print("\n📌 Fuentes:")
    for f in resultado["fuentes"]:
        print(f"  - {f['fuente']} ({f['tipo']})")