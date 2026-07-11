import json
import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ia_models import EvaluacionIARequest
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


@router.post("/generate-evaluacion-diagnostica")
def generate_evaluacion_diagnostica(data: EvaluacionIARequest):
    try:
        prompt = load_prompt("evaluacion_diagnostica_prompt.txt",
                             nombreCurso=data.nombreCurso,
                             objetivoGeneral=data.objetivoGeneral,
                             objetivoCognitivo=data.objetivoCognitivo,
                             objetivoPsicomotriz=data.objetivoPsicomotriz,
                             objetivoAfectivo=data.objetivoAfectivo)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-evaluacion-sumativa")
def generate_evaluacion_sumativa(data: EvaluacionIARequest):
    try:
        prompt = load_prompt("evaluacion_sumativa_prompt.txt",
                             nombreCurso=data.nombreCurso,
                             objetivoGeneral=data.objetivoGeneral,
                             objetivoCognitivo=data.objetivoCognitivo,
                             objetivoPsicomotriz=data.objetivoPsicomotriz,
                             objetivoAfectivo=data.objetivoAfectivo)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-formativa")
async def generate_formativa(payload: dict):
    nombre_curso = payload.get("nombreCurso", "")
    actividad = payload.get("actividad", "")

    if not actividad.strip():
        raise HTTPException(status_code=400, detail="Falta la actividad de la técnica demostrativa.")

    try:
        prompt = load_prompt("evaluacion_formativa.txt", nombre_curso=nombre_curso, actividad=actividad)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[
                {"role": "system", "content": "Eres un experto en diseño de instrumentos de evaluación formativa por competencias."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        resultado = json.loads(content.strip())
        tipo = resultado.get("tipoInstrumento", "").strip()
        reactivos = resultado.get("reactivos", [])
        if not isinstance(reactivos, list):
            reactivos = []
        texto = "\n".join(
            f"{i + 1}. {reactivo}"
            for i, reactivo in enumerate(reactivos)
            if str(reactivo).strip()
        )
        return {"tipoInstrumento": tipo, "texto": texto}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar evaluación formativa: {str(e)}")
