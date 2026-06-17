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
  function isActive() {
    var session = window.IG.auth ? window.IG.auth.getSession() : null;
    if (!session) return false;
    var features = session.features || {};
    return features.legalos === true;
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

  async function creerDossier(locataireId, type, montant) {
    try {
      var result = await db().insert('dossiers_juridiques', {
        locataire_id:     locataireId,
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
    var impayes = fiche.filter(function(l) { return l.statut !== 'Payé'; });
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
    var total = fiche.length;
    var payes = fiche.filter(function(l) { return l.statut === 'Payé'; }).length;
    if (!total) return 100;
    var taux = payes / total;
    var score = Math.round(taux * 100);
    // Pénalité si retards actuels
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
        html += '<div class="card" style="border-left:4px solid ' + statutColor + '">' +
          '<div style="display:flex;justify-content:space-between">' +
          '<div>' +
          '<div style="font-weight:700;font-size:14px">' + esc(d.type_dossier.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();})) + '</div>' +
          '<div style="font-size:12px;color:var(--text3)">Ouvert le ' + window.IG.utils.formatDate(d.date_ouverture) + '</div>' +
          '</div>' +
          '<div style="text-align:right">' +
          '<div style="font-size:15px;font-weight:700;color:var(--red)">' + fmt(d.montant_reclame) + '</div>' +
          '<span style="font-size:11px;padding:2px 8px;border-radius:99px;background:' + statutColor + '22;color:' + statutColor + ';font-weight:600">' + d.statut + '</span>' +
          '</div></div></div>';
      });
      html += '</div>';
    }
    html += '</div>';
    content.innerHTML = html;
  }

  function nouveauDossier() {
    var modal = window.IG.utils.showModal(
      '<h3 style="margin-bottom:16px;font-size:15px;font-weight:700">⚖️ Nouveau dossier juridique</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Locataire</label>' +
      '<input id="legal-loc" list="legal-loc-list" placeholder="Nom du locataire" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '</div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Type de dossier</label>' +
      '<select id="legal-type" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '<option value="loyers_impayes">Loyers impayés</option>' +
      '<option value="expulsion">Expulsion</option>' +
      '<option value="degradations">Dégradations</option>' +
      '<option value="recouvrement">Recouvrement</option>' +
      '<option value="mediation">Médiation</option>' +
      '<option value="autre">Autre</option>' +
      '</select></div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Montant réclamé (FCFA)</label>' +
      '<input id="legal-montant" type="number" placeholder="0" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="legal-save" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Ouvrir le dossier</button>' +
      '</div></div>'
    );
    modal.box.querySelector('#legal-save').addEventListener('click', async function() {
      var type = modal.box.querySelector('#legal-type').value;
      var montant = parseFloat(modal.box.querySelector('#legal-montant').value) || 0;
      modal.close();
      await creerDossier(null, type, montant);
      window.IG.utils.showToast('Dossier juridique ouvert', 'green');
      renderPage();
    });
  }

  return {
    isActive, getDossiers, creerDossier, cloturerDossier,
    getTimeline, ajouterAction,
    getTemplates, getTemplate, genererDocument, variablesAutoLocataire,
    prochainEtape, analyseIA,
    calculerScore, scoreBadge,
    emit, renderPage, nouveauDossier
  };

})();
