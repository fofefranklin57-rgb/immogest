

// ════════════════════════════════════════════════════════════════
// ONBOARDING MULTI-ESPACE — Sélecteur / Inscription / Rejoindre
// ════════════════════════════════════════════════════════════════

const SPACES_KEY = 'immogest_spaces_v1';

function _getStoredSpaces() {
  try { return JSON.parse(localStorage.getItem(SPACES_KEY) || '[]'); } catch(e) { return []; }
}
function _addStoredSpace(sp) {
  var list = _getStoredSpaces();
  var idx = list.findIndex(function(s){ return s.tenantId === sp.tenantId; });
  if (idx >= 0) list[idx] = sp; else list.push(sp);
  localStorage.setItem(SPACES_KEY, JSON.stringify(list));
}
function _removeStoredSpace(tenantId) {
  var list = _getStoredSpaces().filter(function(s){ return s.tenantId !== tenantId; });
  localStorage.setItem(SPACES_KEY, JSON.stringify(list));
}
// Compat ancienne clé
function _getStoredTenant() {
  var sp = _getStoredSpaces();
  return sp.length ? sp[0] : null;
}
function _setStoredTenant(t) { _addStoredSpace(t); }

// ── Sélecteur d'espace (plusieurs espaces connus) ────────────────
function showSpaceSelector() {
  var spaces = _getStoredSpaces();
  var as = document.getElementById('auth-screen');
  if (!as) return;
  as.style.display = 'flex';
  var inner = as.querySelector('.auth-inner') || as;

  var cards = spaces.map(function(sp) {
    var icon = sp.role === 'locataire' ? '🔑' : (sp.mode === 'entreprise' ? '🏢' : '🏠');
    var label = sp.role === 'locataire' ? 'Locataire'
              : sp.role === 'admin' ? 'Administrateur'
              : sp.role === 'gestionnaire' ? 'Gestionnaire'
              : sp.role === 'comptable' ? 'Comptable'
              : sp.role || 'Membre';
    var name = sp.nomCabinet || sp.nom || 'Mon espace';
    return '<div style="border:1.5px solid var(--border);border-radius:12px;padding:16px 18px;cursor:pointer;display:flex;align-items:center;gap:14px;transition:border-color .15s;" '
         + 'onclick="enterSpace(\'' + sp.tenantId + '\')">'
         + '<div style="font-size:30px;">' + icon + '</div>'
         + '<div style="flex:1;">'
         + '<div style="font-weight:700;font-size:15px;">' + name + '</div>'
         + '<div style="font-size:12px;color:var(--text3);margin-top:2px;">' + label + '</div>'
         + '</div>'
         + '<div style="font-size:20px;color:var(--text3);">›</div>'
         + '</div>';
  }).join('');

  inner.innerHTML = '<div style="max-width:420px;width:100%;padding:28px 16px;margin:auto;">'
    + '<div style="text-align:center;margin-bottom:28px;">'
    + '<div style="font-size:34px;">🏢</div>'
    + '<div style="font-size:20px;font-weight:800;margin-top:8px;">Mes espaces</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:4px;">Choisissez l\'espace dans lequel vous souhaitez entrer</div>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:10px;">'
    + cards
    + '</div>'
    + '<button class="btn btn-ghost" style="width:100%;margin-top:18px;padding:13px;border:1px dashed var(--border);border-radius:12px;font-size:13px;" onclick="showWelcomeScreen()">'
    + '+ Ajouter un espace'
    + '</button>'
    + '</div>';
}

// Entrer dans un espace (re-authentification par tel+pwd si nécessaire)
function enterSpace(tenantId) {
  var spaces = _getStoredSpaces();
  var sp = spaces.find(function(s){ return s.tenantId === tenantId; });
  if (!sp) return;

  if (sp.role === 'locataire') {
    SESSION = {
      userId: String(sp.locataireId || tenantId), tenantId: sp.tenantId,
      role: 'locataire', version: 'individuel', nom: sp.nom || 'Locataire',
      immeubles: [], locId: sp.locataireId, _pwdHash: '', _ts: Date.now()
    };
    saveSession();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    loadData();
    setTimeout(function(){ openPortailLocataire(); }, 400);
    return;
  }

  // Admin / gestionnaire → demander mot de passe
  showReauthScreen(sp);
}

