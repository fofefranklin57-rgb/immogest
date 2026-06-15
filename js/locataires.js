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

    // Filtrer par recherche
    var q = (document.getElementById('loc-search') && document.getElementById('loc-search').value || '').toLowerCase();
    if (q) liste = liste.filter(function(l) {
      return (l.nom || '').toLowerCase().includes(q) ||
             (l.appt || '').toLowerCase().includes(q) ||
             (l.telephone || '').includes(q);
    });

    var html = '<table class="table-locataires" style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:10px 14px;text-align:left">' + t('Locataire') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">' + t('Local') + '</th>' +
      '<th style="padding:10px 14px;text-align:right">' + t('Loyer') + '</th>' +
      '<th style="padding:10px 14px;text-align:left">' + t('Statut') + '</th>' +
      '<th style="padding:10px 14px;text-align:center">' + t('Actions') + '</th>' +
      '</tr></thead><tbody>';

    liste.forEach(function(loc) {
      var statut = _statutBadge(loc, paiements);
      html += '<tr style="border-bottom:1px solid var(--border2);transition:background .15s" ' +
        'onmouseover="this.style.background=\'var(--bg3)\'" onmouseout="this.style.background=\'\'">' +
        '<td style="padding:12px 14px">' +
        '<div style="font-weight:600;font-size:13px">' + esc(loc.nom) + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">' + esc(loc.telephone || '') + '</div></td>' +
        '<td style="padding:12px 14px">' +
        '<div style="font-size:13px">' + esc(loc.appt || '—') + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">' + esc(_nomImmeuble(loc.immeuble_id)) + '</div></td>' +
        '<td style="padding:12px 14px;text-align:right;font-weight:600;font-size:13px">' + fmt(loc.loyer) + '</td>' +
        '<td style="padding:12px 14px">' + statut + '</td>' +
        '<td style="padding:12px 14px;text-align:center">' +
        '<div style="display:flex;gap:6px;justify-content:center">' +
        '<button onclick="window.IG.locataires.afficherFiche(' + loc.id + ')" title="' + t('Fiche') + '" ' +
          'style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:12px">📋</button>' +
        '<button onclick="window.IG.locataires.afficherFormulaire(' + loc.id + ')" title="' + t('Modifier') + '" ' +
          'style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:12px">✏️</button>' +
        '<button onclick="window.IG.paiements.afficherFormulaire(' + loc.id + ')" title="' + t('Encaisser') + '" ' +
          'style="padding:5px 10px;border-radius:6px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:12px;font-weight:600">+</button>' +
        '</div></td>' +
        '</tr>';
    });
    html += '</tbody></table>';
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
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Observations') + '</label>' +
      '<textarea name="observations" rows="2" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);resize:vertical">' + esc(loc ? (loc.observations || '') : '') + '</textarea></div>' +
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
      data.entree       = fd.get('entree');
      data.observations = fd.get('observations');
      data.statut       = data.statut || 'actif';
      try {
        await sauvegarder(data);
        modal.close();
        toast(t('Locataire sauvegardé'), 'green');
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
      } catch(err) {
        toast(t('Erreur') + ': ' + err.message, 'red');
      }
    });
  }

  function _libererConfirm(id) {
    window.IG.utils.confirm(t('Libérer ce locataire ?'), async function() {
      await liberer(id, 'depart_volontaire');
      if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
    });
  }

  // ── Fiche locataire ───────────────────────────────────────────
  function afficherFiche(id) {
    var loc = getById(id);
    if (!loc) return;
    var pays = window.IG.paiements ? window.IG.paiements.getByLocataire(id) : [];
    var html = window.IG.paiements ? window.IG.paiements.renderFiche(loc, pays) : '<p>Chargement...</p>';
    window.IG.utils.showModal(html, { width: '680px' });
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

  return {
    charger, getCache, getById, getByImmeuble, sauvegarder,
    liberer, supprimer, renderListe, afficherFormulaire, afficherFiche,
    lienWA, _libererConfirm
  };

})();
