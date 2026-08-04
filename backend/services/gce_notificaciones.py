import os
from datetime import datetime, timezone

from services.email_service import send_template

_ESTADOS_NOTIFICAR = {"juicio", "cierre"}
_LABELS_ESTADO = {
    "juicio": "Juicio de evaluación emitido",
    "cierre": "Cédula de Evaluación disponible",
}

_FRONTEND_URL = lambda: os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")


def notificar_candidato_avance(sb, proceso_id: str, nuevo_estado: str) -> None:
    if nuevo_estado not in _ESTADOS_NOTIFICAR:
        return
    try:
        proc = sb.table("procesos_evaluacion") \
            .select("candidato_id, estandar_id") \
            .eq("id", proceso_id).maybe_single().execute()
        if not proc.data:
            return
        cand = sb.table("profiles").select("nombre, email") \
            .eq("id", proc.data["candidato_id"]).maybe_single().execute()
        ec = sb.table("estandares_competencia").select("codigo") \
            .eq("id", proc.data["estandar_id"]).maybe_single().execute()
        if not cand.data or not cand.data.get("email"):
            return
        send_template("gce_avance_proceso", cand.data["email"], {
            "nombre":          cand.data.get("nombre", cand.data["email"]),
            "ec_codigo":       (ec.data or {}).get("codigo", "GCE"),
            "estado_label":    _LABELS_ESTADO[nuevo_estado],
            "link_portafolio": f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠️ gce notify avance error: {e}")


def notificar_proceso_creado(sb, proceso_id: str, candidato_id: str,
                             estandar_id: str, ce_caller: dict) -> None:
    try:
        cand = sb.table("profiles").select("nombre, email") \
            .eq("id", candidato_id).maybe_single().execute()
        ec   = sb.table("estandares_competencia").select("codigo") \
            .eq("id", estandar_id).maybe_single().execute()
        if not cand.data or not cand.data.get("email"):
            return
        ce_nombre = " ".join(filter(None, [
            ce_caller.get("nombre"), ce_caller.get("apellido")
        ])) or ce_caller.get("email", "CE")
        send_template("gce_proceso_creado", cand.data["email"], {
            "nombre":          cand.data.get("nombre", cand.data["email"]),
            "ce_nombre":       ce_nombre,
            "ec_codigo":       (ec.data or {}).get("codigo", "EC"),
            "link_portafolio": f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠ gce_proceso_creado email error: {e}")


def notificar_evaluador_asignado(sb, proceso_id: str, evaluador_id: str) -> None:
    try:
        proc = sb.table("procesos_evaluacion") \
            .select("candidato_id, estandar_id, ce_id") \
            .eq("id", proceso_id).maybe_single().execute()
        if not proc.data:
            return
        ev_prof   = sb.table("profiles").select("nombre, email") \
            .eq("id", evaluador_id).maybe_single().execute()
        cand_prof = sb.table("profiles").select("nombre, apellido") \
            .eq("id", proc.data["candidato_id"]).maybe_single().execute()
        ec_info   = sb.table("estandares_competencia").select("codigo") \
            .eq("id", proc.data["estandar_id"]).maybe_single().execute()
        ce_prof   = sb.table("profiles").select("nombre, apellido") \
            .eq("id", proc.data["ce_id"]).maybe_single().execute()
        if not ev_prof.data or not ev_prof.data.get("email"):
            return
        cand_n = " ".join(filter(None, [
            (cand_prof.data or {}).get("nombre"), (cand_prof.data or {}).get("apellido")
        ])) or "Candidato"
        ce_n = " ".join(filter(None, [
            (ce_prof.data or {}).get("nombre"), (ce_prof.data or {}).get("apellido")
        ])) or "CE"
        send_template("gce_proceso_asignado", ev_prof.data["email"], {
            "nombre":           ev_prof.data.get("nombre", ev_prof.data["email"]),
            "ce_nombre":        ce_n,
            "candidato_nombre": cand_n,
            "ec_codigo":        (ec_info.data or {}).get("codigo", "EC"),
            "link_portafolio":  f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠ gce_proceso_asignado email error: {e}")


def build_notifs(proceso: dict, uid: str, cand_map: dict, frontend_url: str) -> list:
    estado    = proceso["estado"]
    datos     = proceso.get("datos") or {}
    ec_codigo = (proceso.get("estandares_competencia") or {}).get("codigo", "EC")
    pid       = proceso["id"]
    link      = f"{frontend_url}/gce?proceso_id={pid}"

    cand   = cand_map.get(proceso.get("candidato_id"), {})
    nombre = " ".join(filter(None, [cand.get("nombre"), cand.get("apellido")])) or "el candidato"

    ts = proceso.get("updated_at") or proceso.get("created_at", "")
    try:
        dt    = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        horas = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
    except Exception:
        horas = 0

    es_ce = uid == proceso.get("ce_id")
    es_ev = uid == proceso.get("evaluador_id")
    es_ca = uid == proceso.get("candidato_id")

    plan     = datos.get("plan_evaluacion", {})
    firma_ev = plan.get("firma_evaluador")
    firma_ca = plan.get("firma_candidato")

    def n(tipo, msg, accion_label, accion_link="", accion_tipo="link"):
        t = "alerta" if tipo == "urgente" and horas > 24 else tipo
        return {
            "proceso_id": pid, "ec_codigo": ec_codigo, "candidato_nombre": nombre,
            "tipo": t, "mensaje": msg, "accion_label": accion_label,
            "accion_link": accion_link or link, "accion_tipo": accion_tipo,
            "horas_sin_cambio": round(horas, 1),
        }

    notifs = []
    if estado == "registro":
        if es_ca: notifs.append(n("urgente", "Llena tu Ficha de Registro para comenzar", "Ir al proceso"))
        if es_ce: notifs.append(n("urgente", f"Comparte el enlace con {nombre} para que llene su Ficha", "Copiar enlace", link, "copiar"))
        if es_ev: notifs.append(n("en_espera", f"{nombre} está llenando su Ficha de Registro", "Ver proceso"))
    elif estado == "diagnostico":
        if es_ca: notifs.append(n("urgente", "Completa el Diagnóstico de competencias (~30 min)", "Ir al proceso"))
        if es_ce: notifs.append(n("en_espera", f"{nombre} está realizando el Diagnóstico", "Ver proceso"))
        if es_ev: notifs.append(n("en_espera", f"{nombre} está realizando el Diagnóstico", "Ver proceso"))
    elif estado == "plan_acordado":
        if not firma_ev:
            if es_ev: notifs.append(n("urgente", f"Llena el Plan de Evaluación para {nombre}", "Ir al proceso"))
            if es_ca: notifs.append(n("en_espera", "El evaluador está preparando el Plan de Evaluación", "Ver proceso"))
            if es_ce: notifs.append(n("en_espera", "El evaluador debe llenar el Plan de Evaluación", "Ver proceso"))
        elif not firma_ca:
            if es_ca: notifs.append(n("urgente", "El evaluador preparó el Plan. Revísalo y confírmalo", "Ir al proceso"))
            if es_ev: notifs.append(n("en_espera", f"Esperando que {nombre} confirme el Plan", "Ver proceso"))
            if es_ce: notifs.append(n("urgente", f"{nombre} no ha confirmado el Plan. Compártele el enlace", "Copiar enlace", link, "copiar"))
        else:
            if es_ev: notifs.append(n("urgente", f"Plan acordado. Aplica el IEC a {nombre}", "Ir al proceso"))
            if es_ca: notifs.append(n("en_espera", "Evaluación en marcha. Recibirás un aviso con el resultado", "Ver proceso"))
            if es_ce: notifs.append(n("en_espera", "Plan acordado. El evaluador aplica el IEC", "Ver proceso"))
    elif estado == "juicio":
        if es_ev: notifs.append(n("urgente", f"Emite la Cédula de Evaluación para {nombre}", "Ir al proceso"))
        if es_ca: notifs.append(n("en_espera", "El evaluador está preparando tu Cédula de Evaluación", "Ver proceso"))
        if es_ce: notifs.append(n("en_espera", "El evaluador está emitiendo la Cédula", "Ver proceso"))
    elif estado == "cierre":
        if es_ca: notifs.append(n("urgente", "Tu Cédula está lista. Completa la Encuesta de Satisfacción", "Ir al proceso"))
        if es_ev: notifs.append(n("en_espera", f"Esperando que {nombre} complete la Encuesta", "Ver proceso"))
        if es_ce: notifs.append(n("en_espera", f"Esperando que {nombre} complete la Encuesta", "Ver proceso"))
    return notifs


def _fetch_partes(sb, proceso_id: str) -> dict:
    proc = sb.table("procesos_evaluacion") \
        .select("candidato_id, evaluador_id, ce_id, estandar_id") \
        .eq("id", proceso_id).maybe_single().execute()
    if not proc.data:
        return {}
    p = proc.data
    get_prof = lambda uid: (sb.table("profiles").select("nombre, apellido, email")
                            .eq("id", uid).maybe_single().execute().data or {}) if uid else {}
    ec = sb.table("estandares_competencia").select("codigo") \
        .eq("id", p["estandar_id"]).maybe_single().execute()
    nombre_completo = lambda d: " ".join(filter(None, [d.get("nombre"), d.get("apellido")])) or d.get("email", "")
    ce   = get_prof(p.get("ce_id"))
    ev   = get_prof(p.get("evaluador_id"))
    ca   = get_prof(p.get("candidato_id"))
    ec_codigo = (ec.data or {}).get("codigo", "EC")
    return {"ce": ce, "ev": ev, "ca": ca, "ec_codigo": ec_codigo,
            "ce_nombre": nombre_completo(ce), "ev_nombre": nombre_completo(ev), "cand_nombre": nombre_completo(ca)}


def notificar_por_estado(sb, proceso_id: str, nuevo_estado: str) -> None:
    try:
        partes = _fetch_partes(sb, proceso_id)
        if not partes:
            return
        url = f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}"
        ce, ev, ca = partes["ce"], partes["ev"], partes["ca"]
        codigo, cand_n = partes["ec_codigo"], partes["cand_nombre"]

        if nuevo_estado == "diagnostico" and ce.get("email"):
            send_template("gce_ficha_completa", ce["email"], {
                "nombre": ce.get("nombre", ce["email"]), "candidato_nombre": cand_n,
                "ec_codigo": codigo, "link_portafolio": url,
            })
        elif nuevo_estado == "plan_acordado" and ev.get("email"):
            send_template("gce_diagnostico_completo", ev["email"], {
                "nombre": ev.get("nombre", ev["email"]), "candidato_nombre": cand_n,
                "ec_codigo": codigo, "link_portafolio": url,
            })
        elif nuevo_estado == "certificado" and ce.get("email"):
            send_template("gce_proceso_completado", ce["email"], {
                "nombre": ce.get("nombre", ce["email"]), "candidato_nombre": cand_n,
                "ec_codigo": codigo, "link_portafolio": url,
            })
    except Exception as e:
        print(f"⚠ gce notificar_por_estado error: {e}")


def notificar_por_firmas(sb, proceso_id: str, datos_nuevo: dict, datos_anterior: dict) -> None:
    try:
        plan_nuevo = (datos_nuevo or {}).get("plan_evaluacion", {})
        plan_ant   = (datos_anterior or {}).get("plan_evaluacion", {})
        firma_ev_nueva  = plan_nuevo.get("firma_evaluador")
        firma_ca_nueva  = plan_nuevo.get("firma_candidato")
        firma_ev_antes  = plan_ant.get("firma_evaluador")
        firma_ca_antes  = plan_ant.get("firma_candidato")

        if not firma_ev_nueva and not firma_ca_nueva:
            return
        partes = _fetch_partes(sb, proceso_id)
        if not partes:
            return
        url = f"{_FRONTEND_URL()}/gce?proceso_id={proceso_id}"
        ce, ca = partes["ce"], partes["ca"]
        codigo = partes["ec_codigo"]

        if firma_ev_nueva and not firma_ev_antes and ca.get("email"):
            send_template("gce_plan_listo", ca["email"], {
                "nombre": ca.get("nombre", ca["email"]),
                "ec_codigo": codigo, "link_portafolio": url,
            })
        if firma_ev_nueva and firma_ca_nueva and not firma_ca_antes and ce.get("email"):
            cand_n = partes["cand_nombre"]
            send_template("gce_plan_acordado", ce["email"], {
                "nombre": ce.get("nombre", ce["email"]), "candidato_nombre": cand_n,
                "ec_codigo": codigo, "link_portafolio": url,
            })
    except Exception as e:
        print(f"⚠ gce notificar_por_firmas error: {e}")
