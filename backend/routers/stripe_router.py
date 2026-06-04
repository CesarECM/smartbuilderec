from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from database import get_supabase
import stripe
import os

router = APIRouter()


def _stripe_client():
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    return stripe


# ─── Webhook Stripe ───────────────────────────────────────────────────────────

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    sc = _stripe_client()
    try:
        event = sc.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception:
        return JSONResponse({"detail": "Firma inválida."}, status_code=400)

    if event["type"] == "checkout.session.completed":
        session_obj = event["data"]["object"]
        meta = session_obj.get("metadata") or {}

        # Intentar obtener email desde customer_details o metadata
        email = (
            (session_obj.get("customer_details") or {}).get("email")
            or meta.get("email")
            or ""
        )
        nombre   = meta.get("nombre", "")
        apellido = meta.get("apellido", "")

        if not email:
            return JSONResponse({"received": True, "warning": "Sin email en sesión"})

        sb = get_supabase()
        try:
            # Crear usuario en Supabase Auth via service_role
            # El trigger handle_new_user creará el perfil automáticamente
            result = sb.auth.admin.create_user({
                "email": email,
                "email_confirm": True,
                "user_metadata": {
                    "nombre": nombre,
                    "apellido": apellido,
                },
            })
            user_id = result.user.id

            # Actualizar perfil con rol y stripe info (por si el trigger no los pone)
            stripe_customer_id = session_obj.get("customer") or ""
            sb.table("profiles").update({
                "rol": "user",
                "activo": True,
                "stripe_customer_id": stripe_customer_id,
            }).eq("id", user_id).execute()

        except Exception as e:
            err = str(e)
            # Si el usuario ya existe, ignorar el error de duplicado
            if "already been registered" in err or "already exists" in err:
                pass
            else:
                print(f"⚠️ Error creando usuario via webhook: {err}")

    return {"received": True}


# ─── Checkout (Bloque 8) ──────────────────────────────────────────────────────

# @router.post("/checkout/session")
# async def crear_checkout_session(...):
#     ...  # Pendiente Bloque 8

# @router.get("/checkout/verify")
# async def verificar_checkout(session_id: str):
#     ...  # Pendiente Bloque 8
