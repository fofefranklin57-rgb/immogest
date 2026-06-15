// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Juridique
//  Génération MED, commandement, plainte — intégré LegalOS
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.juridique = (function() {

  function t(k) { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── Générer et afficher un document juridique ─────────────────
  async function genererDoc(codeTemplate, loc, variables) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var locale  = session.locale || {};
    var pays    = locale.pays || 'CM';
    var langue  = locale.langue || 'fr';

    var template = await window.IG.legal.getTemplate(codeTemplate, pays, langue);
    if (!template) {
      window.IG.utils.showToast('Template ' + codeTemplate + ' introuvable', 'red');
      return null;
    }

    var varsAuto = window.IG.legal.variablesAutoLocataire(loc, session);
    var varsFinales = Object.assign({}, varsAuto, variables || {});
    var contenu = window.IG.legal.genererDocument(template, varsFinales);

    // Enregistrer dans timeline
    var analyse = window.IG.legal.analyseIA(loc, _getPaiementsLoc(loc.id));
    var dossierAction = {
      relance_1:          { type: 'relance_1',          titre: 'Relance envoyée' },
      mise_en_demeure:    { type: 'mise_en_demeure',    titre: 'Mise en demeure émise' },
      commandement_payer: { type: 'commandement_payer', titre: 'Commandement de payer' }
    }[codeTemplate];

    if (dossierAction) {
      await window.IG.legal.ajouterAction(
        null, loc.id, dossierAction.type, dossierAction.titre,
        'Montant : ' + fmt(analyse.montant), { contenu, template: codeTemplate }
      );
    }

    return { contenu, template, vars: varsFinales };
  }

  function _getPaiementsLoc(locId) {
    return window.IG.app ? (window.IG.app.getData().paiements || []).filter(function(p) {
      return p.locataire_id == locId;
    }) : [];
  }

  // ── Afficher document dans modal ──────────────────────────────
  function afficherDocument(titre, contenu, onTelecharger) {
    var modal = window.IG.utils.showModal(
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<h3 style="font-size:15px;font-weight:700">' + esc(titre) + '</h3>' +
      '<button data-modal-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +
      '<div id="jur-doc-content" style="white-space:pre-wrap;font-family:var(--mono);font-size:12px;' +
      'background:var(--bg4);border-radius:8px;padding:16px;max-height:50dvh;overflow-y:auto;' +
      'border:1px solid var(--border2);line-height:1.7">' + esc(contenu) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;flex-wrap:wrap">' +
      '<button id="jur-copy" style="padding:9px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">📋 Copier</button>' +
      '<button id="jur-wa" style="padding:9px 14px;border-radius:8px;border:none;background:#25D366;color:#fff;cursor:pointer;font-size:13px;font-weight:600">📱 WhatsApp</button>' +
      '<button id="jur-dl" style="padding:9px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">⬇ Télécharger</button>' +
      '</div>',
      { width: '600px' }
    );

    modal.box.querySelector('#jur-copy').addEventListener('click', function() {
      navigator.clipboard.writeText(contenu).then(function() {
        window.IG.utils.showToast('Copié dans le presse-papier', 'green');
      });
    });

    modal.box.querySelector('#jur-wa').addEventListener('click', function() {
      var encoded = encodeURIComponent(contenu);
      window.open('https://wa.me/?text=' + encoded, '_blank');
    });

    modal.box.querySelector('#jur-dl').addEventListener('click', function() {
      if (onTelecharger) onTelecharger(contenu);
      else telechargerTxt(titre, contenu);
    });
  }

  function telechargerTxt(titre, contenu) {
    var blob = new Blob([contenu], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = titre.replace(/[^a-z0-9]/gi, '_') + '_' + new Date().toISOString().split('T')[0] + '.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // ── Actions rapides par locataire ─────────────────────────────

  async function envoyerRelance(loc) {
    var paiements = _getPaiementsLoc(loc.id);
    var analyse = window.IG.legal.analyseIA(loc, paiements);
    var result = await genererDoc('relance_1', loc, {
      mois:         window.IG.utils.nomMois(new Date().getMonth() + 1),
      annee:        String(new Date().getFullYear()),
      montant:      String(analyse.montant)
    });
    if (result) afficherDocument('Première relance — ' + loc.nom, result.contenu);
  }

  async function mettreEnDemeure(loc) {
    var paiements = _getPaiementsLoc(loc.id);
    var analyse = window.IG.legal.analyseIA(loc, paiements);
    var result = await genererDoc('mise_en_demeure', loc, {
      montant_total: fmt(analyse.montant),
      nb_mois:       String(analyse.moisRetard)
    });
    if (result) afficherDocument('Mise en demeure — ' + loc.nom, result.contenu);
  }

  async function commanderPayer(loc) {
    var paiements = _getPaiementsLoc(loc.id);
    var analyse = window.IG.legal.analyseIA(loc, paiements);
    var result = await genererDoc('commandement_payer', loc, {
      montant_total:  fmt(analyse.montant),
      nb_mois:        String(analyse.moisRetard),
      montant_loyers: fmt(analyse.montant),
      frais:          '0'
    });
    if (result) afficherDocument('Commandement de payer — ' + loc.nom, result.contenu);
  }

  // ── Analyse IA ─────────────────────────────────────────────────
  function afficherAnalyseIA(loc) {
    var paiements = _getPaiementsLoc(loc.id);
    var analyse = window.IG.legal.analyseIA(loc, paiements);
    var score   = window.IG.legal.calculerScore(loc, paiements);
    var badge   = window.IG.legal.scoreBadge(score);

    var modal = window.IG.utils.showModal(
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
      '<h3 style="font-size:15px;font-weight:700">⚖️ Analyse juridique — ' + esc(loc.nom) + '</h3>' +
      '<button data-modal-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
      '<div style="background:var(--bg4);border-radius:10px;padding:14px;text-align:center">' +
      '<div style="font-size:24px">' + badge.emoji + '</div>' +
      '<div style="font-size:22px;font-weight:700;color:' + badge.color + '">' + score + '/100</div>' +
      '<div style="font-size:11px;color:var(--text3)">Score locataire</div>' +
      '</div>' +
      '<div style="background:var(--red-bg);border-radius:10px;padding:14px;text-align:center">' +
      '<div style="font-size:22px;font-weight:700;color:var(--red)">' + fmt(analyse.montant) + '</div>' +
      '<div style="font-size:11px;color:var(--text3)">' + analyse.moisRetard + ' mois impayés</div>' +
      '<div style="font-size:12px;font-weight:600;color:var(--red);margin-top:4px">Risque ' + analyse.risque + '</div>' +
      '</div>' +
      '</div>' +

      (analyse.actions.length ? '<div style="background:var(--bg4);border-radius:10px;padding:14px;margin-bottom:16px">' +
        '<div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text2)">ACTIONS RECOMMANDÉES</div>' +
        analyse.actions.map(function(a, i) {
          return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border2)">' +
            '<span style="width:20px;height:20px;border-radius:50%;background:var(--accent);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + (i+1) + '</span>' +
            '<span style="font-size:13px">' + esc(a) + '</span></div>';
        }).join('') +
        '</div>' : '') +

      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (analyse.moisRetard >= 1 ? '<button onclick="window.IG.juridique.envoyerRelance(window._jur_loc);this.closest(\'.ig-modal-overlay\')?.click()" style="flex:1;padding:9px;border-radius:8px;border:none;background:var(--yellow-bg);color:var(--yellow);cursor:pointer;font-size:12px;font-weight:600">📄 Relance</button>' : '') +
      (analyse.moisRetard >= 2 ? '<button onclick="window.IG.juridique.mettreEnDemeure(window._jur_loc);this.closest(\'.ig-modal-overlay\')?.click()" style="flex:1;padding:9px;border-radius:8px;border:none;background:rgba(224,90,0,.1);color:#E05A00;cursor:pointer;font-size:12px;font-weight:600">⚠️ MED</button>' : '') +
      (analyse.moisRetard >= 3 ? '<button onclick="window.IG.juridique.commanderPayer(window._jur_loc);this.closest(\'.ig-modal-overlay\')?.click()" style="flex:1;padding:9px;border-radius:8px;border:none;background:var(--red-bg);color:var(--red);cursor:pointer;font-size:12px;font-weight:600">🔴 Commandement</button>' : '') +
      '</div>'
    );
    window._jur_loc = loc;
  }

  // ── node --check safe export ──────────────────────────────────
  return {
    genererDoc, afficherDocument, telechargerTxt,
    envoyerRelance, mettreEnDemeure, commanderPayer,
    afficherAnalyseIA
  };

})();
