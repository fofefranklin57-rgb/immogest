// ── Configuration paiement loyer ──────────────────────────────────────────────
// Gère la config globale + les surcharges par immeuble.
// Les locataires voient les numéros MoMo/OM et/ou un bouton vers la plateforme.
// L'admin garde le contrôle total — rien n'est imposé.

var PAY_CONFIG = _loadPayConfig();

function _loadPayConfig() {
  try {
    var raw = localStorage.getItem('immogest_pay_config');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return {
    mtn:       { active: false, numero: '', nom: '' },
    orange:    { active: false, numero: '', nom: '' },
    plateforme:{ active: false, type: 'lien', valeur: '' }
  };
}

function savePayConfig() {
  localStorage.setItem('immogest_pay_config', JSON.stringify(PAY_CONFIG));
  // Sync Supabase settings si disponible
  if (typeof sbUpsertSettings === 'function') {
    sbUpsertSettings('pay_config', PAY_CONFIG).catch(function(){});
  }
}

// Retourne la config effective pour un immeuble (override ou global)
function getPayConfig(iid) {
  var imm = (typeof DATA !== 'undefined') && DATA.immeubles
    ? DATA.immeubles.find(function(i){ return i.id === iid; })
    : null;
  if (imm && imm.payConfig && imm.payConfig.override) {
    return {
      mtn:        imm.payConfig.mtn        || { active: false, numero: '', nom: '' },
      orange:     imm.payConfig.orange     || { active: false, numero: '', nom: '' },
      plateforme: imm.payConfig.plateforme || { active: false, type: 'lien', valeur: '' }
    };
  }
  return PAY_CONFIG;
}

// ── Rendu : bloc paiement loyer vu par le locataire ──────────────────────────
function renderPaymentBlock(locId, containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;
  var l = DATA.locataires.find(function(x){ return x.id === locId; });
  if (!l) return;
  var cfg = getPayConfig(l.iid);
  var hasAny = (cfg.mtn.active && cfg.mtn.numero) ||
               (cfg.orange.active && cfg.orange.numero) ||
               (cfg.plateforme.active && cfg.plateforme.valeur);
  if (!hasAny) { container.innerHTML = ''; return; }

  var montantDu = l.reste > 0 ? l.reste : l.loyer;
  var montantLabel = montantDu > 0
    ? '<span style="font-size:13px;font-weight:700;color:var(--accent);">' + fmt(montantDu) + ' FCFA</span>'
    : '';

  var rows = '';
  if (cfg.mtn.active && cfg.mtn.numero) {
    rows += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">' +
      '<span style="font-size:22px;">📱</span>' +
      '<div style="flex:1;"><div style="font-weight:600;font-size:13px;">MTN Mobile Money</div>' +
      (cfg.mtn.nom ? '<div style="font-size:11px;color:var(--text3);">' + cfg.mtn.nom + '</div>' : '') + '</div>' +
      '<div style="font-family:monospace;font-size:14px;font-weight:700;letter-spacing:.05em;cursor:pointer;" ' +
        'onclick="_copyPayNum(\'' + cfg.mtn.numero + '\')" title="Copier">' + cfg.mtn.numero +
        ' <span style="font-size:10px;color:var(--text3);">⧉</span></div>' +
    '</div>';
  }
  if (cfg.orange.active && cfg.orange.numero) {
    rows += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">' +
      '<span style="font-size:22px;">🟠</span>' +
      '<div style="flex:1;"><div style="font-weight:600;font-size:13px;">Orange Money</div>' +
      (cfg.orange.nom ? '<div style="font-size:11px;color:var(--text3);">' + cfg.orange.nom + '</div>' : '') + '</div>' +
      '<div style="font-family:monospace;font-size:14px;font-weight:700;letter-spacing:.05em;cursor:pointer;" ' +
        'onclick="_copyPayNum(\'' + cfg.orange.numero + '\')" title="Copier">' + cfg.orange.numero +
        ' <span style="font-size:10px;color:var(--text3);">⧉</span></div>' +
    '</div>';
  }

  var plateformeBtn = '';
  if (cfg.plateforme.active && cfg.plateforme.valeur) {
    var label = { notchpay:'NotchPay', cinetpay:'CinetPay', paydunya:'PayDunya', wave:'Wave', lien:'Payer en ligne' }[cfg.plateforme.type] || 'Payer en ligne';
    plateformeBtn =
      '<button class="btn btn-primary" style="width:100%;margin-top:12px;" ' +
        'onclick="_openPlatformePay(' + locId + ',' + montantDu + ')">' +
        '🔗 ' + label + (montantDu > 0 ? ' — ' + fmt(montantDu) + ' FCFA' : '') +
      '</button>';
  }

  container.innerHTML =
    '<div style="background:var(--bg3);border-radius:10px;padding:14px 16px;margin-top:14px;">' +
      '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text3);margin-bottom:8px;">💳 Payer votre loyer ' + montantLabel + '</div>' +
      (rows || '') +
      plateformeBtn +
      (cfg.mtn.active || cfg.orange.active
        ? '<div style="font-size:11px;color:var(--text3);margin-top:8px;">Cliquez sur le numéro pour le copier, puis effectuez le virement depuis votre application mobile.</div>'
        : '') +
    '</div>';
}

function _copyPayNum(num) {
  navigator.clipboard.writeText(num.replace(/\s/g,'')).then(function(){
    if (typeof showToast === 'function') showToast('Numéro copié : ' + num, 'green');
  }).catch(function(){
    if (typeof showToast === 'function') showToast(num, 'info');
  });
}

function _openPlatformePay(locId, montant) {
  var l = DATA.locataires.find(function(x){ return x.id === locId; });
  if (!l) return;
  var cfg = getPayConfig(l.iid);
  var p = cfg.plateforme;
  if (!p.active || !p.valeur) return;

  if (p.type === 'notchpay') {
    _initNotchPayLoyer(locId, montant, p.valeur);
  } else {
    // Lien personnalisé ou autre plateforme : ouvrir avec montant en paramètre si possible
    var url = p.valeur;
    if (montant > 0 && url.indexOf('{montant}') !== -1) url = url.replace('{montant}', montant);
    else if (montant > 0 && url.indexOf('?') === -1) url += '?montant=' + montant + '&ref=loyer_' + locId;
    window.open(url, '_blank');
  }
}

async function _initNotchPayLoyer(locId, montant, apiKey) {
  var l = DATA.locataires.find(function(x){ return x.id === locId; });
  if (!l) return;
  var imm = DATA.immeubles.find(function(i){ return i.id === l.iid; });
  var ref = 'loyer_' + locId + '_' + Date.now();
  try {
    var resp = await fetch('https://api.notchpay.co/payments/initialize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'locataire' + locId + '@immogest.app',
        amount: montant,
        currency: 'XAF',
        description: 'Loyer ' + (imm ? imm.nom : '') + ' — local ' + (l.local||''),
        reference: ref,
        callback: window.location.href
      })
    });
    var data = await resp.json();
    if (!resp.ok) throw new Error(data.message || 'Erreur');
    var authUrl = data.authorization_url || (data.transaction && data.transaction.authorization_url);
    if (authUrl) {
      window.open(authUrl, '_blank');
      _pollLoyerPaiement(ref, locId, montant, apiKey);
    }
  } catch(e) {
    if (typeof showToast === 'function') showToast('Erreur : ' + e.message, 'error');
  }
}

