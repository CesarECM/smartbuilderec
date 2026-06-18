from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from database import get_supabase
from .auth import require_api_key, _ok
import stripe
import os

router = APIRouter(prefix="/api/v1/stats", tags=["ecmatic-stats"])


def _stripe_client():
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")
    return stripe


@router.get("/overview", dependencies=[Depends(require_api_key)])
def stats_overview():
    sb = get_supabase()

    users_res = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("activo", True).execute()

    instructors_res = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("rol", "user").eq("activo", True).execute()

    courses_res = sb.table("planeaciones").select("id", count="exact", head=True).execute()

    downloads_res = sb.table("descargas").select("id", count="exact", head=True) \
        .eq("es_slot", True).execute()

    pagos_res = sb.table("pagos").select("monto, moneda").execute()
    total_revenue_mxn = sum(
        p["monto"] for p in (pagos_res.data or [])
        if p.get("moneda", "MXN").upper() == "MXN"
    )

    stripe_revenue = 0
    try:
        sc = _stripe_client()
        if sc.api_key and sc.api_key.startswith("sk_"):
            sessions = sc.checkout.Session.list(limit=100, payment_status="paid")
            stripe_revenue = sum((s.amount_total or 0) for s in sessions.data) // 100
    except Exception:
        pass

    return _ok({
        "usuarios_activos": users_res.count or 0,
        "instructores_activos": instructors_res.count or 0,
        "cursos_total": courses_res.count or 0,
        "documentos_descargados": downloads_res.count or 0,
        "ingresos_erp_mxn": total_revenue_mxn,
        "ingresos_stripe_mxn": stripe_revenue,
        "ingresos_total_mxn": total_revenue_mxn + stripe_revenue,
    })


@router.get("/users", dependencies=[Depends(require_api_key)])
def stats_users(
    periodo: str = Query("30d", description="7d | 30d | 90d | 365d"),
):
    sb = get_supabase()

    dias = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(periodo, 30)
    desde = (datetime.now(timezone.utc) - timedelta(days=dias)).isoformat()

    nuevos_res = sb.table("profiles").select("id", count="exact", head=True) \
        .gte("created_at", desde).execute()

    por_rol_user = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("rol", "user").execute()
    por_rol_admin = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("rol", "admin").execute()

    activos_res = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("activo", True).execute()
    inactivos_res = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("activo", False).execute()

    return _ok({
        "periodo": periodo,
        "nuevos_registros": nuevos_res.count or 0,
        "total_instructores": por_rol_user.count or 0,
        "total_admins": por_rol_admin.count or 0,
        "activos": activos_res.count or 0,
        "inactivos": inactivos_res.count or 0,
    })


@router.get("/revenue", dependencies=[Depends(require_api_key)])
def stats_revenue(
    periodo: str = Query("30d", description="7d | 30d | 90d | 365d"),
):
    sb = get_supabase()

    dias = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(periodo, 30)
    desde = (datetime.now(timezone.utc) - timedelta(days=dias)).isoformat()

    pagos_periodo = sb.table("pagos").select("concepto, monto, moneda, pagado_at") \
        .gte("created_at", desde).execute()

    por_concepto: dict[str, int] = {}
    total = 0
    for p in (pagos_periodo.data or []):
        if p.get("moneda", "MXN").upper() == "MXN":
            concepto = p.get("concepto", "otro")
            por_concepto[concepto] = por_concepto.get(concepto, 0) + (p.get("monto") or 0)
            total += p.get("monto") or 0

    stripe_periodo = 0
    stripe_count = 0
    try:
        sc = _stripe_client()
        if sc.api_key and sc.api_key.startswith("sk_"):
            sessions = sc.checkout.Session.list(limit=100, payment_status="paid")
            cutoff = int((datetime.now(timezone.utc) - timedelta(days=dias)).timestamp())
            for s in sessions.data:
                if s.created >= cutoff:
                    stripe_periodo += (s.amount_total or 0) // 100
                    stripe_count += 1
    except Exception:
        pass

    return _ok({
        "periodo": periodo,
        "ingresos_erp_mxn": total,
        "ingresos_erp_por_concepto": por_concepto,
        "ingresos_stripe_mxn": stripe_periodo,
        "stripe_transacciones": stripe_count,
        "total_mxn": total + stripe_periodo,
    })


@router.get("/activity", dependencies=[Depends(require_api_key)])
def stats_activity(
    periodo: str = Query("30d", description="7d | 30d | 90d | 365d"),
):
    sb = get_supabase()

    dias = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(periodo, 30)
    desde = (datetime.now(timezone.utc) - timedelta(days=dias)).isoformat()

    cursos_iniciados = sb.table("planeaciones").select("id", count="exact", head=True) \
        .gte("created_at", desde).execute()

    descargas_periodo = sb.table("descargas").select("id", count="exact", head=True) \
        .eq("es_slot", True).gte("created_at", desde).execute()

    usuarios_con_curso = sb.table("planeaciones").select("user_id").gte("created_at", desde).execute()
    unique_users = len({r["user_id"] for r in (usuarios_con_curso.data or [])})

    return _ok({
        "periodo": periodo,
        "cursos_iniciados": cursos_iniciados.count or 0,
        "documentos_descargados": descargas_periodo.count or 0,
        "usuarios_activos_con_curso": unique_users,
    })
