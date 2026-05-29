// ═══════════════════════════════════════════════════════════════
// CINETPAY INTEGRATION — ImmoGest v2.0
// Nouvelle API CinetPay (sans SDK JS, via Worker sécurisé)
// Flow : Frontend → Worker /pay → CinetPay API → payment_url → redirect
// ═══════════════════════════════════════════════════════════════

const CINETPAY_WORKER = 'https://immogest1.fofefranklin57.workers.dev';

// ── CinetPay est toujours configuré (credentials dans le Worker) ──
function cinetpayEstConfigured() {
  return true;
}

// ══════════════════════════════════════════════════════════════
// LANCER UN PAIEMENT
// ══════════════════════════════════════════════════════════════
async function payerAvecCinetPay(plan, duree) {
  var planInfo = (typeof PLANS !== 'undefined') ? PLANS[plan] : null;
  if (!planInfo) { console.error('[CinetPay] Plan introuvable:', plan); return; }

  var monthly  = planInfo.price;
  var discount = duree === 3 ? 0.05 : duree === 6 ? 0.10 : duree === 12 ? 0.17 : 0;
  var total    = Math.round(monthly * duree * (1 - discount));

  // Plan gratuit — activer directement
  if (total <= 0) {
    if (typeof _confirmerPaiementAbonnement === 'function')
      _confirmerPaiementAbonnement(plan, duree);
    return;
  }

  var transactionId = 'IMG' + Date.now() + Math.floor(Math.random() * 1000);

  // Sauvegarder pour activation au retour
  var pending = { plan: plan, duree: duree, total: total, transactionId: transactionId, ts: Date.now() };
  try { localStorage.setItem('immogest_pending_payment', JSON.stringify(pending)); } catch(e) {}

  // Infos client
  var customerName  = (typeof SESSION !== 'undefined' && SESSION) ? (SESSION.nom  || 'Client ImmoGest') : 'Client ImmoGest';
  var customerEmail = (typeof SESSION !== 'undefined' && SESSION) ? (SESSION.email || 'client@immogest.cm') : 'client@immogest.cm';
  var customerPhone = (typeof SESSION !== 'undefined' && SESSION) ? (SESSION.telephone || '') : '';

  var parts     = customerName.split(' ');
  var firstName = parts[0] || 'Client';
  var lastName  = parts.slice(1).join(' ') || 'ImmoGest';

  // Formater le téléphone (+237XXXXXXXXX)
  var phoneClean = customerPhone.replace(/\D/g, '');
  if (phoneClean && !phoneClean.startsWith('237')) phoneClean = '237' + phoneClean;
  var phoneFmt = phoneClean ? '+' + phoneClean : '';

  _showCinetPayLoader(planInfo.label, total, duree);

  try {
    var resp = await fetch(CINETPAY_WORKER + '/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: transactionId,
        amount:        total,
        designation:   'Abonnement ImmoGest ' + planInfo.label + ' — ' + duree + ' mois',
        firstName:     firstName,
        lastName:      lastName,
        email:         customerEmail,
        phone:         phoneFmt
      })
    });

    var data = await resp.json();
    _hideCinetPayLoader();

    if (data.ok && data.payment_url) {
      // Rediriger vers la page de paiement CinetPay
      window.location.href = data.payment_url;
    } else {
      console.error('[CinetPay] Erreur init:', data);
      _showCinetPayError(data.error || 'Erreur lors de l\'initialisation du paiement.');
    }

  } catch (e) {
    _hideCinetPayLoader();
    console.error('[CinetPay] Erreur réseau:', e);
    if (typeof showToast === 'function')
      showToast('Erreur de connexion au service de paiement.', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// RETOUR DEPUIS CINETPAY (success_url / failed_url)
// Détecte ?payment=success ou ?payment=failed dans l'URL
// ══════════════════════════════════════════════════════════════
function _checkCinetPayReturn() {
  var params = new URLSearchParams(window.location.search);
  var status = params.get('payment');
  if (!status) return;

  // Nettoyer l'URL sans recharger
  history.replaceState({}, '', window.location.pathname);

  var pending = null;
  try { pending = JSON.parse(localStorage.getItem('immogest_pending_payment') || 'null'); } catch(e) {}

  if (status === 'success' && pending) {
    localStorage.removeItem('immogest_pending_payment');
    if (typeof _confirmerPaiementAbonnement === 'function') {
      _confirmerPaiementAbonnement(pending.plan, pending.duree, pending.transactionId);
    }
  } else if (status === 'failed') {
    localStorage.removeItem('immogest_pending_payment');
    _showCinetPayRefused();
  }
}

// ══════════════════════════════════════════════════════════════
// UI — Loader, Erreurs
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
      '<h3 style="margin-bottom:6px;">Redirection vers CinetPay...</h3>' +
      '<p style="color:var(--text3);font-size:13px;margin-bottom:16px;">' +
        'Plan <strong>' + planLabel + '</strong> · ' + total.toLocaleString('fr-FR') + ' FCFA · ' + duree + ' mois' +
      '</p>' +
      '<div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text3);font-size:12px;">' +
        '<div style="width:16px;height:16px;border:2px solid var(--accent);border-top-color:transparent;border-radius:50%;animation:spin .8s linear infinite;"></div>' +
        'Préparation du paiement...' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function _hideCinetPayLoader() {
  var loader = document.getElementById('cinetpay-loader');
  if (loader) loader.remove();
}

function _showCinetPayError(msg) {
  var P = (typeof IMMOGEST_PAIEMENT !== 'undefined') ? IMMOGEST_PAIEMENT : { whatsapp: '237690409929' };
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10010';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:12px;">⚠️</div>' +
      '<h3 style="margin-bottom:8px;">Paiement temporairement indisponible</h3>' +
      '<p style="color:var(--text2);font-size:13px;margin-bottom:16px;">' + msg + '</p>' +
      '<div style="background:var(--bg3);border-radius:8px;padding:12px;font-size:13px;margin-bottom:16px;">' +
        '📱 MTN MoMo : <strong>6 73 95 00 19</strong><br>' +
        '🟠 Orange Money : <strong>6 90 40 99 29</strong><br>' +
        '💬 WhatsApp : <strong>+237 690 40 99 29</strong>' +
      '</div>' +
      '<div class="modal-footer" style="justify-content:center;">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Fermer</button>' +
        '<a class="btn btn-primary" style="background:#25D366;border-color:#25D366;text-decoration:none;" href="https://wa.me/' + P.whatsapp + '" target="_blank" onclick="this.closest(\'.overlay\').remove()">💬 WhatsApp</a>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function _showCinetPayRefused() {
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10010';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;text-align:center;">' +
      '<div style="font-size:48px;margin-bottom:12px;">❌</div>' +
      '<h3 style="color:#E53E3E;margin-bottom:8px;">Paiement non complété</h3>' +
      '<p style="color:var(--text2);font-size:13px;margin-bottom:20px;">Le paiement a été annulé ou a échoué. Vous pouvez réessayer ou nous contacter.</p>' +
      '<div class="modal-footer" style="justify-content:center;">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Fermer</button>' +
        '<button class="btn btn-primary" onclick="this.closest(\'.overlay\').remove();if(typeof showUpgradeModal===\'function\')showUpgradeModal();">Réessayer</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

// ══════════════════════════════════════════════════════════════
// INIT — Vérifier le retour CinetPay au chargement de la page
// ══════════════════════════════════════════════════════════════
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _checkCinetPayReturn);
} else {
  _checkCinetPayReturn();
}
