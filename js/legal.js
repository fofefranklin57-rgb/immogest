// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — LegalOS Foundation
//  Prompt 2 adapté : couche juridique indépendante
//  Activable/désactivable par tenant via feature_flags
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.legal = (function() {

  function t(k) { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }
  function db() { return window.IG.db; }

  // ── Feature flag check ────────────────────────────────────────
  // LegalOS disponible à partir du plan Pro (et pendant l'essai gratuit,
  // qui donne un accès complet). session.features n'est jamais alimenté
  // par le backend -- se baser sur le plan réel de l'utilisateur.
  function isActive() {
    var session = window.IG.auth ? window.IG.auth.getSession() : null;
    if (!session) return false;
    var plan = (session.plan || '').toLowerCase();
    if (plan === 'pro' || plan === 'cabinet') return true;
    // Essai "gratuit" 30j auto (plans.js, base sur l'age du tenant)
    if (window.IG.plans && window.IG.plans.getPlan() === 'trial') return true;
    // Essai actif sur un autre plan (ex: "Starter 30 jours") tant que
    // plan_expire n'est pas dépassé -- meme logique que le badge de
    // periode d'essai dans app.js (_initEssai).
    if (session.plan_expire && new Date(session.plan_expire).getTime() > Date.now()) return true;
    return false;
  }

  // ── DOSSIERS JURIDIQUES ───────────────────────────────────────

  async function getDossiers(filters) {
    try {
      return await db().select('dossiers_juridiques', filters);
    } catch(e) {
      console.warn('LegalOS: dossiers_juridiques non disponible', e.message);
      return [];
    }
  }

  async function creerDossier(locataireId, type, montant, immeubleId) {
    try {
      var result = await db().insert('dossiers_juridiques', {
        locataire_id:     locataireId || null,
        immeuble_id:      immeubleId || null,
        type_dossier:     type || 'loyers_impayes',
        statut:           'ouvert',
        montant_reclame:  montant || 0,
        date_ouverture:   new Date().toISOString().split('T')[0]
      });
      await emit('dossier.opened', 'dossiers_juridiques', result[0]?.id, { type, montant });
      return result[0];
    } catch(e) {
      console.warn('LegalOS: impossible de créer dossier', e.message);
      return null;
    }
  }

  async function cloturerDossier(dossierId, statut) {
    try {
      await db().update('dossiers_juridiques', dossierId, {
        statut: statut || 'clos',
        date_cloture: new Date().toISOString().split('T')[0]
      });
      await emit('dossier.closed', 'dossiers_juridiques', dossierId, { statut });
    } catch(e) {
      console.warn('LegalOS: cloture dossier', e.message);
    }
  }

  // ── TIMELINE JURIDIQUE ────────────────────────────────────────

  async function getTimeline(locataireId) {
    try {
      return await db().select('timeline_juridique', { locataire_id: locataireId });
    } catch(e) {
      return [];
    }
  }

  async function ajouterAction(dossierId, locataireId, typeAction, titre, description, docData) {
    try {
      var result = await db().insert('timeline_juridique', {
        dossier_id:   dossierId,
        locataire_id: locataireId,
        type_action:  typeAction,
        titre,
        description:  description || null,
        document_data: docData || null,
        date_action:  new Date().toISOString()
      });
      await emit('timeline.' + typeAction, 'timeline_juridique', result[0]?.id, { locataireId, titre });
      return result[0];
    } catch(e) {
      console.warn('LegalOS: ajout action timeline', e.message);
      return null;
    }
  }

  // ── TEMPLATES DOCUMENTS ───────────────────────────────────────

  var _templatesCache = null;

  async function getTemplates(pays, langue) {
    if (!_templatesCache) {
      try {
        _templatesCache = await db().select('templates_docs');
      } catch(e) {
        _templatesCache = _getTemplatesLocaux();
      }
    }
    return (_templatesCache || []).filter(function(t) {
      return (!pays || t.pays === pays) && (!langue || t.langue === langue) && t.actif;
    });
  }

  async function getTemplate(code, pays, langue) {
    var templates = await getTemplates(pays, langue);
    return templates.find(function(t) { return t.code === code; }) || null;
  }

  // Templates locaux (fallback si table non disponible)
  function _getTemplatesLocaux() {
    return [
      {
        code: 'relance_1', titre: 'Première relance', pays: 'CM', langue: 'fr',
        contenu: 'Objet : Rappel de paiement\n\n{{ville}}, le {{date}}\n\nMonsieur/Madame {{nom_locataire}},\n\nNous vous rappelons que votre loyer du mois de {{mois}} {{annee}}, d\'un montant de {{montant}} FCFA, n\'a pas encore été réglé.\n\nMerci de régulariser dans les meilleurs délais.\n\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
        variables: [{ key:'ville' },{ key:'date' },{ key:'nom_locataire' },{ key:'mois' },{ key:'annee' },{ key:'montant' },{ key:'nom_gestionnaire' },{ key:'nom_cabinet' }],
        actif: true
      },
      {
        code: 'mise_en_demeure', titre: 'Mise en demeure', pays: 'CM', langue: 'fr',
        contenu: 'MISE EN DEMEURE\n\n{{ville}}, le {{date}}\n\nMonsieur/Madame {{nom_locataire}},\nLocal N° {{appt}} — {{adresse_immeuble}}\n\nNous vous mettons en demeure de régler sous 8 jours la somme de {{montant_total}} FCFA ({{nb_mois}} mois impayés).\n\nFaute de paiement, nous engagerons les procédures judiciaires nécessaires.\n\n{{nom_gestionnaire}}\n{{nom_cabinet}}',
        variables: [{ key:'ville' },{ key:'date' },{ key:'nom_locataire' },{ key:'appt' },{ key:'adresse_immeuble' },{ key:'montant_total' },{ key:'nb_mois' },{ key:'nom_gestionnaire' },{ key:'nom_cabinet' }],
        actif: true
      },
      {
        code: 'commandement_payer', titre: 'Commandement de payer', pays: 'CM', langue: 'fr',
        contenu: 'COMMANDEMENT DE PAYER\n\nNous soussigné(e), {{nom_gestionnaire}} ({{nom_cabinet}}),\n\nCOMMANDONS Monsieur/Madame {{nom_locataire}}, local N° {{appt}} — {{nom_immeuble}},\n\nDE PAYER dans les 48 heures la somme de {{montant_total}} FCFA ({{nb_mois}} mois impayés), faute de quoi il sera procédé à toutes voies de droit.\n\nFait à {{ville}}, le {{date}}\n{{nom_gestionnaire}}',
        variables: [{ key:'ville' },{ key:'date' },{ key:'nom_locataire' },{ key:'appt' },{ key:'nom_immeuble' },{ key:'montant_total' },{ key:'nb_mois' },{ key:'nom_gestionnaire' },{ key:'nom_cabinet' }],
        actif: true
      }
    ];
  }

  // ── GÉNÉRATEUR DOCUMENTAIRE ───────────────────────────────────

  function genererDocument(template, variables) {
    if (!template) return '';
    var contenu = template.contenu || '';
    Object.entries(variables).forEach(function([k, v]) {
      contenu = contenu.split('{{' + k + '}}').join(v || '');
    });
    return contenu;
  }

  function variablesAutoLocataire(loc, session) {
    var now = new Date();
    var imm = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    return {
      date:             now.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }),
      ville:            imm?.ville || 'Yaoundé',
      nom_locataire:    loc.nom || '',
      appt:             loc.appt || '',
      nom_immeuble:     imm ? (imm.nom_immeuble || imm.nom) : '',
      adresse_immeuble: imm ? ((imm.quartier || '') + (imm.ville ? ', ' + imm.ville : '')) : '',
      nom_gestionnaire: session?.nom || '',
      nom_cabinet:      session?.nomCabinet || 'ImmoGest'
    };
  }

  // ── WORKFLOW RECOUVREMENT ─────────────────────────────────────

  var WORKFLOW_DEFAUT = [
    { jours: 15, action: 'relance_1',         canal: 'whatsapp', auto: true  },
    { jours: 30, action: 'relance_2',         canal: 'whatsapp', auto: true  },
    { jours: 45, action: 'mise_en_demeure',   canal: 'document', auto: false },
    { jours: 60, action: 'commandement_payer',canal: 'document', auto: false },
    { jours: 90, action: 'ouverture_dossier', canal: 'system',   auto: true  }
  ];

  function prochainEtape(joursRetard, workflow) {
    var etapes = (workflow && workflow.etapes) || WORKFLOW_DEFAUT;
    for (var i = etapes.length - 1; i >= 0; i--) {
      if (joursRetard >= etapes[i].jours) return etapes[i];
    }
    return null;
  }

  function analyseIA(loc, paiements) {
    var pays = paiements.filter(function(p) { return p.locataire_id == loc.id; });
    var fiche = window.IG.paiements ? window.IG.paiements.calculerFiche(loc, pays) : [];
    var impayes = fiche.filter(function(l) { return !l.futur && !l.solde; });
    var montant = impayes.reduce(function(s, l) { return s + (l.reste || 0); }, 0);
    var moisRetard = impayes.length;

    var risque = moisRetard >= 3 ? 'élevé' : moisRetard >= 2 ? 'modéré' : moisRetard >= 1 ? 'faible' : 'nul';
    var actions = [];
    if (moisRetard >= 1) actions.push('Envoyer relance WhatsApp');
    if (moisRetard >= 2) actions.push('Émettre mise en demeure');
    if (moisRetard >= 3) actions.push('Envoyer commandement de payer');
    if (moisRetard >= 4) actions.push('Saisir huissier de justice');

    return {
      moisRetard,
      montant,
      risque,
      actions,
      resume: moisRetard + ' mois d\'impayés — ' + fmt(montant) + ' — Risque ' + risque
    };
  }

  // ── EVENT EMITTER ─────────────────────────────────────────────

  async function emit(action, entity, entityId, payload) {
    try {
      await db().insert('events_log', {
        entity, entity_id: String(entityId || ''),
        action, payload: payload || {}
      });
    } catch(_) {}
  }

  // ── SCORE LOCATAIRE ───────────────────────────────────────────

  function calculerScore(loc, paiements) {
    var pays = paiements.filter(function(p) { return p.locataire_id == loc.id; });
    if (!pays.length) return 100;
    var fiche = window.IG.paiements ? window.IG.paiements.calculerFiche(loc, pays) : [];
    // Les mois antérieurs à la reprise du dossier sortent du score : aucune
    // donnée ne les documente, les compter « payés » gonflait la note.
    var fichePasse = fiche.filter(function(l) { return !l.futur && !l.horsBail && !l.anterieur; });
    var total = fichePasse.length;
    var payes = fichePasse.filter(function(l) { return l.solde; }).length;
    if (!total) return 100;
    var taux = payes / total;
    var score = Math.round(taux * 100);
    var impayes = total - payes;
    score = Math.max(0, score - impayes * 5);
    return Math.min(100, Math.max(0, score));
  }

  function scoreBadge(score) {
    if (score >= 90) return { label: 'Excellent', color: 'var(--green)', emoji: '🟢' };
    if (score >= 75) return { label: 'Bon',       color: '#2EA05A',      emoji: '🟡' };
    if (score >= 50) return { label: 'Moyen',     color: 'var(--yellow)',emoji: '🟠' };
    return             { label: 'Mauvais',         color: 'var(--red)',   emoji: '🔴' };
  }

  // ── RENDER PAGE DOSSIERS ──────────────────────────────────────

  async function renderPage() {
    var content = document.getElementById('page-content');
    if (!content) return;

    if (!isActive()) {
      content.innerHTML = '<div class="content"><div class="card" style="text-align:center;padding:60px 20px">' +
        '<div style="font-size:48px;margin-bottom:16px">⚖️</div>' +
        '<h3 style="margin-bottom:8px">LegalOS</h3>' +
        '<p style="color:var(--text3);margin-bottom:20px">Module juridique disponible à partir du plan Pro</p>' +
        '<button onclick="window.IG.plans.afficherUpgrade()" class="btn-primary" style="padding:10px 24px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">🚀 Passer au plan Pro</button>' +
        '</div></div>';
      return;
    }

    var dossiers = await getDossiers();
    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<h2 style="font-size:17px;font-weight:700">⚖️ LegalOS — Dossiers juridiques</h2>' +
      '<button onclick="window.IG.legal.nouveauDossier()" style="padding:9px 16px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ Nouveau dossier</button>' +
      '</div>';

    if (!dossiers.length) {
      html += '<div class="card" style="text-align:center;padding:40px;color:var(--text3)">' +
        '<div style="font-size:40px;margin-bottom:10px">📂</div>' +
        '<p>Aucun dossier juridique ouvert</p></div>';
    } else {
      html += '<div style="display:flex;flex-direction:column;gap:10px">';
      dossiers.forEach(function(d) {
        var statutColor = { ouvert:'var(--yellow)', en_cours:'var(--accent)', clos:'var(--text3)', gagne:'var(--green)', perdu:'var(--red)' }[d.statut] || 'var(--text3)';
        var loc = (d.locataire_id && window.IG.locataires) ? window.IG.locataires.getById(d.locataire_id) : null;
        var imm = (d.immeuble_id && window.IG.immeubles) ? window.IG.immeubles.getById(d.immeuble_id) : null;
        var estAuto = (d.notes || '').indexOf('automatiquement') !== -1;
        html += '<div class="card" style="border-left:4px solid ' + statutColor + '">' +
          '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">' +
          '<div>' +
          '<div style="font-weight:700;font-size:14px">' + esc(d.type_dossier.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();})) +
          (estAuto ? ' <span style="font-size:10px;font-weight:600;color:var(--text3);background:var(--bg3);padding:2px 6px;border-radius:99px">🤖 ' + t('Auto') + '</span>' : '') +
          '</div>' +
          (loc ? '<div style="font-size:13px;color:var(--text);margin-top:2px">' + esc(loc.nom) + (imm ? ' — ' + esc(imm.nom_immeuble || imm.nom) + (loc.appt ? ' / ' + esc(loc.appt) : '') : '') + '</div>' : '') +
          '<div style="font-size:12px;color:var(--text3);margin-top:2px">' + t('Ouvert le') + ' ' + window.IG.utils.formatDate(d.date_ouverture) + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
          '<div style="font-size:15px;font-weight:700;color:var(--red)">' + fmt(d.montant_reclame) + '</div>' +
          '<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:' + statutColor + '22;color:' + statutColor + ';font-weight:600">' + esc(d.statut) + '</span>' +
          '</div></div>' +
          (loc ? '<div style="margin-top:10px"><button onclick="window.IG.app.showPage(\'locataires\');window.IG.locataires.afficherFiche(' + loc.id + ')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">👤 ' + t('Voir le locataire') + '</button></div>' : '') +
          '</div>';
      });
      html += '</div>';
    }
    html += '<div id="ig-ad-legal" style="margin-top:20px;text-align:center"></div>';
    html += '</div>';
    content.innerHTML = html;
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-legal', 'ad2');
  }

  function nouveauDossier(locIdPreset) {
    var locs = window.IG.locataires ? window.IG.locataires.getCache().filter(function(l) { return l.statut !== 'libre'; }) : [];
    var locOptions = '<option value="">' + t('Aucun (dossier général)') + '</option>' +
      locs.map(function(l) {
        var imm = window.IG.immeubles ? window.IG.immeubles.getById(l.immeuble_id) : null;
        return '<option value="' + l.id + '"' + (String(l.id) === String(locIdPreset) ? ' selected' : '') + '>' +
          esc(l.nom) + (imm ? ' — ' + esc(imm.nom_immeuble || imm.nom) + (l.appt ? ' / ' + esc(l.appt) : '') : '') + '</option>';
      }).join('');
    var modal = window.IG.utils.showModal(
      '<h3 style="margin-bottom:16px;font-size:15px;font-weight:700">⚖️ ' + t('Nouveau dossier juridique') + '</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Locataire') + '</label>' +
      '<select id="legal-loc" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' + locOptions + '</select>' +
      '</div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Type de dossier') + '</label>' +
      '<select id="legal-type" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '<option value="loyers_impayes">' + t('Loyers impayés') + '</option>' +
      '<option value="expulsion">' + t('Expulsion') + '</option>' +
      '<option value="degradations">' + t('Dégradations') + '</option>' +
      '<option value="recouvrement">' + t('Recouvrement') + '</option>' +
      '<option value="mediation">' + t('Médiation') + '</option>' +
      '<option value="autre">' + t('Autre') + '</option>' +
      '</select></div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Montant réclamé (FCFA)') + '</label>' +
      '<input id="legal-montant" type="number" placeholder="0" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Annuler') + '</button>' +
      '<button id="legal-save" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + t('Ouvrir le dossier') + '</button>' +
      '</div></div>'
    );
    modal.box.querySelector('#legal-save').addEventListener('click', async function() {
      var locId = modal.box.querySelector('#legal-loc').value || null;
      var loc = locId ? window.IG.locataires.getById(locId) : null;
      var type = modal.box.querySelector('#legal-type').value;
      var montant = parseFloat(modal.box.querySelector('#legal-montant').value) || 0;
      modal.close();
      await creerDossier(locId, type, montant, loc ? loc.immeuble_id : null);
      window.IG.utils.showToast(t('Dossier juridique ouvert'), 'green');
      renderPage();
    });
  }

  // ── Pont locataire → dossier juridique ─────────────────────────
  async function voirDossierLocataire(locId) {
    var loc = window.IG.locataires ? window.IG.locataires.getById(locId) : null;
    if (!loc) return;
    var dossiers = await getDossiers({ locataire_id: locId });

    if (!dossiers.length) {
      window.IG.utils.confirm(
        '⚖️ ' + t('Aucun dossier juridique pour') + ' ' + loc.nom + '. ' + t('En ouvrir un maintenant ?'),
        function() { nouveauDossier(locId); }
      );
      return;
    }

    var statutColor = { ouvert:'var(--yellow)', en_cours:'var(--accent)', clos:'var(--text3)', gagne:'var(--green)', perdu:'var(--red)' };
    var html = '<h3 style="margin-bottom:14px;font-size:15px;font-weight:700">⚖️ ' + t('Dossiers juridiques') + ' — ' + esc(loc.nom) + '</h3>' +
      '<div style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto">' +
      dossiers.map(function(d) {
        var c = statutColor[d.statut] || 'var(--text3)';
        return '<div class="card" style="border-left:4px solid ' + c + '">' +
          '<div style="display:flex;justify-content:space-between">' +
          '<div>' +
          '<div style="font-weight:700;font-size:13px">' + esc(d.type_dossier.replace(/_/g,' ')) + '</div>' +
          '<div style="font-size:11px;color:var(--text3)">' + t('Ouvert le') + ' ' + window.IG.utils.formatDate(d.date_ouverture) + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
          '<div style="font-size:13px;font-weight:700;color:var(--red)">' + fmt(d.montant_reclame) + '</div>' +
          '<span style="font-size:10px;padding:2px 7px;border-radius:99px;background:' + c + '22;color:' + c + ';font-weight:600">' + esc(d.statut) + '</span>' +
          '</div></div></div>';
      }).join('') +
      '</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Fermer') + '</button>' +
      '<button onclick="this.closest(\'[style*=z-index]\').remove();window.IG.app.showPage(\'juridique\')" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">⚖️ ' + t('Voir dans LegalOS') + '</button>' +
      '</div>';
    window.IG.utils.showModal(html, { width: '440px' });
  }

  // ── GÉNÉRATION CONTRAT DE BAIL ─────────────────────────────────

  function _imprimerTexte(titre, texte) {
    var css = 'body{font-family:Georgia,serif;font-size:13px;padding:30px;color:#111;max-width:780px;margin:auto;line-height:1.7;white-space:pre-wrap}';
    var previewHtml =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">' +
      '<h3 style="font-size:15px;font-weight:700;margin:0">👁 ' + t('Aperçu') + ' — ' + esc(titre) + '</h3>' +
      '<div style="display:flex;gap:8px">' +
      '<button id="btn-contrat-imprimer" style="padding:8px 18px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:600;cursor:pointer">🖨️ ' + t('Imprimer') + ' / PDF</button>' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;cursor:pointer">✕ ' + t('Fermer') + '</button>' +
      '</div></div>' +
      '<div style="border:1px solid var(--border2);border-radius:8px;overflow:hidden">' +
      '<iframe id="contrat-iframe" style="width:100%;height:520px;border:none;background:#fff"></iframe>' +
      '</div>';

    var modal = window.IG.utils.showModal(previewHtml, { width: '800px' });
    var iframe = modal.box.querySelector('#contrat-iframe');
    var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (doc) {
      doc.open();
      doc.write('<html><head><style>' + css + '</style></head><body>' + esc(texte) + '</body></html>');
      doc.close();
    }
    var btn = modal.box.querySelector('#btn-contrat-imprimer');
    if (btn) btn.onclick = function() { iframe.contentWindow.print(); };
  }

  // Variables communes à tous les documents "locataire" (contrat, quittance,
  // résiliation, avenant...) — les templates ignorent celles qu'ils n'utilisent pas.
  function _variablesDocLocataire(loc, session) {
    var imm = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    var now = new Date();
    var vars = variablesAutoLocataire(loc, session);
    vars.nom_proprio  = imm ? (imm.nom_proprio || '') : '';
    vars.date_entree  = loc.entree ? window.IG.utils.formatDate(loc.entree) : '';
    vars.loyer        = fmt(loc.loyer || 0);
    vars.montant       = fmt(loc.loyer || 0);
    vars.caution       = fmt(loc.caution || 0);
    vars.mois          = now.toLocaleDateString('fr-FR', { month: 'long' });
    vars.annee         = String(now.getFullYear());
    vars.date_resiliation = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return vars;
  }

  async function genererDocumentPourLocataire(code, locId, titreDoc, extraVars) {
    var loc = window.IG.locataires ? window.IG.locataires.getById(locId) : null;
    if (!loc) return;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var template = await getTemplate(code, 'CM', 'fr');
    if (!template) { window.IG.utils.showToast(t('Modèle de document introuvable') + ' (' + code + ')', 'red'); return; }
    var vars = Object.assign(_variablesDocLocataire(loc, session), extraVars || {});
    var texte = genererDocument(template, vars);
    _imprimerTexte((titreDoc || template.titre) + ' — ' + loc.nom, texte);
  }

  function genererContratBail(locId)   { return genererDocumentPourLocataire('contrat_bail', locId, t('Contrat de bail')); }
  function genererQuittance(locId)     { return genererDocumentPourLocataire('quittance_loyer', locId, t('Quittance de loyer')); }
  function genererResiliation(locId)   { return genererDocumentPourLocataire('resiliation_bail', locId, t('Résiliation de bail')); }
  function genererAvenant(locId)       { return genererDocumentPourLocataire('avenant_bail', locId, t('Avenant au contrat')); }

  return {
    isActive, getDossiers, creerDossier, cloturerDossier,
    getTimeline, ajouterAction,
    getTemplates, getTemplate, genererDocument, variablesAutoLocataire,
    prochainEtape, analyseIA,
    calculerScore, scoreBadge,
    emit, renderPage, nouveauDossier, voirDossierLocataire,
    genererDocumentPourLocataire,
    genererContratBail, genererQuittance, genererResiliation, genererAvenant
  };

})();
