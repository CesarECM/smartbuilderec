# from fastapi import APIRouter, HTTPException, Request
# from fastapi.responses import JSONResponse
# from pydantic import BaseModel
# from database import get_supabase
# import stripe
# import os

# router = APIRouter()

# def _stripe_client():
#     stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
#     return stripe

# class CheckoutRequest(BaseModel):
#     curso_id: str
#     success_url: str
#     cancel_url: str

# @router.post("/checkout/session")
# async def crear_checkout_session(data: CheckoutRequest, request: Request):
#     user_id = request.state.user.get("sub")
#     sb = get_supabase()

#     # Obtener el curso
#     curso_res = sb.table("cursos").select("id, titulo, precio, stripe_price_id").eq("id", data.curso_id).single().execute()
#     if not curso_res.data:
#         raise HTTPException(status_code=404, detail="Curso no encontrado.")
#     curso = curso_res.data

#     # Obtener o crear stripe_customer_id
#     perfil_res = sb.table("profiles").select("stripe_customer_id").eq("id", user_id).single().execute()
#     perfil = perfil_res.data or {}
#     customer_id = perfil.get("stripe_customer_id")

#     sc = _stripe_client()
#     if not customer_id:
#         user_email = request.state.user.get("email", "")
#         customer = sc.Customer.create(email=user_email, metadata={"supabase_user_id": user_id})
#         customer_id = customer["id"]
#         sb.table("profiles").update({"stripe_customer_id": customer_id}).eq("id", user_id).execute()

#     # Construir line_items
#     if curso.get("stripe_price_id"):
#         line_items = [{"price": curso["stripe_price_id"], "quantity": 1}]
#     else:
#         line_items = [{
#             "price_data": {
#                 "currency": "mxn",
#                 "unit_amount": int(float(curso["precio"]) * 100),
#                 "product_data": {"name": curso["titulo"]},
#             },
#             "quantity": 1,
#         }]

#     session = sc.checkout.Session.create(
#         customer=customer_id,
#         payment_method_types=["card"],
#         mode="payment",
#         line_items=line_items,
#         success_url=data.success_url,
#         cancel_url=data.cancel_url,
#         metadata={"curso_id": data.curso_id, "user_id": user_id},
#     )
#     return {"checkout_url": session.url, "session_id": session.id}


# @router.post("/webhook/stripe")
# async def stripe_webhook(request: Request):
#     payload = await request.body()
#     sig_header = request.headers.get("stripe-signature", "")
#     webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

#     sc = _stripe_client()
#     try:
#         event = sc.Webhook.construct_event(payload, sig_header, webhook_secret)
#     except Exception:
#         return JSONResponse({"detail": "Firma inválida."}, status_code=400)

#     if event["type"] == "checkout.session.completed":
#         session_obj = event["data"]["object"]
#         meta = session_obj.get("metadata", {})
#         curso_id = meta.get("curso_id")
#         user_id = meta.get("user_id")
#         payment_id = session_obj.get("payment_intent")
#         session_id = session_obj.get("id")

#         if curso_id and user_id:
#             sb = get_supabase()
#             try:
#                 sb.table("inscripciones").upsert({
#                     "user_id": user_id,
#                     "curso_id": curso_id,
#                     "stripe_payment_id": payment_id,
#                     "stripe_session_id": session_id,
#                     "estado": "pagado",
#                 }, on_conflict="user_id,curso_id").execute()
#             except Exception:
#                 pass  # Si ya existe (compra duplicada), ignorar

#     return {"received": True}


# @router.get("/checkout/verify")
# async def verificar_checkout(session_id: str):
#     sc = _stripe_client()
#     try:
#         session_obj = sc.checkout.Session.retrieve(session_id)
#         meta = session_obj.get("metadata", {})
#         sb = get_supabase()
#         curso = None
#         if meta.get("curso_id"):
#             res = sb.table("cursos").select("titulo, descripcion").eq("id", meta["curso_id"]).single().execute()
#             curso = res.data
#         return {
#             "status": session_obj["payment_status"],
#             "curso": curso,
#         }
#     except Exception:
#         raise HTTPException(status_code=404, detail="Sesión no encontrada.")
