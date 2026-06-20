// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Locataires
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.locataires = (function() {

  var _cache = [];

  function t(k)   { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function toast(msg, type) { window.IG.utils.showToast(msg, type); }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── CRUD ─────────────────────────────────────────────────────
  async function charger(filters) {
    try {
      _cache = await window.IG.db.select('locataires', filters || null);
      return _cache;
    } catch(e) {
      toast(t('Erreur chargement locataires'), 'red');
      return [];
    }
  }

  function getCache()    { return _cache; }
  function getById(id)   { return _cache.find(function(l) { return String(l.id) === String(id); }) || null; }
  function getByImmeuble(immId) { return _cache.filter(function(l) { return l.immeuble_id == immId; }); }

  async function sauvegarder(loc) {
    if (!loc.id) loc.id = window.IG.utils.uid();
    var result = await window.IG.db.upsert('locataires', [loc]);
    var idx = _cache.findIndex(function(l) { return l.id == loc.id; });
    if (idx >= 0) _cache[idx] = loc; else _cache.push(loc);
    return result;
  }

  async function liberer(id, motif) {
    var loc = getById(id);
    if (!loc) return;
    // Archiver d'abord
    try {
      await window.IG.db.insert('archives', [{
        locataire_id: loc.id,
        nom:          loc.nom,
        telephone:    loc.telephone,
        immeuble_id:  loc.immeuble_id,
        immeuble_nom: _nomImmeuble(loc.immeuble_id),
        local_num:    loc.appt,
        loyer:        loc.loyer,
        date_entree:  loc.entree || null,
        date_sortie:  new Date().toISOString().split('T')[0],
        motif:        motif || 'depart_volontaire',
        note:         loc.observations || ''
      }]);
    } catch(_) {}
    await window.IG.db.remove('locataires', id);
    _cache = _cache.filter(function(l) { return l.id != id; });
    toast(t('Locataire libéré et archivé'), 'green');
  }

  async function supprimer(id) {
    var loc = getById(id);
    if (!loc) return;
    // Mettre en corbeille
    try {
      await window.IG.db.insert('corbeille', [{
        locataire_id:  id,
        locataire_data: loc,
        paiements_data: []
      }]);
    } catch(_) {}
    await window.IG.db.remove('locataires', id);
    _cache = _cache.filter(function(l) { return l.id != id; });
    toast(t('Locataire supprimé'), 'orange');
  }

  function _nomImmeuble(id) {
    var imm = window.IG.immeubles ? window.IG.immeubles.getById(id) : null;
    return imm ? (imm.nom_immeuble || imm.nom) : '';
  }

  // ── Rendu liste ───────────────────────────────────────────────
  function renderListe(paiements, immeubleId) {
    var container = document.getElementById('locataires-liste');
    if (!container) return;

    var liste = immeubleId
      ? _cache.filter(function(l) { return l.immeuble_id == immeubleId; })
      : _cache;

    if (!liste.length) {
      container.innerHTML = '<div class="empty-state" style="text-align:center;padding:60px 20px;color:var(--text3)">' +
        '<div style="font-size:48px;margin-bottom:16px">👤</div>' +
        '<p style="font-size:16px;font-weight:600;margin-bottom:8px">' + t('Aucun locataire') + '</p>' +
        '<p style="font-size:13px">' + t('Ajoutez votre premier locataire') + '</p></div>';
      return;
    }

    // Trier : Duplex → Appartement → Studio → Chambre → autres, puis par numéro
    var _ordreType = { 'd': 0, 'a': 1, 's': 2, 'c': 3 };
    liste = liste.slice().sort(function(a, b) {
      var pa = (a.appt || '').toLowerCase();
      var pb = (b.appt || '').toLowerCase();
      var oa = _ordreType[pa[0]] !== undefined ? _ordreType[pa[0]] : 9;
      var ob = _ordreType[pb[0]] !== undefined ? _ordreType[pb[0]] : 9;
      if (oa !== ob) return oa - ob;
      var na = parseInt((pa.match(/\d+/) || [0])[0]);
      var nb = parseInt((pb.match(/\d+/) || [0])[0]);
      return na - nb;
    });

    // Filtrer par recherche
    var q = (document.getElementById('loc-search') && document.getElementById('loc-search').value || '').toLowerCase();
    if (q) liste = liste.filter(function(l) {
      return (l.nom || '').toLowerCase().includes(q) ||
             (l.appt || '').toLowerCase().includes(q) ||
             (l.telephone || '').includes(q);
    });

    var html = '<div class="table-wrap"><table class="tbl">' +
      '<thead><tr>' +
      '<th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th>' +
      '<th>Observations</th><th>Statut</th><th>Reste dû</th><th>Actions</th>' +
      '</tr></thead><tbody>';

    liste.forEach(function(loc) {
      var statut = _statutBadge(loc, paiements);
      var reste = _resteCalc(loc, paiements);
      var resteHtml = reste > 0
        ? '<span class="td-amount red">' + fmt(reste) + '</span>'
        : reste < 0
          ? '<span class="td-amount" style="color:var(--green)">+' + fmt(Math.abs(reste)) + '</span>'
          : '–';
      var obs = esc(loc.observations || '');
      var alerte = _alerteLabel(loc, paiements);
      var obsHtml = obs ? '<span style="color:var(--text3);font-size:11px">' + obs + '</span>' : '';
      if (alerte) obsHtml += (obsHtml ? '<br>' : '') + alerte;
      if (reste > 0 && loc.loyer > 0) { var mDus = Math.floor(reste / loc.loyer); if (mDus >= 1) obsHtml += '<br><span style="font-size:10px;color:var(--red)">' + mDus + ' mois dus</span>'; }

      var isFree = loc.statut === 'libre';
      html += '<tr id="loc-row-' + loc.id + '" class="' + (isFree ? 'row-libre' : '') + '">' +
        '<td>' + _localBadge(loc.appt) + '</td>' +
        '<td class="td-name">' + esc(loc.nom) + '</td>' +
        '<td style="font-size:12px">' + esc(loc.telephone || '–') + '</td>' +
        '<td class="td-amount">' + fmt(loc.loyer) + '</td>' +
        '<td style="font-size:11px;max-width:180px">' + obsHtml + '</td>' +
        '<td>' + statut + '</td>' +
        '<td>' + resteHtml + '</td>' +
        '<td style="white-space:nowrap">' +
        '<div class="action-menu">' +
        '<button class="action-menu-btn" onclick="window.IG.locataires._toggleMenu(this)">···</button>' +
        '<div class="action-dropdown">' +
        '<div class="action-dropdown-item" onclick="window.IG.paiements.afficherFormulaire(' + loc.id + ');window.IG.locataires._closeMenus()">💳 Paiement</div>' +
        '<div class="action-dropdown-item" onclick="window.IG.locataires.afficherFormulaire(' + loc.id + ');window.IG.locataires._closeMenus()">📝 Modifier</div>' +
        '<div class="action-dropdown-item" onclick="window.IG.locataires.afficherFiche(' + loc.id + ');window.IG.locataires._closeMenus()">📊 Fiche de suivi</div>' +
        (loc.telephone ? '<div class="action-dropdown-item" onclick="window.IG.locataires.envoyerAccesWA(' + loc.id + ');window.IG.locataires._closeMenus()">📲 Envoyer accès WhatsApp</div>' : '') +
        '<div class="action-dropdown-item" onclick="window.IG.juridique && window.IG.juridique.genererDocument(' + loc.id + ');window.IG.locataires._closeMenus()">📄 Documents</div>' +
        '<div class="action-dropdown-sep"></div>' +
        '<div class="action-dropdown-item danger" onclick="window.IG.locataires.liberer(' + loc.id + ');window.IG.locataires._closeMenus()">🔓 Libérer</div>' +
        '<div class="action-dropdown-item danger" onclick="window.IG.locataires.supprimer(' + loc.id + ');window.IG.locataires._closeMenus()">🗑️ Supprimer</div>' +
        '</div></div></td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  function _statutBadge(loc, paiements) {
    var pays = (paiements || []).filter(function(p) { return p.locataire_id == loc.id; });
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();
    var paye = pays.some(function(p) {
      return parseInt(p.mois) === mois && parseInt(p.annee) === annee;
    });
    if (loc.statut === 'libre') return '<span style="background:var(--bg3);color:var(--text3);padding:3px 8px;border-radius:99px;font-size:11px;font-weight:600">' + t('Libre') + '</span>';
    if (paye) return '<span style="background:var(--green-bg);color:var(--green);padding:3px 8px;border-radius:99px;font-size:11px;font-weight:600">✓ ' + t('À jour') + '</span>';
    return '<span style="background:var(--red-bg);color:var(--red);padding:3px 8px;border-radius:99px;font-size:11px;font-weight:600">⚠ ' + t('Impayé') + '</span>';
  }

  // ── Formulaire ajout/édition ──────────────────────────────────
  function afficherFormulaire(id) {
    if (window.IG.plans && window.IG.plans.estEnModeRetro()) {
      window.IG.utils.showToast(t('Accès limité — upgradez votre plan pour modifier les données'), 'red');
      setTimeout(function() { window.IG.plans.afficherUpgrade(); }, 800);
      return;
    }
    var loc = id ? getById(id) : null;
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var titre = loc ? t('Modifier locataire') : t('Ajouter un locataire');

    var immOptions = imms.map(function(i) {
      var sel = loc && loc.immeuble_id == i.id ? ' selected' : '';
      return '<option value="' + i.id + '"' + sel + '>' + esc(i.nom_immeuble || i.nom) + '</option>';
    }).join('');

    var html = '<h3 style="margin-bottom:18px;font-size:16px">' + titre + '</h3>' +
      '<form id="form-locataire">' +
      _field('nom', t('Nom complet'), loc ? loc.nom : '', true) +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _field('telephone', t('Téléphone'), loc ? (loc.telephone || '') : '', false, 'tel') +
      _field('whatsapp', 'WhatsApp', loc ? (loc.whatsapp || '') : '', false, 'tel') +
      '</div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Immeuble') + ' *</label>' +
      '<select name="immeuble_id" required style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<option value="">' + t('Sélectionner...') + '</option>' + immOptions + '</select></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _field('appt', t('Local / Appt'), loc ? (loc.appt || '') : '') +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Type') + '</label>' +
      '<select name="type_local" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      ['appartement','studio','chambre','duplex','bureau','commerce'].map(function(tp) {
        return '<option value="' + tp + '"' + (loc && loc.type_local === tp ? ' selected' : '') + '>' + tp + '</option>';
      }).join('') + '</select></div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _fieldNum('loyer', t('Loyer mensuel (FCFA)'), loc ? (loc.loyer || 0) : 0) +
      _fieldNum('caution', t('Caution'), loc ? (loc.caution || 0) : 0) +
      '</div>' +
      _field('entree', t('Date entrée'), loc ? (loc.entree || '') : '', false, 'date') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Arriérés antérieurs (FCFA)') + '</label>' +
      '<input type="number" name="arrieres" id="ig-arrieres-montant" value="' + (loc ? (loc.arrieres || 0) : 0) + '" min="0" step="500"' +
      ' oninput="(function(el){var l=parseFloat(document.querySelector(\'[name=loyer]\').value)||0;var m=document.getElementById(\'ig-arrieres-mois\');if(l>0&&m)m.value=Math.round((parseFloat(el.value)||0)/l);})(this)"' +
      ' style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Nb mois arriérés') + '</label>' +
      '<input type="number" name="mois_arrieres" id="ig-arrieres-mois" value="' + (loc ? (loc.mois_arrieres || 0) : 0) + '" min="0" step="1"' +
      ' oninput="(function(el){var l=parseFloat(document.querySelector(\'[name=loyer]\').value)||0;var m=document.getElementById(\'ig-arrieres-montant\');if(l>0&&m)m.value=(parseInt(el.value)||0)*l;})(this)"' +
      ' style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '</div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Observations') + '</label>' +
      '<textarea name="observations" rows="2" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);resize:vertical">' + esc(loc ? (loc.observations || '') : '') + '</textarea></div>' +
      '<div id="ig-ad-loc-form" style="margin:14px 0 10px;text-align:center"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">' +
      (loc ? '<button type="button" onclick="window.IG.locataires._libererConfirm(' + (loc.id) + ')" data-modal-close style="padding:10px 16px;border-radius:8px;border:1px solid #B93020;color:#B93020;background:transparent;cursor:pointer;font-size:12px">' + t('Libérer') + '</button>' : '') +
      '<button type="button" data-modal-close class="btn-secondary" style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer">' + t('Annuler') + '</button>' +
      '<button type="submit" style="padding:10px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">' + t('Sauvegarder') + '</button>' +
      '</div></form>';

    // Vérification limite plan avant d'ouvrir (création seulement)
    if (!id && window.IG.plans) {
      var errPlan = window.IG.plans.verifierLocataire();
      if (errPlan) {
        window.IG.utils.showToast(errPlan, 'red');
        setTimeout(function() { window.IG.plans.afficherUpgrade(); }, 800);
        return;
      }
    }

    var modal = window.IG.utils.showModal(html, { width: '540px' });
    setTimeout(function() { if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-loc-form', 'ad1'); }, 80);
    modal.box.querySelector('#form-locataire').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var data = loc ? { ...loc } : { id: window.IG.utils.uid() };
      data.nom          = fd.get('nom');
      data.telephone    = fd.get('telephone');
      data.whatsapp     = fd.get('whatsapp');
      data.immeuble_id  = parseInt(fd.get('immeuble_id'));
      data.appt         = fd.get('appt');
      data.type_local   = fd.get('type_local');
      data.loyer        = parseFloat(fd.get('loyer')) || 0;
      data.caution      = parseFloat(fd.get('caution')) || 0;
      data.entree         = fd.get('entree');
      data.arrieres       = parseFloat(fd.get('arrieres')) || 0;
      data.mois_arrieres  = parseInt(fd.get('mois_arrieres')) || 0;
      data.observations   = fd.get('observations');
      data.statut       = data.statut || 'actif';
      try {
        var estNouveau = !loc;
        await sauvegarder(data);
        modal.close();
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
        if (estNouveau) {
          // Générer code d'invitation automatiquement pour le nouveau locataire
          _genererInvitationLocataire(data);
        } else {
          toast(t('Locataire sauvegardé'), 'green');
        }
      } catch(err) {
        toast(t('Erreur') + ': ' + err.message, 'red');
      }
    });
  }

  function _libererConfirm(id) {
    var loc = getById(id);
    if (!loc) return;
    window.IG.utils.confirm(t('Libérer ce locataire ?'), async function() {
      var locSnapshot = { ...loc };
      await liberer(id, 'depart_volontaire');
      if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
      _proposerPublication(locSnapshot);
    });
  }

  async function _proposerPublication(loc) {
    var tenantId = window.IG.auth && window.IG.auth.getTenantId ? window.IG.auth.getTenantId() : null;
    if (!tenantId) return;
    var WORKER = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 'https://immogest1.fofefranklin57.workers.dev';
    try {
      var r = await fetch(WORKER + '/annonce-auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locataire_id: loc.id, tenant_id: tenantId })
      });
      var res = r.ok ? await r.json() : null;
      if (!res || res.error) return;

      var imm = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
      var titre = (loc.type_local || 'Local') + ' — ' + (imm ? (imm.nom_immeuble || imm.nom) : '') + ' / ' + (loc.appt || '');
      var score = res.score || 0;
      var statut = res.statut;
      var annonce_id = res.annonce_id;
      var MKTURL = window.APP_CONFIG ? window.APP_CONFIG.APP_URL + '/marketplace.html' : '#';

      var scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? '#E07800' : 'var(--red)';
      var modeTxt = res.mode === 'auto' ? '⚡ Publiée automatiquement' : res.mode === 'proprio' ? '⏳ En attente validation propriétaire' : '📝 Brouillon créé';
      var html = '<div style="text-align:center;padding:8px 0 16px">' +
        '<div style="font-size:40px;margin-bottom:12px">🏠</div>' +
        '<h3 style="margin-bottom:6px;font-size:16px">' + t('Local libéré — Publication marketplace') + '</h3>' +
        '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">' + esc(titre) + '</p>' +
        '<div style="background:var(--bg3);border-radius:12px;padding:16px;margin-bottom:16px">' +
        '<div style="font-size:12px;color:var(--text3);margin-bottom:4px">Score qualité de l\'annonce</div>' +
        '<div style="font-size:32px;font-weight:700;color:' + scoreColor + '">' + score + '<span style="font-size:14px">/100</span></div>' +
        '<div style="margin-top:8px;font-size:11px;color:var(--text3)">' +
        (score < 70 ? '💡 Ajoutez photos et description pour améliorer le score' : '✅ Annonce complète') + '</div>' +
        '</div>' +
        '<div style="margin-bottom:16px;padding:10px 14px;background:var(--bg3);border-radius:8px;font-size:13px">' + modeTxt + '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">';
      if (statut === 'brouillon' && annonce_id) {
        html += '<button onclick="window.IG.locataires._publierAnnonce(' + annonce_id + ', this)" style="padding:10px 18px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">🚀 Publier maintenant</button>';
      }
      html += '<a href="' + MKTURL + '" target="_blank" style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);color:var(--text);text-decoration:none;font-size:13px;display:inline-flex;align-items:center;gap:6px">🌐 Voir Marketplace</a>' +
        '<button data-modal-close style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:transparent;color:var(--text3);cursor:pointer;font-size:13px">Fermer</button>' +
        '</div></div>';

      window.IG.utils.showModal(html, { width: '440px' });
    } catch(_) {}
  }

  async function _publierAnnonce(annonce_id, btn) {
    var WORKER = window.APP_CONFIG ? window.APP_CONFIG.API_URL : 'https://immogest1.fofefranklin57.workers.dev';
    var tenantId = window.IG.auth && window.IG.auth.getTenantId ? window.IG.auth.getTenantId() : null;
    if (btn) btn.disabled = true;
    try {
      var r = await fetch(WORKER + '/annonce-publier/' + annonce_id, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      });
      var res = r.ok ? await r.json() : null;
      if (res && res.success) {
        toast('✅ Annonce publiée sur la marketplace !', 'green');
        if (btn) { btn.textContent = '✓ Publiée'; btn.style.background = 'var(--green)'; }
      } else {
        toast('Erreur publication', 'red');
        if (btn) btn.disabled = false;
      }
    } catch(_) {
      if (btn) btn.disabled = false;
    }
  }

  // ── Fiche locataire ───────────────────────────────────────────
  function afficherFiche(id, annee) {
    var loc = getById(id);
    if (!loc) return;
    var pays = window.IG.paiements ? window.IG.paiements.getByLocataire(id) : [];
    var html = window.IG.paiements ? window.IG.paiements.renderFiche(loc, pays, annee) : '<p>Chargement...</p>';
    window.IG.utils.showModal(html, { width: '720px' });
    setTimeout(function() { if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-fiche', 'ad2'); }, 80);
  }

  function rafraichirFiche(id) {
    var sel = document.getElementById('fiche-annee-sel');
    var annee = sel ? parseInt(sel.value) : new Date().getFullYear();
    var zone = document.getElementById('fiche-print-zone');
    if (!zone) return;
    var loc = getById(id);
    if (!loc) return;
    var pays = window.IG.paiements ? window.IG.paiements.getByLocataire(id) : [];
    var html = window.IG.paiements ? window.IG.paiements.renderFiche(loc, pays, annee) : '';
    // Remplacer le contenu dans le modal existant
    var wrapper = zone.parentNode;
    if (wrapper) wrapper.innerHTML = html;
    setTimeout(function() { if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-fiche', 'ad2'); }, 80);
  }

  // ── Lien WhatsApp ─────────────────────────────────────────────
  function lienWA(loc, message) {
    var tel = (loc.whatsapp || loc.telephone || '').replace(/\D/g,'');
    if (!tel) return null;
    if (tel.startsWith('0')) tel = '237' + tel.substring(1);
    return 'https://wa.me/' + tel + '?text=' + encodeURIComponent(message || '');
  }

  function _field(name, label, val, required, type) {
    return '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + label + (required ? ' *' : '') + '</label>' +
      '<input type="' + (type || 'text') + '" name="' + name + '" value="' + esc(val || '') + '"' + (required ? ' required' : '') +
      ' style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>';
  }

  function _fieldNum(name, label, val) {
    return '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + label + '</label>' +
      '<input type="number" name="' + name + '" value="' + (parseFloat(val)||0) + '" min="0" step="500"' +
      ' style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>';
  }

  function _localBadge(appt) {
    if (!appt) return '–';
    return '<span class="local-A">' + esc(appt) + '</span>';
  }

  // Calcule le cumul total dû (toute la fiche depuis date entrée, pas seulement le mois courant)
  function _ficheDepuisPremierPay(loc, pays) {
    if (!pays.length) return [];
    var sorted = pays.slice().sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });
    var first = new Date(sorted[0].date_paiement);
    var locProxy = Object.assign({}, loc, {
      entree: first.getFullYear() + '-' + String(first.getMonth() + 1).padStart(2, '0') + '-01'
    });
    return window.IG.paiements ? window.IG.paiements.calculerFiche(locProxy, pays) : [];
  }

  function _resteCalc(loc, paiements) {
    if (loc.statut === 'libre') return 0;
    if (!loc.entree || !loc.loyer) return 0;
    var pays = (paiements || []).filter(function(p) { return p.locataire_id == loc.id; });
    var loyer = parseFloat(loc.loyer) || 0;
    var baseArrieres = parseFloat(loc.arrieres) || 0;
    if (pays.length === 0) return baseArrieres;
    if (window.IG.paiements && window.IG.paiements.calculerFiche) {
      var fiche = _ficheDepuisPremierPay(loc, pays);
      var payes = fiche.filter(function(l) { return !l.futur && l.statut === 'Payé'; }).length;
      var duNouv = fiche.filter(function(l) { return !l.futur; }).reduce(function(s, l) { return s + (l.reste || 0); }, 0);
      return Math.max(0, baseArrieres - payes * loyer) + duNouv;
    }
    // Fallback mois courant si paiements module non chargé
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();
    var totalPaye = pays.filter(function(p) {
      return parseInt(p.annee) === annee && parseInt(p.mois) === mois;
    }).reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
    return (loc.loyer || 0) - totalPaye;
  }

  function _alerteLabel(loc, paiements) {
    if (loc.statut === 'libre' || loc.statut === 'inactif') return '';
    if (!loc.entree) return '';
    var pays = (paiements || []).filter(function(p) { return p.locataire_id == loc.id; });
    var moisDus = 0;
    var base = parseInt(loc.mois_arrieres) || 0;
    if (pays.length === 0) {
      moisDus = base;
    } else if (window.IG.paiements && window.IG.paiements.calculerFiche) {
      var fiche = _ficheDepuisPremierPay(loc, pays);
      var payesCnt = fiche.filter(function(l) { return !l.futur && l.statut === 'Payé'; }).length;
      var impayesNouveaux = fiche.filter(function(l) { return !l.futur && l.statut !== 'Payé'; }).length;
      moisDus = Math.max(0, base - payesCnt) + impayesNouveaux;
    } else {
      var reste = _resteCalc(loc, paiements);
      if (reste <= 0) return '';
      moisDus = Math.round(reste / (loc.loyer || 1));
    }
    if (moisDus <= 0) return '';
    if (moisDus >= 3) return '<span style="font-size:10px;font-weight:700;color:var(--red)">🔴 Cas critique</span>';
    if (moisDus >= 2) return '<span style="font-size:10px;font-weight:700;color:#E07800">🟠 À surveiller</span>';
    return '<span style="font-size:10px;font-weight:700;color:#CA8A04">🟡 À surveiller</span>';
  }

  function _toggleMenu(btn) {
    var dd = btn.nextElementSibling;
    var wasOpen = dd.classList.contains('open');
    _closeMenus();
    if (!wasOpen) dd.classList.add('open');
  }

  function _closeMenus() {
    document.querySelectorAll('.action-dropdown.open').forEach(function(d) { d.classList.remove('open'); });
  }

  function envoyerAccesWA(locId) {
    var loc = getById(locId);
    if (!loc) return;
    var tel = (loc.whatsapp || loc.telephone || '').replace(/\D/g,'');
    if (!tel) { window.IG.utils.showToast('Pas de numéro WhatsApp', 'red'); return; }
    if (tel.startsWith('0')) tel = '237' + tel.substring(1);
    var msg = 'Bonjour ' + loc.nom + ', voici votre accès au portail locataire ImmoGest : https://immogest-34w.pages.dev';
    window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
  }

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.action-menu')) _closeMenus();
  });

  // ── Invitation automatique à la création d'un locataire ───────
  async function _genererInvitationLocataire(loc) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var WORKER  = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || 'https://immogest1.fofefranklin57.workers.dev';
    var imm     = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    try {
      var res = await fetch(WORKER + '/generate-invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tenantId: session.tenantId, role: 'locataire', locataire_id: loc.id })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      var code = data.code;
      var tel  = (loc.whatsapp || loc.telephone || '').replace(/\s/g,'');
      var msg  = 'Bonjour ' + (loc.nom || '') + ' 👋\n' +
        'Votre espace locataire ImmoGest est prêt.\n' +
        (imm ? '🏢 Immeuble : ' + (imm.nom_immeuble || imm.nom) + '\n' : '') +
        '🏠 Local : ' + (loc.appt || '') + '\n' +
        '💰 Loyer : ' + (loc.loyer || 0) + ' FCFA/mois\n\n' +
        '📲 Votre code d\'accès : *' + code + '*\n' +
        'Téléchargez ImmoGest et entrez ce code à l\'inscription.';
      var waUrl = 'https://wa.me/' + (tel.startsWith('+') ? tel.slice(1) : '237' + tel) + '?text=' + encodeURIComponent(msg);

      window.IG.utils.showModal(
        '<div style="text-align:center;padding:8px 0 16px">' +
        '<div style="font-size:36px;margin-bottom:10px">🎉</div>' +
        '<h3 style="font-size:15px;margin-bottom:6px">' + t('Locataire ajouté !') + '</h3>' +
        '<p style="font-size:13px;color:var(--text3);margin-bottom:16px">' + esc(loc.nom) + ' — Local ' + esc(loc.appt || '?') + '</p>' +
        '<div style="background:var(--bg3);border-radius:12px;padding:16px;margin-bottom:16px">' +
        '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">CODE D\'ACCÈS LOCATAIRE</div>' +
        '<div style="font-size:32px;font-weight:900;letter-spacing:4px;color:var(--accent)">' + code + '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:6px">Valable 7 jours</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
        (tel ? '<a href="' + waUrl + '" target="_blank" style="padding:10px 16px;border-radius:8px;border:none;background:#25D366;color:#fff;font-weight:700;font-size:13px;text-decoration:none;display:inline-flex;align-items:center;gap:6px">📱 Envoyer par WhatsApp</a>' : '') +
        '<button onclick="navigator.clipboard.writeText(\'' + code + '\');window.IG.utils.showToast(\'Code copié ✓\',\'green\')" style="padding:10px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">📋 Copier le code</button>' +
        '<button data-modal-close style="padding:10px 16px;border-radius:8px;border:1px solid var(--border2);background:transparent;color:var(--text3);cursor:pointer;font-size:13px">Fermer</button>' +
        '</div></div>',
        { width: '420px' }
      );
    } catch(e) {
      toast(t('Locataire sauvegardé') + ' — ' + t('Erreur génération code') + ': ' + e.message, 'orange');
    }
  }

  return {
    charger, getCache, getById, getByImmeuble, sauvegarder,
    liberer, supprimer, renderListe, afficherFormulaire, afficherFiche,
    lienWA, _libererConfirm, _toggleMenu, _closeMenus, envoyerAccesWA,
    _publierAnnonce, rafraichirFiche
  };

})();
