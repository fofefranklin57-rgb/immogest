// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Gestion des plans tarifaires
//  Restrictions par plan + UI upgrade + NotchPay paiement
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.plans = (function() {

  var PLANS = window.IG.config ? window.IG.config.plans : {
    gratuit:  { immeubles: 2,  locataires: 20,  label: 'Gratuit',  prix: 0 },
    starter:  { immeubles: 5,  locataires: 100, label: 'Starter',  prix: 3000 },
    pro:      { immeubles: 20, locataires: 500, label: 'Pro',       prix: 10000 },
    cabinet:  { immeubles: -1, locataires: -1,  label: 'Cabinet',  prix: 25000 }
  };

  // ── Vérification limites ──────────────────────────────────────
  function getPlan() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    return session.plan || 'gratuit';
  }

  function getLimites() {
    var p = getPlan();
    return PLANS[p] || PLANS.gratuit;
  }

  function peutAjouterImmeuble(nbActuels) {
    var lim = getLimites();
    return lim.immeubles === -1 || nbActuels < lim.immeubles;
  }

  function peutAjouterLocataire(nbActuels) {
    var lim = getLimites();
    return lim.locataires === -1 || nbActuels < lim.locataires;
  }

  // Retourne null si ok, sinon message d'erreur
  function verifierImmeuble(data) {
    if (!window.IG.app) return null;
    var nb = window.IG.app.getData().immeubles.length;
    if (!peutAjouterImmeuble(nb)) {
      return 'Limite atteinte — plan ' + getPlan().toUpperCase() + ' : max ' + getLimites().immeubles + ' immeuble(s). Passez au plan supérieur.';
    }
    return null;
  }

  function verifierLocataire(data) {
    if (!window.IG.app) return null;
    var nb = window.IG.app.getData().locataires.filter(function(l) { return l.statut !== 'libre'; }).length;
    if (!peutAjouterLocataire(nb)) {
      return 'Limite atteinte — plan ' + getPlan().toUpperCase() + ' : max ' + getLimites().locataires + ' locataire(s). Passez au plan supérieur.';
    }
    return null;
  }

  // ── Bloc plan actuel (pour paramètres) ───────────────────────
  function renderBlocPlan(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var plan = getPlan();
    var lim = getLimites();
    var data = window.IG.app ? window.IG.app.getData() : { immeubles: [], locataires: [] };
    var nbImm = data.immeubles.length;
    var nbLoc = data.locataires.filter(function(l) { return l.statut !== 'libre'; }).length;

    var planColors = { gratuit: '#7A90A8', starter: '#3DB87A', pro: '#0E6AAF', cabinet: '#7C3AED' };
    var col = planColors[plan] || '#7A90A8';

    el.innerHTML =
      '<div class="card" style="margin-bottom:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">' +
      '<div class="card-title">💳 Mon plan</div>' +
      '<span style="padding:4px 14px;border-radius:99px;font-size:12px;font-weight:700;background:' + col + '22;color:' + col + '">' + (lim.label || plan).toUpperCase() + '</span>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">' +
      _jauge('🏢 Immeubles', nbImm, lim.immeubles) +
      _jauge('👥 Locataires actifs', nbLoc, lim.locataires) +
      '</div>' +
      (plan !== 'cabinet' ?
        '<button onclick="window.IG.plans.afficherUpgrade()" ' +
        'style="width:100%;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#0E6AAF,#7C3AED);color:#fff;cursor:pointer;font-size:13px;font-weight:700">' +
        '⬆️ Passer au plan supérieur</button>' : '') +
      '</div>';
  }

  function _jauge(label, val, max) {
    var pct = max === -1 ? 0 : Math.min(100, Math.round((val / max) * 100));
    var color = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--yellow)' : 'var(--green)';
    return '<div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">' +
      '<span style="color:var(--text2)">' + label + '</span>' +
      '<span style="font-weight:700;color:' + color + '">' + val + (max === -1 ? '' : ' / ' + max) + '</span>' +
      '</div>' +
      (max !== -1 ?
        '<div style="height:5px;background:var(--bg4);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:' + pct + '%;background:' + color + ';border-radius:99px;transition:width 0.3s"></div>' +
        '</div>' : '') +
      '</div>';
  }

  // ── Modal upgrade ─────────────────────────────────────────────
  function afficherUpgrade() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var planActuel = getPlan();

    var PLANS_LIST = [
      { id: 'starter',  label: 'Starter',  prix: 3000,  features: ['5 immeubles', '100 locataires', 'Rapports complets', 'Export DOCX'] },
      { id: 'pro',      label: 'Pro',       prix: 10000, features: ['20 immeubles', '500 locataires', 'LegalOS', 'Marketplace', 'Portail locataire'] },
      { id: 'cabinet',  label: 'Cabinet',   prix: 25000, features: ['Illimité', 'Multi-utilisateurs', 'API Access', 'Support prioritaire', 'WhatsApp auto'] }
    ].filter(function(p) { return p.id !== planActuel && !(planActuel === 'pro' && p.id === 'starter'); });

    var html = '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px">⬆️ Choisissez votre plan</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px">';

    PLANS_LIST.forEach(function(p) {
      var isTop = p.id === 'cabinet';
      html += '<div style="border:' + (isTop ? '2px solid var(--accent)' : '1px solid var(--border2)') + ';border-radius:12px;padding:16px;cursor:pointer;position:relative" ' +
        'onclick="window.IG.plans._initierPaiement(\'' + p.id + '\',' + p.prix + ')">' +
        (isTop ? '<div style="position:absolute;top:-10px;right:14px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:99px">POPULAIRE</div>' : '') +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-weight:700;font-size:15px">' + p.label + '</span>' +
        '<span style="font-weight:700;font-size:15px;color:var(--accent)">' + window.IG.utils.formatMontant(p.prix) + '<span style="font-size:11px;font-weight:400;color:var(--text3)">/mois</span></span>' +
        '</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        p.features.map(function(f) {
          return '<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:var(--bg4);color:var(--text2)">✓ ' + f + '</span>';
        }).join('') +
        '</div></div>';
    });

    html += '</div><button data-modal-close style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Pas maintenant</button>';

    window.IG.utils.showModal(html, { width: '480px' });
  }

  async function _initierPaiement(planId, prix) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var ref = 'IMMOGEST-' + (session.tenantId || '').substring(0,8).toUpperCase() + '-' + planId.toUpperCase() + '-' + Date.now();

    // Fermer modal upgrade
    document.querySelector('.ig-modal-overlay')?.click();

    window.IG.utils.showToast('Redirection vers le paiement...', 'blue');

    try {
      var res = await fetch(window.IG.config.workerUrl + '/payment-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: prix,
          email: session.email || 'client@immogest.cm',
          phone: session.telephone || '',
          description: 'ImmoGest Plan ' + planId.toUpperCase() + ' — ' + (session.nomCabinet || session.nom || ''),
          reference: ref,
          tenantId: session.tenantId
        })
      });
      var d = await res.json();
      if (d.authorization_url) {
        window.open(d.authorization_url, '_blank');
        _afficherAttentePaiement(ref, planId);
      } else {
        throw new Error('Lien de paiement non reçu');
      }
    } catch(e) {
      window.IG.utils.showToast('Erreur paiement: ' + e.message, 'red');
    }
  }

  function _afficherAttentePaiement(ref, planId) {
    var modal = window.IG.utils.showModal(
      '<div style="text-align:center;padding:20px">' +
      '<div style="font-size:48px;margin-bottom:12px">⏳</div>' +
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:8px">Paiement en attente</h3>' +
      '<p style="font-size:13px;color:var(--text3);margin-bottom:20px">Complétez le paiement dans l\'onglet qui vient de s\'ouvrir, puis cliquez sur Vérifier.</p>' +
      '<p style="font-size:11px;color:var(--text3);background:var(--bg4);padding:8px 12px;border-radius:8px;margin-bottom:16px">Réf: ' + ref + '</p>' +
      '<div style="display:flex;gap:8px;justify-content:center">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="check-pmt-btn" style="padding:9px 16px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:13px;font-weight:600">✓ Vérifier le paiement</button>' +
      '</div></div>',
      { width: '420px' }
    );

    modal.box.querySelector('#check-pmt-btn').addEventListener('click', async function() {
      this.textContent = '⏳ Vérification...'; this.disabled = true;
      try {
        var r = await fetch(window.IG.config.workerUrl + '/payment-check?ref=' + ref);
        var d = await r.json();
        if (d.status === 'complete' || d.status === 'successful') {
          modal.close();
          window.IG.utils.showToast('Paiement confirmé ! Plan ' + planId.toUpperCase() + ' activé.', 'green');
          // Actualiser session après quelques secondes
          setTimeout(function() { location.reload(); }, 2000);
        } else {
          window.IG.utils.showToast('Paiement non confirmé (statut: ' + (d.status || 'inconnu') + ')', 'red');
          this.textContent = '✓ Vérifier le paiement'; this.disabled = false;
        }
      } catch(e) {
        window.IG.utils.showToast('Erreur vérification', 'red');
        this.textContent = '✓ Vérifier le paiement'; this.disabled = false;
      }
    });
  }

  return {
    getPlan, getLimites,
    peutAjouterImmeuble, peutAjouterLocataire,
    verifierImmeuble, verifierLocataire,
    renderBlocPlan, afficherUpgrade,
    _initierPaiement
  };

})();
