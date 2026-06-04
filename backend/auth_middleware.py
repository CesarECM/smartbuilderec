# from fastapi import Depends, HTTPException
# from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import jwt, JWTError
# import os

# security = HTTPBearer()

# def verify_supabase_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     token = credentials.credentials
#     secret = os.getenv("SUPABASE_JWT_SECRET")
#     if not secret:
#         raise HTTPException(status_code=500, detail="JWT secret no configurado en el servidor")
#     try:
#         payload = jwt.decode(
#             token,
#             secret,
#             algorithms=["HS256"],
#             audience="authenticated"
#         )
#         return payload
#     except JWTError:
#         raise HTTPException(status_code=401, detail="Token inválido o expirado. Vuelve a iniciar sesión.")

# def require_role(*roles):
#     def dependency(token_data: dict = Depends(verify_supabase_jwt)):
#         user_meta = token_data.get("user_metadata") or {}
#         app_meta = token_data.get("app_metadata") or {}
#         rol = app_meta.get("rol") or user_meta.get("rol") or "estudiante"
#         if rol not in roles:
#             raise HTTPException(status_code=403, detail="No tienes permiso para realizar esta acción.")
#         return token_data
#     return dependency
