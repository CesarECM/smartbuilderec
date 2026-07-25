"""
Lógica extraída de stripe_router.py para mantener el router bajo 300 líneas.
Maneja checkout de instructores individuales (pago único, flujo original).
"""
import os
import time
from datetime import datetime, timedelta, timezone

from database import get_supabase
from services.email_service import send_template
from services.capi import send_purchase_event


def extract_session_data(session) -> dict:
    cd       = getattr(session, "customer_details", None)
    cd_email = getattr(cd, "email", None) if cd else None
    cd_name  = getattr(cd, "name",  None) if cd else None
    customer = getattr(session, "customer", None) or ""
    if customer and not isinstance(customer, str):
        customer = getattr(customer, "id", "") or ""
    return {
        "email":      str(cd_email or ""),
        "nombre":     str(cd_name  or ""),
        "customer":   str(customer),
        "amount":     getattr(session, "amount_total", None) or 179900,
        "pstatus":    getattr(session, "payment_status", None) or "",
        "session_id": getattr(session, "id", None) or "",
        "event_time": getattr(session, "created", None) or int(time.time()),
        "success_url":getattr(session, "success_url", None) or "",
    }


def handle_checkout_completed(session):
    data = session if (isinstance(session, dict) and "email" in session) else extract_session_data(session)

    email    = data["email"]
    nombre   = data["nombre"]
    customer = data["customer"]
    monto    = data["amount"]

    if not email:
        print("[checkout] Sin email — no se puede crear usuario")
        return

    vigencia = (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d")
    sb = get_supabase()
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")

    try:
        result = sb.auth.admin.create_user({
            "email": email, "email_confirm": True,
            "user_metadata": {"nombre": nombre},
        })
        user_id = result.user.id
        sb.table("profiles").update({
            "nombre": nombre, "rol": "user", "activo": True,
            "admin_id": None, "stripe_customer_id": customer,
            "vigencia_hasta": vigencia,
        }).eq("id", user_id).execute()

        link = _gen_recovery_link(sb, email, frontend_url)
        send_template("bienvenida_user_stripe", email, {
            "nombre": nombre or email, "email": email,
            "monto": f"${monto // 100:,.0f} MXN", "link_acceso": link,
        })
        print(f"[checkout] Usuario creado: {email}")

    except Exception as e:
        err = str(e)
        if "already been registered" in err or "already exists" in err:
            try:
                sb.table("profiles").update({
                    "stripe_customer_id": customer, "activo": True,
                    "vigencia_hasta": vigencia,
                }).eq("email", email).execute()
                link = _gen_recovery_link(sb, email, frontend_url)
                send_template("bienvenida_user_stripe", email, {
                    "nombre": nombre or email, "email": email,
                    "monto": f"${monto // 100:,.0f} MXN", "link_acceso": link,
                })
                print(f"[checkout] Usuario existente reactivado: {email}")
            except Exception as re2:
                print(f"⚠️ reactivación error: {re2}")
        else:
            print(f"⚠️ checkout_completed error: {err}")

    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
    send_purchase_event(
        event_id=data.get("session_id") or email,
        event_time=data.get("event_time", 0),
        email=email, value_centavos=monto, currency="MXN",
        event_source_url=f"{frontend_url}/checkout-success.html",
    )


def handle_subscription_ended(subscription: dict):
    customer_id = subscription.get("customer", "")
    if not customer_id:
        return
    sb = get_supabase()
    try:
        res = sb.table("profiles").select("nombre, email") \
            .eq("stripe_customer_id", customer_id).single().execute()
        sb.table("profiles").update({"activo": False}) \
            .eq("stripe_customer_id", customer_id).execute()
        if res.data and res.data.get("email"):
            send_template("suscripcion_cancelada", res.data["email"], {
                "nombre": res.data.get("nombre") or res.data["email"],
                "email": res.data["email"],
            })
    except Exception as e:
        print(f"⚠️ subscription_ended error: {e}")


def _gen_recovery_link(sb, email: str, frontend_url: str) -> str:
    link = f"{frontend_url}/reset-password.html"
    try:
        res = sb.auth.admin.generate_link({
            "type": "recovery", "email": email,
            "options": {"redirect_to": f"{frontend_url}/reset-password.html"},
        })
        if hasattr(res, "properties") and res.properties:
            link = getattr(res.properties, "action_link", link) or link
    except Exception:
        pass
    return link
