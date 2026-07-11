import json
import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ia_models import ExpositivaRequest, DemostrativaRequest, DialogoRequest
from services.doc_helpers import load_prompt

router = APIRouter()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_MODEL_GRL = os.getenv("OPENAI_MODEL_GRL", "gpt-4o-mini")


def _parse_json(content: str):
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())


@router.post("/generate-expositiva")
def generate_expositiva(data: ExpositivaRequest):
    try:
        prompt = load_prompt("expositiva_prompt.txt",
                             campo=data.campo, nombreCurso=data.nombreCurso,
                             perfil=data.perfil, objetivoCognitivo=data.objetivoCognitivo,
                             objetivoGeneral=data.objetivoGeneral,
                             temario=json.dumps(data.temario, ensure_ascii=False))
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-demostrativa")
def generate_demostrativa(data: DemostrativaRequest):
    try:
        prompt = load_prompt("demostrativa_prompt.txt",
                             campo=data.campo, nombreCurso=data.nombreCurso,
                             perfil=data.perfil, objetivoPsicomotriz=data.objetivoPsicomotriz,
                             objetivoGeneral=data.objetivoGeneral,
                             temario=json.dumps(data.temario, ensure_ascii=False))
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-dialogo")
def generate_dialogo(data: DialogoRequest):
    try:
        prompt = load_prompt("dialogo_prompt.txt",
                             campo=data.campo, nombreCurso=data.nombreCurso,
                             perfil=data.perfil, objetivoAfectivo=data.objetivoAfectivo,
                             objetivoGeneral=data.objetivoGeneral,
                             temario=json.dumps(data.temario, ensure_ascii=False))
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
