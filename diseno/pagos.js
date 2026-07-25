/* MPS #009 — Página pública de planes. Lógica de checkout con Stripe. */
(function () {
  'use strict';

  const BACKEND_URL = (typeof window !== 'undefined' && window._SBE_BACKEND_URL)
    || 'https://smartbuilderec-api.onrender.com';

  const PLAN_INFO = {
    basico:      { label: 'Básico',      credits: 10 },
    profesional: { label: 'Profesional', credits: 25 },
    partner:     { label: 'Partner',     credits: 60 },
  };

  let _session      = null;
  let _currentPlan  = null;
  let _loading      = false;

  async function _getHeaders() {
    if (!_session) return { 'Content-Type': 'application/json' };
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${_session.access_token}`,
    };
  }

  async function _getSession() {
    if (typeof window._supabase !== 'undefined') {
      const { data } = await window._supabase.auth.getSession();
      return data?.session || null;
    }
    return null;
  }

  async function _loadCurrentPlan() {
    if (!_session) return;
    try {
      const res = await fetch(`${BACKEND_URL}/planes/status`, {
        headers: await _getHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      _currentPlan = data.plan || null;
      _updateUI(data);
    } catch (_) {}
  }

  function _updateUI(statusData) {
    const plan = statusData?.plan;
    if (!plan) return;
    const planNames = Object.keys(PLAN_INFO);
    planNames.forEach(p => {
      const card = document.getElementById(`card-${p}`);
      const btn  = card?.querySelector('.btn-plan');
      if (!card || !btn) return;
      if (p === plan) {
        card.classList.add('plan-card--current');
        card.classList.remove('plan-card--featured');
        btn.textContent  = '✓ Plan actual';
        btn.className    = 'btn-plan btn-plan--current';
        btn.disabled     = true;
        const badge = card.querySelector('.plan-badge');
        if (badge) { badge.textContent = '✓ Tu plan actual'; badge.className = 'plan-badge plan-badge--current'; }
        else {
          const b = document.createElement('div');
          b.className = 'plan-badge plan-badge--current';
          b.textContent = '✓ Tu plan actual';
          card.prepend(b);
        }
      } else {
        const order = ['basico', 'profesional', 'partner'];
        const iUp = order.indexOf(p) > order.indexOf(plan);
        btn.textContent = iUp ? `Subir a ${PLAN_INFO[p].label}` : `Bajar a ${PLAN_INFO[p].label}`;
      }
    });

    const alert = document.getElementById('planesAlert');
    if (alert && statusData.total_credits !== undefined) {
      alert.style.display = 'block';
      alert.textContent   = `Tu plan actual: ${PLAN_INFO[plan]?.label || plan} · ${statusData.total_credits} crédito${statusData.total_credits !== 1 ? 's' : ''} disponibles`;
    }
  }

  async function _handlePlanClick(plan) {
    if (_loading) return;
    if (plan === _currentPlan) return;
    if (!_session) {
      sessionStorage.setItem('pagos_plan_pending', plan);
      window.location.href = `login.html?redirect=${encodeURIComponent('pagos.html')}`;
      return;
    }
    _loading = true;
    const btn = document.querySelector(`#card-${plan} .btn-plan`);
    const origText = btn?.textContent || '';
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    try {
      const endpoint = _currentPlan ? '/planes/upgrade' : '/planes/checkout-subscription';
      let body, method = 'POST';
      if (_currentPlan) {
        body = JSON.stringify({ new_plan: plan });
      } else {
        body = JSON.stringify({
          plan,
          success_url: `${window.location.origin}/panel.html?payment=success`,
          cancel_url:  `${window.location.origin}/pagos.html`,
        });
      }
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method, headers: await _getHeaders(), body,
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || 'Error al procesar. Intenta de nuevo.'); return; }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        alert('✓ ' + (data.message || 'Plan actualizado.'));
        window.location.reload();
      }
    } catch (e) {
      alert('Error de conexión. Intenta de nuevo.');
    } finally {
      _loading = false;
      if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
  }

  async function _handleExtraCredits() {
    if (_loading) return;
    if (!_session) {
      sessionStorage.setItem('pagos_plan_pending', 'extra');
      window.location.href = `login.html?redirect=${encodeURIComponent('pagos.html')}`;
      return;
    }
    _loading = true;
    const btn = document.getElementById('btnExtraCredits');
    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    try {
      const res = await fetch(`${BACKEND_URL}/planes/checkout-creditos-extra`, {
        method: 'POST',
        headers: await _getHeaders(),
        body: JSON.stringify({
          success_url: `${window.location.origin}/panel.html?payment=extra_ok`,
          cancel_url:  `${window.location.origin}/panel.html?tab=mi-plan`,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.detail || 'Error al procesar.'); return; }
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (_) {
      alert('Error de conexión. Intenta de nuevo.');
    } finally {
      _loading = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Comprar +10 créditos'; }
    }
  }

  async function init() {
    _session = await _getSession();
    const btnPanel = document.getElementById('btnPanel');
    const btnLogin = document.getElementById('btnLogin');
    if (_session) {
      if (btnPanel) btnPanel.style.display = '';
      if (btnLogin) btnLogin.style.display = 'none';
      await _loadCurrentPlan();
    }

    document.querySelectorAll('.btn-plan:not(:disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.closest('[data-plan]')?.dataset.plan
                  || btn.dataset.plan
                  || btn.closest('.plan-card')?.id?.replace('card-', '');
        if (plan) _handlePlanClick(plan);
      });
    });

    document.getElementById('btnExtraCredits')
      ?.addEventListener('click', _handleExtraCredits);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      const a = document.getElementById('planesAlert');
      if (a) { a.style.display = 'block'; a.textContent = '✓ ¡Pago exitoso! Tu plan ya está activo.'; a.style.background = '#f0fdf4'; a.style.borderColor = '#bbf7d0'; a.style.color = '#166534'; }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
