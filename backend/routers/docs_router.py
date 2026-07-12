import base64
import io
import json
import os
import subprocess
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from models.wizard_models import PlaneacionRequest, ObjetivosRequest
from services.doc_helpers import (
    _validar_expediente, _calc_content_len, limpiar_nombre_archivo, crear_zip_con_docx,
)
from services.doc_objetivos import crear_docx_objetivos
from services.doc_evaluaciones import (
    generar_evaluacion_diagnostica, generar_evaluacion_formativa_cotejo,
    generar_evaluacion_formativa_guia, generar_evaluacion_sumativa,
    generar_evaluacion_reaccion, generar_lista_asistencia,
)
from services.doc_planeacion import generar_presentacion_curso
from services.doc_generales import generar_contrato_aprendizaje, generar_lista_requerimientos

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent


def _generar_planeacion_docx(payload: dict) -> bytes:
    script_path = BASE_DIR / "generators" / "index.js"
    if not script_path.exists():
        raise FileNotFoundError("No se encontró generators/index.js en el backend")

    ev = payload.get("evaluaciones", {})
    payload["evaluaciones"] = {
        "pctDiagnostica":           ev.get("pctDiagnostica", ev.get("pctDiag", 0)),
        "instDiagnostica":          ev.get("instDiagnostica", ev.get("instDiag", "")),
        "pctFormativa":             ev.get("pctFormativa",    ev.get("pctForm", 0)),
        "instFormativa":            ev.get("instFormativa",   ev.get("instForm", "")),
        "pctSumativa":              ev.get("pctSumativa",     ev.get("pctSuma", 0)),
        "instSumativa":             ev.get("instSumativa",    ev.get("instSuma", "")),
        "instReac":                 ev.get("instReac", ""),
        "descripcionGeneral":       ev.get("descripcionGeneral", ""),
        "tipoInstrumentoFormativa": ev.get("tipoInstrumentoFormativa", ""),
    }

    tc = payload.get("tecnicas", {})
    rh_objetivo      = tc.get("rhObjetivo", "")
    rh_instrucciones = tc.get("rhInstrucciones", "")
    en_objetivo      = tc.get("enObjetivo", "")
    en_instrucciones = tc.get("enInstrucciones", "")

    if not tc.get("rhDetalle") and (rh_objetivo or rh_instrucciones):
        tc["rhDetalle"] = (
            f"a) Explicará objetivo de la técnica:\n{rh_objetivo}\n\n"
            f"b) Dará las instrucciones de la técnica:\n{rh_instrucciones}\n\n"
            f"c) Mencionará el tiempo para realizarla.\n\n"
            f"d) Propiciará la participación del grupo.\n\n"
            f"e) Integrará al grupo.\n\n"
            f"f) Controlará el tiempo."
        )
    if not tc.get("enDetalle") and (en_objetivo or en_instrucciones):
        tc["enDetalle"] = (
            f"a) Explicará objetivo de la técnica:\n{en_objetivo}\n\n"
            f"b) Dará las instrucciones de la técnica:\n{en_instrucciones}"
        )
    if not tc.get("enObjetivo") and en_objetivo:
        tc["enObjetivo"] = en_objetivo
    payload["tecnicas"] = tc

    payload_json = json.dumps(payload, ensure_ascii=False)
    result = subprocess.run(
        ["node", str(script_path)],
        input=payload_json.encode("utf-8"),
        capture_output=True,
        cwd=str(BASE_DIR),
        timeout=30,
    )
    stderr_msg = result.stderr.decode("utf-8", errors="replace").strip()
    if result.returncode != 0 or not result.stdout:
        raise RuntimeError(f"Error al generar el documento: {stderr_msg or 'stdout vacío'}")
    try:
        return base64.b64decode(result.stdout)
    except Exception as e:
        raise RuntimeError(f"Error al decodificar base64: {e}. stderr: {stderr_msg}")


