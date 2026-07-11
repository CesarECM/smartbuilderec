import json
import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ia_models import CierreRequest, DescripcionGeneralRequest, ResumenRequest, CompromisosRequest
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


@router.post("/generate-resumen")
def generate_resumen(data: ResumenRequest):
    try:
        prompt = load_prompt("resumen_prompt.txt",
                             nombreCurso=data.nombreCurso,
                             objetivoGeneral=data.objetivoGeneral,
                             objetivoCognitivo=data.objetivoCognitivo,
                             objetivoPsicomotriz=data.objetivoPsicomotriz,
                             objetivoAfectivo=data.objetivoAfectivo,
                             desarrolloExpositiva=data.desarrolloExpositiva,
                             actividadDemostrativa=data.actividadDemostrativa,
                             instruccionesDialogo=data.instruccionesDialogo,
                             sugerenciasContinuidad=data.sugerenciasContinuidad,
                             referenciasBibliograficas=data.referenciasBibliograficas,
                             compromisos=data.compromisos)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-compromisos")
def generate_compromisos(data: CompromisosRequest):
    try:
        prompt = load_prompt("compromisos_prompt.txt",
                             nombreCurso=data.nombreCurso,
                             objetivoGeneral=data.objetivoGeneral,
                             objetivoCognitivo=data.objetivoCognitivo,
                             objetivoPsicomotriz=data.objetivoPsicomotriz,
                             objetivoAfectivo=data.objetivoAfectivo)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-cierre")
def generate_cierre(data: CierreRequest):
    try:
        prompt = load_prompt("cierre_prompt.txt",
                             nombreCurso=data.nombreCurso,
                             objetivoGeneral=data.objetivoGeneral,
                             objetivoCognitivo=data.objetivoCognitivo,
                             objetivoPsicomotriz=data.objetivoPsicomotriz,
                             objetivoAfectivo=data.objetivoAfectivo,
                             desarrolloExpositiva=data.desarrolloExpositiva,
                             actividadDemostrativa=data.actividadDemostrativa,
                             instruccionesDialogo=data.instruccionesDialogo)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-descripcion-general")
def generate_descripcion_general(data: DescripcionGeneralRequest):
    try:
        prompt = load_prompt("descripcion_general_prompt.txt", cierre=data.cierre)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