function showReauthScreen(sp) {
  var as = document.getElementById('auth-screen');
  var inner = as.querySelector('.auth-inner') || as;
  var icon = sp.mode === 'entreprise' ? '🏢' : '🏠';
  var name = sp.nomCabinet || sp.nom || 'Mon espace';
  inner.innerHTML = '<div style="max-width:360px;width:100%;padding:28px 16px;margin:auto;">'
    + '<button onclick="showSpaceSelector()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>'
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:32px;">' + icon + '</div>'
    + '<div style="font-size:17px;font-weight:800;margin-top:8px;">' + name + '</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:4px;">Entrez votre mot de passe pour continuer</div>'
    + '</div>'
    + '<div style="margin-bottom:16px;">'
    + '<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">MOT DE PASSE</label>'
    + '<input id="ra-pwd" class="auth-input" type="password" placeholder="Votre mot de passe" style="width:100%;">'
    + '</div>'
    + '<div id="ra-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>'
    + '<button id="ra-btn" class="btn btn-primary" style="width:100%;padding:14px;" onclick="submitReauth(\'' + sp.tenantId + '\',\'' + (sp.telephone||'') + '\')">Entrer →</button>'
    + '</div>';
}

async function submitReauth(tenantId, telephone) {
  var pwd = document.getElementById('ra-pwd').value || '';
  var errEl = document.getElementById('ra-err');
  var btn = document.getElementById('ra-btn');
  errEl.style.display = 'none';
  if (!pwd) { errEl.textContent = 'Entrez votre mot de passe.'; errEl.style.display='block'; return; }
  if (btn) { btn.disabled=true; btn.textContent='Vérification…'; }
  try {
    var passwordHash = await _hashPwd(pwd);
    var res = await fetch(WORKER_URL + '/login-tenant', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ telephone: telephone, passwordHash: passwordHash })
    });
    var json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled=false; btn.textContent='Entrer →'; }
      errEl.textContent = json.error || 'Mot de passe incorrect'; errEl.style.display='block';
      return;
    }
    _addStoredSpace({ tenantId: json.tenantId, mode: json.mode, nom: json.nom, telephone: telephone, role: 'admin', nomCabinet: json.nomCabinet });
    SESSION = {
      userId: json.tenantId, tenantId: json.tenantId, role: 'admin',
      version: json.mode, nom: json.nom, telephone: telephone,
      immeubles: [], _pwdHash: passwordHash, _ts: Date.now()
    };
    saveSession();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    showToast('Connecté ✓', 'green');
    initApp();
    updateCorbeilleBadge();
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='Entrer →'; }
    errEl.textContent='Erreur réseau.'; errEl.style.display='block';
  }
}

// ── Écran de bienvenue (ajout d'un espace) ───────────────────────
function showWelcomeScreen() {
  var spaces = _getStoredSpaces();
  var as = document.getElementById('auth-screen');
  if (!as) return;
  as.style.display = 'flex';
  var inner = as.querySelector('.auth-inner') || as;
  var backBtn = spaces.length > 0
    ? '<button onclick="showSpaceSelector()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Mes espaces</button>'
    : '';
  inner.innerHTML = '<div style="max-width:480px;width:100%;padding:24px 16px;margin:auto;">'
    + backBtn
    + '<div style="text-align:center;margin-bottom:32px;">'
    + '<div style="font-size:36px;margin-bottom:8px;">🏢</div>'
    + '<div style="font-size:22px;font-weight:800;color:var(--text);">ImmoGest</div>'
    + '<div style="font-size:13px;color:var(--text3);margin-top:4px;">Gestion immobilière simplifiée</div>'
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:12px;">'
    + '<button class="btn btn-primary" style="padding:16px;font-size:15px;border-radius:12px;" onclick="showModeSelection()">'
    + '🏠 Créer mon espace'
    + '<div style="font-size:11px;font-weight:400;margin-top:2px;opacity:0.85;">Gestionnaire ou propriétaire — nouvel espace</div>'
    + '</button>'
    + '<button class="btn btn-ghost" style="padding:16px;font-size:15px;border-radius:12px;border:1px solid var(--border);" onclick="showJoinScreen()">'
    + '🔗 Rejoindre un espace'
    + '<div style="font-size:11px;font-weight:400;margin-top:2px;opacity:0.7;">Locataire ou employé — entrer un code d\'invitation</div>'
    + '</button>'
    + (spaces.length === 0 ? '<button class="btn btn-ghost" style="padding:12px;font-size:13px;border-radius:12px;" onclick="showLoginTenantScreen()">🔑 Se connecter à un espace existant</button>' : '')
    + '</div>'
    + '</div>';
}