// Polling après paiement loyer NotchPay → enregistrement automatique
function _pollLoyerPaiement(ref, locId, montant, apiKey) {
  var ticks = 0;
  var timer = setInterval(async function() {
    ticks += 5;
    if (ticks > 120) { clearInterval(timer); return; }
    try {
      var resp = await fetch('https://api.notchpay.co/payments/' + ref, {
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Accept': 'application/json' }
      });
      var data = await resp.json();
      var st = (data.transaction && data.transaction.status) || data.status || '';
      if (st === 'complete') {
        clearInterval(timer);
        _enregistrerPaiementLoyer(locId, montant, ref);
      } else if (st === 'failed' || st === 'canceled') {
        clearInterval(timer);
        if (typeof showToast === 'function') showToast('Paiement refusé ou annulé.', 'error');
      }
    } catch(e) {}
  }, 5000);
}

// Enregistrement automatique du paiement dans DATA + Supabase
function _enregistrerPaiementLoyer(locId, montant, ref) {
  var l = DATA.locataires.find(function(x){ return x.id === locId; });
  if (!l) return;
  var today = new Date();
  var dateStr = today.toISOString().split('T')[0];
  var paiement = {
    id: DATA.nextPayId++,
    locId: locId,
    date: dateStr,
    montant: montant,
    moisC: today.getMonth(),
    anneeC: today.getFullYear(),
    moisFin: today.getMonth(),
    anneeFin: today.getFullYear(),
    type: 'loyer',
    mode: 'en_ligne',
    note: 'Paiement en ligne — réf. ' + ref,
    remisAuBailleur: false
  };
  DATA.paiements.push(paiement);
  l.reste = Math.max(0, (l.reste || 0) - montant);
  l.s = l.reste === 0 ? 'payé' : 'impayé';
  if (typeof saveData === 'function') saveData();
  if (typeof SESSION !== 'undefined' && SESSION) {
    if (typeof savePaiementToSupabase === 'function') savePaiementToSupabase(paiement);
    if (typeof saveLocataireToSupabase === 'function') saveLocataireToSupabase(l);
  }
  if (typeof showToast === 'function') showToast('✅ Paiement enregistré automatiquement !', 'green');
  if (typeof renderCurrent === 'function') renderCurrent();
  // Rafraîchir le bloc paiement si visible
  var container = document.getElementById('pay-block-' + locId);
  if (container) renderPaymentBlock(locId, 'pay-block-' + locId);
}

