from fastapi import APIRouter

from routers.erp.normas_router import router as normas_router
from routers.erp.alumnos_lista import router as alumnos_lista_router
from routers.erp.alumnos_detalle import router as alumnos_detalle_router
from routers.erp.asignaciones_router import router as asignaciones_router
from routers.erp.certificacion_router import router as certificacion_router
from routers.erp.roles_router import router as roles_router

router = APIRouter()
router.include_router(normas_router)
router.include_router(alumnos_lista_router)
router.include_router(alumnos_detalle_router)
router.include_router(asignaciones_router)
router.include_router(certificacion_router)
router.include_router(roles_router)
