import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ec0366_models import EC0366InfoGeneralIaRequest

router = APIRouter(prefix="/ec0366/ia", tags=["ia-ec0366"])

_client  = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_MODEL   = os.getenv("OPENAI_MODEL",     "gpt-4o")
_MODEL_M = os.getenv("OPENAI_MODEL_GRL", "gpt-4o-mini")


def _chat(prompt: str, model: str = None) -> str:
    resp = _client.chat.completions.create(
        model=model or _MODEL_M,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    return resp.choices[0].message.content.strip()


@router.post("/info-general")
def ia_info_general(data: EC0366InfoGeneralIaRequest):
    """Redacta borradores de la información general de un curso en línea (EC0366 · E1)."""
    try:
        base = (
            "Eres un diseñador instruccional experto en cursos de formación EN LÍNEA, "
            "alineado a las mejores prácticas del estándar CONOCER EC0366 pero modernizado "
            "(microlearning, video, LMS actuales, evaluación por competencias).\n\n"
            f"Curso: «{data.titulo or data.tema}»\n"
            f"Tema / contenido: {data.tema or 'No especificado'}\n"
            f"Público objetivo: {data.publico_objetivo or 'No especificado'}\n"
            f"Duración estimada: {data.duracion_horas or 'No especificada'} horas\n"
            f"Notas: {data.notas or '—'}\n\n"
        )

        objetivo = _chat(base + (
            "Redacta UN objetivo general del curso, claro y medible (verbo observable + "
            "contenido + condición). Máximo 60 palabras. Devuelve solo el objetivo."
        ))
        introduccion = _chat(base + (
            "Redacta una introducción breve y motivadora al curso (3-5 líneas). "
            "Devuelve solo la introducción."
        ))
        metodologia = _chat(base + (
            "Describe la metodología de trabajo en línea (modalidad, ritmo, tipo de "
            "actividades, acompañamiento). Máximo 80 palabras."
        ))
        perfil = _chat(base + (
            "Describe el perfil de ingreso recomendado (conocimientos previos y a quién "
            "va dirigido). Máximo 60 palabras."
        ))
        evaluacion = _chat(base + (
            "Describe la forma de evaluación del curso (tipos de evaluación y ponderación "
            "sugerida). Máximo 60 palabras."
        ))

        return {
            "objetivo_general": objetivo,
            "introduccion":     introduccion,
            "metodologia":      metodologia,
            "perfil_ingreso":   perfil,
            "forma_evaluacion": evaluacion,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
