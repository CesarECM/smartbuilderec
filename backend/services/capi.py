import hashlib
import hmac
import os
import time

import httpx

_CAPI_BASE = "https://graph.facebook.com/v21.0/{pixel_id}/events"


def _sha256(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()


def _appsecret_proof(access_token: str, app_secret: str) -> str:
    return hmac.new(app_secret.encode(), access_token.encode(), hashlib.sha256).hexdigest()


def send_purchase_event(
    event_id: str,
    event_time: int,
    email: str,
    value_centavos: int,
    currency: str = "MXN",
    event_source_url: str = "",
) -> None:
    """Envía evento Purchase a la Conversions API de Meta (server-side).

    event_id debe ser el session_id de Stripe para deduplicar con el pixel
    de navegador que usa el mismo valor como eventID en fbq('track','Purchase').
    """
    pixel_id = os.getenv("FB_PIXEL_ID", "").strip()
    access_token = os.getenv("FB_ACCESS_TOKEN", "").strip()
    app_secret = os.getenv("FB_APP_SECRET", "").strip()

    if not pixel_id or not access_token:
        print("[capi] FB_PIXEL_ID o FB_ACCESS_TOKEN no configurados — omitiendo")
        return

    user_data: dict = {}
    if email:
        user_data["em"] = [_sha256(email)]

    event: dict = {
        "event_name": "Purchase",
        "event_time": event_time or int(time.time()),
        "event_id": event_id,
        "action_source": "website",
        "user_data": user_data,
        "custom_data": {
            "value": round(value_centavos / 100, 2),
            "currency": currency,
            "content_type": "product",
            "content_name": "SmartBuilderEC Plan Instructor EC0217",
        },
    }
    if event_source_url:
        event["event_source_url"] = event_source_url

    payload: dict = {"data": [event]}

    test_code = os.getenv("FB_TEST_EVENT_CODE", "").strip()
    if test_code:
        payload["test_event_code"] = test_code

    url = _CAPI_BASE.format(pixel_id=pixel_id)
    params: dict = {"access_token": access_token}
    if app_secret:
        params["appsecret_proof"] = _appsecret_proof(access_token, app_secret)

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.post(url, json=payload, params=params)
            body = resp.json()
            if resp.status_code == 200:
                events_received = body.get("events_received", "?")
                print(f"[capi] Purchase enviado — event_id={event_id}, events_received={events_received}")
            else:
                print(f"[capi] Error HTTP {resp.status_code}: {body}")
    except Exception as e:
        print(f"[capi] Error enviando Purchase: {type(e).__name__}: {e}")
