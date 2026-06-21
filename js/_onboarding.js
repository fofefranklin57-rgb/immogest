
// ════════════════════════════════════════════════════════════════
// ONBOARDING MULTI-TENANT — Bienvenue / Inscription / Rejoindre
// ════════════════════════════════════════════════════════════════

const TENANT_KEY = 'immogest_tenant_v1';

function _getStoredTenant() {
  try { return JSON.parse(localStorage.getItem(TENANT_KEY) || 'null'); } catch(e) { return null; }
}
function _setStoredTenant(t) {
  localStorage.setItem(TENANT_KEY, JSON.stringify(t));
}

// ── Écran de bienvenue (1er lancement) ──────────────────────────
function showWelcomeScreen() {
  const as = document.getElementById('auth-screen');
  if (!as) return;
  as.style.display = 'flex';
  const inner = as.querySelector('.auth-inner') || as;
  inner.innerHTML = `
    <div style="max-width:480px;width:100%;padding:24px 16px;margin:auto;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:36px;margin-bottom:8px;">🏢</div>
        <div style="font-size:22px;font-weight:800;color:var(--text);">ImmoGest</div>
        <div style="font-size:13px;color:var(--text3);margin-top:4px;">Gestion immobilière simplifiée</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:14px;">
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:var(--surface2,#f1f5f9);border-radius:20px;font-size:10px;font-weight:600;color:var(--text2,#475569);">✅ Droit local conforme</span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:var(--surface2,#f1f5f9);border-radius:20px;font-size:10px;font-weight:600;color:var(--text2,#475569);">📶 Fonctionne hors-ligne</span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:var(--surface2,#f1f5f9);border-radius:20px;font-size:10px;font-weight:600;color:var(--text2,#475569);">📱 Mobile Money &amp; Paiement en ligne</span>
          <span style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:var(--surface2,#f1f5f9);border-radius:20px;font-size:10px;font-weight:600;color:var(--text2,#475569);">🤖 Assistant IA intégré</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <button class="btn btn-primary" style="padding:16px;font-size:15px;border-radius:12px;" onclick="showModeSelection()">
          🏠 Créer mon espace
          <div style="font-size:11px;font-weight:400;margin-top:2px;opacity:0.85;">Gestionnaire ou propriétaire — nouveau compte</div>
        </button>
        <button class="btn btn-ghost" style="padding:16px;font-size:15px;border-radius:12px;border:1px solid var(--border);" onclick="showJoinScreen()">
          🔗 Rejoindre un espace
          <div style="font-size:11px;font-weight:400;margin-top:2px;opacity:0.7;">Locataire — entrer un code d'invitation</div>
        </button>
        <button class="btn btn-ghost" style="padding:12px;font-size:13px;border-radius:12px;" onclick="showLoginTenantScreen()">
          🔑 Se connecter à mon espace existant
        </button>
      </div>
    </div>`;
}

