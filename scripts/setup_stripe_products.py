"""
Sprint 1.1 — Crear productos y precios en Stripe.
Ejecutar UNA sola vez: cd backend && python ../scripts/setup_stripe_products.py

Requiere STRIPE_SECRET_KEY (o STRIPE_SECRET_KEY_TEST si TEST_MODE=true) en el .env del backend.
Imprime los price IDs que debes agregar a tus variables de entorno.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

import stripe

test_mode = os.getenv("STRIPE_TEST_MODE", "false").strip().lower() == "true"
key = os.getenv("STRIPE_SECRET_KEY_TEST" if test_mode else "STRIPE_SECRET_KEY")
if not key:
    print("ERROR: No se encontró STRIPE_SECRET_KEY en el .env del backend.")
    sys.exit(1)

stripe.api_key = key
modo = "TEST" if test_mode else "LIVE"
print(f"\n=== Creando productos Stripe ({modo} mode) ===\n")

PLANES = [
    {"name": "Plan Básico",       "key": "BASICO",      "amount": 39900,  "credits": 10,  "recurring": True},
    {"name": "Plan Profesional",  "key": "PROFESIONAL", "amount": 79900,  "credits": 25,  "recurring": True},
    {"name": "Plan Partner",      "key": "PARTNER",     "amount": 149900, "credits": 60,  "recurring": True},
    {"name": "Créditos Extra +10","key": "CREDITOS_EXTRA", "amount": 35000, "credits": 10, "recurring": False},
]

price_ids = {}

for plan in PLANES:
    product = stripe.Product.create(
        name=plan["name"],
        metadata={"credits": str(plan["credits"])},
    )
    price_params = {
        "unit_amount": plan["amount"],
        "currency": "mxn",
        "product": product.id,
    }
    if plan["recurring"]:
        price_params["recurring"] = {"interval": "month"}

    price = stripe.Price.create(**price_params)
    price_ids[plan["key"]] = price.id
    status = "suscripción mensual" if plan["recurring"] else "pago único"
    print(f"OK {plan['name']:25s} | {status:22s} | ${plan['amount']/100:.2f} MXN | {price.id}")

suffix = "_TEST" if test_mode else ""
print(f"\n=== Agrega estas variables de entorno ===\n")
for key_name, price_id in price_ids.items():
    print(f"STRIPE_PRICE_{key_name}{suffix}={price_id}")

print("\nAgrega estas vars al .env del backend y a las variables de entorno de Render.")
