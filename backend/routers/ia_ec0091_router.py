import os

from fastapi import APIRouter, HTTPException
from openai import OpenAI

from models.ec0091_models import (
    EC0091IaObjetivoRequest, EC0091IaListaRequest,
    EC0091IaHallazgosRequest, EC0091IaInformeRequest,
    EC0091IaRevisionGlobalRequest,
)

router = APIRouter(prefix="/ec0091/ia", tags=["ia-ec0091"])

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
_MODEL  = os.getenv("OPENAI_MODEL", "gpt-4o")
_MODEL_M = os.getenv("OPENAI_MODEL_GRL", "gpt-4o-mini")


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


@router.post("/objetivo")
def ia_objetivo(data: EC0091IaObjetivoRequest):
    try:
        if data.accion == "generar":
            prompt = (
                f"Eres un experto en el estándar CONOCER EC0091 (Verificación Externa de CE/EI). "
                f"Redacta el OBJETIVO DE VERIFICACIÓN para la siguiente situación:\n"
                f"- Organismo Certificador: {data.organismo_certificador}\n"
                f"- Tipo de entidad a verificar: {data.tipo_entidad}\n"
                f"- Nombre de la entidad: {data.nombre_entidad}\n\n"
                f"El objetivo debe especificar: quién verifica, qué se verifica, con qué propósito normativo "
                f"y el marco del EC0091. Máximo 120 palabras. Devuelve solo el texto del objetivo."
            )
            return {"texto": _chat(prompt)}
        elif data.accion == "revisar":
            prompt = (
                f"Eres auditor del CONOCER. Evalúa si el siguiente OBJETIVO DE VERIFICACIÓN EC0091 incluye: "
                f"(1) quién verifica, (2) qué se verifica, (3) propósito normativo, (4) alcance definido por el OC.\n\n"
                f"Objetivo: {data.objetivo}\nAlcance: {data.alcance}\n\n"
                f"Devuelve un checklist ✅/⚠️/❌ y un párrafo de retroalimentación (máx. 100 palabras)."
            )
            return {"resultado": _chat(prompt)}
        raise HTTPException(status_code=400, detail="Acción no válida: generar | revisar")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lista")
def ia_lista(data: EC0091IaListaRequest):
    try:
        lineas_str = ", ".join(data.lineas_activas) if data.lineas_activas else "proceso, producto, persona"
        if data.accion == "generar":
            prompt = (
                f"Eres experto en EC0091. Genera una LISTA DE VERIFICACIÓN con preguntas críticas para estas líneas: {lineas_str}.\n"
                f"Objetivo de la verificación: {data.objetivo}\n"
                f"El EC0091 exige que las preguntas 'induzcan detalles y aspectos críticos' de la operación del CE/EI.\n"
                f"Por cada línea, genera mínimo 5 preguntas en formato numerado por sección.\n"
                f"Devuelve solo el texto de la lista, sin explicaciones adicionales."
            )
            return {"preguntas": _chat(prompt, _MODEL)}
        elif data.accion == "revisar":
            prompt = (
                f"Eres auditor CONOCER. Evalúa esta LISTA DE VERIFICACIÓN EC0091:\n\n{data.preguntas}\n\n"
                f"Verifica: (a) cobertura de las 3 líneas (proceso/producto/persona), "
                f"(b) que las preguntas induzcan 'detalles y aspectos críticos' según el IEC0091, "
                f"(c) claridad y objetividad.\n"
                f"Devuelve: checklist ✅/⚠️/❌ por criterio y recomendaciones específicas."
            )
            return {"resultado": _chat(prompt, _MODEL)}
        raise HTTPException(status_code=400, detail="Acción no válida: generar | revisar")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hallazgos")
