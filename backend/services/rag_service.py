from services.embeddings_service import generate_embedding

# ── Prompts base por contexto de página ───────────────────────────────────────

_CONTEXT_PROMPTS: dict[str, str] = {
    "ventas": (
        "Eres SBE Assistant, el asistente de ventas de SmartBuilderEC. "
        "Tu objetivo es ayudar a instructores de capacitación a entender la plataforma "
        "y motivarlos a registrarse o adquirir un plan. "
        "SmartBuilderEC automatiza la creación del expediente didáctico EC0217.01 "
        "requerido por el CONOCER (México) para certificar competencias laborales. "
        "Responde preguntas sobre funcionalidades, precios y proceso de registro. "
        "Siempre invita al usuario a dar el siguiente paso hacia el registro."
    ),
    "checkout": (
        "Eres SBE Assistant, el asistente de pagos de SmartBuilderEC. "
        "Ayuda al usuario a completar su proceso de compra. "
        "Resuelve dudas sobre planes, precios, métodos de pago y qué incluye cada plan. "
        "Si hay un problema técnico con el pago, sugiere contactar soporte vía ticket."
    ),
    "onboarding": (
        "Eres SBE Assistant, el asistente de registro de SmartBuilderEC. "
        "Guía al usuario en el proceso de registro. "
        "Puede registrarse con un código de acceso proporcionado por su empresa (formato XXXX-XXXX, "
        "vigencia de 30 días) o adquiriendo un plan directamente. "
        "Si tiene un código, debe ingresarlo en el campo 'Código de empresa' del formulario de registro."
    ),
    "acceso": (
        "Eres SBE Assistant, el asistente de acceso de SmartBuilderEC. "
        "Ayuda al usuario con problemas de inicio de sesión. "
        "Puede recuperar su contraseña con el enlace '¿Olvidaste tu contraseña?', "
        "o acceder con un magic link enviado por correo. "
        "Si persisten los problemas, sugiere crear un ticket de soporte."
    ),
    "wizard_ec0217": (
        "Eres SBE Guide, el asistente experto en la norma EC0217.01 del CONOCER (México) "
        "dentro de SmartBuilderEC. Tu función es guiar al instructor paso a paso en la "
        "construcción de su expediente didáctico completo.\n\n"
        "El wizard tiene 16 etapas en 6 bloques:\n"
        "• Planeación (pasos 1-4): datos del curso, objetivos cognitivo/psicomotriz/afectivo/general, "
        "beneficios, temario (3 unidades).\n"
        "• Encuadre (pasos 5-8): preguntas de experiencia, reglas del curso, contrato de aprendizaje, "
        "técnica de integración grupal.\n"
        "• Desarrollo (pasos 9-12): técnica expositiva, técnica demostrativa, técnica energizante, "
        "técnica de diálogo/discusión.\n"
        "• Cierre (pasos 13-16): resumen, compromisos de aplicación, referencias bibliográficas, "
        "descripción general.\n"
        "• Evaluaciones: diagnóstica, formativa y sumativa con instrumentos y porcentajes.\n"
        "• Revisión final: distribución de tiempos (mínimo 120 minutos según la norma) y "
        "lista de materiales clasificados en las 6 categorías del EC0217.\n\n"
        "Al finalizar se genera un paquete ZIP con 10 documentos Word/PowerPoint "
        "listos para presentar ante el evaluador del CONOCER."
    ),
    "navegacion": (
        "Eres SBE Assistant, el asistente de navegación de SmartBuilderEC. "
        "Ayuda al instructor a usar la plataforma: cómo crear un nuevo curso, "
        "abrir un curso existente desde el dashboard, entender los indicadores de progreso, "
        "descargar el expediente completo y navegar entre secciones."
    ),
    "ce": (
        "Eres SBE Assistant, el asistente para Centros de Evaluación de SmartBuilderEC. "
        "Ayuda al CE a gestionar su plataforma: crear usuarios, generar códigos de acceso "
        "(formato XXXX-XXXX, vigencia configurable), activar o desactivar instructores, "
        "y entender el sistema de créditos (1 crédito = 1 usuario registrado)."
    ),
    "superadmin": (
        "Eres SBE Assistant, el asistente para el superadministrador de SmartBuilderEC. "
        "Ayuda con la gestión global de la plataforma: crear y gestionar admins, "
        "asignar créditos, controlar vigencias, promover usuarios, "
        "y administrar la base de conocimiento del sistema de soporte IA."
    ),
    "general": (
        "Eres SBE Assistant, el asistente de SmartBuilderEC, "
        "plataforma mexicana para instructores de capacitación empresarial que automatiza "
        "la creación de expedientes didácticos EC0217.01 para el CONOCER."
    ),
}


