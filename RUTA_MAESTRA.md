# RUTA MAESTRA — Backlog priorizado de ideas

Backlog maestro del proyecto SmartBuilderEC. Lo escribe el **MODO IDEAS** (ver `MPS.md` / `PROTOCOLOS.md`).
Cada idea aquí registrada es candidata a una futura **sesión MPS** para su implementación. Este archivo **no** ejecuta nada.

**Prioridades:** 🔴 Alta · 🟡 Media · 🟢 Baja
**Estado:** 💡 Idea · 🔎 En análisis · ✅ Promovida a MPS · ❌ Descartada

---

## EC0217.01

### IDEA-001 · 🔴 · 💡 — Instrumento de Evaluación Formativa debe resolver a UNO solo
**Fecha captura:** 2026-10-15

**Problema:** En el **Documento de Planeación del Curso**, apartado **2. Evaluación Formativa**, la tercera columna ("instrumento de evaluación") muestra un valor dinámico que aparece como la cadena combinada **"Lista de cotejo / Guía de observación"**. Según la norma debe mostrar **UNO solo**: **a) Lista de cotejo** *o* **b) Guía de observación**.

**Causa raíz (confirmada leyendo código):**
- En el wizard (`diseno/wizard/html-evaluaciones.js:102-106`), `instFormativa` es un **textarea libre** que la IA llena con el instrumento completo; **no existe un selector explícito** a/b.
- La tercera columna toma la **primera línea** de ese textarea vía el helper `_inst()` (`backend/services/doc_planeacion_xml.py:182`) / `extraerNombreInstrumento()`. Si la primera línea no es limpia o el campo viene vacío, cae al **fallback combinado**.
- El fallback `'Lista de cotejo / Guía de observación'` está **duplicado en dos motores**:
  - 🐍 Python: `backend/services/doc_planeacion_filas.py:119`
  - 🟨 Node.js: `backend/generators/tabla-evaluaciones.js:11` y `backend/generators/doc-content.js:120`

**Opciones de solución (a decidir en la MPS):**
1. **Selector explícito en el wizard** (radio/select "Lista de cotejo" | "Guía de observación") que determine la columna de forma determinista. Más control; toca front + modelo + ambos motores.
2. **Que la IA etiquete el tipo** de instrumento en una primera línea estándar, para que la extracción de primera línea sea confiable.
3. **Mínimo:** cambiar el fallback combinado por uno único cuando el campo llega vacío.

**Valor/Esfuerzo:** Valor alto (fidelidad normativa) · Esfuerzo bajo-medio.

**Riesgos/Notas:**
- Patrón defaults front↔backend (`feedback_defaults_front_backend.md`): si se vuelve select, el backend debe seguir leyendo el string exacto.
- Doble motor Node/Python: el fix debe aplicarse en **ambos** o se arregla solo una ruta de generación (cruza con backlog `#4 migrar Node→Python`).

**Decisión del usuario (2026-10-15):** "lo elige en el wizard" — a validar en la MPS, porque hoy el wizard usa textarea libre + IA, no un selector a/b limpio.
