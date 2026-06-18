from fastapi import APIRouter, Request
from database import get_supabase

router = APIRouter()


@router.get("/alumno/estado")
def get_alumno_estado(request: Request):
    """
    Devuelve el estado de límites del alumno:
    - planeaciones activas vs. máximo de 5
    - slots de descarga usados vs. máximo de 5
    - modo_degradado: True cuando planeaciones > 5
    """
    user_id = request.state.user.get("sub", "")
    sb = get_supabase()

    count_res = sb.table("planeaciones") \
        .select("id", count="exact", head=True) \
        .eq("user_id", user_id) \
        .execute()
    planeaciones_count = count_res.count or 0

    slots_usados = 0
    try:
        slots_res = sb.table("descargas") \
            .select("id", count="exact", head=True) \
            .eq("user_id", user_id) \
            .eq("es_slot", True) \
            .execute()
        slots_usados = slots_res.count or 0
    except Exception as e:
        print(f"[alumno_router] No se pudo leer descargas: {repr(e)}")

    return {
        "planeaciones_count": planeaciones_count,
        "planeaciones_max": 5,
        "slots_usados": slots_usados,
        "slots_max": 5,
        "slots_disponibles": max(0, 5 - slots_usados),
        "modo_degradado": planeaciones_count > 5,
    }
