// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Gestion des plans tarifaires
//  Restrictions par plan + UI upgrade + NotchPay paiement
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.plans = (function() {

  var PLANS = {
    gratuit: { immeubles: 1,  locataires: 10,  utilisateurs: 2,  label: 'Gratuit', labelDisplay: 'GRATUIT', prix: 0,     prixAnnuel: 0,       couleur: '#6B7280' },
    starter: { immeubles: 3,  locataires: 50,  utilisateurs: 5,  label: 'Starter', labelDisplay: 'STARTER', prix: 9999,  prixAnnuel: 99900,   couleur: '#0E6AAF' },
    pro:     { immeubles: 10, locataires: -1,  utilisateurs: 15, label: 'Pro',     labelDisplay: 'PRO',     prix: 19999, prixAnnuel: 199900,  couleur: '#0E7A45' },
    cabinet: { immeubles: -1, locataires: -1,  utilisateurs: -1, label: 'Agence',  labelDisplay: 'AGENCE',  prix: 29999, prixAnnuel: 299900,  couleur: '#B45309' }
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
      '<div style="display:flex;gap:8px">' +
      (plan !== 'cabinet' ?
        '<button onclick="window.IG.plans.afficherUpgrade()" ' +
        'style="flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#0E6AAF,#7C3AED);color:#fff;cursor:pointer;font-size:13px;font-weight:700">' +
        '⬆️ Plan supérieur</button>' : '') +
      '<button onclick="window.IG.plans.afficherSaisiePromo()" ' +
      'style="padding:11px 14px;border-radius:10px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">🎁 Code promo</button>' +
      '</div></div>';
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
    var planActuel = getPlan();
    var fmt = window.IG.utils.formatMontant;

    var PLANS_UI = [
      {
        id: 'gratuit', badge: '', badgeColor: '',
        features: [
          { ok: true,  text: '1 immeuble' },
          { ok: true,  text: '10 locataires' },
          { ok: true,  text: '2 utilisateurs' },
          { ok: true,  text: 'Rapports PDF' },
          { ok: true,  text: '1 rapport Word/mois' },
          { ok: true,  text: 'Fiche de suivi' },
          { ok: true,  text: '3 relances/mois' },
          { ok: false, text: 'Assistant IA' },
          { ok: false, text: 'Export données' },
          { ok: 'warn',text: 'Publicités' }
        ]
      },
      {
        id: 'starter', badge: '⭐ POPULAIRE', badgeColor: '#0E6AAF',
        features: [
          { ok: true,  text: '3 immeubles' },
          { ok: true,  text: '50 locataires' },
          { ok: true,  text: '5 utilisateurs' },
          { ok: true,  text: 'Rapports PDF + Word illimités' },
          { ok: true,  text: 'Fiche de suivi' },
          { ok: true,  text: 'Relances illimitées' },
          { ok: true,  text: 'IA 10 msgs/jour' },
          { ok: false, text: 'Export données' },
          { ok: true,  text: 'Sans publicité' }
        ]
      },
      {
        id: 'pro', badge: '✦ RECOMMANDÉ', badgeColor: '#0E7A45',
        features: [
          { ok: true, text: '10 immeubles' },
          { ok: true, text: 'Locataires illimités' },
          { ok: true, text: '15 utilisateurs' },
          { ok: true, text: 'Rapports PDF + Word illimités' },
          { ok: true, text: 'Fiche de suivi' },
          { ok: true, text: 'Relances illimitées' },
          { ok: true, text: 'IA illimitée' },
          { ok: true, text: 'Export données' },
          { ok: true, text: 'Support prioritaire' }
        ]
      },
      {
        id: 'cabinet', badge: '🏢 ENTREPRISE', badgeColor: '#B45309',
        features: [
          { ok: true, text: 'Immeubles illimités' },
          { ok: true, text: 'Locataires illimités' },
          { ok: true, text: 'Utilisateurs illimités' },
          { ok: true, text: 'Tout inclus' },
          { ok: true, text: 'IA illimitée' },
          { ok: true, text: 'Export données' },
          { ok: true, text: 'Sans publicité' },
          { ok: true, text: 'Support dédié 24h' },
          { ok: true, text: 'Portail locataire' }
        ]
      }
    ];

    var html = '<div style="text-align:center;padding:20px 20px 8px;background:linear-gradient(135deg,#0E6AAF,#0E7A45);margin:-16px -16px 20px;border-radius:12px 12px 0 0">' +
      '<div style="font-size:20px;font-weight:900;color:#fff">⭐ Choisissez votre plan</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:4px">Gérez vos biens immobiliers sans limites</div>' +
      (planActuel !== 'gratuit' ? '<div style="display:inline-block;margin-top:8px;padding:3px 14px;border-radius:99px;background:rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:700">' + PLANS[planActuel].labelDisplay + ' — Plan actuel</div>' : '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">';

    PLANS_UI.forEach(function(pu) {
      var p = PLANS[pu.id];
      var isActuel = pu.id === planActuel;
      var isFree = pu.id === 'gratuit';
      var border = pu.badgeColor ? '2px solid ' + pu.badgeColor : '1px solid var(--border2)';
      if (isActuel) border = '2px solid var(--accent)';

      html += '<div style="border:' + border + ';border-radius:12px;padding:14px;position:relative;background:' + (isActuel ? 'var(--bg4)' : 'var(--bg3)') + '">' +
        (pu.badge ? '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:' + pu.badgeColor + ';color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:99px;white-space:nowrap">' + pu.badge + '</div>' : '') +
        '<div style="font-weight:900;font-size:14px;color:' + (pu.badgeColor || 'var(--text)') + ';margin-bottom:4px;margin-top:' + (pu.badge ? '6px' : '0') + '">' + p.labelDisplay + '</div>' +
        '<div style="font-size:20px;font-weight:900;color:var(--text);margin-bottom:2px">' + (isFree ? '<span style="font-size:14px">0</span> FCFA' : fmt(p.prix)) + '</div>' +
        (!isFree ? '<div style="font-size:10px;color:var(--text3);margin-bottom:8px">FCFA/mois · ' + fmt(p.prixAnnuel) + '/an<br><span style="color:#0E7A45;font-weight:700">2 mois offerts</span></div>' : '<div style="font-size:10px;color:var(--text3);margin-bottom:8px">Pour toujours</div>') +
        '<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:10px">' +
        pu.features.map(function(f) {
          var icon = f.ok === true ? '<span style="color:#0E7A45;font-weight:700">✅</span>' : f.ok === 'warn' ? '<span style="color:#B45309">⚠️</span>' : '<span style="color:var(--red)">✗</span>';
          return '<div style="font-size:11px;display:flex;align-items:center;gap:5px;color:' + (f.ok === false ? 'var(--text3)' : 'var(--text2)') + '">' + icon + ' ' + f.text + '</div>';
        }).join('') +
        '</div>' +
        (isActuel
          ? '<div style="width:100%;padding:8px;border-radius:8px;background:var(--bg4);text-align:center;font-size:11px;font-weight:700;color:var(--text3)">Plan actuel</div>'
          : (isFree
            ? '<div style="width:100%;padding:8px;border-radius:8px;background:var(--bg4);text-align:center;font-size:11px;color:var(--text3)">Gratuit</div>'
            : '<button onclick="window.IG.plans._initierPaiement(\'' + pu.id + '\',' + p.prix + ')" style="width:100%;padding:8px;border-radius:8px;border:none;background:' + (pu.badgeColor || '#0E6AAF') + ';color:#fff;cursor:pointer;font-size:12px;font-weight:700">🚀 Passer à ' + p.label + '</button>'
          )
        ) +
        '</div>';
    });

    html += '</div><button data-modal-close style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px;color:var(--text3)">Pas maintenant</button>';

    window.IG.utils.showModal(html, { width: '600px' });
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

  // ── Code promo ────────────────────────────────────────────────
  function afficherSaisiePromo() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var modal = window.IG.utils.showModal(
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:16px">🎁 Code promotionnel</h3>' +
      '<p style="font-size:13px;color:var(--text3);margin-bottom:16px">Entrez un code promo pour activer un plan gratuitement.</p>' +
      '<input id="promo-input" placeholder="Ex: IMMOGEST30" style="width:100%;padding:11px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:14px;text-transform:uppercase;margin-bottom:16px">' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="promo-apply-btn" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Appliquer</button>' +
      '</div>',
      { width: '380px' }
    );

    var inp = modal.box.querySelector('#promo-input');
    inp.addEventListener('input', function() { this.value = this.value.toUpperCase(); });

    modal.box.querySelector('#promo-apply-btn').addEventListener('click', async function() {
      var code = inp.value.trim();
      if (!code) return;
      this.textContent = '⏳...'; this.disabled = true;
      try {
        var res = await fetch(window.IG.config.workerUrl + '/apply-promo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, tenantId: session.tenantId })
        });
        var d = await res.json();
        if (!res.ok || d.error) throw new Error(d.error || 'Code invalide');
        modal.close();
        window.IG.utils.showToast('🎉 Code appliqué ! Plan ' + d.plan.toUpperCase() + ' activé pour ' + d.duree_jours + ' jours', 'green');
        if (window.IG.ads) window.IG.ads.surUpgrade();
        setTimeout(function() { location.reload(); }, 2000);
      } catch(e) {
        window.IG.utils.showToast('Erreur: ' + e.message, 'red');
        this.textContent = 'Appliquer'; this.disabled = false;
      }
    });
  }

  return {
    getPlan, getLimites,
    peutAjouterImmeuble, peutAjouterLocataire,
    verifierImmeuble, verifierLocataire,
    renderBlocPlan, afficherUpgrade, afficherSaisiePromo,
    _initierPaiement
  };

})();
