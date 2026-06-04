# from fastapi import APIRouter, HTTPException, Request
# from pydantic import BaseModel
# from typing import Any
# from database import get_supabase

# router = APIRouter()

# class PlaneacionCreate(BaseModel):
#     titulo: str
#     datos: Any
#     curso_id: str | None = None

# @router.get("")
# def listar_planeaciones(request: Request):
#     instructor_id = request.state.user.get("sub")
#     sb = get_supabase()
#     res = sb.table("planeaciones").select(
#         "id, titulo, curso_id, created_at"
#     ).eq("instructor_id", instructor_id).order("created_at", desc=True).execute()
#     return res.data

# @router.get("/{planeacion_id}")
# def obtener_planeacion(planeacion_id: str, request: Request):
#     instructor_id = request.state.user.get("sub")
#     sb = get_supabase()
#     res = sb.table("planeaciones").select("*").eq("id", planeacion_id).eq("instructor_id", instructor_id).single().execute()
#     if not res.data:
#         raise HTTPException(status_code=404, detail="Planeación no encontrada.")
#     return res.data

# @router.post("", status_code=201)
# def crear_planeacion(data: PlaneacionCreate, request: Request):
#     instructor_id = request.state.user.get("sub")
#     sb = get_supabase()
#     res = sb.table("planeaciones").insert({
#         "instructor_id": instructor_id,
#         "titulo": data.titulo,
#         "datos": data.datos,
#         "curso_id": data.curso_id,
#     }).execute()
#     return res.data[0]

# @router.put("/{planeacion_id}")
# def actualizar_planeacion(planeacion_id: str, data: PlaneacionCreate, request: Request):
#     instructor_id = request.state.user.get("sub")
#     sb = get_supabase()
#     res = sb.table("planeaciones").update({
#         "titulo": data.titulo,
#         "datos": data.datos,
#         "curso_id": data.curso_id,
#     }).eq("id", planeacion_id).eq("instructor_id", instructor_id).execute()
#     if not res.data:
#         raise HTTPException(status_code=404, detail="Planeación no encontrada.")
#     return res.data[0]

# @router.delete("/{planeacion_id}", status_code=204)
# def eliminar_planeacion(planeacion_id: str, request: Request):
#     instructor_id = request.state.user.get("sub")
#     sb = get_supabase()
#     sb.table("planeaciones").delete().eq("id", planeacion_id).eq("instructor_id", instructor_id).execute()
