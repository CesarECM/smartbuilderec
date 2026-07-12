from fastapi import APIRouter

from routers.soporte.chat_router import router as chat_router
from routers.soporte.tickets_router import router as tickets_router
from routers.soporte.sugerencias_router import router as sugerencias_router
from routers.soporte.kb_router import router as kb_router
from routers.soporte.cron_router import router as cron_router

router = APIRouter()
router.include_router(chat_router)
router.include_router(tickets_router)
router.include_router(sugerencias_router)
router.include_router(kb_router)
router.include_router(cron_router)
