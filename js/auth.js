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

  // ── Décoder l'expiration d'un token de session (JWT HS256) ─────
  function _tokenExpired(token) {
    try {
      var parts = String(token || '').split('.');
      if (parts.length !== 3) return false;              // format inconnu → ne pas invalider
      var b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4) b64 += '=';
      var payload = JSON.parse(atob(b64));
      return !!(payload.exp && Date.now() > payload.exp);
    } catch(_) { return false; }
  }

  // ── Charger session depuis localStorage ───────────────────────
  function _loadSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (s && s.tenantId) {
        // Token périmé + réseau dispo → forcer une reconnexion propre
        // (évite de rouvrir le dashboard avec un token mort → « Session invalide »)
        var online = (typeof navigator === 'undefined') || navigator.onLine !== false;
        if (online && s.sessionToken && _tokenExpired(s.sessionToken)) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('SESSION');
          SESSION = null;
          return null;
        }
        SESSION = s;
        return s;
      }
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
      locale:      data.tenant.locale || null,
      sessionToken: data.sessionToken || null
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

    SESSION.userId    = data.user.id;
    SESSION.role      = data.user.role;
    SESSION.nom       = data.user.nom;
    SESSION.immeubles = data.user.immeubles_assignes || data.user.immeubles || [];
    SESSION.permissions = data.user.permissions || {};
    SESSION.sessionToken = data.sessionToken || SESSION.sessionToken || null;
    _saveSession(SESSION);
    return SESSION;
  }

  // ── Connexion unifiée — tous rôles par téléphone ─────────────
  async function loginUnified(telephone, password) {
    var passwordHash = await _hash(password);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/login', {
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
      nom:         data.nom || data.tenant.nom,
      nomCabinet:  data.tenant.nom_cabinet || data.tenant.nom,
      plan:        data.tenant.plan || 'gratuit',
      plan_expire: data.tenant.plan_expire || null,
      telephone:   telephone,
      parametres:  data.tenant.parametres || {},
      loginAt:     Date.now(),
      locale:      data.tenant.locale || null,
      locataireId: data.locataireId || null,
      immeubles:   data.user && data.user.immeubles ? data.user.immeubles : [],
      permissions: data.user && data.user.permissions ? data.user.permissions : {},
      sessionToken: data.sessionToken || null
    };
    _saveSession(session);
    return session;
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
      locataireId: data.locataireId || null,
      immeubles:   data.user && data.user.immeubles ? data.user.immeubles : [],
      permissions: data.user && data.user.permissions ? data.user.permissions : {},
      sessionToken: data.sessionToken || null
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
      locataireId: data.locataireId || null,
      sessionToken: data.sessionToken || null
    };
    _saveSession(session);

    if (typeof loginOneSignal === 'function') {
      loginOneSignal(session.userId || session.tenantId, { tenant_id: session.tenantId, role: session.role });
    }

    return session;
  }

  // ── Changer le mot de passe de l'utilisateur connecté ─────────
  async function changePassword(currentPassword, newPassword) {
    if (!SESSION || !SESSION.tenantId || !SESSION.sessionToken) throw new Error('Session invalide');
    var currentPasswordHash = await _hash(currentPassword);
    var newPasswordHash = await _hash(newPassword);
    var wUrl = window.IG.config.workerUrl;
    var res = await fetch(wUrl + '/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: SESSION.tenantId,
        sessionToken: SESSION.sessionToken,
        currentPasswordHash,
        newPasswordHash
      })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Mot de passe non modifié');
    if (data.sessionToken) {
      SESSION.sessionToken = data.sessionToken;
      _saveSession(SESSION);
    }
    return data;
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
    register, login, loginUnified, loginUser, loginPortal, join, changePassword, logout,
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
