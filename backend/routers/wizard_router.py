"""
Motor Genérico de Wizards — Sprint 4
Endpoints CRUD para wizard_instancias + schema fetch + generación de documentos.
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from database import get_supabase
import io
import re
import zipfile

router = APIRouter(prefix="/wizard", tags=["wizard"])


def _get_uid(request: Request) -> str:
    uid = getattr(request.state, "user_id", None)
    if not uid:
        raise HTTPException(status_code=401, detail="No autenticado")
    return uid


def _get_role(request: Request) -> str:
    return getattr(request.state, "user_role", "user")


# ── Schema ─────────────────────────────────────────────────────────────────

@router.get("/{norma_id}/schema")
def get_schema(norma_id: str, request: Request):
    _get_uid(request)
    sb = get_supabase()
    res = (
        sb.table("wizard_schemas")
        .select("id, norma_id, version, esquema")
        .eq("norma_id", norma_id)
        .eq("activo", True)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail=f"No hay schema activo para {norma_id}")
    return res.data


# ── Instancias ─────────────────────────────────────────────────────────────

@router.get("/{norma_id}/instancias")
def list_instancias(norma_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)
    sb = get_supabase()

    q = (
        sb.table("wizard_instancias")
        .select("id, nombre, status, paso_actual, created_at, updated_at, assigned_by, user_id")
        .eq("norma_id", norma_id)
        .order("updated_at", desc=True)
    )
    if role not in ("admin", "super_admin"):
        q = q.eq("user_id", uid)

    res = q.execute()
    return res.data or []


@router.get("/{norma_id}/instancias/{instancia_id}")
def get_instancia(norma_id: str, instancia_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)
    sb = get_supabase()

    res = (
        sb.table("wizard_instancias")
        .select("*")
        .eq("id", instancia_id)
        .eq("norma_id", norma_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")

    inst = res.data
    if role not in ("admin", "super_admin") and inst["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Sin acceso a esta instancia")

    return inst


@router.post("/{norma_id}/instancias")
async def create_instancia(norma_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)
    sb = get_supabase()

    body = await request.json()
    nombre = body.get("nombre", "Sin título")
    target_user_id = body.get("user_id", uid)

    # Admin puede crear para otro usuario; user solo para sí mismo
    if role not in ("admin", "super_admin"):
        target_user_id = uid

    payload = {
        "norma_id": norma_id,
        "user_id": target_user_id,
        "nombre": nombre,
        "datos": body.get("datos", {}),
        "paso_actual": body.get("paso_actual", ""),
    }
    if target_user_id != uid:
        payload["assigned_by"] = uid

    res = sb.table("wizard_instancias").insert(payload).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Error al crear instancia")
    return res.data[0]


@router.put("/{norma_id}/instancias/{instancia_id}")
async def update_instancia(norma_id: str, instancia_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)
    sb = get_supabase()

    # Verificar acceso
    check = (
        sb.table("wizard_instancias")
        .select("user_id")
        .eq("id", instancia_id)
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")
    if role not in ("admin", "super_admin") and check.data["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Sin acceso")

    body = await request.json()
    patch: dict = {}
    if "datos" in body:
        patch["datos"] = body["datos"]
    if "nombre" in body:
        patch["nombre"] = body["nombre"]
    if "paso_actual" in body:
        patch["paso_actual"] = body["paso_actual"]
    if "status" in body:
        patch["status"] = body["status"]

    if not patch:
        return {"ok": True}

    res = (
        sb.table("wizard_instancias")
        .update(patch)
        .eq("id", instancia_id)
        .execute()
    )
    return res.data[0] if res.data else {"ok": True}


@router.delete("/{norma_id}/instancias/{instancia_id}")
def delete_instancia(norma_id: str, instancia_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)
    sb = get_supabase()

    check = (
        sb.table("wizard_instancias")
        .select("user_id")
        .eq("id", instancia_id)
        .single()
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")
    if role not in ("admin", "super_admin") and check.data["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Sin acceso")

    sb.table("wizard_instancias").delete().eq("id", instancia_id).execute()
    return {"ok": True}


@router.post("/{norma_id}/instancias/{instancia_id}/asignar")
async def asignar_instancia(norma_id: str, instancia_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)

    if role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Solo admins pueden asignar instancias")

    body = await request.json()
    target_user_id = body.get("user_id")
    if not target_user_id:
        raise HTTPException(status_code=400, detail="user_id requerido")

    sb = get_supabase()
    res = (
        sb.table("wizard_instancias")
        .update({"user_id": target_user_id, "assigned_by": uid})
        .eq("id", instancia_id)
        .execute()
    )
    return res.data[0] if res.data else {"ok": True}


# ── Generación de documentos ────────────────────────────────────────────────

def _interpolar(template: str, datos: dict) -> str:
    """Reemplaza {{campo_id}} en el template con valores de datos."""
    def replacer(m):
        key = m.group(1).strip()
        val = datos.get(key, "")
        if isinstance(val, list):
            return ", ".join(str(v) for v in val)
        return str(val) if val is not None else ""
    return re.sub(r"\{\{(\w+)\}\}", replacer, template)


def _datos_to_planeacion(datos: dict) -> dict:
    """Convierte datos planos de wizard_instancias al formato PlaneacionRequest."""
    return {
        "datos": {
            "nombreCurso":   datos.get("nombreCurso", ""),
            "instructor":    datos.get("instructor", ""),
            "disenador":     datos.get("disenador", ""),
            "lugar":         datos.get("lugar", ""),
            "fecha":         datos.get("fecha", ""),
            "duracion":      datos.get("duracion"),
            "participantes": datos.get("participantes"),
            "perfil":        datos.get("perfil", ""),
        },
        "objetivos": {
            "general":    datos.get("obj_general", ""),
            "cognitiva":  datos.get("obj_cognitiva", ""),
            "psicomotriz":datos.get("obj_psicomotriz", ""),
            "afectiva":   datos.get("obj_afectiva", ""),
        },
        "beneficios": datos.get("beneficios", ""),
        "temario": {
            "u1": datos.get("temario_u1", []),
            "u2": datos.get("temario_u2", []),
            "u3": datos.get("temario_u3", []),
        },
        "encuadre": {
            "preguntas":    datos.get("preguntas", ""),
            "reglasTexto":  datos.get("reglasTexto", []),
            "acuerdosTexto": [],
            "otraRegla":    "",
            "acuerdos":     [],
            "reglas":       [],
        },
        "tecnicas": {
            "rhSeleccion":    datos.get("rhSeleccion", ""),
            "rhObjetivo":     datos.get("rhObjetivo", ""),
            "rhInstrucciones":datos.get("rhInstrucciones", ""),
            "rhDuracion":     datos.get("rhDuracion", ""),
            "rhMateriales":   datos.get("rhMateriales", ""),
            "enSeleccion":    datos.get("enSeleccion", ""),
            "enObjetivo":     datos.get("enObjetivo", ""),
            "enInstrucciones":datos.get("enInstrucciones", ""),
            "enDuracion":     datos.get("enDuracion", ""),
            "enMateriales":   datos.get("enMateriales", ""),
            "rompehielos":    {},
            "energizante":    {},
        },
        "evaluaciones": {
            "pctDiagnostica":           datos.get("pctDiagnostica", 0),
            "instDiagnostica":          datos.get("instDiagnostica", ""),
            "pctFormativa":             datos.get("pctFormativa", 0),
            "tipoInstrumentoFormativa": datos.get("tipoInstrumentoFormativa", ""),
            "instFormativa":            datos.get("instFormativa", ""),
            "pctSumativa":              datos.get("pctSumativa", 0),
            "instSumativa":             datos.get("instSumativa", ""),
            "instReac":                 datos.get("instReac", ""),
            "descripcionGeneral":       datos.get("descripcionGeneral", ""),
        },
        "expositiva": {
            "campo":       datos.get("expositiva_descripcion", ""),
            "duracion":    datos.get("expositiva_duracion", ""),
        },
        "demostrativa": {
            "campo":    datos.get("demostrativa_descripcion", ""),
            "duracion": datos.get("demostrativa_duracion", ""),
        },
        "dialogo": {
            "preguntas":  datos.get("dialogo_preguntas", []),
            "conclusion": datos.get("dialogo_conclusion", ""),
        },
        "cierre": {
            "resumen":      datos.get("cierre_resumen", ""),
            "compromisos":  datos.get("cierre_compromisos", []),
            "bibliografias":datos.get("cierre_bibliografias", []),
        },
        "materiales": {
            "didacticos":    datos.get("mat_didacticos", []),
            "fungibles":     datos.get("mat_fungibles", []),
            "instalaciones": datos.get("mat_instalaciones", []),
            "herramientas":  datos.get("mat_herramientas", []),
            "tecnologicos":  datos.get("mat_tecnologicos", []),
            "otros":         datos.get("mat_otros", []),
        },
        "tiempos": datos.get("tiempos_bloques", []),
    }


@router.post("/{norma_id}/instancias/{instancia_id}/generar")
def generar_docs(norma_id: str, instancia_id: str, request: Request):
    uid = _get_uid(request)
    role = _get_role(request)
    sb = get_supabase()

    inst = (
        sb.table("wizard_instancias")
        .select("datos, user_id, nombre")
        .eq("id", instancia_id)
        .single()
        .execute()
    )
    if not inst.data:
        raise HTTPException(status_code=404, detail="Instancia no encontrada")
    if role not in ("admin", "super_admin") and inst.data["user_id"] != uid:
        raise HTTPException(status_code=403, detail="Sin acceso")

    datos = inst.data.get("datos", {})
    nombre_curso = datos.get("nombreCurso", inst.data.get("nombre", "curso"))

    # Importar generadores del main bajo demanda para evitar circular imports
    import importlib, sys
    main_mod = sys.modules.get("__main__") or importlib.import_module("main")

    planeacion_data = _datos_to_planeacion(datos)

    # Mapa generador_id → función en main.py
    GENERADORES = {
        "planeacion":           "generar_planeacion_docx",
        "presentacion":         "generar_presentacion_curso",
        "eval_diagnostica":     "generar_evaluacion_diagnostica",
        "contrato":             "generar_contrato_aprendizaje",
        "lista_req":            "generar_lista_requerimientos",
        "eval_formativa_cotejo":"generar_evaluacion_formativa_cotejo",
        "eval_formativa_guia":  "generar_evaluacion_formativa_guia",
        "eval_sumativa":        "generar_evaluacion_sumativa",
        "eval_reaccion":        "generar_evaluacion_reaccion",
        "lista_asistencia":     "generar_lista_asistencia",
        "manual_instructor":    "generar_manual_instructor",
        "ec0301_manual_instructor":  "generar_manual_instructor",
        "ec0301_manual_participante":"generar_manual_participante",
    }

    # Obtener schema activo para saber qué documentos generar
    schema_res = (
        sb.table("wizard_schemas")
        .select("esquema")
        .eq("norma_id", norma_id)
        .eq("activo", True)
        .single()
        .execute()
    )
    documentos = []
    if schema_res.data:
        documentos = schema_res.data["esquema"].get("documentos", [])

    # Construir el request model que esperan los generadores legados
    from pydantic import BaseModel

    class _Req:
        """Adapter dinámico: getattr retorna de planeacion_data."""
        def __init__(self, d):
            self._d = d
        def __getattr__(self, name):
            if name in self._d:
                v = self._d[name]
                if isinstance(v, dict):
                    return type("_Sub", (), v)()
                return v
            return None

    req_obj = _Req(planeacion_data)

    # Construir el objeto correcto para main usando Pydantic models
    try:
        from main import PlaneacionRequest
        req_pydantic = PlaneacionRequest(**planeacion_data)
    except Exception:
        req_pydantic = None

    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for doc in documentos:
            gen_key = doc.get("generador", "")
            fn_name = GENERADORES.get(gen_key)
            if not fn_name:
                continue
            fn = getattr(main_mod, fn_name, None)
            if not fn:
                continue
            try:
                arg = planeacion_data if fn_name == "generar_planeacion_docx" else (req_pydantic or req_obj)
                file_bytes = fn(arg)
                ext = doc.get("formato", "docx")
                filename = f"{doc['nombre']}.{ext}"
                zf.writestr(filename, file_bytes)
            except Exception as e:
                zf.writestr(f"{doc['nombre']}_ERROR.txt", str(e))

    zip_buf.seek(0)
    safe_name = "".join(c if c.isalnum() or c in "-_ " else "_" for c in nombre_curso)
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="SmartBuilder_{safe_name}.zip"'},
    )
