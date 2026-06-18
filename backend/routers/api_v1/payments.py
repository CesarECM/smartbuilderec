from fastapi import APIRouter, Depends, Query
from fastapi.background import BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from database import get_supabase
from .auth import require_api_key, _ok, _err
from .webhooks import dispatch_event
import stripe
import os

router = APIRouter(prefix="/api/v1", tags=["ecmatic-payments"])


def _stripe_client():
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        _err("STRIPE_SECRET_KEY no configurada.", 500)
    stripe.api_key = key
    return stripe


# ─── Pagos ───────────────────────────────────────────────────────────────────


class PaymentCreate(BaseModel):
    alumno_id: str
    norma_id: Optional[str] = None
    concepto: str
    monto: int = 0
    moneda: str = "MXN"
    tipo: str = "manual"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    pagado_at: Optional[str] = None


@router.get("/payments", dependencies=[Depends(require_api_key)])
def list_payments(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    alumno_id: Optional[str] = None,
    concepto: Optional[str] = None,
    tipo: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    query = sb.table("pagos").select(
        "id, alumno_id, norma_id, concepto, tipo, monto, moneda, referencia, notas, pagado_at, created_at",
        count="exact",
    )

    if alumno_id:
        query = query.eq("alumno_id", alumno_id)
    if concepto:
        query = query.eq("concepto", concepto)
    if tipo:
        query = query.eq("tipo", tipo)
    if desde:
        query = query.gte("pagado_at", desde)
    if hasta:
        query = query.lte("pagado_at", hasta)

    res = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

    return _ok(
        res.data or [],
        {"total": res.count or 0, "page": page, "per_page": per_page},
    )


@router.get("/payments/{payment_id}", dependencies=[Depends(require_api_key)])
def get_payment(payment_id: str):
    sb = get_supabase()
    res = sb.table("pagos").select("*").eq("id", payment_id).single().execute()
    if not res.data:
        _err("Pago no encontrado.", 404)
    return _ok(res.data)


@router.post("/payments", status_code=201, dependencies=[Depends(require_api_key)])
def create_payment(data: PaymentCreate, background_tasks: BackgroundTasks):
    sb = get_supabase()

    user_check = sb.table("profiles").select("id").eq("id", data.alumno_id).single().execute()
    if not user_check.data:
        _err("El alumno_id no existe.", 422)

    payload = data.model_dump(exclude_none=True)
    res = sb.table("pagos").insert(payload).execute()
    if not res.data:
        _err("Error al registrar el pago.", 500)

    pago = res.data[0]
    background_tasks.add_task(dispatch_event, "payment.completed", pago)
    return _ok(pago)


@router.get("/users/{user_id}/payments", dependencies=[Depends(require_api_key)])
def list_payments_by_user(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    res = sb.table("pagos").select("*", count="exact") \
        .eq("alumno_id", user_id) \
        .order("created_at", desc=True) \
        .range(offset, offset + per_page - 1) \
        .execute()

    # También traemos el historial de Stripe si el usuario tiene stripe_customer_id
    stripe_charges = []
    profile_res = sb.table("profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
    customer_id = (profile_res.data or {}).get("stripe_customer_id")

    if customer_id:
        try:
            sc = _stripe_client()
            charges = sc.PaymentIntent.list(customer=customer_id, limit=50)
            stripe_charges = [
                {
                    "stripe_id": c.id,
                    "monto": c.amount,
                    "moneda": c.currency.upper(),
                    "status": c.status,
                    "created_at": c.created,
                }
                for c in charges.data
            ]
        except Exception:
            pass

    return _ok(
        {
            "pagos_erp": res.data or [],
            "pagos_stripe": stripe_charges,
        },
        {"total_erp": res.count or 0, "page": page, "per_page": per_page},
    )


# ─── Suscripciones / Checkout Sessions de Stripe ─────────────────────────────


@router.get("/subscriptions", dependencies=[Depends(require_api_key)])
def list_subscriptions(
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
):
    try:
        sc = _stripe_client()
        params = {"limit": limit}
        if status:
            params["status"] = status
        sessions = sc.checkout.Session.list(**params)
        data = [
            {
                "id": s.id,
                "customer_email": getattr(s.customer_details, "email", None) if s.customer_details else None,
                "amount_total": s.amount_total,
                "currency": (s.currency or "").upper(),
                "payment_status": s.payment_status,
                "status": s.status,
                "created": s.created,
            }
            for s in sessions.data
        ]
        return _ok(data, {"has_more": sessions.has_more})
    except stripe.StripeError as e:
        _err(str(e), 502)


@router.get("/subscriptions/{session_id}", dependencies=[Depends(require_api_key)])
def get_subscription(session_id: str):
    try:
        sc = _stripe_client()
        s = sc.checkout.Session.retrieve(session_id)
        return _ok({
            "id": s.id,
            "customer_email": getattr(s.customer_details, "email", None) if s.customer_details else None,
            "amount_total": s.amount_total,
            "currency": (s.currency or "").upper(),
            "payment_status": s.payment_status,
            "status": s.status,
            "created": s.created,
            "metadata": s.metadata,
        })
    except stripe.StripeError as e:
        _err(str(e), 404)


class SubscriptionUpdate(BaseModel):
    stripe_customer_id: str
    action: str  # cancel | reactivate


@router.patch("/subscriptions/{subscription_id}", dependencies=[Depends(require_api_key)])
def update_subscription(subscription_id: str, data: SubscriptionUpdate, background_tasks: BackgroundTasks):
    """Cancela o reactiva una suscripción de Stripe."""
    try:
        sc = _stripe_client()
        if data.action == "cancel":
            result = sc.Subscription.cancel(subscription_id)
        elif data.action == "reactivate":
            result = sc.Subscription.modify(subscription_id, cancel_at_period_end=False)
        else:
            _err("Acción inválida. Usa 'cancel' o 'reactivate'.", 400)

        background_tasks.add_task(dispatch_event, "payment.completed", {
            "subscription_id": subscription_id,
            "action": data.action,
            "status": result.status,
        })
        return _ok({"subscription_id": subscription_id, "status": result.status, "action": data.action})
    except stripe.StripeError as e:
        _err(str(e), 502)