// ── Rendu : formulaire de config (utilisé dans paramètres + modal immeuble) ──

function renderPayConfigForm(cfg, prefix, showOverride) {
  var ovChecked = showOverride && cfg && cfg.override ? 'checked' : '';
  var mtn    = cfg && cfg.mtn    ? cfg.mtn    : { active: false, numero: '', nom: '' };
  var orange = cfg && cfg.orange ? cfg.orange : { active: false, numero: '', nom: '' };
  var plat   = cfg && cfg.plateforme ? cfg.plateforme : { active: false, type: 'lien', valeur: '' };

  var overrideRow = showOverride
    ? '<label style="display:flex;align-items:center;gap:8px;margin-bottom:14px;cursor:pointer;">' +
        '<input type="checkbox" id="' + prefix + '-override" ' + ovChecked + ' onchange="_togglePayOverride(\'' + prefix + '\')">' +
        '<span style="font-weight:600;font-size:13px;">Utiliser une configuration spécifique pour cet immeuble</span>' +
      '</label>'
    : '';

  var bodyStyle = showOverride ? 'id="' + prefix + '-body" style="' + (ovChecked ? '' : 'display:none;') + '"' : '';

  return overrideRow +
    '<div ' + bodyStyle + '>' +
      // MTN
      '<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;">' +
        '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<input type="checkbox" id="' + prefix + '-mtn-active" ' + (mtn.active ? 'checked' : '') + '>' +
          '<span style="font-size:22px;">📱</span><strong>MTN Mobile Money</strong>' +
        '</label>' +
        '<div class="form-row" style="margin:0;">' +
          '<div class="form-group" style="margin-bottom:0;"><input type="tel" id="' + prefix + '-mtn-num" placeholder="Ex : 677 000 000" value="' + (mtn.numero||'') + '"></div>' +
          '<div class="form-group" style="margin-bottom:0;"><input type="text" id="' + prefix + '-mtn-nom" placeholder="Nom du bénéficiaire" value="' + (mtn.nom||'') + '"></div>' +
        '</div>' +
      '</div>' +
      // Orange
      '<div style="border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;">' +
        '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<input type="checkbox" id="' + prefix + '-om-active" ' + (orange.active ? 'checked' : '') + '>' +
          '<span style="font-size:22px;">🟠</span><strong>Orange Money</strong>' +
        '</label>' +
        '<div class="form-row" style="margin:0;">' +
          '<div class="form-group" style="margin-bottom:0;"><input type="tel" id="' + prefix + '-om-num" placeholder="Ex : 690 000 000" value="' + (orange.numero||'') + '"></div>' +
          '<div class="form-group" style="margin-bottom:0;"><input type="text" id="' + prefix + '-om-nom" placeholder="Nom du bénéficiaire" value="' + (orange.nom||'') + '"></div>' +
        '</div>' +
      '</div>' +
      // Plateforme
      '<div style="border:1px solid var(--border);border-radius:8px;padding:12px;">' +
        '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
          '<input type="checkbox" id="' + prefix + '-plat-active" ' + (plat.active ? 'checked' : '') + '>' +
          '<span style="font-size:22px;">🔗</span><strong>Plateforme de paiement en ligne</strong>' +
        '</label>' +
        '<div class="form-row" style="margin:0;">' +
          '<div class="form-group" style="margin-bottom:0;">' +
            '<select id="' + prefix + '-plat-type">' +
              '<option value="lien"'     + (plat.type==='lien'     ?'selected':'') + '>Lien personnalisé</option>' +
              '<option value="notchpay"' + (plat.type==='notchpay' ?'selected':'') + '>NotchPay (clé API)</option>' +
              '<option value="cinetpay"' + (plat.type==='cinetpay' ?'selected':'') + '>CinetPay</option>' +
              '<option value="paydunya"' + (plat.type==='paydunya' ?'selected':'') + '>PayDunya</option>' +
              '<option value="wave"'     + (plat.type==='wave'     ?'selected':'') + '>Wave</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0;"><input type="text" id="' + prefix + '-plat-val" placeholder="URL ou clé API" value="' + (plat.valeur||'') + '"></div>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:6px;">Pour un lien personnalisé, utilisez <code>{montant}</code> dans l\'URL pour insérer le montant automatiquement.</div>' +
      '</div>' +
    '</div>';
}

