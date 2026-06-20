// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Panneau Owner (Franklin)
//  Accès : OWNER_TOKEN uniquement — stats globales, gestion plans
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.owner = (function() {

  var _token = null;

  function esc(s) { return window.IG.utils.esc(String(s || '')); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  async function _call(action, extra) {
    if (!_token) throw new Error('Token requis');
    var payload = Object.assign({ ownerToken: _token, action }, extra || {});
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
      '<p style="color:rgba(255,255,255,0.45);font-size:12px">ImmoGest v2 — Administration</p></div>' +
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
      '<button onclick="window.IG.owner.afficherPromos()" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;cursor:pointer;font-size:13px">🎁 Promos</button>' +
      '<button id="owner-msg-btn" onclick="window.IG.owner.afficherMessages()" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;cursor:pointer;font-size:13px">📬 Messages <span id="owner-msg-badge" style="display:none;background:#E05A5A;color:#fff;border-radius:99px;font-size:10px;padding:1px 6px;margin-left:4px">0</span></button>' +
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
      _chargerBadgeMessages();
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

  // ── Gestion codes promo ───────────────────────────────────────
  function afficherPromos() {
    var modal = window.IG.utils.showModal(
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<h3 style="font-size:15px;font-weight:700">🎁 Codes promotionnels</h3>' +
      '<button data-modal-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">' +
      '<div><label style="font-size:11px;color:var(--text2);font-weight:600">Code *</label>' +
      '<input id="promo-code" placeholder="EX: LAUNCH50" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;text-transform:uppercase;margin-top:4px"></div>' +
      '<div><label style="font-size:11px;color:var(--text2);font-weight:600">Plan offert</label>' +
      '<select id="promo-plan" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '<option value="starter">Starter</option><option value="pro">Pro</option><option value="cabinet">Cabinet</option>' +
      '</select></div>' +
      '<div><label style="font-size:11px;color:var(--text2);font-weight:600">Mois gratuits</label>' +
      '<input id="promo-duree" type="number" value="1" min="1" max="24" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +
      '<div><label style="font-size:11px;color:var(--text2);font-weight:600">Utilisations max</label>' +
      '<input id="promo-maxuses" type="number" value="1" min="1" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:16px">' +
      '<button id="promo-gen-btn" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:12px">🎲 Générer code</button>' +
      '<button id="promo-create-btn" style="flex:1;padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ Créer</button>' +
      '</div>' +
      '<div id="promo-liste" style="font-size:12px;color:var(--text3)">Chargement...</div>',
      { width: '560px' }
    );

    // Générer code aléatoire
    modal.box.querySelector('#promo-gen-btn').addEventListener('click', function() {
      var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      var code = 'IMMO';
      for (var i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      modal.box.querySelector('#promo-code').value = code;
    });

    // Charger liste existante
    _call('list_promos').then(function(d) {
      var zone = modal.box.querySelector('#promo-liste');
      var promos = d.promos || [];
      if (!promos.length) { zone.innerHTML = '<p>Aucun code créé.</p>'; return; }
      zone.innerHTML = '<table style="width:100%;border-collapse:collapse">' +
        '<thead><tr style="background:var(--bg4);font-size:11px;color:var(--text3)">' +
        '<th style="padding:6px 10px;text-align:left">Code</th><th style="padding:6px 10px">Plan</th>' +
        '<th style="padding:6px 10px">Durée</th><th style="padding:6px 10px">Utilisations</th>' +
        '</tr></thead><tbody>' +
        promos.map(function(p) {
          return '<tr style="border-bottom:1px solid var(--border2)">' +
            '<td style="padding:7px 10px;font-weight:700;font-family:monospace">' + esc(p.code) + '</td>' +
            '<td style="padding:7px 10px;text-align:center">' + esc(p.plan) + '</td>' +
            '<td style="padding:7px 10px;text-align:center">' + Math.round(p.duree_jours / 30) + ' mois</td>' +
            '<td style="padding:7px 10px;text-align:center">' + p.uses + '/' + p.max_uses + '</td>' +
            '</tr>';
        }).join('') + '</tbody></table>';
    }).catch(function() {
      modal.box.querySelector('#promo-liste').textContent = 'Erreur chargement';
    });

    // Créer code
    modal.box.querySelector('#promo-create-btn').addEventListener('click', async function() {
      var code = modal.box.querySelector('#promo-code').value.trim().toUpperCase();
      var plan = modal.box.querySelector('#promo-plan').value;
      var mois = parseInt(modal.box.querySelector('#promo-duree').value) || 1;
      var maxUses = parseInt(modal.box.querySelector('#promo-maxuses').value) || 1;
      if (!code) { window.IG.utils.showToast('Code requis', 'red'); return; }
      try {
        await _call('create_promo', { code, plan, duree_jours: mois * 30, max_uses: maxUses });
        window.IG.utils.showToast('Code créé : ' + code, 'green');
        modal.close();
      } catch(e) {
        window.IG.utils.showToast('Erreur: ' + e.message, 'red');
      }
    });
  }

  // ── Messages reçus par le owner ──────────────────────────────
  async function _chargerBadgeMessages() {
    try {
      var d = await _call('owner_messages');
      var nonLus = (d.messages || []).filter(function(m) {
        return !Array.isArray(m.lu_par) || !m.lu_par.includes('__OWNER__');
      }).length;
      var badge = document.getElementById('owner-msg-badge');
      if (badge) {
        badge.textContent = nonLus;
        badge.style.display = nonLus > 0 ? 'inline' : 'none';
      }
    } catch(_) {}
  }

  async function afficherMessages() {
    var zone = document.getElementById('owner-content');
    if (!zone) return;
    zone.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.4)">⏳ Chargement messages...</div>';
    try {
      var d = await _call('owner_messages');
      var msgs = d.messages || [];
      if (!msgs.length) {
        zone.innerHTML = '<div style="text-align:center;padding:60px;color:rgba(255,255,255,0.35);font-size:14px">📬 Aucun message reçu</div>';
        return;
      }
      var html = '<div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-size:15px;font-weight:700">📬 Messages reçus (' + msgs.length + ')</div>' +
        '<button onclick="window.IG.owner._refreshStats()" style="padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:transparent;color:#fff;cursor:pointer;font-size:12px">↩ Retour stats</button>' +
        '</div>';
      html += msgs.map(function(m) {
        var lu = Array.isArray(m.lu_par) && m.lu_par.includes('__OWNER__');
        var date = new Date(m.created_at).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
        return '<div style="background:rgba(255,255,255,' + (lu ? '0.04' : '0.08') + ');border:1px solid rgba(255,255,255,' + (lu ? '0.07' : '0.18') + ');border-radius:12px;padding:16px 18px;margin-bottom:10px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px">' +
          '<div>' +
          '<div style="font-size:13px;font-weight:700;color:#fff' + (lu ? '' : ';color:#63B3F7') + '">' + esc(m.sujet || '(sans sujet)') + (!lu ? ' <span style="font-size:10px;background:#E05A5A;color:#fff;padding:1px 6px;border-radius:99px">Nouveau</span>' : '') + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.45);margin-top:3px">De : <strong style="color:rgba(255,255,255,0.7)">' + esc(m.de_nom || '?') + '</strong> · ' + date + '</div>' +
          '</div>' +
          '</div>' +
          '<div style="font-size:13px;color:rgba(255,255,255,0.75);white-space:pre-wrap;line-height:1.6;margin-bottom:12px">' + esc(m.contenu || '') + '</div>' +
          '<div style="display:flex;gap:8px">' +
          '<button onclick="window.IG.owner._ouvrirReponse(' + m.id + ',\'' + esc(m.de_user_id) + '\',\'' + esc(m.de_nom) + '\',\'' + esc(m.tenant_id || '') + '\',\'' + esc(m.sujet || '') + '\')" ' +
            'style="padding:5px 14px;border-radius:7px;border:none;background:#0E6AAF;color:#fff;cursor:pointer;font-size:12px;font-weight:600">↩ Répondre</button>' +
          (!lu ? '<button onclick="window.IG.owner._marquerLuOwner(' + m.id + ')" style="padding:5px 14px;border-radius:7px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;font-size:12px">✓ Marquer lu</button>' : '') +
          '</div></div>';
      }).join('');
      zone.innerHTML = html;
    } catch(e) {
      zone.innerHTML = '<div style="color:#E05A5A;padding:20px">Erreur : ' + esc(e.message) + '</div>';
    }
  }

  async function _marquerLuOwner(msgId) {
    try {
      await _call('owner_mark_read', { msgId });
      afficherMessages();
      _chargerBadgeMessages();
    } catch(_) {}
  }

  function _ouvrirReponse(msgId, pourUserId, pourNom, tenantId, sujetOriginal) {
    var modal = window.IG.utils.showModal(
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:14px">↩ Répondre à ' + esc(pourNom) + '</h3>' +
      '<textarea id="owner-reply-txt" rows="5" placeholder="Votre réponse..." style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;box-sizing:border-box;resize:vertical"></textarea>' +
      '<div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="owner-reply-send" style="padding:8px 16px;border-radius:8px;border:none;background:#0E6AAF;color:#fff;cursor:pointer;font-size:13px;font-weight:600">Envoyer</button>' +
      '</div>', { width: '480px' }
    );
    modal.box.querySelector('#owner-reply-send').addEventListener('click', async function() {
      var txt = modal.box.querySelector('#owner-reply-txt').value.trim();
      if (!txt) return;
      try {
        await _call('owner_reply', { tenant_id: tenantId, pour_user_id: pourUserId, pour_nom: pourNom, sujet: sujetOriginal, contenu: txt });
        await _call('owner_mark_read', { msgId });
        window.IG.utils.showToast('Réponse envoyée ✓', 'green');
        modal.close();
        afficherMessages();
        _chargerBadgeMessages();
      } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
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

  return { renderLogin, renderDashboard, upgraderPlan, afficherPromos, afficherMessages, _marquerLuOwner, _ouvrirReponse, _refreshStats, checkAutoOpen };

})();
