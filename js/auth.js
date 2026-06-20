// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Authentification & Session
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.auth = (function() {

  var SESSION = null;
  var STORAGE_KEY = 'ig_session_v2';

  // ── Rôles & permissions ───────────────────────────────────────
  var ROLES = {
    admin:         { niveau: 6, label: 'Administrateur' },
    proprietaire:  { niveau: 5, label: 'Propriétaire' },
    coordinateur:  { niveau: 5, label: 'Coordinateur' },
    gestionnaire:  { niveau: 4, label: 'Gestionnaire' },
    comptable:     { niveau: 3, label: 'Comptable' },
    agent:         { niveau: 2, label: 'Agent' },
    bailleur:      { niveau: 2, label: 'Bailleur' },
    locataire:     { niveau: 1, label: 'Locataire' }
  };

  function hasRole(minRole) {
    if (!SESSION) return false;
    var min = ROLES[minRole] ? ROLES[minRole].niveau : 1;
    var cur = SESSION.role && ROLES[SESSION.role] ? ROLES[SESSION.role].niveau : 1;
    return cur >= min;
  }

  // ── Charger session depuis localStorage ───────────────────────
  function _loadSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (s && s.tenantId) { SESSION = s; return s; }
    } catch(_) {}
    return null;
  }

  // ── Sauvegarder session ───────────────────────────────────────
  function _saveSession(s) {
    SESSION = s;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    // Aussi en clé v1 pour compat
    localStorage.setItem('SESSION', JSON.stringify(s));
  }

  // ── SHA-256 ───────────────────────────────────────────────────
  async function _hash(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // ── Inscription ───────────────────────────────────────────────
  async function register(nom, telephone, password, nomCabinet) {
    var passwordHash = await _hash(password);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, telephone, passwordHash, nomCabinet })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur inscription');
    return data;
  }

  // ── Connexion propriétaire ────────────────────────────────────
  async function login(telephone, password) {
    var passwordHash = await _hash(password);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/login-tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone, passwordHash })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connexion échouée');

    var session = {
      tenantId:    data.tenant.id,
      userId:      data.userId,
      role:        data.role || 'admin',
      type_profil: data.tenant.type_profil || data.type_profil || 'gestionnaire',
      nom:         data.tenant.nom,
      nomCabinet:  data.tenant.nom_cabinet,
      plan:        data.tenant.plan || 'gratuit',
      plan_expire: data.tenant.plan_expire || null,
      telephone:   data.tenant.telephone,
      parametres:  data.tenant.parametres || {},
      loginAt:     Date.now(),
      locale:      data.tenant.locale || null
    };
    _saveSession(session);

    // Associer le tenant à OneSignal pour ciblage cron
    if (typeof loginOneSignal === 'function') {
      loginOneSignal(session.userId || session.tenantId, { tenant_id: session.tenantId });
    }

    return session;
  }

  // ── Connexion utilisateur (PIN / mot de passe) ────────────────
  async function loginUser(userId, password, isPin) {
    if (!SESSION) throw new Error('Pas de session tenant active');
    var hash = isPin ? password : await _hash(password);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/login-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, passwordHash: hash, tenantId: SESSION.tenantId })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Connexion échouée');

    SESSION.userId = data.user.id;
    SESSION.role   = data.user.role;
    SESSION.nom    = data.user.nom;
    _saveSession(SESSION);
    return SESSION;
  }

  // ── Connexion locataire / bailleur (téléphone + mot de passe) ─
  async function loginPortal(telephone, password) {
    var passwordHash = await _hash(password);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/login-portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telephone, passwordHash })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Identifiants incorrects');

    var session = {
      tenantId:    data.tenant.id,
      userId:      data.userId,
      role:        data.role,
      type_profil: data.tenant.type_profil || 'gestionnaire',
      nom:         data.nom || data.userId,
      nomCabinet:  data.tenant.nom_cabinet || data.tenant.nom,
      plan:        data.tenant.plan || 'gratuit',
      plan_expire: data.tenant.plan_expire || null,
      telephone:   telephone,
      parametres:  data.tenant.parametres || {},
      loginAt:     Date.now(),
      locale:      data.tenant.locale || null,
      locataireId: data.locataireId || null
    };
    _saveSession(session);
    return session;
  }

  // ── Rejoindre un espace avec code d'invitation ───────────────
  async function join(code, nom, password) {
    var passwordHash = await _hash(password);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, nom, passwordHash })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Code invalide ou expiré');

    var session = {
      tenantId:    data.tenant.id,
      userId:      data.userId,
      role:        data.role || 'agent',
      type_profil: data.tenant.type_profil || data.type_profil || 'gestionnaire',
      nom:         nom,
      nomCabinet:  data.tenant.nom_cabinet || data.tenant.nom,
      plan:        data.tenant.plan || 'gratuit',
      plan_expire: data.tenant.plan_expire || null,
      telephone:   data.tenant.telephone,
      parametres:  data.tenant.parametres || {},
      loginAt:     Date.now(),
      locale:      data.tenant.locale || null,
      locataireId: data.locataireId || null
    };
    _saveSession(session);

    if (typeof loginOneSignal === 'function') {
      loginOneSignal(session.userId || session.tenantId, { tenant_id: session.tenantId, role: session.role });
    }

    return session;
  }

  // ── Déconnexion ───────────────────────────────────────────────
  function logout() {
    SESSION = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('SESSION');
    window.IG.db && window.IG.db.resetAuth();
    if (window.IG.app && window.IG.app.renderLogin) {
      window.IG.app.renderLogin();
    } else {
      window.location.reload();
    }
  }

  // ── Getters ───────────────────────────────────────────────────
  function getSession()  { return SESSION; }
  function getTenantId() { return SESSION && SESSION.tenantId; }
  function isLoggedIn()  { return !!(SESSION && SESSION.tenantId); }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    _loadSession();
    return SESSION;
  }

  return {
    register, login, loginUser, loginPortal, join, logout,
    getSession, getTenantId, isLoggedIn, hasRole,
    init, ROLES
  };

})();

// Alias globaux v1 (guard contre redéfinition au rechargement)
if (!Object.getOwnPropertyDescriptor(window, 'SESSION') || !Object.getOwnPropertyDescriptor(window, 'SESSION').get) {
  Object.defineProperty(window, 'SESSION', {
    get: function() { return window.IG.auth.getSession(); },
    set: function(v) { /* ignoré, géré par auth */ },
    configurable: true
  });
}
