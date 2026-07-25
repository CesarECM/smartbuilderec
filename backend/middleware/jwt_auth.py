import base64 as _b64
import json as _json
import os

from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

_PATHS_PUBLICOS = {"/", "/validate-token", "/webhook/stripe", "/checkout/session", "/checkout/verify"}
_jwks_cache: dict = {}

_SOPORTE_PUBLICOS = {
    ("POST", "/planes/checkout-publico"),
    ("POST", "/soporte/sesiones/init"),
    ("POST", "/soporte/chat"),
    ("POST", "/soporte/tickets"),
    ("POST", "/soporte/cron/analizar-patrones"),
    ("POST", "/admin/cron/vigencias"),
    ("POST", "/auth/reset-password"),
    ("POST", "/wizard/sync-fallback"),
}


def _es_publico(method: str, path: str) -> bool:
    if path in _PATHS_PUBLICOS:
        return True
    if (method, path) in _SOPORTE_PUBLICOS:
        return True
    if method == "GET" and (path == "/recursos" or path.startswith("/recursos/")):
        return True
    if method == "GET" and path.startswith("/generate-doc/progreso/"):
        return True
    if path.startswith("/api/v1/"):
        return True
    return False


async def _get_public_key(supabase_url: str, kid: str):
    """Obtiene y cachea la clave pública del JWKS de Supabase."""
    global _jwks_cache
    if kid in _jwks_cache:
        return _jwks_cache[kid]
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{supabase_url}/auth/v1/.well-known/jwks.json")
            if res.status_code == 200:
                for k in res.json().get("keys", []):
                    _jwks_cache[k["kid"]] = k
    except Exception:
        pass
    return _jwks_cache.get(kid)


class JWTAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or _es_publico(request.method, request.url.path):
            return await call_next(request)
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return JSONResponse({"detail": "Autenticación requerida."}, status_code=401)
        token = auth.removeprefix("Bearer ").strip()
        try:
            from jose import jwt as jose_jwt, jwk as jose_jwk

            raw_hdr = token.split('.')[0]
            raw_hdr += '=' * (-len(raw_hdr) % 4)
            header = _json.loads(_b64.urlsafe_b64decode(raw_hdr))
            alg = header.get('alg', 'HS256')
            kid = header.get('kid', '')

            if alg.startswith('ES') or alg.startswith('RS') or alg.startswith('PS'):
                supabase_url = os.getenv("SUPABASE_URL", "")
                if not supabase_url:
                    return JSONResponse({"detail": "SUPABASE_URL no configurado."}, status_code=500)
                key_data = await _get_public_key(supabase_url, kid)
                if not key_data:
                    return JSONResponse({"detail": f"Clave pública no encontrada (kid={kid})."}, status_code=401)
                public_key = jose_jwk.construct(key_data, algorithm=alg)
                payload = jose_jwt.decode(token, public_key, algorithms=[alg], options={"verify_aud": False})
            else:
                secret = os.getenv("SUPABASE_JWT_SECRET")
                if not secret:
                    return JSONResponse({"detail": "JWT secret no configurado."}, status_code=500)
                payload = jose_jwt.decode(token, secret, algorithms=[alg], options={"verify_aud": False})

            request.state.user = payload
        except Exception as e:
            return JSONResponse({"detail": f"Token inválido o expirado: {str(e)}"}, status_code=401)
        return await call_next(request)
