// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Authentification & Session
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.auth = (function() {

  var SESSION = null;
  var STORAGE_KEY = 'ig_session_v2';

  // ── Rôles & permissions ───────────────────────────────────────
  var ROLES = {
    admin:        { niveau: 6, label: 'Administrateur' },
    proprietaire: { niveau: 5, label: 'Propriétaire' },
    gestionnaire: { niveau: 4, label: 'Gestionnaire' },
    comptable:    { niveau: 3, label: 'Comptable' },
    agent:        { niveau: 2, label: 'Agent' },
    locataire:    { niveau: 1, label: 'Locataire' }
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
      nom:         data.tenant.nom,
      nomCabinet:  data.tenant.nom_cabinet,
      plan:        data.tenant.plan || 'gratuit',
      telephone:   data.tenant.telephone,
      _pwdHash:    passwordHash,
      loginAt:     Date.now(),
      locale:      data.tenant.locale || null
    };
    _saveSession(session);
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
    SESSION._pwdHash = hash;
    _saveSession(SESSION);
    return SESSION;
  }

  // ── Déconnexion ───────────────────────────────────────────────
  function logout() {
    SESSION = null;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('SESSION');
    window.IG.db && window.IG.db.resetAuth();
    if (window.IG.app && window.IG.app.showPage) {
      window.IG.app.showPage('login');
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
    register, login, loginUser, logout,
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
