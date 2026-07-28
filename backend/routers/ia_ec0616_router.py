import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ec0616_models import EC0616IaElementoRequest, EC0616IaScorecardRequest

router = APIRouter(prefix="/ec0616/ia", tags=["ia-ec0616"])

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_MODEL  = os.getenv("OPENAI_MODEL", "gpt-4o")
_MODEL_M = os.getenv("OPENAI_MODEL_GRL", "gpt-4o-mini")

# Instrucción especial para Elemento 6 (post mortem) — tono clínico
_INSTRUCCION_POSTMORTEM = (
    "IMPORTANTE: Este elemento trata cuidados post mortem. "
    "Usa exclusivamente lenguaje clínico, técnico y respetuoso. "
    "Evita cualquier lenguaje dramático, coloquial o inapropiado. "
    "Enfócate en los procedimientos técnicos de enfermería."
)


def _chat(prompt: str, model: str = None, json_mode: bool = False) -> str:
    kwargs = dict(
        model=model or _MODEL_M,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
    )
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}
    resp = _client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content.strip()


@router.post("/elemento")
def ia_elemento(data: EC0616IaElementoRequest):
    try:
        instruccion_especial = _INSTRUCCION_POSTMORTEM if data.elemento_num == 6 else ""
        desempenos_str = "\n".join(f"  - {d}" for d in data.desempenos_ec)

        if data.accion == "generar":
            prompt = (
                f"{instruccion_especial}\n"
                f"Eres experto en EC0616 (Auxiliar de Enfermería CONOCER). "
                f"Redacta una descripción de desempeños para el Elemento {data.elemento_num}: '{data.elemento_titulo}' "
                f"de un auxiliar de enfermería que trabaja en: {data.unidad_medica or 'una unidad hospitalaria'}.\n\n"
                f"Los desempeños requeridos por el EC0616 son:\n{desempenos_str}\n\n"
                f"La descripción debe demostrar competencia en TODOS los desempeños listados. "
                f"Usa primera persona, lenguaje técnico de enfermería y menciona evidencias observables. "
                f"Máximo 200 palabras."
            )
            return {"descripcion": _chat(prompt, _MODEL)}

        elif data.accion == "refinar":
            prompt = (
                f"{instruccion_especial}\n"
                f"Mejora el siguiente texto de evidencia para el Elemento {data.elemento_num} EC0616: '{data.elemento_titulo}'.\n\n"
                f"Texto actual: {data.texto_actual}\n\n"
                f"Desempeños EC0616 que debe cubrir:\n{desempenos_str}\n\n"
                f"Reformula con vocabulario técnico de enfermería, estructura clara y lenguaje del CONOCER. "
                f"Mantén primera persona. Máximo 200 palabras."
            )
            return {"descripcion": _chat(prompt, _MODEL)}

        elif data.accion == "revisar":
            import json
            prompt = (
                f"{instruccion_especial}\n"
                f"Evalúa si el siguiente texto cubre TODOS los desempeños del Elemento {data.elemento_num} EC0616.\n\n"
                f"Texto: {data.texto_actual}\n\n"
                f"Desempeños requeridos:\n{desempenos_str}\n\n"
                f"Devuelve JSON con: checklist (lista de objetos con 'desempeno' y 'cumple': true/false/null), "
                f"comentario (retroalimentación general en 50 palabras máx)."
            )
            raw = _chat(prompt, _MODEL, json_mode=True)
            try:
                return json.loads(raw)
            except Exception:
                return {"checklist": [], "comentario": raw}

        raise HTTPException(status_code=400, detail="Acción no válida: generar | refinar | revisar")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scorecard")
def ia_scorecard(data: EC0616IaScorecardRequest):
    try:
        from models.ec0616_models import EC0616GenerateDocRequest
        import json

        candidato = data.datos.get("cand16Nombre", "") + " " + data.datos.get("cand16Apellidos", "")
        elems_resumen = []
        for elem_id, elem_datos in data.elementos.items():
            desc = elem_datos.get("desempenos", "") if isinstance(elem_datos, dict) else ""
            elems_resumen.append(f"- {elem_id}: {desc[:200] if desc else '(sin texto)'}")

        prompt = (
            f"Eres evaluador CONOCER. Analiza el portafolio de evidencias EC0616 del candidato: {candidato}.\n\n"
            f"Contenido por elemento:\n" + "\n".join(elems_resumen) + "\n\n"
            f"Para cada elemento, determina si la evidencia es suficiente para demostrar competencia.\n"
            f"Devuelve JSON con:\n"
            f"- resultados: lista de {{elemento_id, completo (bool), descripcion (texto corto)}}\n"
            f"- brechas_resumen: párrafo con los elementos que necesitan más evidencia\n"
            f"Los elemento_id válidos: oxigenacion, alimentacion, eliminacion, confort, seguridad, postmortem, autocuidado"
        )
        raw = _chat(prompt, _MODEL, json_mode=True)
        try:
            return json.loads(raw)
        except Exception:
            return {"resultados": [], "brechas_resumen": raw}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