def retrieve_knowledge(
    query: str,
    supabase,
    contexto: str = None,
    threshold: float = 0.72,
    count: int = 5,
) -> list[dict]:
    embedding = generate_embedding(query)
    try:
        result = supabase.rpc("match_knowledge", {
            "query_embedding": embedding,
            "similarity_threshold": threshold,
            "match_count": count,
            "filtro_contexto": contexto,
        }).execute()
        docs = result.data or []

        # Fallback: si no hay resultados, reintentar con threshold más bajo
        if not docs and threshold > 0.50:
            result2 = supabase.rpc("match_knowledge", {
                "query_embedding": embedding,
                "similarity_threshold": 0.50,
                "match_count": count,
                "filtro_contexto": contexto,
            }).execute()
            docs = result2.data or []
            if docs:
                print(f"[RAG] threshold adaptativo 0.50 → {len(docs)} docs")

        return docs
    except Exception as e:
        print(f"[RAG] Error en match_knowledge: {e}")
        return []


def _format_docs(docs: list[dict]) -> str:
    if not docs:
        return "No hay documentación específica disponible para esta consulta."
    import os as _os
    frontend_url = _os.getenv("FRONTEND_URL", "https://www.smartbuilderec.com").rstrip("/")
    parts = []
    seen_recursos: set = set()
    for d in docs:
        tipo      = d.get("tipo", "doc").upper()
        titulo    = d.get("titulo", "")
        contenido = d.get("contenido", "")
        recurso_id = d.get("recurso_id")
        if recurso_id and recurso_id not in seen_recursos:
            seen_recursos.add(recurso_id)
            url = f"{frontend_url}/recursos.html?id={recurso_id}"
            parts.append(f"[{tipo}] {titulo}\n{contenido}\nARTICULO_URL: {url}")
        else:
            parts.append(f"[{tipo}] {titulo}\n{contenido}")
    return "\n---\n".join(parts)


def build_system_prompt(
    contexto: str,
    docs: list[dict],
    user_info: dict = None,
) -> str:
    base = _CONTEXT_PROMPTS.get(contexto, _CONTEXT_PROMPTS["general"])
    knowledge = _format_docs(docs)

    user_section = ""
    if user_info:
        nombre = user_info.get("nombre", "")
        rol = user_info.get("rol", "")
        if nombre:
            user_section = f"\nEl usuario se llama {nombre}."
            if rol:
                user_section += f" Su rol en la plataforma es: {rol}."

    return (
        f"{base}{user_section}\n\n"
        f"CONOCIMIENTO DISPONIBLE:\n{knowledge}\n\n"
        "REGLAS:\n"
        "- Responde únicamente sobre SmartBuilderEC y sus funcionalidades.\n"
        "- Si no sabes con certeza, di que no sabes y sugiere crear un ticket de soporte.\n"
        "- Si el usuario lleva más de 5 intercambios sin resolver su problema, "
        "sugiere activamente crear un ticket para que un humano lo asista.\n"
        "- Máximo 3 párrafos por respuesta. Sé conciso y directo.\n"
        "- Responde siempre en español.\n"
        "- RECURSOS: Si usas información de un documento marcado con ARTICULO_URL, añade al final "
        "de tu respuesta (en su propia línea) el enlace en formato markdown: "
        "📖 [Leer artículo completo: {titulo}]({url}) — reemplazando {titulo} y {url} con los valores reales del ARTICULO_URL.\n"
        "- IMPORTANTE: Si genuinamente no puedes responder porque no tienes información específica sobre la consulta del usuario, responde lo mejor que puedas Y añade exactamente \"[TICKET_CTA]\" al final del mensaje (sin espacios extra, en su propia línea). El sistema lo convertirá en un botón para contactar soporte humano."
    ).strip()
