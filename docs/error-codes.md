# Manual de Errores — SmartBuilderEC (interno soporte)

## Diagnóstico rápido de créditos

```sql
-- Historial completo de un admin por email
SELECT ct.type, ct.amount, ct.source, ct.description, ct.created_at
FROM credit_transactions ct JOIN profiles p ON p.id = ct.user_id
WHERE p.email = 'EMAIL_DEL_ADMIN'
ORDER BY ct.created_at ASC;

-- Saldo actual + suscripción
SELECT p.email, p.credits AS saldo_perfil,
       s.plan, s.plan_credits_remaining, s.plan_credits_total, s.status, s.plan_period_end
FROM profiles p
LEFT JOIN admin_subscriptions s ON s.user_id = p.id
WHERE p.email = 'EMAIL_DEL_ADMIN';

-- Reponer créditos manualmente
UPDATE profiles SET credits = N WHERE email = 'EMAIL_DEL_ADMIN';
INSERT INTO credit_transactions (user_id, type, amount, source, description)
SELECT id, 'restored', N, 'soporte', 'Motivo del ajuste'
FROM profiles WHERE email = 'EMAIL_DEL_ADMIN';
```

---

## Tipos válidos en credit_transactions.type

| type | Uso |
|------|-----|
| `plan_reset` | Activación o renovación de plan (Stripe o manual) |
| `extra_purchase` | Compra de pack extra de créditos |
| `consumed` | Consumo por código canjeado, proceso GCE manual o invitación aceptada |
| `expired` | Créditos de pack extra vencidos |
| `plan_upgrade` | Cambio de plan Stripe |
| `restored` | Restauración manual por soporte o super_admin |

---

## Catálogo de errores por módulo

### GCE — Procesos

| Código | HTTP | Causa | Dónde aparece | Acción soporte |
|--------|------|-------|---------------|----------------|
| ERR-GCE-001 | 402 | CE sin créditos al crear proceso manual | Panel CE (toast) | Reponer con SQL `restored` |
| ERR-GCE-002 | 409 | Candidato ya tiene proceso activo para ese EC | Panel CE (toast) | Ver `procesos_evaluacion` del CE |
| ERR-GCE-003 | 403 | Usuario sin rol `ce_admin` intenta crear proceso | Panel CE | Asignar rol en super_admin |

### GCE — Invitaciones

| Código | HTTP | Causa | Dónde aparece | Acción soporte |
|--------|------|-------|---------------|----------------|
| ERR-INV-001 | 402 | CE sin créditos al enviar invitación | Panel CE tab Invitaciones | Reponer créditos |
| ERR-INV-002 | 402 | CE sin créditos cuando candidato acepta | Página gce-invitacion (inline) | Reponer créditos al CE |
| ERR-INV-003 | 404 | Token de invitación inválido o no encontrado | Página gce-invitacion | Buscar en `gce_invitaciones` por email |
| ERR-INV-004 | 409 | Ya existe invitación pendiente para ese email | Panel CE tab Invitaciones | Eliminar la pendiente o esperar aceptación |
| ERR-INV-005 | 410 | Invitación expirada (>7 días) | Página gce-invitacion | CE debe enviar nueva invitación |
| ERR-INV-006 | 422 | Candidato sin ECs asignados o email inválido | Panel CE tab Invitaciones | Verificar form en panel |

### Códigos de acceso (wizard)

| Código | Causa | Dónde aparece | Acción soporte |
|--------|-------|---------------|----------------|
| ERR-CODE-001 | CE sin créditos al generar código | Panel CE tab Códigos (alert) | Reponer créditos |
| ERR-CODE-002 | Código expirado al canjear | Página registro | CE debe generar nuevo código |

### Auth / Permisos

| Código | HTTP | Causa | Acción soporte |
|--------|------|-------|----------------|
| ERR-AUTH-001 | 403 | Rol insuficiente para la acción | Verificar rol en `profiles` y `user_roles` |

---

## Regla: 1 crédito = ?

| Acción | Costo |
|--------|-------|
| Generar un código de acceso al wizard | 1 crédito |
| Crear proceso GCE manualmente (panel CE) | 1 crédito |
| Candidato acepta invitación GCE con N ECs | N créditos (1 por EC) |

> El pool de créditos es compartido para todos los contextos. Un admin con 10 créditos
> puede gastar 5 en códigos y 5 en GCE — no hay separación por tipo de uso.

---

## Diferencias: admin Stripe vs admin manual

| Campo | Stripe | Manual |
|-------|--------|--------|
| `profiles.stripe_customer_id` | ID de cliente | `null` |
| `admin_subscriptions.plan` | `basico` / `profesional` / `partner` | `manual` |
| Renovación de créditos | Automática vía webhook | Manual vía super_admin |
| Historial en Mi Plan | Visible | Visible (sección simplificada) |

Para convertir un admin manual a Stripe: el cliente compra un plan en pagos.html;
el webhook `checkout.session.completed` vincula su email y crea la suscripción.
