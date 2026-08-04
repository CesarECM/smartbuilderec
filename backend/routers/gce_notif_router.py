import os

from fastapi import APIRouter, Request

from database import get_supabase
from services.erp_helpers import _caller
from services.gce_notificaciones import build_notifs

router = APIRouter(prefix="/gce", tags=["gce"])

_FRONTEND_URL = lambda: os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")


@router.get("/notificaciones")
def mis_notificaciones(request: Request):
    sb  = get_supabase()
    uid = _caller(request)

    res = sb.table("procesos_evaluacion") \
        .select("id,estado,datos,candidato_id,evaluador_id,ce_id,estandar_id,"
                "updated_at,created_at,estandares_competencia(codigo)") \
        .or_(f"candidato_id.eq.{uid},evaluador_id.eq.{uid},ce_id.eq.{uid}") \
        .neq("estado", "certificado") \
        .execute()

    procesos = res.data or []

    cand_ids = list({p["candidato_id"] for p in procesos if p.get("candidato_id")})
    cand_map: dict = {}
    if cand_ids:
        cp = sb.table("profiles").select("id,nombre,apellido").in_("id", cand_ids).execute()
        cand_map = {p["id"]: p for p in (cp.data or [])}

    frontend_url = _FRONTEND_URL()
    notificaciones = []
    for proceso in procesos:
        notificaciones.extend(build_notifs(proceso, uid, cand_map, frontend_url))

    orden = {"alerta": 0, "urgente": 1, "en_espera": 2}
    notificaciones.sort(key=lambda n: (orden.get(n["tipo"], 3), -(n.get("horas_sin_cambio") or 0)))

    urgentes = sum(1 for n in notificaciones if n["tipo"] in ("alerta", "urgente"))
    return {"notificaciones": notificaciones, "urgentes": urgentes}