function _togglePayOverride(prefix) {
  var cb   = document.getElementById(prefix + '-override');
  var body = document.getElementById(prefix + '-body');
  if (body) body.style.display = cb && cb.checked ? '' : 'none';
}

// Lire les valeurs du formulaire de config
function readPayConfigForm(prefix) {
  function v(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function c(id) { var el = document.getElementById(id); return el ? el.checked : false; }
  return {
    mtn:    { active: c(prefix+'-mtn-active'), numero: v(prefix+'-mtn-num'), nom: v(prefix+'-mtn-nom') },
    orange: { active: c(prefix+'-om-active'),  numero: v(prefix+'-om-num'),  nom: v(prefix+'-om-nom')  },
    plateforme: { active: c(prefix+'-plat-active'), type: v(prefix+'-plat-type'), valeur: v(prefix+'-plat-val') }
  };
}

// ── Panel paramètres globaux ──────────────────────────────────────────────────

function openPayConfigPanel() {
  var existing = document.getElementById('modal-pay-config');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.id = 'modal-pay-config';
  modal.className = 'overlay open';
  modal.style.zIndex = '10020';
  modal.innerHTML =
    '<div class="modal" style="max-width:520px;">' +
      '<h3 style="margin-bottom:4px;">💳 Configuration paiement loyer</h3>' +
      '<p style="font-size:12px;color:var(--text3);margin-bottom:16px;">Ces paramètres s\'appliquent à tous vos immeubles. Chaque immeuble peut avoir sa propre configuration via le bouton "Modifier" de l\'immeuble.</p>' +
      '<div id="pay-config-global-form">' + renderPayConfigForm(PAY_CONFIG, 'pcg', false) + '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Annuler</button>' +
        '<button class="btn btn-primary" onclick="_savePayConfigGlobal()">✓ Enregistrer</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(modal);
}

function _savePayConfigGlobal() {
  PAY_CONFIG = readPayConfigForm('pcg');
  savePayConfig();
  var m = document.getElementById('modal-pay-config');
  if (m) m.remove();
  if (typeof showToast === 'function') showToast('Configuration paiement enregistrée ✓', 'green');
}

// Sauvegarde depuis la page Paramètres (formulaire inline, même prefix 'pcg')
function _savePayConfigInline() {
  PAY_CONFIG = readPayConfigForm('pcg');
  savePayConfig();
  if (typeof showToast === 'function') showToast('✓ Configuration paiement loyer enregistrée', 'green');
}
