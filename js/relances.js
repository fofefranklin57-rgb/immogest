// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Relances
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.relances = (function() {

  function t(k)   { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── Calculer retard en mois ───────────────────────────────────
  function _ficheDepuisPremierPaiement(loc, paiements) {
    if (!paiements || !paiements.length) return [];
    var sorted = paiements.slice().sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });
    var first = new Date(sorted[0].date_paiement);
    var locProxy = Object.assign({}, loc, {
      entree: first.getFullYear() + '-' + String(first.getMonth() + 1).padStart(2, '0') + '-01'
    });
    return window.IG.paiements ? window.IG.paiements.calculerFiche(locProxy, paiements) : [];
  }

  function calculerRetard(loc, paiements) {
    if (!loc.entree || loc.statut === 'libre') return 0;
    var base = parseInt(loc.mois_arrieres) || 0;
    if (!paiements || paiements.length === 0) return base;
    var fiche = _ficheDepuisPremierPaiement(loc, paiements);
    var payes = fiche.filter(function(l) { return !l.futur && l.statut === 'Payé'; }).length;
    var impayesNouveaux = fiche.filter(function(l) { return !l.futur && l.statut !== 'Payé'; }).length;
    return Math.max(0, base - payes) + impayesNouveaux;
  }

  function montantDu(loc, paiements) {
    var loyer = parseFloat(loc.loyer) || 0;
    var baseArrieres = parseFloat(loc.arrieres) || 0;
    if (!paiements || paiements.length === 0) return baseArrieres;
    var fiche = _ficheDepuisPremierPaiement(loc, paiements);
    var payes = fiche.filter(function(l) { return !l.futur && l.statut === 'Payé'; }).length;
    var duNouv = fiche.filter(function(l) { return !l.futur; }).reduce(function(s, l) { return s + (l.reste || 0); }, 0);
    return Math.max(0, baseArrieres - payes * loyer) + duNouv;
  }

  // ── Niveaux de relance ────────────────────────────────────────
  function niveauRelance(moisRetard) {
    if (moisRetard === 0) return null;
    if (moisRetard === 1) return { niveau: 1, label: 'Relance', color: 'var(--yellow)', bg: 'var(--yellow-bg)', emoji: '🟡' };
    if (moisRetard === 2) return { niveau: 2, label: 'Mise en demeure', color: '#E05A00', bg: 'rgba(224,90,0,.10)', emoji: '🟠' };
    return { niveau: 3, label: 'Commandement', color: 'var(--red)', bg: 'var(--red-bg)', emoji: '🔴' };
  }

  // ── Message WhatsApp par niveau ───────────────────────────────
  function messageWA(loc, retard, montant, session) {
    var cabinet = (session && (session.nomCabinet || session.nom)) || 'ImmoGest';
    var msgs = [
      'Bonjour ' + loc.nom + ', nous vous rappelons que votre loyer du mois en cours (' + fmt(loc.loyer) + ') n\'a pas encore été reçu. Merci de régulariser dès que possible. — ' + cabinet,
      'Bonjour ' + loc.nom + ', ceci est une mise en demeure concernant ' + retard + ' mois de loyer impayé, soit ' + fmt(montant) + ' FCFA. Sans régularisation sous 8 jours, nous serons contraints de prendre des mesures légales. — ' + cabinet,
      'Bonjour ' + loc.nom + ', malgré nos relances, ' + fmt(montant) + ' FCFA de loyer reste dû (' + retard + ' mois). Un commandement de payer sera émis sous 48h. — ' + cabinet
    ];
    return msgs[Math.min(retard - 1, 2)];
  }

  // ── Rendu page relances ───────────────────────────────────────
  function renderPage(locataires, paiements) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var session = window.IG.auth ? window.IG.auth.getSession() : {};

    var alertes = locataires
      .filter(function(loc) { return loc.statut !== 'libre'; })
      .map(function(loc) {
        var pays = paiements.filter(function(p) { return p.locataire_id == loc.id; });
        var retard = calculerRetard(loc, pays);
        var montant = montantDu(loc, pays);
        var niveau = niveauRelance(retard);
        return { loc, retard, montant, niveau };
      })
      .filter(function(a) { return a.retard > 0; })
      .sort(function(a, b) { return b.retard - a.retard; });

    if (!alertes.length) {
      content.innerHTML = '<div class="content">' +
        '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">🔔 ' + t('Relances & Alertes') + '</h2>' +
        '<div class="card" style="text-align:center;padding:60px 20px;color:var(--text3)">' +
        '<div style="font-size:48px;margin-bottom:12px">🎉</div>' +
        '<p style="font-size:16px;font-weight:600">' + t('Tous les locataires sont à jour !') + '</p>' +
        '</div></div>';
      return;
    }

    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">🔔 ' + t('Relances & Alertes') + ' (' + alertes.length + ')</h2>' +
      '<button onclick="window.IG.relances.envoyerTous()" style="padding:9px 16px;border-radius:10px;border:none;background:#25D366;color:#fff;cursor:pointer;font-size:13px;font-weight:600">📱 WhatsApp Tous</button>' +
      '</div>';

    // Résumé par niveau
    var n1 = alertes.filter(function(a) { return a.retard === 1; }).length;
    var n2 = alertes.filter(function(a) { return a.retard === 2; }).length;
    var n3 = alertes.filter(function(a) { return a.retard >= 3; }).length;
    html += '<div class="metrics-grid" style="margin-bottom:20px">' +
      _nCard('🟡', n1, t('1 mois de retard')) +
      _nCard('🟠', n2, t('2 mois — Mise en demeure')) +
      _nCard('🔴', n3, t('3+ mois — Commandement')) +
      '</div>';

    html += '<div id="ig-ad-relances" style="margin-bottom:16px;text-align:center"></div>';
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    alertes.forEach(function(a) {
      var n = a.niveau;
      var wa = window.IG.locataires ? window.IG.locataires.lienWA(a.loc, messageWA(a.loc, a.retard, a.montant, session)) : null;
      var imm = window.IG.immeubles ? window.IG.immeubles.getById(a.loc.immeuble_id) : null;

      html += '<div class="card" style="border-left:4px solid ' + n.color + ';padding:14px 16px">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="font-size:16px">' + n.emoji + '</span>' +
        '<strong style="font-size:14px">' + esc(a.loc.nom) + '</strong>' +
        '<span style="font-size:11px;background:' + n.bg + ';color:' + n.color + ';padding:2px 8px;border-radius:99px;font-weight:700">' + n.label + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--text3)">' +
        esc(imm ? (imm.nom_immeuble || imm.nom) : '') + ' — Local ' + esc(a.loc.appt || '?') +
        ' — ' + a.retard + ' mois de retard' +
        '</div></div>' +
        '<div style="text-align:right">' +
        '<div style="font-size:18px;font-weight:700;color:' + n.color + '">' + fmt(a.montant) + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">montant dû</div>' +
        '</div></div>' +
        '<div style="display:flex;gap:8px;margin-top:12px">' +
        (wa ? '<a href="' + wa + '" target="_blank" style="padding:7px 14px;border-radius:8px;background:#25D366;color:#fff;font-size:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:4px">📱 WhatsApp</a>' : '') +
        '<button onclick="window.IG.paiements.afficherFormulaire(' + a.loc.id + ')" style="padding:7px 14px;border-radius:8px;border:none;background:var(--green);color:#fff;font-size:12px;font-weight:600;cursor:pointer">💵 Encaisser</button>' +
        '<button onclick="window.IG.locataires.afficherFiche(' + a.loc.id + ')" style="padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">📋 Fiche</button>' +
        '</div></div>';
    });
    html += '</div></div>';
    content.innerHTML = html;
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-relances', 'ad2');
  }

  function _nCard(emoji, nb, label) {
    return '<div class="metric-card"><div class="metric-label">' + emoji + ' ' + label + '</div>' +
      '<div class="metric-value">' + nb + '</div></div>';
  }

  function envoyerTous() {
    window.IG.utils.showToast('Liens WhatsApp générés — ouvrez chaque locataire', 'blue');
  }

  return { renderPage, calculerRetard, montantDu, niveauRelance, messageWA };

})();
