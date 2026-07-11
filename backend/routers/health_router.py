import asyncio
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

router = APIRouter()


def _test_vigencias_proximas():
    from database import get_supabase as _gsb
    from datetime import date, timedelta
    sb = _gsb()
    hoy    = date.today().isoformat()
    limite = (date.today() + timedelta(days=7)).isoformat()
    r = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("rol", "admin").eq("activo", True) \
        .gte("vigencia_hasta", hoy).lte("vigencia_hasta", limite).execute()
    n = r.count or 0
    if n > 0:
        return {"status": "warning", "pendientes": n,
                "message": f"{n} admin{'s' if n != 1 else ''} con vigencia por vencer en ≤7 días"}
    return {"pendientes": 0}


def _test_admins_sin_creditos():
    from database import get_supabase as _gsb
    sb = _gsb()
    r = sb.table("profiles").select("id", count="exact", head=True) \
        .eq("rol", "admin").eq("activo", True).eq("credits", 0).execute()
    n = r.count or 0
    if n > 0:
        return {"status": "warning", "pendientes": n,
                "message": f"{n} admin{'s' if n != 1 else ''} con 0 créditos — no pueden registrar usuarios"}
    return {"pendientes": 0}


def _test_usuarios_sin_plan():
    from database import get_supabase as _gsb
    from datetime import datetime as _dt, timedelta as _td, timezone as _tz
    sb = _gsb()
    hace_7 = (_dt.now(_tz.utc) - _td(days=7)).isoformat()
    usuarios = sb.table("profiles").select("id") \
        .eq("rol", "user").eq("activo", True).lt("created_at", hace_7).limit(300).execute()
    ids = [u["id"] for u in (usuarios.data or [])]
    if not ids:
        return {"pendientes": 0}
    con_plan = sb.table("planeaciones").select("user_id").in_("user_id", ids).execute()
    con_ids  = {p["user_id"] for p in (con_plan.data or [])}
    n = len([i for i in ids if i not in con_ids])
    if n > 0:
        return {"status": "warning", "pendientes": n,
                "message": f"{n} usuario{'s' if n != 1 else ''} registrado{'s' if n != 1 else ''} hace +7 días sin ninguna planeación"}
    return {"pendientes": 0}


def _test_kb_pendientes(tabla, campo, valor, singular, descripcion, invert=False):
    from database import get_supabase as _gsb
    sb = _gsb()
    q = sb.table(tabla).select("id", count="exact", head=True)
    q = q.eq(campo, valor) if invert else q.neq(campo, valor)
    r = q.execute()
    n = r.count or 0
    if n > 0:
        return {"status": "warning", "pendientes": n, "message": f"{n} {singular}{'s' if n != 1 else ''} {descripcion}"}
    return {"pendientes": 0}


