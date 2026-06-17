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
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();

    app.innerHTML = '<div class="app-shell">' +
      // Sidebar
      '<nav class="sidebar" id="sidebar">' +
      // Bouton collapse
      '<button class="sidebar-collapse-btn" onclick="window.IG.app.toggleSidebar()" title="Réduire">' +
      '<span>☰</span><span class="sidebar-collapse-label">ImmoGest</span>' +
      '</button>' +
      '<div class="sidebar-logo">' +
      '<div class="logo-text">🏢 ImmoGest</div>' +
      '<div class="logo-sub">' + esc(session.nomCabinet || session.nom || '') + '</div>' +
      '</div>' +
      '<div class="sidebar-nav" id="sidebar-nav">' +
      _navSection(t('Principal')) +
      _navItem('dashboard', '📊', t('Tableau de bord')) +
      _navSectionToggle('immeubles', t('Immeubles')) +
      '<div id="sb-body-immeubles" class="nav-section-body">' +
      _navItem('immeubles', '🏢', t('Tous les immeubles')) +
      '<div id="sidebar-immeubles-list"></div>' +
      '</div>' +
      _navSectionToggle('gestion', t('Gestion')) +
      '<div id="sb-body-gestion" class="nav-section-body">' +
      _navItem('locataires', '👥', t('Locataires')) +
      _navItem('paiements', '💰', t('Encaissements')) +
      _navItem('relances', '⚠️', t('Relances'), true) +
      _navItem('rapports', '📄', t('Rapports')) +
      _navItem('rapport-annuel', '📅', t('Rapport annuel')) +
      _navItem('statistiques', '📈', t('Statistiques')) +
      _navItem('juridique', '⚖️', t('Juridique')) +
      '</div>' +
      _navSection(t('Réseau')) +
      _navItem('marketplace', '🌍', t('Marketplace')) +
      (session.role !== 'locataire' ? _navItem('leads', '📬', t('Leads')) : '') +
      (session.role === 'locataire' ? _navItem('portail', '🏠', t('Mon espace')) : '') +
      _navSection(t('Interne')) +
      (session.role === 'admin' || session.role === 'gestionnaire' ? _navItem('declarations', '📨', t('Déclarations')) : '') +
      _navItem('messages', '💬', t('Messages')) +
      _navItem('signatures', '✍️', t('Signatures')) +
      _navItem('parametres', '⚙️', t('Paramètres')) +
      '</div>' +
      '<div class="sidebar-footer">' +
      '<div id="sidebar-user-info" style="font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:3px;font-size:12px">' + esc(session.nom || '') + '</div>' +
      '<div id="sync-indicator" style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px">● Sync...</div>' +
      (session.role !== 'locataire' ? '<div onclick="window.IG.app.showPage(\'portail\')" class="sidebar-footer-btn sidebar-footer-btn-green"><span>🏢</span><span>' + t('Portail Propriétaire') + '</span></div>' : '') +
      '<div onclick="window.IG.app.showPage(\'archives\')" class="sidebar-footer-btn"><span>🗄️ ' + t('Archives') + '</span></div>' +
      '<div onclick="window.IG.app.showPage(\'corbeille\')" class="sidebar-footer-btn" style="margin-bottom:8px"><span>🗑️ ' + t('Corbeille') + '</span><span id="badge-corbeille" class="nav-badge" style="display:none">0</span></div>' +
      '<button onclick="window.IG.auth.logout()" style="width:100%;padding:8px;border-radius:7px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:6px">⏻ Se déconnecter</button>' +
      '</div></nav>' +
      // Overlay mobile
      '<div id="sidebar-overlay" onclick="window.IG.app.closeSidebar()" style="display:none;position:fixed;inset:0;z-index:199;background:rgba(0,0,0,0.4)"></div>' +
      // Main
      '<div class="main">' +
      '<div class="topbar">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
      '<button id="btn-hamburger" onclick="window.IG.app.toggleSidebar()" style="padding:6px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:16px;color:var(--text2)">☰</button>' +
      '<div><div class="topbar-title" id="topbar-title">' + t('Tableau de bord') + '</div>' +
      '<div class="topbar-sub" id="topbar-sub"></div></div>' +
      '</div>' +
      '<div class="topbar-actions">' +
      '<select id="sel-mois" onchange="window.IG.app.refresh()" style="background:var(--bg4);border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:12px;padding:6px 10px;font-family:var(--font);">' +
      Array.from({length:12}, function(_,i) { return '<option value="' + (i+1) + '"' + ((i+1) === mois ? ' selected' : '') + '>' + ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][i] + '</option>'; }).join('') +
      '</select>' +
      '<select id="sel-annee" onchange="window.IG.app.refresh()" style="background:var(--bg4);border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:12px;padding:6px 10px;font-family:var(--font);">' +
      [2024,2025,2026,2027].map(function(y) { return '<option value="' + y + '"' + (y === annee ? ' selected' : '') + '>' + y + '</option>'; }).join('') +
      '</select>' +
      '<button class="btn btn-primary btn-sm" id="topbar-main-btn" onclick="window.IG.app.topbarAction()">＋ Nouveau</button>' +
      '</div></div>' +
      // Bottom nav mobile
      '<nav id="mobile-bottom-nav" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:500;background:var(--bg2);border-top:1.5px solid var(--border);box-shadow:0 -2px 12px rgba(0,0,0,.08);">' +
      '<div style="display:flex;justify-content:space-around;align-items:center;padding:6px 0 8px;">' +
      _mbnBtn('dashboard','⊞','Accueil') + _mbnBtn('paiements','💰','Caisse') +
      _mbnBtn('locataires','👤','Locataires') + _mbnBtn('rapports','📊','Rapports') +
      '<button onclick="window.IG.app.toggleSidebar()" style="flex:1;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;font-family:var(--font);color:var(--text3);font-size:10px;font-weight:600;"><span style="font-size:20px">☰</span><span>Menu</span></button>' +
      '</div></nav>' +
      '<div id="page-content" style="padding-bottom:72px"></div>' +
      '</div></div>';

    // Lier navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(function(el) {
      el.addEventListener('click', function() {
        showPage(el.dataset.page);
        // Fermer sidebar sur mobile
        if (window.innerWidth <= 768) closeSidebar();
      });
    });

    // Bottom nav mobile
    _showMobileNav();
    window.addEventListener('resize', _showMobileNav);
  }

  function _mbnBtn(page, icon, label) {
    return '<button id="mbn-' + page + '" onclick="window.IG.app.showPage(\'' + page + '\')" style="flex:1;background:none;border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;font-family:var(--font);color:var(--text3);font-size:10px;font-weight:600;"><span style="font-size:20px">' + icon + '</span><span>' + label + '</span></button>';
  }

  function topbarAction() {
    var p = _currentPage;
    if (p === 'locataires') { if (window.IG.locataires) window.IG.locataires.afficherFormulaire(); }
    else if (p === 'paiements') { if (window.IG.paiements) window.IG.paiements.afficherFormulaire(); }
    else if (p === 'immeubles') { if (window.IG.immeubles) window.IG.immeubles.afficherFormulaire(); }
    else if (p === 'rapport-annuel') { if (window.IG.rapports) window.IG.rapports.afficherRapportAnnuel(); }
    else { showPage('locataires'); }
  }

  // Afficher / masquer la bottom nav selon la largeur
  function _showMobileNav() {
    var nav = document.getElementById('mobile-bottom-nav');
    if (nav) nav.style.display = window.innerWidth <= 768 ? 'block' : 'none';
  }

  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    if (window.innerWidth <= 768) {
      var isOpen = sidebar.classList.contains('open');
      sidebar.classList.toggle('open', !isOpen);
      if (overlay) overlay.style.display = isOpen ? 'none' : 'block';
    } else {
      sidebar.classList.toggle('collapsed');
    }
  }

  function closeSidebar() {
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
  }

  function _updateSidebarImmeubles() {
    var container = document.getElementById('sidebar-immeubles-list');
    if (!container || !_data.immeubles.length) return;
    var html = '';
    _data.immeubles.slice(0, 8).forEach(function(imm) {
      var actifs = _data.locataires.filter(function(l) { return l.immeuble_id == imm.id && l.statut !== 'libre'; }).length;
      html += '<div class="nav-item nav-imm-item" style="padding-left:24px;font-size:12px" onclick="window.IG.app.showPage(\'locataires\',{immeubleId:' + imm.id + '})">' +
        '<span class="imm-dot" style="background:' + esc(imm.couleur || '#0E6AAF') + '"></span>' +
        '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(imm.nom_immeuble || imm.nom) + '</span>' +
        '<span style="font-size:10px;color:rgba(255,255,255,0.5)">' + actifs + '</span>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function _updateRelancesBadge() {
    var badge = document.getElementById('relances-badge');
    if (!badge) return;
    var nb = 0;
    _data.locataires.filter(function(l) { return l.statut !== 'libre'; }).forEach(function(loc) {
      var pays = _data.paiements.filter(function(p) { return p.locataire_id == loc.id; });
      var ret = window.IG.relances ? window.IG.relances.calculerRetard(loc, pays) : 0;
      if (ret > 0) nb++;
    });
    badge.textContent = nb > 0 ? nb : '';
    badge.style.display = nb > 0 ? 'inline-block' : 'none';
  }

  async function _updateCorbeilleBadge() {
    try {
      var items = await window.IG.db.select('corbeille');
      var badge = document.getElementById('badge-corbeille');
      if (!badge) return;
      var nb = (items || []).length;
      badge.textContent = nb;
      badge.style.display = nb > 0 ? 'inline-block' : 'none';
    } catch(_) {}
  }

  function _navSection(label) {
    return '<div class="nav-section">' + label + '</div>';
  }

  function _navSectionToggle(id, label) {
    return '<div class="nav-section nav-section-toggle" onclick="window.IG.app.toggleSidebarSection(\'' + id + '\')">' +
      label + '<span class="nav-section-icon" id="sb-icon-' + id + '">▸</span></div>';
  }

  function toggleSidebarSection(id) {
    var body = document.getElementById('sb-body-' + id);
    var icon = document.getElementById('sb-icon-' + id);
    if (!body) return;
    var open = body.classList.toggle('open');
    if (icon) icon.textContent = open ? '▾' : '▸';
  }

  function _navItem(page, icon, label, hasBadge) {
    return '<div class="nav-item" data-page="' + page + '">' +
      '<span class="nav-icon">' + icon + '</span>' +
      '<span>' + label + '</span>' +
      (hasBadge ? '<span class="nav-badge" id="relances-badge" style="display:none">0</span>' : '') +
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
      _updateSidebarImmeubles();
      _updateRelancesBadge();
      _updateCorbeilleBadge();
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
      case 'leads':
        if (title) title.textContent = 'Leads & Contacts';
        if (sub) sub.textContent = '';
        _renderLeads(); break;
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
      case 'statistiques':
        if (title) title.textContent = t('Statistiques');
        if (sub) sub.textContent = '';
        _renderStatistiques(); break;
      case 'rapport-annuel':
        if (title) title.textContent = t('Rapport annuel');
        if (sub) sub.textContent = '';
        if (window.IG.rapports) window.IG.rapports.afficherRapportAnnuel();
        break;
      case 'archives':
        if (title) title.textContent = t('Archives');
        if (sub) sub.textContent = '';
        _renderArchives(); break;
      case 'corbeille':
        if (title) title.textContent = t('Corbeille');
        if (sub) sub.textContent = '';
        _renderCorbeille(); break;
      case 'declarations':
        if (title) title.textContent = t('Déclarations');
        if (sub) sub.textContent = '';
        _renderDeclarations(); break;
      case 'messages':
        if (title) title.textContent = t('Messages internes');
        if (sub) sub.textContent = '';
        _renderMessages(); break;
      case 'signatures':
        if (title) title.textContent = t('Vérifier un document');
        if (sub) sub.textContent = '';
        if (window.IG.signature) window.IG.signature.renderVerification();
        break;
    }
    // Mettre à jour bottom nav
    document.querySelectorAll('[id^="mbn-"]').forEach(function(b) {
      b.style.color = b.id === 'mbn-' + page ? 'var(--accent)' : 'var(--text3)';
    });
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
    // Déléguer au module dashboard.js (KPIs avancés + graphe mensuel)
    if (window.IG.dashboard) {
      _syncCaches();
      window.IG.dashboard.render(_data);
    } else {
      // Fallback minimal si module non chargé
      var content = document.getElementById('page-content');
      if (!content) return;
      var stats = window.IG.paiements
        ? window.IG.paiements.calculerStats(_data.locataires, _data.paiements)
        : { actifs: 0, aJour: 0, impayes: 0, recetteMois: 0 };
      content.innerHTML = '<div class="content"><div class="metrics-grid">' +
        '<div class="metric-card"><div class="metric-label">🏢 Immeubles</div><div class="metric-value">' + _data.immeubles.length + '</div></div>' +
        '<div class="metric-card"><div class="metric-label">👥 Locataires actifs</div><div class="metric-value">' + stats.actifs + '</div></div>' +
        '<div class="metric-card"><div class="metric-label">✓ À jour</div><div class="metric-value" style="color:var(--green)">' + stats.aJour + '</div></div>' +
        '<div class="metric-card"><div class="metric-label">⚠ Impayés</div><div class="metric-value" style="color:var(--red)">' + stats.impayes + '</div></div>' +
        '</div></div>';
    }
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
    var fmt = window.IG.utils.formatMontant;

    // Sélecteur mois/année/immeuble
    var immOptions = '<option value="">Tous les immeubles</option>' +
      _data.immeubles.map(function(i) {
        return '<option value="' + i.id + '">' + esc(i.nom_immeuble || i.nom) + '</option>';
      }).join('');

    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px">' +
      '<h2 style="font-size:17px;font-weight:700">💰 ' + t('Encaissements') + '</h2>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<select id="pay-mois" onchange="window.IG.app._refreshPaiements()" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      Array.from({length:12}, function(_,i) {
        var m = i+1;
        return '<option value="' + m + '"' + (m === mois ? ' selected' : '') + '>' + window.IG.utils.nomMois(m) + '</option>';
      }).join('') +
      '</select>' +
      '<input id="pay-annee" type="number" value="' + annee + '" min="2020" max="2035" onchange="window.IG.app._refreshPaiements()" ' +
        'style="width:80px;padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<select id="pay-imm" onchange="window.IG.app._refreshPaiements()" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      immOptions + '</select>' +
      '<input id="pay-search" type="text" placeholder="Rechercher..." oninput="window.IG.app._refreshPaiements()" ' +
        'style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);width:160px">' +
      '</div></div>' +
      '<div id="pay-total-bar" style="margin-bottom:12px"></div>' +
      '<div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table id="pay-table" style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:10px 14px;text-align:left">' + t('Locataire') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">Immeuble</th>' +
      '<th style="padding:10px 14px;text-align:left">Local</th>' +
      '<th style="padding:10px 14px;text-align:right">' + t('Montant') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">' + t('Mode') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">' + t('Date') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">Type</th>' +
      '<th style="padding:10px 14px;text-align:center">✕</th>' +
      '</tr></thead><tbody id="pay-tbody"></tbody></table></div></div></div>';

    content.innerHTML = html;
    _refreshPaiements();
  }

  function _refreshPaiements() {
    var mois   = parseInt((document.getElementById('pay-mois')   || {}).value  || (new Date().getMonth()+1));
    var annee  = parseInt((document.getElementById('pay-annee')  || {}).value  || new Date().getFullYear());
    var immId  = (document.getElementById('pay-imm')    || {}).value  || '';
    var q      = ((document.getElementById('pay-search') || {}).value || '').toLowerCase();
    var fmt    = window.IG.utils.formatMontant;

    var liste = _data.paiements.filter(function(p) {
      if (parseInt(p.mois) !== mois || parseInt(p.annee) !== annee) return false;
      if (immId) {
        var loc = _data.locataires.find(function(l) { return l.id == p.locataire_id; });
        if (!loc || String(loc.immeuble_id) !== String(immId)) return false;
      }
      if (q) {
        var loc2 = _data.locataires.find(function(l) { return l.id == p.locataire_id; });
        var nom = loc2 ? (loc2.nom || '').toLowerCase() : '';
        if (!nom.includes(q)) return false;
      }
      return true;
    }).slice().reverse();

    var total = liste.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    var totalBar = document.getElementById('pay-total-bar');
    if (totalBar) {
      totalBar.innerHTML = '<div class="card" style="padding:12px 18px;display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-size:13px;color:var(--text2)">' + liste.length + ' paiement(s) — ' + window.IG.utils.nomMois(mois) + ' ' + annee + '</span>' +
        '<span style="font-size:18px;font-weight:700;color:var(--green)">' + fmt(total) + '</span>' +
        '</div>';
    }

    var tbody = document.getElementById('pay-tbody');
    if (!tbody) return;
    if (!liste.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text3)">Aucun paiement pour cette période</td></tr>';
      return;
    }
    tbody.innerHTML = liste.map(function(p) {
      var loc = _data.locataires.find(function(l) { return l.id == p.locataire_id; });
      var imm = loc ? (window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null) : null;
      return '<tr style="border-bottom:1px solid var(--border2)">' +
        '<td style="padding:10px 14px;font-weight:600">' + esc(loc ? loc.nom : '?') + '</td>' +
        '<td style="padding:10px 14px;color:var(--text3);font-size:12px">' + esc(imm ? (imm.nom_immeuble || imm.nom) : '—') + '</td>' +
        '<td style="padding:10px 14px;color:var(--text3);font-size:12px">' + esc(loc ? (loc.appt || '—') : '—') + '</td>' +
        '<td style="padding:10px 14px;text-align:right;font-weight:700;color:var(--green)">' + fmt(p.montant) + '</td>' +
        '<td style="padding:10px 14px;color:var(--text3)">' + esc(p.mode_paiement || 'espèces') + '</td>' +
        '<td style="padding:10px 14px;color:var(--text3)">' + window.IG.utils.formatDate(p.date_paiement) + '</td>' +
        '<td style="padding:10px 14px;color:var(--text3);font-size:11px">' + esc(p.type || 'loyer') + '</td>' +
        '<td style="padding:10px 14px;text-align:center">' +
        '<button onclick="window.IG.paiements.annuler(' + p.id + ')" style="border:none;background:none;color:var(--red);cursor:pointer;font-size:18px;font-weight:700">×</button></td></tr>';
    }).join('');
  }

  // ── Rapports ──────────────────────────────────────────────────
  function _renderRapports() {
    var content = document.getElementById('page-content');
    if (!content) return;
    content.innerHTML = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">📊 ' + t('Rapports') + '</h2>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px">' +
      _rcard('📅', t('Rapport mensuel'), t('Encaissements et impayés du mois — export DOCX'), 'window.IG.rapports.afficherRapportMensuel()') +
      _rcard('📆', t('Rapport annuel'), t('Synthèse de l\'année en cours par immeuble'), 'window.IG.rapports.afficherRapportAnnuel()') +
      _rcard('⚠️', t('Rapport relances'), t('Liste complète des impayés et retards'), 'window.IG.rapports.afficherRapportRelances()') +
      _rcard('🏢', t('État des lieux'), t('Occupation et vacance par immeuble'), 'window.IG.rapports.afficherEtatLieux()') +
      '</div></div>';
  }

  function _rcard(icon, titre, desc, onclick) {
    return '<div class="card" style="cursor:pointer;transition:transform .15s" onmouseenter="this.style.transform=\'translateY(-2px)\'" onmouseleave="this.style.transform=\'\'" onclick="' + onclick + '">' +
      '<div style="font-size:32px;margin-bottom:12px">' + icon + '</div>' +
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:6px">' + titre + '</h3>' +
      '<p style="font-size:12px;color:var(--text3)">' + desc + '</p>' +
      '<div style="margin-top:14px;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--accent);font-weight:600">Générer →</div></div>';
  }

  // ── Paramètres ────────────────────────────────────────────────
  function _renderParametres() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var session = window.IG.auth.getSession();
    var planColor = { gratuit: '#888', starter: '#0E6AAF', pro: '#0E7A45', cabinet: '#7B2FBE' }[session.plan || 'gratuit'] || '#888';

    var html = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">⚙️ ' + t('Paramètres') + '</h2>' +

      // Bloc plan
      '<div id="plans-bloc" style="margin-bottom:14px"></div>' +

      // Mon compte
      '<div class="card" style="margin-bottom:14px">' +
      '<div class="card-header"><div class="card-title">👤 Mon compte</div></div>' +
      '<div style="font-size:13px;display:flex;flex-direction:column;gap:12px;padding-top:4px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span style="color:var(--text3)">Nom</span><strong>' + esc(session.nom) + '</strong></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span style="color:var(--text3)">Téléphone</span><strong>' + esc(session.telephone || '—') + '</strong></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span style="color:var(--text3)">Cabinet</span><strong>' + esc(session.nomCabinet || '—') + '</strong></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<span style="color:var(--text3)">Plan</span>' +
      '<span style="background:' + planColor + ';color:#fff;padding:3px 12px;border-radius:99px;font-size:11px;font-weight:700">' + (session.plan || 'GRATUIT').toUpperCase() + '</span></div>' +
      (session.planExpire ? '<div style="display:flex;justify-content:space-between"><span style="color:var(--text3)">Expire</span><span>' + new Date(session.planExpire).toLocaleDateString('fr-FR') + '</span></div>' : '') +
      '</div></div>' +

      // Équipe / Invitations
      (session.role === 'admin' ? (
        '<div class="card" style="margin-bottom:14px">' +
        '<div class="card-header"><div class="card-title">👥 Équipe & Invitations</div>' +
        '<button onclick="window.IG.app._genererInvitation()" style="padding:6px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">＋ Inviter</button>' +
        '</div>' +
        '<div id="equipe-body"><div style="text-align:center;padding:20px"><div class="spinner" style="margin:0 auto"></div></div></div>' +
        '</div>'
      ) : '') +

      // Code promo
      '<div class="card" style="margin-bottom:14px">' +
      '<div class="card-header"><div class="card-title">🎟️ Code promotionnel</div></div>' +
      '<div style="display:flex;gap:8px;margin-top:4px">' +
      '<input id="promo-input" type="text" placeholder="Entrer votre code promo" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px">' +
      '<button onclick="window.IG.app._appliquerPromo()" style="padding:8px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Appliquer</button>' +
      '</div><div id="promo-msg" style="margin-top:8px;font-size:12px"></div></div>' +

      // Langue
      '<div class="card" style="margin-bottom:14px">' +
      '<div class="card-header"><div class="card-title">🌐 Langue</div></div>' +
      '<select onchange="window.IG.i18n.setLang(this.value);location.reload()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      [['fr','Français'],['en','English'],['pt','Português'],['es','Español'],['ha','Hausa'],['ar','العربية']].map(function(l) {
        return '<option value="' + l[0] + '"' + (window.IG.i18n && window.IG.i18n.lang === l[0] ? ' selected' : '') + '>' + l[1] + '</option>';
      }).join('') + '</select></div>' +

      // Publication Marketplace
      '<div class="card" id="card-publication" style="margin-bottom:14px">' +
      '<div class="card-header"><div class="card-title">🏠 Publication Marketplace</div></div>' +
      '<div style="font-size:13px;color:var(--text3);margin-bottom:12px">Quand un local est libéré, ImmoGest crée automatiquement une pré-annonce.</div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">Mode de publication</label>' +
      '<select id="select-mode-publication" onchange="window.IG.app._sauvegarderModePublication(this.value)" style="padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);width:100%">' +
      '<option value="manuel">📝 Manuel — le gestionnaire valide avant publication</option>' +
      '<option value="auto">⚡ Automatique — publié immédiatement à la libération</option>' +
      '<option value="proprio">👤 Validation propriétaire — notification envoyée au proprio</option>' +
      '</select></div>' +
      '<div id="mode-publication-saved" style="font-size:11px;color:var(--green);display:none">✓ Sauvegardé</div>' +
      '</div>' +

      // Déconnexion
      '<button onclick="window.IG.auth.logout()" style="padding:10px 20px;border-radius:10px;border:1px solid var(--red);color:var(--red);background:transparent;cursor:pointer;font-weight:600;font-size:13px;display:block;margin-bottom:30px">🚪 Se déconnecter</button>' +
      '</div>';

    content.innerHTML = html;
    if (window.IG.plans) window.IG.plans.renderBlocPlan('plans-bloc');
    if (session.role === 'admin') _chargerEquipe();
    _chargerModePublication();
  }

  async function _chargerModePublication() {
    var sel = document.getElementById('select-mode-publication');
    if (!sel) return;
    try {
      var params = await window.IG.db.select('parametres');
      var settings = (params && params[0] && params[0].settings) || {};
      sel.value = settings.mode_publication || 'manuel';
    } catch(_) {}
  }

  async function _sauvegarderModePublication(mode) {
    try {
      var params = await window.IG.db.select('parametres');
      var row = params && params[0];
      var settings = (row && row.settings) || {};
      settings.mode_publication = mode;
      if (row) {
        await window.IG.db.update('parametres', row.id, { settings });
      } else {
        var session = window.IG.auth.getSession();
        await window.IG.db.insert('parametres', [{ tenant_id: session.tenantId, settings }]);
      }
      var msg = document.getElementById('mode-publication-saved');
      if (msg) { msg.style.display = 'block'; setTimeout(function() { msg.style.display = 'none'; }, 2000); }
    } catch(e) {
      window.IG.utils.showToast('Erreur sauvegarde : ' + e.message, 'red');
    }
  }

  async function _chargerEquipe() {
    var el = document.getElementById('equipe-body');
    if (!el) return;
    try {
      var users = await window.IG.db.select('users_app');
      if (!users || !users.length) { el.innerHTML = '<p style="color:var(--text3);font-size:13px;text-align:center;padding:16px">Aucun collaborateur</p>'; return; }
      var ROLE_ICONS = { admin:'👑', gestionnaire:'🏘️', comptable:'📊', agent:'🤝', locataire:'🔑' };
      var rows = users.map(function(u) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border2)">' +
          '<div><div style="font-weight:600;font-size:13px">' + (ROLE_ICONS[u.role] || '👤') + ' ' + esc(u.nom || u.id) + '</div>' +
          '<div style="font-size:11px;color:var(--text3)">' + esc(u.role || '') + (u.actif === false ? ' · <span style="color:var(--red)">Désactivé</span>' : '') + '</div></div>' +
          (u.role !== 'admin' ? '<button onclick="window.IG.app._toggleUser(\'' + u.id + '\',' + (u.actif !== false) + ')" style="padding:4px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:11px">' + (u.actif !== false ? 'Désactiver' : 'Réactiver') + '</button>' : '') +
          '</div>';
      }).join('');
      el.innerHTML = '<div style="padding:4px 0">' + rows + '</div>';
    } catch(e) {
      el.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:16px">' + e.message + '</p>';
    }
  }

  async function _genererInvitation() {
    var session = window.IG.auth.getSession();
    var ROLES = ['gestionnaire','comptable','agent','locataire'];
    var html = '<h3 style="font-size:16px;margin-bottom:16px">👥 Inviter un collaborateur</h3>' +
      '<label style="font-size:12px;color:var(--text3);display:block;margin-bottom:6px">RÔLE</label>' +
      '<select id="inv-role" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);margin-bottom:16px">' +
      ROLES.map(function(r) { return '<option value="' + r + '">' + r.charAt(0).toUpperCase() + r.slice(1) + '</option>'; }).join('') + '</select>' +
      '<button id="btn-gen-inv" style="width:100%;padding:10px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Générer le code</button>' +
      '<div id="inv-result" style="margin-top:16px"></div>' +
      '<div style="text-align:right;margin-top:16px"><button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Fermer</button></div>';

    var modal = window.IG.utils.showModal(html, { width: '400px' });
    modal.box.querySelector('#btn-gen-inv').addEventListener('click', async function() {
      var btn = this;
      var role = modal.box.querySelector('#inv-role').value;
      btn.textContent = '⏳...'; btn.disabled = true;
      try {
        var workerUrl = (window.IG.config && window.IG.config.workerUrl) || 'https://immogest1.fofefranklin57.workers.dev';
        var res = await fetch(workerUrl + '/generate-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: session.tenantId, role: role })
        });
        var data = await res.json();
        if (!data.success) throw new Error(data.error || 'Erreur');
        modal.box.querySelector('#inv-result').innerHTML =
          '<div style="background:var(--bg3);border-radius:10px;padding:16px;text-align:center">' +
          '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">CODE D\'INVITATION</div>' +
          '<div style="font-size:28px;font-weight:900;letter-spacing:4px;color:var(--accent)">' + esc(data.code) + '</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:8px">Rôle : ' + role + ' · Valable 48h</div>' +
          '<button onclick="navigator.clipboard.writeText(\'' + esc(data.code) + '\');window.IG.utils.showToast(\'Code copié ✓\',\'green\')" style="margin-top:10px;padding:6px 16px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px">📋 Copier</button>' +
          '</div>';
        btn.textContent = '✓ Généré'; btn.disabled = false;
      } catch(ex) {
        modal.box.querySelector('#inv-result').innerHTML = '<div style="color:var(--red);font-size:13px">' + ex.message + '</div>';
        btn.textContent = 'Générer le code'; btn.disabled = false;
      }
    });
  }

  async function _toggleUser(userId, currentlyActive) {
    try {
      await window.IG.db.update('users_app', userId, { actif: !currentlyActive });
      window.IG.utils.showToast('Utilisateur ' + (currentlyActive ? 'désactivé' : 'réactivé') + ' ✓', 'green');
      _chargerEquipe();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
  }

  async function _appliquerPromo() {
    var input = document.getElementById('promo-input');
    var msg = document.getElementById('promo-msg');
    if (!input || !input.value.trim()) { if (msg) msg.textContent = 'Entrez un code'; return; }
    var session = window.IG.auth.getSession();
    try {
      var workerUrl = (window.IG.config && window.IG.config.workerUrl) || 'https://immogest1.fofefranklin57.workers.dev';
      var res = await fetch(workerUrl + '/apply-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: input.value.trim(), tenantId: session.tenantId })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.error || 'Code invalide');
      if (msg) { msg.style.color = 'var(--green)'; msg.textContent = '✓ Plan ' + data.plan + ' activé pour ' + data.duree_jours + ' jours !'; }
      window.IG.utils.showToast('Code promo appliqué ✓', 'green');
      if (input) input.value = '';
    } catch(e) {
      if (msg) { msg.style.color = 'var(--red)'; msg.textContent = e.message; }
    }
  }

  // ── Leads marketplace ────────────────────────────────────────
  async function _renderLeads() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var WORKER = window.APP_CONFIG ? window.APP_CONFIG.API_URL : window.IG.config.workerUrl;
    var session = JSON.parse(localStorage.getItem('ig_session_v2') || '{}');
    content.innerHTML = '<div class="content"><div class="skeleton" style="height:200px;border-radius:12px"></div></div>';
    try {
      var r = await fetch(WORKER + '/leads-gestionnaire', { headers: { 'Authorization': 'Bearer ' + session.token } });
      var leads = r.ok ? await r.json() : [];
      var TYPES = { whatsapp:'📱 WhatsApp', telephone:'📞 Téléphone', visite:'🏠 Visite', information:'👁️ Vue', message:'✉️ Message', partage:'🔗 Partage' };
      var STATUTS = { nouveau:'🔵 Nouveau', contacte:'🟡 Contacté', visite_planifiee:'🟠 Visite planifiée', converti:'🟢 Converti', perdu:'🔴 Perdu' };
      var rows = leads.map(function(l) {
        return '<tr style="border-bottom:1px solid var(--border)">' +
          '<td style="padding:10px 8px;font-size:13px">' + (TYPES[l.type] || l.type) + '</td>' +
          '<td style="padding:10px 8px;font-size:12px;color:var(--text2)">' + (l.annonce_titre || '#' + l.annonce_id) + '</td>' +
          '<td style="padding:10px 8px;font-size:12px">' + (l.nom || '—') + '</td>' +
          '<td style="padding:10px 8px;font-size:12px">' + (l.telephone ? '<a href="tel:' + l.telephone + '" style="color:#3b82f6">' + l.telephone + '</a>' : '—') + '</td>' +
          '<td style="padding:10px 8px;font-size:12px">' + (STATUTS[l.statut] || l.statut) + '</td>' +
          '<td style="padding:10px 8px;font-size:11px;color:var(--text3)">' + new Date(l.created_at).toLocaleDateString('fr-FR') + '</td>' +
        '</tr>';
      }).join('');
      content.innerHTML = '<div class="content">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">' +
        '<h2 style="font-size:16px;font-weight:700">Leads & Contacts <span style="font-size:13px;font-weight:400;color:var(--text3)">' + leads.length + ' total</span></h2>' +
        '</div>' +
        (leads.length ? '<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border)"><table style="width:100%;border-collapse:collapse">' +
        '<thead><tr style="background:var(--surface2)">' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">TYPE</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">ANNONCE</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">NOM</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">TÉLÉPHONE</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">STATUT</th>' +
        '<th style="padding:10px 8px;text-align:left;font-size:11px;color:var(--text3);font-weight:600">DATE</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' :
        '<div style="text-align:center;padding:60px 20px;color:var(--text3)"><div style="font-size:48px;margin-bottom:12px">📭</div><p>Aucun lead pour le moment.<br>Ils apparaîtront dès que des visiteurs interagiront avec vos annonces.</p></div>') +
        '</div>';
    } catch(e) {
      content.innerHTML = '<div class="content"><p style="color:var(--danger)">Erreur de chargement des leads.</p></div>';
    }
  }

  // ── Statistiques ─────────────────────────────────────────────
  function _renderStatistiques() {
    var content = document.getElementById('page-content');
    if (!content) return;
    if (window.IG.dashboard) {
      // Réutiliser les KPIs du dashboard avec graphes étendus
      window.IG.dashboard.render(_data);
    }
    var kpis = window.IG.dashboard ? window.IG.dashboard.calculerKPIs(_data.locataires, _data.paiements) : {};
    var fmt = window.IG.utils.formatMontant;
    var html = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">📈 ' + t('Statistiques') + '</h2>' +
      '<div class="metrics-grid" style="margin-bottom:20px">' +
      '<div class="metric-card"><div class="metric-label">👥 Locataires actifs</div><div class="metric-value">' + (kpis.actifs||0) + '</div><div class="metric-sub">' + (kpis.libres||0) + ' locaux libres</div></div>' +
      '<div class="metric-card"><div class="metric-label">💰 Loyer théorique/mois</div><div class="metric-value accent" style="font-size:17px">' + fmt(kpis.loyerTheorique||0) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">✅ Encaissé ce mois</div><div class="metric-value green" style="font-size:17px">' + fmt(kpis.recetteMois||0) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">⚠️ Total impayés cumulés</div><div class="metric-value red" style="font-size:17px">' + fmt(kpis.totalDu||0) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">📈 Taux recouvrement</div><div class="metric-value" style="color:' + ((kpis.txRecouvrement||0)>=80?'var(--green)':'var(--red)') + '">' + (kpis.txRecouvrement||0) + '%</div></div>' +
      '<div class="metric-card"><div class="metric-label">📅 Recette annuelle</div><div class="metric-value accent" style="font-size:16px">' + fmt(kpis.recetteAnnuelle||0) + '</div></div>' +
      '</div>' +
      '<div class="card"><div class="card-header"><div class="card-title">📊 Recettes mensuelles</div></div>' +
      '<div style="padding-top:8px">' + (window.IG.dashboard ? window.IG.dashboard.renderGrapheMensuel(kpis.recettesParMois||{}, kpis.loyerTheorique||0) : '') + '</div></div>' +
      '</div>';
    content.innerHTML = html;
  }

  // ── Archives ─────────────────────────────────────────────────
  function _renderArchives() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var fmt = window.IG.utils.formatMontant;
    var html = '<div class="content"><h2 style="font-size:17px;font-weight:700;margin-bottom:20px">🗄️ Archives</h2>';
    // Charger archives depuis DB
    if (window.IG.db) {
      window.IG.db.select('archives').then(function(archives) {
        if (!archives || !archives.length) {
          document.getElementById('archives-body').innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">🗄️</div><p>Aucune archive</p></div>';
          return;
        }
        var rows = archives.map(function(a) {
          return '<tr style="border-bottom:1px solid var(--border2)">' +
            '<td style="padding:9px 12px">' + esc(a.nom || '—') + '</td>' +
            '<td style="padding:9px 12px;color:var(--text3)">' + esc(a.immeuble_nom || '—') + '</td>' +
            '<td style="padding:9px 12px;color:var(--text3)">' + esc(a.local_num || '—') + '</td>' +
            '<td style="padding:9px 12px">' + fmt(a.loyer || 0) + '</td>' +
            '<td style="padding:9px 12px;color:var(--text3)">' + esc(a.date_sortie || '—') + '</td>' +
            '<td style="padding:9px 12px;font-size:11px;color:var(--text3)">' + esc(a.motif || '—') + '</td>' +
            '</tr>';
        }).join('');
        document.getElementById('archives-body').innerHTML = '<div class="card" style="padding:0;overflow:hidden"><div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)"><th style="padding:9px 12px;text-align:left">Nom</th><th style="padding:9px 12px;text-align:left">Immeuble</th><th style="padding:9px 12px;text-align:left">Local</th><th style="padding:9px 12px;text-align:left">Loyer</th><th style="padding:9px 12px;text-align:left">Sortie</th><th style="padding:9px 12px;text-align:left">Motif</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
      }).catch(function() {
        document.getElementById('archives-body').innerHTML = '<div class="alert alert-yellow">Impossible de charger les archives hors connexion.</div>';
      });
    }
    html += '<div id="archives-body"><div class="card" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div></div></div>';
    content.innerHTML = html;
  }

  // ── Corbeille ─────────────────────────────────────────────────
  function _renderCorbeille() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var html = '<div class="content"><h2 style="font-size:17px;font-weight:700;margin-bottom:20px">🗑️ Corbeille</h2>';
    if (window.IG.db) {
      window.IG.db.select('corbeille').then(function(items) {
        if (!items || !items.length) {
          document.getElementById('corbeille-body').innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">🗑️</div><p>La corbeille est vide</p></div>';
          return;
        }
        var rows = items.map(function(item) {
          var d = item.locataire_data || {};
          return '<div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">' +
            '<div><strong>' + esc(d.nom || '—') + '</strong>' +
            '<div style="font-size:12px;color:var(--text3)">' + esc(d.appt || '') + ' — ' + window.IG.utils.formatMontant(d.loyer || 0) + '</div></div>' +
            '<button onclick="window.IG.app._restaurer(' + item.id + ')" style="padding:6px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px">Restaurer</button>' +
            '</div>';
        }).join('');
        document.getElementById('corbeille-body').innerHTML = rows;
      }).catch(function() {
        document.getElementById('corbeille-body').innerHTML = '<div class="alert alert-yellow">Corbeille non disponible hors connexion.</div>';
      });
    }
    html += '<div id="corbeille-body"><div class="card" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div></div></div>';
    content.innerHTML = html;
  }

  // ── Déclarations (gestionnaire valide les paiements locataires) ──
  function _renderDeclarations() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var html = '<div class="content"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">📨 Déclarations de paiement</h2>' +
      '<button onclick="window.IG.app._loadDeclarations()" style="padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:12px">↻ Actualiser</button>' +
      '</div><div id="decl-body"><div class="card" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div></div></div>';
    content.innerHTML = html;
    _loadDeclarations();
  }

  async function _loadDeclarations() {
    var el = document.getElementById('decl-body');
    if (!el) return;
    try {
      var decls = await window.IG.db.select('declarations');
      var locs = _data.locataires || [];

      if (!decls || !decls.length) {
        el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">📭</div><p>Aucune déclaration en attente</p></div>';
        return;
      }

      var pending = decls.filter(function(d) { return d.statut === 'pending'; });
      var autres = decls.filter(function(d) { return d.statut !== 'pending'; });

      var html = '';
      if (pending.length) {
        html += '<h3 style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--yellow)">⏳ En attente de validation (' + pending.length + ')</h3>';
        html += pending.map(function(d) {
          var loc = locs.find(function(l) { return l.id == d.locataire_id; }) || {};
          return '<div class="card" style="margin-bottom:10px;border-left:4px solid var(--yellow)">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">' +
            '<div>' +
            '<div style="font-weight:700;font-size:14px">' + esc(loc.nom || 'Locataire #' + d.locataire_id) + '</div>' +
            '<div style="font-size:12px;color:var(--text3)">' + esc(loc.appt || '') + ' — ' + window.IG.utils.nomMois(d.mois_c) + ' ' + d.annee_c + '</div>' +
            '<div style="font-size:13px;margin-top:4px"><strong>' + window.IG.utils.formatMontant(d.montant) + '</strong> · ' + esc(d.mode || '') + (d.reference ? ' · Réf: ' + esc(d.reference) : '') + '</div>' +
            '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + window.IG.utils.formatDate(d.date_declaration) + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:8px">' +
            '<button onclick="window.IG.app._validerDeclaration(' + d.id + ',\'validated\')" style="padding:7px 14px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:12px;font-weight:600">✓ Valider</button>' +
            '<button onclick="window.IG.app._validerDeclaration(' + d.id + ',\'rejected\')" style="padding:7px 14px;border-radius:8px;border:none;background:var(--red);color:#fff;cursor:pointer;font-size:12px;font-weight:600">✗ Rejeter</button>' +
            '</div></div></div>';
        }).join('');
      }

      if (autres.length) {
        html += '<h3 style="font-size:14px;font-weight:700;margin:16px 0 10px;color:var(--text3)">Historique (' + autres.length + ')</h3>';
        html += autres.slice(0, 20).map(function(d) {
          var loc = locs.find(function(l) { return l.id == d.locataire_id; }) || {};
          var c = d.statut === 'validated' ? 'var(--green)' : 'var(--red)';
          var label = d.statut === 'validated' ? '✓ Validé' : '✗ Rejeté';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-radius:8px;background:var(--bg3);margin-bottom:6px">' +
            '<div><div style="font-size:13px;font-weight:600">' + esc(loc.nom || '#' + d.locataire_id) + ' — ' + window.IG.utils.formatMontant(d.montant) + '</div>' +
            '<div style="font-size:11px;color:var(--text3)">' + window.IG.utils.nomMois(d.mois_c) + ' ' + d.annee_c + '</div></div>' +
            '<span style="font-size:11px;font-weight:700;color:' + c + '">' + label + '</span></div>';
        }).join('');
      }

      el.innerHTML = html;
    } catch(e) {
      el.innerHTML = '<div class="alert alert-yellow">Erreur chargement: ' + esc(e.message) + '</div>';
    }
  }

  async function _validerDeclaration(id, statut) {
    try {
      // Mettre à jour le statut de la déclaration
      await window.IG.db.update('declarations', id, { statut: statut });

      if (statut === 'validated') {
        // Récupérer la déclaration pour créer le paiement
        var decls = await window.IG.db.select('declarations', { id: id });
        var d = decls && decls[0];
        if (d) {
          await window.IG.db.insert('paiements', [{
            locataire_id: d.locataire_id,
            immeuble_id: d.immeuble_id,
            mois: d.mois_c,
            annee: d.annee_c,
            montant: d.montant,
            mode: d.mode || 'especes',
            reference: d.reference || '',
            note: 'Déclaration validée'
          }]);
        }
        window.IG.utils.showToast('Déclaration validée, paiement créé ✓', 'green');
      } else {
        window.IG.utils.showToast('Déclaration rejetée', 'red');
      }
      _loadDeclarations();
      await _loadData();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
  }

  // ── Messages internes ─────────────────────────────────────────
  function _renderMessages() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">💬 Messages internes</h2>' +
      '<button onclick="window.IG.app._nouveauMessage()" style="padding:7px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">✉️ Nouveau</button>' +
      '</div><div id="messages-body"><div class="card" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div></div></div>';
    content.innerHTML = html;
    _loadMessages();
  }

  async function _loadMessages() {
    var el = document.getElementById('messages-body');
    if (!el) return;
    try {
      var msgs = await window.IG.db.select('messages_internes');
      if (!msgs || !msgs.length) {
        el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">💬</div><p>Aucun message</p></div>';
        return;
      }
      msgs.sort(function(a,b) { return new Date(b.created_at) - new Date(a.created_at); });
      el.innerHTML = msgs.map(function(m) {
        var lu = m.lu_par && m.lu_par.includes(window.IG.auth ? window.IG.auth.getSession().userId : '');
        return '<div class="card" style="margin-bottom:10px;' + (!lu ? 'border-left:3px solid var(--accent)' : '') + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div>' +
          '<div style="font-weight:700;font-size:13px' + (!lu ? ';color:var(--accent)' : '') + '">' + esc(m.sujet || 'Message') + '</div>' +
          '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + esc(m.de_nom || 'Système') + ' · ' + window.IG.utils.formatDate(m.created_at) + '</div>' +
          '<div style="font-size:13px;margin-top:6px">' + esc(m.contenu || '') + '</div>' +
          '</div>' +
          (!lu ? '<span style="font-size:10px;background:var(--accent);color:#fff;padding:2px 8px;border-radius:99px;white-space:nowrap">Nouveau</span>' : '') +
          '</div></div>';
      }).join('');
    } catch(e) {
      el.innerHTML = '<div class="alert alert-yellow">Erreur: ' + esc(e.message) + '</div>';
    }
  }

  function _nouveauMessage() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var html = '<h3 style="font-size:15px;font-weight:700;margin-bottom:14px">✉️ Nouveau message interne</h3>' +
      '<label style="font-size:12px;color:var(--text3)">SUJET</label>' +
      '<input id="msg-sujet" placeholder="Sujet du message" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin:4px 0 12px;box-sizing:border-box">' +
      '<label style="font-size:12px;color:var(--text3)">MESSAGE</label>' +
      '<textarea id="msg-contenu" rows="4" placeholder="Contenu du message..." style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin:4px 0 14px;box-sizing:border-box;resize:vertical"></textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="msg-send" style="padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Envoyer</button>' +
      '</div>';
    var modal = window.IG.utils.showModal(html, { width: '480px' });
    modal.box.querySelector('#msg-send').addEventListener('click', async function() {
      var sujet = modal.box.querySelector('#msg-sujet').value.trim();
      var contenu = modal.box.querySelector('#msg-contenu').value.trim();
      if (!contenu) { window.IG.utils.showToast('Message vide', 'red'); return; }
      try {
        await window.IG.db.insert('messages_internes', [{
          sujet: sujet || 'Sans sujet',
          contenu: contenu,
          de_user_id: session.userId || '',
          de_nom: session.nom || '',
          lu_par: []
        }]);
        window.IG.utils.showToast('Message envoyé ✓', 'green');
        modal.close();
        _loadMessages();
      } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
    });
  }

  async function _restaurer(corbeilleId) {
    try {
      var items = await window.IG.db.select('corbeille', { id: corbeilleId });
      if (!items || !items.length) return;
      var item = items[0];
      if (item.locataire_data) {
        await window.IG.db.insert('locataires', [item.locataire_data]);
      }
      await window.IG.db.remove('corbeille', corbeilleId);
      window.IG.utils.showToast('Locataire restauré ✓', 'green');
      showPage('corbeille');
    } catch(e) {
      window.IG.utils.showToast('Erreur restauration : ' + e.message, 'red');
    }
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
      '<div style="position:absolute;inset:0;z-index:1;background:linear-gradient(135deg,rgba(5,15,30,0.85) 0%,rgba(8,20,45,0.80) 50%,rgba(5,15,30,0.85) 100%);"></div>' +

      '<div id="auth-main-layout" style="position:relative;z-index:2;min-height:100vh;display:flex;align-items:center;justify-content:center;gap:60px;padding:40px 6%;">' +

      // ── Panneau gauche branding ──
      '<div id="auth-branding" style="flex:1;max-width:480px;color:white;">' +
      '<div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:18px;">Gestion Immobilière Professionnelle</div>' +
      '<h1 style="font-size:54px;font-weight:900;line-height:1.05;margin:0 0 18px;letter-spacing:-2px;">ImmoGest</h1>' +
      '<p style="font-size:16px;line-height:1.7;color:rgba(255,255,255,0.65);margin-bottom:30px;max-width:380px;">La plateforme complète de gestion immobilière.<br>Locataires, encaissements, rapports et bien plus.</p>' +
      // Badges fonctionnalités
      '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:36px;">' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">✅ Droit local</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">📊 Hors-ligne</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">💳 Mobile Money</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">✍️ Signature électronique</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">🤖 Assistant IA</span>' +
      '</div>' +
      // Stats
      '<div style="display:flex;gap:36px;">' +
      '<div><div style="font-size:28px;font-weight:900;color:#4f8ef7;">100%</div><div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-top:2px;">Intégré</div></div>' +
      '<div><div style="font-size:28px;font-weight:900;color:#4f8ef7;">100%</div><div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-top:2px;">Collaboratif</div></div>' +
      '<div><div style="font-size:28px;font-weight:900;color:#4f8ef7;">100%</div><div style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-top:2px;">Offline</div></div>' +
      '</div></div>' +

      // ── Panneau droit — carte auth ──
      '<div class="auth-form-box" style="width:400px;min-width:360px;">' +

      // ─── ÉCRAN ACCUEIL : 3 boutons d'action ───
      '<div id="auth-step-home" class="auth-step active">' +
      '<div style="text-align:center;margin-bottom:24px;">' +
      '<div style="font-size:40px;margin-bottom:12px;">🏢</div>' +
      '<div style="font-size:19px;font-weight:800;color:#e8f0fe;">Bienvenue sur ImmoGest</div>' +
      '<div style="font-size:12px;color:rgba(232,240,254,0.45);margin-top:6px;">Comment allez-vous utiliser l\'application ?</div>' +
      '</div>' +
      // Bouton 1 — Créer (bleu, primaire)
      '<button onclick="window.IG.app.authGoStep(\'register\')" style="width:100%;display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border:none;border-radius:12px;padding:16px 18px;cursor:pointer;margin-bottom:10px;transition:opacity .15s;" onmouseover="this.style.opacity=\'.9\'" onmouseout="this.style.opacity=\'1\'">' +
      '<span style="font-size:22px;flex-shrink:0;">🏠</span>' +
      '<div style="text-align:left;">' +
      '<div style="font-size:14px;font-weight:700;color:#fff;">Créer mon espace</div>' +
      '</div></button>' +
      // Bouton 2 — Rejoindre
      '<button onclick="window.IG.app.authGoStep(\'join\')" style="width:100%;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px 18px;cursor:pointer;margin-bottom:10px;transition:background .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.09)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)\'">' +
      '<span style="font-size:22px;flex-shrink:0;">🔗</span>' +
      '<div style="text-align:left;">' +
      '<div style="font-size:14px;font-weight:700;color:#e8f0fe;">Rejoindre un espace</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.45);margin-top:2px;">Locataire ou employé — code d\'invitation</div>' +
      '</div></button>' +
      // Bouton 3 — Se connecter
      '<button onclick="window.IG.app.authGoStep(\'login\')" style="width:100%;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px 18px;cursor:pointer;margin-bottom:20px;transition:background .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.09)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.05)\'">' +
      '<span style="font-size:22px;flex-shrink:0;">🔑</span>' +
      '<div style="text-align:left;">' +
      '<div style="font-size:14px;font-weight:700;color:#e8f0fe;">Se connecter à un espace existant</div>' +
      '</div></button>' +
      // Lien marketplace
      '<div style="text-align:center;">' +
      '<button onclick="window.IG.app.browseMarketplace()" style="background:none;border:none;color:#4f8ef7;font-size:12px;cursor:pointer;font-family:inherit;">🏪 Parcourir la marketplace →</button>' +
      '</div></div>' +

      // ─── CONNEXION ───
      '<div id="auth-step-login" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'home\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔑</div>' +
      '<div style="font-size:17px;font-weight:800;color:#e8f0fe;">Se connecter</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.4);margin-top:4px;">Téléphone + mot de passe</div>' +
      '</div>' +
      '<label class="auth-label">NUMÉRO DE TÉLÉPHONE</label>' +
      '<input type="tel" id="login-tel" class="auth-input" placeholder="Ex: 699 00 00 00" autocomplete="tel" style="margin-bottom:14px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'login-pwd\').focus()">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="login-pwd" class="auth-input" placeholder="Mot de passe" autocomplete="current-password" style="margin-bottom:20px;" onkeydown="if(event.key===\'Enter\')window.IG.app.doLogin()">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.doLogin()">🔐 Se connecter</button>' +
      '<div id="err-login" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '</div>' +

      // ─── CRÉER UN ESPACE ───
      '<div id="auth-step-register" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'home\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🏠</div>' +
      '<div style="font-size:17px;font-weight:800;color:#e8f4ff;">Créer mon espace</div>' +
      '<div style="font-size:11px;color:rgba(200,223,248,0.4);margin-top:3px;">Nouvel espace ImmoGest</div>' +
      '</div>' +
      '<label class="auth-label">VOTRE NOM</label>' +
      '<input type="text" id="reg-nom" class="auth-input" placeholder="Nom complet" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'reg-cabinet\').focus()">' +
      '<label class="auth-label">NOM DU CABINET <span style="opacity:.5;font-weight:400;">(optionnel)</span></label>' +
      '<input type="text" id="reg-cabinet" class="auth-input" placeholder="Mon Cabinet Immobilier" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'reg-tel\').focus()">' +
      '<label class="auth-label">TÉLÉPHONE</label>' +
      '<input type="tel" id="reg-tel" class="auth-input" placeholder="6XXXXXXXX" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'reg-pwd\').focus()">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="reg-pwd" class="auth-input" placeholder="Min. 6 caractères" style="margin-bottom:18px;" onkeydown="if(event.key===\'Enter\')window.IG.app.registerV2()">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.registerV2()">🚀 Créer mon espace</button>' +
      '<div id="err-register" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '</div>' +

      // ─── REJOINDRE ───
      '<div id="auth-step-join" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'home\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔗</div>' +
      '<div style="font-size:17px;font-weight:800;color:#e8f4ff;">Rejoindre un espace</div>' +
      '<div style="font-size:11px;color:rgba(200,223,248,0.4);margin-top:3px;">Code d\'invitation requis</div>' +
      '</div>' +
      '<label class="auth-label">CODE D\'INVITATION</label>' +
      '<input type="text" id="join-code" class="auth-input" placeholder="Ex: AB3F1234" style="margin-bottom:12px;text-transform:uppercase;letter-spacing:3px;font-weight:700;" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key===\'Enter\')document.getElementById(\'join-nom\').focus()">' +
      '<label class="auth-label">VOTRE NOM</label>' +
      '<input type="text" id="join-nom" class="auth-input" placeholder="Nom complet" style="margin-bottom:12px;" onkeydown="if(event.key===\'Enter\')document.getElementById(\'join-pwd\').focus()">' +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="join-pwd" class="auth-input" placeholder="Choisissez un mot de passe" style="margin-bottom:18px;" onkeydown="if(event.key===\'Enter\')window.IG.app.joinV2()">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.joinV2()">🔗 Rejoindre</button>' +
      '<div id="err-join" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '</div>' +

      '</div>' + // fin auth-form-box
      '</div>' + // fin auth-main-layout
      '</div>';  // fin auth-screen

    // Slideshow
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

  function authGoStep(step) {
    document.querySelectorAll('.auth-step').forEach(function(el) { el.classList.remove('active'); });
    var target = document.getElementById('auth-step-' + step);
    if (target) target.classList.add('active');
  }

  function browseMarketplace() {
    var base = (window.APP_CONFIG && window.APP_CONFIG.APP_URL) || '';
    window.open(base + '/marketplace.html', '_blank');
  }

  async function doLogin() {
    var tel = (document.getElementById('login-tel') || {}).value || '';
    var pwd = (document.getElementById('login-pwd') || {}).value || '';
    var errEl = document.getElementById('err-login');
    var btn = document.querySelector('#auth-step-login .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Se connecter';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    if (!tel.trim() || !pwd) {
      if (errEl) { errEl.textContent = 'Numéro et mot de passe requis'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
      return;
    }
    try {
      await window.IG.auth.login(tel.trim(), pwd);
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message || 'Identifiants incorrects'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }
  }

  async function joinV2() {
    var code = (document.getElementById('join-code') || {}).value || '';
    var nom  = (document.getElementById('join-nom')  || {}).value || '';
    var pwd  = (document.getElementById('join-pwd')  || {}).value || '';
    var errEl = document.getElementById('err-join');
    var btn = document.querySelector('#auth-step-join .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Rejoindre';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    try {
      await window.IG.auth.join(code.trim(), nom.trim(), pwd);
      _showAppShell(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message || 'Code invalide'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
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

  return {
    init, showPage, refresh, renderCurrentPage,
    _renderLogin,
    authGoStep, doLogin, joinV2, registerV2, browseMarketplace,
    toggleSidebar, closeSidebar, toggleSidebarSection,
    _refreshPaiements, _restaurer,
    _genererInvitation, _toggleUser, _appliquerPromo,
    _loadDeclarations, _validerDeclaration,
    _loadMessages, _nouveauMessage,
    _sauvegarderModePublication, _chargerModePublication,
    getData: function() { return _data; },
    topbarAction, _showMobileNav
  };

})();
