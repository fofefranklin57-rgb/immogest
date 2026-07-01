// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Centre de messages WhatsApp
//  Tous les templates wa.me centralisés en un endroit
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.messagesWA = (function() {

  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── Helpers ──────────────────────────────────────────────────

  function _session() {
    return window.IG.auth ? window.IG.auth.getSession() : {};
  }

  function _cabinet() {
    var s = _session();
    return s.nomCabinet || s.nom || 'ImmoGest';
  }

  function _lienWA(tel, msg) {
    if (!tel) return null;
    var t = tel.replace(/[^0-9+]/g, '');
    if (!t) return null;
    return 'https://wa.me/' + t + '?text=' + encodeURIComponent(msg);
  }

  function _ouvrirWA(tel, msg) {
    var lien = _lienWA(tel, msg);
    if (!lien) { window.IG.utils.showToast('Numéro manquant', 'orange'); return; }
    window.open(lien, '_blank');
  }

  // ── Templates de messages ─────────────────────────────────────

  var TEMPLATES = {

    rappel_loyer: function(loc, imm) {
      var cab = _cabinet();
      var loyer = fmt(parseFloat(loc.loyer) || 0);
      var now = new Date();
      var moisNom = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return 'Bonjour ' + (loc.prenom || loc.nom.split(' ')[0]) + ',\n\n' +
        'Nous vous rappelons que votre loyer de ' + loyer + ' pour le mois de *' + moisNom + '* ' +
        'n\'a pas encore été reçu.\n\n' +
        (imm ? '📍 ' + (imm.nom_immeuble || imm.nom) + ' — Local ' + (loc.appt || '?') + '\n\n' : '') +
        'Merci de régulariser dès que possible.\n\n— ' + cab;
    },

    recu_paiement: function(loc, paiement, imm) {
      var cab = _cabinet();
      var montant = fmt(parseFloat(paiement.montant) || 0);
      var date = paiement.date_paiement
        ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR')
        : new Date().toLocaleDateString('fr-FR');
      var mode = paiement.mode_paiement || 'espèces';
      var moisNoms = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      var periode = paiement.mois ? moisNoms[(parseInt(paiement.mois) - 1)] + ' ' + (paiement.annee || '') : '';
      return '✅ *Reçu de paiement*\n\n' +
        'Locataire : ' + loc.nom + '\n' +
        (imm ? 'Immeuble : ' + (imm.nom_immeuble || imm.nom) + ' — Local ' + (loc.appt || '?') + '\n' : '') +
        'Montant : *' + montant + '*\n' +
        (periode ? 'Période : ' + periode + '\n' : '') +
        'Mode : ' + mode + '\n' +
        'Date : ' + date + '\n\n' +
        'Merci pour votre paiement.\n— ' + cab;
    },

    mise_en_demeure: function(loc, moisRetard, montantDu, imm) {
      var cab = _cabinet();
      return '⚠️ *Mise en demeure*\n\n' +
        'Monsieur / Madame ' + loc.nom + ',\n\n' +
        'Malgré nos relances, nous constatons un retard de *' + moisRetard + ' mois* ' +
        'de loyer impayé, représentant un montant de *' + fmt(montantDu) + '*.\n\n' +
        (imm ? '📍 ' + (imm.nom_immeuble || imm.nom) + ' — Local ' + (loc.appt || '?') + '\n\n' : '') +
        'Sans régularisation dans un délai de *8 jours*, nous serons contraints ' +
        'd\'engager les procédures légales prévues par le bail.\n\n' +
        '— ' + cab;
    },

    rapport_bailleur: function(imm, locs, paiements) {
      var cab = _cabinet();
      var now = new Date();
      var mois = now.getMonth() + 1;
      var annee = now.getFullYear();
      var moisNom = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

      var locsActifs = locs.filter(function(l) { return l.statut !== 'libre'; });
      var pays = paiements.filter(function(p) {
        return parseInt(p.mois) === mois && parseInt(p.annee) === annee &&
          locsActifs.some(function(l) { return l.id == p.locataire_id; });
      });

      var totalAttendu = locsActifs.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
      var totalEnc = pays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
      var impayesLocs = locsActifs.filter(function(l) {
        return !pays.some(function(p) { return p.locataire_id == l.id; });
      });

      var lignesImp = impayesLocs.length
        ? impayesLocs.map(function(l) { return '  • ' + l.nom + ' (' + fmt(l.loyer) + ')'; }).join('\n')
        : '  Aucun impayé ce mois ✅';

      return '📊 *Rapport ' + moisNom + '*\n' +
        (imm.nom_immeuble || imm.nom) + '\n\n' +
        '👥 Locataires actifs : ' + locsActifs.length + '\n' +
        '💰 Loyers attendus : *' + fmt(totalAttendu) + '*\n' +
        '✅ Encaissé : *' + fmt(totalEnc) + '*\n' +
        '⚠️ Non reçu : *' + fmt(Math.max(0, totalAttendu - totalEnc)) + '*\n\n' +
        'Impayés :\n' + lignesImp + '\n\n' +
        '— ' + cab;
    },

    invitation_locataire: function(loc, code, appUrl) {
      var cab = _cabinet();
      return '🏠 *Invitation ImmoGest*\n\n' +
        'Bonjour ' + (loc.prenom || loc.nom.split(' ')[0]) + ',\n\n' +
        cab + ' vous invite à accéder à votre espace locataire ImmoGest ' +
        'pour consulter vos reçus et votre historique de paiements.\n\n' +
        '🔗 Lien : ' + (appUrl || 'https://immogest-34w.pages.dev') + '\n' +
        '🔑 Code d\'invitation : *' + code + '*\n\n' +
        'Suivez les étapes pour créer votre accès.\n— ' + cab;
    },

    invitation_bailleur: function(imm, code, appUrl) {
      var cab = _cabinet();
      return '🏢 *Accès propriétaire — ImmoGest*\n\n' +
        'Bonjour ' + (imm.nom_proprio || 'Propriétaire') + ',\n\n' +
        cab + ' vous invite à suivre la gestion de votre immeuble ' +
        '*' + (imm.nom_immeuble || imm.nom) + '* en temps réel sur ImmoGest.\n\n' +
        'Consultez les paiements, les locataires et les rapports directement depuis votre téléphone.\n\n' +
        '🔗 Lien : ' + (appUrl || 'https://immogest-34w.pages.dev') + '\n' +
        '🔑 Code d\'invitation : *' + code + '*\n\n' +
        '— ' + cab;
    }
  };

  // ── Rendu principal ───────────────────────────────────────────

  function renderPage(data) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var html = '<div class="content">' +
      '<h2 style="font-size:17px;font-weight:700;margin-bottom:20px">📱 Messages WhatsApp</h2>' +
      // Tabs
      '<div style="display:flex;gap:0;margin-bottom:0;overflow-x:auto;white-space:nowrap" id="wa-tabs">' +
      _tab('rappels',    '🔔', 'Rappels loyer', true) +
      _tab('recus',      '✅', 'Reçus') +
      _tab('relances',   '⚠️', 'Relances') +
      _tab('rapports',   '📊', 'Rapports bailleur') +
      _tab('invitations','📨', 'Invitations') +
      '</div>' +
      '<div id="wa-tab-body" style="border:1px solid var(--border);border-radius:0 8px 8px 8px;padding:16px;background:var(--bg2)">' +
      '</div></div>';

    content.innerHTML = html;
    _renderTab('rappels', data);
  }

  function _tab(id, icon, label, active) {
    var s = active
      ? 'background:var(--accent);color:#fff'
      : 'background:var(--bg3);color:var(--text2)';
    return '<button onclick="window.IG.messagesWA.switchTab(\'' + id + '\')" id="wa-tab-' + id + '" ' +
      'style="padding:9px 16px;border:none;cursor:pointer;font-size:13px;font-weight:600;border-radius:8px 8px 0 0;' + s + '">' +
      icon + ' ' + label + '</button>';
  }

  function switchTab(id) {
    // Reset tous les tabs
    ['rappels','recus','relances','rapports','invitations'].forEach(function(t) {
      var el = document.getElementById('wa-tab-' + t);
      if (el) { el.style.background = 'var(--bg3)'; el.style.color = 'var(--text2)'; }
    });
    var active = document.getElementById('wa-tab-' + id);
    if (active) { active.style.background = 'var(--accent)'; active.style.color = '#fff'; }

    // Récupérer les données depuis app
    var data = window.IG.app ? window.IG.app.getData() : { immeubles: [], locataires: [], paiements: [] };
    _renderTab(id, data);
  }

  function _renderTab(id, data) {
    var body = document.getElementById('wa-tab-body');
    if (!body) return;
    var locs = data.locataires || [];
    var imms = data.immeubles || [];
    var pays = data.paiements || [];

    switch(id) {
      case 'rappels':   body.innerHTML = _tabRappels(locs, imms, pays);   break;
      case 'recus':     body.innerHTML = _tabRecus(locs, imms, pays);     break;
      case 'relances':  body.innerHTML = _tabRelances(locs, imms, pays);  break;
      case 'rapports':  body.innerHTML = _tabRapports(locs, imms, pays);  break;
      case 'invitations': body.innerHTML = _tabInvitations(locs, imms);   break;
    }
  }

  // ── Tab : Rappels loyer ───────────────────────────────────────

  function _tabRappels(locs, imms, pays) {
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();

    // Locataires actifs qui n'ont PAS encore payé ce mois
    var payesIds = pays
      .filter(function(p) { return parseInt(p.mois) === mois && parseInt(p.annee) === annee && (p.type === 'loyer' || !p.type); })
      .map(function(p) { return p.locataire_id; });

    var cibles = locs.filter(function(l) {
      return l.statut !== 'libre' && l.telephone && !payesIds.includes(l.id);
    });

    if (!cibles.length) {
      return '<div style="text-align:center;padding:40px;color:var(--text3)">🎉 Tous les locataires ont payé ce mois !</div>';
    }

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
      '<div style="font-size:13px;color:var(--text2)">' + cibles.length + ' locataire(s) sans paiement ce mois</div>' +
      '<button onclick="window.IG.messagesWA.envoyerTousRappels()" ' +
        'style="padding:8px 16px;border-radius:8px;border:none;background:#25D366;color:#fff;font-size:12px;font-weight:700;cursor:pointer">' +
        '📱 Envoyer à tous</button></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px">';

    cibles.forEach(function(l) {
      var imm = imms.find(function(i) { return i.id == l.immeuble_id; });
      var msg = TEMPLATES.rappel_loyer(l, imm);
      html += _ligneMsg(l, imm, msg,
        'Rappel loyer · ' + fmt(l.loyer),
        window.IG.utils.formatDate ? window.IG.utils.formatDate(l.entree) : '');
    });

    return html + '</div>';
  }

  // ── Tab : Reçus ───────────────────────────────────────────────

  function _tabRecus(locs, imms, pays) {
    var recents = pays.slice().sort(function(a, b) {
      return new Date(b.date_paiement) - new Date(a.date_paiement);
    }).slice(0, 30);

    if (!recents.length) {
      return '<div style="text-align:center;padding:40px;color:var(--text3)">Aucun paiement enregistré</div>';
    }

    var html = '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">30 derniers paiements — cliquez sur un locataire pour envoyer son reçu</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';

    recents.forEach(function(p) {
      var l = locs.find(function(x) { return x.id == p.locataire_id; });
      if (!l) return;
      var imm = imms.find(function(i) { return i.id == l.immeuble_id; });
      var msg = TEMPLATES.recu_paiement(l, p, imm);
      html += _ligneMsg(l, imm, msg,
        'Reçu · ' + fmt(p.montant),
        p.date_paiement ? new Date(p.date_paiement).toLocaleDateString('fr-FR') : '');
    });

    return html + '</div>';
  }

  // ── Tab : Relances ────────────────────────────────────────────

  function _tabRelances(locs, imms, pays) {
    var enRetard = locs
      .filter(function(l) { return l.statut !== 'libre' && l.telephone && (parseInt(l.mois_arrieres) || 0) > 0; })
      .sort(function(a, b) { return (parseInt(b.mois_arrieres) || 0) - (parseInt(a.mois_arrieres) || 0); });

    if (!enRetard.length) {
      return '<div style="text-align:center;padding:40px;color:var(--text3)">🎉 Aucun locataire en retard</div>';
    }

    var html = '<div style="display:flex;flex-direction:column;gap:8px">';

    enRetard.forEach(function(l) {
      var imm = imms.find(function(i) { return i.id == l.immeuble_id; });
      var moisR = parseInt(l.mois_arrieres) || 0;
      var montantDu = (parseFloat(l.arrieres) || 0) || moisR * (parseFloat(l.loyer) || 0);
      var niveauLabel = moisR === 1 ? '🟡 Relance' : moisR === 2 ? '🟠 Mise en demeure' : '🔴 Commandement';
      var msg = moisR >= 2
        ? TEMPLATES.mise_en_demeure(l, moisR, montantDu, imm)
        : TEMPLATES.rappel_loyer(l, imm);
      html += _ligneMsg(l, imm, msg,
        niveauLabel + ' · ' + moisR + ' mois · ' + fmt(montantDu),
        '');
    });

    return html + '</div>';
  }

  // ── Tab : Rapports bailleur ───────────────────────────────────

  function _tabRapports(locs, imms, pays) {
    if (!imms.length) {
      return '<div style="text-align:center;padding:40px;color:var(--text3)">Aucun immeuble</div>';
    }

    var html = '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">Envoyer le rapport mensuel au propriétaire de chaque immeuble</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';

    imms.forEach(function(imm) {
      if (!imm.tel_proprio) return;
      var locsImm = locs.filter(function(l) { return l.immeuble_id == imm.id; });
      var msg = TEMPLATES.rapport_bailleur(imm, locsImm, pays);
      var nom = esc(imm.nom_proprio || 'Propriétaire');
      var tel = imm.tel_proprio;

      html += '<div class="card" style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px">' +
        '<div>' +
        '<div style="font-weight:700;font-size:13px">' + esc(imm.nom_immeuble || imm.nom) + '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:2px">Propriétaire : ' + nom + ' · ' + esc(tel) + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
        _btnPreview(msg) +
        '<a href="' + (_lienWA(tel, msg) || '#') + '" target="_blank" ' +
          'style="padding:7px 14px;border-radius:8px;background:#25D366;color:#fff;font-size:12px;font-weight:700;text-decoration:none;white-space:nowrap">' +
          '📱 Envoyer</a>' +
        '</div></div>';
    });

    // Immeubles sans tel propriétaire
    var sansTel = imms.filter(function(i) { return !i.tel_proprio; });
    if (sansTel.length) {
      html += '<div style="font-size:12px;color:var(--text3);margin-top:8px">⚠️ ' + sansTel.length + ' immeuble(s) sans numéro propriétaire : ' +
        sansTel.map(function(i) { return esc(i.nom_immeuble || i.nom); }).join(', ') + '</div>';
    }

    return html + '</div>';
  }

  // ── Tab : Invitations ─────────────────────────────────────────

  function _tabInvitations(locs, imms) {
    var appUrl = 'https://immogest-34w.pages.dev';
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px">' +

      // Card locataire
      '<div class="card" style="padding:16px">' +
      '<div style="font-size:22px;margin-bottom:8px">👤</div>' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:4px">Locataire</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">Envoyer l\'accès à un locataire existant</div>' +
      '<select id="inv-loc-sel" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:12px;color:var(--text);margin-bottom:10px">' +
      '<option value="">Choisir un locataire...</option>' +
      locs.filter(function(l) { return l.telephone; }).map(function(l) {
        return '<option value="' + l.id + '">' + esc(l.nom) + '</option>';
      }).join('') +
      '</select>' +
      '<input id="inv-loc-code" placeholder="Code invitation (ex: IMMO2024)" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:12px;color:var(--text);margin-bottom:10px">' +
      '<button onclick="window.IG.messagesWA.envoyerInvLoc(\'' + appUrl + '\')" ' +
        'style="width:100%;padding:9px;border-radius:8px;border:none;background:#25D366;color:#fff;font-size:12px;font-weight:700;cursor:pointer">📱 Envoyer invitation</button>' +
      '</div>' +

      // Card bailleur
      '<div class="card" style="padding:16px">' +
      '<div style="font-size:22px;margin-bottom:8px">🏢</div>' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:4px">Bailleur / Propriétaire</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">Envoyer l\'accès bailleur pour un immeuble</div>' +
      '<select id="inv-imm-sel" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:12px;color:var(--text);margin-bottom:10px">' +
      '<option value="">Choisir un immeuble...</option>' +
      imms.filter(function(i) { return i.tel_proprio; }).map(function(i) {
        return '<option value="' + i.id + '">' + esc(i.nom_immeuble || i.nom) + ' (' + esc(i.nom_proprio || '?') + ')</option>';
      }).join('') +
      '</select>' +
      '<input id="inv-imm-code" placeholder="Code invitation (ex: BAILxx)" style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:12px;color:var(--text);margin-bottom:10px">' +
      '<button onclick="window.IG.messagesWA.envoyerInvImm(\'' + appUrl + '\')" ' +
        'style="width:100%;padding:9px;border-radius:8px;border:none;background:#25D366;color:#fff;font-size:12px;font-weight:700;cursor:pointer">📱 Envoyer invitation</button>' +
      '</div></div>';

    return html;
  }

  // ── Helpers UI ────────────────────────────────────────────────

  function _ligneMsg(loc, imm, msg, sousTitre, date) {
    var tel = loc.telephone;
    return '<div class="card" style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px">' +
      '<div style="min-width:0">' +
      '<div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(loc.nom) + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:2px">' +
      (imm ? esc(imm.nom_immeuble || imm.nom) + ' · ' : '') +
      esc(sousTitre) +
      (date ? ' · ' + date : '') +
      '</div></div>' +
      '<div style="display:flex;gap:8px;flex-shrink:0">' +
      _btnPreview(msg) +
      (tel ?
        '<a href="' + _lienWA(tel, msg) + '" target="_blank" ' +
          'style="padding:7px 14px;border-radius:8px;background:#25D366;color:#fff;font-size:12px;font-weight:700;text-decoration:none">📱</a>'
        : '<span style="font-size:11px;color:var(--text3)">Pas de tel</span>') +
      '</div></div>';
  }

  function _btnPreview(msg) {
    var safe = msg.replace(/'/g, "\\'").replace(/\n/g, '\\n');
    return '<button onclick="window.IG.messagesWA.previewMsg(\'' + safe + '\')" ' +
      'style="padding:7px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">👁️</button>';
  }

  function previewMsg(msg) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:920;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML =
      '<div style="background:var(--bg);border-radius:14px;padding:20px;max-width:400px;width:90%;max-height:80vh;overflow-y:auto">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<div style="font-weight:700;font-size:14px">📱 Aperçu WhatsApp</div>' +
      '<button onclick="this.closest(\'[style*=inset]\').remove()" style="border:none;background:none;font-size:20px;cursor:pointer;color:var(--text2)">✕</button>' +
      '</div>' +
      '<div style="background:#e9fbe0;border-radius:12px;padding:14px;font-size:13px;line-height:1.6;white-space:pre-wrap;font-family:inherit;color:#111">' +
      esc(msg) +
      '</div></div>';
    document.body.appendChild(overlay);
  }

  // ── Actions globales ──────────────────────────────────────────

  function envoyerTousRappels() {
    var data = window.IG.app ? window.IG.app.getData() : { immeubles: [], locataires: [], paiements: [] };
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();
    var payesIds = (data.paiements || [])
      .filter(function(p) { return parseInt(p.mois) === mois && parseInt(p.annee) === annee; })
      .map(function(p) { return p.locataire_id; });
    var cibles = (data.locataires || []).filter(function(l) {
      return l.statut !== 'libre' && l.telephone && !payesIds.includes(l.id);
    });
    if (!cibles.length) { window.IG.utils.showToast('Tous les locataires ont payé', 'green'); return; }
    var count = 0;
    cibles.forEach(function(l) {
      var imm = (data.immeubles || []).find(function(i) { return i.id == l.immeuble_id; });
      var msg = TEMPLATES.rappel_loyer(l, imm);
      setTimeout(function() { window.open(_lienWA(l.telephone, msg), '_blank'); }, count++ * 900);
    });
    window.IG.utils.showToast(count + ' rappels WhatsApp ouverts', 'green');
  }

  function envoyerInvLoc(appUrl) {
    var sel = document.getElementById('inv-loc-sel');
    var codeEl = document.getElementById('inv-loc-code');
    var locId = sel ? sel.value : '';
    var code = codeEl ? codeEl.value.trim() : '';
    if (!locId) { window.IG.utils.showToast('Choisir un locataire', 'orange'); return; }
    if (!code) { window.IG.utils.showToast('Entrer un code invitation', 'orange'); return; }
    var data = window.IG.app ? window.IG.app.getData() : { locataires: [] };
    var loc = (data.locataires || []).find(function(l) { return String(l.id) === String(locId); });
    if (!loc || !loc.telephone) { window.IG.utils.showToast('Locataire sans numéro', 'orange'); return; }
    var msg = TEMPLATES.invitation_locataire(loc, code, appUrl);
    _ouvrirWA(loc.telephone, msg);
  }

  function envoyerInvImm(appUrl) {
    var sel = document.getElementById('inv-imm-sel');
    var codeEl = document.getElementById('inv-imm-code');
    var immId = sel ? sel.value : '';
    var code = codeEl ? codeEl.value.trim() : '';
    if (!immId) { window.IG.utils.showToast('Choisir un immeuble', 'orange'); return; }
    if (!code) { window.IG.utils.showToast('Entrer un code invitation', 'orange'); return; }
    var data = window.IG.app ? window.IG.app.getData() : { immeubles: [] };
    var imm = (data.immeubles || []).find(function(i) { return String(i.id) === String(immId); });
    if (!imm || !imm.tel_proprio) { window.IG.utils.showToast('Immeuble sans numéro propriétaire', 'orange'); return; }
    var msg = TEMPLATES.invitation_bailleur(imm, code, appUrl);
    _ouvrirWA(imm.tel_proprio, msg);
  }

  return { renderPage, switchTab, previewMsg, envoyerTousRappels, envoyerInvLoc, envoyerInvImm, TEMPLATES };

})();