@router.post("/generate-doc/objetivos")
def generate_doc_objetivos(data: ObjetivosRequest):
    try:
        docx_bytes = crear_docx_objetivos(data)
        zip_bytes  = crear_zip_con_docx(docx_bytes)
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=objetivos_EC0217.zip"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-doc/planeacion")
def generate_doc_planeacion(data: PlaneacionRequest, request: Request):
    try:
        _validar_expediente(data)

        _is_minor_mod = False
        _should_log   = False
        user_id = getattr(getattr(request, "state", None), "user", {}).get("sub", "")

        if data.planeacion_id and user_id:
            from database import get_supabase as _gsb_dl
            _sb = _gsb_dl()

            _cnt = _sb.table("planeaciones") \
                .select("id", count="exact", head=True) \
                .eq("user_id", user_id).execute()
            if (_cnt.count or 0) > 5:
                raise HTTPException(
                    status_code=403,
                    detail="Tienes más de 5 planeaciones activas. Elimina una para poder descargar.",
                    headers={"X-Limite": "planeaciones"},
                )

            _prev_res = _sb.table("descargas") \
                .select("snapshot_instructor, snapshot_nombre_curso, snapshot_content_len") \
                .eq("planeacion_id", data.planeacion_id) \
                .eq("user_id", user_id) \
                .eq("es_slot", True) \
                .order("created_at", desc=True) \
                .limit(1).execute()
            _prev = _prev_res.data[0] if _prev_res.data else None

            _cur_instructor = (data.datos.instructor or "").strip().lower()
            _cur_nombre     = (data.datos.nombreCurso or "").strip().lower()
            _cur_len        = _calc_content_len(data)

            if _prev:
                _prev_instructor = (_prev.get("snapshot_instructor") or "").strip().lower()
                _prev_nombre     = (_prev.get("snapshot_nombre_curso") or "").strip().lower()
                _prev_len        = _prev.get("snapshot_content_len") or 0
                _diff_ratio      = abs(_cur_len - _prev_len) / max(_cur_len, _prev_len, 1)
                _is_minor_mod    = (
                    _cur_instructor == _prev_instructor and
                    _cur_nombre     == _prev_nombre     and
                    _diff_ratio     < 0.20
                )

            if not _is_minor_mod:
                _slots_res = _sb.table("descargas") \
                    .select("id", count="exact", head=True) \
                    .eq("user_id", user_id) \
                    .eq("es_slot", True).execute()
                _slots_usados = _slots_res.count or 0

                if _slots_usados >= 5:
                    raise HTTPException(
                        status_code=403,
                        detail="Límite de 5 descargas alcanzado. Contacta a tu administrador para continuar.",
                    )

                if _prev and not data.confirm_new_course:
                    raise HTTPException(
                        status_code=409,
                        detail="Se detectaron cambios significativos en el curso. Confirma para usar una descarga.",
                        headers={"X-Slots-Disponibles": str(5 - _slots_usados)},
                    )

            _should_log = True

        payload = data.model_dump()
        nombre_curso = (data.datos.nombreCurso or "EC0217").replace(" ", "_")
        tipo_form = (data.evaluaciones.tipoInstrumentoFormativa or "").lower().strip()

        documentos = [
            ("01_Documento_de_Planeacion_EC0217.docx", lambda: _generar_planeacion_docx(payload)),
            ("02_Evaluacion_Diagnostica.docx",          lambda: generar_evaluacion_diagnostica(data)),
            ("05_Evaluacion_Sumativa.docx",             lambda: generar_evaluacion_sumativa(data)),
            ("06_Evaluacion_Reaccion.docx",             lambda: generar_evaluacion_reaccion(data)),
            ("07_Lista_de_Asistencia.docx",             lambda: generar_lista_asistencia(data)),
            ("08_Contrato_de_Aprendizaje.docx",         lambda: generar_contrato_aprendizaje(data)),
            ("09_Lista_de_Requerimientos.docx",         lambda: generar_lista_requerimientos(data)),
            ("10_Guia_de_Presentacion_EC0217.pptx",     lambda: generar_presentacion_curso(data)),
        ]

        if tipo_form == "guia_observacion":
            documentos.append(("03_Evaluacion_Formativa_Guia_Observacion.docx",
                                lambda: generar_evaluacion_formativa_guia(data)))
        elif tipo_form == "lista_cotejo":
            documentos.append(("03_Evaluacion_Formativa_Cotejo.docx",
                                lambda: generar_evaluacion_formativa_cotejo(data)))
        else:
            documentos.append(("03_Evaluacion_Formativa_Cotejo.docx",
                                lambda: generar_evaluacion_formativa_cotejo(data)))
            documentos.append(("04_Evaluacion_Formativa_Guia_Observacion.docx",
                                lambda: generar_evaluacion_formativa_guia(data)))

        payload_exportable = data.model_dump()
        ev = payload_exportable.get("evaluaciones", {}) or {}
        payload_exportable["evaluaciones"] = {
            "pctDiagnostica":           ev.get("pctDiagnostica", ev.get("pctDiag", 0)),
            "pctFormativa":             ev.get("pctFormativa",   ev.get("pctForm", 0)),
            "pctSumativa":              ev.get("pctSumativa",    ev.get("pctSuma", 0)),
            "instDiagnostica":          ev.get("instDiagnostica", ev.get("instDiag", "")),
            "instFormativa":            ev.get("instFormativa",   ev.get("instForm", "")),
            "instSumativa":             ev.get("instSumativa",    ev.get("instSuma", "")),
            "instReac":                 ev.get("instReac", ""),
            "descripcionGeneral":       ev.get("descripcionGeneral", ""),
            "tipoInstrumentoFormativa": ev.get("tipoInstrumentoFormativa", ""),
        }

        payload_json_bytes = json.dumps(payload_exportable, ensure_ascii=False, indent=2).encode("utf-8")

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
            instructor = limpiar_nombre_archivo(payload_exportable.get("datos", {}).get("instructor", "Instructor"))
            fecha      = limpiar_nombre_archivo(payload_exportable.get("datos", {}).get("fecha", "Sin_fecha"))
            zf.writestr(f"{instructor}_{fecha}.json", payload_json_bytes)

            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = {executor.submit(gen): name for name, gen in documentos}
                resultados = {}
                for future in as_completed(futures):
                    name = futures[future]
                    try:
                        resultados[name] = future.result()
                    except Exception as e_doc:
                        print(f"⚠️ Error generando {name}: {repr(e_doc)}")

            for name, contenido in resultados.items():
                zf.writestr(name, contenido)

        zip_buffer.seek(0)
        zip_bytes_final = zip_buffer.read()

        if _should_log:
            try:
                from database import get_supabase as _gsb_log
                _gsb_log().table("descargas").insert({
                    "planeacion_id":         data.planeacion_id,
                    "user_id":               user_id,
                    "num_docs":              len(documentos),
                    "snapshot_instructor":   data.datos.instructor or "",
                    "snapshot_nombre_curso": data.datos.nombreCurso or "",
                    "snapshot_content_len":  _calc_content_len(data),
                    "es_slot":               not _is_minor_mod,
                }).execute()
            except Exception as e_log:
                print(f"[descargas] Error al registrar: {repr(e_log)}")

        return StreamingResponse(
            io.BytesIO(zip_bytes_final),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename=Expediente_{nombre_curso}.zip"},
        )

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR EN /generate-doc/planeacion:", repr(e))
        raise HTTPException(status_code=500, detail=str(e))
