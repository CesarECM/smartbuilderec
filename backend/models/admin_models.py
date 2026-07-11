from pydantic import BaseModel
from typing import Optional


class CreateUserRequest(BaseModel):
    email: str
    nombre: str
    apellido: str
    admin_id: Optional[str] = None
