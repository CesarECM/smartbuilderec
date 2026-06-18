from fastapi import APIRouter
from .users import router as users_router
from .courses import router as courses_router
from .payments import router as payments_router
from .documents import router as documents_router
from .stats import router as stats_router
from .webhooks import router as webhooks_router

router = APIRouter()

router.include_router(users_router)
router.include_router(courses_router)
router.include_router(payments_router)
router.include_router(documents_router)
router.include_router(stats_router)
router.include_router(webhooks_router)
