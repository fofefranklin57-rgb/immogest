// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Panneau Owner (Franklin)
//  Accès : OWNER_TOKEN uniquement — stats globales, gestion plans
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.owner = (function() {

  var OWNER_TOKEN = '8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058';
  var _token = null;

  function esc(s) { return window.IG.utils.esc(String(s || '')); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  async function _call(action, extra) {
    var payload = Object.assign({ ownerToken: _token || OWNER_TOKEN, action }, extra || {});
    var res = await fetch(window.IG.config.workerUrl + '/owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var d = await res.json();
    if (!res.ok || d.error) throw new Error(d.error || 'Erreur owner');
    return d;
  }

  // ── Authentification owner ────────────────────────────────────
  function renderLogin() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML =
      '<div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;background:#0B1628">' +
      '<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:36px 32px;width:100%;max-width:380px">' +
      '<div style="text-align:center;margin-bottom:28px">' +
      '<div style="font-size:48px;margin-bottom:10px">🔑</div>' +
      '<h1 style="color:#fff;font-size:22px;font-weight:700;margin-bottom:4px">Owner Panel</h1>' +
      '<p style="color:rgba(255,255,255,0.45);font-size:12px">ImmoGest v2 — Cabinet CRAA</p></div>' +
      '<input id="owner-token-input" type="password" placeholder="Owner token..." ' +
        'style="width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);' +
        'background:rgba(255,255,255,0.08);color:#fff;font-size:14px;margin-bottom:14px">' +
      '<button id="owner-login-btn" ' +
        'style="width:100%;padding:13px;border-radius:12px;border:none;background:#0E6AAF;color:#fff;font-size:15px;font-weight:700;cursor:pointer">' +
        '🚀 Accéder</button>' +
      '<p id="owner-err" style="color:#E05A5A;font-size:12px;text-align:center;margin-top:10px;display:none"></p>' +
      '</div></div>';

    document.getElementById('owner-login-btn').addEventListener('click', async function() {
      var tok = document.getElementById('owner-token-input').value.trim();
      var btn = document.getElementById('owner-login-btn');
      var err = document.getElementById('owner-err');
      if (!tok) return;
      btn.textContent = '⏳...'; btn.disabled = true;
      try {
        _token = tok;
        await _call('stats');
        renderDashboard();
      } catch(e) {
        _token = null;
        err.textContent = 'Token invalide'; err.style.display = 'block';
        btn.textContent = '🚀 Accéder'; btn.disabled = false;
      }
    });

    document.getElementById('owner-token-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('owner-login-btn').click();
    });
  }

  // ── Dashboard owner ───────────────────────────────────────────
  async function renderDashboard() {
    var app = document.getElementById('app');
    if (!app) return;

    app.innerHTML =
      '<div style="min-height:100dvh;background:#0B1628;color:#fff">' +
      '<div style="max-width:1100px;margin:0 auto;padding:24px 20px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">' +
      '<div><div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:4px">OWNER PANEL</div>' +
      '<h1 style="font-size:22px;font-weight:700">🏢 ImmoGest v2</h1></div>' +
      '<div style="display:flex;gap:10px">' +
      '<button onclick="window.IG.owner._refreshStats()" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:#fff;cursor:pointer;font-size:13px">↻ Refresh</button>' +
      '<button onclick="window.location.href=\'/\'" style="padding:8px 14px;border-radius:8px;border:none;background:rgba(255,255,255,0.1);color:#fff;cursor:pointer;font-size:13px">← App</button>' +
      '</div></div>' +
      '<div id="owner-content"><div style="text-align:center;padding:60px;color:rgba(255,255,255,0.4)">⏳ Chargement...</div></div>' +
      '</div></div>';

    await _refreshStats();
  }

  async function _refreshStats() {
    var zone = document.getElementById('owner-content');
    if (!zone) return;
    try {
      var d = await _call('stats');
      var tenants = d.tenants || [];
      var users = d.users || [];
      var plans = d.plans || {};

      // KPIs globaux
      var totalTenants = tenants.length;
      var actifs = tenants.filter(function(t) { return t.plan && t.plan !== 'expiré'; }).length;
      var mrr = Object.entries(plans).reduce(function(s, kv) {
        var prix = { starter: 3000, pro: 10000, cabinet: 25000 }[kv[0]] || 0;
        return s + (prix * (kv[1] || 0));
      }, 0);

      var html =
        // KPIs
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:24px">' +
        _kpi('👥', totalTenants, 'Tenants total') +
        _kpi('✅', actifs, 'Plans actifs') +
        _kpi('💰', fmt(mrr), 'MRR estimé') +
        _kpi('📊', users.length, 'Utilisateurs') +
        '</div>' +

        // Plans répartition
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px">' +
        _planCard(plans) +
        _logsCard(d.logs || []) +
        '</div>' +

        // Liste tenants
        '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;overflow:hidden">' +
        '<div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);font-weight:700;font-size:14px">🏢 Tenants (' + totalTenants + ')</div>' +
        '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase">' +
        '<th style="padding:10px 16px;text-align:left">Nom</th>' +
        '<th style="padding:10px 16px;text-align:left">Cabinet</th>' +
        '<th style="padding:10px 16px;text-align:left">Plan</th>' +
        '<th style="padding:10px 16px;text-align:left">Créé</th>' +
        '<th style="padding:10px 16px;text-align:center">Actions</th>' +
        '</tr></thead><tbody>' +
        tenants.map(function(t) {
          var planColor = { gratuit: '#7A90A8', starter: '#3DB87A', pro: '#0E6AAF', cabinet: '#7C3AED', expiré: '#E05A5A' }[t.plan || 'gratuit'] || '#7A90A8';
          return '<tr style="border-bottom:1px solid rgba(255,255,255,0.06)">' +
            '<td style="padding:10px 16px;font-weight:600">' + esc(t.nom) + '</td>' +
            '<td style="padding:10px 16px;color:rgba(255,255,255,0.55)">' + esc(t.nom_cabinet || '—') + '</td>' +
            '<td style="padding:10px 16px"><span style="padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;background:' + planColor + '22;color:' + planColor + '">' + (t.plan || 'gratuit').toUpperCase() + '</span></td>' +
            '<td style="padding:10px 16px;color:rgba(255,255,255,0.4);font-size:12px">' + window.IG.utils.formatDate(t.created_at) + '</td>' +
            '<td style="padding:10px 16px;text-align:center">' +
            '<button onclick="window.IG.owner.upgraderPlan(\'' + esc(t.id) + '\',\'' + esc(t.nom) + '\',\'' + (t.plan || 'gratuit') + '\')" ' +
              'style="padding:4px 12px;border-radius:6px;border:none;background:rgba(14,106,175,0.3);color:#63B3F7;cursor:pointer;font-size:12px;font-weight:600">⬆ Plan</button>' +
            '</td></tr>';
        }).join('') +
        '</tbody></table></div></div>';

      zone.innerHTML = html;
    } catch(e) {
      zone.innerHTML = '<div style="text-align:center;padding:40px;color:#E05A5A">Erreur: ' + esc(e.message) + '</div>';
    }
  }

  function _kpi(icon, val, label) {
    return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:18px 20px">' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px">' + icon + ' ' + label + '</div>' +
      '<div style="font-size:22px;font-weight:700">' + val + '</div></div>';
  }

  function _planCard(plans) {
    var PLANS = ['gratuit','starter','pro','cabinet'];
    var COLORS = { gratuit: '#7A90A8', starter: '#3DB87A', pro: '#0E6AAF', cabinet: '#7C3AED' };
    return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px">' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:14px">📊 Répartition plans</div>' +
      PLANS.map(function(p) {
        var count = plans[p] || 0;
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06)">' +
          '<span style="font-size:13px">' + p.charAt(0).toUpperCase() + p.slice(1) + '</span>' +
          '<span style="font-size:13px;font-weight:700;color:' + COLORS[p] + '">' + count + ' tenant(s)</span>' +
          '</div>';
      }).join('') +
      '</div>';
  }

  function _logsCard(logs) {
    return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:20px">' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:14px">📋 Derniers événements</div>' +
      (logs.length ? logs.slice(0, 8).map(function(l) {
        var col = { info: '#63B3F7', warn: '#F6C344', error: '#E05A5A' }[l.level] || '#7A90A8';
        return '<div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12px">' +
          '<span style="color:' + col + ';font-weight:700">[' + (l.level || 'info').toUpperCase() + ']</span> ' +
          esc(l.message || l.event) + '</div>';
      }).join('') : '<p style="color:rgba(255,255,255,0.35);font-size:12px">Aucun log récent</p>') +
      '</div>';
  }

  // ── Upgrade plan tenant ───────────────────────────────────────
  function upgraderPlan(tenantId, nomTenant, planActuel) {
    var PLANS = ['gratuit','starter','pro','cabinet'];
    var modal = window.IG.utils.showModal(
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px">⬆️ Changer plan — ' + esc(nomTenant) + '</h3>' +
      '<div style="margin-bottom:14px">' +
      '<label style="font-size:12px;color:var(--text2);font-weight:600">Nouveau plan</label>' +
      '<select id="owner-plan-sel" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:6px">' +
      PLANS.map(function(p) {
        return '<option value="' + p + '"' + (p === planActuel ? ' selected' : '') + '>' + p.charAt(0).toUpperCase() + p.slice(1) + '</option>';
      }).join('') +
      '</select></div>' +
      '<div style="margin-bottom:16px">' +
      '<label style="font-size:12px;color:var(--text2);font-weight:600">Expire le (laisser vide = illimité)</label>' +
      '<input id="owner-plan-exp" type="date" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:6px">' +
      '</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="owner-plan-save" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Appliquer</button>' +
      '</div>',
      { width: '420px' }
    );

    modal.box.querySelector('#owner-plan-save').addEventListener('click', async function() {
      var plan = modal.box.querySelector('#owner-plan-sel').value;
      var expire = modal.box.querySelector('#owner-plan-exp').value || null;
      try {
        await _call('upgrade_plan', { tenantId, plan, plan_expire: expire });
        modal.close();
        window.IG.utils.showToast('Plan mis à jour : ' + plan.toUpperCase(), 'green');
        await _refreshStats();
      } catch(e) {
        window.IG.utils.showToast('Erreur: ' + e.message, 'red');
      }
    });
  }

  // ── Point d'entrée externe (URL ?owner=1) ─────────────────────
  function checkAutoOpen() {
    if (window.location.search.includes('owner=1')) {
      renderLogin();
      return true;
    }
    return false;
  }

  return { renderLogin, renderDashboard, upgraderPlan, _refreshStats, checkAutoOpen };

})();
