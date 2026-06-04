# from fastapi import APIRouter, HTTPException, Request
# from pydantic import BaseModel
# from database import get_supabase

# router = APIRouter()

# class CursoCreate(BaseModel):
#     titulo: str
#     descripcion: str = ""
#     duracion_horas: int = 0
#     precio: float
#     imagen_url: str = ""
#     stripe_price_id: str = ""

# @router.get("")
# def listar_cursos():
#     sb = get_supabase()
#     res = sb.table("cursos").select(
#         "id, titulo, descripcion, duracion_horas, precio, imagen_url, created_at, "
#         "profiles!cursos_instructor_id_fkey(nombre, apellido)"
#     ).eq("activo", True).order("created_at", desc=True).execute()
#     return res.data

# @router.get("/{curso_id}")
# def detalle_curso(curso_id: str):
#     sb = get_supabase()
#     res = sb.table("cursos").select(
#         "*, profiles!cursos_instructor_id_fkey(nombre, apellido)"
#     ).eq("id", curso_id).eq("activo", True).single().execute()
#     if not res.data:
#         raise HTTPException(status_code=404, detail="Curso no encontrado.")
#     return res.data

# @router.post("", status_code=201)
# def crear_curso(data: CursoCreate, request: Request):
#     instructor_id = request.state.user.get("sub")
#     sb = get_supabase()
#     nuevo = {
#         "titulo": data.titulo,
#         "descripcion": data.descripcion,
#         "duracion_horas": data.duracion_horas,
#         "precio": data.precio,
#         "imagen_url": data.imagen_url,
#         "stripe_price_id": data.stripe_price_id,
#         "instructor_id": instructor_id,
#         "activo": True,
#     }
#     res = sb.table("cursos").insert(nuevo).execute()
#     return res.data[0]