// ── Choix du mode (Perso / Cabinet) ─────────────────────────────
function showModeSelection() {
  var as = document.getElementById('auth-screen');
  var inner = as.querySelector('.auth-inner') || as;
  inner.innerHTML = '<div style="max-width:700px;width:100%;padding:24px 16px;margin:auto;overflow-y:auto;max-height:100vh;">'
    + '<button onclick="showWelcomeScreen()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>'
    + '<div style="text-align:center;margin-bottom:8px;">'
    + '<div style="font-size:18px;font-weight:800;color:var(--text);">Choisissez votre mode de gestion</div>'
    + '<div style="font-size:12px;color:var(--red);margin-top:4px;font-weight:600;">⚠️ Ce choix est définitif pour cet espace</div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px;">'

    + '<div style="border:2px solid var(--border);border-radius:14px;padding:20px;">'
    + '<div style="font-size:24px;text-align:center;margin-bottom:8px;">👤</div>'
    + '<div style="font-size:15px;font-weight:800;text-align:center;margin-bottom:12px;">MODE PERSO</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;font-style:italic;">Particulier ou propriétaire qui gère ses biens en autonomie</div>'
    + '<div style="font-size:12px;line-height:1.9;">✅ Vous (admin)<br>✅ Vos propriétaires partenaires<br>✅ Vos locataires (portail)<br>❌ Pas de gestionnaires salariés</div>'
    + '<div style="font-size:12px;margin:10px 0 6px;font-weight:600;color:var(--text2);">Fonctionnalités :</div>'
    + '<div style="font-size:12px;line-height:1.9;">✅ Immeubles & locataires<br>✅ Paiements & suivi loyers<br>✅ Fiches de suivi PDF<br>✅ Portails proprio & locataire<br>✅ Notifications push</div>'
    + '<button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="showRegistrationForm(\'individuel\')">✅ Choisir Mode Perso</button>'
    + '</div>'

    + '<div style="border:2px solid var(--border);border-radius:14px;padding:20px;">'
    + '<div style="font-size:24px;text-align:center;margin-bottom:8px;">🏢</div>'
    + '<div style="font-size:15px;font-weight:800;text-align:center;margin-bottom:12px;">MODE CABINET</div>'
    + '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;font-style:italic;">Agence immobilière ou cabinet avec une équipe</div>'
    + '<div style="font-size:12px;line-height:1.9;">✅ Vous (admin)<br>✅ Gestionnaires<br>✅ Comptables<br>✅ Propriétaires assignés<br>✅ Locataires (portail)</div>'
    + '<div style="font-size:12px;margin:10px 0 6px;font-weight:600;color:var(--text2);">Fonctionnalités :</div>'
    + '<div style="font-size:12px;line-height:1.9;">✅ Tout du Mode Perso<br>✅ Gestion d\'équipe & rôles<br>✅ Rapports multi-gestionnaires<br>✅ Messagerie interne</div>'
    + '<button class="btn btn-primary" style="width:100%;margin-top:16px;" onclick="showRegistrationForm(\'entreprise\')">✅ Choisir Mode Cabinet</button>'
    + '</div>'

    + '</div>'
    + '</div>';
}

// ── Formulaire d'inscription ─────────────────────────────────────
function showRegistrationForm(mode) {
  var as = document.getElementById('auth-screen');
  var inner = as.querySelector('.auth-inner') || as;
  var isEnt = mode === 'entreprise';
  inner.innerHTML = '<div style="max-width:400px;width:100%;padding:24px 16px;margin:auto;">'
    + '<button onclick="showModeSelection()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>'
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:20px;">' + (isEnt ? '🏢' : '👤') + '</div>'
    + '<div style="font-size:17px;font-weight:800;color:var(--text);margin-top:6px;">'
    + (isEnt ? 'Créer votre espace Cabinet' : 'Créer votre espace Perso')
    + '</div>'
    + '</div>'
    + (isEnt ? '<div style="margin-bottom:14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">NOM DU CABINET</label><input id="reg-cabinet" class="auth-input" placeholder="Ex: Cabinet Kamdem, Agence XYZ…" style="width:100%;"></div>' : '')
    + '<div style="margin-bottom:14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">VOTRE NOM COMPLET</label><input id="reg-nom" class="auth-input" placeholder="Jean Kamdem" style="width:100%;"></div>'
    + '<div style="margin-bottom:14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">NUMÉRO DE TÉLÉPHONE</label><input id="reg-tel" class="auth-input" placeholder="699 00 00 00" type="tel" style="width:100%;"></div>'
    + '<div style="margin-bottom:14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">MOT DE PASSE</label><input id="reg-pwd" class="auth-input" type="password" placeholder="Minimum 6 caractères" style="width:100%;"></div>'
    + '<div style="margin-bottom:20px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">CONFIRMER LE MOT DE PASSE</label><input id="reg-pwd2" class="auth-input" type="password" placeholder="Répéter le mot de passe" style="width:100%;"></div>'
    + '<div id="reg-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>'
    + '<button id="reg-btn" class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;" onclick="submitRegistration(\'' + mode + '\')">Créer mon espace →</button>'
    + '</div>';
}

