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
      var all = await db().select('immeubles');
      _cache = (all || []).filter(function(i) { return !i.archive; });
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
    // ── Programmer J+15 pour tous les locataires de l'immeuble ──
    try {
      var session = window.IG.auth.getSession();
      if (session && session.tenantId) {
        var locs = await window.IG.db.select('locataires', { tenant_id: session.tenantId, immeuble_id: id });
        if (locs && locs.length) {
          var tels = locs.map(function(l) { return l.telephone; }).filter(Boolean);
          var usersApp = await window.IG.db.select('users_app', { tenant_id: session.tenantId, role: 'locataire' });
          var blocDate = new Date();
          blocDate.setDate(blocDate.getDate() + 15);
          var cibles = (usersApp || []).filter(function(u) { return tels.includes(u.telephone); });
          for (var i = 0; i < cibles.length; i++) {
            await window.IG.db.update('users_app', cibles[i].id, {
              date_blocage_auto: blocDate.toISOString(),
              motif_blocage: 'contrat_rompu'
            });
          }
        }
        // Programmer J+15 pour le proprio (bailleur) de l'immeuble
        var imm = _cache.find(function(x) { return String(x.id) === String(id); });
        if (imm && imm.tel_proprio) {
          var proprios = await window.IG.db.select('users_app', { tenant_id: session.tenantId, role: 'bailleur', telephone: imm.tel_proprio });
          if (proprios && proprios.length) {
            var bd2 = new Date(); bd2.setDate(bd2.getDate() + 15);
            await window.IG.db.update('users_app', proprios[0].id, {
              date_blocage_auto: bd2.toISOString(),
              motif_blocage: 'contrat_rompu'
            });
          }
        }
      }
    } catch(_) {}
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
        '<button onclick="window.IG.immeubles.confirmerArchivage(' + imm.id + ')" class="btn-sm" style="background:var(--bg3);color:var(--text3);border:1px solid var(--border);border-radius:6px;padding:6px 10px;cursor:pointer;font-size:13px" title="' + t('Archiver') + '">📦</button>' +
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
    if (window.IG.perms && !window.IG.perms.canDo('immeubles_edit')) {
      window.IG.utils.showToast('Accès non autorisé', 'red');
      return;
    }
    if (window.IG.plans && window.IG.plans.estEnModeRetro()) {
      window.IG.utils.showToast(t('Accès limité — upgradez votre plan pour modifier les données'), 'red');
      setTimeout(function() { window.IG.plans.afficherUpgrade(); }, 800);
      return;
    }
    var imm = id ? getById(id) : null;
    var titre = imm ? t('Modifier immeuble') : t('Ajouter un immeuble');

    var html = '<h3 style="margin-bottom:18px;font-size:16px">' + titre + '</h3>' +
      '<form id="form-immeuble">' +
      _field('nom_immeuble', t('Nom immeuble'), imm ? (imm.nom_immeuble || imm.nom) : '', true) +
      _field('nom_proprio', t('Propriétaire'), imm ? (imm.nom_proprio || '') : '') +
      window.IG.utils.phoneField('tel_proprio', t('Tél propriétaire'), imm ? (imm.tel_proprio || '') : '') +
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
      (function() {
        var session = window.IG.auth ? window.IG.auth.getSession() : {};
        if ((session.type_profil || '') === 'proprietaire') return '';
        var typeHon = imm ? (imm.type_honoraires || 'aucun') : 'aucun';
        var valHon  = imm ? (imm.valeur_honoraires || 0) : 0;
        return '<div style="margin-bottom:14px">' +
          '<label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Honoraires cabinet') + '</label>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px">' +
          '<select name="type_honoraires" style="padding:8px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px">' +
          '<option value="aucun"' + (typeHon === 'aucun' ? ' selected' : '') + '>Aucun</option>' +
          '<option value="pourcentage"' + (typeHon === 'pourcentage' ? ' selected' : '') + '>Pourcentage (%)</option>' +
          '<option value="forfait"' + (typeHon === 'forfait' ? ' selected' : '') + '>Forfait fixe (F CFA)</option>' +
          '</select>' +
          '<input type="number" name="valeur_honoraires" value="' + esc(String(valHon)) + '" min="0" placeholder="Ex: 10 ou 50000" ' +
          'style="padding:8px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px">' +
          '</div></div>';
      })() +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">' +
      '<button type="button" data-modal-close class="btn-secondary" style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer">' + t('Annuler') + '</button>' +
      '<button type="submit" class="btn-primary" style="padding:10px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">' + t('Sauvegarder') + '</button>' +
      '</div></form>';

    // Vérification limite plan avant d'ouvrir (création seulement)
    if (!id && window.IG.plans) {
      var errPlan = window.IG.plans.verifierImmeuble();
      if (errPlan) {
        window.IG.utils.showToast(errPlan, 'red');
        setTimeout(function() { window.IG.plans.afficherUpgrade(); }, 800);
        return;
      }
    }

    var modal = window.IG.utils.showModal(html, { width: '520px' });

    var _saving = false;
    modal.box.querySelector('#form-immeuble').addEventListener('submit', async function(e) {
      e.preventDefault();
      if (_saving) return;                         // verrou anti double-submit → évite les immeubles en double
      _saving = true;
      var _btn = e.target.querySelector('button[type="submit"]');
      var _lbl = _btn ? _btn.textContent : '';
      if (_btn) { _btn.disabled = true; _btn.textContent = t('Enregistrement…'); }
      var fd = new FormData(e.target);
      var data = imm ? { ...imm } : { id: window.IG.utils.uid() };
      data.nom_immeuble = fd.get('nom_immeuble');
      data.nom          = fd.get('nom_immeuble');
      data.nom_proprio  = fd.get('nom_proprio');
      data.tel_proprio  = window.IG.utils.phoneFieldValue('tel_proprio');
      data.ville        = fd.get('ville');
      data.quartier     = fd.get('quartier');
      data.apparts      = parseInt(fd.get('apparts'))  || 0;
      data.studios      = parseInt(fd.get('studios'))  || 0;
      data.chambres     = parseInt(fd.get('chambres')) || 0;
      data.duplex       = parseInt(fd.get('duplex'))   || 0;
      data.couleur            = fd.get('couleur');
      data.type_honoraires    = fd.get('type_honoraires') || 'aucun';
      data.valeur_honoraires  = parseFloat(fd.get('valeur_honoraires')) || 0;
      try {
        var estNouveau = !imm;
        await sauvegarder(data);
        await _creerLocauxManquants(data);
        modal.close();
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
        if (estNouveau && data.nom_proprio && data.tel_proprio) {
          _genererInvitationBailleur(data);
        } else {
          toast(t('Immeuble sauvegardé'), 'green');
        }
      } catch(err) {
        toast(t('Erreur') + ': ' + err.message, 'red');
      } finally {
        _saving = false;
        if (_btn) { _btn.disabled = false; _btn.textContent = _lbl; }
      }
    });
  }

  // ── Invitation automatique bailleur à la création d'un immeuble ─
  async function _genererInvitationBailleur(imm) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var WORKER  = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || 'https://immogest1.fofefranklin57.workers.dev';
    try {
      var res = await fetch(WORKER + '/generate-invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tenantId: session.tenantId, sessionToken: session.sessionToken || null, role: 'bailleur', nom: imm.nom_proprio, telephone: imm.tel_proprio, immeuble_id: imm.id })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      var code = data.code;
      var tel  = (imm.tel_proprio || '').replace(/\s/g, '');
      var msg  = 'Bonjour ' + (imm.nom_proprio || '') + ' 👋\n' +
        'Votre espace propriétaire ImmoGest est prêt.\n' +
        '🏢 Immeuble : ' + (imm.nom_immeuble || imm.nom) + '\n' +
        (imm.ville ? '📍 ' + imm.ville + (imm.quartier ? ' / ' + imm.quartier : '') + '\n' : '') +
        '\n📲 Votre code d\'accès : *' + code + '*\n' +
        'Téléchargez ImmoGest et entrez ce code à l\'inscription pour suivre vos loyers.';
      var waUrl = 'https://wa.me/' + (tel.startsWith('+') ? tel.slice(1) : tel.replace(/^0+/, '')) + '?text=' + encodeURIComponent(msg);

      window.IG.utils.showModal(
        '<div style="text-align:center;padding:8px 0 16px">' +
        '<div style="font-size:36px;margin-bottom:10px">🏢</div>' +
        '<h3 style="font-size:15px;margin-bottom:6px">' + t('Immeuble ajouté !') + '</h3>' +
        '<p style="font-size:13px;color:var(--text3);margin-bottom:16px">' + esc(imm.nom_immeuble || imm.nom) + ' · ' + t('Propriétaire') + ' : ' + esc(imm.nom_proprio) + '</p>' +
        '<div style="background:var(--bg3);border-radius:12px;padding:16px;margin-bottom:16px">' +
        '<div style="font-size:11px;color:var(--text3);margin-bottom:6px">CODE D\'ACCÈS BAILLEUR</div>' +
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
      toast(t('Immeuble sauvegardé') + ' — ' + t('Erreur génération code') + ': ' + e.message, 'orange');
    }
  }

  // ── Création automatique des locaux après sauvegarde immeuble ──
  async function _creerLocauxManquants(imm) {
    if (!window.IG.locataires) return;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};

    // Récupérer les locaux déjà existants pour cet immeuble
    var existants = window.IG.app ? window.IG.app.getData().locataires : [];
    var locauxExistants = existants
      .filter(function(l) { return String(l.immeuble_id) === String(imm.id); })
      .map(function(l) { return (l.appt || '').toUpperCase(); });

    // Ordre : Duplex → Appartement → Studio → Chambre
    var types = [
      { key: 'duplex',   prefixe: 'D', label: 'duplex',       count: parseInt(imm.duplex)   || 0 },
      { key: 'apparts',  prefixe: 'A', label: 'appartement',  count: parseInt(imm.apparts)  || 0 },
      { key: 'studios',  prefixe: 'S', label: 'studio',       count: parseInt(imm.studios)  || 0 },
      { key: 'chambres', prefixe: 'C', label: 'chambre',      count: parseInt(imm.chambres) || 0 }
    ];

    var crees = 0;
    for (var t2 = 0; t2 < types.length; t2++) {
      var tp = types[t2];
      for (var n = 1; n <= tp.count; n++) {
        var appt = tp.prefixe + n;
        if (locauxExistants.indexOf(appt) === -1) {
          var local = {
            id:          window.IG.utils.uid(),
            tenant_id:   session.tenantId,
            immeuble_id: imm.id,
            nom:         'Local ' + appt,
            appt:        appt,
            type_local:  tp.label,
            statut:      'libre',
            loyer:       0,
            arrieres:    0,
            mois_arrieres: 0
          };
          try {
            await db().upsert('locataires', [local]);
            crees++;
          } catch(_) {}
        }
      }
    }
    if (crees > 0) toast(crees + ' local(aux) créé(s) automatiquement', 'blue');
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

  function confirmerArchivage(id) {
    var imm = getById(id);
    if (!imm) return;
    // Vérifier locataires actifs
    var locsActifs = [];
    if (window.IG.locataires) {
      locsActifs = window.IG.locataires.getCache().filter(function(l) {
        return l.immeuble_id == id && l.statut !== 'libre';
      });
    }
    if (locsActifs.length) {
      window.IG.utils.showModal(
        '<div style="text-align:center;padding:10px 0 20px">' +
        '<div style="font-size:36px;margin-bottom:12px">⚠️</div>' +
        '<div style="font-weight:700;font-size:15px;margin-bottom:8px">' + t('Impossible d\'archiver') + '</div>' +
        '<div style="font-size:13px;color:var(--text2);margin-bottom:16px">' +
        locsActifs.length + ' ' + t('locataire(s) actif(s) dans cet immeuble.') + '<br>' +
        t('Libérez tous les locataires avant d\'archiver.') + '</div>' +
        '<button data-modal-close style="padding:10px 24px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">OK</button>' +
        '</div>',
        { width: '360px' }
      );
      return;
    }
    window.IG.utils.confirm('📦 ' + t('Archiver cet immeuble ?') + ' « ' + (imm.nom_immeuble || imm.nom) + ' »\n' + t('L\'immeuble ne sera plus visible mais les données sont conservées.'), async function() {
      try {
        await sauvegarder({ ...imm, archive: true, date_archive: new Date().toISOString() });
        // Retirer du cache visible
        _cache = _cache.filter(function(i) { return i.id != id; });
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
        if (window.IG.plans) window.IG.plans.verifierRetrogradation();
        window.IG.utils.showToast('📦 ' + t('Immeuble archivé'), 'green');
      } catch(err) {
        window.IG.utils.showToast(t('Erreur') + ': ' + err.message, 'red');
      }
    });
  }

  return {
    charger, getCache, getById, sauvegarder, supprimer, confirmerArchivage,
    render, renderListe, afficherFormulaire, afficherDetail
  };

})();
