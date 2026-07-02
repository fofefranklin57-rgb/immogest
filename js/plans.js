// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Gestion des plans tarifaires
//  Restrictions par plan + UI upgrade + paiement Fapshi
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.plans = (function() {

  // Prix mensuels de base. Remises appliquées à la volée selon la durée.
  // Gratuit : toujours 0. Trial : essai 30j auto — toutes fonctions actives, zéro pub.
  // Starter : gérant/proprio — cas d'usage standard (petit parc).
  // Pro : gestionnaire actif — parc moyen, multi-utilisateurs, IA full, export.
  // Cabinet : structure pro — illimité, branding, support dédié, API.
  var PLANS = {
    gratuit: {
      immeubles: 1,  locataires: 10,  utilisateurs: 1,
      label: 'Gratuit', labelDisplay: 'GRATUIT', prix: 0, couleur: '#6B7280',
      ia: false, export: false, rapportWord: false, signature: false, branding: false
    },
    trial: {
      immeubles: -1, locataires: -1,  utilisateurs: -1,
      label: 'Essai',   labelDisplay: 'ESSAI 30J', prix: 0, couleur: '#7C3AED',
      ia: true,  export: true,  rapportWord: true,  signature: true,  branding: true
    },
    starter: {
      immeubles: 10, locataires: 300, utilisateurs: 5,
      label: 'Starter', labelDisplay: 'STARTER', prix: 10000, couleur: '#0E6AAF',
      ia: '50/j', export: false, rapportWord: true, signature: false, branding: false
    },
    pro: {
      immeubles: 50, locataires: -1,  utilisateurs: 15,
      label: 'Pro',     labelDisplay: 'PRO',     prix: 15000, couleur: '#0E7A45',
      ia: true,  export: true,  rapportWord: true,  signature: true,  branding: false
    },
    cabinet: {
      immeubles: -1, locataires: -1,  utilisateurs: -1,
      label: 'Cabinet', labelDisplay: 'CABINET', prix: 30000, couleur: '#B45309',
      ia: true,  export: true,  rapportWord: true,  signature: true,  branding: true
    }
  };

  // Remises selon durée (appliquées sur le total)
  var REMISES = {
    1:  { pct: 0,    label: 'Mensuel',     tag: '' },
    3:  { pct: 8,    label: '3 mois',      tag: '-8%' },
    6:  { pct: 15,   label: '6 mois',      tag: '-15%' },
    12: { pct: 17,   label: '1 an',        tag: '2 mois offerts' }
  };

  function prixPourDuree(planId, mois) {
    var p = PLANS[planId];
    if (!p || !p.prix) return 0;
    var r = REMISES[mois] || REMISES[1];
    return Math.round(p.prix * mois * (1 - r.pct / 100));
  }

  // ── Essai 30 jours ──────────────────────────────────────────
  function _isTrial() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    if (session.plan && session.plan !== 'gratuit') return false;
    try {
      var raw = localStorage.getItem('immogest_tenant_v1');
      var tenant = raw ? JSON.parse(raw) : null;
      if (!tenant || !tenant.created_at) return false;
      var age = Date.now() - new Date(tenant.created_at).getTime();
      return age < 30 * 24 * 60 * 60 * 1000;
    } catch(_) { return false; }
  }

  function getJoursEssaiRestants() {
    try {
      var raw = localStorage.getItem('immogest_tenant_v1');
      var tenant = raw ? JSON.parse(raw) : null;
      if (!tenant || !tenant.created_at) return 0;
      var age = Date.now() - new Date(tenant.created_at).getTime();
      var restant = 30 - Math.floor(age / 86400000);
      return Math.max(0, restant);
    } catch(_) { return 0; }
  }

  // ── Vérification limites ──────────────────────────────────────
  function getPlan() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var plan = session.plan || 'gratuit';
    if (plan === 'gratuit' && _isTrial()) return 'trial';
    return plan;
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

  function _prixParJour(planId) {
    var p = PLANS[planId];
    if (!p || !p.prix) return 0;
    return Math.round(p.prix / 30);
  }

  // Retourne null si ok, sinon message d'erreur (framing loss aversion)
  function verifierImmeuble() {
    if (!window.IG.app) return null;
    var nb  = window.IG.app.getData().immeubles.length;
    var lim = getLimites();
    if (peutAjouterImmeuble(nb)) {
      // Avertissement préventif à 80% de la limite
      if (lim.immeubles !== -1 && nb >= Math.floor(lim.immeubles * 0.8)) {
        window.IG.utils && window.IG.utils.showToast &&
          window.IG.utils.showToast('⚠️ Plus que ' + (lim.immeubles - nb) + ' immeuble(s) disponible(s) sur votre plan.', 'orange');
      }
      return null;
    }
    return '🔒 Vous avez atteint la limite de ' + lim.immeubles + ' immeuble(s) sur votre plan actuel.\nPassez au plan Starter pour gérer jusqu\'à 10 immeubles — ' + _prixParJour('starter') + ' FCFA/jour.';
  }

  function verifierLocataire() {
    if (!window.IG.app) return null;
    var nb  = window.IG.app.getData().locataires.filter(function(l) { return l.statut !== 'libre'; }).length;
    var lim = getLimites();
    if (peutAjouterLocataire(nb)) {
      if (lim.locataires !== -1 && nb >= Math.floor(lim.locataires * 0.8)) {
        window.IG.utils && window.IG.utils.showToast &&
          window.IG.utils.showToast('⚠️ Plus que ' + (lim.locataires - nb) + ' locataire(s) disponible(s) sur votre plan.', 'orange');
      }
      return null;
    }
    return '🔒 Limite de ' + lim.locataires + ' locataires atteinte.\nSur le plan Starter, vous pouvez gérer jusqu\'à 300 locataires — ' + _prixParJour('starter') + ' FCFA/jour seulement.';
  }

  // ── Bannière rétrogradation — loss aversion maximal ──────────
  function verifierRetrogradation() {
    var data = window.IG.app ? window.IG.app.getData() : null;
    if (!data) return;
    var lim = getLimites();
    var nbImm = data.immeubles.length;
    var nbLoc = data.locataires.filter(function(l) { return l.statut !== 'libre'; }).length;

    var depasse = (lim.immeubles !== -1 && nbImm > lim.immeubles) ||
                  (lim.locataires !== -1 && nbLoc > lim.locataires);
    if (!depasse) { _retirerBanniereRetro(); return; }

    var existing = document.getElementById('ig-retro-banner');
    if (existing) return;

    // Framing loss aversion : ce qu'ils PERDENT, pas ce qui est "limité"
    var pertes = [];
    if (lim.immeubles !== -1 && nbImm > lim.immeubles)
      pertes.push('<strong>' + nbImm + ' immeubles</strong> (seul ' + lim.immeubles + ' accessible)');
    if (lim.locataires !== -1 && nbLoc > lim.locataires)
      pertes.push('<strong>' + nbLoc + ' locataires</strong> (seuls ' + lim.locataires + ' accessibles)');

    var banner = document.createElement('div');
    banner.id = 'ig-retro-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;' +
      'background:linear-gradient(90deg,#b91c1c,#7f1d1d);color:#fff;' +
      'padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:500;box-shadow:0 2px 12px rgba(0,0,0,.4)';
    banner.innerHTML =
      '<span>⛔ Vous perdez l\'accès à ' + pertes.join(' et ') + '. Vos données sont là — reprenez le contrôle.</span>' +
      '<button onclick="window.IG.plans.afficherUpgrade()" ' +
      'style="background:#fff;color:#b91c1c;border:none;padding:6px 16px;border-radius:6px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;animation:ig-pulse 1.5s infinite">' +
      '🔓 Reprendre l\'accès →</button>';
    // Animation pulse sur le bouton
    if (!document.getElementById('ig-pulse-style')) {
      var st = document.createElement('style');
      st.id = 'ig-pulse-style';
      st.textContent = '@keyframes ig-pulse{0%,100%{box-shadow:0 0 0 0 rgba(185,28,28,0.5)}50%{box-shadow:0 0 0 6px rgba(185,28,28,0)}}';
      document.head.appendChild(st);
    }
    document.body.prepend(banner);
  }

  function _retirerBanniereRetro() {
    var b = document.getElementById('ig-retro-banner');
    if (b) b.remove();
  }

  function estEnModeRetro() {
    var data = window.IG.app ? window.IG.app.getData() : null;
    if (!data) return false;
    var lim = getLimites();
    var nbImm = data.immeubles.length;
    var nbLoc = data.locataires.filter(function(l) { return l.statut !== 'libre'; }).length;
    return (lim.immeubles !== -1 && nbImm > lim.immeubles) ||
           (lim.locataires !== -1 && nbLoc > lim.locataires);
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
    var existing = document.getElementById('ig-upgrade-modal');
    if (existing) existing.remove();
    var planActuel = getPlan();
    var fmt = window.IG.utils.formatMontant;

    var PLANS_UI = [
      {
        id: 'gratuit', badge: '', badgeColor: '#6B7280',
        features: [
          { ok: true,  text: '1 immeuble · 10 locataires' },
          { ok: true,  text: '1 utilisateur' },
          { ok: true,  text: 'Fiches de suivi & reçus PDF' },
          { ok: false, text: 'Rapports mensuels / annuels' },
          { ok: false, text: 'Rapports Word (docx)' },
          { ok: false, text: 'Assistant IA' },
          { ok: false, text: 'Export CSV / Excel' },
          { ok: 'warn', text: 'Toutes publicités actives' }
        ]
      },
      {
        id: 'starter', badge: '⭐ POPULAIRE', badgeColor: '#0E6AAF',
        features: [
          { ok: true, text: '10 immeubles · 300 locataires' },
          { ok: true, text: '5 utilisateurs' },
          { ok: true, text: 'Fiches, reçus & rapports PDF' },
          { ok: true, text: 'Rapports mensuels complets' },
          { ok: true, text: 'Rapports Word illimités' },
          { ok: true, text: 'IA 50 messages/jour' },
          { ok: false, text: 'Export CSV / Excel' },
          { ok: true, text: 'Pub discrète seulement' }
        ]
      },
      {
        id: 'pro', badge: '✦ RECOMMANDÉ', badgeColor: '#0E7A45',
        features: [
          { ok: true, text: '50 immeubles · Locataires ∞' },
          { ok: true, text: '15 utilisateurs' },
          { ok: true, text: 'Tous les rapports illimités' },
          { ok: true, text: 'Signature électronique' },
          { ok: true, text: 'IA illimitée' },
          { ok: true, text: 'Export CSV / Excel' },
          { ok: true, text: 'Support prioritaire' },
          { ok: true, text: 'Pub discrète seulement' }
        ]
      },
      {
        id: 'cabinet', badge: '🏢 CABINET', badgeColor: '#B45309',
        features: [
          { ok: true, text: 'Immeubles & locataires ∞' },
          { ok: true, text: 'Utilisateurs ∞' },
          { ok: true, text: 'Branding complet (logo, cachet)' },
          { ok: true, text: 'Signature électronique avancée' },
          { ok: true, text: 'IA illimitée · Export ∞' },
          { ok: true, text: 'API & intégrations' },
          { ok: true, text: 'Support dédié 24h/7j' },
          { ok: true, text: 'Pub discrète seulement' }
        ]
      }
    ];

    var isTrial   = _isTrial();
    var joursRest = getJoursEssaiRestants();
    var data      = window.IG.app ? window.IG.app.getData() : { immeubles: [], locataires: [] };
    var nbImm     = data.immeubles ? data.immeubles.length : 0;
    var nbLoc     = data.locataires ? data.locataires.filter(function(l){ return l.statut !== 'libre'; }).length : 0;
    var planLabel = isTrial ? 'ESSAI (' + joursRest + 'j restants)' : (PLANS[planActuel] ? PLANS[planActuel].labelDisplay : planActuel.toUpperCase());

    // Message d'accroche contextuel — basé sur ce que l'utilisateur a déjà construit
    var accroche = '';
    if (isTrial && joursRest <= 7) {
      accroche = '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#991b1b;text-align:center">' +
        '⛔ <strong>Votre essai expire dans ' + joursRest + ' jour' + (joursRest > 1 ? 's' : '') + '.</strong> ' +
        'Vos ' + nbImm + ' immeuble' + (nbImm > 1 ? 's' : '') + ' et ' + nbLoc + ' locataire' + (nbLoc > 1 ? 's' : '') + ' seront bloqués. Ne perdez pas ce que vous avez construit.</div>';
    } else if (isTrial) {
      accroche = '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#166534;text-align:center">' +
        '🎁 <strong>Nous vous avons offert 30 jours complets.</strong> Vous gérez déjà ' + nbImm + ' immeuble' + (nbImm > 1 ? 's' : '') + ' et ' + nbLoc + ' locataire' + (nbLoc > 1 ? 's' : '') + '. Continuez sur votre lancée.</div>';
    } else if (planActuel === 'gratuit') {
      accroche = '<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400e;text-align:center">' +
        '💡 Les cabinets professionnels sur ImmoGest gèrent en moyenne <strong>12 immeubles et 180 locataires</strong>. Votre plan actuel vous limite à 1 et 10.</div>';
    }

    // Sélecteur de durée — mettre "1 an" en évidence par défaut (ancrage sur l'économie)
    var dureeHtml = '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:16px;flex-wrap:wrap">';
    [1, 3, 6, 12].forEach(function(m) {
      var r = REMISES[m];
      var isDefault = m === 12; // ancrage sur annuel
      var isBest = m === 12;
      dureeHtml += '<button class="ig-dur-btn" data-mois="' + m + '" ' +
        'style="padding:6px 14px;border-radius:20px;border:2px solid ' + (isDefault ? '#0E7A45' : 'var(--border2)') + ';' +
        'background:' + (isDefault ? '#0E7A45' : 'var(--bg3)') + ';' +
        'color:' + (isDefault ? '#fff' : 'var(--text2)') + ';' +
        'font-size:12px;font-weight:' + (isDefault ? '700' : '500') + ';cursor:pointer;position:relative">' +
        r.label + (r.tag ? ' <span style="color:' + (isDefault ? 'rgba(255,255,255,0.9)' : '#0E7A45') + ';font-size:10px;font-weight:800">' + r.tag + '</span>' : '') +
        (isBest ? '<span style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#f59e0b;color:#fff;font-size:8px;font-weight:800;padding:1px 6px;border-radius:99px;white-space:nowrap">MEILLEUR CHOIX</span>' : '') +
        '</button>';
    });
    dureeHtml += '</div>';

    var html =
      '<div style="text-align:center;padding:20px 20px 14px;background:linear-gradient(135deg,#1e3a5f,#0E7A45);margin:-16px -16px 20px;border-radius:12px 12px 0 0">' +
      '<div style="font-size:19px;font-weight:900;color:#fff;letter-spacing:-.3px">Continuez à gérer sans limites</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,.7);margin-top:4px">Choisi par les gestionnaires professionnels du Cameroun</div>' +
      '<div style="display:inline-block;margin-top:8px;padding:3px 14px;border-radius:99px;background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-weight:700">' + planLabel + ' — Plan actuel</div>' +
      '</div>' +
      accroche +
      '<div style="font-size:11px;font-weight:700;text-align:center;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em">💳 Durée — plus longtemps = plus d\'économies</div>' +
      dureeHtml +
      '<div id="ig-plans-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px"></div>' +
      '<button data-modal-close style="width:100%;padding:9px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px;color:var(--text3)">Pas maintenant</button>';

    var m = window.IG.utils.showModal(html, { width: '620px' });
    m.overlay.id = 'ig-upgrade-modal';

    function _renderCards(duree) {
      var grid = m.box.querySelector('#ig-plans-grid');
      var cardsHtml = '';
      // Ordre psychologique : Cabinet en premier (ancrage prix haut), puis Pro, Starter, Gratuit
      var ordre = ['cabinet', 'pro', 'starter', 'gratuit'];
      var puMap  = {};
      PLANS_UI.forEach(function(pu) { puMap[pu.id] = pu; });

      ordre.forEach(function(pid) {
        var pu = puMap[pid]; if (!pu) return;
        var p = PLANS[pu.id];
        var isActuel = pu.id === planActuel;
        var isFree   = pu.id === 'gratuit';
        var total    = isFree ? 0 : prixPourDuree(pu.id, duree);
        var parJour  = isFree ? 0 : Math.round(total / (duree * 30));
        var mensuelEff = duree > 1 && !isFree ? Math.round(total / duree) : (isFree ? 0 : p.prix);
        var economie = isFree ? 0 : (p.prix * duree) - total;
        var isPro    = pu.id === 'pro';
        var border   = isActuel  ? '2px solid var(--accent)' :
                       isPro     ? '2px solid #0E7A45' : '1px solid var(--border2)';
        var shadow   = isPro ? 'box-shadow:0 4px 20px rgba(14,122,69,0.25);' : '';

        // CTA psychologique selon le plan
        var ctaText = pu.id === 'cabinet' ? '🏢 Activer Cabinet' :
                      pu.id === 'pro'     ? '🚀 Activer Pro maintenant' :
                                            '✅ Commencer avec Starter';

        cardsHtml +=
          '<div style="border:' + border + ';border-radius:12px;padding:14px;position:relative;' + shadow +
          'background:' + (isActuel ? 'var(--bg4)' : isPro ? 'linear-gradient(160deg,var(--bg3),rgba(14,122,69,0.04))' : 'var(--bg3)') + '">' +

          (pu.badge ? '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:' + pu.badgeColor + ';color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:99px;white-space:nowrap">' + pu.badge + '</div>' : '') +

          '<div style="font-weight:900;font-size:13px;color:' + (pu.badgeColor || 'var(--text)') + ';margin-top:' + (pu.badge ? '8px' : '0') + '">' + p.labelDisplay + '</div>' +

          // Prix principal
          '<div style="font-size:24px;font-weight:900;color:var(--text);line-height:1.1;margin-top:4px">' +
          (isFree ? '<span style="font-size:16px">Gratuit</span>' : fmt(mensuelEff)) +
          (!isFree ? '<span style="font-size:11px;font-weight:500;color:var(--text3)"> FCFA/mois</span>' : '') +
          '</div>' +

          // Prix par jour — déculpabilisation
          (!isFree ? '<div style="font-size:10px;color:#0E7A45;font-weight:700;margin-top:1px">= ' + parJour + ' FCFA/jour</div>' : '') +

          // Économie si durée > 1 mois
          (!isFree && duree > 1 ?
            '<div style="font-size:10px;color:var(--text3);margin-top:2px">' +
            'Total ' + fmt(total) + ' FCFA · <span style="color:#0E7A45;font-weight:700">vous économisez ' + fmt(economie) + ' FCFA</span></div>' : '') +
          (isFree ? '<div style="font-size:10px;color:var(--text3);margin-top:2px">Pour toujours</div>' : '') +

          '<div style="display:flex;flex-direction:column;gap:3px;margin:10px 0">' +
          pu.features.map(function(f) {
            var icon = f.ok === true ? '<span style="color:#0E7A45">✅</span>' : f.ok === 'warn' ? '⚠️' : '<span style="color:var(--text3)">·</span>';
            return '<div style="font-size:11px;display:flex;align-items:flex-start;gap:5px;color:' + (f.ok === false ? 'var(--text3)' : 'var(--text)') + '">' + icon + ' ' + f.text + '</div>';
          }).join('') +
          '</div>' +

          (isActuel
            ? '<div style="width:100%;padding:7px;border-radius:8px;background:var(--bg4);text-align:center;font-size:11px;font-weight:700;color:var(--text3)">✓ Plan actuel</div>'
            : isFree
              ? '<div style="width:100%;padding:7px;border-radius:8px;background:var(--bg4);text-align:center;font-size:11px;color:var(--text3)">Gratuit · limité</div>'
              : '<button onclick="window.IG.plans._initierPaiement(\'' + pu.id + '\',' + total + ',' + duree + ')" ' +
                'style="width:100%;padding:9px;border-radius:8px;border:none;cursor:pointer;font-size:12px;font-weight:800;' +
                'background:' + (isPro ? 'linear-gradient(135deg,#0E7A45,#0a5a33)' : pu.badgeColor || '#0E6AAF') + ';color:#fff">' +
                ctaText +
                '</button>'
          ) +
          '</div>';
      });
      grid.innerHTML = cardsHtml;
    }

    _renderCards(12); // Démarrer sur annuel — ancrage sur l'économie maximale

    var _dureeSelectionnee = 12; // annuel par défaut

    // Gestion clics boutons durée
    m.box.querySelectorAll('.ig-dur-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _dureeSelectionnee = parseInt(this.dataset.mois);
        var isAnnuel = _dureeSelectionnee === 12;
        m.box.querySelectorAll('.ig-dur-btn').forEach(function(b) {
          var active = b === btn;
          var ac = active ? (parseInt(b.dataset.mois) === 12 ? '#0E7A45' : '#0E6AAF') : null;
          b.style.background  = active ? ac : 'var(--bg3)';
          b.style.borderColor = active ? ac : 'var(--border2)';
          b.style.color       = active ? '#fff' : 'var(--text2)';
          b.style.fontWeight  = active ? '700' : '500';
        });
        _renderCards(_dureeSelectionnee);
      });
    });
  }

  async function _initierPaiement(planId, prixTotal, duree) {
    duree = duree || 1;
    var session  = window.IG.auth ? window.IG.auth.getSession() : {};
    var workerUrl = window.IG.config.workerUrl;
    var ref = 'IMMOGEST-' + (session.tenantId || '').substring(0,8).toUpperCase() + '-' + planId.toUpperCase() + '-D' + duree + '-' + Date.now();

    var upg = document.getElementById('ig-upgrade-modal');
    if (upg) upg.remove();

    window.IG.utils.showToast('Connexion à Fapshi...', 'blue');

    try {
      var res = await fetch(workerUrl + '/fapshi-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:   prixTotal,
          tenantId: session.tenantId || '',
          planId:   planId,
          duree:    duree,
          ref:      ref
        })
      });
      var d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erreur paiement');
      if (d.link) {
        window.open(d.link, '_blank');
        _afficherAttentePaiement(d.transId, ref, planId, duree);
      } else {
        throw new Error('Lien de paiement non reçu');
      }
    } catch(e) {
      window.IG.utils.showToast('Erreur paiement : ' + e.message, 'red');
    }
  }

  function _afficherAttentePaiement(transId, ref, planId, duree) {
    duree = duree || 1;
    var workerUrl = window.IG.config.workerUrl;
    var modal = window.IG.utils.showModal(
      '<div style="text-align:center;padding:20px">' +
      '<div style="font-size:48px;margin-bottom:12px">⏳</div>' +
      '<h3 style="font-size:15px;font-weight:700;margin-bottom:8px">Paiement en attente</h3>' +
      '<p style="font-size:13px;color:var(--text3);margin-bottom:20px">Complétez le paiement dans l\'onglet ouvert (MTN MoMo / Orange Money), puis cliquez sur Vérifier.</p>' +
      '<p style="font-size:11px;color:var(--text3);background:var(--bg4);padding:8px 12px;border-radius:8px;margin-bottom:16px">Réf : ' + ref + '</p>' +
      '<div style="display:flex;gap:8px;justify-content:center">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="check-pmt-btn" style="padding:9px 16px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:13px;font-weight:600">✓ Vérifier le paiement</button>' +
      '</div></div>',
      { width: '420px' }
    );

    modal.box.querySelector('#check-pmt-btn').addEventListener('click', async function() {
      this.textContent = '⏳ Vérification...'; this.disabled = true;
      try {
        var r = await fetch(workerUrl + '/fapshi-check?transId=' + encodeURIComponent(transId));
        var d = await r.json();
        var st = (d.status || '').toUpperCase();
        if (st === 'SUCCESSFUL') {
          modal.close();
          var session2 = window.IG.auth ? window.IG.auth.getSession() : {};
          var activation = await fetch(workerUrl + '/activate-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              planId: planId,
              ref: ref,
              duree: duree,
              tenantId: session2.tenantId || '',
              transId: transId,
              sessionToken: session2.sessionToken || ''
            })
          });
          var activationData = await activation.json().catch(function() { return {}; });
          if (!activation.ok) throw new Error(activationData.error || 'Activation abonnement échouée');
          var dl = duree === 1 ? '1 mois' : duree === 12 ? '1 an' : duree + ' mois';
          window.IG.utils.showToast('Paiement confirmé ! Plan ' + planId.toUpperCase() + ' activé pour ' + dl + '.', 'green');
          setTimeout(function() { location.reload(); }, 2000);
        } else if (st === 'FAILED' || st === 'EXPIRED') {
          window.IG.utils.showToast('Paiement ' + st.toLowerCase() + '. Réessayez.', 'red');
          this.textContent = '✓ Vérifier le paiement'; this.disabled = false;
        } else {
          window.IG.utils.showToast('Paiement en attente (statut : ' + (st || 'PENDING') + ')', 'orange');
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
    getPlan, getLimites, getJoursEssaiRestants, prixPourDuree,
    peutAjouterImmeuble, peutAjouterLocataire,
    verifierImmeuble, verifierLocataire,
    renderBlocPlan, afficherUpgrade, afficherSaisiePromo,
    _initierPaiement,
    verifierRetrogradation, estEnModeRetro
  };

})();
