// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Juridique
//  Génération MED, commandement, plainte — intégré LegalOS
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.juridique = (function() {

  function t(k) { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── Quotas mensuels de documents juridiques par plan ─────────
  var QUOTAS = { gratuit: 5, trial: 20, starter: 30, pro: 100, cabinet: Infinity };

  function _quotaKey(tenantId) {
    var ym = new Date().toISOString().slice(0, 7); // "2026-06"
    return 'ig_jur_' + tenantId + '_' + ym;
  }

  function _getUsage(tenantId) {
    return parseInt(localStorage.getItem(_quotaKey(tenantId)) || '0', 10);
  }

  function _incUsage(tenantId) {
    var key = _quotaKey(tenantId);
    localStorage.setItem(key, String(_getUsage(tenantId) + 1));
  }

  // Retourne true si ok, affiche modal upgrade et retourne false si quota dépassé
  function _checkQuota() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var plan = session.plan || 'gratuit';
    var quota = QUOTAS[plan] !== undefined ? QUOTAS[plan] : 5;
    if (quota === Infinity) return true;
    var usage = _getUsage(session.tenantId || 'default');
    if (usage < quota) return true;

    var PLANS = [
      { id: 'starter', label: 'Starter', docs: 30 },
      { id: 'pro',     label: 'Pro',     docs: 100 },
      { id: 'cabinet', label: 'Cabinet', docs: '∞' }
    ];
    var nextPlan = PLANS.find(function(p) { return (QUOTAS[p.id] || 0) > quota; }) || PLANS[PLANS.length - 1];

    window.IG.utils.showModal(
      '<div style="text-align:center;padding:8px 0">' +
      '<div style="font-size:38px;margin-bottom:10px">📋</div>' +
      '<h3 style="font-size:16px;font-weight:800;margin-bottom:6px">Quota mensuel atteint</h3>' +
      '<p style="font-size:13px;color:var(--text2);margin-bottom:4px;line-height:1.6">' +
      'Vous avez généré <strong>' + usage + ' / ' + quota + ' documents</strong> ce mois-ci<br>' +
      'sur votre plan <strong style="text-transform:capitalize">' + plan + '</strong>.</p>' +
      '<p style="font-size:12px;color:var(--text3);margin-bottom:20px">Le compteur se remet à zéro le 1er du mois prochain.</p>' +
      '<div style="background:var(--bg3);border-radius:10px;padding:14px;margin-bottom:16px;text-align:left">' +
      '<div style="font-size:11px;color:var(--text3);font-weight:700;margin-bottom:10px;text-transform:uppercase">Limites par plan</div>' +
      [
        { id: 'gratuit', label: 'Gratuit', docs: 5 },
        { id: 'trial',   label: 'Essai',   docs: 20 },
        { id: 'starter', label: 'Starter', docs: 30 },
        { id: 'pro',     label: 'Pro',     docs: 100 },
        { id: 'cabinet', label: 'Cabinet', docs: '∞' }
      ].map(function(p) {
        var isCurrent = p.id === plan;
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);' +
          (isCurrent ? 'font-weight:700;color:var(--accent)' : 'color:var(--text2)') + '">' +
          '<span>' + (isCurrent ? '▶ ' : '') + p.label + '</span>' +
          '<span>' + p.docs + ' docs / mois</span></div>';
      }).join('') +
      '</div>' +
      '<button onclick="this.closest(\'.ig-modal-overlay\').click()" style="padding:11px 24px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:14px;font-weight:700;cursor:pointer;width:100%;margin-bottom:8px">' +
      'Passer à ' + nextPlan.label + ' (' + nextPlan.docs + ' docs/mois) →</button>' +
      '<button data-modal-close style="background:none;border:none;color:var(--text3);font-size:12px;cursor:pointer">Fermer</button>' +
      '</div>',
      { width: '400px' }
    );
    return false;
  }

  // Consomme 1 quota et génère le doc — appelé avant d'afficher
  function _useQuota() {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    _incUsage(session.tenantId || 'default');
  }

  // ── Générer et afficher un document juridique ─────────────────
  async function genererDoc(codeTemplate, loc, variables) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var locale  = window.IG._locale || session.locale || {};
    // Mapper pays complet → code ISO 2 lettres pour les templates
    var PAYS_CODE = {
      'Cameroun':'CM','Sénégal':'SN','Côte d\'Ivoire':'CI','Mali':'ML',
      'Burkina Faso':'BF','Niger':'NE','Togo':'TG','Bénin':'BJ',
      'Guinea':'GN','Nigeria':'NG','Ghana':'GH','Kenya':'KE',
      'Maroc':'MA','Tunisie':'TN','Algérie':'DZ','Egypte':'EG',
      'France':'FR','Belgique':'BE','Gabon':'GA','Congo':'CG','Tchad':'TD',
      'RDC':'CD','Mauritanie':'MR'
    };
    var paysNom = locale.pays || 'Cameroun';
    var pays    = PAYS_CODE[paysNom] || locale.pays || 'CM';
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

  // ── Score de fiabilité locataire (0–100) ─────────────────────
  function calculerScore(loc) {
    var paiements = _getPaiementsLoc(loc.id);
    if (!paiements.length) return { score: 50, label: 'Nouveau', color: 'var(--text3)', detail: 'Pas encore d\'historique' };

    var now = new Date();
    var entree = loc.entree ? new Date(loc.entree) : now;
    var moisPresence = Math.max(1, Math.round((now - entree) / (30 * 86400000)));

    // Points positifs : paiements à temps
    var total = paiements.length;
    var retards = paiements.filter(function(p) { return p.en_retard || (p.jours_retard && p.jours_retard > 5); }).length;
    var tauxPonctualite = total > 0 ? (total - retards) / total : 0.5;

    // Calcul score
    var score = Math.round(
      tauxPonctualite * 60 +                          // 60 pts ponctualité
      Math.min(moisPresence / 12, 1) * 20 +           // 20 pts ancienneté (max 1 an)
      (loc.arrieres === 0 || !loc.arrieres ? 20 : 0)  // 20 pts aucun arriéré actuel
    );
    score = Math.max(0, Math.min(100, score));

    var label, color;
    if (score >= 85)      { label = 'Excellent';    color = '#0E7A45'; }
    else if (score >= 65) { label = 'Bon';          color = '#2E9E5B'; }
    else if (score >= 45) { label = 'Moyen';        color = '#E08A00'; }
    else if (score >= 25) { label = 'Risqué';       color = '#C84A20'; }
    else                  { label = 'Critique';     color = 'var(--red)'; }

    var detail = total + ' paiement(s), ' + retards + ' retard(s), ' + moisPresence + ' mois de présence';
    return { score, label, color, detail };
  }

  function badgeScore(loc) {
    var s = calculerScore(loc);
    return '<span title="' + esc(s.detail) + '" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:99px;background:' + s.color + '22;color:' + s.color + ';font-size:11px;font-weight:700;cursor:help">' +
      '★ ' + s.score + ' — ' + esc(s.label) +
      '</span>';
  }

  // ── Afficher document dans modal ──────────────────────────────
  function afficherDocument(titre, contenu, onTelecharger) {
    _useQuota();
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
    if (!_checkQuota()) return;
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
    if (!_checkQuota()) return;
    var paiements = _getPaiementsLoc(loc.id);
    var analyse = window.IG.legal.analyseIA(loc, paiements);
    var result = await genererDoc('mise_en_demeure', loc, {
      montant_total: fmt(analyse.montant),
      nb_mois:       String(analyse.moisRetard)
    });
    if (result) afficherDocument('Mise en demeure — ' + loc.nom, result.contenu);
  }

  async function commanderPayer(loc) {
    if (!_checkQuota()) return;
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
    if (!_checkQuota()) return;
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
      '<div style="font-size:22px">' + (window.IG.ads ? window.IG.ads.scoreDisplay(score) : score + '/100') + '</div>' +
      '<div style="font-size:11px;color:var(--text3)">Score locataire</div>' +
      '</div>' +
      '<div style="background:var(--red-bg);border-radius:10px;padding:14px;text-align:center">' +
      '<div style="font-size:22px;font-weight:700;color:var(--red)">' + fmt(analyse.montant) + '</div>' +
      '<div style="font-size:11px;color:var(--text3)">' + analyse.moisRetard + ' mois impayés</div>' +
      '<div style="font-size:12px;font-weight:600;color:var(--red);margin-top:4px">Risque ' + analyse.risque + '</div>' +
      '</div>' +
      '</div>' +

      '<div id="ig-score-ad" style="margin-bottom:16px;min-height:92px;border-radius:10px;overflow:hidden;background:var(--bg3);border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;position:relative;">' +
      '<span style="position:absolute;top:3px;left:8px;font-size:9px;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;font-weight:600;opacity:.5">Pub</span>' +
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
      (analyse.moisRetard >= 3 ? '<button onclick="window.IG.juridique.deposerPlainte(window._jur_loc);this.closest(\'.ig-modal-overlay\')?.click()" style="flex:1;padding:9px;border-radius:8px;border:none;background:rgba(90,20,180,.12);color:#5A14B4;cursor:pointer;font-size:12px;font-weight:600">📋 Plainte</button>' : '') +
      '</div>'
    );
    window._jur_loc = loc;
    // Injecter bannière Adsterra (728x90) dans le slot de la modal
    setTimeout(function() {
      if (window.IG.ads) window.IG.ads._injecterAdsterra('ig-score-ad');
    }, 100);
  }

  // ── Plainte / Dépôt de plainte ───────────────────────────────
  function deposerPlainte(loc) {
    if (!_checkQuota()) return;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var paiements = _getPaiementsLoc(loc.id);
    var analyse = window.IG.legal.analyseIA(loc, paiements);
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var imm = imms.find(function(i) { return i.id == loc.immeuble_id; }) || {};
    var dateAuj = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    var signataire = session.nom || 'Le gestionnaire';
    var cabinet = session.nomCabinet || 'Le cabinet';

    // Formulaire de plainte
    var modal = window.IG.utils.showModal(
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">' +
      '<h3 style="font-size:15px;font-weight:700">📋 Dépôt de plainte — ' + esc(loc.nom) + '</h3>' +
      '<button data-modal-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +

      '<div style="background:var(--bg3);border-radius:10px;padding:14px;margin-bottom:16px;font-size:13px;display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div><span style="color:var(--text3)">Locataire :</span> <strong>' + esc(loc.nom) + '</strong></div>' +
      '<div><span style="color:var(--text3)">Téléphone :</span> <strong>' + esc(loc.telephone || '—') + '</strong></div>' +
      '<div><span style="color:var(--text3)">Immeuble :</span> <strong>' + esc(imm.nom_immeuble || imm.nom || '—') + '</strong></div>' +
      '<div><span style="color:var(--text3)">Local :</span> <strong>' + esc(loc.appt || '—') + '</strong></div>' +
      '<div><span style="color:var(--text3)">Montant dû :</span> <strong style="color:var(--red)">' + fmt(analyse.montant) + '</strong></div>' +
      '<div><span style="color:var(--text3)">Mois impayés :</span> <strong style="color:var(--red)">' + analyse.moisRetard + ' mois</strong></div>' +
      '</div>' +

      '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:700;color:var(--text2);display:block;margin-bottom:6px">MOTIF DE LA PLAINTE</label>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      ['Impayés de loyer', 'Dégradation du logement', 'Occupation illicite après congé', 'Non-respect du contrat de bail', 'Trouble de voisinage grave', 'Autre'].map(function(m) {
        return '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer"><input type="radio" name="plainte_motif" value="' + m + '"' + (m === 'Impayés de loyer' ? ' checked' : '') + '> ' + m + '</label>';
      }).join('') +
      '</div></div>' +

      '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:700;color:var(--text2);display:block;margin-bottom:6px">FAITS DÉTAILLÉS <span style="font-weight:400;opacity:.6">(optionnel)</span></label>' +
      '<textarea id="plainte-faits" rows="4" placeholder="Décrivez les faits en détail : dates, montants, tentatives de résolution amiable, refus du locataire…" style="width:100%;padding:10px;border:1px solid var(--border2);border-radius:8px;background:var(--bg4);color:var(--text);font-size:13px;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea></div>' +

      '<div style="margin-bottom:16px"><label style="font-size:12px;font-weight:700;color:var(--text2);display:block;margin-bottom:6px">AUTORITÉ COMPÉTENTE</label>' +
      '<select id="plainte-autorite" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<option value="tribunal">Tribunal compétent</option>' +
      '<option value="police">Commissariat / Brigade</option>' +
      '<option value="maire">Mairie / Sous-préfecture</option>' +
      '<option value="huissier">Huissier de justice</option>' +
      '</select></div>' +

      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button onclick="window.IG.juridique._previewPlainte(window._jur_loc)" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">👁️ Prévisualiser</button>' +
      '</div>',
      { width: '600px' }
    );
    window._jur_loc = loc;
    window._jur_loc_analyse = analyse;
    window._jur_loc_imm = imm;
    window._jur_session = session;
    window._jur_date = dateAuj;
  }

  function _previewPlainte(loc) {
    var analyse = window._jur_loc_analyse || {};
    var imm = window._jur_loc_imm || {};
    var session = window._jur_session || {};
    var dateAuj = window._jur_date || new Date().toLocaleDateString('fr-FR');
    var motif = (document.querySelector('[name="plainte_motif"]:checked') || {}).value || 'Impayés de loyer';
    var faits = (document.getElementById('plainte-faits') || {}).value || '';
    var autorite = (document.getElementById('plainte-autorite') || {}).value || 'tribunal';
    var autoriteLabel = { tribunal: 'Monsieur/Madame le Juge,', police: 'Monsieur/Madame le Commissaire / Commandant de Brigade,', maire: 'Monsieur/Madame le Maire / Sous-Préfet(e),', huissier: 'Maître,' }[autorite] || 'Monsieur/Madame,';

    var contenu =
      'PLAINTE AVEC CONSTITUTION DE PARTIE CIVILE\n' +
      '─────────────────────────────────────────────────\n\n' +
      'À ' + autoriteLabel + '\n\n' +
      'Je soussigné(e) ' + (session.nom || '…') + ', gérant(e) / représentant(e) de ' + (session.nomCabinet || '…') + ', domicilié(e) audit cabinet,\n\n' +
      'AI L\'HONNEUR DE PORTER À VOTRE CONNAISSANCE LES FAITS SUIVANTS :\n\n' +
      'Locataire mis en cause : ' + loc.nom + '\n' +
      'Téléphone              : ' + (loc.telephone || '—') + '\n' +
      'Bien loué              : ' + (imm.nom_immeuble || imm.nom || '—') + ', Local ' + (loc.appt || '—') + '\n' +
      'Loyer mensuel          : ' + fmt(loc.loyer || 0) + '\n\n' +
      'MOTIF : ' + motif + '\n\n' +
      (motif === 'Impayés de loyer'
        ? 'Depuis ' + analyse.moisRetard + ' mois, le locataire sus-cité n\'a pas honoré ses obligations locatives.\n' +
          'Le montant total des loyers impayés s\'élève à ' + fmt(analyse.montant) + '.\n' +
          'Malgré les relances amiables effectuées, le locataire n\'a pas régularisé sa situation.\n\n'
        : '') +
      (faits ? 'FAITS DÉTAILLÉS :\n' + faits + '\n\n' : '') +
      'EN CONSÉQUENCE, je vous demande de bien vouloir :\n' +
      '1. Prendre acte de la présente plainte ;\n' +
      '2. Procéder aux enquêtes et vérifications d\'usage ;\n' +
      '3. Poursuivre l\'auteur des faits devant la juridiction compétente.\n\n' +
      'Pièces jointes :\n' +
      '- Copie du contrat de bail\n' +
      '- Quittances de loyer non payées\n' +
      '- Copie de la mise en demeure envoyée le ……………\n\n' +
      'Fait à …………………, le ' + dateAuj + '\n\n' +
      'Signature :\n\n' +
      '______________________________\n' +
      (session.nom || '…') + '\n' +
      (session.nomCabinet || '');

    // Fermer la modal de formulaire
    document.querySelector('.ig-modal-overlay[style*="z-index"]') && document.querySelector('.ig-modal-overlay').click();

    afficherDocument('Plainte — ' + loc.nom, contenu);
  }

  // ── État des lieux entrée / sortie ───────────────────────────
  function afficherEtatDesLieux(loc, type) {
    if (!_checkQuota()) return;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var imm = imms.find(function(i) { return i.id == loc.immeuble_id; }) || {};
    var typeLabel = type === 'sortie' ? 'SORTIE' : 'ENTRÉE';
    var dateAujourd = new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' });

    var PIECES = ['Salon','Cuisine','Chambre 1','Chambre 2','Salle de bain','WC','Couloir','Balcon','Autre'];
    var ETATS = ['Bon état','État moyen','Mauvais état'];

    var lignes = PIECES.map(function(p) {
      return '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:10px 12px;font-size:13px;font-weight:500">' + p + '</td>' +
        ETATS.map(function(e) {
          return '<td style="padding:10px 12px;text-align:center"><input type="radio" name="edl_' + p.replace(/\s/g,'_') + '" value="' + e + '"></td>';
        }).join('') +
        '<td style="padding:6px"><input type="text" placeholder="Observations…" style="width:100%;border:1px solid var(--border2);border-radius:6px;padding:5px 8px;font-size:12px;background:var(--bg4);color:var(--text)"></td>' +
        '</tr>';
    }).join('');

    var html =
      '<div style="max-width:700px">' +
      '<div style="text-align:center;margin-bottom:16px">' +
        '<div style="font-size:18px;font-weight:800;text-transform:uppercase;color:var(--accent)">ÉTAT DES LIEUX — ' + typeLabel + '</div>' +
        '<div style="font-size:12px;color:var(--text3);margin-top:4px">' + esc(session.nomCabinet || session.nom || '') + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;padding:14px;background:var(--bg3);border-radius:10px;font-size:13px">' +
        '<div><span style="color:var(--text3)">Locataire :</span> <strong>' + esc(loc.nom) + '</strong></div>' +
        '<div><span style="color:var(--text3)">Date :</span> <strong>' + dateAujourd + '</strong></div>' +
        '<div><span style="color:var(--text3)">Immeuble :</span> <strong>' + esc(imm.nom_immeuble || imm.nom || '—') + '</strong></div>' +
        '<div><span style="color:var(--text3)">Local N° :</span> <strong>' + esc(loc.appt || '—') + '</strong></div>' +
        '<div><span style="color:var(--text3)">Loyer :</span> <strong>' + fmt(loc.loyer) + '</strong></div>' +
        '<div><span style="color:var(--text3)">Téléphone :</span> <strong>' + esc(loc.telephone || '—') + '</strong></div>' +
      '</div>' +
      '<div style="overflow-x:auto;margin-bottom:16px">' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px">' +
        '<thead><tr style="background:var(--bg3)">' +
          '<th style="padding:8px 12px;text-align:left">Pièce</th>' +
          ETATS.map(function(e) { return '<th style="padding:8px 12px;text-align:center;font-size:11px">' + e + '</th>'; }).join('') +
          '<th style="padding:8px 12px;text-align:left">Observations</th>' +
        '</tr></thead><tbody>' + lignes + '</tbody></table>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;padding:14px;background:var(--bg3);border-radius:10px;font-size:13px">' +
        '<div><span style="color:var(--text3)">Compteur électricité :</span><input type="text" placeholder="Index…" style="margin-left:8px;border:1px solid var(--border2);border-radius:6px;padding:4px 8px;background:var(--bg4);color:var(--text);width:100px"></div>' +
        '<div><span style="color:var(--text3)">Compteur eau :</span><input type="text" placeholder="Index…" style="margin-left:8px;border:1px solid var(--border2);border-radius:6px;padding:4px 8px;background:var(--bg4);color:var(--text);width:100px"></div>' +
        '<div><span style="color:var(--text3)">Clés remises :</span><input type="number" placeholder="Nb" min="0" style="margin-left:8px;border:1px solid var(--border2);border-radius:6px;padding:4px 8px;background:var(--bg4);color:var(--text);width:60px"></div>' +
        '<div><span style="color:var(--text3)">Caution :</span><input type="text" placeholder="Montant" style="margin-left:8px;border:1px solid var(--border2);border-radius:6px;padding:4px 8px;background:var(--bg4);color:var(--text);width:100px"></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
        '<div style="border:1px solid var(--border2);border-radius:8px;padding:12px">' +
          '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">SIGNATURE BAILLEUR / GESTIONNAIRE</div>' +
          '<div style="height:60px;border-bottom:1px dashed var(--border2);margin-bottom:8px"></div>' +
          '<div style="font-size:12px">' + esc(session.nom || '') + '</div>' +
        '</div>' +
        '<div style="border:1px solid var(--border2);border-radius:8px;padding:12px">' +
          '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">SIGNATURE LOCATAIRE</div>' +
          '<div style="height:60px;border-bottom:1px dashed var(--border2);margin-bottom:8px"></div>' +
          '<div style="font-size:12px">' + esc(loc.nom) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Fermer</button>' +
        '<button onclick="window.print()" style="padding:8px 16px;border-radius:8px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:600">🖨️ Imprimer</button>' +
      '</div>' +
      '</div>';

    _useQuota();
    window.IG.utils.showModal(html, { width: '750px' });
  }

  // ── node --check safe export ──────────────────────────────────
  return {
    genererDoc, afficherDocument, telechargerTxt,
    envoyerRelance, mettreEnDemeure, commanderPayer,
    deposerPlainte, _previewPlainte,
    afficherAnalyseIA, afficherEtatDesLieux,
    calculerScore, badgeScore
  };

})();
