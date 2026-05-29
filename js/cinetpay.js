// ═══════════════════════════════════════════════════════════════
// CINETPAY INTEGRATION — ImmoGest v1.0
// Passerelle de paiement pour les abonnements
// ═══════════════════════════════════════════════════════════════
// API Key configurée ✅
// site_id : à remplir après passage en production CinetPay
//   → dashboard CinetPay → Caisses → Immogest → ID numérique
// ═══════════════════════════════════════════════════════════════

const CINETPAY_CONFIG = {
  apikey:   'sk_live_BOpPKiNhCGFy', // ✅ clé API configurée
  site_id:  '',                      // ← à remplir après passage en production
  mode:     'TEST',                  // 'TEST' → 'PRODUCTION' après vérification
  currency: 'XAF',
  channels: 'ALL',                   // MTN + Orange + Carte
  lang:     'fr',
  notify_url: 'https://immogest-34w.pages.dev/notify',
  return_url:  'https://immogest-34w.pages.dev/',
  cancel_url:  'https://immogest-34w.pages.dev/'
};

// ── État interne ──
var _cinetpaySDKLoaded  = false;
var _cinetpaySDKLoading = false;
var _pendingPayment     = null; // { plan, duree, total } sauvegardé pendant le paiement

// ══════════════════════════════════════════════════════════════
// 1. CHARGEMENT DU SDK
// ══════════════════════════════════════════════════════════════
function loadCinetPaySDK(callback) {
  if (_cinetpaySDKLoaded) { callback && callback(); return; }
  if (_cinetpaySDKLoading) {
    // Attendre que le chargement en cours finisse
    var t = setInterval(function() {
      if (_cinetpaySDKLoaded) { clearInterval(t); callback && callback(); }
    }, 100);
    return;
  }
  _cinetpaySDKLoading = true;
  var script = document.createElement('script');
  script.src = 'https://cdn.cinetpay.com/seamless/main.js';
  script.onload = function() {
    _cinetpaySDKLoaded  = true;
    _cinetpaySDKLoading = false;
    console.log('[CinetPay] SDK chargé');
    callback && callback();
  };
  script.onerror = function() {
    _cinetpaySDKLoading = false;
    console.error('[CinetPay] Impossible de charger le SDK');
    if (typeof showToast === 'function')
      showToast('Erreur de connexion au service de paiement. Vérifiez votre connexion.', 'error');
  };
  document.head.appendChild(script);
}

// ══════════════════════════════════════════════════════════════
// 2. VÉRIFIER SI LES CLÉS SONT CONFIGURÉES
// ══════════════════════════════════════════════════════════════
function cinetpayEstConfigured() {
  return CINETPAY_CONFIG.apikey  !== 'VOTRE_APIKEY' &&
         CINETPAY_CONFIG.apikey  !== '' &&
         CINETPAY_CONFIG.site_id !== 'VOTRE_SITE_ID' &&
         CINETPAY_CONFIG.site_id !== '';
  // Retourne false tant que site_id n'est pas rempli → affiche paiement manuel
}