// ── Choix du profil (3 types) ────────────────────────────────────
function showModeSelection() {
  const as = document.getElementById('auth-screen');
  const inner = as.querySelector('.auth-inner') || as;

  const profils = [
    {
      id: 'proprietaire', icon: '🏠', label: 'Propriétaire',
      desc: 'Je gère mes propres biens en autonomie',
      features: [
        { ok: true,  t: 'Suivi locataires & loyers' },
        { ok: true,  t: 'Fiches de suivi & reçus' },
        { ok: true,  t: 'Rapports simplifiés' },
        { ok: false, t: 'Honoraires cabinet' },
        { ok: false, t: 'Section remis au bailleur' },
        { ok: false, t: 'Multi-utilisateurs' }
      ],
      note: 'Idéal si vous êtes propriétaire et gérez vous-même vos appartements',
      mode: 'individuel'
    },
    {
      id: 'gestionnaire', icon: '👤', label: 'Gestionnaire indépendant',
      desc: 'Je gère les biens d\'autres propriétaires',
      features: [
        { ok: true,  t: 'Suivi locataires & loyers' },
        { ok: true,  t: 'Fiches de suivi & reçus' },
        { ok: true,  t: 'Rapport complet par immeuble' },
        { ok: true,  t: 'Honoraires configurables' },
        { ok: true,  t: 'Section remis au bailleur' },
        { ok: false, t: 'Multi-utilisateurs / équipe' }
      ],
      note: 'Idéal si vous gérez les biens d\'autrui seul, sans structure formelle',
      mode: 'individuel'
    },
    {
      id: 'cabinet', icon: '🏢', label: 'Cabinet immobilier',
      desc: 'Structure professionnelle avec équipe',
      features: [
        { ok: true, t: 'Tout du gestionnaire' },
        { ok: true, t: 'Branding cabinet (logo, cachet)' },
        { ok: true, t: 'Multi-utilisateurs & rôles' },
        { ok: true, t: 'Documents juridiques' },
        { ok: true, t: 'Signature numérique' },
        { ok: true, t: 'Support prioritaire' }
      ],
      note: 'Idéal pour un cabinet, une agence ou une SCI professionnelle',
      mode: 'entreprise'
    }
  ];

  const cards = profils.map(function(p) {
    return `<div style="border:2px solid var(--border);border-radius:14px;padding:18px;cursor:pointer;transition:border-color .15s"
      id="profil-card-${p.id}"
      onclick="selectProfil('${p.id}','${p.mode}')">
      <div style="font-size:24px;text-align:center;margin-bottom:8px">${p.icon}</div>
      <div style="font-size:14px;font-weight:800;text-align:center;margin-bottom:4px">${p.label}</div>
      <div style="font-size:11px;color:var(--text3);text-align:center;margin-bottom:12px;font-style:italic">${p.desc}</div>
      <div style="font-size:11.5px;line-height:2;margin-bottom:10px">
        ${p.features.map(f => (f.ok ? '✅ ' : '❌ ') + f.t).join('<br>')}
      </div>
      <div style="font-size:10.5px;color:var(--text3);border-top:1px solid var(--border);padding-top:8px;font-style:italic">${p.note}</div>
    </div>`;
  }).join('');

  inner.innerHTML = `
    <div style="max-width:760px;width:100%;padding:24px 16px;margin:auto;overflow-y:auto;max-height:100vh;">
      <button onclick="showWelcomeScreen()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>
      <div style="text-align:center;margin-bottom:20px">
        <div style="font-size:18px;font-weight:800;color:var(--text)">Quel est votre profil ?</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">Ce choix définit comment l'application fonctionne. Modifiable dans les paramètres.</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">${cards}</div>
    </div>`;
}

function selectProfil(profilId, mode) {
  document.querySelectorAll('[id^="profil-card-"]').forEach(function(el) {
    el.style.borderColor = 'var(--border)';
  });
  var card = document.getElementById('profil-card-' + profilId);
  if (card) card.style.borderColor = '#0E6AAF';
  setTimeout(function() { showRegistrationForm(mode, profilId); }, 180);
}
}

// ── Formulaire d'inscription ─────────────────────────────────────
function showRegistrationForm(mode, typeProfil) {
  const as = document.getElementById('auth-screen');
  const inner = as.querySelector('.auth-inner') || as;
  const isEntreprise = mode === 'entreprise';
  const profil = typeProfil || (isEntreprise ? 'cabinet' : 'proprietaire');
  const icons   = { proprietaire: '🏠', gestionnaire: '👤', cabinet: '🏢' };
  const labels  = { proprietaire: 'Propriétaire', gestionnaire: 'Gestionnaire indépendant', cabinet: 'Cabinet immobilier' };
  inner.innerHTML = `
    <div style="max-width:400px;width:100%;padding:24px 16px;margin:auto;">
      <button onclick="showModeSelection()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:24px;">${icons[profil] || '👤'}</div>
        <div style="font-size:17px;font-weight:800;color:var(--text);margin-top:6px;">Créer votre espace</div>
        <div style="font-size:12px;color:var(--text3);margin-top:2px;">${labels[profil] || ''}</div>
      </div>
      ${isEntreprise ? `
        <div style="margin-bottom:14px;">
          <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">NOM DU CABINET</label>
          <input id="reg-cabinet" class="auth-input" placeholder="Ex: Cabinet CRAA, Immobilier Kamdem…" style="width:100%;">
        </div>` : ''}
      <div style="margin-bottom:14px;">
        <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">VOTRE NOM COMPLET</label>
        <input id="reg-nom" class="auth-input" placeholder="Jean Kamdem" style="width:100%;">
      </div>
      <div style="margin-bottom:14px;" id="reg-tel-wrap"></div>
      <script>document.getElementById('reg-tel-wrap').innerHTML = window.IG.utils.phoneField('reg-tel', 'NUMÉRO DE TÉLÉPHONE', '', true);<\/script>
      <div style="margin-bottom:14px;">
        <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">MOT DE PASSE</label>
        <input id="reg-pwd" class="auth-input" type="password" placeholder="Minimum 6 caractères" style="width:100%;">
      </div>
      <div style="margin-bottom:20px;">
        <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">CONFIRMER LE MOT DE PASSE</label>
        <input id="reg-pwd2" class="auth-input" type="password" placeholder="Répéter le mot de passe" style="width:100%;">
      </div>
      <div id="reg-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>
      <button id="reg-btn" class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;" onclick="submitRegistration('${mode}','${profil}')">
        Créer mon espace →
      </button>
    </div>`;
}

