from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import date
import httpx
import os

security = HTTPBearer()


def admin_sign_out(user_id: str) -> None:
    """Revoca todos los tokens activos del usuario vía Supabase Auth Admin API."""
    try:
        supabase_url = os.getenv("SUPABASE_URL", "")
        service_key  = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        if not supabase_url or not service_key:
            return
        httpx.post(
            f"{supabase_url}/auth/v1/admin/users/{user_id}/logout",
            headers={
                "apikey": service_key,
                "Authorization": f"Bearer {service_key}",
                "Content-Type": "application/json",
            },
            json={"scope": "global"},
            timeout=5.0,
        )
    except Exception:
        pass


def verify_supabase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(status_code=500, detail="JWT secret no configurado en el servidor")

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado. Vuelve a iniciar sesión.")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token sin identidad de usuario.")

    # Verificar estado real del usuario en BD — fuente de verdad única
    from database import get_supabase
    sb = get_supabase()
    res = sb.table("profiles").select("activo, vigencia_hasta, rol").eq("id", user_id).single().execute()
    profile = res.data or {}

    if not profile.get("activo", True):
        raise HTTPException(status_code=401, detail="Cuenta desactivada. Contacta a tu administrador.")

    if profile.get("rol") != "super_admin" and profile.get("vigencia_hasta"):
        if profile["vigencia_hasta"] < str(date.today()):
            raise HTTPException(status_code=401, detail="Vigencia expirada. Renueva tu acceso.")

    # Inyectar rol desde BD para que require_role no dependa del JWT
    payload["_db_rol"] = profile.get("rol", "user")
    return payload


def require_role(*roles):
    def dependency(token_data: dict = Depends(verify_supabase_jwt)):
        rol = token_data.get("_db_rol", "user")
        if rol not in roles:
            raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción.")
        return token_data
    return dependency
