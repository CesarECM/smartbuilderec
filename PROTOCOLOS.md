# Índice de Protocolos — SmartBuilderEC

Registro vivo de los protocolos del marco de trabajo. Lo mantiene actualizado el **MODO MARCO/META** y el **PASO 9.3** del MPS.md cada vez que se crea, elimina o reorganiza un protocolo.

**Última actualización:** 2026-10-15

---

## 1. Protocolo maestro de flujo
- **Flujo obligatorio de trabajo (PASO 0 → 9)** — definido en `MPS.md`. Incluye el **PASO 9** (autoaprendizaje y mejora continua) con sus sub-pasos 9.1–9.5, entre ellos el **9.5 Veredicto de cierre seguro** ("ES SEGURO CERRAR ESTA SESIÓN").

## 2. Modos de sesión (5)
| Modo | Propósito | ¿Commitea? |
|------|-----------|-----------|
| **MPS** | Creación/implementación de features nuevas (PASO 0→9) | ❌ working tree + nota |
| **PCCA-X** | Corrección de errores (invoca Protocolo PCCA-X v2.0) | ❌ working tree + nota |
| **INTEGRADOR** | Consolida memorias, commits atómicos, push a prod (con check pre-push) | ✅ **único** |
| **IDEAS** | Captura/evalúa ideas → `RUTA_MAESTRA.md` (+ línea en `pendiente_commit.md`) | ❌ no toca código |
| **MARCO/META** | Evolución del propio marco/protocolos (auto-invocado) | ❌ working tree + nota |

Regla transversal: **solo el modo Integrador** puede commitear o hacer `git push`.

## 3. Protocolos especializados
- **Protocolo PCCA-X v2.0** — debugging asistido por IA: 6 postulados + Circuit Breaker. (memoria: `feedback_protocolo_pcca_x.md`)
- **Proceso de clonar DOCX oficial** — python-docx: template base, helpers obligatorios, reglas bold/italic, nil borders. (memoria: `feedback_clonar_docx.md`)

---

## Artefactos de soporte
- `RUTA_MAESTRA.md` — backlog maestro priorizado (lo escribe el modo IDEAS). *Se crea al primer uso.*
- `pendiente_commit.md` (memoria) — nota de commit que MPS/PCCA-X/MARCO dejan para el Integrador. *Se crea al primer uso.*
- `MEMORY.md` + carpeta `memory/` — memoria persistente del proyecto.
- `ARCHITECTURE.md` — arquitectura técnica (fuente de verdad del stack).
