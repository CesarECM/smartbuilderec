import json
import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ia_models import MaterialesRequest
from services.doc_helpers import load_prompt

router = APIRouter()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_MODEL_GRL = os.getenv("OPENAI_MODEL_GRL", "gpt-4o-mini")


@router.post("/generate-materiales-clasificados")
async def generate_materiales_clasificados(payload: dict):
    integracion  = payload.get("integracion",  "")
    expositiva   = payload.get("expositiva",   "")
    demostrativa = payload.get("demostrativa", "")
    energizante  = payload.get("energizante",  "")
    dialogo      = payload.get("dialogo",      "")

    if not any([integracion, expositiva, demostrativa, energizante, dialogo]):
        raise HTTPException(status_code=400, detail="No hay materiales para clasificar.")

    try:
        prompt = load_prompt("clasificar_materiales_prompt.txt",
                             integracion=integracion   or "No especificado.",
                             expositiva=expositiva     or "No especificado.",
                             demostrativa=demostrativa or "No especificado.",
                             energizante=energizante   or "No especificado.",
                             dialogo=dialogo           or "No especificado.")
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        resultado = json.loads(response.choices[0].message.content.strip())
        campos = ["instalaciones", "equipo", "materialesDidacticos", "humanos", "otros", "seguridad"]
        return {c: resultado.get(c, "") for c in campos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-materiales")
def generate_materiales(data: MaterialesRequest):
    try:
        prompts_materiales = {
            "integracion":  "prompt_materiales_integracion.txt",
            "expositiva":   "prompt_materiales_expositiva.txt",
            "demostrativa": "prompt_materiales_demostrativa.txt",
            "energizante":  "prompt_materiales_energizante.txt",
            "dialogo":      "prompt_materiales_dialogo.txt",
        }
        if data.tecnica not in prompts_materiales:
            raise HTTPException(status_code=400, detail="Técnica no válida.")

        prompt = load_prompt(
            prompts_materiales[data.tecnica],
            tecnica=data.tecnica, nombreCurso=data.nombreCurso,
            perfil=data.perfil, objetivoGeneral=data.objetivoGeneral,
            objetivos=json.dumps(data.objetivos, ensure_ascii=False, indent=2),
            temario=json.dumps(data.temario, ensure_ascii=False, indent=2),
            tecnicas=json.dumps(data.tecnicas, ensure_ascii=False, indent=2),
            expositiva=json.dumps(data.expositiva, ensure_ascii=False, indent=2),
            demostrativa=json.dumps(data.demostrativa, ensure_ascii=False, indent=2),
            dialogo=json.dumps(data.dialogo, ensure_ascii=False, indent=2),
        )
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[
                {"role": "system", "content": "Eres un experto en diseño instruccional bajo el estándar EC0217.01."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
        )
        return {"texto": response.choices[0].message.content.strip()}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar materiales para {data.tecnica}: {str(e)}")
