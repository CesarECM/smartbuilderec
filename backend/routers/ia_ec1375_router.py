import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ec1375_models import EC1375IaSeguimientoRequest

router = APIRouter(prefix="/ec1375/ia", tags=["ia-ec1375"])

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


@router.post("/seguimiento")
def ia_seguimiento(data: EC1375IaSeguimientoRequest):
    try:
        prompt = (
            f"Eres un especialista en servicios tradicionales y complementarios de salud, "
            f"certificado bajo el estándar CONOCER EC1375.\n\n"
            f"Elabora un PLAN DE SEGUIMIENTO personalizado para el siguiente caso:\n"
            f"- Usuario: {data.nombre_usuario}, {data.edad} años\n"
            f"- Motivo / necesidad: {data.motivo}\n"
            f"- Antecedentes: {data.antecedentes or 'No especificados'}\n"
            f"- Enfermedades/condiciones: {data.enfermedades or 'Ninguna referida'}\n"
            f"- Técnica a aplicar: {data.tecnica}\n"
            f"- Objetivo de la sesión: {data.objetivo_sesion}\n"
            f"- Sesiones programadas: {data.num_sesiones} sesiones de {data.duracion} min, {data.frecuencia}\n"
            f"- SpO₂: {data.spo2}%, Presión arterial: {data.presion} mmHg\n\n"
            f"El plan debe incluir:\n"
            f"1. Progresión por etapas (inicio, desarrollo, consolidación)\n"
            f"2. Objetivos específicos por sesión\n"
            f"3. Indicadores de evolución esperados\n"
            f"4. Recomendaciones entre sesiones\n"
            f"5. Criterios para ajustar o finalizar el plan\n\n"
            f"Redacta en tono profesional, máximo 300 palabras."
        )
        plan = _chat(prompt, _MODEL)

        prompt_obj = (
            f"Con base en el plan: '{plan[:400]}'\n"
            f"Redacta en 2-3 líneas los OBJETIVOS POR SESIÓN de forma clara y medible. "
            f"Máximo 80 palabras."
        )
        objetivos = _chat(prompt_obj)

        return {"plan": plan, "objetivos": objetivos}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
