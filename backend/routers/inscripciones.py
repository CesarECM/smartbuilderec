# from fastapi import APIRouter, HTTPException, Request
# from pydantic import BaseModel
# from database import get_supabase

# router = APIRouter()

# class InscripcionGratisRequest(BaseModel):
#     curso_id: str

# @router.get("/mias")
# def mis_inscripciones(request: Request):
#     user_id = request.state.user.get("sub")
#     sb = get_supabase()
#     res = sb.table("inscripciones").select(
#         "id, curso_id, estado, fecha_pago, cursos(titulo, descripcion, duracion_horas, imagen_url)"
#     ).eq("user_id", user_id).eq("estado", "pagado").order("fecha_pago", desc=True).execute()
#     return res.data

# @router.post("/gratis", status_code=201)
# def inscribirse_gratis(data: InscripcionGratisRequest, request: Request):
#     user_id = request.state.user.get("sub")
#     sb = get_supabase()

#     curso_res = sb.table("cursos").select("precio").eq("id", data.curso_id).single().execute()
#     if not curso_res.data:
#         raise HTTPException(status_code=404, detail="Curso no encontrado.")
#     if float(curso_res.data.get("precio", 1)) > 0:
#         raise HTTPException(status_code=400, detail="Este curso no es gratuito.")

#     res = sb.table("inscripciones").upsert({
#         "user_id": user_id,
#         "curso_id": data.curso_id,
#         "estado": "pagado",
#     }, on_conflict="user_id,curso_id").execute()
#     return res.data[0] if res.data else {"ok": True}