async function submitRegistration(mode, typeProfil) {
  const nomEl     = document.getElementById('reg-nom');
  const telEl     = document.getElementById('reg-tel');
  const pwdEl     = document.getElementById('reg-pwd');
  const pwd2El    = document.getElementById('reg-pwd2');
  const cabinetEl = document.getElementById('reg-cabinet');
  const errEl     = document.getElementById('reg-err');
  const btn       = document.getElementById('reg-btn');

  const nom    = (nomEl?.value || '').trim();
  const tel    = window.IG.utils.phoneFieldValue('reg-tel').replace(/\s/g,'');
  const pwd    = pwdEl?.value || '';
  const pwd2   = pwd2El?.value || '';
  const nomCab = cabinetEl ? (cabinetEl.value || '').trim() : '';

  errEl.style.display = 'none';
  const showErr = msg => { errEl.textContent = msg; errEl.style.display = 'block'; };

  if (!nom) return showErr('Veuillez saisir votre nom complet.');
  if (!tel || tel.length < 8) return showErr('Numéro de téléphone invalide.');
  if (pwd.length < 6) return showErr('Le mot de passe doit contenir au moins 6 caractères.');
  if (pwd !== pwd2) return showErr('Les mots de passe ne correspondent pas.');
  if (mode === 'entreprise' && !nomCab) return showErr('Veuillez saisir le nom du cabinet.');

  if (btn) { btn.disabled = true; btn.textContent = 'Création en cours…'; }

  try {
    const passwordHash = await _hashPwd(pwd);
    const res = await fetch(WORKER_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, telephone: tel, passwordHash, mode, typeProfil: typeProfil || null, nomCabinet: nomCab || null })
    });
    const json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled = false; btn.textContent = 'Créer mon espace →'; }
      return showErr(json.error || 'Erreur serveur');
    }

    const profil = typeProfil || (mode === 'entreprise' ? 'cabinet' : 'proprietaire');
    _setStoredTenant({ tenantId: json.tenantId, mode, typeProfil: profil, nom, telephone: tel, created_at: new Date().toISOString() });
    SESSION = {
      userId:      json.tenantId,
      tenantId:    json.tenantId,
      role:        'admin',
      version:     mode,
      type_profil: profil,
      nom,
      telephone:   tel,
      immeubles:   [],
      plan:        json.plan || 'starter',
      plan_expire: json.plan_expire || null,
      _pwdHash:    passwordHash,
      _ts:         Date.now()
    };
    saveSession();
    USERS = [];

    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    showToast('Espace créé avec succès ! Bienvenue 🎉', 'green');
    initApp();
    updateCorbeilleBadge();
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Créer mon espace →'; }
    showErr('Erreur réseau. Vérifiez votre connexion.');
  }
}

// ── Rejoindre avec code d'invitation (locataire) ─────────────────
function showJoinScreen() {
  const as = document.getElementById('auth-screen');
  const inner = as.querySelector('.auth-inner') || as;
  inner.innerHTML = `
    <div style="max-width:380px;width:100%;padding:24px 16px;margin:auto;">
      <button onclick="showWelcomeScreen()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;">🔗</div>
        <div style="font-size:17px;font-weight:800;margin-top:8px;">Rejoindre un espace</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px;">Entrez le code que votre gestionnaire vous a communiqué</div>
      </div>
      <div style="margin-bottom:16px;">
        <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">CODE D'INVITATION</label>
        <input id="join-code" class="auth-input" placeholder="Ex: IM-K4R9" style="width:100%;text-transform:uppercase;letter-spacing:2px;font-size:18px;text-align:center;" maxlength="7">
      </div>
      <div id="join-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>
      <button id="join-btn" class="btn btn-primary" style="width:100%;padding:14px;" onclick="submitJoin()">Valider le code →</button>
    </div>`;
  const inp = document.getElementById('join-code');
  if (inp) inp.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
}

