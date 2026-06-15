// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Orchestrateur principal
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.app = (function() {

  var _currentPage = 'dashboard';
  var _currentImmeubleId = null;
  var _data = { immeubles: [], locataires: [], paiements: [] };

  function t(k) { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils ? window.IG.utils.esc(s) : s; }

  // ── Init ──────────────────────────────────────────────────────
  async function init() {
    // Panneau owner si URL ?owner=1
    if (window.IG.owner && window.IG.owner.checkAutoOpen()) return;

    var session = window.IG.auth.init();
    if (!session) {
      _renderLogin();
      return;
    }
    _showAppShell();
    await _loadData();
    showPage('dashboard');

    // Publicités plan gratuit
    if (window.IG.ads) window.IG.ads.init();
  }

  function _showAppShell() {
    var app = document.getElementById('app');
    if (!app) return;
    var session = window.IG.auth.getSession();

    app.innerHTML = '<div class="app-shell">' +
      // Sidebar
      '<nav class="sidebar" id="sidebar">' +
      '<div class="sidebar-logo">' +
      '<div class="logo-text">🏢 ImmoGest</div>' +
      '<div class="logo-sub">' + esc(session.nomCabinet || session.nom || '') + '</div>' +
      '</div>' +
      '<div class="sidebar-nav" id="sidebar-nav">' +
      _navSection(t('Principal')) +
      _navItem('dashboard', '📊', t('Tableau de bord')) +
      _navItem('immeubles', '🏢', t('Immeubles')) +
      _navItem('locataires', '👥', t('Locataires')) +
      _navItem('paiements', '💰', t('Paiements')) +
      _navSection(t('Gestion')) +
      _navItem('rapports', '📄', t('Rapports')) +
      _navItem('relances', '⚠️', t('Relances')) +
      _navItem('juridique', '⚖️', t('Juridique')) +
      _navSection(t('Réseau')) +
      _navItem('marketplace', '🌍', t('Marketplace')) +
      (session.role === 'locataire' ? _navItem('portail', '🏠', t('Mon espace')) : '') +
      _navSection(t('Administration')) +
      _navItem('parametres', '⚙️', t('Paramètres')) +
      '</div>' +
      '<div class="sidebar-footer">' +
      '<div id="sync-indicator" style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:6px">● Sync...</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.5)">ImmoGest v2.0</div>' +
      '</div></nav>' +
      // Main
      '<div class="main">' +
      '<div class="topbar">' +
      '<div><div class="topbar-title" id="topbar-title">' + t('Tableau de bord') + '</div>' +
      '<div class="topbar-sub" id="topbar-sub"></div></div>' +
      '<div class="topbar-actions">' +
      '<button onclick="window.IG.app.refresh()" title="' + t('Actualiser') + '" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:14px">↻</button>' +
      '<button onclick="window.IG.auth.logout()" title="' + t('Déconnexion') + '" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:14px">🚪</button>' +
      '</div></div>' +
      '<div id="page-content"></div>' +
      '</div></div>';

    // Lier navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(function(el) {
      el.addEventListener('click', function() {
        showPage(el.dataset.page);
      });
    });
  }

  function _navSection(label) {
    return '<div class="nav-section">' + label + '</div>';
  }

  function _navItem(page, icon, label) {
    return '<div class="nav-item" data-page="' + page + '">' +
      '<span class="nav-icon">' + icon + '</span>' +
      '<span>' + label + '</span>' +
      '</div>';
  }

  // ── Charger données ───────────────────────────────────────────
  async function _loadData() {
    _setSyncStatus('syncing');
    try {
      var result = await window.IG.db.loadAll();
      _data.immeubles  = result.immeubles  || [];
      _data.locataires = result.locataires || [];
      _data.paiements  = result.paiements  || [];
      _setSyncStatus('ok');
    } catch(e) {
      _setSyncStatus('error');
      // Fallback localStorage
      var s = window.IG.auth.getSession();
      if (s) {
        try { _data.immeubles  = JSON.parse(localStorage.getItem('immeubles_'  + s.tenantId) || '[]'); } catch(_) {}
        try { _data.locataires = JSON.parse(localStorage.getItem('locataires_' + s.tenantId) || '[]'); } catch(_) {}
        try { _data.paiements  = JSON.parse(localStorage.getItem('paiements_'  + s.tenantId) || '[]'); } catch(_) {}
      }
    }
  }

  function _setSyncStatus(status) {
    var el = document.getElementById('sync-indicator');
    if (!el) return;
    var map = {
      ok:      '● Synchronisé',
      syncing: '↻ Sync...',
      error:   '✗ Hors ligne'
    };
    el.textContent = map[status] || '';
    el.style.color = status === 'ok' ? 'rgba(61,186,120,0.9)' : status === 'error' ? 'rgba(224,90,90,0.9)' : 'rgba(255,255,255,0.5)';
  }

  async function refresh() {
    await _loadData();
    renderCurrentPage();
  }

  // ── Navigation ────────────────────────────────────────────────
  function showPage(page, opts) {
    _currentPage = page;
    opts = opts || {};

    document.querySelectorAll('.nav-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.page === page);
    });

    var content = document.getElementById('page-content');
    if (!content) return;

    var title = document.getElementById('topbar-title');
    var sub   = document.getElementById('topbar-sub');

    switch(page) {
      case 'dashboard':
        if (title) title.textContent = t('Tableau de bord');
        if (sub) sub.textContent = '';
        _renderDashboard(); break;
      case 'immeubles':
        if (title) title.textContent = t('Immeubles');
        if (sub) sub.textContent = _data.immeubles.length + ' ' + t('immeuble(s)');
        _renderImmeubles(); break;
      case 'locataires':
        _currentImmeubleId = opts.immeubleId || null;
        if (title) title.textContent = t('Locataires');
        var imm = _currentImmeubleId && window.IG.immeubles ? window.IG.immeubles.getById(_currentImmeubleId) : null;
        if (sub) sub.textContent = imm ? esc(imm.nom_immeuble || imm.nom) : _data.locataires.length + ' ' + t('locataire(s)');
        _renderLocataires(); break;
      case 'paiements':
        if (title) title.textContent = t('Paiements');
        if (sub) sub.textContent = '';
        _renderPaiements(); break;
      case 'rapports':
        if (title) title.textContent = t('Rapports');
        if (sub) sub.textContent = '';
        _renderRapports(); break;
      case 'relances':
        if (title) title.textContent = t('Relances');
        if (sub) sub.textContent = '';
        if (window.IG.relances) window.IG.relances.renderPage(_data.locataires, _data.paiements);
        else content.innerHTML = '<div class="content"><p style="color:var(--text3);padding:20px">Module relances non chargé.</p></div>';
        break;
      case 'juridique':
        if (title) title.textContent = t('Dossiers juridiques');
        if (sub) sub.textContent = '';
        if (window.IG.legal) window.IG.legal.renderPage();
        else content.innerHTML = '<div class="content"><p style="color:var(--text3);padding:20px">Module juridique non chargé.</p></div>';
        break;
      case 'marketplace':
        if (title) title.textContent = t('Marketplace');
        if (sub) sub.textContent = '';
        if (window.IG.marketplace) window.IG.marketplace.renderPage();
        else content.innerHTML = '<div class="content"><p style="color:var(--text3);padding:20px">Module marketplace non chargé.</p></div>';
        break;
      case 'portail':
        if (title) title.textContent = t('Mon espace');
        if (sub) sub.textContent = '';
        if (window.IG.portail) window.IG.portail.renderPage();
        else content.innerHTML = '<div class="content"><p style="color:var(--text3);padding:20px">Module portail non chargé.</p></div>';
        break;
      case 'parametres':
        if (title) title.textContent = t('Paramètres');
        if (sub) sub.textContent = '';
        _renderParametres(); break;
    }
  }

  function renderCurrentPage() { showPage(_currentPage); }

  // ── Sync caches modules ───────────────────────────────────────
  function _syncCaches() {
    if (window.IG.immeubles) {
      var c = window.IG.immeubles.getCache();
      c.splice(0); _data.immeubles.forEach(function(i) { c.push(i); });
    }
    if (window.IG.locataires) {
      var c2 = window.IG.locataires.getCache();
      c2.splice(0); _data.locataires.forEach(function(l) { c2.push(l); });
    }
    if (window.IG.paiements) {
      var c3 = window.IG.paiements.getCache();
      c3.splice(0); _data.paiements.forEach(function(p) { c3.push(p); });
    }
  }

  // ── Dashboard ─────────────────────────────────────────────────
  function _renderDashboard() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var stats = window.IG.paiements
      ? window.IG.paiements.calculerStats(_data.locataires, _data.paiements)
      : { actifs: 0, aJour: 0, impayes: 0, recetteMois: 0 };
    var session = window.IG.auth.getSession();
    var fmt = window.IG.utils.formatMontant;

    var html = '<div class="content">' +
      '<div style="margin-bottom:20px">' +
      '<h2 style="font-size:18px;font-weight:700;margin-bottom:4px">' + t('Bonjour') + ' ' + esc(session.nom || '') + ' 👋</h2>' +
      '<p style="color:var(--text3);font-size:13px">' + new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + '</p></div>' +
      '<div class="metrics-grid">' +
      _metric('🏢', _data.immeubles.length, t('Immeubles')) +
      _metric('👥', stats.actifs, t('Locataires actifs')) +
      _metric('✓', stats.aJour, t('À jour'), 'green') +
      _metric('⚠', stats.impayes, t('Impayés'), 'red') +
      _metric('💰', fmt(stats.recetteMois), t('Recettes mois'), 'blue') +
      '</div>' +
      '<div class="card" style="margin-bottom:20px">' +
      '<div class="card-header"><div class="card-title">⚡ ' + t('Actions rapides') + '</div></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
      _qbtn('🏢', t('Immeuble'), 'window.IG.immeubles.afficherFormulaire()') +
      _qbtn('👤', t('Locataire'), 'window.IG.locataires.afficherFormulaire()') +
      _qbtn('💵', t('Paiement'), 'window.IG.app.showPage(\'locataires\')') +
      _qbtn('📊', t('Rapport'), 'window.IG.rapports.afficherRapportMensuel()') +
      '</div></div>' +
      (stats.impayes > 0 ? _renderAlertesImpayes() : '') +
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">🏢 ' + t('Immeubles') + '</div>' +
      '<button onclick="window.IG.app.showPage(\'immeubles\')" style="font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer">' + t('Voir tout') + ' →</button></div>' +
      _renderImmeublesMini() + '</div></div>';
    content.innerHTML = html;
  }

  function _metric(icon, val, label, color) {
    var c = { green:'var(--green)', red:'var(--red)', blue:'var(--accent)' }[color] || 'var(--text)';
    return '<div class="metric-card"><div class="metric-label">' + icon + ' ' + label + '</div>' +
      '<div class="metric-value" style="color:' + c + '">' + val + '</div></div>';
  }

  function _qbtn(icon, label, onclick) {
    return '<button onclick="' + onclick + '" style="padding:10px 16px;border-radius:10px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px">' +
      icon + ' ' + label + '</button>';
  }

  function _renderAlertesImpayes() {
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();
    var impayes = _data.locataires.filter(function(loc) {
      if (loc.statut === 'libre') return false;
      var tot = _data.paiements
        .filter(function(p) { return p.locataire_id == loc.id && parseInt(p.mois) === mois && parseInt(p.annee) === annee; })
        .reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
      return tot < (parseFloat(loc.loyer) || 0);
    }).slice(0, 6);
    if (!impayes.length) return '';
    var html = '<div class="card" style="border-left:4px solid var(--red);margin-bottom:20px">' +
      '<div class="card-header"><div class="card-title" style="color:var(--red)">⚠️ ' + t('Impayés ce mois') + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">';
    impayes.forEach(function(loc) {
      var wa = window.IG.locataires ? window.IG.locataires.lienWA(loc, 'Bonjour ' + loc.nom + ', votre loyer est attendu ce mois. Merci. ImmoGest') : null;
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--red-bg);border-radius:8px">' +
        '<span style="font-size:13px;font-weight:600">' + esc(loc.nom) + (loc.appt ? ' — ' + esc(loc.appt) : '') + '</span>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
        (wa ? '<a href="' + wa + '" target="_blank" style="padding:4px 10px;border-radius:6px;background:#25D366;color:#fff;font-size:11px;font-weight:700;text-decoration:none">WhatsApp</a>' : '') +
        '<span style="font-size:12px;font-weight:700;color:var(--red)">' + window.IG.utils.formatMontant(loc.loyer) + '</span>' +
        '</div></div>';
    });
    html += '</div></div>';
    return html;
  }

  function _renderImmeublesMini() {
    if (!_data.immeubles.length) return '<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px">' + t('Aucun immeuble') + '</p>';
    var html = '<div style="display:flex;flex-direction:column;gap:8px">';
    _data.immeubles.forEach(function(imm) {
      var actifs = _data.locataires.filter(function(l) { return l.immeuble_id == imm.id && l.statut !== 'libre'; }).length;
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:var(--bg3);border-radius:8px;cursor:pointer" ' +
        'onclick="window.IG.app.showPage(\'locataires\',{immeubleId:' + imm.id + '})">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:' + esc(imm.couleur || '#0E6AAF') + ';display:inline-block"></span>' +
        '<span style="font-weight:600;font-size:13px">' + esc(imm.nom_immeuble || imm.nom) + '</span></div>' +
        '<span style="font-size:12px;color:var(--text3)">' + actifs + ' ' + t('actifs') + '</span></div>';
    });
    html += '</div>';
    return html;
  }

  // ── Immeubles ─────────────────────────────────────────────────
  function _renderImmeubles() {
    var content = document.getElementById('page-content');
    if (!content) return;
    _syncCaches();
    content.innerHTML = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">🏢 ' + t('Mes immeubles') + '</h2>' +
      '<button onclick="window.IG.immeubles.afficherFormulaire()" style="padding:9px 18px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ ' + t('Ajouter') + '</button>' +
      '</div><div id="immeubles-liste"></div></div>';
    if (window.IG.immeubles) window.IG.immeubles.renderListe(_data.locataires);
  }

  // ── Locataires ────────────────────────────────────────────────
  function _renderLocataires() {
    var content = document.getElementById('page-content');
    if (!content) return;
    _syncCaches();
    content.innerHTML = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<h2 style="font-size:17px;font-weight:700">👥 ' + t('Locataires') + '</h2>' +
      '<div style="display:flex;gap:8px">' +
      '<input id="loc-search" placeholder="' + t('Rechercher...') + '" oninput="window.IG.locataires.renderListe(window.IG.paiements.getCache())" ' +
        'style="padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;width:200px;color:var(--text)">' +
      '<button onclick="window.IG.locataires.afficherFormulaire()" style="padding:9px 16px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ ' + t('Ajouter') + '</button>' +
      '</div></div>' +
      '<div class="card" style="padding:0;overflow:hidden"><div id="locataires-liste" style="overflow-x:auto"></div></div></div>';
    if (window.IG.locataires) window.IG.locataires.renderListe(_data.paiements, _currentImmeubleId);
  }

  // ── Paiements ─────────────────────────────────────────────────
  function _renderPaiements() {
    var content = document.getElementById('page-content');
    if (!content) return;
    _syncCaches();
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();
    var paysMois = _data.paiements.filter(function(p) {
      return parseInt(p.mois) === mois && parseInt(p.annee) === annee;
    });
    var total = paysMois.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">💰 ' + t('Paiements') + ' — ' + window.IG.utils.nomMois(mois) + ' ' + annee + '</h2>' +
      '<div style="font-size:16px;font-weight:700;color:var(--green)">' + window.IG.utils.formatMontant(total) + '</div></div>' +
      '<div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:10px 14px;text-align:left">' + t('Locataire') + '</th>' +
      '<th style="padding:10px 14px;text-align:right">' + t('Montant') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">' + t('Mode') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">' + t('Date') + '</th>' +
      '<th style="padding:10px 14px;text-align:center">✕</th>' +
      '</tr></thead><tbody>';
    if (!paysMois.length) {
      html += '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text3)">' + t('Aucun paiement ce mois') + '</td></tr>';
    } else {
      paysMois.slice().reverse().forEach(function(p) {
        var loc = _data.locataires.find(function(l) { return l.id == p.locataire_id; });
        html += '<tr style="border-bottom:1px solid var(--border2)">' +
          '<td style="padding:10px 14px;font-weight:600">' + esc(loc ? loc.nom : '?') + '</td>' +
          '<td style="padding:10px 14px;text-align:right;font-weight:700;color:var(--green)">' + window.IG.utils.formatMontant(p.montant) + '</td>' +
          '<td style="padding:10px 14px;color:var(--text3)">' + esc(p.mode_paiement || 'espèces') + '</td>' +
          '<td style="padding:10px 14px;color:var(--text3)">' + window.IG.utils.formatDate(p.date_paiement) + '</td>' +
          '<td style="padding:10px 14px;text-align:center">' +
          '<button onclick="window.IG.paiements.annuler(' + p.id + ')" style="border:none;background:none;color:var(--red);cursor:pointer;font-size:18px;font-weight:700">×</button></td></tr>';
      });
    }
    html += '</tbody></table></div></div></div>';
    content.innerHTML = html;
  }

  // ── Rapports ──────────────────────────────────────────────────
  function _renderRapports() {
    var content = document.getElementById('page-content');
    if (!content) return;
    content.innerHTML = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">📊 ' + t('Rapports') + '</h2>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' +
      _rcard('📅', t('Rapport mensuel'), t('Encaissements et impayés du mois en cours'), 'window.IG.rapports.afficherRapportMensuel()') +
      '</div></div>';
  }

  function _rcard(icon, titre, desc, onclick) {
    return '<div class="card" style="cursor:pointer" onclick="' + onclick + '">' +
      '<div style="font-size:32px;margin-bottom:12px">' + icon + '</div>' +
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:6px">' + titre + '</h3>' +
      '<p style="font-size:12px;color:var(--text3)">' + desc + '</p></div>';
  }

  // ── Paramètres ────────────────────────────────────────────────
  function _renderParametres() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var session = window.IG.auth.getSession();
    content.innerHTML = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">⚙️ ' + t('Paramètres') + '</h2>' +
      '<div id="plans-bloc"></div>' +
      '<div class="card" style="margin-bottom:14px">' +
      '<div class="card-title" style="margin-bottom:14px">👤 ' + t('Mon compte') + '</div>' +
      '<div style="font-size:13px;display:flex;flex-direction:column;gap:10px">' +
      '<div><span style="color:var(--text3)">' + t('Nom') + ' :</span> <strong>' + esc(session.nom) + '</strong></div>' +
      '<div><span style="color:var(--text3)">' + t('Téléphone') + ' :</span> <strong>' + esc(session.telephone || '') + '</strong></div>' +
      '<div><span style="color:var(--text3)">' + t('Cabinet') + ' :</span> <strong>' + esc(session.nomCabinet || '—') + '</strong></div>' +
      '<div><span style="color:var(--text3)">' + t('Plan') + ' :</span> <span style="background:var(--accent);color:#fff;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700">' + (session.plan || 'gratuit').toUpperCase() + '</span></div>' +
      '</div></div>' +
      '<div class="card" style="margin-bottom:14px">' +
      '<div class="card-title" style="margin-bottom:10px">🌐 ' + t('Langue') + '</div>' +
      '<select onchange="window.IG.i18n.setLang(this.value);location.reload()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      [['fr','Français'],['en','English'],['pt','Português'],['es','Español'],['ha','Hausa'],['ar','العربية']].map(function(l) {
        return '<option value="' + l[0] + '"' + (window.IG.i18n.lang === l[0] ? ' selected' : '') + '>' + l[1] + '</option>';
      }).join('') + '</select></div>' +
      '<button onclick="window.IG.auth.logout()" style="padding:10px 20px;border-radius:10px;border:1px solid var(--red);color:var(--red);background:transparent;cursor:pointer;font-weight:600;font-size:13px">🚪 ' + t('Se déconnecter') + '</button>' +
      '</div>';
    if (window.IG.plans) window.IG.plans.renderBlocPlan('plans-bloc');
  }

  // ── Auth V1 — Multi-step wizard (design fidèle V1) ───────────
  function _renderLogin() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML =
      '<div id="auth-screen" style="position:fixed;inset:0;z-index:9999;min-height:100vh;font-family:\'Segoe UI\',system-ui,sans-serif;overflow:hidden;">' +
      // Slideshow background
      '<div id="auth-slides" style="position:absolute;inset:0;z-index:0;">' +
      '<div class="aslide" style="position:absolute;inset:0;opacity:1;transition:opacity 1.5s ease;background:url(\'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80\') center/cover no-repeat;"></div>' +
      '<div class="aslide" style="position:absolute;inset:0;opacity:0;transition:opacity 1.5s ease;background:url(\'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80\') center/cover no-repeat;"></div>' +
      '<div class="aslide" style="position:absolute;inset:0;opacity:0;transition:opacity 1.5s ease;background:url(\'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1400&q=80\') center/cover no-repeat;"></div>' +
      '</div>' +
      // Overlay sombre
      '<div style="position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,rgba(5,15,30,0.88) 0%,rgba(10,25,50,0.78) 50%,rgba(5,15,30,0.88) 100%);"></div>' +
      // Layout principal
      '<div id="auth-main-layout" style="position:relative;z-index:2;min-height:100vh;display:flex;align-items:center;justify-content:space-between;padding:40px 6%;">' +
      // Panneau gauche — branding
      '<div id="auth-branding" style="flex:1;max-width:500px;color:white;padding-right:60px;">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:20px;">Gestion Immobilière Professionnelle</div>' +
      '<h1 style="font-size:52px;font-weight:900;line-height:1.05;margin:0 0 20px;letter-spacing:-2px;">ImmoGest</h1>' +
      '<p style="font-size:16px;line-height:1.8;color:rgba(255,255,255,0.7);margin-bottom:40px;max-width:380px;">La plateforme complète de gestion immobilière.<br>Locataires, encaissements, rapports et bien plus.</p>' +
      '<div style="display:flex;gap:32px;">' +
      '<div><div style="font-size:26px;font-weight:800;color:#4f8ef7;">100%</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Intégré</div></div>' +
      '<div><div style="font-size:26px;font-weight:800;color:#4f8ef7;">100%</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Collaboratif</div></div>' +
      '<div><div style="font-size:26px;font-weight:800;color:#4f8ef7;">100%</div><div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px;">Intuitif</div></div>' +
      '</div></div>' +
      // Panneau droit — auth-form-box (design V1)
      '<div class="auth-form-box">' +

      // ── ÉTAPE 1 : Choix du mode ──
      '<div id="auth-step-1" class="auth-step active">' +
      '<div style="text-align:center;margin-bottom:28px;">' +
      '<div style="margin-bottom:10px;display:flex;justify-content:center;"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="28" height="24" rx="2" fill="rgba(79,142,247,0.15)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="8" y="4" width="20" height="6" rx="1" fill="rgba(79,142,247,0.2)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="9" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="16" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="23" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="9" y="21" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="16" y="21" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="23" y="21" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="14" y="27" width="8" height="5" rx="1" fill="#4f8ef7" opacity=".9"/></svg></div>' +
      '<div style="font-size:20px;font-weight:800;color:#e8f0fe;letter-spacing:-.5px;">ImmoGest</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.45);margin-top:5px;letter-spacing:1px;text-transform:uppercase;">Gestion Immobilière</div>' +
      '</div>' +
      '<div style="display:flex;gap:12px;margin-bottom:12px;">' +
      '<div class="auth-card-btn" style="border-radius:12px;" onclick="window.IG.app.authGoStep(\'2-perso\')">' +
      '<div style="margin-bottom:10px;display:flex;justify-content:center;"><svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="18" cy="11" r="6" fill="rgba(79,142,247,0.15)" stroke="#4f8ef7" stroke-width="1.5"/><path d="M6 30c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#4f8ef7" stroke-width="1.5" stroke-linecap="round" fill="rgba(79,142,247,0.1)"/></svg></div>' +
      '<div style="font-weight:700;font-size:13px;color:#e8f0fe;">Mode Personnel</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.5);margin-top:4px;line-height:1.4;">Propriétaires &amp; Locataires</div>' +
      '</div>' +
      '<div class="auth-card-btn" style="border-radius:12px;" onclick="window.IG.app.authGoStep(\'2-ent\')">' +
      '<div style="margin-bottom:10px;display:flex;justify-content:center;"><svg width="26" height="26" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="28" height="24" rx="2" fill="rgba(79,142,247,0.15)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="8" y="4" width="20" height="6" rx="1" fill="rgba(79,142,247,0.2)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="9" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="16" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="23" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="9" y="21" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="23" y="21" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="14" y="27" width="8" height="5" rx="1" fill="#4f8ef7" opacity=".9"/></svg></div>' +
      '<div style="font-weight:700;font-size:13px;color:#e8f0fe;">Mode Entreprise</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.5);margin-top:4px;line-height:1.4;">Équipe &amp; Cabinet</div>' +
      '</div></div>' +
      '<div style="text-align:center;margin-top:16px;">' +
      '<button onclick="window.IG.app.authGoStep(\'register\')" style="background:none;border:none;color:rgba(232,240,254,0.35);font-size:11px;cursor:pointer;font-family:inherit;letter-spacing:.5px;">+ Créer un nouvel espace</button>' +
      '</div>' +
      '<div style="text-align:center;margin-top:10px;font-size:10px;color:rgba(232,240,254,0.2);letter-spacing:1px;">ImmoGest v2.0</div>' +
      '</div>' +

      // ── ÉTAPE 2A : Mode Personnel — choix rôle ──
      '<div id="auth-step-2-perso" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'1\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="font-size:11px;font-weight:700;color:#4fa2f7;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Mode Personnel</div>' +
      '<div style="font-size:12px;color:rgba(200,223,248,0.45);">Vous êtes...</div>' +
      '</div>' +
      '<div style="margin-bottom:10px;">' +
      '<div class="auth-card-btn" style="display:flex;align-items:center;gap:14px;text-align:left;padding:16px 18px;" onclick="window.IG.app.authGoStep(\'3-admin\')">' +
      '<svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="flex-shrink:0;"><circle cx="16" cy="10" r="5" fill="rgba(79,162,247,0.2)" stroke="#4fa2f7" stroke-width="1.5"/><path d="M16 6 L17.5 9.5 L21 10 L18.5 12.5 L19 16 L16 14.5 L13 16 L13.5 12.5 L11 10 L14.5 9.5 Z" fill="#4fa2f7" opacity=".7"/><path d="M6 28 C6 22 10 18 16 18 C22 18 26 22 26 28" stroke="#4fa2f7" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' +
      '<div><div style="font-weight:700;font-size:13px;color:#e8f4ff;">Administrateur</div><div style="font-size:11px;color:rgba(200,223,248,0.45);margin-top:2px;">Accès complet — gestion de tout</div></div>' +
      '</div></div>' +
      '<div style="display:flex;gap:10px;">' +
      '<div class="auth-card-btn" style="border-radius:10px;" onclick="window.IG.app.authGoStep(\'3-proprio\')">' +
      '<div style="margin-bottom:8px;display:flex;justify-content:center;"><svg width="30" height="30" viewBox="0 0 32 32" fill="none"><path d="M4 14L16 4l12 10v14a2 2 0 01-2 2H6a2 2 0 01-2-2V14z" fill="rgba(79,162,247,0.15)" stroke="#4fa2f7" stroke-width="1.5"/><rect x="12" y="20" width="8" height="10" rx="1" fill="#4fa2f7" opacity=".6"/></svg></div>' +
      '<div style="font-weight:700;font-size:12px;color:#e8f4ff;">Propriétaire</div>' +
      '<div style="font-size:10px;color:rgba(200,223,248,0.45);margin-top:3px;">Gérez vos biens</div>' +
      '</div>' +
      '<div class="auth-card-btn" style="border-radius:10px;" onclick="window.IG.app.authGoStep(\'3-locataire\')">' +
      '<div style="margin-bottom:8px;display:flex;justify-content:center;"><svg width="30" height="30" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="10" r="6" fill="rgba(79,162,247,0.15)" stroke="#4fa2f7" stroke-width="1.5"/><path d="M4 30c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#4fa2f7" stroke-width="1.5" fill="none"/></svg></div>' +
      '<div style="font-weight:700;font-size:12px;color:#e8f4ff;">Locataire</div>' +
      '<div style="font-size:10px;color:rgba(200,223,248,0.45);margin-top:3px;">Votre espace</div>' +
      '</div></div>' +
      '</div>' +

      // ── ÉTAPE 3 : Admin / Propriétaire ──
      '<div id="auth-step-3-admin" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'2-perso\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<svg width="40" height="40" viewBox="0 0 32 32" fill="none" style="display:block;margin:0 auto 10px;"><circle cx="16" cy="10" r="5" fill="rgba(79,162,247,0.2)" stroke="#4fa2f7" stroke-width="1.5"/><path d="M16 6 L17.5 9.5 L21 10 L18.5 12.5 L19 16 L16 14.5 L13 16 L13.5 12.5 L11 10 L14.5 9.5 Z" fill="#4fa2f7" opacity=".8"/><path d="M6 28 C6 22 10 18 16 18 C22 18 26 22 26 28" stroke="#4fa2f7" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>' +
      '<div style="font-size:16px;font-weight:800;color:#e8f4ff;">Administrateur</div>' +
      '<div style="font-size:11px;color:rgba(200,223,248,0.4);margin-top:3px;text-transform:uppercase;letter-spacing:.5px;">Mode Personnel</div>' +
      '</div>' +
      '<label class="auth-label">NUMÉRO DE TÉLÉPHONE</label>' +
      '<input type="tel" id="admin-tel" class="auth-input" placeholder="Ex: 699 00 00 00" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'admin-pwd\').focus()">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="admin-pwd" class="auth-input" placeholder="Mot de passe" style="margin-bottom:16px;" onkeydown="if(event.key===\'Enter\')window.IG.app.loginAdminV2()">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.loginAdminV2()">Accéder</button>' +
      '<div id="err-admin" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '<div style="text-align:center;margin-top:10px;font-size:11px;color:rgba(200,223,248,0.35);">Mot de passe par défaut : <strong style="color:rgba(200,223,248,0.6);">immo2024</strong></div>' +
      '</div>' +

      // ── ÉTAPE 3B : Propriétaire ──
      '<div id="auth-step-3-proprio" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'2-perso\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<div style="margin-bottom:8px;display:flex;justify-content:center;"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M4 14L16 4l12 10v14a2 2 0 01-2 2H6a2 2 0 01-2-2V14z" fill="rgba(79,162,247,0.15)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="12" y="20" width="8" height="10" rx="1" fill="#4f8ef7" opacity=".6"/></svg></div>' +
      '<div style="font-size:16px;font-weight:800;color:#e8f0fe;">Espace Propriétaire</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.45);margin-top:4px;letter-spacing:.5px;">MODE PERSONNEL</div>' +
      '</div>' +
      '<label class="auth-label">NUMÉRO DE TÉLÉPHONE</label>' +
      '<input type="tel" id="proprio-tel" class="auth-input" placeholder="Ex: 699 00 00 00" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'proprio-pwd\').focus()">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="proprio-pwd" class="auth-input" placeholder="Mot de passe" style="margin-bottom:16px;" onkeydown="if(event.key===\'Enter\')window.IG.app.loginAdminV2(\'proprio\')">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.loginAdminV2(\'proprio\')">Accéder à mon espace</button>' +
      '<div id="err-proprio" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '</div>' +

      // ── ÉTAPE 3C : Locataire ──
      '<div id="auth-step-3-locataire" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'2-perso\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<div style="margin-bottom:8px;display:flex;justify-content:center;"><svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M4 14L16 4l12 10v14a2 2 0 01-2 2H6a2 2 0 01-2-2V14z" fill="rgba(79,162,247,0.15)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="12" y="20" width="8" height="10" rx="1" fill="#4f8ef7" opacity=".6"/><rect x="8" y="16" width="5" height="5" rx="1" fill="#4f8ef7" opacity=".5"/><rect x="19" y="16" width="5" height="5" rx="1" fill="#4f8ef7" opacity=".5"/></svg></div>' +
      '<div style="font-size:16px;font-weight:800;color:#e8f0fe;">Espace Locataire</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.45);margin-top:4px;letter-spacing:.5px;">NUMÉRO + CODE PIN</div>' +
      '</div>' +
      '<label class="auth-label">NUMÉRO DE TÉLÉPHONE</label>' +
      '<input type="tel" id="loc-tel-login" class="auth-input" placeholder="Ex: 699 00 00 00" style="margin-bottom:16px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'loc-pin1\').focus()">' +
      '<label class="auth-label">CODE PIN</label>' +
      '<div class="pin-row">' +
      '<input type="password" id="loc-pin1" class="pin-box" maxlength="1" oninput="if(this.value)document.getElementById(\'loc-pin2\').focus()">' +
      '<input type="password" id="loc-pin2" class="pin-box" maxlength="1" oninput="if(this.value)document.getElementById(\'loc-pin3\').focus()">' +
      '<input type="password" id="loc-pin3" class="pin-box" maxlength="1" oninput="if(this.value)document.getElementById(\'loc-pin4\').focus()">' +
      '<input type="password" id="loc-pin4" class="pin-box" maxlength="1" onkeydown="if(event.key===\'Enter\')window.IG.app.loginLocataireV2()">' +
      '</div>' +
      '<button class="auth-btn-primary" onclick="window.IG.app.loginLocataireV2()">Accéder à mon espace</button>' +
      '<div id="err-locataire" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '<div style="text-align:center;margin-top:10px;font-size:11px;color:rgba(200,223,248,0.35);">PIN par défaut : <strong style="color:rgba(200,223,248,0.6);">1234</strong></div>' +
      '</div>' +

      // ── ÉTAPE 2B : Mode Entreprise ──
      '<div id="auth-step-2-ent" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'1\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<div style="margin-bottom:8px;display:flex;justify-content:center;"><svg width="26" height="26" viewBox="0 0 36 36" fill="none"><rect x="4" y="8" width="28" height="24" rx="2" fill="rgba(79,142,247,0.15)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="8" y="4" width="20" height="6" rx="1" fill="rgba(79,142,247,0.2)" stroke="#4f8ef7" stroke-width="1.5"/><rect x="9" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="16" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/><rect x="23" y="14" width="4" height="4" rx="1" fill="#4f8ef7" opacity=".7"/></svg></div>' +
      '<div style="font-size:16px;font-weight:800;color:#e8f0fe;">Mode Entreprise</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.45);margin-top:4px;letter-spacing:.5px;">ACCÈS PROFESSIONNEL</div>' +
      '</div>' +
      '<label class="auth-label">RÔLE</label>' +
      '<select id="role-selector" class="auth-input" style="margin-bottom:12px;cursor:pointer;" onchange="window.IG.app._onRoleChange(this.value)">' +
      '<option value="admin">👑 Administrateur</option>' +
      '<option value="gestionnaire">🏘️ Gestionnaire</option>' +
      '<option value="comptable">📊 Comptable</option>' +
      '<option value="agent">🤝 Agent</option>' +
      '<option value="locataire">🔑 Locataire</option>' +
      '</select>' +
      '<div id="creds-section-new">' +
      '<label class="auth-label">TÉLÉPHONE / IDENTIFIANT</label>' +
      '<input type="text" id="ent-username" class="auth-input" placeholder="Ex: 699 00 00 00" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'ent-password\').focus()">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="ent-password" class="auth-input" placeholder="Mot de passe" style="margin-bottom:16px;" onkeydown="if(event.key===\'Enter\')window.IG.app.loginEntrepriseV2()">' +
      '</div>' +
      '<div id="pin-section-new" style="display:none;">' +
      '<label class="auth-label">NUMÉRO DE TÉLÉPHONE</label>' +
      '<input type="tel" id="loc-tel-login-ent" class="auth-input" placeholder="Ex: 699 00 00 00" style="margin-bottom:12px;">' +
      '<label class="auth-label">CODE PIN</label>' +
      '<div class="pin-row">' +
      '<input type="password" id="pin1" class="pin-box" maxlength="1" oninput="if(this.value)document.getElementById(\'pin2\').focus()">' +
      '<input type="password" id="pin2" class="pin-box" maxlength="1" oninput="if(this.value)document.getElementById(\'pin3\').focus()">' +
      '<input type="password" id="pin3" class="pin-box" maxlength="1" oninput="if(this.value)document.getElementById(\'pin4\').focus()">' +
      '<input type="password" id="pin4" class="pin-box" maxlength="1" onkeydown="if(event.key===\'Enter\')window.IG.app.loginEntrepriseV2()">' +
      '</div></div>' +
      '<button class="auth-btn-primary" onclick="window.IG.app.loginEntrepriseV2()">Se connecter</button>' +
      '<div id="err-entreprise" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '</div>' +

      // ── ÉTAPE : Créer un espace ──
      '<div id="auth-step-register" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'1\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<div style="font-size:16px;font-weight:800;color:#e8f4ff;">Créer mon espace</div>' +
      '<div style="font-size:11px;color:rgba(200,223,248,0.4);margin-top:3px;text-transform:uppercase;letter-spacing:.5px;">Nouvel espace ImmoGest</div>' +
      '</div>' +
      '<label class="auth-label">VOTRE NOM</label>' +
      '<input type="text" id="reg-nom" class="auth-input" placeholder="Nom complet" style="margin-bottom:12px;">' +
      '<label class="auth-label">NOM DU CABINET (optionnel)</label>' +
      '<input type="text" id="reg-cabinet" class="auth-input" placeholder="Mon Cabinet Immobilier" style="margin-bottom:12px;">' +
      '<label class="auth-label">TÉLÉPHONE</label>' +
      '<input type="tel" id="reg-tel" class="auth-input" placeholder="6XXXXXXXX" style="margin-bottom:12px;">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="reg-pwd" class="auth-input" placeholder="Min. 6 caractères" style="margin-bottom:16px;">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.registerV2()">🚀 Créer mon espace</button>' +
      '<div id="err-register" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '</div>' +

      '</div>' + // fin auth-form-box
      '</div>' + // fin auth-main-layout
      '</div>';  // fin auth-screen

    // Démarrer le slideshow
    var slides = document.querySelectorAll('.aslide');
    if (slides.length > 1) {
      var idx = 0;
      setInterval(function() {
        slides[idx].style.opacity = '0';
        idx = (idx + 1) % slides.length;
        slides[idx].style.opacity = '1';
      }, 4000);
    }
  }

  // Navigation entre étapes
  function authGoStep(step) {
    document.querySelectorAll('.auth-step').forEach(function(el) {
      el.classList.remove('active');
    });
    var target = document.getElementById('auth-step-' + step);
    if (target) target.classList.add('active');
    if (step === '2-ent') {
      var pinSec = document.getElementById('pin-section-new');
      var credSec = document.getElementById('creds-section-new');
      if (pinSec) pinSec.style.display = 'none';
      if (credSec) credSec.style.display = 'block';
    }
  }

  // Bascule PIN/credentials selon rôle sélectionné
  function _onRoleChange(role) {
    var pinSec = document.getElementById('pin-section-new');
    var credSec = document.getElementById('creds-section-new');
    if (!pinSec || !credSec) return;
    if (role === 'locataire') {
      pinSec.style.display = 'block';
      credSec.style.display = 'none';
    } else {
      pinSec.style.display = 'none';
      credSec.style.display = 'block';
    }
  }

  // Login admin / propriétaire (mode personnel)
  async function loginAdminV2(type) {
    var telId = type === 'proprio' ? 'proprio-tel' : 'admin-tel';
    var pwdId = type === 'proprio' ? 'proprio-pwd' : 'admin-pwd';
    var errId = type === 'proprio' ? 'err-proprio' : 'err-admin';
    var telEl = document.getElementById(telId);
    var pwdEl = document.getElementById(pwdId);
    var errEl = document.getElementById(errId);
    if (!telEl || !pwdEl) return;
    var btn = document.querySelector('#auth-step-3-' + (type||'admin') + ' .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Accéder';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    try {
      await window.IG.auth.login(telEl.value.trim(), pwdEl.value);
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }
  }

  // Login mode Entreprise
  async function loginEntrepriseV2() {
    var role = (document.getElementById('role-selector') || {}).value || 'admin';
    var errEl = document.getElementById('err-entreprise');
    var btn = document.querySelector('#auth-step-2-ent .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Se connecter';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    try {
      if (role === 'locataire') {
        // PIN login
        var tel = (document.getElementById('loc-tel-login-ent') || {}).value || '';
        var pin = ['pin1','pin2','pin3','pin4'].map(function(id) {
          return (document.getElementById(id) || {}).value || '';
        }).join('');
        await window.IG.auth.login(tel.trim(), pin);
      } else {
        var username = (document.getElementById('ent-username') || {}).value || '';
        var pwd = (document.getElementById('ent-password') || {}).value || '';
        await window.IG.auth.login(username.trim(), pwd);
      }
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }
  }

  // Login locataire (PIN)
  async function loginLocataireV2() {
    var tel = (document.getElementById('loc-tel-login') || {}).value || '';
    var pin = ['loc-pin1','loc-pin2','loc-pin3','loc-pin4'].map(function(id) {
      return (document.getElementById(id) || {}).value || '';
    }).join('');
    var errEl = document.getElementById('err-locataire');
    var btn = document.querySelector('#auth-step-3-locataire .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Accéder à mon espace';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    if (!tel.trim()) {
      if (errEl) { errEl.textContent = 'Veuillez entrer votre numéro de téléphone'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      return;
    }
    if (pin.length < 4) {
      if (errEl) { errEl.textContent = 'Veuillez entrer votre code PIN (4 chiffres)'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      return;
    }
    try {
      await window.IG.auth.login(tel.trim(), pin);
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message || 'Numéro ou PIN incorrect'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      ['loc-pin1','loc-pin2','loc-pin3','loc-pin4'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
    }
  }

  // Création d'un espace
  async function registerV2() {
    var nom = (document.getElementById('reg-nom') || {}).value || '';
    var cabinet = (document.getElementById('reg-cabinet') || {}).value || '';
    var tel = (document.getElementById('reg-tel') || {}).value || '';
    var pwd = (document.getElementById('reg-pwd') || {}).value || '';
    var errEl = document.getElementById('err-register');
    var btn = document.querySelector('#auth-step-register .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Créer mon espace';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    try {
      await window.IG.auth.register(nom, tel.trim(), pwd, cabinet);
      await window.IG.auth.login(tel.trim(), pwd);
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }
  }

  function _loginMode(mode) {
    if (mode === 'marketplace') { if(window.IG.app) window.IG.app.showPage('marketplace'); return; }
    authGoStep(mode === 'register' ? 'register' : mode === 'join' ? '2-ent' : '2-ent');
  }

  function _swTab(tab, btn) {}

  function _dinput() { return ''; }
  function _ainput() { return ''; }

  async function _doJoin(e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var btn = e.target.querySelector('button[type=submit]');
    var err = e.target.querySelector('.auth-err');
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    try {
      await window.IG.auth.join(fd.get('code'), fd.get('nom'), fd.get('password'));
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (err) { err.textContent = ex.message; err.style.display = 'block'; }
      if (btn) { btn.textContent = '🔗 ' + t('Rejoindre'); btn.disabled = false; }
    }
  }

  async function _doLogin(e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var btn = e.target.querySelector('button[type=submit]');
    var err = e.target.querySelector('.auth-err');
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    try {
      await window.IG.auth.login(fd.get('telephone'), fd.get('password'));
      _showAppShell();
      await _loadData();
      showPage('dashboard');
    } catch(ex) {
      if (err) { err.textContent = ex.message; err.style.display = 'block'; }
      if (btn) { btn.textContent = '🔐 ' + t('Se connecter'); btn.disabled = false; }
    }
  }

  async function _doRegister(e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var btn = e.target.querySelector('button[type=submit]');
    var err = e.target.querySelector('.auth-err');
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    try {
      await window.IG.auth.register(fd.get('nom'), fd.get('telephone'), fd.get('password'), fd.get('nomCabinet'));
      await window.IG.auth.login(fd.get('telephone'), fd.get('password'));
      _showAppShell();
      await _loadData();
      showPage('dashboard');
    } catch(ex) {
      if (err) { err.textContent = ex.message; err.style.display = 'block'; }
      if (btn) { btn.textContent = '🚀 ' + t('Créer mon compte'); btn.disabled = false; }
    }
  }

  return {
    init, showPage, refresh, renderCurrentPage,
    _swTab, _doLogin, _doRegister, _doJoin,
    _loginMode, _renderLogin,
    authGoStep, loginAdminV2, loginEntrepriseV2, loginLocataireV2, registerV2,
    _onRoleChange,
    getData: function() { return _data; }
  };

})();
