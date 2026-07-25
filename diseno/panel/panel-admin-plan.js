/* MPS #009 — Lógica del tab "Mi Plan" en el panel admin */
(function () {
  'use strict';

  const PLAN_LABELS = { basico: 'Básico', profesional: 'Profesional', partner: 'Partner' };
  let _planStatus = null;

  async function _getHeaders() {
    const { data } = await window._supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token
      ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
  }

  async function admPlanInit() {
    const container = document.getElementById('adm-planContainer');
    if (!container) return;
    container.innerHTML = '<p class="loading-txt">Cargando plan...</p>';
    try {
      const headers = await _getHeaders();
      const res = await fetch(`${BACKEND_URL}/planes/status`, { headers });
      if (!res.ok) throw new Error(await res.text());
      _planStatus = await res.json();
      container.innerHTML = typeof _htmlPlanTab === 'function'
        ? _htmlPlanTab(_planStatus) : '<p>Template no disponible.</p>';
    } catch (e) {
      container.innerHTML = `<p class="error-txt">Error al cargar el plan: ${e.message}</p>`;
    }
  }

  async function admPlanUpgrade(newPlan) {
    const label = PLAN_LABELS[newPlan] || newPlan;
    if (!confirm(`¿Subir al plan ${label}? Se cobrará la diferencia inmediatamente.`)) return;
    await _planAction(`/planes/upgrade`, { new_plan: newPlan }, `Plan actualizado a ${label}.`);
  }

  async function admPlanDowngrade(newPlan) {
    const label = PLAN_LABELS[newPlan] || newPlan;
    if (!confirm(`¿Bajar al plan ${label} al siguiente ciclo de facturación?`)) return;
    await _planAction(`/planes/upgrade`, { new_plan: newPlan }, `Plan cambiado a ${label} (efectivo al próximo ciclo).`);
  }

  async function admPlanCancel() {
    if (!confirm('¿Cancelar la suscripción? Seguirás teniendo acceso hasta el fin del período actual.')) return;
    await _planAction('/planes/cancel', {}, 'Suscripción cancelada. Mantiene acceso hasta el vencimiento.');
  }

  async function admPlanBuyExtra() {
    try {
      const headers = await _getHeaders();
      mostrarToast('⏳ Preparando checkout...');
      const res = await fetch(`${BACKEND_URL}/planes/checkout-creditos-extra`, {
        method: 'POST', headers,
        body: JSON.stringify({
          success_url: `${window.location.href.split('?')[0]}?payment=extra_ok`,
          cancel_url:  `${window.location.href.split('?')[0]}?tab=mi-plan`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { mostrarToast('Error: ' + (data.detail || 'intenta de nuevo'), 'error'); return; }
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (e) {
      mostrarToast('Error de conexión.', 'error');
    }
  }

  async function _planAction(endpoint, body, successMsg) {
    try {
      const headers = await _getHeaders();
      mostrarToast('⏳ Procesando...');
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST', headers,
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.checkout_url) { window.location.href = data.checkout_url; return; }
        mostrarToast('Error: ' + (data.detail || 'intenta de nuevo'), 'error');
        return;
      }
      if (data.checkout_url) { window.location.href = data.checkout_url; return; }
      mostrarToast('✓ ' + (data.message || successMsg));
      setTimeout(admPlanInit, 1200);
    } catch (e) {
      mostrarToast('Error de conexión.', 'error');
    }
  }

  // ── Exponer al ámbito global ──────────────────────────────────────────────
  window.admPlanInit      = admPlanInit;
  window.admPlanUpgrade   = admPlanUpgrade;
  window.admPlanDowngrade = admPlanDowngrade;
  window.admPlanCancel    = admPlanCancel;
  window.admPlanBuyExtra  = admPlanBuyExtra;

  // ── Manejar retorno desde Stripe checkout ─────────────────────────────────
  (function _checkPaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const tab     = params.get('tab');

    if (payment === 'success' || payment === 'extra_ok') {
      const msg = payment === 'extra_ok'
        ? '✓ Créditos extra añadidos a tu cuenta.'
        : '✓ ¡Suscripción activada! Bienvenido a SmartBuilderEC.';
      // Mostrar toast al cargar — admInit lo invocará después de renderizar
      window._admPlanSuccessMsg = msg;
      window._admPlanOpenOnLoad = true;
    }
    if (tab === 'mi-plan') {
      window._admPlanOpenOnLoad = true;
    }
  })();
})();

// ── CSS específico del tab Mi Plan (inyectado dinámicamente) ─────────────────
(function _injectPlanStyles() {
  if (document.getElementById('plan-tab-styles')) return;
  const style = document.createElement('style');
  style.id = 'plan-tab-styles';
  style.textContent = `
    .plan-tab-wrap { padding: 4px 0; }
    .plan-summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .plan-summary-card { background: var(--c-surface, #f9fafb); border: 1.5px solid var(--c-border, #e5e7eb); border-radius: 12px; padding: 16px; }
    .plan-summary-card--total { border-color: var(--c-primary, #1d4ed8); background: #eff6ff; }
    .psc-label { font-size: 11px; font-weight: 600; color: var(--c-text-3, #6b7280); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
    .psc-value { font-size: 20px; font-weight: 700; color: var(--c-text, #111827); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .psc-credits { color: var(--c-primary, #1d4ed8); }
    .psc-total   { font-size: 28px; }
    .psc-sub     { font-size: 11px; color: var(--c-text-4, #9ca3af); margin-top: 4px; }
    .plan-status-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; letter-spacing: .3px; text-transform: uppercase; }
    .badge-active   { background: #dcfce7; color: #166534; }
    .badge-canceled { background: #fef3c7; color: #92400e; }
    .badge-pastdue  { background: #fee2e2; color: #991b1b; }
    .plan-actions-row { margin-bottom: 20px; }
    .plan-section-title { font-size: 14px; font-weight: 700; color: var(--c-text, #111827); margin: 0 0 10px; }
    .plan-btn-group { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .plan-pack-item { font-size: 13px; color: var(--c-text-2, #374151); background: #fafafa; border: 1px solid var(--c-border, #e5e7eb); border-radius: 6px; padding: 5px 10px; display: inline-block; }
  `;
  document.head.appendChild(style);
})();
