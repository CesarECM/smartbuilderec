import os

from services.email_service import send_template

_ESTADOS_NOTIFICAR = {"juicio", "cierre"}
_LABELS_ESTADO = {
    "juicio": "Juicio de evaluación emitido",
    "cierre": "Cédula de Evaluación disponible",
}

_FRONTEND_URL = lambda: os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")


def notificar_candidato_avance(sb, proceso_id: str, nuevo_estado: str) -> None:
    if nuevo_estado not in _ESTADOS_NOTIFICAR:
        return
    try:
        proc = sb.table("procesos_evaluacion") \
            .select("candidato_id, estandar_id") \
            .eq("id", proceso_id).maybe_single().execute()
        if not proc.data:
            return
        cand = sb.table("profiles").select("nombre, email") \
            .eq("id", proc.data["candidato_id"]).maybe_single().execute()
        ec = sb.table("estandares_competencia").select("codigo") \
            .eq("id", proc.data["estandar_id"]).maybe_single().execute()
        if not cand.data or not cand.data.get("email"):
            return
        send_template("gce_avance_proceso", cand.data["email"], {
            "nombre":          cand.data.get("nombre", cand.data["email"]),
            "ec_codigo":       (ec.data or {}).get("codigo", "GCE"),
            "estado_label":    _LABELS_ESTADO[nuevo_estado],
            "link_portafolio": f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠️ gce notify avance error: {e}")


def notificar_proceso_creado(sb, proceso_id: str, candidato_id: str,
                             estandar_id: str, ce_caller: dict) -> None:
    try:
        cand = sb.table("profiles").select("nombre, email") \
            .eq("id", candidato_id).maybe_single().execute()
        ec   = sb.table("estandares_competencia").select("codigo") \
            .eq("id", estandar_id).maybe_single().execute()
        if not cand.data or not cand.data.get("email"):
            return
        ce_nombre = " ".join(filter(None, [
            ce_caller.get("nombre"), ce_caller.get("apellido")
        ])) or ce_caller.get("email", "CE")
        send_template("gce_proceso_creado", cand.data["email"], {
            "nombre":          cand.data.get("nombre", cand.data["email"]),
            "ce_nombre":       ce_nombre,
            "ec_codigo":       (ec.data or {}).get("codigo", "EC"),
            "link_portafolio": f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠ gce_proceso_creado email error: {e}")


def notificar_evaluador_asignado(sb, proceso_id: str, evaluador_id: str) -> None:
    try:
        proc = sb.table("procesos_evaluacion") \
            .select("candidato_id, estandar_id, ce_id") \
            .eq("id", proceso_id).maybe_single().execute()
        if not proc.data:
            return
        ev_prof   = sb.table("profiles").select("nombre, email") \
            .eq("id", evaluador_id).maybe_single().execute()
        cand_prof = sb.table("profiles").select("nombre, apellido") \
            .eq("id", proc.data["candidato_id"]).maybe_single().execute()
        ec_info   = sb.table("estandares_competencia").select("codigo") \
            .eq("id", proc.data["estandar_id"]).maybe_single().execute()
        ce_prof   = sb.table("profiles").select("nombre, apellido") \
            .eq("id", proc.data["ce_id"]).maybe_single().execute()
        if not ev_prof.data or not ev_prof.data.get("email"):
            return
        cand_n = " ".join(filter(None, [
            (cand_prof.data or {}).get("nombre"), (cand_prof.data or {}).get("apellido")
        ])) or "Candidato"
        ce_n = " ".join(filter(None, [
            (ce_prof.data or {}).get("nombre"), (ce_prof.data or {}).get("apellido")
        ])) or "CE"
        send_template("gce_proceso_asignado", ev_prof.data["email"], {
            "nombre":           ev_prof.data.get("nombre", ev_prof.data["email"]),
            "ce_nombre":        ce_n,
            "candidato_nombre": cand_n,
            "ec_codigo":        (ec_info.data or {}).get("codigo", "EC"),
            "link_portafolio":  f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠ gce_proceso_asignado email error: {e}")