async function submitRegistration(mode) {
  var nom    = (document.getElementById('reg-nom')?.value || '').trim();
  var tel    = (document.getElementById('reg-tel')?.value || '').trim().replace(/\s/g,'');
  var pwd    = document.getElementById('reg-pwd')?.value || '';
  var pwd2   = document.getElementById('reg-pwd2')?.value || '';
  var nomCab = (document.getElementById('reg-cabinet')?.value || '').trim();
  var errEl  = document.getElementById('reg-err');
  var btn    = document.getElementById('reg-btn');
  errEl.style.display = 'none';
  var showErr = function(msg){ errEl.textContent=msg; errEl.style.display='block'; };
  if (!nom) return showErr('Veuillez saisir votre nom complet.');
  if (!tel || tel.length < 8) return showErr('Numéro de téléphone invalide.');
  if (pwd.length < 6) return showErr('Mot de passe : minimum 6 caractères.');
  if (pwd !== pwd2) return showErr('Les mots de passe ne correspondent pas.');
  if (mode === 'entreprise' && !nomCab) return showErr('Veuillez saisir le nom du cabinet.');
  if (btn) { btn.disabled=true; btn.textContent='Création en cours…'; }
  try {
    var passwordHash = await _hashPwd(pwd);
    var res = await fetch(WORKER_URL + '/register', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ nom: nom, telephone: tel, passwordHash: passwordHash, mode: mode, nomCabinet: nomCab || null })
    });
    var json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled=false; btn.textContent='Créer mon espace →'; }
      return showErr(json.error || 'Erreur serveur');
    }
    _addStoredSpace({ tenantId: json.tenantId, mode: mode, nom: nom, telephone: tel, role: 'admin', nomCabinet: nomCab || null });
    SESSION = {
      userId: json.tenantId, tenantId: json.tenantId, role: 'admin',
      version: mode, nom: nom, telephone: tel,
      immeubles: [], _pwdHash: passwordHash, _ts: Date.now()
    };
    saveSession();
    USERS = [];
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    showToast('Espace créé avec succès ! Bienvenue 🎉', 'green');
    initApp();
    updateCorbeilleBadge();
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='Créer mon espace →'; }
    showErr('Erreur réseau. Vérifiez votre connexion.');
  }
}

// ── Rejoindre avec code d'invitation ────────────────────────────
function showJoinScreen() {
  var as = document.getElementById('auth-screen');
  var inner = as.querySelector('.auth-inner') || as;
  inner.innerHTML = '<div style="max-width:380px;width:100%;padding:24px 16px;margin:auto;">'
    + '<button onclick="showWelcomeScreen()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>'
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:28px;">🔗</div>'
    + '<div style="font-size:17px;font-weight:800;margin-top:8px;">Rejoindre un espace</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:4px;">Entrez le code que votre gestionnaire vous a communiqué</div>'
    + '</div>'
    + '<div style="margin-bottom:16px;">'
    + '<label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">CODE D\'INVITATION</label>'
    + '<input id="join-code" class="auth-input" placeholder="Ex: IM-K4R9" style="width:100%;text-transform:uppercase;letter-spacing:2px;font-size:18px;text-align:center;" maxlength="7">'
    + '</div>'
    + '<div id="join-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>'
    + '<button id="join-btn" class="btn btn-primary" style="width:100%;padding:14px;" onclick="submitJoin()">Valider le code →</button>'
    + '</div>';
  var inp = document.getElementById('join-code');
  if (inp) inp.addEventListener('input', function(){ this.value = this.value.toUpperCase(); });
}