// ══════════════════════════════════════════════════════════════
// 3. LANCER UN PAIEMENT
// ══════════════════════════════════════════════════════════════
function payerAvecCinetPay(plan, duree) {
  // Vérifier que les clés sont configurées
  if (!cinetpayEstConfigured()) {
    _showCinetPayNotConfigured();
    return;
  }

  var planInfo = (typeof PLANS !== 'undefined') ? PLANS[plan] : null;
  if (!planInfo) { console.error('[CinetPay] Plan introuvable:', plan); return; }

  // Calcul du montant
  var monthly  = planInfo.price;
  var discount = duree === 3 ? 0.05 : duree === 6 ? 0.10 : duree === 12 ? 0.17 : 0;
  var total    = Math.round(monthly * duree * (1 - discount));

  if (total <= 0) {
    // Plan gratuit — activer directement
    if (typeof _confirmerPaiementAbonnement === 'function')
      _confirmerPaiementAbonnement(plan, duree);
    return;
  }

  // Sauvegarder pour activer après confirmation
  _pendingPayment = { plan: plan, duree: duree, total: total, ts: Date.now() };
  try { localStorage.setItem('immogest_pending_payment', JSON.stringify(_pendingPayment)); } catch(e) {}

  // Générer un ID de transaction unique
  var transactionId = 'IMG' + Date.now() + Math.floor(Math.random() * 1000);

  // Récupérer infos du client connecté
  var customerName  = (typeof SESSION !== 'undefined' && SESSION) ? (SESSION.nom || 'Client') : 'Client';
  var customerEmail = (typeof SESSION !== 'undefined' && SESSION) ? (SESSION.email || '') : '';
  var customerPhone = (typeof SESSION !== 'undefined' && SESSION) ? (SESSION.telephone || '') : '';

  // Afficher loader
  _showCinetPayLoader(planInfo.label, total, duree);

  // Charger SDK puis lancer
  loadCinetPaySDK(function() {
    try {
      CinetPay.setConfig({
        apikey:     CINETPAY_CONFIG.apikey,
        site_id:    CINETPAY_CONFIG.site_id,
        notify_url: CINETPAY_CONFIG.notify_url,
        return_url:  CINETPAY_CONFIG.return_url,
        mode:       CINETPAY_CONFIG.mode,
        lang:       CINETPAY_CONFIG.lang
      });

      CinetPay.getCheckout({
        transaction_id:       transactionId,
        amount:               total,
        currency:             CINETPAY_CONFIG.currency,
        channels:             CINETPAY_CONFIG.channels,
        description:          'Abonnement ImmoGest ' + planInfo.label + ' — ' + duree + ' mois',
        customer_name:        customerName.split(' ').slice(1).join(' ') || customerName,
        customer_surname:     customerName.split(' ')[0] || 'Client',
        customer_email:       customerEmail || 'client@immogest.cm',
        customer_phone_number: customerPhone.replace(/\D/g, '') || '690000000',
        customer_address:     'Cameroun',
        customer_city:        'Yaoundé',
        customer_country:     'CM',
        customer_state:       'CM',
        customer_zip_code:    '00000'
      });

      // Réponse de paiement
      CinetPay.waitResponse(function(data) {
        _hideCinetPayLoader();
        console.log('[CinetPay] Réponse paiement:', data);

        if (data.status === 'ACCEPTED') {
          _onCinetPaySuccess(plan, duree, transactionId, data);
        } else if (data.status === 'REFUSED') {
          _onCinetPayRefused(data);
        } else {
          // En attente (PENDING) — demander de vérifier WhatsApp
          _onCinetPayPending(transactionId);
        }
      });

      // Erreur réseau ou fermeture popup
      CinetPay.onError(function(data) {
        _hideCinetPayLoader();
        console.error('[CinetPay] Erreur:', data);
        if (typeof showToast === 'function')
          showToast('Paiement annulé ou erreur de connexion.', 'error');
      });

    } catch(e) {
      _hideCinetPayLoader();
      console.error('[CinetPay] Erreur SDK:', e);
      if (typeof showToast === 'function')
        showToast('Erreur lors de l\'initialisation du paiement.', 'error');
    }
  });
}

// ══════════════════════════════════════════════════════════════
// 4. CALLBACKS PAIEMENT
// ══════════════════════════════════════════════════════════════
function _onCinetPaySuccess(plan, duree, transactionId, data) {
  // Nettoyer le paiement en attente
  try { localStorage.removeItem('immogest_pending_payment'); } catch(e) {}
  _pendingPayment = null;

  // Activer l'abonnement
  if (typeof _confirmerPaiementAbonnement === 'function') {
    _confirmerPaiementAbonnement(plan, duree, transactionId);
  }
}

