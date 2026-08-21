/* MPS #009 — Template HTML de la pestaña "Mi Plan" en el panel admin */

function _htmlPlanTab(statusData) {
  const plan   = statusData?.plan;
  const planLabels = { basico: 'Básico', profesional: 'Profesional', partner: 'Partner', manual: 'Manual' };
  const planLabel  = planLabels[plan] || null;

  if (!plan) return _htmlPlanTabEmpty(statusData);

  const planC  = statusData.plan_credits   ?? 0;
  const extraC = statusData.extra_credits  ?? 0;
  const totalC = statusData.total_credits  ?? 0;
  const status = statusData.status         ?? 'active';
  const renewal = statusData.renewal_date;
  const renewalStr = renewal
    ? new Date(renewal).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
    : '—';
  const packs  = statusData.extra_packs ?? [];
  const txs    = statusData.transactions ?? [];

  const statusBadge = status === 'active'   ? '<span class="plan-status-badge badge-active">Activo</span>'
                    : status === 'canceled'  ? '<span class="plan-status-badge badge-canceled">Cancela al vencer</span>'
                    : status === 'past_due'  ? '<span class="plan-status-badge badge-pastdue">Pago pendiente</span>'
                    : '';

  const upgrades = {
    basico:      ['profesional', 'partner'],
    profesional: ['partner'],
    partner:     [],
  };
  const downgrades = {
    basico:      [],
    profesional: ['basico'],
    partner:     ['profesional', 'basico'],
  };
  const creditsByPlan = { basico: 10, profesional: 25, partner: 60 };

  const upgradeBtns = (upgrades[plan] || []).map(p =>
    `<button class="btn-sm" onclick="admPlanUpgrade('${p}')">↑ Subir a ${planLabels[p]} (${creditsByPlan[p]} créditos)</button>`
  ).join('');

  const downgradeBtns = (downgrades[plan] || []).map(p =>
    `<button class="btn-sm" style="color:var(--c-text-3)" onclick="admPlanDowngrade('${p}')">↓ Bajar a ${planLabels[p]}</button>`
  ).join('');

  const packsList = packs.length ? packs.map(p => {
    const exp = new Date(p.expires_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
    return `<div class="plan-pack-item">🪙 ${p.remaining} créditos · vencen ${exp}</div>`;
  }).join('') : '<p style="font-size:13px;color:var(--c-text-4)">Sin packs activos.</p>';

  const _TX_LABELS = { plan_reset: 'Asignación', extra_purchase: 'Créditos extra', consumed: 'Usado',
                       expired: 'Vencido', plan_upgrade: 'Cambio de plan', restored: 'Restaurado' };
  const txRows = txs.length ? txs.slice(0, 15).map(t => {
    const sign  = t.amount > 0 ? '+' : '';
    const color = t.amount > 0 ? '#16a34a' : '#dc2626';
    const fecha = new Date(t.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
    const label = _TX_LABELS[t.type] || t.type;
    const desc  = t.description ? `<br><span style="font-size:11px;color:var(--c-text-4);font-weight:400">${t.description}</span>` : '';
    return `<tr>
      <td style="font-size:12px;color:var(--c-text-4);white-space:nowrap">${fecha}</td>
      <td style="font-size:13px;color:var(--c-text-2);font-weight:600">${label}${desc}</td>
      <td style="font-weight:700;color:${color};text-align:right;white-space:nowrap">${sign}${t.amount}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--c-text-4);font-size:13px;padding:16px">Sin transacciones aún.</td></tr>';

  return `
  <div class="plan-tab-wrap">
    <div class="plan-summary-row">
      <div class="plan-summary-card">
        <div class="psc-label">Plan activo</div>
        <div class="psc-value">${planLabel} ${statusBadge}</div>
      </div>
      <div class="plan-summary-card">
        <div class="psc-label">Créditos plan</div>
        <div class="psc-value psc-credits">${planC}</div>
        <div class="psc-sub">Renuevan ${renewalStr}</div>
      </div>
      <div class="plan-summary-card">
        <div class="psc-label">Créditos extra</div>
        <div class="psc-value psc-credits">${extraC}</div>
        <div class="psc-sub">30 días desde compra</div>
      </div>
      <div class="plan-summary-card plan-summary-card--total">
        <div class="psc-label">Total disponibles</div>
        <div class="psc-value psc-credits psc-total">${totalC}</div>
      </div>
    </div>

    <div class="plan-actions-row">
      <h3 class="plan-section-title">Cambiar plan</h3>
      <div class="plan-btn-group">
        ${upgradeBtns || '<span style="font-size:13px;color:var(--c-text-4)">Estás en el plan más alto.</span>'}
        ${downgradeBtns}
      </div>
    </div>

    <div class="plan-actions-row">
      <h3 class="plan-section-title">Créditos extra</h3>
      <div class="plan-btn-group" style="align-items:flex-start;flex-direction:column;gap:10px">
        <button class="btn-primary" style="font-size:13px" onclick="admPlanBuyExtra()">🪙 Comprar +10 créditos — $350 MXN</button>
        <div id="plan-packs-list">${packsList}</div>
      </div>
    </div>

    <div class="plan-actions-row">
      <h3 class="plan-section-title">Historial de créditos</h3>
      <div class="table-wrap" style="margin-top:8px">
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Concepto</th><th style="text-align:right">Créditos</th></tr></thead>
          <tbody id="plan-tx-tbody">${txRows}</tbody>
        </table>
      </div>
    </div>

    <div class="plan-actions-row" style="margin-top:16px">
      ${status !== 'canceled'
        ? `<button class="btn-sm" style="color:#dc2626;border-color:#fecaca" onclick="admPlanCancel()">Cancelar suscripción</button>`
        : `<p style="font-size:13px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin:0">
            Tu suscripción está cancelada y vencerá el ${renewalStr}. Después no podrás agregar más usuarios.
           </p>`}
    </div>
  </div>`;
}

function _htmlPlanTabEmpty(statusData) {
  const txs = statusData?.transactions ?? [];
  const _TX_LABELS = { plan_reset: 'Asignación', extra_purchase: 'Créditos extra', consumed: 'Usado',
                       expired: 'Vencido', plan_upgrade: 'Cambio de plan', restored: 'Restaurado' };
  const txRows = txs.length ? txs.slice(0, 15).map(t => {
    const sign  = t.amount > 0 ? '+' : '';
    const color = t.amount > 0 ? '#16a34a' : '#dc2626';
    const fecha = new Date(t.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
    const label = _TX_LABELS[t.type] || t.type;
    const desc  = t.description ? `<br><span style="font-size:11px;color:var(--c-text-4);font-weight:400">${t.description}</span>` : '';
    return `<tr>
      <td style="font-size:12px;color:var(--c-text-4);white-space:nowrap">${fecha}</td>
      <td style="font-size:13px;color:var(--c-text-2);font-weight:600">${label}${desc}</td>
      <td style="font-weight:700;color:${color};text-align:right;white-space:nowrap">${sign}${t.amount}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--c-text-4);font-size:13px;padding:16px">Sin transacciones aún.</td></tr>';

  return `
  <div class="plan-tab-wrap">
    <div style="text-align:center;padding:24px 20px 20px;border-bottom:1px solid var(--c-border);margin-bottom:20px">
      <div style="font-size:36px;margin-bottom:10px">💳</div>
      <h3 style="font-size:16px;font-weight:700;color:var(--c-text);margin-bottom:6px">Cuenta sin suscripción Stripe</h3>
      <p style="font-size:13px;color:var(--c-text-3);max-width:360px;margin:0 auto 14px">
        Los créditos son gestionados manualmente. Contacta al administrador del sistema.
      </p>
      <a href="pagos.html" class="btn-sm" style="text-decoration:none">Ver planes y precios →</a>
    </div>
    <div class="plan-actions-row">
      <h3 class="plan-section-title">Historial de créditos</h3>
      <div class="table-wrap" style="margin-top:8px">
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Concepto</th><th style="text-align:right">Créditos</th></tr></thead>
          <tbody>${txRows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}