def ia_hallazgos(data: EC0091IaHallazgosRequest):
    try:
        if data.accion == "generar_causa":
            prompt = (
                f"Eres experto en auditoría de centros de evaluación EC0091. "
                f"Para el siguiente hallazgo: '{data.descripcion}', "
                f"identifica la causa raíz más probable usando la metodología de los '5 Por qué' o Ishikawa. "
                f"Sé específico y orientado a la operación de un CE/EI del CONOCER. Máximo 80 palabras."
            )
            return {"causa": _chat(prompt)}
        elif data.accion == "refinar":
            prompt = (
                f"Mejora la redacción de este hallazgo de verificación EC0091 para que sea objetiva, "
                f"clara y orientada a hechos observables:\n"
                f"Descripción: {data.descripcion}\nCausa: {data.causa}\nAcción propuesta: {data.accion_propuesta}\n\n"
                f"Devuelve JSON con campos: descripcion, causa, accion"
            )
            import json
            raw = _chat(prompt, json_mode=True)
            try:
                return json.loads(raw)
            except Exception:
                return {"descripcion": raw}
        elif data.accion == "revisar":
            prompt = (
                f"Verifica que este hallazgo EC0091 incluya los 6 campos obligatorios:\n"
                f"1. Descripción del hallazgo\n2. Causa raíz\n3. Acción correctiva\n"
                f"4. Indicador de seguimiento\n5. Plazo\n6. Referencia a firma responsable\n\n"
                f"Hallazgo: {data.descripcion}\nCausa: {data.causa}\nAcción: {data.accion_propuesta}\n\n"
                f"Devuelve checklist ✅/❌ por campo y observaciones breves."
            )
            return {"resultado": _chat(prompt)}
        raise HTTPException(status_code=400, detail="Acción no válida")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/informe")
def ia_informe(data: EC0091IaInformeRequest):
    try:
        if data.accion == "generar":
            prompt = (
                f"Eres Verificador Externo certificado del CONOCER. Redacta el RESUMEN EJECUTIVO del informe EC0091:\n"
                f"- OC: {data.organismo_certificador}\n"
                f"- Entidad verificada ({data.tipo_entidad}): {data.nombre_entidad}\n"
                f"- Hallazgos encontrados: {data.num_hallazgos}\n"
                f"- Dictamen preliminar: {data.dictamen}\n\n"
                f"Incluye: contexto de la verificación, áreas revisadas, resumen de cumplimiento e incumplimientos, "
                f"observaciones generales. Máximo 200 palabras. Lenguaje técnico formal CONOCER."
            )
            resp = _chat(prompt, _MODEL)
            conc = _chat(
                f"Con base en: {resp}\nRedacta 2-3 conclusiones ejecutivas del proceso de verificación. Máximo 80 palabras.",
            )
            return {"resumen": resp, "conclusiones": conc}
        elif data.accion == "revisar":
            prompt = (
                f"Verifica que el siguiente INFORME EC0091 incluya los 6 elementos obligatorios:\n"
                f"1. Resumen ejecutivo\n2. Hallazgos documentados\n3. Conclusiones\n"
                f"4. Resultado cuantitativo\n5. Dictamen\n6. Referencias al plan de verificación\n\n"
                f"Resumen: {data.resumen}\nConclusiones: {data.conclusiones}\n"
                f"Resultado: {data.resultado}\nDictamen: {data.dictamen}\n\n"
                f"Devuelve checklist ✅/❌ por elemento y recomendaciones."
            )
            return {"resultado": _chat(prompt)}
        raise HTTPException(status_code=400, detail="Acción no válida")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/revision-global")
def ia_revision_global(data: EC0091IaRevisionGlobalRequest):
    try:
        exp = data.expediente
        datos_str = str(exp.get("datos", {}))[:500]
        obj_str   = str(exp.get("objetivo", {}))[:300]
        hall_str  = str(exp.get("hallazgos", {}))[:500]
        inf_str   = str(exp.get("informe", {}))[:500]
        prompt = (
            f"Eres auditor CONOCER. Realiza una REVISIÓN DE CONSISTENCIA CRUZADA del expediente de verificación EC0091.\n"
            f"Datos generales: {datos_str}\n"
            f"Objetivo: {obj_str}\n"
            f"Hallazgos: {hall_str}\n"
            f"Informe: {inf_str}\n\n"
            f"Verifica: (a) coherencia entre objetivo y hallazgos, (b) que el dictamen corresponda al número de hallazgos, "
            f"(c) que los 5 documentos del expediente tengan información consistente, (d) que no falten elementos normativos.\n"
            f"Devuelve: listado de ✅ consistencias y ⚠️/❌ inconsistencias detectadas, con recomendaciones específicas."
        )
        return {"resultado": _chat(prompt, _MODEL)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