function _onCinetPayRefused(data) {
  var msg = data.message || 'Paiement refusé.';
  // Afficher modal d'erreur
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10010';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:12px;">❌</div>' +
      '<h3 style="color:#E53E3E;margin-bottom:8px;">Paiement refusé</h3>' +
      '<p style="color:var(--text2);font-size:13px;margin-bottom:20px;">' + msg + '</p>' +
      '<p style="font-size:12px;color:var(--text3);">Vérifiez votre solde ou essayez un autre mode de paiement.</p>' +
      '<div class="modal-footer" style="justify-content:center;">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Fermer</button>' +
        '<button class="btn btn-primary" onclick="this.closest(\'.overlay\').remove();showUpgradeModal();">Réessayer</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function _onCinetPayPending(transactionId) {
  var P = (typeof IMMOGEST_PAIEMENT !== 'undefined') ? IMMOGEST_PAIEMENT : { whatsapp: '237690409929', telephone: '+237 690 40 99 29' };
  var waText = encodeURIComponent('Bonjour, j\'ai effectué un paiement ImmoGest (réf: ' + transactionId + ') mais il est en attente de confirmation. Pouvez-vous vérifier ?');
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10010';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:12px;">⏳</div>' +
      '<h3 style="margin-bottom:8px;">Paiement en cours de vérification</h3>' +
      '<p style="color:var(--text2);font-size:13px;margin-bottom:8px;">Votre paiement est en cours de traitement. Notez votre référence :</p>' +
      '<div style="background:var(--bg3);border-radius:8px;padding:10px;font-weight:700;font-size:14px;margin-bottom:16px;letter-spacing:1px;">' + transactionId + '</div>' +
      '<p style="font-size:12px;color:var(--text3);margin-bottom:16px;">Votre abonnement sera activé sous 24h. En cas de problème, contactez-nous.</p>' +
      '<div class="modal-footer" style="justify-content:center;">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Fermer</button>' +
        '<a class="btn btn-primary" style="background:#25D366;border-color:#25D366;text-decoration:none;" href="https://wa.me/' + P.whatsapp + '?text=' + waText + '" target="_blank" onclick="this.closest(\'.overlay\').remove()">💬 Contacter sur WhatsApp</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════
// 5. UI — LOADER & MESSAGES
// ══════════════════════════════════════════════════════════════
function _showCinetPayLoader(planLabel, total, duree) {
  var existing = document.getElementById('cinetpay-loader');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'cinetpay-loader';
  overlay.style.zIndex = '10008';
  overlay.innerHTML =
    '<div class="modal" style="max-width:360px;text-align:center;">' +
      '<div style="font-size:40px;margin-bottom:12px;">💳</div>' +
      '<h3 style="margin-bottom:6px;">Ouverture du paiement...</h3>' +
      '<p style="color:var(--text3);font-size:13px;margin-bottom:16px;">' +
        'Plan <strong>' + planLabel + '</strong> · ' + total.toLocaleString('fr-FR') + ' FCFA · ' + duree + ' mois' +
      '</p>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text3);font-size:12px;">' +
        '<div style="width:16px;height:16px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;"></div>' +
        'Connexion à CinetPay...' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function _hideCinetPayLoader() {
  var loader = document.getElementById('cinetpay-loader');
  if (loader) loader.remove();
}

function _showCinetPayNotConfigured() {
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10010';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;text-align:center;">' +
      '<div style="font-size:40px;margin-bottom:12px;">⚙️</div>' +
      '<h3 style="margin-bottom:8px;">Paiement en ligne bientôt disponible</h3>' +
      '<p style="color:var(--text2);font-size:13px;margin-bottom:16px;">' +
        'Le paiement automatique est en cours d\'activation.<br>' +
        'En attendant, contactez-nous directement pour souscrire.' +
      '</p>' +
      '<div style="background:var(--bg3);border-radius:8px;padding:12px;font-size:13px;margin-bottom:16px;">' +
        '📱 MTN MoMo : <strong>6 73 95 00 19</strong><br>' +
        '🟠 Orange Money : <strong>6 90 40 99 29</strong><br>' +
        '💬 WhatsApp : <strong>+237 690 40 99 29</strong>' +
      '</div>' +
      '<div class="modal-footer" style="justify-content:center;">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Fermer</button>' +
        '<a class="btn btn-primary" style="background:#25D366;border-color:#25D366;text-decoration:none;" href="https://wa.me/237690409929" target="_blank" onclick="this.closest(\'.overlay\').remove()">💬 WhatsApp</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════
// 6. ACTIVER LES CLÉS (appelé quand l'admin entre ses clés)
// ══════════════════════════════════════════════════════════════
function activerCinetPay(apikey, site_id, modeProduction) {
  CINETPAY_CONFIG.apikey  = apikey.trim();
  CINETPAY_CONFIG.site_id = site_id.trim();
  CINETPAY_CONFIG.mode    = modeProduction ? 'PRODUCTION' : 'TEST';
  // Sauvegarder en localStorage pour persister
  try {
    localStorage.setItem('immogest_cinetpay', JSON.stringify({
      apikey:  CINETPAY_CONFIG.apikey,
      site_id: CINETPAY_CONFIG.site_id,
      mode:    CINETPAY_CONFIG.mode
    }));
  } catch(e) {}
  console.log('[CinetPay] Clés activées — mode:', CINETPAY_CONFIG.mode);
  if (typeof showToast === 'function')
    showToast('✅ CinetPay activé en mode ' + CINETPAY_CONFIG.mode, 'success');
}

// Restaurer les clés au démarrage si déjà sauvegardées
(function _restoreCinetPayKeys() {
  try {
    var saved = localStorage.getItem('immogest_cinetpay');
    if (saved) {
      var cfg = JSON.parse(saved);
      if (cfg.apikey && cfg.site_id) {
        CINETPAY_CONFIG.apikey  = cfg.apikey;
        CINETPAY_CONFIG.site_id = cfg.site_id;
        CINETPAY_CONFIG.mode    = cfg.mode || 'TEST';
        console.log('[CinetPay] Clés restaurées — mode:', CINETPAY_CONFIG.mode);
      }
    }
  } catch(e) {}
})();
