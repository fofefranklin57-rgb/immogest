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
    var session = window.IG.auth.init();
    if (!session) {
      _renderLogin();
      return;
    }
    _showAppShell();
    await _loadData();
    showPage('dashboard');
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
  }

  // ── Login ─────────────────────────────────────────────────────
  function _renderLogin() {
    var app = document.getElementById('app');
    if (!app) return;
    app.innerHTML = '<div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:20px;' +
      'background:#C8DFF5;background-image:radial-gradient(ellipse 80% 60% at 10% 0%,rgba(99,179,247,0.45) 0%,transparent 60%),' +
      'radial-gradient(ellipse 60% 50% at 90% 10%,rgba(139,92,246,0.22) 0%,transparent 55%)">' +
      '<div style="background:rgba(255,255,255,0.82);border-radius:20px;padding:36px 32px;width:100%;max-width:400px;' +
      'box-shadow:0 20px 60px rgba(14,106,175,0.18);backdrop-filter:blur(16px)">' +
      '<div style="text-align:center;margin-bottom:28px">' +
      '<div style="font-size:42px;margin-bottom:8px">🏢</div>' +
      '<h1 style="font-size:22px;font-weight:700;color:#0E6AAF;margin-bottom:4px">ImmoGest</h1>' +
      '<p style="color:#3D5270;font-size:13px">Gestion immobilière intelligente</p></div>' +
      '<div style="display:flex;background:rgba(14,106,175,0.08);border-radius:10px;padding:4px;margin-bottom:24px">' +
      '<button id="tab-login" onclick="window.IG.app._swTab(\'login\',this)" style="flex:1;padding:8px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#0E6AAF;box-shadow:0 2px 8px rgba(0,0,0,.08)">' + t('Connexion') + '</button>' +
      '<button id="tab-reg" onclick="window.IG.app._swTab(\'register\',this)" style="flex:1;padding:8px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#3D5270">' + t('Créer un compte') + '</button>' +
      '</div><div id="auth-form">' + _loginForm() + '</div>' +
      '<p style="text-align:center;font-size:11px;color:#7A90A8;margin-top:20px">ImmoGest v2.0 — Cabinet CRAA</p>' +
      '</div></div>';
  }

  function _loginForm() {
    return '<form onsubmit="window.IG.app._doLogin(event)">' +
      _ainput('telephone', t('Téléphone'), 'tel', '6XXXXXXXX', true) +
      _ainput('password', t('Mot de passe'), 'password', '••••••••', true) +
      '<button type="submit" style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#0E6AAF,#0D7FC4);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px">🔐 ' + t('Se connecter') + '</button>' +
      '<p class="auth-err" style="color:#B93020;font-size:12px;text-align:center;margin-top:10px;display:none"></p></form>';
  }

  function _registerForm() {
    return '<form onsubmit="window.IG.app._doRegister(event)">' +
      _ainput('nom', t('Votre nom complet'), 'text', 'Jean Dupont', true) +
      _ainput('nomCabinet', t('Nom du cabinet (optionnel)'), 'text', 'Cabinet Immobilier...', false) +
      _ainput('telephone', t('Téléphone'), 'tel', '6XXXXXXXX', true) +
      _ainput('password', t('Mot de passe'), 'password', 'Min. 6 caractères', true) +
      '<button type="submit" style="width:100%;padding:13px;border-radius:12px;border:none;background:linear-gradient(135deg,#0E7A45,#0A5A35);color:#fff;font-size:15px;font-weight:700;cursor:pointer;margin-top:4px">🚀 ' + t('Créer mon compte') + '</button>' +
      '<p class="auth-err" style="color:#B93020;font-size:12px;text-align:center;margin-top:10px;display:none"></p></form>';
  }

  function _ainput(name, label, type, ph, req) {
    return '<div style="margin-bottom:14px"><label style="font-size:12px;font-weight:600;color:#3D5270;display:block;margin-bottom:5px">' + label + '</label>' +
      '<input name="' + name + '" type="' + type + '" placeholder="' + ph + '"' + (req ? ' required' : '') +
      ' style="width:100%;padding:11px 14px;border-radius:10px;border:1px solid rgba(79,142,247,0.25);background:rgba(232,240,252,0.75);font-size:14px;color:#0F172A"></div>';
  }

  function _swTab(tab, btn) {
    var other = tab === 'login' ? document.getElementById('tab-reg') : document.getElementById('tab-login');
    btn.style.cssText = 'flex:1;padding:8px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:#fff;color:#0E6AAF;box-shadow:0 2px 8px rgba(0,0,0,.08)';
    if (other) other.style.cssText = 'flex:1;padding:8px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:#3D5270';
    var f = document.getElementById('auth-form');
    if (f) f.innerHTML = tab === 'login' ? _loginForm() : _registerForm();
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
    _swTab, _doLogin, _doRegister,
    getData: function() { return _data; }
  };

})();