@router.get("/health/integraciones")
async def health_integraciones(request: Request):
    import time as _time

    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    from database import get_supabase as _get_sb
    sb = _get_sb()
    prof = sb.table("profiles").select("rol").eq("id", user.get("sub")).single().execute()
    if not prof.data or prof.data.get("rol") != "super_admin":
        raise HTTPException(status_code=403, detail="Solo superadmin.")

    loop = asyncio.get_running_loop()

    async def _chk(key: str, fn):
        try:
            t0 = _time.time()
            extra = await loop.run_in_executor(None, fn)
            return key, {"status": "ok", "latency_ms": round((_time.time() - t0) * 1000), **(extra or {})}
        except Exception as e:
            return key, {"status": "error", "error": str(e)[:150]}

    def _test_claude():
        import anthropic as _ant
        key = os.getenv("ANTHROPIC_API_KEY", "")
        if not key:
            raise ValueError("ANTHROPIC_API_KEY no configurada")
        c = _ant.Anthropic(api_key=key)
        c.messages.create(model="claude-haiku-4-5-20251001", max_tokens=1,
                          messages=[{"role": "user", "content": "ping"}])
        return {"note": "Haiku + Sonnet disponibles"}

    def _test_openai():
        from openai import OpenAI as _OAI
        key = os.getenv("OPENAI_API_KEY", "")
        if not key:
            raise ValueError("OPENAI_API_KEY no configurada")
        c = _OAI(api_key=key)
        c.embeddings.create(model="text-embedding-3-small", input="ping")
        return {"model": "text-embedding-3-small"}

    def _test_supabase():
        r = sb.table("profiles").select("id", count="exact", head=True).execute()
        return {"perfiles": r.count}

    def _test_pgvector():
        zero = [0.0] * 1536
        sb.rpc("match_knowledge", {"query_embedding": zero, "similarity_threshold": 0.9999,
                                    "match_count": 1, "filtro_contexto": None}).execute()
        r = sb.table("knowledge_faqs").select("id", count="exact", head=True).eq("activo", True).execute()
        return {"faqs_activas": r.count}

    def _test_resend():
        key = os.getenv("RESEND_API_KEY", "")
        if not key or not key.startswith("re_"):
            raise ValueError("RESEND_API_KEY no configurada")
        return {"from": os.getenv("RESEND_FROM_EMAIL", "configurado")}

    def _test_stripe():
        import stripe as _stripe
        key = os.getenv("STRIPE_SECRET_KEY", "")
        if not key or not key.startswith("sk_"):
            raise ValueError("STRIPE_SECRET_KEY no configurada")
        client = _stripe.StripeClient(key)
        client.balance.retrieve()
        return {"mode": "test" if "test" in key else "live"}

    def _test_docs():
        from docx import Document as _Doc
        from pptx import Presentation as _Prs
        import io
        buf = io.BytesIO()
        _Doc().save(buf)
        if buf.tell() == 0:
            raise ValueError("python-docx generó buffer vacío")
        buf2 = io.BytesIO()
        _Prs().save(buf2)
        if buf2.tell() == 0:
            raise ValueError("python-pptx generó buffer vacío")
        return {"docx": "ok", "pptx": "ok"}

    def _test_stripe_pagos():
        import stripe as _stripe
        key = os.getenv("STRIPE_SECRET_KEY", "")
        if not key or not key.startswith("sk_"):
            raise ValueError("STRIPE_SECRET_KEY no configurada")
        client = _stripe.StripeClient(key)
        sessions = client.checkout.sessions.list(params={"limit": 1, "status": "complete"})
        if not sessions.data:
            return {"ultimo": "sin pagos aún", "monto": None}
        s = sessions.data[0]
        diff = int(_time.time() - s.created)
        if diff < 3600:    hace = f"hace {diff // 60} min"
        elif diff < 86400: hace = f"hace {diff // 3600}h"
        else:              hace = f"hace {diff // 86400}d"
        return {"monto": f"${(s.amount_total or 0) // 100:,.0f} MXN", "hace": hace}

    def _test_tokens_ia():
        import httpx as _httpx
        from datetime import date as _date
        key = os.getenv("OPENAI_API_KEY", "")
        if not key:
            raise ValueError("OPENAI_API_KEY no configurada")
        today = _date.today().isoformat()
        r = _httpx.get("https://api.openai.com/v1/usage",
                       params={"date": today},
                       headers={"Authorization": f"Bearer {key}"},
                       timeout=8)
        if r.status_code == 403:
            raise ValueError("Permiso 'Usage' no habilitado en esta API key")
        if r.status_code != 200:
            raise ValueError(f"OpenAI Usage API respondió HTTP {r.status_code}")
        entries = r.json().get("data", [])
        tokens = sum(d.get("n_context_tokens_total", 0) + d.get("n_generated_tokens_total", 0) for d in entries)
        costo = round(tokens * 0.00000035, 4)
        return {"tokens": f"{tokens:,}", "costo": f"~${costo:.3f} USD"}

    checks = await asyncio.gather(
        _chk("claude",              _test_claude),
        _chk("openai",              _test_openai),
        _chk("supabase",            _test_supabase),
        _chk("pgvector",            _test_pgvector),
        _chk("resend",              _test_resend),
        _chk("stripe",              _test_stripe),
        _chk("docs",                _test_docs),
        _chk("stripe_pagos",        _test_stripe_pagos),
        _chk("tokens_ia",           _test_tokens_ia),
        _chk("tickets_kb",          lambda: _test_kb_pendientes("soporte_tickets",    "estado", "resuelto",  "ticket",     "sin resolver")),
        _chk("sugerencias_kb",      lambda: _test_kb_pendientes("soporte_sugerencias","estado", "pendiente", "sugerencia", "sin aplicar", invert=True)),
        _chk("vigencias_proximas",  _test_vigencias_proximas),
        _chk("admins_sin_creditos", _test_admins_sin_creditos),
        _chk("usuarios_sin_plan",   _test_usuarios_sin_plan),
    )

    integraciones = dict(checks)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "todas_ok": all(v["status"] == "ok" for v in integraciones.values()),
        "integraciones": integraciones,
    }
