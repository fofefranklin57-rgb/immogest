// ═══════════════════════════════════════════════════════════════
// ONESIGNAL INTEGRATION — ImmoGest
// Notifications push gratuites jusqu'à 10 000 abonnés
// ═══════════════════════════════════════════════════════════════
// 1. Crée un compte sur https://onesignal.com
// 2. Crée une Web App → note l'App ID
// 3. Dans Paramètres → colle App ID + REST API Key
// ═══════════════════════════════════════════════════════════════

window.OneSignalDeferred = window.OneSignalDeferred || [];

var ONESIGNAL_CONFIG = {
  appId:      '8a3857ab-64cc-4a62-9916-ce46b4768dac',
  restApiKey: 'os_v2_app_ri4fpk3ezrfgfgiwzzdli5unvsmcdap4mq6u3u57p5bgfvkr2alcj4wfxcmkwuow2spwn6fwnaqlccmw2gnmckfeuxuki32g4275sfq'
};

// Restaurer config sauvegardée
(function _restoreOneSignalKeys() {
  try {
    var s = localStorage.getItem('immogest_onesignal');
    if (s) {
      var c = JSON.parse(s);
      if (c.appId)      ONESIGNAL_CONFIG.appId      = c.appId;
      if (c.restApiKey) ONESIGNAL_CONFIG.restApiKey = c.restApiKey;
      console.log('[OneSignal] Config restaurée');
    }
  } catch(e) {}
})();

function onesignalEstConfigured() {
  return ONESIGNAL_CONFIG.appId !== 'VOTRE_APP_ID' && ONESIGNAL_CONFIG.appId.trim() !== '';
}

// ══════════════════════════════════════════════════════════════
// 1. INITIALISATION SDK
// ══════════════════════════════════════════════════════════════
var _onesignalReady = false;

function initOneSignal() {
  if (!onesignalEstConfigured()) return;
  if (_onesignalReady) return;

  window.OneSignalDeferred.push(async function(OneSignal) {
    if (_onesignalReady) return;
    try {
      await OneSignal.init({
        appId: ONESIGNAL_CONFIG.appId,
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/' },
        notifyButton:      { enable: false },
        promptOptions: {
          slidedown: {
            prompts: [{
              type: 'push',
              autoPrompt: false,
              text: {
                actionMessage:    'Activez les notifications pour vos rappels de loyer.',
                acceptButton:     '🔔 Activer',
                cancelButton:     'Plus tard'
              }
            }]
          }
        },
        welcomeNotification: {
          title:   'ImmoGest',
          message: 'Notifications activées ! Vos rappels arriveront ici.'
        }
      });
      _onesignalReady = true;
      console.log('[OneSignal] SDK initialisé ✓');
    } catch(e) {
      console.warn('[OneSignal] Erreur init:', e.message || e);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// 2. ASSOCIER L'UTILISATEUR CONNECTÉ
// ══════════════════════════════════════════════════════════════
function loginOneSignal(externalId, tags) {
  if (!onesignalEstConfigured()) return;
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.login(String(externalId));
      if (tags && Object.keys(tags).length > 0) {
        await OneSignal.User.addTags(tags);
      }
      console.log('[OneSignal] Utilisateur lié:', externalId, tags);
    } catch(e) {
      console.warn('[OneSignal] Erreur login:', e.message || e);
    }
  });
}

function logoutOneSignal() {
  window.OneSignalDeferred.push(async function(OneSignal) {
    try { await OneSignal.logout(); } catch(e) {}
  });
}

// ══════════════════════════════════════════════════════════════
// 3. DEMANDER LA PERMISSION
// ══════════════════════════════════════════════════════════════
function requestNotificationPermission() {
  if (!onesignalEstConfigured()) return;
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      var granted = OneSignal.Notifications.permission;
      if (!granted) {
        await OneSignal.Slidedown.promptPush();
      }
    } catch(e) {
      console.warn('[OneSignal] Erreur prompt:', e.message || e);
    }
  });
}

