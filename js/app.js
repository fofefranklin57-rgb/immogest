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
  // _p(perm) — raccourci permissions pour la session courante
  function _p(perm) { return window.IG.perms ? window.IG.perms.canDo(perm) : true; }

  // ── Init ──────────────────────────────────────────────────────
  async function init() {
    // Panneau owner si URL ?owner=1
    if (window.IG.owner && window.IG.owner.checkAutoOpen()) return;

    var session = window.IG.auth.init();
    if (!session) {
      _renderLogin();
      return;
    }
    // Locataire → portail directement, pas l'app principale
    if (session.role === 'locataire') {
      if (window.IG.portailLocataire) { window.IG.portailLocataire.init(); return; }
      // fallback si module non chargé
    }

    _showAppShell();
    _applyDarkMode();
    _renderLangPlan();
    await _loadData();

    // Bailleur : filtrer les données à ses immeubles uniquement
    if (session.role === 'bailleur') {
      var immIds = (session.immeubles || []).map(String);
      if (immIds.length) {
        _data.immeubles  = _data.immeubles.filter(function(i) { return immIds.includes(String(i.id)); });
        _data.locataires = _data.locataires.filter(function(l) { return immIds.includes(String(l.immeuble_id)); });
        var locIds = _data.locataires.map(function(l) { return String(l.id); });
        _data.paiements  = _data.paiements.filter(function(p) { return locIds.includes(String(p.locataire_id)); });
      }
    }

    showPage('dashboard');

    // Publicités plan gratuit + expiry check
    if (window.IG.ads) { window.IG.ads.init(); window.IG.ads.checkExpiry(); }
    // Vérifier rétrogradation (données > limites plan actuel)
    if (window.IG.plans) window.IG.plans.verifierRetrogradation();
    // Badge essai + toast premier login
    _initEssai();

    // Back button Android (Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      window.Capacitor.Plugins.App.addListener('backButton', function(e) {
        // Fermer modal ouvert
        var modal = document.querySelector('.modal-overlay');
        if (modal) { modal.remove(); return; }
        // Fermer sidebar mobile
        var sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('open')) { window.IG.app.toggleSidebar(); return; }
        // Fermer panneau IA
        var ai = document.getElementById('ai-panel');
        if (ai && ai.style.display !== 'none') { ai.style.display = 'none'; return; }
        // Si pas sur dashboard → retour dashboard
        var currentPage = window._currentPage || 'dashboard';
        if (currentPage !== 'dashboard') { showPage('dashboard'); return; }
        // Sur dashboard → quitter l'app
        window.Capacitor.Plugins.App.exitApp();
      });
    }
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
      (_p('immeubles') ? (
        _navSectionToggle('immeubles', t('Immeubles')) +
        '<div id="sb-body-immeubles" class="nav-section-body">' +
        _navItem('immeubles', '🏢', t('Tous les immeubles')) +
        '<div id="sidebar-immeubles-list"></div>' +
        '</div>'
      ) : '') +
      (_p('locataires') || _p('paiements') || _p('rapports') || _p('statistiques') || _p('juridique') || _p('messages') ? (
        _navSectionToggle('gestion', t('Gestion')) +
        '<div id="sb-body-gestion" class="nav-section-body">' +
        (_p('locataires')   ? _navItem('locataires',  '👥', t('Locataires'))   : '') +
        (_p('paiements')    ? _navItem('paiements',   '💰', t('Encaissements')) : '') +
        (_p('locataires')   ? _navItem('relances',    '⚠️', t('Relances'), true) : '') +
        (_p('rapports')     ? _navItem('rapports',    '📄', t('Rapports'))      : '') +
        (_p('statistiques') ? _navItem('statistiques','📈', t('Statistiques'))  : '') +
        (_p('messages')     ? _navItem('messages-wa', '📱', 'Messages WA')      : '') +
        (_p('juridique')    ? _navItem('juridique',   '⚖️', t('Juridique'))     : '') +
        '</div>'
      ) : '') +
      (_p('marketplace') || _p('leads') ? _navSection(t('Réseau')) : '') +
      (_p('marketplace') ? _navItem('marketplace', '🌍', t('Marketplace')) : '') +
      (_p('leads') ? _navItem('leads', '📬', t('Leads')) : '') +
      (session.role === 'locataire' ? _navItem('portail', '🏠', t('Mon espace')) : '') +
      _navSection(t('Interne')) +
      (_p('declarations') ? '<div class="nav-item" data-page="declarations"><span class="nav-icon">📨</span><span>' + t('Déclarations') + '</span><span class="nav-badge" id="badge-declarations" style="display:none">0</span></div>' : '') +
      (_p('messages')    ? _navItem('messages',   '💬', t('Messages'))   : '') +
      (_p('signatures')  ? _navItem('signatures', '✍️', t('Signatures')) : '') +
      _navItem('parametres', '⚙️', t('Paramètres')) +
      '</div>' +
      '<div class="sidebar-footer">' +
      '<div id="sidebar-user-info" style="font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:3px;font-size:12px">' + esc(session.nom || '') + '</div>' +
      '<div id="sync-indicator" style="font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:8px">● Sync...</div>' +
      (session.role === 'locataire' ? '<div onclick="window.IG.app.showPage(\'portail\')" class="sidebar-footer-btn sidebar-footer-btn-green"><span>🏠</span><span>' + t('Mon espace') + '</span></div>' : '') +
      '<div onclick="window.IG.app.openGuide()" class="sidebar-footer-btn"><span>📄 ' + t('Guide d\'utilisation') + '</span><span style="font-size:9px;background:#e74c3c;color:#fff;padding:1px 5px;border-radius:4px;font-weight:700;letter-spacing:.03em">PDF</span></div>' +
      '<div onclick="window.IG.app.showPage(\'archives\')" class="sidebar-footer-btn"><span>🗄️ ' + t('Archives') + '</span></div>' +
      '<div onclick="window.IG.app.showPage(\'corbeille\')" class="sidebar-footer-btn" style="margin-bottom:8px"><span>🗑️ ' + t('Corbeille') + '</span><span id="badge-corbeille" class="nav-badge" style="display:none">0</span></div>' +
      '<button id="btn-dark-mode" onclick="window.IG.app.toggleDarkMode()" title="Mode sombre" style="width:100%;margin-bottom:6px;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.85);font-size:16px;cursor:pointer;font-family:var(--font);">🌙 ' + t('Mode sombre') + '</button>' +
      '</div></nav>' +
      // Bouton IA flottant
      '<button id="ai-float-btn" onclick="window.IG.app.toggleAIChat()" title="Assistant IA ImmoGest">' +
      '<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/></svg>' +
      '</button>' +
      // Panel chat IA
      '<div id="ai-chat-panel">' +
      '<div style="padding:13px 16px;background:linear-gradient(135deg,#0e6aaf,#6b46c1);color:#fff;display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
      '<div style="width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L17 21H7l1.3-6A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/><circle cx="9" cy="9" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="9" r="1" fill="#fff" stroke="none"/></svg></div>' +
      '<div><div style="font-size:13px;font-weight:700;">Assistant ImmoGest</div>' +
      '<div style="font-size:10px;opacity:.85;display:flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block;"></span>En ligne · IA connectée</div></div>' +
      '</div>' +
      '<button onclick="window.IG.app.toggleAIChat()" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;">✕</button>' +
      '</div>' +
      '<div id="ai-chat-messages" style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--bg3);">' +
      '<div class="ai-msg-bot"><div class="ai-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L17 21H7l1.3-6A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/><circle cx="9" cy="9" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="9" r="1" fill="#fff" stroke="none"/></svg></div>' +
      '<div class="ai-bubble-bot">Bonjour ! Je suis votre assistant ImmoGest.<br>Je connais vos immeubles, locataires et paiements en temps réel. Posez-moi n\'importe quelle question ⬇️</div></div>' +
      '</div>' +
      // Bannière Adsterra CPM — visible tous plans
      '<div id="ai-ad-banner" style="border-top:1px solid var(--border);background:var(--bg2);flex-shrink:0;padding:8px;box-sizing:border-box;"></div>' +
      '<div style="padding:8px 12px;border-top:1px solid var(--border);display:flex;gap:6px;flex-wrap:wrap;background:var(--bg2);flex-shrink:0;">' +
      '<button class="ai-chip" onclick="window.IG.app.aiQuickAction(\'impayés\')" style="background:var(--red-bg);color:var(--red);border-color:var(--red);">⚠️ Impayés</button>' +
      '<button class="ai-chip" onclick="window.IG.app.aiQuickAction(\'anomalies\')" style="background:rgba(107,70,193,.1);color:#6b46c1;border-color:#6b46c1;">📊 Anomalies</button>' +
      '<button class="ai-chip" onclick="window.IG.app.aiQuickAction(\'performance\')" style="background:var(--green-bg);color:var(--green);border-color:var(--green);">📈 Performance</button>' +
      '<button class="ai-chip" onclick="window.IG.app.aiQuickAction(\'relances\')" style="background:var(--yellow-bg);color:var(--yellow);border-color:var(--yellow);">📩 Relances</button>' +
      '</div>' +
      '<div style="padding:10px 12px;border-top:1px solid var(--border);display:flex;gap:8px;background:var(--bg2);flex-shrink:0;">' +
      '<input type="text" id="ai-input" placeholder="Posez votre question…" style="flex:1;padding:9px 13px;border:1.5px solid var(--border);border-radius:10px;font-size:12.5px;font-family:var(--font);background:var(--bg);color:var(--text);outline:none;transition:border .15s;" onfocus="this.style.borderColor=\'#0e6aaf\'" onblur="this.style.borderColor=\'\'" onkeydown="if(event.key===\'Enter\')window.IG.app.sendAIMessage()">' +
      '<button onclick="window.IG.app.sendAIMessage()" id="ai-send-btn" style="width:38px;height:38px;background:linear-gradient(135deg,#0e6aaf,#6b46c1);color:#fff;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
      '</div>' +
      '</div>' +
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
      // Chip utilisateur + rôle
      '<div class="topbar-user-chip" style="display:flex;align-items:center;gap:5px;padding:4px 8px;border-radius:8px;background:var(--bg4);border:1px solid var(--border2);cursor:pointer;flex-shrink:0;" onclick="window.IG.app.showPage(\'parametres\')">' +
      '<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#0e6aaf,#6b46c1);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">' + esc((session.nom || 'U').charAt(0).toUpperCase()) + '</div>' +
      '<span style="font-size:10px;font-weight:700;padding:1px 7px;border-radius:99px;background:rgba(14,106,175,0.12);color:var(--accent);text-transform:capitalize;">' + esc(session.role || 'user') + '</span>' +
      '</div>' +
      // Langue + plan (avant les sélecteurs pour accessibilité mobile)
      '<div id="topbar-lang-plan" style="display:flex;align-items:center;gap:4px;flex-shrink:0;"></div>' +
      '<button class="pwa-install-btn" onclick="installPWA()" title="Installer l\'app" style="display:none;padding:5px 10px;border-radius:8px;border:1px solid rgba(14,106,175,0.3);background:rgba(14,106,175,0.1);color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);align-items:center;gap:4px;white-space:nowrap;flex-shrink:0;">⬇ ' + t('Installer') + '</button>' +
      '<button class="topbar-deconnexion" onclick="window.IG.auth.logout()" style="padding:5px 12px;border-radius:8px;border:1px solid rgba(185,48,32,0.3);background:var(--red-bg);color:var(--red);font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);display:flex;align-items:center;gap:5px;white-space:nowrap;flex-shrink:0;">⏻ ' + t('Déco') + '</button>' +
      // Sélecteurs mois/année
      '<select id="sel-mois" onchange="window.IG.app.refresh()" style="background:var(--bg4);border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:12px;padding:6px 10px;font-family:var(--font);">' +
      Array.from({length:12}, function(_,i) { var mn = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][i]; return '<option value="' + (i+1) + '"' + ((i+1) === mois ? ' selected' : '') + '>' + t(mn) + '</option>'; }).join('') +
      '</select>' +
      '<select id="sel-annee" onchange="window.IG.app.refresh()" style="background:var(--bg4);border:1px solid var(--border2);border-radius:var(--radius-sm);color:var(--text);font-size:12px;padding:6px 10px;font-family:var(--font);">' +
      [2024,2025,2026,2027].map(function(y) { return '<option value="' + y + '"' + (y === annee ? ' selected' : '') + '>' + y + '</option>'; }).join('') +
      '</select>' +
      '<button class="btn btn-primary btn-sm" id="topbar-main-btn" onclick="window.IG.app.topbarAction()">＋ ' + t('Nouveau') + '</button>' +
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
    else { showPage('locataires'); }
  }

  function toggleDarkMode() {
    var isDark = document.body.classList.toggle('dark');
    localStorage.setItem('ig_dark_mode', isDark ? '1' : '0');
    var btn = document.getElementById('btn-dark-mode');
    if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  }

  function _applyDarkMode() {
    var saved = localStorage.getItem('ig_dark_mode');
    if (saved === '1') {
      document.body.classList.add('dark');
      var btn = document.getElementById('btn-dark-mode');
      if (btn) btn.textContent = '☀️';
    }
  }

  function _initEssai() {
    var session = window.IG.auth ? window.IG.auth.getSession() : null;
    if (!session || !session.plan_expire) return;
    var plan = (session.plan || '').toLowerCase();
    if (plan === 'gratuit' || plan === 'pro' || plan === 'cabinet') return;

    var now     = Date.now();
    var expire  = new Date(session.plan_expire).getTime();
    var joursRestants = Math.ceil((expire - now) / 86400000);
    if (joursRestants <= 0) return;

    // Toast premier login essai (si loginAt < 5 min)
    var isNouveauLogin = session.loginAt && (now - session.loginAt) < 300000;
    if (isNouveauLogin) {
      var msg = joursRestants >= 29
        ? '🎉 Essai Starter 30 jours activé ! Profitez de toutes les fonctionnalités.'
        : '⏳ Essai en cours — ' + joursRestants + ' jour(s) restant(s) sur votre période d\'essai.';
      window.IG.utils.showToast(msg, 'green', 6000);
    }

    // Badge compte à rebours dans la sidebar
    var footer = document.querySelector('.sidebar-footer');
    if (!footer) return;
    var existing = document.getElementById('ig-trial-badge');
    if (existing) existing.remove();

    var color = joursRestants <= 5 ? '#e74c3c' : joursRestants <= 10 ? '#f39c12' : '#0E7A45';
    var badge = document.createElement('div');
    badge.id = 'ig-trial-badge';
    badge.style.cssText = 'margin:0 0 8px 0;padding:10px 12px;border-radius:8px;background:' + color + '22;border:1px solid ' + color + '55;cursor:pointer;';
    badge.onclick = function() { if (window.IG.plans) window.IG.plans.afficherUpgrade(); };
    badge.innerHTML =
      '<div style="font-size:9px;text-transform:uppercase;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:.06em;margin-bottom:4px">⏳ PÉRIODE D\'ESSAI</div>' +
      '<div style="font-size:18px;font-weight:800;color:#fff;line-height:1">' + joursRestants + ' <span style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.85)">jour' + (joursRestants > 1 ? 's' : '') + ' restant' + (joursRestants > 1 ? 's' : '') + '</span></div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.6);margin-top:4px;">Cliquez pour vous abonner →</div>';
    footer.insertBefore(badge, footer.firstChild);
  }

  function _renderLangPlan() {
    var el = document.getElementById('topbar-lang-plan');
    if (!el) return;
    var session = window.IG.auth.getSession ? window.IG.auth.getSession() : {};
    var plan = (session.plan || 'gratuit').toLowerCase();
    var planColors = { starter: '#0E6AAF', pro: '#0E7A45', cabinet: '#7B2FBE', gratuit: '#888' };
    var color = planColors[plan] || '#888';
    var _planLabels = { gratuit: t('Gratuit'), starter: 'Starter', pro: 'Pro', cabinet: t('Cabinet') };
    var _planLabel = _planLabels[plan] || plan.toUpperCase();
    // Badge toujours cliquable → modal abonnement/upgrade
    var html = '<span onclick="if(window.IG.plans)window.IG.plans.afficherUpgrade();" title="Gérer mon abonnement" style="padding:3px 10px;border-radius:99px;background:' + color + ';color:#fff;font-size:10px;font-weight:700;letter-spacing:.04em;white-space:nowrap;cursor:pointer;transition:opacity .15s;" onmouseenter="this.style.opacity=\'0.8\'" onmouseleave="this.style.opacity=\'1\'">' + _planLabel + (plan === 'gratuit' ? ' ↑' : ' ↻') + '</span>';
    // Sélecteur langue — hardcodé car window.IG.i18n n'expose pas langs
    var LANGS = [['fr','🇫🇷 FR'],['en','🇬🇧 EN'],['pt','🇧🇷 PT'],['es','🇪🇸 ES'],['ha','🌍 HA'],['ar','🇸🇦 AR'],['sw','🇰🇪 SW'],['zh','🇨🇳 ZH'],['hi','🇮🇳 HI'],['id','🇮🇩 ID'],['yo','🇳🇬 YO'],['ln','🇨🇩 LN'],['am','🇪🇹 AM']];
    var currentLang = (window.IG.i18n && window.IG.i18n.lang) ? window.IG.i18n.lang : (localStorage.getItem('ig_lang') || 'fr');
    html += '<select onchange="window.IG.i18n.setLang(this.value)" style="background:var(--bg4);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:12px;padding:4px 8px;font-family:var(--font);cursor:pointer;">';
    LANGS.forEach(function(l) {
      html += '<option value="' + l[0] + '"' + (l[0] === currentLang ? ' selected' : '') + '>' + l[1] + '</option>';
    });
    html += '</select>';
    el.innerHTML = html;
  }

  // ── Assistant IA ──────────────────────────────────────────
  var _aiHistory = [];

  function toggleAIChat() {
    var panel = document.getElementById('ai-chat-panel');
    if (!panel) return;
    var open = panel.style.display === 'flex';
    panel.style.display = open ? 'none' : 'flex';
    if (!open) {
      document.getElementById('ai-input').focus();
      // Injecter pub Monetag 300x250 dans le panel IA
      var banner = document.getElementById('ai-ad-banner');
      if (banner && !banner.querySelector('script[data-zone]') && window.IG.ads) {
        window.IG.ads.injecterMonetag('ai-ad-banner', 29679261);
      }
    }
  }

  function _aiReponseLocale(question, data) {
    var q = (question || '').toLowerCase();
    var d = data || {};
    var imm = d.immeubles || [];
    var loc = d.locataires || [];
    var pay = d.paiements || [];
    var actifs = loc.filter(function(l) { return l.statut === 'occupe' || l.statut === 'actif'; });
    var impayes = actifs.filter(function(l) { return (parseInt(l.mois_arrieres) || 0) > 0 || (parseInt(l.arrieres) || 0) > 0; });
    var totalLoyers = actifs.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
    var encaisse = pay.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    if (q.match(/impay|arri[eè]r|retard|relance/)) {
      if (impayes.length === 0) return '✅ Aucun locataire en retard de paiement. Tout est à jour !';
      return '⚠️ **' + impayes.length + ' locataire(s) avec arriérés :**\n' +
        impayes.slice(0, 5).map(function(l) {
          return '• ' + l.nom + ' — ' + (l.mois_arrieres || 1) + ' mois (' + formatMontant(parseInt(l.arrieres) || 0) + ')';
        }).join('\n') +
        (impayes.length > 5 ? '\n...et ' + (impayes.length - 5) + ' autres.' : '');
    }
    if (q.match(/performance|portef|r[eé]sum[eé]|bilan|statistique/)) {
      var taux = actifs.length > 0 ? Math.round((actifs.filter(function(l){return !impayes.includes(l);}).length / actifs.length) * 100) : 100;
      return '📊 **Résumé de votre portefeuille :**\n' +
        '• ' + imm.length + ' immeuble(s)\n' +
        '• ' + actifs.length + ' locataire(s) actifs\n' +
        '• Loyers attendus : ' + formatMontant(totalLoyers) + '/mois\n' +
        '• Encaissé total : ' + formatMontant(encaisse) + '\n' +
        '• Taux de paiement : ' + taux + '%\n' +
        '• Impayés : ' + impayes.length + ' locataire(s)';
    }
    if (q.match(/locataire|liste|qui|combien/)) {
      if (actifs.length === 0) return 'Aucun locataire actif pour le moment.';
      return '👥 **' + actifs.length + ' locataire(s) actifs :**\n' +
        actifs.slice(0, 8).map(function(l) { return '• ' + l.nom + ' — ' + formatMontant(parseInt(l.loyer)||0); }).join('\n') +
        (actifs.length > 8 ? '\n...et ' + (actifs.length - 8) + ' autres.' : '');
    }
    if (q.match(/immeuble|b[aâ]timent|propri[eé]t[eé]/)) {
      if (imm.length === 0) return 'Aucun immeuble enregistré.';
      return '🏢 **' + imm.length + ' immeuble(s) :**\n' +
        imm.map(function(i) { return '• ' + (i.nom_immeuble || i.nom) + ' — ' + (i.ville || '') + ' (' + (i.nb_appts || '?') + ' appts)'; }).join('\n');
    }
    if (q.match(/paiement|encaiss|reçu|historique/)) {
      return '💰 **Paiements enregistrés :** ' + pay.length + '\n' +
        '• Total encaissé : ' + formatMontant(encaisse) + '\n' +
        '• Loyers attendus/mois : ' + formatMontant(totalLoyers);
    }
    if (q.match(/bonjour|salut|hello|aide|help|que.*faire|comment/)) {
      return 'Bonjour ! 👋 Je suis votre assistant ImmoGest.\n\nJe peux vous aider avec :\n• 📋 Résumé de votre portefeuille\n• ⚠️ Liste des impayés\n• 👥 Informations sur vos locataires\n• 🏢 État de vos immeubles\n• 💰 Suivi des paiements\n\nPosez-moi votre question !';
    }
    return 'Je ne dispose pas d\'une clé IA configurée pour répondre à cette question précise.\n\nJe peux analyser vos données locales : impayés, locataires, paiements, immeubles.\n\nPour des réponses plus avancées, configurez votre clé API dans **Paramètres → Mon compte → Clé API IA**.';
  }

  async function sendAIMessage() {
    var input = document.getElementById('ai-input');
    var msgs = document.getElementById('ai-chat-messages');
    if (!input || !msgs) return;
    var text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Bulle utilisateur
    var userBubble = document.createElement('div');
    userBubble.style.cssText = 'display:flex;justify-content:flex-end;';
    userBubble.innerHTML = '<div class="ai-bubble-user">' + esc(text) + '</div>';
    msgs.appendChild(userBubble);

    // Typing indicator
    var typing = document.createElement('div');
    typing.className = 'ai-msg-bot';
    typing.innerHTML = '<div class="ai-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L17 21H7l1.3-6A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/><circle cx="9" cy="9" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="9" r="1" fill="#fff" stroke="none"/></svg></div>' +
      '<div class="ai-bubble-bot"><div class="ai-typing"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    _aiHistory.push({ role: 'user', content: text });

    // Contexte données — filtré selon le rôle
    var d = _data;
    var session2 = window.IG.auth ? window.IG.auth.getSession() : {};
    var role = session2.role || 'locataire';
    var systemPrompt;

    if (role === 'locataire') {
      // Locataire : uniquement ses propres données
      var monLoc = d.locataires.find(function(l) { return l.userId == session2.userId || l.nom === session2.nom; }) || {};
      var mesPays = d.paiements.filter(function(p) { return p.locataire_id == monLoc.id; });
      systemPrompt = 'Tu es l\'assistant personnel du locataire ' + (session2.nom || '') + '. ' +
        'Tu réponds UNIQUEMENT aux questions concernant SON loyer, SES paiements et SES droits en tant que locataire. ' +
        'Informations disponibles: loyer=' + (monLoc.loyer || 'inconnu') + ' ' + ((window.IG._locale && window.IG._locale.devise) || 'FCFA') + ', ' +
        'statut=' + (monLoc.statut || 'actif') + ', ' + mesPays.length + ' paiement(s) enregistré(s). ' +
        'NE COMMUNIQUE JAMAIS d\'informations sur d\'autres locataires, les finances du cabinet, les honoraires, ou les données de gestion. ' +
        'Si une question sort de ce périmètre, réponds que tu n\'as pas accès à cette information.';

    } else if (role === 'bailleur' || role === 'proprietaire') {
      // Bailleur : ses immeubles seulement
      var mesImm = d.immeubles.filter(function(i) { return i.proprietaire_id == session2.userId; });
      var mesLoc = d.locataires.filter(function(l) { return mesImm.some(function(i) { return i.id == l.immeuble_id; }); });
      systemPrompt = 'Tu es l\'assistant du propriétaire/bailleur ' + (session2.nom || '') + '. ' +
        'Tu l\'aides à comprendre ses revenus locatifs et la situation de ses biens. ' +
        'Ses données: ' + mesImm.length + ' immeuble(s), ' + mesLoc.length + ' locataire(s). ' +
        'NE COMMUNIQUE PAS les informations confidentielles du cabinet (honoraires internes, autres bailleurs, données d\'autres propriétaires).';

    } else if (role === 'agent') {
      // Agent : vue immeubles et locataires, pas les finances
      systemPrompt = 'Tu es l\'assistant de l\'agent commercial ' + (session2.nom || '') + '. ' +
        'Tu l\'aides avec les annonces, les visites et la prospection de locataires. ' +
        'Données: ' + d.immeubles.length + ' immeuble(s), ' + d.locataires.length + ' locataire(s). ' +
        'Pas d\'accès aux données financières détaillées ni aux honoraires du cabinet.';

    } else {
      // Admin / gestionnaire / comptable / coordinateur : accès complet
      var actifs = d.locataires.filter(function(l) { return l.statut === 'actif'; });
      var impayes = actifs.filter(function(l) {
        var pays = d.paiements.filter(function(p) { return p.locataire_id == l.id; });
        return pays.length === 0 ? (parseInt(l.mois_arrieres) || 0) > 0 : true;
      });
      systemPrompt = 'Tu es l\'assistant IA d\'ImmoGest pour ' + (session2.nom || 'le gestionnaire') +
        ' (rôle: ' + role + '). ' +
        'Réponds en français, de façon concise et pratique. ' +
        'Données: ' + d.immeubles.length + ' immeuble(s), ' + actifs.length + ' locataire(s) actifs, ' +
        d.paiements.length + ' paiement(s). ' +
        'Locataires avec retard: ' + impayes.length + '. ' +
        'Tu as accès à toutes les données de gestion du cabinet.';
    }

    try {
      var workerUrl = (window.IG.config && (window.IG.config.workerUrl || window.IG.config.WORKER_URL)) || 'https://immogest1.fofefranklin57.workers.dev';
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      var userKey = (session.parametres && session.parametres.anthropic_key) || '';
      var res = await fetch(workerUrl + '/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: _aiHistory, system: systemPrompt, user_key: userKey || undefined })
      });
      var data = await res.json();
      var reply = data.text || _aiReponseLocale(_aiHistory[_aiHistory.length - 1].content, window.IG.app ? window.IG.app.getData() : {});
      _aiHistory.push({ role: 'assistant', content: reply });

      typing.remove();
      var botBubble = document.createElement('div');
      botBubble.className = 'ai-msg-bot';
      botBubble.innerHTML = '<div class="ai-avatar"><svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L17 21H7l1.3-6A7 7 0 0 1 5 9a7 7 0 0 1 7-7z"/><circle cx="9" cy="9" r="1" fill="#fff" stroke="none"/><circle cx="15" cy="9" r="1" fill="#fff" stroke="none"/></svg></div>' +
        '<div class="ai-bubble-bot">' + reply.replace(/\n/g, '<br>') + '</div>';
      msgs.appendChild(botBubble);
    } catch(e) {
      typing.remove();
      var errBubble = document.createElement('div');
      errBubble.className = 'ai-msg-bot';
      errBubble.innerHTML = '<div class="ai-avatar"></div><div class="ai-bubble-bot" style="color:var(--red)">Erreur de connexion. Réessayez.</div>';
      msgs.appendChild(errBubble);
    }
    msgs.scrollTop = msgs.scrollHeight;
  }

  function aiQuickAction(type) {
    var questions = {
      'impayés': 'Quels locataires ont des impayés ? Donne-moi un résumé.',
      'anomalies': 'Détecte les anomalies dans mes données immobilières.',
      'performance': 'Donne-moi un résumé de la performance de mon portefeuille.',
      'relances': 'Quels locataires dois-je relancer en priorité ?'
    };
    var input = document.getElementById('ai-input');
    if (input) { input.value = questions[type] || type; sendAIMessage(); }
  }

  function openGuide() {
    window.open('guide.html', '_blank');
  }

  function lockScreen() {
    var overlay = document.createElement('div');
    overlay.id = 'lock-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,30,60,0.97);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
    overlay.innerHTML = '<div style="font-size:48px">🔒</div>' +
      '<div style="color:#fff;font-size:18px;font-weight:600;">ImmoGest verrouillé</div>' +
      '<div style="color:rgba(255,255,255,0.6);font-size:13px;">Cliquez pour reprendre la session</div>' +
      '<button onclick="document.getElementById(\'lock-overlay\').remove()" style="margin-top:8px;padding:10px 28px;border-radius:8px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.12);color:#fff;font-size:14px;font-weight:600;cursor:pointer;">Déverrouiller</button>';
    document.body.appendChild(overlay);
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

  async function _updateDeclBadge() {
    try {
      var decls = await window.IG.db.select('declarations');
      var nb = (decls || []).filter(function(d) { return d.statut === 'pending'; }).length;
      var badge = document.getElementById('badge-declarations');
      if (!badge) return;
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
      // Charger settings momo pour le portail locataire
      try {
        var params = await window.IG.db.select('parametres');
        var settings = (params && params[0] && params[0].settings) || {};
        _data.settings = { momo_numeros: settings.momo_numeros || {} };
        // Injecter infos cabinet dans session.parametres pour les en-têtes de docs
        if (settings.cabinet && Object.keys(settings.cabinet).length) {
          var sess = window.IG.auth.getSession();
          sess.parametres = Object.assign(sess.parametres || {}, settings.cabinet);
        }
        // Charger la locale (devise, pays) depuis parametres.cabinet.pays
        var PAYS_DEVISE = {
          'Cameroun':'XAF','Sénégal':'XOF','Côte d\'Ivoire':'XOF','Mali':'XOF',
          'Burkina Faso':'XOF','Niger':'XOF','Togo':'XOF','Bénin':'XOF',
          'Guinée':'GNF','Nigeria':'NGN','Ghana':'GHS','Kenya':'KES',
          'Maroc':'MAD','Tunisie':'TND','Algérie':'DZD','Egypte':'EGP',
          'France':'EUR','Belgique':'EUR','Suisse':'CHF','Canada':'CAD',
          'USA':'USD','UK':'GBP','Gabon':'XAF','Congo':'XAF','Tchad':'XAF',
          'RDC':'CDF','Mauritanie':'MRU','Sénégal':'XOF'
        };
        var pays = (settings.cabinet && settings.cabinet.pays) || '';
        window.IG._locale = {
          pays: pays,
          devise: PAYS_DEVISE[pays] || (window.IG.auth.getSession() && window.IG.auth.getSession().locale) || 'XAF'
        };
      } catch(_) {}
      _setSyncStatus('ok');
      _updateSidebarImmeubles();
      _updateRelancesBadge();
      _updateCorbeilleBadge();
      _updateDeclBadge();
      if (window.IG.ads) window.IG.ads.renderUsageWidget();
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
    window._currentPage = page;
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
        if (window.IG.auth.getSession().role === 'locataire') { showPage('portail'); return; }
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
      case 'messages-wa':
        if (title) title.textContent = 'Messages WhatsApp';
        if (sub) sub.textContent = '';
        if (window.IG.messagesWA) window.IG.messagesWA.renderPage(_data); break;
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
    // Auto-ouvrir la section collapsible parente
    var sectionMap = {
      immeubles: 'immeubles',
      locataires: 'gestion', paiements: 'gestion', relances: 'gestion',
      rapports: 'gestion', statistiques: 'gestion', juridique: 'gestion'
    };
    var sectionId = sectionMap[page];
    if (sectionId) {
      var body = document.getElementById('sb-body-' + sectionId);
      var icon = document.getElementById('sb-icon-' + sectionId);
      if (body && !body.classList.contains('open')) {
        body.classList.add('open');
        if (icon) icon.textContent = '▾';
      }
    }
    // Mettre à jour bottom nav
    document.querySelectorAll('[id^="mbn-"]').forEach(function(b) {
      b.style.color = b.id === 'mbn-' + page ? 'var(--accent)' : 'var(--text3)';
    });
  }

  function renderCurrentPage() { showPage(_currentPage); }

  function reloadShell() {
    _showAppShell();
    _applyDarkMode();
    _renderLangPlan();
    document.title = 'ImmoGest — ' + t('Gestion Immobilière');
    showPage(_currentPage);
  }

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

  // ── Dashboard bailleur ────────────────────────────────────────
  function _renderDashboardBailleur() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var fmt = window.IG.utils.formatMontant;
    var session = window.IG.auth.getSession();
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();

    var imms = _data.immeubles;
    var locs = _data.locataires.filter(function(l) { return l.statut !== 'libre'; });
    var pays = _data.paiements.filter(function(p) {
      return parseInt(p.mois) === mois && parseInt(p.annee) === annee;
    });

    var totalAttendu = locs.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
    var totalEncaisse = pays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
    var nbImpayes = locs.filter(function(l) { return (parseInt(l.mois_arrieres) || 0) > 0; }).length;

    var gestTel = session.parametres && session.parametres.tel ? session.parametres.tel : null;

    var html = '<div class="content">' +
      '<div style="font-size:17px;font-weight:700;margin-bottom:4px">Bonjour, ' + esc(session.nom || 'Bailleur') + ' 👋</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:20px">' + now.toLocaleDateString('fr-FR', {month:'long', year:'numeric'}) + '</div>' +

      // KPIs
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px">' +
      _bKpi('🏢', imms.length, 'Immeuble(s)', 'var(--accent)') +
      _bKpi('👥', locs.length, 'Locataires actifs', 'var(--green)') +
      _bKpi('💰', fmt(totalEncaisse), 'Encaissé ce mois', 'var(--green)') +
      _bKpi('⚠️', nbImpayes, 'En retard', nbImpayes > 0 ? 'var(--red)' : 'var(--text3)') +
      '</div>' +

      // Immeubles
      '<h3 style="font-size:14px;font-weight:700;margin-bottom:12px">Mes immeubles</h3>' +
      '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">' +
      imms.map(function(imm) {
        var locsImm = _data.locataires.filter(function(l) { return l.immeuble_id == imm.id && l.statut !== 'libre'; });
        var paysImm = pays.filter(function(p) {
          return locsImm.some(function(l) { return l.id == p.locataire_id; });
        });
        var att = locsImm.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
        var enc = paysImm.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
        var taux = att > 0 ? Math.round((enc / att) * 100) : 0;
        var couleur = taux >= 80 ? 'var(--green)' : taux >= 50 ? '#E05A00' : 'var(--red)';
        return '<div class="card" style="padding:14px 16px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
          '<div>' +
          '<div style="font-weight:700;font-size:14px">' + esc(imm.nom_immeuble || imm.nom) + '</div>' +
          '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + esc(imm.ville || '') + (imm.quartier ? ' · ' + esc(imm.quartier) : '') + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
          '<div style="font-size:18px;font-weight:800;color:' + couleur + '">' + taux + '%</div>' +
          '<div style="font-size:10px;color:var(--text3)">recouvrement</div>' +
          '</div></div>' +
          '<div style="display:flex;gap:16px;margin-top:10px;font-size:12px;color:var(--text2)">' +
          '<span>' + locsImm.length + ' locataire(s)</span>' +
          '<span>Attendu : ' + fmt(att) + '</span>' +
          '<span>Encaissé : <strong style="color:var(--green)">' + fmt(enc) + '</strong></span>' +
          '</div></div>';
      }).join('') +
      '</div>' +

      // Bouton contacter gestionnaire
      (gestTel ?
        '<a href="https://wa.me/' + gestTel.replace(/[^0-9+]/g,'') + '?text=' + encodeURIComponent('Bonjour, je souhaite des informations concernant mes immeubles.') + '" target="_blank" ' +
        'style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;border-radius:12px;background:#25D366;color:#fff;font-size:14px;font-weight:700;text-decoration:none;margin-bottom:16px">' +
        '📱 Contacter mon gestionnaire</a>' : '') +

      '</div>';

    content.innerHTML = html;
  }

  function _bKpi(icon, val, label, color) {
    return '<div style="background:var(--bg2);border-radius:12px;padding:14px;text-align:center;border:1px solid var(--border)">' +
      '<div style="font-size:20px;margin-bottom:6px">' + icon + '</div>' +
      '<div style="font-size:16px;font-weight:800;color:' + color + '">' + val + '</div>' +
      '<div style="font-size:10px;color:var(--text3);margin-top:3px">' + label + '</div>' +
      '</div>';
  }

  // ── Dashboard ─────────────────────────────────────────────────
  function _renderDashboard() {
    var session = window.IG.auth.getSession();
    // Bailleur → vue dédiée
    if (session && session.role === 'bailleur') { _renderDashboardBailleur(); return; }

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
      '</div><div id="immeubles-liste"></div>' +
      '<div id="ig-ad-immeubles" style="margin-top:20px;text-align:center"></div></div>';
    if (window.IG.immeubles) window.IG.immeubles.renderListe(_data.locataires);
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-immeubles', 'ad1');
  }

  // ── Locataires ────────────────────────────────────────────────
  function _renderLocataires() {
    var content = document.getElementById('page-content');
    if (!content) return;
    _syncCaches();
    var imms = _data.immeubles || [];
    var immOptions = '<option value="">' + t('Tous les immeubles') + '</option>' +
      imms.map(function(i) {
        var sel = _currentImmeubleId == i.id ? ' selected' : '';
        return '<option value="' + i.id + '"' + sel + '>' + esc(i.nom_immeuble || i.nom) + '</option>';
      }).join('');

    content.innerHTML = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">' +
      '<h2 style="font-size:17px;font-weight:700">👥 ' + t('Locataires') + '</h2>' +
      '<button onclick="window.IG.locataires.afficherFormulaire()" style="padding:9px 16px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ ' + t('Ajouter') + '</button>' +
      '</div>' +
      // Filtres
      '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center">' +
      '<select id="loc-filtre-imm" onchange="window.IG.app._locFiltrer()" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' + immOptions + '</select>' +
      '<select id="loc-filtre-statut" onchange="window.IG.app._locFiltrer()" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
        '<option value="">' + t('Tous les statuts') + '</option>' +
        '<option value="actif">' + t('Actifs') + '</option>' +
        '<option value="impaye">⚠️ ' + t('Impayés') + '</option>' +
        '<option value="libre">🏠 ' + t('Libres') + '</option>' +
      '</select>' +
      '<input id="loc-search" placeholder="' + t('Rechercher...') + '" oninput="window.IG.app._locFiltrer()" ' +
        'style="padding:7px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;flex:1;min-width:140px;max-width:220px;color:var(--text)">' +
      '</div>' +
      '<div id="locataires-liste" style="overflow-x:auto"></div>' +
      '<div id="ig-ad-locataires" style="margin-top:20px;text-align:center"></div></div>';

    if (window.IG.locataires) window.IG.locataires.renderListeFiltree(_data.paiements, _currentImmeubleId, '');
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-locataires', 'ad2');
  }

  function _locFiltrer() {
    var immId = (document.getElementById('loc-filtre-imm') || {}).value || '';
    var statut = (document.getElementById('loc-filtre-statut') || {}).value || '';
    _currentImmeubleId = immId ? parseInt(immId) || immId : null;
    if (window.IG.locataires) window.IG.locataires.renderListeFiltree(_data.paiements, _currentImmeubleId, statut);
  }

  // ── Paiements ─────────────────────────────────────────────────
  function _renderPaiements() {
    var content = document.getElementById('page-content');
    if (!content) return;
    _syncCaches();
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();

    var immOptions = '<option value="">Tous les immeubles</option>' +
      _data.immeubles.map(function(i) {
        return '<option value="' + i.id + '">' + esc(i.nom_immeuble || i.nom) + '</option>';
      }).join('');

    var tabStyle = 'padding:8px 18px;border-radius:8px 8px 0 0;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:background .15s;';
    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0;flex-wrap:wrap;gap:10px">' +
      '<div style="display:flex;gap:0">' +
      '<button id="tab-encaissements" onclick="window.IG.app._payTab(\'enc\')" style="' + tabStyle + 'background:var(--accent);color:#fff">💰 ' + t('Encaissements') + '</button>' +
      '<button id="tab-caisse" onclick="window.IG.app._payTab(\'caisse\')" style="' + tabStyle + 'background:var(--bg3);color:var(--text2)">📊 Caisse du jour</button>' +
      '</div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<button onclick="window.IG.app._ouvrirSelLocataire()" style="padding:9px 16px;border-radius:10px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ Nouveau</button>' +
      '</div></div>' +
      '<div id="pay-tab-body" style="border:1px solid var(--border);border-radius:0 8px 8px 8px;padding:16px;background:var(--bg2)">' +
      // Onglet Encaissements
      '<div id="pay-enc-filters" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px">' +
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
      '</div>' +
      '<div id="pay-total-bar" style="margin-bottom:12px"></div>' +
      '<div id="ig-ad-paiements" style="margin-bottom:16px;text-align:center"></div>' +
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
      '</tr></thead><tbody id="pay-tbody"></tbody></table></div></div>' +
      '</div></div>';

    content.innerHTML = html;
    _refreshPaiements();
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-paiements', 'ad2');
  }

  function _payTab(tab) {
    var btnEnc    = document.getElementById('tab-encaissements');
    var btnCaisse = document.getElementById('tab-caisse');
    var body      = document.getElementById('pay-tab-body');
    if (!body) return;
    if (tab === 'caisse') {
      if (btnEnc)    { btnEnc.style.background = 'var(--bg3)'; btnEnc.style.color = 'var(--text2)'; }
      if (btnCaisse) { btnCaisse.style.background = 'var(--accent)'; btnCaisse.style.color = '#fff'; }
      _renderCaisseJour(body);
    } else {
      if (btnCaisse) { btnCaisse.style.background = 'var(--bg3)'; btnCaisse.style.color = 'var(--text2)'; }
      if (btnEnc)    { btnEnc.style.background = 'var(--accent)'; btnEnc.style.color = '#fff'; }
      // Remettre les encaissements
      showPage('paiements');
    }
  }

  function _renderCaisseJour(container) {
    var fmt = window.IG.utils.formatMontant;
    var today = new Date();
    var todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

    var paiementsJour = _data.paiements.filter(function(p) {
      return p.date_paiement && p.date_paiement.slice(0, 10) === todayStr;
    });

    var total = paiementsJour.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    // Par mode de paiement
    var modes = {};
    paiementsJour.forEach(function(p) {
      var m = p.mode_paiement || 'espèces';
      modes[m] = (modes[m] || 0) + (parseFloat(p.montant) || 0);
    });

    // À remettre au bailleur
    var aRemettre = paiementsJour.filter(function(p) { return !p.remisAuBailleur; });
    var totalAR = aRemettre.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    var dateFR = today.toLocaleDateString('fr-FR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

    var modeEmojis = { 'espèces': '💵', 'mobile money': '📱', 'virement': '🏦', 'chèque': '📝' };

    var html = '<div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">' +
      '<div style="font-size:12px;color:var(--text3);font-weight:600;text-transform:capitalize">' + dateFR + '</div>' +
      '<button onclick="window.IG.app._exportCaisseWA()" style="padding:8px 16px;border-radius:8px;border:none;background:#25D366;color:#fff;font-size:12px;font-weight:700;cursor:pointer">📱 Envoyer WhatsApp</button>' +
      '</div>' +

      // Carte totale
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">' +
      '<div style="background:var(--green);border-radius:12px;padding:16px;color:#fff;text-align:center">' +
      '<div style="font-size:11px;font-weight:700;opacity:.85;margin-bottom:6px;text-transform:uppercase">Total encaissé</div>' +
      '<div style="font-size:24px;font-weight:800">' + fmt(total) + '</div>' +
      '<div style="font-size:11px;opacity:.75;margin-top:4px">' + paiementsJour.length + ' paiement(s)</div>' +
      '</div>' +
      '<div style="background:var(--red);border-radius:12px;padding:16px;color:#fff;text-align:center">' +
      '<div style="font-size:11px;font-weight:700;opacity:.85;margin-bottom:6px;text-transform:uppercase">À remettre bailleur</div>' +
      '<div style="font-size:24px;font-weight:800">' + fmt(totalAR) + '</div>' +
      '<div style="font-size:11px;opacity:.75;margin-top:4px">' + aRemettre.length + ' paiement(s)</div>' +
      '</div></div>' +

      // Par mode
      (Object.keys(modes).length ? (
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">' +
        Object.entries(modes).map(function(kv) {
          return '<div style="flex:1;min-width:110px;background:var(--bg3);border-radius:10px;padding:12px;text-align:center">' +
            '<div style="font-size:18px;margin-bottom:4px">' + (modeEmojis[kv[0]] || '💳') + '</div>' +
            '<div style="font-size:11px;color:var(--text3);font-weight:600;text-transform:capitalize">' + esc(kv[0]) + '</div>' +
            '<div style="font-size:16px;font-weight:700;color:var(--text);margin-top:4px">' + fmt(kv[1]) + '</div>' +
            '</div>';
        }).join('') +
        '</div>'
      ) : '') +

      // Liste du jour
      (paiementsJour.length ? (
        '<div class="card" style="padding:0;overflow:hidden">' +
        '<div style="padding:10px 14px;background:var(--bg3);font-size:11px;text-transform:uppercase;font-weight:700;color:var(--text3)">Détail des paiements</div>' +
        paiementsJour.slice().reverse().map(function(p) {
          var loc = _data.locataires.find(function(l) { return l.id == p.locataire_id; });
          var imm = loc ? (window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null) : null;
          var badge = p.remisAuBailleur
            ? '<span style="font-size:10px;background:rgba(39,174,96,.1);color:var(--green);padding:2px 6px;border-radius:99px">Remis</span>'
            : '<span style="font-size:10px;background:rgba(185,48,32,.1);color:var(--red);padding:2px 6px;border-radius:99px">À remettre</span>';
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid var(--border)">' +
            '<div>' +
            '<div style="font-weight:600;font-size:13px">' + esc(loc ? loc.nom : '?') + '</div>' +
            '<div style="font-size:11px;color:var(--text3)">' + esc(imm ? (imm.nom_immeuble || imm.nom) : '—') + ' · ' + esc(p.mode_paiement || 'espèces') + ' · ' + esc(p.type || 'loyer') + '</div>' +
            '</div>' +
            '<div style="text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px">' +
            '<div style="font-weight:700;color:var(--green)">' + fmt(p.montant) + '</div>' +
            badge +
            '</div></div>';
        }).join('') +
        '</div>'
      ) : '<div style="text-align:center;padding:40px;color:var(--text3)">Aucun paiement enregistré aujourd\'hui</div>') +
      '</div>';

    container.innerHTML = html;
  }

  function _exportCaisseWA() {
    var fmt = window.IG.utils.formatMontant;
    var today = new Date().toISOString().slice(0, 10);
    var paiementsJour = _data.paiements.filter(function(p) {
      return p.date_paiement && p.date_paiement.slice(0, 10) === today;
    });
    if (!paiementsJour.length) { window.IG.utils.showToast('Aucun paiement aujourd\'hui', 'blue'); return; }

    var total = paiementsJour.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
    var aRem = paiementsJour.filter(function(p) { return !p.remisAuBailleur; });
    var totalAR = aRem.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var cab = session.nomCabinet || session.nom || 'Cabinet';
    var dateStr = new Date().toLocaleDateString('fr-FR');

    var lignes = paiementsJour.map(function(p) {
      var loc = _data.locataires.find(function(l) { return l.id == p.locataire_id; });
      return '• ' + (loc ? loc.nom : '?') + ' — ' + fmt(p.montant) + ' (' + (p.mode_paiement || 'espèces') + ')';
    }).join('\n');

    var msg = '*Caisse du ' + dateStr + ' — ' + cab + '*\n\n' +
      lignes + '\n\n' +
      '*Total encaissé : ' + fmt(total) + '*\n' +
      'À remettre bailleur : ' + fmt(totalAR) + '\n' +
      '(' + paiementsJour.length + ' paiement(s))';

    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }

  function _ouvrirSelLocataire() {
    var locs = (_data.locataires || []).filter(function(l) { return l.statut !== 'libre'; });
    if (!locs.length) { window.IG.utils.showToast('Aucun locataire actif', 'orange'); return; }

    var immMap = {};
    (_data.immeubles || []).forEach(function(i) { immMap[i.id] = i.nom_immeuble || i.nom; });

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(0,0,0,0.45);display:flex;align-items:flex-end;justify-content:center';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    var panel = document.createElement('div');
    panel.style.cssText = 'background:var(--bg);border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:500px;max-height:75vh;overflow-y:auto';
    panel.innerHTML =
      '<div style="font-size:15px;font-weight:700;margin-bottom:14px">Sélectionner un locataire</div>' +
      '<input id="sel-loc-q" placeholder="Rechercher..." oninput="window.IG.app._filtrerSelLoc()" ' +
        'style="width:100%;box-sizing:border-box;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);margin-bottom:10px">' +
      '<div id="sel-loc-list">' +
      locs.map(function(l) {
        return '<div onclick="window.IG.app._selLoc(' + l.id + ')" data-nom="' + esc((l.nom || '').toLowerCase()) + '" ' +
          'style="padding:11px 12px;border-radius:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border);margin-bottom:6px" ' +
          'onmouseenter="this.style.background=\'var(--bg3)\'" onmouseleave="this.style.background=\'\'">' +
          '<div><div style="font-weight:600;font-size:13px">' + esc(l.nom) + '</div>' +
          '<div style="font-size:11px;color:var(--text3)">' + esc(immMap[l.immeuble_id] || '—') + ' · Local ' + esc(l.appt || '?') + '</div></div>' +
          '<div style="font-size:13px;font-weight:700;color:var(--green)">' + window.IG.utils.formatMontant(l.loyer) + '</div></div>';
      }).join('') +
      '</div>';

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    setTimeout(function() { var el = document.getElementById('sel-loc-q'); if (el) el.focus(); }, 100);
  }

  function _filtrerSelLoc() {
    var q = ((document.getElementById('sel-loc-q') || {}).value || '').toLowerCase();
    (document.querySelectorAll('#sel-loc-list > div') || []).forEach(function(el) {
      el.style.display = (!q || (el.dataset.nom || '').includes(q)) ? '' : 'none';
    });
  }

  function _selLoc(locId) {
    // Fermer overlay
    var overlay = document.querySelector('[style*="inset:0"][style*="z-index:900"]');
    if (overlay) overlay.remove();
    if (window.IG.paiements) window.IG.paiements.afficherFormulaire(locId, function() {
      showPage('paiements');
    });
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
        '<button onclick="window.IG.app._confirmerSupprPaiement(' + p.id + ',\'' + esc(loc ? loc.nom : '?') + '\',' + (parseFloat(p.montant)||0) + ')" ' +
          'style="border:none;background:none;color:var(--red);cursor:pointer;font-size:18px;font-weight:700">×</button></td></tr>';
    }).join('');
  }

  function _confirmerSupprPaiement(id, nomLoc, montant) {
    var fmt = window.IG.utils.formatMontant;
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:910;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = '<div style="background:var(--bg);border-radius:14px;padding:24px;max-width:360px;width:90%;text-align:center">' +
      '<div style="font-size:32px;margin-bottom:12px">⚠️</div>' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:8px">Supprimer ce paiement ?</div>' +
      '<div style="font-size:13px;color:var(--text2);margin-bottom:20px">' + esc(nomLoc) + ' — ' + fmt(montant) + '<br>Cette action est irréversible.</div>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button onclick="this.closest(\'[style*=inset]\').remove()" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;cursor:pointer">Annuler</button>' +
      '<button onclick="window.IG.paiements.annuler(' + id + ');this.closest(\'[style*=inset]\').remove();window.IG.app._refreshPaiements()" ' +
        'style="flex:1;padding:10px;border-radius:8px;border:none;background:var(--red);color:#fff;font-size:13px;font-weight:700;cursor:pointer">Supprimer</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
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
  function _sectionTitle(icon, label) {
    return '<div style="display:flex;align-items:center;gap:8px;margin:24px 0 12px;padding-bottom:8px;border-bottom:2px solid var(--border)">' +
      '<span style="font-size:16px">' + icon + '</span>' +
      '<span style="font-size:14px;font-weight:700;color:var(--text)">' + label + '</span>' +
      '</div>';
  }
  function _fieldInput(id, label, placeholder, type) {
    return '<div style="margin-bottom:10px">' +
      '<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">' + label + '</label>' +
      '<input id="' + id + '" type="' + (type || 'text') + '" placeholder="' + placeholder + '" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;box-sizing:border-box"></div>';
  }

  function _renderParametres() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var session = window.IG.auth.getSession();
    var isAdmin = session.role === 'admin';
    var isFinance = ['admin','comptable'].includes(session.role);
    var planColor = { gratuit: '#888', trial: '#E07B00', starter: '#0E6AAF', pro: '#0E7A45', cabinet: '#7B2FBE' }[session.plan || 'gratuit'] || '#888';

    // ── Onglets disponibles selon le rôle ──
    var tabs = [
      { id: 'compte',    icon: '👤', label: 'Mon compte',   always: true },
      { id: 'cabinet',   icon: '🏢', label: 'Cabinet',      show: isAdmin },
      { id: 'equipe',    icon: '👥', label: 'Équipe',       show: isAdmin },
      { id: 'prefs',     icon: '🎛️', label: 'Préférences',  always: true },
      { id: 'finances',  icon: '💼', label: 'Finances',     show: isFinance },
    ].filter(function(tab) { return tab.always || tab.show; });

    var tabBtns = tabs.map(function(tab, i) {
      return '<button onclick="window.IG.app._paramTab(\'' + tab.id + '\')" id="ptab-' + tab.id + '" ' +
        'style="display:flex;align-items:center;gap:6px;padding:9px 16px;border:none;border-bottom:2px solid ' + (i === 0 ? 'var(--accent)' : 'transparent') + ';' +
        'background:transparent;color:' + (i === 0 ? 'var(--accent)' : 'var(--text3)') + ';' +
        'font-size:13px;font-weight:' + (i === 0 ? '700' : '500') + ';cursor:pointer;white-space:nowrap;transition:all .15s">' +
        '<span>' + tab.icon + '</span><span>' + tab.label + '</span></button>';
    }).join('');

    // ── Contenu onglet Compte ──
    var tabCompte =
      '<div class="card" style="margin-bottom:12px">' +
      '<div class="card-header"><div class="card-title">👤 Informations du compte</div></div>' +
      '<div class="card-body" style="display:flex;flex-direction:column;gap:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;color:var(--text2)">Nom</span><strong style="font-size:13px">' + esc(session.nom) + '</strong></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;color:var(--text2)">Téléphone</span><strong style="font-size:13px">' + esc(session.telephone || '—') + '</strong></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;color:var(--text2)">Rôle</span><strong style="font-size:13px">' + esc(session.role || '—') + '</strong></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;color:var(--text2)">Plan</span>' +
      '<span style="background:' + planColor + ';color:#fff;padding:3px 12px;border-radius:99px;font-size:11px;font-weight:700">' + (session.plan || 'GRATUIT').toUpperCase() + '</span></div>' +
      (session.plan_expire ? '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:13px;color:var(--text2)">Expire le</span><span style="font-size:13px">' + new Date(session.plan_expire).toLocaleDateString('fr-FR') + '</span></div>' : '') +
      '</div></div>' +

      '<div class="card" style="margin-bottom:12px">' +
      '<div class="card-header"><div class="card-title">🎁 Code promotionnel</div></div>' +
      '<div class="card-body">' +
      '<div style="display:flex;gap:8px">' +
      '<input id="promo-input" type="text" placeholder="Entrez votre code promo" style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px">' +
      '<button onclick="window.IG.app._appliquerPromo()" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Appliquer</button>' +
      '</div><div id="promo-msg" style="margin-top:8px;font-size:12px"></div>' +
      '</div></div>' +

      '<div id="plans-bloc"></div>' +

      '<div style="padding-top:4px">' +
      '<button onclick="window.IG.auth.logout()" style="padding:10px 20px;border-radius:10px;border:1.5px solid var(--red);color:var(--red);background:transparent;cursor:pointer;font-weight:600;font-size:13px">🚪 Se déconnecter</button>' +
      '</div>';

    // ── Contenu onglet Cabinet ──
    var tabCabinet = isAdmin ? (
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">🏢 Informations du cabinet</div></div>' +
      '<div class="card-body">' +
      '<p style="font-size:12px;color:var(--text3);margin-bottom:16px">Ces informations apparaissent dans les en-têtes de vos fiches, reçus et rapports.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">' +
      _fieldInput('cab-nom',        'Nom du cabinet',         'Ex: Cabinet CRAA') +
      _fieldInput('cab-signataire', 'Signataire',             'Prénom Nom du responsable') +
      _fieldInput('cab-adresse',    'Adresse',                'Rue, quartier') +
      _fieldInput('cab-ville',      'Ville',                  'Ex: Yaoundé') +
      window.IG.utils.phoneField('cab-tel', 'Téléphone', '', false) +
      _fieldInput('cab-email',      'Email professionnel',    'contact@votrecabinet.com', 'email') +
      _fieldInput('cab-rccm',       t('Registre / Numéro fiscal'),   t('Ex: RC/YAE/2020/B/XXX')) +
      _fieldInput('cab-logo',       'URL du logo',            'https://... (lien image)') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-top:8px">' +
      '<button onclick="window.IG.app._sauvegarderCabinet()" style="padding:9px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">💾 Enregistrer</button>' +
      '<span id="cab-saved" style="font-size:12px;color:var(--green);display:none">✓ Sauvegardé</span>' +
      '</div></div></div>'
    ) : '';

    // ── Contenu onglet Équipe ──
    var tabEquipe = isAdmin ? (
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">👥 Équipe & Invitations</div>' +
      '<button onclick="window.IG.app._genererInvitation()" style="padding:7px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">＋ Inviter collaborateur</button>' +
      '</div>' +
      '<div id="equipe-body"><div style="text-align:center;padding:24px"><div class="spinner" style="margin:0 auto"></div></div></div>' +
      '</div>'
    ) : '';

    // ── Contenu onglet Préférences ──
    var tabPrefs =
      '<div class="card" style="margin-bottom:12px">' +
      '<div class="card-header"><div class="card-title">🌐 Langue de l\'interface</div></div>' +
      '<div class="card-body">' +
      '<select onchange="window.IG.i18n.setLang(this.value)" style="padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);width:100%;max-width:320px">' +
      [['fr','🇫🇷 Français'],['en','🇬🇧 English'],['pt','🇧🇷 Português'],['es','🇪🇸 Español'],['ha','Hausa'],['ar','العربية'],['sw','🇰🇪 Kiswahili'],['zh','🇨🇳 中文'],['hi','🇮🇳 हिन्दी'],['id','🇮🇩 Bahasa Indonesia'],['yo','Yorùbá'],['ln','Lingála'],['am','አማርኛ']].map(function(l) {
        return '<option value="' + l[0] + '"' + (window.IG.i18n && window.IG.i18n.lang === l[0] ? ' selected' : '') + '>' + l[1] + '</option>';
      }).join('') + '</select>' +
      '</div></div>' +

      '<div class="card">' +
      '<div class="card-header"><div class="card-title">🏠 Publication Marketplace</div></div>' +
      '<div class="card-body">' +
      '<p style="font-size:12px;color:var(--text3);margin-bottom:10px">Quand un local est libéré, ImmoGest crée automatiquement une pré-annonce.</p>' +
      '<select id="select-mode-publication" onchange="window.IG.app._sauvegarderModePublication(this.value)" style="padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);width:100%;max-width:400px">' +
      '<option value="manuel">📝 Manuel — le gestionnaire valide avant publication</option>' +
      '<option value="auto">⚡ Automatique — publié immédiatement à la libération</option>' +
      '<option value="proprio">👤 Validation propriétaire — notification envoyée au proprio</option>' +
      '</select>' +
      '<div id="mode-publication-saved" style="font-size:11px;color:var(--green);margin-top:6px;display:none">✓ Sauvegardé</div>' +
      '</div></div>';

    // ── Contenu onglet Finances ──
    var tabFinances = isFinance ? (
      '<div class="card" style="margin-bottom:12px">' +
      '<div class="card-header"><div class="card-title">📱 Numéros Mobile Money</div></div>' +
      '<div class="card-body">' +
      '<p style="font-size:12px;color:var(--text3);margin-bottom:14px">Numéros affichés aux locataires pour payer leur loyer. Laissez vide les opérateurs non utilisés.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">' +
      [
        { key:'orange_money', label:'Orange Money 🟠', placeholder:'699 00 00 00' },
        { key:'mtn_momo',     label:'MTN MoMo 💛',    placeholder:'677 00 00 00' },
        { key:'wave',         label:'Wave 🌊',         placeholder:'70 00 00 00'  },
        { key:'airtel',       label:'Airtel Money 🔴', placeholder:'666 00 00 00' },
        { key:'moov',         label:'Moov Money 🔵',  placeholder:'668 00 00 00' },
      ].map(function(op) {
        return '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">' + op.label + '</label>' +
          '<input id="momo-' + op.key + '" type="tel" placeholder="' + op.placeholder + '" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;box-sizing:border-box"></div>';
      }).join('') +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-top:4px">' +
      '<button onclick="window.IG.app._sauvegarderMomo()" style="padding:9px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">💾 Enregistrer</button>' +
      '<span id="momo-saved" style="font-size:12px;color:var(--green);display:none">✓ Sauvegardé</span>' +
      '</div></div></div>' +

      (isAdmin ? (
        '<div class="card">' +
        '<div class="card-header"><div class="card-title">🤖 Clé API Anthropic (IA)</div></div>' +
        '<div class="card-body">' +
        '<p style="font-size:12px;color:var(--text3);margin-bottom:10px">Chaque admin intègre et paie sa propre clé. Vos données IA restent privées.</p>' +
        '<div style="display:flex;gap:8px;max-width:480px">' +
        '<input id="ai-api-key-input" type="password" placeholder="sk-ant-api03-..." style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;font-family:monospace">' +
        '<button onclick="window.IG.app._sauvegarderCleIA()" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Enregistrer</button>' +
        '</div><div id="ai-key-status" style="margin-top:8px;font-size:12px"></div>' +
        '</div></div>'
      ) : '')
    ) : '';

    // ── Assemblage final ──
    var html = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:16px">⚙️ ' + t('Paramètres') + '</h2>' +

      // Barre d'onglets horizontale
      '<div style="display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:20px;overflow-x:auto;scrollbar-width:none">' +
      tabBtns +
      '</div>' +

      // Panneaux
      '<div id="ppanel-compte">'   + tabCompte   + '</div>' +
      '<div id="ppanel-cabinet"  style="display:none">' + tabCabinet  + '</div>' +
      '<div id="ppanel-equipe"   style="display:none">' + tabEquipe   + '</div>' +
      '<div id="ppanel-prefs"    style="display:none">' + tabPrefs    + '</div>' +
      '<div id="ppanel-finances" style="display:none">' + tabFinances + '</div>' +

      '</div>';

    content.innerHTML = html;
    if (window.IG.plans) window.IG.plans.renderBlocPlan('plans-bloc');
    if (isAdmin) { _chargerEquipe(); _chargerCleIA(); _chargerCabinet(); }
    if (isFinance) _chargerMomo();
    _chargerModePublication();
  }

  // ── Switcher onglets paramètres ──
  function _paramTab(id) {
    ['compte','cabinet','equipe','prefs','finances'].forEach(function(tid) {
      var panel = document.getElementById('ppanel-' + tid);
      var btn   = document.getElementById('ptab-' + tid);
      if (!panel || !btn) return;
      var active = tid === id;
      panel.style.display = active ? 'block' : 'none';
      btn.style.borderBottomColor = active ? 'var(--accent)' : 'transparent';
      btn.style.color  = active ? 'var(--accent)' : 'var(--text3)';
      btn.style.fontWeight = active ? '700' : '500';
    });
    // Charger à la demande
    if (id === 'equipe' && window.IG.auth.getSession().role === 'admin') _chargerEquipe();
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

  async function _sauvegarderMomo() {
    var keys = ['orange_money','mtn_momo','wave','airtel','moov'];
    var momo = {};
    keys.forEach(function(k) {
      var el = document.getElementById('momo-' + k);
      if (el && el.value.trim()) momo[k] = el.value.trim();
    });
    try {
      var params = await window.IG.db.select('parametres');
      var row = params && params[0];
      var settings = (row && row.settings) || {};
      settings.momo_numeros = momo;
      if (row) {
        await window.IG.db.update('parametres', row.id, { settings });
      } else {
        var session = window.IG.auth.getSession();
        await window.IG.db.insert('parametres', [{ tenant_id: session.tenantId, settings }]);
      }
      // Mise à jour cache _data
      _data.settings = _data.settings || {};
      _data.settings.momo_numeros = momo;
      var msg = document.getElementById('momo-saved');
      if (msg) { msg.style.display = 'inline'; setTimeout(function() { msg.style.display = 'none'; }, 2000); }
    } catch(e) {
      window.IG.utils.showToast('Erreur : ' + e.message, 'red');
    }
  }

  async function _chargerMomo() {
    var keys = ['orange_money','mtn_momo','wave','airtel','moov'];
    try {
      var params = await window.IG.db.select('parametres');
      var settings = (params && params[0] && params[0].settings) || {};
      var momo = settings.momo_numeros || {};
      keys.forEach(function(k) {
        var el = document.getElementById('momo-' + k);
        if (el) el.value = momo[k] || '';
      });
      _data.settings = _data.settings || {};
      _data.settings.momo_numeros = momo;
    } catch(e) {}
  }

  async function _sauvegarderCabinet() {
    var fields = ['nom','adresse','ville','email','rccm','signataire','logo'];
    var cab = {};
    fields.forEach(function(f) {
      var el = document.getElementById('cab-' + f);
      if (el && el.value.trim()) cab[f === 'logo' ? 'logo_url' : f] = el.value.trim();
    });
    var telVal = window.IG.utils.phoneFieldValue('cab-tel');
    if (telVal) cab.tel = telVal;
    // Ajout de la clé nom_cabinet séparément (alias attendu par paiements.js)
    if (cab.nom) cab.nom_cabinet = cab.nom;
    try {
      var params = await window.IG.db.select('parametres');
      var row = params && params[0];
      var settings = (row && row.settings) || {};
      settings.cabinet = cab;
      if (row) {
        await window.IG.db.update('parametres', row.id, { settings });
      } else {
        var session = window.IG.auth.getSession();
        await window.IG.db.insert('parametres', [{ tenant_id: session.tenantId, settings }]);
      }
      // Injecter dans session.parametres pour que les docs l'utilisent immédiatement
      var sess = window.IG.auth.getSession();
      sess.parametres = Object.assign(sess.parametres || {}, cab);
      var msg = document.getElementById('cab-saved');
      if (msg) { msg.style.display = 'inline'; setTimeout(function() { msg.style.display = 'none'; }, 2500); }
    } catch(e) {
      window.IG.utils.showToast('Erreur : ' + e.message, 'red');
    }
  }

  async function _chargerCabinet() {
    try {
      var params = await window.IG.db.select('parametres');
      var settings = (params && params[0] && params[0].settings) || {};
      var cab = settings.cabinet || {};
      var map = { nom: 'nom', adresse: 'adresse', ville: 'ville', email: 'email', rccm: 'rccm', signataire: 'signataire', logo: 'logo_url' };
      Object.keys(map).forEach(function(f) {
        var el = document.getElementById('cab-' + f);
        if (el) el.value = cab[map[f]] || '';
      });
      // Pré-remplir le phoneField du téléphone cabinet
      if (cab.tel) {
        var hidden = document.getElementById('cab-tel');
        var numEl = document.getElementById('cab-tel_num');
        if (hidden) hidden.value = cab.tel;
        if (numEl) {
          var parts = cab.tel.match(/^(\+\d+)\s*(.*)$/);
          if (parts) {
            var sel = document.getElementById('cab-tel_code');
            if (sel) sel.value = parts[1];
            numEl.value = parts[2];
          } else {
            numEl.value = cab.tel;
          }
        }
      }
      // Injecter dans session.parametres pour les docs
      if (Object.keys(cab).length) {
        var sess = window.IG.auth.getSession();
        sess.parametres = Object.assign(sess.parametres || {}, cab);
      }
    } catch(e) {}
  }

  async function _sauvegarderCleIA() {
    var input = document.getElementById('ai-api-key-input');
    var status = document.getElementById('ai-key-status');
    if (!input) return;
    var key = input.value.trim();
    try {
      var params = await window.IG.db.select('parametres');
      var row = params && params[0];
      var settings = (row && row.settings) || {};
      settings.anthropic_key = key;
      if (row) {
        await window.IG.db.update('parametres', row.id, { settings });
      } else {
        var session = window.IG.auth.getSession();
        await window.IG.db.insert('parametres', [{ tenant_id: session.tenantId, settings }]);
      }
      // Mettre à jour la session en mémoire
      if (window.IG.auth && window.IG.auth.getSession) {
        window.IG.auth.getSession().parametres = window.IG.auth.getSession().parametres || {};
        window.IG.auth.getSession().parametres.anthropic_key = key;
      }
      input.value = key ? '••••••••••••••••••••' : '';
      if (status) { status.style.color = 'var(--green)'; status.textContent = key ? '✓ Clé enregistrée — l\'IA utilisera votre compte Anthropic' : '✓ Clé supprimée — retour à la clé partagée'; }
    } catch(e) {
      if (status) { status.style.color = 'var(--red)'; status.textContent = 'Erreur : ' + e.message; }
    }
  }

  async function _chargerCleIA() {
    var input = document.getElementById('ai-api-key-input');
    var status = document.getElementById('ai-key-status');
    if (!input) return;
    try {
      var params = await window.IG.db.select('parametres');
      var settings = (params && params[0] && params[0].settings) || {};
      var key = settings.anthropic_key || '';
      input.value = key ? '••••••••••••••••••••' : '';
      if (status && key) { status.style.color = 'var(--green)'; status.textContent = '✓ Clé active — l\'IA utilise votre compte Anthropic'; }
      // Stocker en session pour les appels
      if (key && window.IG.auth) {
        var s = window.IG.auth.getSession();
        if (s) { s.parametres = s.parametres || {}; s.parametres.anthropic_key = key; }
      }
    } catch(e) {}
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
      if (!users) users = [];
      var COLLAB_ROLES = ['admin','coordinateur','gestionnaire','comptable','agent'];
      var collabs   = users.filter(function(u) { return COLLAB_ROLES.includes(u.role); });
      var proprios  = users.filter(function(u) { return u.role === 'bailleur'; });
      var locUsers  = users.filter(function(u) { return u.role === 'locataire'; });

      var ROLE_ICONS = { admin:'👑', coordinateur:'🎯', gestionnaire:'🏘️', comptable:'📊', agent:'🤝', bailleur:'🏠', locataire:'🔑' };

      function _jRestants(dateStr) {
        if (!dateStr) return null;
        var diff = Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
        return diff;
      }
      function _badgeActif(u) {
        if (u.actif === false) return '<span style="font-size:10px;color:#fff;background:var(--red);padding:1px 7px;border-radius:4px;font-weight:700;margin-left:6px">BLOQUÉ</span>';
        if (u.date_blocage_auto) {
          var j = _jRestants(u.date_blocage_auto);
          if (j !== null && j <= 0) return '<span style="font-size:10px;color:#fff;background:var(--red);padding:1px 7px;border-radius:4px;font-weight:700;margin-left:6px">BLOQUÉ</span>';
          var motifs = { liberation:'libéré', contrat_rompu:'contrat rompu', manuel:'manuel' };
          return '<span style="font-size:10px;color:#fff;background:#E07B00;padding:1px 7px;border-radius:4px;font-weight:700;margin-left:6px">⏳ ' + (j !== null ? j + 'j' : '') + '</span>' +
            '<span style="font-size:10px;color:var(--text3);margin-left:4px">' + (motifs[u.motif_blocage] || '') + '</span>';
        }
        return '';
      }
      function _actions(u, showCode) {
        var btns = '';
        if (showCode) {
          var code = esc(u.code_invitation || u.code || '—');
          btns += '<span style="font-family:monospace;font-size:12px;background:var(--bg3);padding:3px 8px;border-radius:6px;margin-right:4px;cursor:pointer" onclick="navigator.clipboard.writeText(\'' + code + '\');window.IG.utils.showToast(\'Code copié ✓\',\'green\')" title="Cliquer pour copier">' + code + ' 📋</span>';
          btns += '<button onclick="window.IG.app._resetCodeUser(\'' + u.id + '\',\'' + esc(u.nom) + '\')" style="padding:3px 9px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:11px;margin-right:4px">🔄 Réinit.</button>';
        }
        if (u.role !== 'admin') {
          var active = u.actif !== false;
          // Si blocage planifié ou déjà bloqué → proposer Réintégrer
          if (!active || u.date_blocage_auto) {
            btns += '<button onclick="window.IG.app._reintegrerUser(\'' + u.id + '\',\'' + esc(u.nom) + '\')" style="padding:3px 9px;border-radius:6px;border:1px solid var(--green);color:var(--green);background:var(--bg4);cursor:pointer;font-size:11px;margin-right:4px">🔓 Réintégrer</button>';
          }
          btns += '<button onclick="window.IG.app._toggleUser(\'' + u.id + '\',' + active + ')" style="padding:3px 9px;border-radius:6px;border:1px solid ' + (active ? 'var(--red)' : 'var(--green)') + ';color:' + (active ? 'var(--red)' : 'var(--green)') + ';background:var(--bg4);cursor:pointer;font-size:11px">' + (active ? '🔒 Bloquer' : '✓ Débloquer') + '</button>';
        }
        return btns;
      }

      function _userRow(u, showCode) {
        var hasOverrides = u.permissions && Object.keys(u.permissions).length > 0;
        var hasImmeubles = u.immeubles_assignes && u.immeubles_assignes.length > 0;
        var droitsBadge = (hasOverrides || hasImmeubles)
          ? '<span style="font-size:10px;background:var(--accent);color:#fff;padding:1px 5px;border-radius:4px;margin-left:5px">⚙</span>' : '';
        var code = u.password || null;

        if (showCode) {
          // Carte étendue pour proprio / locataire — affiche le mot de passe portail
          var tel = u.telephone || '—';
          var codeHtml = code
            ? '<div style="margin-top:6px;background:var(--bg3);border-radius:8px;padding:8px 10px">' +
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">' +
              '<span style="font-size:10px;color:var(--text3);min-width:60px">📱 Login</span>' +
              '<span style="font-family:monospace;font-size:13px;font-weight:700;color:var(--text)">' + esc(tel) + '</span></div>' +
              '<div style="display:flex;align-items:center;gap:8px">' +
              '<span style="font-size:10px;color:var(--text3);min-width:60px">🔑 MP</span>' +
              '<span style="font-family:monospace;font-size:15px;font-weight:800;letter-spacing:3px;color:var(--accent);cursor:pointer" ' +
              'onclick="navigator.clipboard.writeText(\'' + esc(tel) + ' / ' + esc(code) + '\');window.IG.utils.showToast(\'Login + MP copiés ✓\',\'green\')" title="Cliquer pour copier login+MP">' +
              esc(code) + ' 📋</span></div></div>'
            : '<div style="margin-top:6px;font-size:11px;color:var(--text3);font-style:italic">Aucun mot de passe défini</div>';

          return '<div style="padding:12px 0;border-bottom:1px solid var(--border)">' +
            // Ligne principale : nom + badges + actions
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">' +
            '<div style="min-width:0">' +
            '<div style="font-size:13px;font-weight:700">' + (ROLE_ICONS[u.role] || '👤') + ' ' + esc(u.nom || u.id) + _badgeActif(u) + droitsBadge + '</div>' +
            '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + esc(u.telephone || '—') + '</div>' +
            codeHtml +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0">' +
            '<button onclick="window.IG.app._ouvrirDroits(\'' + u.id + '\')" style="padding:4px 10px;border-radius:6px;border:1px solid var(--accent);color:var(--accent);background:var(--bg4);cursor:pointer;font-size:11px">⚙️ Droits</button>' +
            '<button onclick="window.IG.app._resetCodeUser(\'' + u.id + '\',\'' + esc(u.nom) + '\')" style="padding:4px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:11px">🔄 Réinit. MP</button>' +
            _actionsExtra(u) +
            '</div></div></div>';
        }

        // Ligne compacte pour collaborateurs
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">' +
          '<div style="min-width:0"><div style="font-size:13px;font-weight:600">' + (ROLE_ICONS[u.role] || '👤') + ' ' + esc(u.nom || u.id) + _badgeActif(u) + droitsBadge + '</div>' +
          '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + esc(u.role || '') + (u.telephone ? ' · ' + esc(u.telephone) : '') + '</div></div>' +
          '<div style="display:flex;align-items:center;gap:4px;flex-shrink:0">' +
          '<button onclick="window.IG.app._ouvrirDroits(\'' + u.id + '\')" style="padding:3px 9px;border-radius:6px;border:1px solid var(--accent);color:var(--accent);background:var(--bg4);cursor:pointer;font-size:11px">⚙️ Droits</button>' +
          _actionsExtra(u) + '</div></div>';
      }

      function _actionsExtra(u) {
        var btns = '';
        if (u.role !== 'admin') {
          var active = u.actif !== false;
          if (!active || u.date_blocage_auto) {
            btns += '<button onclick="window.IG.app._reintegrerUser(\'' + u.id + '\',\'' + esc(u.nom) + '\')" style="padding:4px 10px;border-radius:6px;border:1px solid var(--green);color:var(--green);background:var(--bg4);cursor:pointer;font-size:11px">🔓 Réintégrer</button>';
          }
          btns += '<button onclick="window.IG.app._toggleUser(\'' + u.id + '\',' + active + ')" style="padding:4px 10px;border-radius:6px;border:1px solid ' + (active ? 'var(--red)' : 'var(--green)') + ';color:' + (active ? 'var(--red)' : 'var(--green)') + ';background:var(--bg4);cursor:pointer;font-size:11px">' + (active ? '🔒 Bloquer' : '✓ Débloquer') + '</button>';
        }
        return btns;
      }

      // ── Tab : Collaborateurs
      var htmlCollab = collabs.length
        ? collabs.map(function(u) { return _userRow(u, false); }).join('')
        : '<p style="color:var(--text3);font-size:13px;padding:12px 0;text-align:center">Aucun collaborateur</p>';

      // ── Tab : Propriétaires
      var htmlProprio = proprios.length
        ? proprios.map(function(u) { return _userRow(u, true); }).join('')
        : '<p style="color:var(--text3);font-size:13px;padding:12px 0;text-align:center">Aucun propriétaire enregistré</p>';

      // ── Tab : Locataires (groupés par immeuble)
      var immeublesData = _data.locataires ? _data.immeubles || [] : [];
      var locatairesData = _data.locataires || [];
      // Mapper user locataire → locataire → immeuble_id
      var grouped = {};
      locUsers.forEach(function(u) {
        var loc = locatairesData.find(function(l) { return l.nom && u.nom && l.nom.trim().toLowerCase() === u.nom.trim().toLowerCase(); })
                || locatairesData.find(function(l) { return l.telephone && u.telephone && l.telephone === u.telephone; });
        // Enrichir le téléphone depuis locataires si users_app ne l'a pas
        if (loc && loc.telephone && !u.telephone) u.telephone = loc.telephone;
        var immId = (loc && loc.immeuble_id) ? String(loc.immeuble_id) : '__sans_immeuble';
        grouped[immId] = grouped[immId] || { imm: null, users: [] };
        if (!grouped[immId].imm && loc) {
          var imm = immeublesData.find(function(i) { return String(i.id) === String(loc.immeuble_id); });
          grouped[immId].imm = imm;
        }
        grouped[immId].users.push(u);
      });
      var htmlLoc = '';
      if (!locUsers.length) {
        htmlLoc = '<p style="color:var(--text3);font-size:13px;padding:12px 0;text-align:center">Aucun locataire avec accès portail</p>';
      } else {
        Object.keys(grouped).forEach(function(immId, idx) {
          var g = grouped[immId];
          var nom = g.imm ? esc(g.imm.nom_immeuble || g.imm.nom) : 'Sans immeuble';
          var bodyId = 'eq-imm-' + idx;
          htmlLoc += '<div style="border:1px solid var(--border);border-radius:8px;margin-bottom:8px;overflow:hidden">' +
            '<div onclick="var b=document.getElementById(\'' + bodyId + '\');b.style.display=b.style.display===\'none\'?\'block\':\'none\';this.querySelector(\'.eq-arrow\').textContent=b.style.display===\'none\'?\'▶\':\'▼\'" ' +
            'style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);cursor:pointer;font-size:13px;font-weight:600">' +
            '🏢 ' + nom + ' <span style="display:flex;align-items:center;gap:8px"><span style="font-size:11px;font-weight:400;color:var(--text3)">' + g.users.length + ' locataire' + (g.users.length > 1 ? 's' : '') + '</span><span class="eq-arrow">▼</span></span></div>' +
            '<div id="' + bodyId + '" style="padding:0 14px">' +
            g.users.map(function(u) { return _userRow(u, true); }).join('') +
            '</div></div>';
        });
      }

      var tabs = [
        { id:'collab', label:'Collaborateurs', count: collabs.length, html: htmlCollab },
        { id:'proprio', label:'Propriétaires', count: proprios.length, html: htmlProprio },
        { id:'loc', label:'Locataires', count: locUsers.length, html: htmlLoc }
      ];

      var tabBar = '<div style="display:flex;gap:4px;margin-bottom:14px;border-bottom:2px solid var(--border);padding-bottom:0">' +
        tabs.map(function(tab, i) {
          return '<button id="eq-tab-' + tab.id + '" onclick="window.IG.app._equipeTab(\'' + tab.id + '\')" ' +
            'style="padding:8px 14px;border:none;border-bottom:' + (i === 0 ? '2px solid var(--accent)' : '2px solid transparent') + ';background:transparent;cursor:pointer;font-size:12px;font-weight:' + (i === 0 ? '700' : '400') + ';color:' + (i === 0 ? 'var(--accent)' : 'var(--text3)') + ';margin-bottom:-2px">' +
            tab.label + ' <span style="font-size:11px;background:var(--bg3);padding:1px 6px;border-radius:99px">' + tab.count + '</span></button>';
        }).join('') + '</div>' +
        tabs.map(function(tab, i) {
          return '<div id="eq-panel-' + tab.id + '" style="display:' + (i === 0 ? 'block' : 'none') + '">' + tab.html + '</div>';
        }).join('');

      el.innerHTML = tabBar;
    } catch(e) {
      el.innerHTML = '<p style="color:var(--text3);font-size:13px;padding:16px">' + e.message + '</p>';
    }
  }

  function _equipeTab(tabId) {
    var ids = ['collab','proprio','loc'];
    ids.forEach(function(id) {
      var btn = document.getElementById('eq-tab-' + id);
      var panel = document.getElementById('eq-panel-' + id);
      var active = id === tabId;
      if (btn) {
        btn.style.borderBottom = active ? '2px solid var(--accent)' : '2px solid transparent';
        btn.style.fontWeight = active ? '700' : '400';
        btn.style.color = active ? 'var(--accent)' : 'var(--text3)';
      }
      if (panel) panel.style.display = active ? 'block' : 'none';
    });
  }

  async function _resetCodeUser(userId, nom) {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var newCode = Array.from({ length: 6 }, function() { return chars[Math.floor(Math.random() * chars.length)]; }).join('');
    try {
      await window.IG.db.update('users_app', userId, { password: newCode, actif: true, date_blocage_auto: null, motif_blocage: null });
      var html = '<h3 style="font-size:15px;margin-bottom:14px">🔄 Nouveau mot de passe portail</h3>' +
        '<p style="font-size:13px;color:var(--text3);margin-bottom:14px">Communiquez ce MP à <strong>' + esc(nom) + '</strong>. Il se connecte avec son téléphone + ce code.</p>' +
        '<div style="text-align:center;background:var(--bg3);border-radius:10px;padding:20px">' +
        '<div style="font-size:26px;font-weight:900;letter-spacing:4px;color:var(--accent);font-family:monospace">' + newCode + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;margin-top:16px">' +
        '<button onclick="navigator.clipboard.writeText(\'' + newCode + '\');window.IG.utils.showToast(\'Code copié ✓\',\'green\')" style="flex:1;padding:9px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">📋 Copier</button>' +
        '<button data-modal-close style="flex:1;padding:9px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Fermer</button>' +
        '</div>';
      window.IG.utils.showModal(html, { width: '360px' });
    } catch(e) { window.IG.utils.showToast('Erreur : ' + e.message, 'red'); }
  }

  async function _genererInvitation() {
    var session = window.IG.auth.getSession();
    var ROLES_INFO = {
      coordinateur: { icon: '🎯', label: 'Coordinateur', desc: 'Coordonne toute l\'équipe, gère les immeubles assignés, peut inviter des collaborateurs' },
      gestionnaire: { icon: '🏘️', label: 'Gestionnaire', desc: 'Gère ses immeubles assignés, locataires et paiements' },
      comptable:    { icon: '📊', label: 'Comptable',    desc: 'Accès aux paiements et rapports financiers uniquement' },
      agent:        { icon: '🤝', label: 'Agent',        desc: 'Marketplace + consultation des locataires' }
    };
    var html = '<h3 style="font-size:16px;margin-bottom:16px">👥 Inviter un collaborateur</h3>' +
      '<label style="font-size:12px;color:var(--text3);display:block;margin-bottom:6px">RÔLE</label>' +
      '<select id="inv-role" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);margin-bottom:8px" onchange="window.IG.app._majDescRole(this.value)">' +
      Object.entries(ROLES_INFO).map(function(e) {
        return '<option value="' + e[0] + '">' + e[1].icon + ' ' + e[1].label + '</option>';
      }).join('') + '</select>' +
      '<div id="inv-role-desc" style="font-size:12px;color:var(--text3);background:var(--bg3);border-radius:8px;padding:8px 12px;margin-bottom:16px">' + ROLES_INFO.coordinateur.desc + '</div>' +
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

  function _majDescRole(role) {
    var ROLES_INFO = {
      coordinateur: 'Coordonne toute l\'équipe, gère les immeubles assignés, peut inviter des collaborateurs',
      gestionnaire: 'Gère ses immeubles assignés, locataires et paiements',
      comptable:    'Accès aux paiements et rapports financiers uniquement',
      agent:        'Marketplace + consultation des locataires'
    };
    var el = document.getElementById('inv-role-desc');
    if (el) el.textContent = ROLES_INFO[role] || '';
  }

  async function _ouvrirDroits(userId) {
    // Charger l'utilisateur
    var users = await window.IG.db.select('users_app');
    var u = (users || []).find(function(x) { return x.id === userId; });
    if (!u) return;

    var perms = window.IG.perms;
    var overrides = u.permissions || {};
    var immAssignes = u.immeubles_assignes || [];
    var immeubles = _data.immeubles || [];

    var COLLAB_ROLES = ['coordinateur','gestionnaire','comptable','agent'];
    var BAILLEUR_ROLES = ['bailleur'];
    var LOC_ROLES = ['locataire'];

    // ── Sélecteur de rôle ──
    var roleHtml = '';
    if (!['admin','locataire','bailleur'].includes(u.role)) {
      roleHtml = '<div style="margin-bottom:18px">' +
        '<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px">🎭 Rôle</label>' +
        '<select id="dr-role" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px">' +
        ['coordinateur','gestionnaire','comptable','agent'].map(function(r) {
          return '<option value="' + r + '"' + (u.role === r ? ' selected' : '') + '>' +
            {coordinateur:'🎯 Coordinateur',gestionnaire:'🏘️ Gestionnaire',comptable:'📊 Comptable',agent:'🤝 Agent'}[r] + '</option>';
        }).join('') + '</select></div>';
    } else {
      roleHtml = '<input type="hidden" id="dr-role" value="' + u.role + '">';
    }

    // ── Immeubles assignés (gestionnaire / agent uniquement) ──
    var immeublesHtml = '';
    if (['gestionnaire','agent'].includes(u.role)) {
      immeublesHtml = '<div style="margin-bottom:18px">' +
        '<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px">🏢 Immeubles accessibles</label>' +
        '<p style="font-size:11px;color:var(--text3);margin-bottom:8px">Si aucun coché : accès à tous les immeubles.</p>' +
        '<div style="display:flex;flex-direction:column;gap:6px;max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px">' +
        (immeubles.length
          ? immeubles.map(function(imm) {
              var checked = immAssignes.includes(String(imm.id));
              return '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">' +
                '<input type="checkbox" class="dr-imm" value="' + imm.id + '"' + (checked ? ' checked' : '') + ' style="width:15px;height:15px;accent-color:var(--accent)">' +
                esc(imm.nom_immeuble || imm.nom || imm.id) + '</label>';
            }).join('')
          : '<span style="font-size:12px;color:var(--text3)">Aucun immeuble</span>'
        ) + '</div></div>';
    }

    // ── Groupes de permissions filtrés selon le rôle ──
    var permsHtml = perms.PERM_GROUPS
      .filter(function(g) {
        // Sections réservées à certains rôles
        if (g.roles && !g.roles.includes(u.role)) return false;
        if (!g.roles && (u.role === 'locataire' || u.role === 'bailleur')) {
          // Pour loc/bailleur, n'afficher que les sections sans roles[] restriction sauf les leurs
          return false;
        }
        return true;
      })
      .map(function(g) {
        var defaults = perms.getDefaults(u.role);
        var rows = g.perms.map(function(p) {
          var defVal = defaults[p.key] !== undefined ? defaults[p.key] : false;
          var override = overrides[p.key] !== undefined ? overrides[p.key] : null;
          var currentVal = override !== null ? override : defVal;
          var isOverridden = override !== null && override !== defVal;
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border)">' +
            '<div>' +
            '<span style="font-size:13px">' + p.label + '</span>' +
            (isOverridden ? '<span style="font-size:10px;color:var(--accent);margin-left:6px">personnalisé</span>' : '') +
            '<div style="font-size:10px;color:var(--text3)">défaut rôle : ' + (defVal ? '✅ oui' : '❌ non') + '</div>' +
            '</div>' +
            '<label style="display:flex;align-items:center;gap:6px;cursor:pointer">' +
            '<input type="checkbox" class="dr-perm" data-key="' + p.key + '" data-default="' + defVal + '"' +
            (currentVal ? ' checked' : '') + ' style="width:16px;height:16px;accent-color:var(--accent)">' +
            '</label></div>';
        }).join('');
        return '<div style="margin-bottom:14px">' +
          '<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:6px;padding-bottom:4px;border-bottom:2px solid var(--border)">' + g.label + '</div>' +
          rows + '</div>';
      }).join('');

    // ── Assemblage modale ──
    var html =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">' +
      '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' +
      ({admin:'👑',coordinateur:'🎯',gestionnaire:'🏘️',comptable:'📊',agent:'🤝',bailleur:'🏠',locataire:'🔑'}[u.role]||'👤') + '</div>' +
      '<div><div style="font-size:15px;font-weight:700">' + esc(u.nom || u.id) + '</div>' +
      '<div style="font-size:12px;color:var(--text3)">' + esc(u.telephone || '') + '</div></div></div>' +

      roleHtml + immeublesHtml +

      (permsHtml
        ? '<div style="font-size:12px;font-weight:700;color:var(--text2);margin-bottom:10px">🔐 Permissions</div>' + permsHtml
        : '') +

      '<div style="display:flex;gap:10px;margin-top:20px;position:sticky;bottom:0;background:var(--bg2);padding:8px 0">' +
      '<button id="btn-save-droits" style="flex:1;padding:10px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">💾 Enregistrer</button>' +
      '<button data-modal-close style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '</div>';

    var modal = window.IG.utils.showModal(html, { width: '480px', maxHeight: '85vh' });

    modal.box.querySelector('#btn-save-droits').addEventListener('click', async function() {
      var btn = this;
      btn.textContent = '⏳...'; btn.disabled = true;

      // Collecter le nouveau rôle
      var newRole = modal.box.querySelector('#dr-role').value;

      // Collecter immeubles cochés
      var newImm = Array.from(modal.box.querySelectorAll('.dr-imm:checked')).map(function(cb) { return cb.value; });

      // Collecter permissions — ne sauvegarder que les overrides (différences vs défaut du rôle)
      var newPerms = {};
      var roleForDefaults = newRole || u.role;
      var defaults = perms.getDefaults(roleForDefaults);
      modal.box.querySelectorAll('.dr-perm').forEach(function(cb) {
        var key = cb.dataset.key;
        var defVal = defaults[key] !== undefined ? defaults[key] : false;
        var val = cb.checked;
        if (val !== defVal) newPerms[key] = val;
      });

      await _sauvegarderDroits(userId, newRole, newImm, newPerms, modal);
      btn.textContent = '💾 Enregistrer'; btn.disabled = false;
    });
  }

  async function _sauvegarderDroits(userId, newRole, newImm, newPerms, modal) {
    try {
      var patch = {
        permissions: newPerms,
        immeubles_assignes: newImm
      };
      if (newRole) patch.role = newRole;
      await window.IG.db.update('users_app', userId, patch);
      window.IG.utils.showToast('Droits mis à jour ✓', 'green');
      if (modal && modal.close) modal.close();
      _chargerEquipe();
    } catch(e) {
      window.IG.utils.showToast('Erreur : ' + e.message, 'red');
    }
  }

  function _reintegrerUser(userId, nom) {
    var html = '<div style="text-align:center;padding:8px 0">' +
      '<div style="font-size:32px;margin-bottom:12px">🔓</div>' +
      '<h3 style="font-size:15px;margin-bottom:10px">Réintégrer ' + esc(nom) + ' ?</h3>' +
      '<p style="font-size:13px;color:var(--text3);margin-bottom:20px">Son accès portail sera rétabli immédiatement<br>et le blocage automatique annulé.</p>' +
      '<div style="display:flex;gap:10px">' +
      '<button id="btn-reint-ok" style="flex:1;padding:10px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:13px;font-weight:600">✓ Confirmer</button>' +
      '<button data-modal-close style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '</div></div>';
    var modal = window.IG.utils.showModal(html, { width: '340px' });
    modal.box.querySelector('#btn-reint-ok').addEventListener('click', async function() {
      try {
        await window.IG.db.update('users_app', userId, { actif: true, date_blocage_auto: null, motif_blocage: null });
        window.IG.utils.showToast('✓ ' + nom + ' réintégré — accès rétabli', 'green');
        if (modal.close) modal.close();
        _chargerEquipe();
      } catch(e) { window.IG.utils.showToast('Erreur : ' + e.message, 'red'); }
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
    var kpis = window.IG.dashboard ? window.IG.dashboard.calculerKPIs(_data.locataires, _data.paiements) : {};
    var fmt = window.IG.utils.formatMontant;
    var tx = kpis.txRecouvrement || 0;

    // ── Camembert statuts locataires ──────────────────────────
    var locs = _data.locataires || [];
    var nbActif = locs.filter(function(l){ return l.statut === 'actif' || l.statut === 'occupé'; }).length;
    var nbImpaye = locs.filter(function(l){ return l.statut === 'impayé'; }).length;
    var nbLibre  = locs.filter(function(l){ return l.statut === 'libre' || !l.statut; }).length;
    var nbTotal  = locs.length || 1;
    function _arc(cx, cy, r, startDeg, endDeg, color) {
      var s = startDeg * Math.PI / 180, e = endDeg * Math.PI / 180;
      var x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
      var x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
      var large = (endDeg - startDeg) > 180 ? 1 : 0;
      if (endDeg - startDeg >= 360) return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + color + '"/>';
      return '<path d="M' + cx + ',' + cy + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + x2 + ',' + y2 + ' Z" fill="' + color + '"/>';
    }
    var pA = nbActif / nbTotal * 360, pI = nbImpaye / nbTotal * 360, pL = nbLibre / nbTotal * 360;
    var pie = '<svg viewBox="0 0 100 100" width="120" height="120">' +
      _arc(50,50,48, -90, -90 + pA, 'var(--green)') +
      _arc(50,50,48, -90 + pA, -90 + pA + pI, 'var(--red)') +
      _arc(50,50,48, -90 + pA + pI, -90 + pA + pI + pL, 'var(--text3)') +
      '<circle cx="50" cy="50" r="28" fill="var(--bg3)"/>' +
      '<text x="50" y="54" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">' + locs.length + '</text>' +
      '</svg>';

    // ── Graphe bar mensuel ────────────────────────────────────
    var grapheBar = window.IG.dashboard ? window.IG.dashboard.renderGrapheMensuel(kpis.recettesParMois||{}, kpis.loyerTheorique||0) : '';

    // ── Répartition par immeuble ─────────────────────────────
    var immeubles = _data.immeubles || [];
    var parImmeuble = immeubles.map(function(imm) {
      var locsImm = locs.filter(function(l){ return l.immeuble_id == imm.id && l.statut !== 'libre'; });
      var loyer = locsImm.reduce(function(s,l){ return s + (l.loyer||0); }, 0);
      return { nom: imm.nom || imm.id, nb: locsImm.length, loyer: loyer };
    }).filter(function(i){ return i.nb > 0; });

    var tableImm = parImmeuble.length ? '<div class="card" style="margin-top:16px">' +
      '<div class="card-header"><div class="card-title">🏢 ' + t('Par immeuble') + '</div></div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg4);font-size:11px;color:var(--text3)">' +
      '<th style="padding:8px 12px;text-align:left">' + t('Immeuble') + '</th>' +
      '<th style="padding:8px 12px;text-align:center">' + t('Locataires') + '</th>' +
      '<th style="padding:8px 12px;text-align:right">' + t('Loyer théorique') + '</th></tr></thead><tbody>' +
      parImmeuble.map(function(i,idx){
        return '<tr style="border-bottom:1px solid var(--border2);background:' + (idx%2?'var(--bg4)':'transparent') + '">' +
          '<td style="padding:8px 12px;font-weight:600">' + esc(i.nom) + '</td>' +
          '<td style="padding:8px 12px;text-align:center">' + i.nb + '</td>' +
          '<td style="padding:8px 12px;text-align:right">' + fmt(i.loyer) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>' : '';

    var html = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">📈 ' + t('Statistiques') + '</h2>' +

      // KPIs
      '<div class="metrics-grid" style="margin-bottom:20px">' +
      '<div class="metric-card"><div class="metric-label">👥 ' + t('Locataires actifs') + '</div><div class="metric-value">' + (kpis.actifs||0) + '</div><div class="metric-sub">' + (kpis.libres||0) + ' ' + t('libres') + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">💰 ' + t('Loyer théorique/mois') + '</div><div class="metric-value accent" style="font-size:17px">' + fmt(kpis.loyerTheorique||0) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">✅ ' + t('Encaissé ce mois') + '</div><div class="metric-value green" style="font-size:17px">' + fmt(kpis.recetteMois||0) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">⚠️ ' + t('Impayés cumulés') + '</div><div class="metric-value red" style="font-size:17px">' + fmt(kpis.totalDu||0) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">📈 ' + t('Taux recouvrement') + '</div><div class="metric-value" style="color:' + (tx>=80?'var(--green)':'var(--red)') + '">' + tx + '%</div></div>' +
      '<div class="metric-card"><div class="metric-label">📅 ' + t('Recette annuelle') + '</div><div class="metric-value accent" style="font-size:16px">' + fmt(kpis.recetteAnnuelle||0) + '</div></div>' +
      '</div>' +

      // Camembert + légende
      '<div class="card" style="margin-bottom:16px">' +
      '<div class="card-header"><div class="card-title">🍩 ' + t('Statuts locataires') + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;padding:8px 0">' +
      pie +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;border-radius:50%;background:var(--green)"></div><span style="font-size:13px">' + t('Actifs') + ' — <strong>' + nbActif + '</strong></span></div>' +
      '<div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;border-radius:50%;background:var(--red)"></div><span style="font-size:13px">' + t('Impayés') + ' — <strong>' + nbImpaye + '</strong></span></div>' +
      '<div style="display:flex;align-items:center;gap:8px"><div style="width:12px;height:12px;border-radius:50%;background:var(--text3)"></div><span style="font-size:13px">' + t('Libres') + ' — <strong>' + nbLibre + '</strong></span></div>' +
      '</div></div></div>' +

      // Bar mensuel
      '<div class="card" style="margin-bottom:16px"><div class="card-header"><div class="card-title">📊 ' + t('Recettes mensuelles') + '</div></div>' +
      '<div style="padding-top:8px">' + grapheBar + '</div></div>' +

      // Par immeuble
      tableImm +

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
    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">🗑️ ' + t('Corbeille') + '</h2>' +
      '<button onclick="window.IG.app._viderCorbeille()" style="padding:7px 14px;border-radius:8px;border:1px solid var(--red);color:var(--red);background:transparent;cursor:pointer;font-size:12px">' + t('Vider la corbeille') + '</button>' +
      '</div>' +
      '<div id="corbeille-body"><div class="card" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div></div></div>';
    content.innerHTML = html;
    _loadCorbeille();
  }

  async function _loadCorbeille() {
    var el = document.getElementById('corbeille-body');
    if (!el) return;
    try {
      // 1. Éléments table corbeille (locataires supprimés)
      var corbItems = await window.IG.db.select('corbeille').catch(function() { return []; });
      // 2. Immeubles archivés (flag archive:true dans la table immeubles)
      var allImm = await window.IG.db.select('immeubles').catch(function() { return []; });
      var immArchives = (allImm || []).filter(function(i) { return i.archive; });
      // 3. Locataires libérés dans les 30 derniers jours
      var allLocs = await window.IG.db.select('locataires').catch(function() { return []; });
      var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
      var locsLiberes = (allLocs || []).filter(function(l) {
        if (l.statut !== 'libre') return false;
        if (!l.date_liberation) return false;
        return new Date(l.date_liberation) >= cutoff;
      });

      var rows = '';

      // Immeubles archivés
      immArchives.forEach(function(imm) {
        var dateArch = imm.date_archive ? new Date(imm.date_archive).toLocaleDateString('fr-FR') : '';
        var expiration = imm.date_archive ? _joursRestants(imm.date_archive, 30) : null;
        rows += '<div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-left:3px solid var(--accent)">' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;margin-bottom:2px">📦 ' + t('Immeuble archivé') + '</div>' +
          '<div style="font-weight:700">' + esc(imm.nom_immeuble || imm.nom) + '</div>' +
          '<div style="font-size:12px;color:var(--text3)">' + esc(imm.ville || '') + (dateArch ? ' · ' + t('Archivé le') + ' ' + dateArch : '') + (expiration !== null ? ' · ' + (expiration > 0 ? expiration + ' j.' : '<span style="color:var(--red)">Expiré</span>') : '') + '</div>' +
          '</div>' +
          '<button onclick="window.IG.app._restaurerImmeuble(' + imm.id + ')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">↩ ' + t('Restaurer') + '</button>' +
          '</div>';
      });

      // Locataires libérés récents
      locsLiberes.forEach(function(loc) {
        var imm = _data.immeubles.find(function(i) { return i.id == loc.immeuble_id; });
        var dateLib = loc.date_liberation ? new Date(loc.date_liberation).toLocaleDateString('fr-FR') : '';
        var expiration = loc.date_liberation ? _joursRestants(loc.date_liberation, 30) : null;
        rows += '<div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;border-left:3px solid var(--green)">' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-size:10px;font-weight:700;color:var(--green);text-transform:uppercase;margin-bottom:2px">🏃 ' + t('Locataire libéré') + '</div>' +
          '<div style="font-weight:700">' + esc(loc.nom) + '</div>' +
          '<div style="font-size:12px;color:var(--text3)">' + esc(loc.appt || '') + (imm ? ' · ' + esc(imm.nom_immeuble || imm.nom) : '') + (dateLib ? ' · ' + t('Libéré le') + ' ' + dateLib : '') + (expiration !== null ? ' · ' + (expiration > 0 ? expiration + ' j.' : '<span style="color:var(--red)">Expiré</span>') : '') + '</div>' +
          '</div>' +
          '<button onclick="window.IG.app._restaurerLocataire(' + loc.id + ')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:12px;font-weight:600">↩ ' + t('Restaurer') + '</button>' +
          '</div>';
      });

      // Table corbeille (anciens items)
      (corbItems || []).forEach(function(item) {
        var d = item.locataire_data || {};
        var dateSuppr = item.date_suppression ? new Date(item.date_suppression).toLocaleDateString('fr-FR') : '';
        var expiration = item.date_suppression ? _joursRestants(item.date_suppression, 30) : null;
        rows += '<div class="card" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px">' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:700">' + esc(d.nom || '—') + '</div>' +
          '<div style="font-size:12px;color:var(--text3)">' + esc(d.appt || '') + (d.loyer ? ' · ' + window.IG.utils.formatMontant(d.loyer) + '/mois' : '') + (dateSuppr ? ' · ' + t('Supprimé le') + ' ' + dateSuppr : '') + (expiration !== null ? ' · ' + (expiration > 0 ? expiration + ' j.' : '<span style="color:var(--red)">Expiré</span>') : '') + '</div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;flex-shrink:0">' +
          '<button onclick="window.IG.app._restaurer(' + item.id + ')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">↩ ' + t('Restaurer') + '</button>' +
          '<button onclick="window.IG.app._supprimerDefinitivement(' + item.id + ')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--red);color:#fff;cursor:pointer;font-size:12px;font-weight:600">✕ ' + t('Supprimer') + '</button>' +
          '</div></div>';
      });

      if (!rows) {
        el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">🗑️</div><p>' + t('La corbeille est vide') + '</p></div>';
      } else {
        el.innerHTML = rows;
      }
    } catch(e) {
      el.innerHTML = '<div class="alert alert-yellow">' + t('Corbeille non disponible hors connexion.') + '</div>';
    }
  }

  function _joursRestants(dateStr, duree) {
    var d = new Date(dateStr);
    var exp = new Date(d.getTime() + duree * 24 * 3600 * 1000);
    var diff = Math.ceil((exp - Date.now()) / (24 * 3600 * 1000));
    return diff;
  }

  async function _restaurerImmeuble(id) {
    try {
      var allImm = await window.IG.db.select('immeubles');
      var imm = (allImm || []).find(function(i) { return i.id == id; });
      if (!imm) { window.IG.utils.showToast('Immeuble introuvable', 'red'); return; }
      var restaure = Object.assign({}, imm, { archive: false, date_archive: null });
      await window.IG.db.upsert('immeubles', [restaure]);
      window.IG.utils.showToast('↩ ' + t('Immeuble restauré'), 'green');
      _loadCorbeille();
      if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
  }

  async function _restaurerLocataire(id) {
    try {
      var allLocs = await window.IG.db.select('locataires');
      var loc = (allLocs || []).find(function(l) { return l.id == id; });
      if (!loc) { window.IG.utils.showToast('Locataire introuvable', 'red'); return; }
      var restaure = Object.assign({}, loc, { statut: 'actif', date_liberation: null, motif_liberation: null });
      await window.IG.db.upsert('locataires', [restaure]);
      window.IG.utils.showToast('↩ ' + t('Locataire restauré'), 'green');
      _loadCorbeille();
      if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
  }

  async function _supprimerDefinitivement(corbeilleId) {
    if (!confirm(t('Supprimer définitivement ? Cette action est irréversible.'))) return;
    try {
      await window.IG.db.remove('corbeille', corbeilleId);
      window.IG.utils.showToast(t('Supprimé définitivement'), 'red');
      _loadCorbeille();
      _updateCorbeilleBadge();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
  }

  async function _viderCorbeille() {
    if (!confirm(t('Vider toute la corbeille ? Cette action est irréversible.'))) return;
    try {
      var items = await window.IG.db.select('corbeille');
      await Promise.all((items || []).map(function(item) { return window.IG.db.remove('corbeille', item.id); }));
      window.IG.utils.showToast(t('Corbeille vidée'), 'red');
      _loadCorbeille();
      _updateCorbeilleBadge();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
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
      var decls = await window.IG.db.select('declarations', { id: id });
      var d = decls && decls[0];
      await window.IG.db.update('declarations', id, { statut: statut });

      if (statut === 'validated' && d) {
        await window.IG.db.insert('paiements', [{
          locataire_id: d.locataire_id,
          immeuble_id:  d.immeuble_id || null,
          mois:         d.mois_c,
          annee:        d.annee_c,
          montant:      d.montant,
          mode_paiement: d.mode || d.mode_paiement || 'espèces',
          reference:    d.reference || '',
          note:         'Déclaration validée'
        }]);
        // Notifier le locataire via OneSignal
        if (typeof sendOneSignalNotif === 'function' && d.locataire_id) {
          sendOneSignalNotif('loc_' + d.locataire_id, '✅ Paiement confirmé',
            'Votre paiement de ' + window.IG.utils.formatMontant(d.montant) + ' a été validé.',
            { type: 'paiement_valide', decl_id: String(id) });
        }
        window.IG.utils.showToast(t('Déclaration validée, paiement créé ✓'), 'green');
      } else if (statut === 'rejected' && d) {
        // Notifier le locataire du rejet
        if (typeof sendOneSignalNotif === 'function' && d.locataire_id) {
          sendOneSignalNotif('loc_' + d.locataire_id, '⚠️ Déclaration rejetée',
            'Votre déclaration de ' + window.IG.utils.formatMontant(d.montant) + ' a été rejetée. Contactez votre gestionnaire.',
            { type: 'paiement_rejete', decl_id: String(id) });
        }
        window.IG.utils.showToast(t('Déclaration rejetée'), 'red');
      }
      _loadDeclarations();
      _updateDeclBadge();
      await _loadData();
    } catch(e) { window.IG.utils.showToast('Erreur: ' + e.message, 'red'); }
  }

  // ── Messages internes ─────────────────────────────────────────
  function _renderMessages() {
    var content = document.getElementById('page-content');
    if (!content) return;
    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">💬 ' + t('Messages internes') + '</h2>' +
      '<button onclick="window.IG.app._nouveauMessage()" style="padding:7px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:12px;font-weight:600">✉️ ' + t('Nouveau') + '</button>' +
      '</div><div id="messages-body"><div class="card" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></div></div></div>';
    content.innerHTML = html;
    _loadMessages();
  }

  async function _loadMessages() {
    var el = document.getElementById('messages-body');
    if (!el) return;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var userId = session.userId || '';
    try {
      var msgs = await window.IG.db.select('messages_internes');
      if (!msgs || !msgs.length) {
        el.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:36px;margin-bottom:10px">💬</div><p>' + t('Aucun message') + '</p></div>';
        return;
      }
      msgs.sort(function(a,b) { return new Date(b.created_at) - new Date(a.created_at); });
      el.innerHTML = msgs.map(function(m) {
        var lu = Array.isArray(m.lu_par) && m.lu_par.includes(userId);
        var destLabel = m.pour_nom ? (' → ' + esc(m.pour_nom)) : '';
        return '<div class="card" onclick="window.IG.app._marquerLu(' + m.id + ')" style="margin-bottom:10px;cursor:pointer;' + (!lu ? 'border-left:3px solid var(--accent)' : '') + '">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">' +
          '<div style="flex:1;min-width:0">' +
          '<div style="font-weight:700;font-size:13px' + (!lu ? ';color:var(--accent)' : '') + '">' + esc(m.sujet || t('Message')) + '</div>' +
          '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + esc(m.de_nom || t('Système')) + destLabel + ' · ' + window.IG.utils.formatDate(m.created_at) + '</div>' +
          '<div style="font-size:13px;margin-top:6px;white-space:pre-wrap">' + esc(m.contenu || '') + '</div>' +
          '</div>' +
          (!lu ? '<span style="font-size:10px;background:var(--accent);color:#fff;padding:2px 8px;border-radius:99px;white-space:nowrap;flex-shrink:0">' + t('Nouveau') + '</span>' : '') +
          '</div></div>';
      }).join('');
    } catch(e) {
      el.innerHTML = '<div class="alert alert-yellow">Erreur: ' + esc(e.message) + '</div>';
    }
  }

  async function _marquerLu(msgId) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var userId = session.userId || '';
    if (!userId || !msgId) return;
    try {
      var msgs = await window.IG.db.select('messages_internes', { id: msgId });
      var m = msgs && msgs[0];
      if (!m) return;
      var luPar = Array.isArray(m.lu_par) ? m.lu_par : [];
      if (luPar.includes(userId)) return; // déjà lu
      luPar.push(userId);
      await window.IG.db.update('messages_internes', msgId, { lu_par: luPar });
      _loadMessages();
    } catch(_) {}
  }

  function _nouveauMessage() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var locs = (_data.locataires || []).filter(function(l) { return l.statut !== 'libre'; });
    var destOptions =
      '<option value="__OWNER__" data-nom="ImmoGest">📬 ImmoGest — Support & Personnalisation</option>' +
      '<option value="">— ' + t('Tous locataires (broadcast)') + ' —</option>' +
      locs.map(function(l) { return '<option value="loc_' + l.id + '" data-nom="' + esc(l.nom) + '">' + esc(l.nom) + ' (' + esc(l.appt || '') + ')</option>'; }).join('');

    var html = '<h3 style="font-size:15px;font-weight:700;margin-bottom:14px">✉️ ' + t('Nouveau message interne') + '</h3>' +
      '<label style="font-size:12px;color:var(--text3)">' + t('DESTINATAIRE') + '</label>' +
      '<select id="msg-dest" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin:4px 0 12px;box-sizing:border-box">' + destOptions + '</select>' +
      '<label style="font-size:12px;color:var(--text3)">' + t('SUJET') + '</label>' +
      '<input id="msg-sujet" placeholder="' + t('Sujet du message') + '" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin:4px 0 12px;box-sizing:border-box">' +
      '<label style="font-size:12px;color:var(--text3)">' + t('MESSAGE') + '</label>' +
      '<textarea id="msg-contenu" rows="4" placeholder="' + t('Contenu du message...') + '" style="width:100%;padding:8px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin:4px 0 14px;box-sizing:border-box;resize:vertical"></textarea>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Annuler') + '</button>' +
      '<button id="msg-send" style="padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + t('Envoyer') + '</button>' +
      '</div>';
    var modal = window.IG.utils.showModal(html, { width: '480px' });
    modal.box.querySelector('#msg-send').addEventListener('click', async function() {
      var destEl = modal.box.querySelector('#msg-dest');
      var destVal = destEl.value;
      var destNom = destVal ? (destEl.options[destEl.selectedIndex].getAttribute('data-nom') || '') : '';
      var sujet = modal.box.querySelector('#msg-sujet').value.trim();
      var contenu = modal.box.querySelector('#msg-contenu').value.trim();
      if (!contenu) { window.IG.utils.showToast(t('Message vide'), 'red'); return; }
      try {
        await window.IG.db.insert('messages_internes', [{
          sujet:        sujet || t('Sans sujet'),
          contenu:      contenu,
          de_user_id:   session.userId || '',
          de_nom:       session.nom || session.nomCabinet || '',
          pour_user_id: destVal || null,
          pour_nom:     destNom || null,
          tenant_id:    session.tenantId || null,
          lu_par:       []
        }]);
        if (destVal && destVal.startsWith('loc_') && typeof sendOneSignalNotif === 'function') {
          sendOneSignalNotif(destVal, '💬 ' + t('Nouveau message'), (session.nom || '') + ': ' + sujet, { type: 'message' });
        }
        window.IG.utils.showToast(t('Message envoyé ✓'), 'green');
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
        // Supprimer l'id pour forcer un insert propre (évite conflit sur PK)
        var locData = Object.assign({}, item.locataire_data);
        delete locData.id;
        await window.IG.db.insert('locataires', [locData]);
      }
      await window.IG.db.remove('corbeille', corbeilleId);
      window.IG.utils.showToast(t('Locataire restauré ✓'), 'green');
      _loadCorbeille();
      _updateCorbeilleBadge();
      await _loadData();
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
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">✅ ' + t('Droit local conforme') + '</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">📶 Hors-ligne</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">💳 Mobile Money</span>' +
      '<span style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:6px 14px;font-size:12px;color:rgba(255,255,255,0.75);">📋 Documents juridiques</span>' +
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
      '<div style="text-align:center;margin-bottom:28px;">' +
      '<div style="font-size:40px;margin-bottom:12px;">🏢</div>' +
      '<div style="font-size:19px;font-weight:800;color:#e8f0fe;">Bienvenue sur ImmoGest</div>' +
      '<div style="font-size:12px;color:rgba(232,240,254,0.45);margin-top:6px;">Gérez vos biens immobiliers simplement</div>' +
      '</div>' +
      // Bouton 1 — Créer (nouveau cabinet uniquement)
      '<button onclick="window.IG.app.authGoStep(\'register\')" style="width:100%;display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border:none;border-radius:12px;padding:18px 18px;cursor:pointer;margin-bottom:12px;transition:opacity .15s;" onmouseover="this.style.opacity=\'.9\'" onmouseout="this.style.opacity=\'1\'">' +
      '<span style="font-size:24px;flex-shrink:0;">🏠</span>' +
      '<div style="text-align:left;">' +
      '<div style="font-size:15px;font-weight:700;color:#fff;">Créer mon espace</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:3px;">Nouveau cabinet / gestionnaire</div>' +
      '</div></button>' +
      // Bouton 2 — Se connecter (TOUS les utilisateurs)
      '<button onclick="window.IG.app.authGoStep(\'login\')" style="width:100%;display:flex;align-items:center;gap:14px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:18px 18px;cursor:pointer;margin-bottom:20px;transition:background .15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.12)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.07)\'">' +
      '<span style="font-size:24px;flex-shrink:0;">🔑</span>' +
      '<div style="text-align:left;">' +
      '<div style="font-size:15px;font-weight:700;color:#e8f0fe;">Se connecter</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.5);margin-top:3px;">Admin · Gestionnaire · Locataire · Bailleur</div>' +
      '</div></button>' +
      // Lien marketplace
      '<div style="text-align:center;">' +
      '<button onclick="window.IG.app.browseMarketplace()" style="background:none;border:none;color:#4f8ef7;font-size:12px;cursor:pointer;font-family:inherit;">🏪 Parcourir la marketplace →</button>' +
      '</div></div>' +

      // ─── CONNEXION UNIFIÉE ───
      '<div id="auth-step-login" class="auth-step">' +
      '<button class="auth-back-btn" onclick="window.IG.app.authGoStep(\'home\')">&#8592; Retour</button>' +
      '<div style="text-align:center;margin-bottom:22px;">' +
      '<div style="font-size:32px;margin-bottom:8px;">🔑</div>' +
      '<div style="font-size:17px;font-weight:800;color:#e8f0fe;">Se connecter</div>' +
      '<div style="font-size:11px;color:rgba(232,240,254,0.4);margin-top:4px;">Admin · Gestionnaire · Locataire · Bailleur</div>' +
      '</div>' +
      '<label class="auth-label">NUMÉRO DE TÉLÉPHONE</label>' +
      window.IG.utils.phoneField('login-tel', '', '', true) +
      '<label class="auth-label">MOT DE PASSE</label>' +
      '<input type="password" id="login-pwd" class="auth-input" placeholder="Mot de passe" autocomplete="current-password" style="margin-bottom:20px;" onkeydown="if(event.key===\'Enter\')window.IG.app.doLogin()">' +
      '<button class="auth-btn-primary" onclick="window.IG.app.doLogin()">🔐 Se connecter</button>' +
      '<div id="err-login" style="color:#ff6b6b;font-size:12px;margin-top:10px;text-align:center;display:none;background:rgba(255,107,107,0.1);padding:8px;border-radius:6px;"></div>' +
      '<div style="text-align:center;margin-top:16px;">' +
      '<button onclick="window.IG.app.authGoStep(\'join\')" style="background:none;border:none;color:rgba(232,240,254,0.4);font-size:12px;cursor:pointer;font-family:inherit;">Première connexion avec un code ? →</button>' +
      '</div></div>' +

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
      window.IG.utils.phoneField('reg-tel', '', '', true) +
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
      // Bouton PWA install (visible seulement si navigateur propose l'install)
      '<div style="position:absolute;bottom:16px;right:16px;">' +
      '<button class="pwa-install-btn" onclick="installPWA()" style="display:none;padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.15);color:#fff;font-size:13px;font-weight:600;cursor:pointer;backdrop-filter:blur(8px);align-items:center;gap:6px;">⬇ Installer l\'app</button>' +
      '</div>' +
      '</div>';  // fin auth-screen

    // Slideshow
    var slides = document.querySelectorAll('.aslide');
    if (slides.length > 1) {
      var idx = 0;
      var _slideTimer = setInterval(function() {
        if (!document.getElementById('auth-screen')) { clearInterval(_slideTimer); return; }
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
    var tel = window.IG.utils.phoneFieldValue('login-tel') || (document.getElementById('login-tel') || {}).value || '';
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
      var session = await window.IG.auth.loginUnified(tel.trim(), pwd);
      _showAppShell(); _renderLangPlan(); await _loadData();
      // Router selon le rôle
      if (session.role === 'locataire') showPage('portail');
      else showPage('dashboard');
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
      _showAppShell(); _renderLangPlan(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message || 'Code invalide'; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }
  }

  // Création d'un espace
  async function registerV2() {
    var nom = (document.getElementById('reg-nom') || {}).value || '';
    var cabinet = (document.getElementById('reg-cabinet') || {}).value || '';
    var tel = window.IG.utils.phoneFieldValue('reg-tel') || (document.getElementById('reg-tel') || {}).value || '';
    var pwd = (document.getElementById('reg-pwd') || {}).value || '';
    var errEl = document.getElementById('err-register');
    var btn = document.querySelector('#auth-step-register .auth-btn-primary');
    var orig = btn ? btn.textContent : 'Créer mon espace';
    if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }
    if (errEl) errEl.style.display = 'none';
    try {
      await window.IG.auth.register(nom, tel.trim(), pwd, cabinet);
      await window.IG.auth.login(tel.trim(), pwd);
      _showAppShell(); _renderLangPlan(); await _loadData(); showPage('dashboard');
    } catch(ex) {
      if (errEl) { errEl.textContent = ex.message; errEl.style.display = 'block'; }
      if (btn) { btn.textContent = orig; btn.disabled = false; }
    }
  }

  return {
    init, showPage, refresh, renderCurrentPage,
    _renderLogin, renderLogin: _renderLogin,
    authGoStep, doLogin, joinV2, registerV2, browseMarketplace,
    toggleSidebar, closeSidebar, toggleSidebarSection, toggleDarkMode, lockScreen, openGuide,
    toggleAIChat, sendAIMessage, aiQuickAction,
    getData: function() { return _data; },
    _renderDashboardBailleur,
    _refreshPaiements, _payTab, _renderCaisseJour, _exportCaisseWA,
    _ouvrirSelLocataire, _filtrerSelLoc, _selLoc, _confirmerSupprPaiement,
    _restaurer, _supprimerDefinitivement, _viderCorbeille, _loadCorbeille,
    _restaurerImmeuble, _restaurerLocataire,
    _locFiltrer,
    _genererInvitation, _toggleUser, _equipeTab, _resetCodeUser, _appliquerPromo,
    _loadDeclarations, _validerDeclaration,
    _loadMessages, _nouveauMessage, _marquerLu,
    _paramTab,
    _ouvrirDroits, _sauvegarderDroits, _reintegrerUser,
    _sauvegarderModePublication, _chargerModePublication, _sauvegarderCleIA, _chargerCleIA, _sauvegarderMomo, _chargerMomo, _sauvegarderCabinet, _chargerCabinet,
    getData: function() { return _data; },
    topbarAction, _showMobileNav,
    reloadShell
  };

})();
