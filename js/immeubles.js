// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Immeubles
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.immeubles = (function() {

  var _cache = [];

  // ── Helpers locaux ───────────────────────────────────────────
  function t(key) { return window.IG.i18n ? window.IG.i18n.t(key) : key; }
  function toast(msg, type) { window.IG.utils.showToast(msg, type); }
  function db() { return window.IG.db; }
  var esc = function(s) { return window.IG.utils.esc(s); };

  // ── CRUD ─────────────────────────────────────────────────────
  async function charger() {
    try {
      _cache = await db().select('immeubles');
      return _cache;
    } catch(e) {
      toast(t('Erreur chargement immeubles') + ': ' + e.message, 'red');
      return [];
    }
  }

  function getCache() { return _cache; }

  function getById(id) {
    return _cache.find(function(i) { return String(i.id) === String(id); }) || null;
  }

  async function sauvegarder(immeuble) {
    if (!immeuble.id) immeuble.id = window.IG.utils.uid();
    var result = await db().upsert('immeubles', [immeuble]);
    // Mettre à jour cache
    var idx = _cache.findIndex(function(i) { return i.id == immeuble.id; });
    if (idx >= 0) _cache[idx] = immeuble;
    else _cache.push(immeuble);
    return result;
  }

  async function supprimer(id) {
    await db().remove('immeubles', id);
    _cache = _cache.filter(function(i) { return i.id != id; });
  }

  // ── Rendu liste ───────────────────────────────────────────────
  function renderListe(locataires) {
    var container = document.getElementById('immeubles-liste');
    if (!container) return;

    if (!_cache.length) {
      container.innerHTML = '<div class="empty-state" style="text-align:center;padding:60px 20px;color:var(--text3)">' +
        '<div style="font-size:48px;margin-bottom:16px">🏢</div>' +
        '<p style="font-size:16px;font-weight:600;margin-bottom:8px">' + t('Aucun immeuble') + '</p>' +
        '<p style="font-size:13px">' + t('Cliquez sur le bouton + pour ajouter votre premier immeuble') + '</p>' +
        '</div>';
      return;
    }

    var html = '<div class="immeubles-grid">';
    _cache.forEach(function(imm) {
      var locs = (locataires || []).filter(function(l) { return l.immeuble_id == imm.id; });
      var occupes = locs.filter(function(l) { return l.statut !== 'libre'; }).length;
      var total = (imm.apparts || 0) + (imm.studios || 0) + (imm.chambres || 0) + (imm.duplex || 0);
      var tauxOccup = total > 0 ? Math.round(occupes / total * 100) : 0;
      var couleur = imm.couleur || '#0E6AAF';

      html += '<div class="imm-card" style="border-top:3px solid ' + esc(couleur) + '">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
        '<div style="width:36px;height:36px;border-radius:8px;background:' + esc(couleur) + '20;display:flex;align-items:center;justify-content:center;font-size:20px">🏢</div>' +
        '<div><div style="font-weight:700;font-size:15px">' + esc(imm.nom_immeuble || imm.nom) + '</div>' +
        '<div style="font-size:12px;color:var(--text3)">' + esc(imm.ville || '') + (imm.quartier ? ' — ' + esc(imm.quartier) : '') + '</div></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">' +
        _statCard(occupes + '/' + total, t('Occupés')) +
        _statCard(tauxOccup + '%', t('Occupation')) +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button onclick="window.IG.immeubles.afficherDetail(' + imm.id + ')" class="btn-sm btn-primary" style="flex:1">' + t('Détails') + '</button>' +
        '<button onclick="window.IG.immeubles.afficherFormulaire(' + imm.id + ')" class="btn-sm btn-secondary">' + t('Modifier') + '</button>' +
        '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function _statCard(val, label) {
    return '<div style="background:var(--bg3);border-radius:8px;padding:10px;text-align:center">' +
      '<div style="font-size:18px;font-weight:700;color:var(--accent)">' + val + '</div>' +
      '<div style="font-size:10px;color:var(--text3);text-transform:uppercase;margin-top:2px">' + label + '</div>' +
      '</div>';
  }

  // ── Formulaire ajout/édition ──────────────────────────────────
  function afficherFormulaire(id) {
    var imm = id ? getById(id) : null;
    var titre = imm ? t('Modifier immeuble') : t('Ajouter un immeuble');

    var html = '<h3 style="margin-bottom:18px;font-size:16px">' + titre + '</h3>' +
      '<form id="form-immeuble">' +
      _field('nom_immeuble', t('Nom immeuble'), imm ? (imm.nom_immeuble || imm.nom) : '', true) +
      _field('nom_proprio', t('Propriétaire'), imm ? (imm.nom_proprio || '') : '') +
      _field('tel_proprio', t('Tél propriétaire'), imm ? (imm.tel_proprio || '') : '', false, 'tel') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _field('ville', t('Ville'), imm ? (imm.ville || '') : '') +
      _field('quartier', t('Quartier'), imm ? (imm.quartier || '') : '') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px">' +
      _fieldNum('apparts',  t('Apparts'),  imm ? (imm.apparts  || 0) : 0) +
      _fieldNum('studios',  t('Studios'),  imm ? (imm.studios  || 0) : 0) +
      _fieldNum('chambres', t('Chambres'), imm ? (imm.chambres || 0) : 0) +
      _fieldNum('duplex',   t('Duplex'),   imm ? (imm.duplex   || 0) : 0) +
      '</div>' +
      '<div style="margin-bottom:14px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Couleur') + '</label>' +
      '<input type="color" name="couleur" value="' + esc(imm ? (imm.couleur || '#0E6AAF') : '#0E6AAF') + '" style="width:100%;height:36px;border-radius:6px;border:1px solid var(--border2);cursor:pointer;margin-top:4px"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">' +
      '<button type="button" data-modal-close class="btn-secondary" style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer">' + t('Annuler') + '</button>' +
      '<button type="submit" class="btn-primary" style="padding:10px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">' + t('Sauvegarder') + '</button>' +
      '</div></form>';

    var modal = window.IG.utils.showModal(html, { width: '520px' });

    modal.box.querySelector('#form-immeuble').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var data = imm ? { ...imm } : { id: window.IG.utils.uid() };
      data.nom_immeuble = fd.get('nom_immeuble');
      data.nom          = fd.get('nom_immeuble');
      data.nom_proprio  = fd.get('nom_proprio');
      data.tel_proprio  = fd.get('tel_proprio');
      data.ville        = fd.get('ville');
      data.quartier     = fd.get('quartier');
      data.apparts      = parseInt(fd.get('apparts'))  || 0;
      data.studios      = parseInt(fd.get('studios'))  || 0;
      data.chambres     = parseInt(fd.get('chambres')) || 0;
      data.duplex       = parseInt(fd.get('duplex'))   || 0;
      data.couleur      = fd.get('couleur');
      try {
        await sauvegarder(data);
        modal.close();
        toast(t('Immeuble sauvegardé'), 'green');
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
      } catch(err) {
        toast(t('Erreur') + ': ' + err.message, 'red');
      }
    });
  }

  function _field(name, label, val, required, type) {
    return '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + label + (required ? ' *' : '') + '</label>' +
      '<input type="' + (type || 'text') + '" name="' + name + '" value="' + esc(val) + '"' + (required ? ' required' : '') +
      ' style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>';
  }

  function _fieldNum(name, label, val) {
    return '<div style="margin-bottom:12px"><label style="font-size:11px;color:var(--text2);font-weight:600">' + label + '</label>' +
      '<input type="number" name="' + name + '" value="' + (parseInt(val)||0) + '" min="0"' +
      ' style="width:100%;margin-top:4px;padding:9px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>';
  }

  // ── Détail immeuble ───────────────────────────────────────────
  function afficherDetail(id) {
    var imm = getById(id);
    if (!imm) return;
    if (window.IG.app && window.IG.app.showPage) {
      window.IG.app.showPage('locataires', { immeubleId: id });
    }
  }

  function render(locataires) {
    renderListe(locataires);
  }

  return {
    charger, getCache, getById, sauvegarder, supprimer,
    render, renderListe, afficherFormulaire, afficherDetail
  };

})();