// ══════════════════════════════════════════════════════════════
// 4. ENVOYER UNE NOTIFICATION VIA REST API
// ══════════════════════════════════════════════════════════════
async function sendOneSignalNotif(externalUserId, title, message, data) {
  if (!onesignalEstConfigured()) { console.warn('[OneSignal] Non configuré'); return false; }
  if (!ONESIGNAL_CONFIG.restApiKey) {
    console.warn('[OneSignal] REST API Key manquante — va dans Paramètres > Notifications');
    return false;
  }
  try {
    var resp = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Basic ' + ONESIGNAL_CONFIG.restApiKey
      },
      body: JSON.stringify({
        app_id:           ONESIGNAL_CONFIG.appId,
        include_aliases:  { external_id: [String(externalUserId)] },
        target_channel:   'push',
        headings:         { fr: title, en: title },
        contents:         { fr: message, en: message },
        url:              'https://immogest-34w.pages.dev/',
        data:             data || {}
      })
    });
    var json = await resp.json();
    if (json.errors && json.errors.length > 0) {
      console.error('[OneSignal] Erreur envoi:', json.errors);
      return false;
    }
    console.log('[OneSignal] Notification envoyée, ID:', json.id);
    return true;
  } catch(e) {
    console.error('[OneSignal] Erreur réseau:', e.message || e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// 5. NOTIFICATIONS MÉTIER
// ══════════════════════════════════════════════════════════════

// Rappel mensuel de loyer
function notifRappelLoyer(locataire) {
  var imm = (typeof DATA !== 'undefined') ? DATA.immeubles.find(function(i){ return i.id === locataire.iid; }) : null;
  var montant = locataire.loyer.toLocaleString('fr-FR');
  var nomImm  = imm ? ' — ' + imm.nom : '';
  return sendOneSignalNotif(
    'loc_' + locataire.id,
    '🏠 Rappel de loyer',
    'Votre loyer de ' + montant + ' ' + ((window.IG._locale && window.IG._locale.devise) || 'FCFA') + ' est dû' + nomImm + '.',
    { type: 'loyer', loc_id: String(locataire.id) }
  );
}

// Confirmation de paiement enregistré
function notifPaiementRecu(locataire, montant) {
  return sendOneSignalNotif(
    'loc_' + locataire.id,
    '✅ Paiement confirmé',
    'Votre paiement de ' + montant.toLocaleString('fr-FR') + ' ' + ((window.IG._locale && window.IG._locale.devise) || 'FCFA') + ' a bien été enregistré.',
    { type: 'paiement', loc_id: String(locataire.id) }
  );
}

// Loyer en retard
function notifLoyerEnRetard(locataire) {
  return sendOneSignalNotif(
    'loc_' + locataire.id,
    '⚠️ Loyer en retard',
    'Votre loyer est en retard. Veuillez régulariser au plus vite.',
    { type: 'retard', loc_id: String(locataire.id) }
  );
}

// Rapport disponible pour proprio
function notifRapportProprio(proprioUserId, moisLabel) {
  return sendOneSignalNotif(
    'pro_' + proprioUserId,
    '📊 Rapport disponible',
    'Votre rapport de gestion de ' + moisLabel + ' est disponible.',
    { type: 'rapport' }
  );
}

// Envoyer un rappel à TOUS les locataires impayés (appelé manuellement par l'admin)
async function notifTousImpayés() {
  if (typeof DATA === 'undefined') return;
  var impayés = DATA.locataires.filter(function(l){ return l.s === 'impayé' && l.reste > 0; });
  if (impayés.length === 0) {
    if (typeof showToast === 'function') showToast('Aucun impayé trouvé', 'info');
    return;
  }
  var count = 0;
  for (var i = 0; i < impayés.length; i++) {
    var ok = await notifLoyerEnRetard(impayés[i]);
    if (ok) count++;
  }
  if (typeof showToast === 'function')
    showToast('🔔 ' + count + ' notification(s) envoyée(s)', 'success');
}

// ══════════════════════════════════════════════════════════════
// 6. SAUVEGARDER LES CLÉS (depuis Paramètres)
// ══════════════════════════════════════════════════════════════
function saveOneSignalKeys() {
  var appId  = ((document.getElementById('onesignal-appid')  || {}).value || '').trim();
  var apiKey = ((document.getElementById('onesignal-restkey') || {}).value || '').trim();

  if (!appId) {
    if (typeof showToast === 'function') showToast('App ID OneSignal requis', 'error');
    return;
  }
  ONESIGNAL_CONFIG.appId      = appId;
  ONESIGNAL_CONFIG.restApiKey = apiKey;
  try {
    localStorage.setItem('immogest_onesignal', JSON.stringify({ appId: appId, restApiKey: apiKey }));
  } catch(e) {}

  _onesignalReady = false;
  initOneSignal();
  if (typeof showToast === 'function') showToast('✅ OneSignal configuré', 'success');
  _updateOneSignalStatusBadge();
}

function _updateOneSignalStatusBadge() {
  var badge = document.getElementById('onesignal-status-badge');
  if (!badge) return;
  badge.innerHTML = onesignalEstConfigured()
    ? '<span style="color:#38A169;font-size:11px;">● Configuré</span>'
    : '<span style="color:#718096;font-size:11px;">● Non configuré</span>';
}

// ══════════════════════════════════════════════════════════════
// Auto-init au chargement de la page
// ══════════════════════════════════════════════════════════════
(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOneSignal);
  } else {
    initOneSignal();
  }
})();
