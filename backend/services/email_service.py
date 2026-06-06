import os
import httpx
from database import get_supabase


def _replace_vars(text: str, variables: dict) -> str:
    for key, value in variables.items():
        text = text.replace(f"{{{{{key}}}}}", str(value) if value is not None else "")
    return text


def send_email(to: str, subject: str, html: str) -> bool:
    api_key = os.getenv("RESEND_API_KEY")
    _addr = os.getenv("RESEND_FROM_EMAIL", "noreply@smartbuilderec.mx")
    from_email = f"SmartBuilderEC EC0217.01 <{_addr}>"
    if not api_key:
        print(f"⚠️ RESEND_API_KEY no configurado — email a {to} omitido")
        return False
    try:
        with httpx.Client(timeout=10) as client:
            res = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={"from": from_email, "to": [to], "subject": subject, "html": html},
            )
            if res.status_code not in (200, 201):
                print(f"⚠️ Resend error {res.status_code}: {res.text}")
                return False
            return True
    except Exception as e:
        print(f"⚠️ send_email error: {e}")
        return False


def send_template(slug: str, to: str, variables: dict) -> bool:
    sb = get_supabase()
    try:
        res = (
            sb.table("email_templates")
            .select("subject, body_html")
            .eq("slug", slug)
            .single()
            .execute()
        )
        if not res.data:
            print(f"⚠️ Template '{slug}' no encontrado en DB")
            return False
        subject = _replace_vars(res.data["subject"], variables)
        html = _replace_vars(res.data["body_html"], variables)
        return send_email(to, subject, html)
    except Exception as e:
        print(f"⚠️ send_template error ({slug}): {e}")
        return False