async function submitJoin() {
  var code  = (document.getElementById('join-code')?.value || '').trim().toUpperCase();
  var errEl = document.getElementById('join-err');
  var btn   = document.getElementById('join-btn');
  errEl.style.display = 'none';
  if (!code || code.length < 4) { errEl.textContent='Code invalide.'; errEl.style.display='block'; return; }
  if (btn) { btn.disabled=true; btn.textContent='Vérification…'; }
  try {
    var res  = await fetch(WORKER_URL + '/join', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code: code })
    });
    var json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled=false; btn.textContent='Valider le code →'; }
      errEl.textContent = json.error || 'Code invalide'; errEl.style.display='block';
      return;
    }
    var role = json.role || 'locataire';
    _addStoredSpace({ tenantId: json.tenantId, mode: json.mode || 'individuel', nom: json.nom || '', role: role, nomCabinet: json.nomCabinet || null, locataireId: json.locataireId || null });
    SESSION = {
      userId: String(json.locataireId || json.userId || json.tenantId),
      tenantId: json.tenantId, role: role,
      version: json.mode || 'individuel',
      nom: json.nom || '',
      immeubles: [], locId: json.locataireId || null,
      _pwdHash: '', _ts: Date.now()
    };
    saveSession();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    if (role === 'locataire') {
      loadData();
      setTimeout(function(){ openPortailLocataire(); }, 400);
    } else {
      initApp();
      updateCorbeilleBadge();
    }
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='Valider le code →'; }
    errEl.textContent='Erreur réseau.'; errEl.style.display='block';
  }
}

// ── Se connecter sur un nouvel appareil ─────────────────────────
function showLoginTenantScreen() {
  var as = document.getElementById('auth-screen');
  var inner = as.querySelector('.auth-inner') || as;
  inner.innerHTML = '<div style="max-width:380px;width:100%;padding:24px 16px;margin:auto;">'
    + '<button onclick="showWelcomeScreen()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>'
    + '<div style="text-align:center;margin-bottom:24px;">'
    + '<div style="font-size:28px;">🔑</div>'
    + '<div style="font-size:17px;font-weight:800;margin-top:8px;">Connexion à mon espace</div>'
    + '<div style="font-size:12px;color:var(--text3);margin-top:4px;">Entrez vos identifiants de création de compte</div>'
    + '</div>'
    + '<div style="margin-bottom:14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">NUMÉRO DE TÉLÉPHONE</label><input id="lt-tel" class="auth-input" placeholder="699 00 00 00" type="tel" style="width:100%;"></div>'
    + '<div style="margin-bottom:20px;"><label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">MOT DE PASSE</label><input id="lt-pwd" class="auth-input" type="password" placeholder="Votre mot de passe" style="width:100%;"></div>'
    + '<div id="lt-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>'
    + '<button id="lt-btn" class="btn btn-primary" style="width:100%;padding:14px;" onclick="submitLoginTenant()">Se connecter →</button>'
    + '</div>';
}

async function submitLoginTenant() {
  var tel   = (document.getElementById('lt-tel')?.value||'').trim().replace(/\s/g,'');
  var pwd   = document.getElementById('lt-pwd')?.value||'';
  var errEl = document.getElementById('lt-err');
  var btn   = document.getElementById('lt-btn');
  errEl.style.display = 'none';
  if (!tel || !pwd) { errEl.textContent='Remplissez tous les champs.'; errEl.style.display='block'; return; }
  if (btn) { btn.disabled=true; btn.textContent='Connexion…'; }
  try {
    var passwordHash = await _hashPwd(pwd);
    var res  = await fetch(WORKER_URL + '/login-tenant', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ telephone: tel, passwordHash: passwordHash })
    });
    var json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled=false; btn.textContent='Se connecter →'; }
      errEl.textContent = json.error || 'Identifiants incorrects'; errEl.style.display='block';
      return;
    }
    _addStoredSpace({ tenantId: json.tenantId, mode: json.mode, nom: json.nom, telephone: tel, role: 'admin', nomCabinet: json.nomCabinet || null });
    SESSION = {
      userId: json.tenantId, tenantId: json.tenantId, role: 'admin',
      version: json.mode, nom: json.nom, telephone: tel,
      immeubles: [], _pwdHash: passwordHash, _ts: Date.now()
    };
    saveSession();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    showToast('Connecté ✓', 'green');
    initApp();
    updateCorbeilleBadge();
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='Se connecter →'; }
    errEl.textContent='Erreur réseau.'; errEl.style.display='block';
  }
}
