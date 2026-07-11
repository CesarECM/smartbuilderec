import json
import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ia_models import (
    EvaluationRequest, GeneralRequest, BeneficiosRequest,
    TemarioRequest, PreguntasRequest,
)
from services.doc_helpers import load_prompt

router = APIRouter()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")
_MODEL_GRL = os.getenv("OPENAI_MODEL_GRL", "gpt-4o-mini")


def _parse_json(content: str):
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
    return json.loads(content.strip())


@router.post("/evaluate")
def evaluate(data: EvaluationRequest):
    try:
        if data.tipo == "cognitiva":
            prompt = load_prompt("evaluate_cognitiva_prompt.txt", texto=data.texto)
        elif data.tipo == "psicomotriz":
            prompt = load_prompt("evaluate_psicomotriz_prompt.txt",
                                 texto=data.texto, objetivo_cognitivo=data.objetivo_cognitivo)
        elif data.tipo == "afectiva":
            prompt = load_prompt("evaluate_afectiva_prompt.txt",
                                 texto=data.texto,
                                 objetivo_cognitivo=data.objetivo_cognitivo,
                                 objetivo_psicomotriz=data.objetivo_psicomotriz)
        else:
            raise HTTPException(status_code=400,
                detail="Tipo de objetivo no válido. Usa: cognitiva, psicomotriz o afectiva.")

        response = _client.chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        return _parse_json(response.choices[0].message.content.strip())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-general")
def generate_general(data: GeneralRequest):
    try:
        prompt = load_prompt("general_prompt.txt",
                             cognitiva=data.cognitiva, psicomotriz=data.psicomotriz, afectiva=data.afectiva)
        response = _client.chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        return {"general": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-beneficios")
def generate_beneficios(data: BeneficiosRequest):
    try:
        prompt = load_prompt("beneficios_prompt.txt", general=data.general, nombre=data.nombre)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
        )
        return {"beneficios": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-temario")
def generate_temario(data: TemarioRequest):
    try:
        prompt = load_prompt("temario_prompt.txt",
                             nombre=data.nombre, general=data.general,
                             cognitiva=data.cognitiva, psicomotriz=data.psicomotriz,
                             afectiva=data.afectiva, beneficios=data.beneficios)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        resultado = _parse_json(response.choices[0].message.content.strip())
        return {"u1": resultado.get("u1", []), "u2": resultado.get("u2", []), "u3": resultado.get("u3", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-preguntas")
def generate_preguntas(data: PreguntasRequest):
    try:
        prompt = load_prompt("preguntas_prompt.txt", nombre=data.nombre, perfil=data.perfil)
        response = _client.chat.completions.create(
            model=_MODEL_GRL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        resultado = _parse_json(response.choices[0].message.content.strip())
        return {"preguntas": resultado.get("preguntas", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
