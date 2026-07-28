import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, str(Path(__file__).resolve().parent))

load_dotenv()

app = FastAPI()

from middleware.jwt_auth import JWTAuthMiddleware

# IMPORTANTE: JWTAuthMiddleware primero (inner), CORSMiddleware después (outer).
# En Starlette los middlewares se aplican LIFO: el último en add_middleware
# es el más externo y procesa requests primero / responses último.
# CORSMiddleware debe ser outer para añadir headers CORS incluso en respuestas 401/500.
app.add_middleware(JWTAuthMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "https://ceecm-web.vercel.app",
        "https://smartbuilderec.vercel.app",
        "https://smartbuilderec.com",
        "https://www.smartbuilderec.com",
        "https://start.smartbuilderec.com",
    ],
    allow_origin_regex=r"https://smartbuilderec.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-sesion-id", "x-faq-ids"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

from routers import stripe_router
from routers import planes_router
from routers import admin_router
from routers import email_router
from routers import soporte_router
from routers import erp_router
from routers import alumno_router
from routers.api_v1 import router as api_v1_module
from routers import ia_planeacion_router, ia_tecnicas_router
from routers import ia_cierre_router, ia_evaluacion_router, ia_materiales_router
from routers import docs_router, health_router, cron_admin_router
from routers import sync_fallback_router
from routers import ia_ec0091_router, docs_ec0091_router
from routers import ia_ec0616_router, docs_ec0616_router

app.include_router(stripe_router.router,          tags=["stripe"])
app.include_router(planes_router.router)
app.include_router(admin_router.router,           tags=["admin"])
app.include_router(email_router.router,           tags=["email"])
app.include_router(soporte_router.router,         tags=["soporte"])
app.include_router(erp_router.router,             tags=["erp"])
app.include_router(alumno_router.router,          tags=["alumno"])
app.include_router(api_v1_module.router)
app.include_router(ia_planeacion_router.router,   tags=["ia"])
app.include_router(ia_tecnicas_router.router,     tags=["ia"])
app.include_router(ia_cierre_router.router,       tags=["ia"])
app.include_router(ia_evaluacion_router.router,   tags=["ia"])
app.include_router(ia_materiales_router.router,   tags=["ia"])
app.include_router(docs_router.router,            tags=["docs"])
app.include_router(health_router.router,          tags=["health"])
app.include_router(cron_admin_router.router,      tags=["admin"])
app.include_router(sync_fallback_router.router,   tags=["wizard"])
app.include_router(ia_ec0091_router.router)
app.include_router(docs_ec0091_router.router)
app.include_router(ia_ec0616_router.router)
app.include_router(docs_ec0616_router.router)


@app.get("/")
def home():
    return {"message": "SmartBuilder EC — API funcionando correctamente"}
