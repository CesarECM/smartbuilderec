from fastapi import Header, HTTPException
import os


def require_api_key(x_api_key: str = Header(..., alias="X-Api-Key")):
    expected = os.getenv("ECMATIC_API_KEY")
    if not expected:
        raise HTTPException(status_code=500, detail="ECMATIC_API_KEY no configurada en el servidor.")
    if x_api_key != expected:
        raise HTTPException(status_code=401, detail="API Key inválida.")


def _ok(data, meta: dict | None = None):
    return {"success": True, "data": data, "meta": meta or {}, "error": None}


def _err(msg: str, code: int = 400):
    raise HTTPException(status_code=code, detail={"success": False, "data": None, "error": msg})