async function submitJoin() {
  const code  = (document.getElementById('join-code')?.value || '').trim().toUpperCase();
  const errEl = document.getElementById('join-err');
  const btn   = document.getElementById('join-btn');
  errEl.style.display = 'none';
  if (!code || code.length < 4) { errEl.textContent = 'Code invalide.'; errEl.style.display='block'; return; }
  if (btn) { btn.disabled=true; btn.textContent='Vérification…'; }

  try {
    const res  = await fetch(WORKER_URL + '/join', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ code })
    });
    const json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled=false; btn.textContent='Valider le code →'; }
      errEl.textContent = json.error || 'Code invalide'; errEl.style.display='block';
      return;
    }
    _setStoredTenant({ tenantId: json.tenantId, mode:'locataire', locataireId: json.locataireId });
    SESSION = {
      userId:    String(json.locataireId),
      tenantId:  json.tenantId,
      role:      'locataire',
      version:   'individuel',
      nom:       json.locataireNom || 'Locataire',
      immeubles: [],
      locId:     json.locataireId,
      _pwdHash:  '',
      _ts: Date.now()
    };
    saveSession();
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    loadData();
    setTimeout(() => openPortailLocataire(), 400);
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='Valider le code →'; }
    errEl.textContent='Erreur réseau.'; errEl.style.display='block';
  }
}

// ── Se connecter sur un nouvel appareil ─────────────────────────
function showLoginTenantScreen() {
  const as = document.getElementById('auth-screen');
  const inner = as.querySelector('.auth-inner') || as;
  inner.innerHTML = `
    <div style="max-width:380px;width:100%;padding:24px 16px;margin:auto;">
      <button onclick="showWelcomeScreen()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:13px;margin-bottom:16px;">← Retour</button>
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;">🔑</div>
        <div style="font-size:17px;font-weight:800;margin-top:8px;">Connexion à mon espace</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px;">Entrez vos identifiants de création de compte</div>
      </div>
      <div style="margin-bottom:14px;" id="lt-tel-wrap"></div>
      <script>document.getElementById('lt-tel-wrap').innerHTML = window.IG.utils.phoneField('lt-tel', 'NUMÉRO DE TÉLÉPHONE', '', true);<\/script>
      <div style="margin-bottom:20px;">
        <label style="font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:4px;">MOT DE PASSE</label>
        <input id="lt-pwd" class="auth-input" type="password" placeholder="Votre mot de passe" style="width:100%;">
      </div>
      <div id="lt-err" style="display:none;color:var(--red);font-size:12px;margin-bottom:12px;padding:8px;background:rgba(255,0,0,0.08);border-radius:8px;"></div>
      <button id="lt-btn" class="btn btn-primary" style="width:100%;padding:14px;" onclick="submitLoginTenant()">Se connecter →</button>
    </div>`;
}

async function submitLoginTenant() {
  const tel   = window.IG.utils.phoneFieldValue('lt-tel').replace(/\s/g,'');
  const pwd   = document.getElementById('lt-pwd')?.value||'';
  const errEl = document.getElementById('lt-err');
  const btn   = document.getElementById('lt-btn');
  errEl.style.display = 'none';
  if (!tel || !pwd) { errEl.textContent='Remplissez tous les champs.'; errEl.style.display='block'; return; }
  if (btn) { btn.disabled=true; btn.textContent='Connexion…'; }

  try {
    const passwordHash = await _hashPwd(pwd);
    const res  = await fetch(WORKER_URL + '/login-tenant', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ telephone: tel, passwordHash })
    });
    const json = await res.json();
    if (!json.ok) {
      if (btn) { btn.disabled=false; btn.textContent='Se connecter →'; }
      errEl.textContent = json.error || 'Erreur'; errEl.style.display='block';
      return;
    }
    const profilLogin = json.type_profil || (json.mode === 'entreprise' ? 'cabinet' : 'proprietaire');
    _setStoredTenant({ tenantId: json.tenantId, mode: json.mode, typeProfil: profilLogin, nom: json.nom, telephone: tel });
    SESSION = {
      userId:      json.tenantId,
      tenantId:    json.tenantId,
      role:        'admin',
      version:     json.mode,
      type_profil: profilLogin,
      nom:         json.nom,
      telephone:   tel,
      immeubles:   [],
      _pwdHash:    passwordHash,
      _ts: Date.now()
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
