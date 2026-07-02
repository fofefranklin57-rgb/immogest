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
    // ── Programmer le blocage d'accès portail à J+15 ──
    try {
      var session = window.IG.auth.getSession();
      if (loc.telephone && session && session.tenantId) {
        var usersApp = await window.IG.db.select('users_app', { tenant_id: session.tenantId, telephone: loc.telephone, role: 'locataire' });
        if (usersApp && usersApp.length) {
          var blocDate = new Date();
          blocDate.setDate(blocDate.getDate() + 15);
          await window.IG.db.update('users_app', usersApp[0].id, {
            date_blocage_auto: blocDate.toISOString(),
            motif_blocage: 'liberation'
          });
        }
      }
    } catch(_) {}
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
        '<td class="td-name">' + esc(loc.nom) + (window.IG.juridique ? '<br>' + window.IG.juridique.badgeScore(loc) : '') + '</td>' +
        '<td style="font-size:12px">' + esc(loc.telephone || '–') + '</td>' +
        '<td class="td-amount">' + fmt(loc.loyer) + '</td>' +
        '<td style="font-size:11px;max-width:180px">' + obsHtml + '</td>' +
        '<td>' + statut + '</td>' +
        '<td>' + resteHtml + '</td>' +
        '<td style="white-space:nowrap">' +
        '<button class="action-menu-btn" onclick="window.IG.locataires._toggleMenu(this,' + loc.id + ',' + (loc.telephone ? 1 : 0) + ')">···</button>' +
        '</td></tr>';
    });
    html += '</tbody></table></div>';
    container.innerHTML = html;
  }

  function renderListeFiltree(paiements, immeubleId, statutFiltre) {
    var container = document.getElementById('locataires-liste');
    if (!container) return;

    var q = (document.getElementById('loc-search') && document.getElementById('loc-search').value || '').toLowerCase();
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var fmt = window.IG.utils.formatMontant;

    var liste = immeubleId
      ? _cache.filter(function(l) { return l.immeuble_id == immeubleId; })
      : _cache.slice();

    if (statutFiltre === 'actif') {
      liste = liste.filter(function(l) { return l.statut !== 'libre'; });
    } else if (statutFiltre === 'libre') {
      liste = liste.filter(function(l) { return l.statut === 'libre'; });
    } else if (statutFiltre === 'impaye') {
      var now = new Date(); var mois = now.getMonth() + 1; var annee = now.getFullYear();
      liste = liste.filter(function(l) {
        if (l.statut === 'libre') return false;
        var pays = (paiements || []).filter(function(p) { return p.locataire_id == l.id; });
        return !pays.some(function(p) {
          var d = new Date(p.date_paiement || p.created_at || '');
          return d.getMonth() + 1 === mois && d.getFullYear() === annee;
        });
      });
    }

    if (q) liste = liste.filter(function(l) {
      return (l.nom || '').toLowerCase().includes(q) ||
             (l.appt || '').toLowerCase().includes(q) ||
             (l.telephone || '').includes(q);
    });

    if (!liste.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--text3)">Aucun locataire trouvé pour ces filtres.</div>';
      return;
    }

    if (immeubleId) {
      _renderTableau(liste, paiements, container);
      return;
    }

    // Groupement par immeuble
    var groupes = {};
    var ordre = [];
    liste.forEach(function(l) {
      var key = l.immeuble_id || 0;
      if (!groupes[key]) { groupes[key] = []; ordre.push(key); }
      groupes[key].push(l);
    });

    var html = '';
    ordre.forEach(function(immId) {
      var imm = imms.find(function(i) { return i.id == immId; });
      var nomImm = imm ? esc(imm.nom_immeuble || imm.nom) : 'Sans immeuble';
      var groupe = groupes[immId];
      var actifs = groupe.filter(function(l) { return l.statut !== 'libre'; }).length;
      html += '<div style="margin-bottom:20px">' +
        '<div onclick="window.IG.app.showPage(\'locataires\',{immeubleId:' + immId + '})" style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--bg3);border-radius:10px 10px 0 0;cursor:pointer;border-bottom:2px solid var(--accent)">' +
        '<span style="font-size:15px">🏢</span>' +
        '<span style="font-weight:700;font-size:14px;color:var(--text)">' + nomImm + '</span>' +
        '<span style="margin-left:auto;font-size:12px;color:var(--text3)">' + actifs + '/' + groupe.length + '</span>' +
        '<span style="font-size:11px;color:var(--accent);padding-left:4px">›</span>' +
        '</div>' +
        '<div class="table-wrap" style="border-radius:0 0 10px 10px;overflow:hidden"><table class="tbl"><thead><tr>' +
        '<th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th><th>Statut</th><th>Reste dû</th><th></th>' +
        '</tr></thead><tbody>';
      groupe.forEach(function(loc) {
        var statut = _statutBadge(loc, paiements);
        var reste = _resteCalc(loc, paiements);
        var resteHtml = reste > 0 ? '<span class="td-amount red">' + fmt(reste) + '</span>'
          : reste < 0 ? '<span class="td-amount" style="color:var(--green)">+' + fmt(Math.abs(reste)) + '</span>' : '–';
        html += '<tr id="loc-row-' + loc.id + '" class="' + (loc.statut === 'libre' ? 'row-libre' : '') + '">' +
          '<td>' + _localBadge(loc.appt) + '</td>' +
          '<td class="td-name">' + esc(loc.nom) + '</td>' +
          '<td style="font-size:12px">' + esc(loc.telephone || '–') + '</td>' +
          '<td class="td-amount">' + fmt(loc.loyer) + '</td>' +
          '<td>' + statut + '</td><td>' + resteHtml + '</td>' +
          '<td><button class="action-menu-btn" onclick="window.IG.locataires._toggleMenu(this,' + loc.id + ',' + (loc.telephone ? 1 : 0) + ')">···</button></td></tr>';
      });
      html += '</tbody></table></div></div>';
    });
    container.innerHTML = html;
  }

  function _renderTableau(liste, paiements, container) {
    var fmt = window.IG.utils.formatMontant;
    var _ordreType = { 'd': 0, 'a': 1, 's': 2, 'c': 3 };
    liste = liste.slice().sort(function(a, b) {
      var pa = (a.appt || '').toLowerCase(); var pb = (b.appt || '').toLowerCase();
      var oa = _ordreType[pa[0]] !== undefined ? _ordreType[pa[0]] : 9;
      var ob = _ordreType[pb[0]] !== undefined ? _ordreType[pb[0]] : 9;
      if (oa !== ob) return oa - ob;
      return parseInt((pa.match(/\d+/)||[0])[0]) - parseInt((pb.match(/\d+/)||[0])[0]);
    });
    var html = '<div class="table-wrap"><table class="tbl"><thead><tr>' +
      '<th>Local</th><th>Nom</th><th>Tél</th><th>Loyer</th><th>Observations</th><th>Statut</th><th>Reste dû</th><th>Actions</th>' +
      '</tr></thead><tbody>';
    liste.forEach(function(loc) {
      var statut = _statutBadge(loc, paiements);
      var reste = _resteCalc(loc, paiements);
      var resteHtml = reste > 0 ? '<span class="td-amount red">' + fmt(reste) + '</span>'
        : reste < 0 ? '<span class="td-amount" style="color:var(--green)">+' + fmt(Math.abs(reste)) + '</span>' : '–';
      var alerte = _alerteLabel(loc, paiements);
      var obsHtml = esc(loc.observations || '');
      if (obsHtml) obsHtml = '<span style="color:var(--text3);font-size:11px">' + obsHtml + '</span>';
      if (alerte) obsHtml += (obsHtml ? '<br>' : '') + alerte;
      if (reste > 0 && loc.loyer > 0) { var mDus = Math.floor(reste / loc.loyer); if (mDus >= 1) obsHtml += '<br><span style="font-size:10px;color:var(--red)">' + mDus + ' mois dus</span>'; }
      html += '<tr id="loc-row-' + loc.id + '" class="' + (loc.statut === 'libre' ? 'row-libre' : '') + '">' +
        '<td>' + _localBadge(loc.appt) + '</td>' +
        '<td class="td-name">' + esc(loc.nom) + (window.IG.juridique ? '<br>' + window.IG.juridique.badgeScore(loc) : '') + '</td>' +
        '<td style="font-size:12px">' + esc(loc.telephone || '–') + '</td>' +
        '<td class="td-amount">' + fmt(loc.loyer) + '</td>' +
        '<td style="font-size:11px;max-width:180px">' + obsHtml + '</td>' +
        '<td>' + statut + '</td><td>' + resteHtml + '</td>' +
        '<td style="white-space:nowrap"><button class="action-menu-btn" onclick="window.IG.locataires._toggleMenu(this,' + loc.id + ',' + (loc.telephone ? 1 : 0) + ')">···</button></td></tr>';
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
  function afficherFormulaire(id, onSuccess) {
    if (window.IG.plans && window.IG.plans.estEnModeRetro()) {
      window.IG.utils.showToast(t('Accès limité — upgradez votre plan pour modifier les données'), 'red');
      setTimeout(function() { window.IG.plans.afficherUpgrade(); }, 800);
      return;
    }
    var loc = id ? getById(id) : null;
    // Modification : garder le formulaire simple en une page
    if (loc) { _afficherFormulaireEdition(loc, onSuccess); return; }
    // Création : wizard 4 étapes
    _afficherWizardLocataire(onSuccess);
  }

  function _afficherWizardLocataire(onSuccess) {
    if (window.IG.plans) {
      var errPlan = window.IG.plans.verifierLocataire();
      if (errPlan) { window.IG.utils.showToast(errPlan, 'red'); setTimeout(function() { window.IG.plans.afficherUpgrade(); }, 800); return; }
    }

    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var _data = {};
    var _etape = 1;
    var _modal = null;

    function _inp(style) {
      return 'width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1.5px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);margin-top:4px;' + (style || '');
    }
    function _lbl(txt, req) {
      return '<label style="font-size:12px;font-weight:600;color:var(--text2)">' + txt + (req ? ' <span style="color:var(--red)">*</span>' : '') + '</label>';
    }
    function _grp(inner) { return '<div style="margin-bottom:14px">' + inner + '</div>'; }

    function _stepper(actif) {
      var etapes = ['Identité','Logement','Contrat','Accès'];
      return '<div style="display:flex;gap:0;margin-bottom:24px;border-radius:10px;overflow:hidden">' +
        etapes.map(function(e, i) {
          var n = i + 1;
          var fait = n < actif;
          var courant = n === actif;
          var bg = courant ? 'var(--accent)' : fait ? 'var(--green)' : 'var(--bg3)';
          var col = (courant || fait) ? '#fff' : 'var(--text3)';
          return '<div style="flex:1;text-align:center;padding:10px 4px;background:' + bg + ';color:' + col + ';font-size:11px;font-weight:700">' +
            (fait ? '✓' : n) + ' ' + e + '</div>';
        }).join('') +
        '</div>';
    }

    function _renderEtape(n) {
      var html = '<div style="padding:20px 24px;max-width:500px;margin:0 auto">' + _stepper(n);

      if (n === 1) {
        html += '<div style="font-size:15px;font-weight:700;margin-bottom:16px">👤 Identité du locataire</div>' +
          _grp(_lbl('Nom complet', true) + '<input id="wz-nom" value="' + esc(_data.nom || '') + '" placeholder="Ex: Jean Dupont" style="' + _inp() + '">') +
          _grp(_lbl('Téléphone', true) + '<input id="wz-tel" value="' + esc(_data.telephone || '') + '" placeholder="+237 6XX XXX XXX" style="' + _inp() + '" onblur="window.IG.locataires._checkDoublon()">') +
          '<div id="wz-doublon" style="display:none;margin:-10px 0 12px;padding:8px 12px;background:rgba(185,48,32,.1);border-radius:8px;color:var(--red);font-size:12px"></div>' +
          _grp(_lbl('WhatsApp') + '<input id="wz-wa" value="' + esc(_data.whatsapp || '') + '" placeholder="Identique au téléphone si pareil" style="' + _inp() + '">');

      } else if (n === 2) {
        var immOptions = '<option value="">Sélectionner un immeuble...</option>' +
          imms.map(function(i) {
            return '<option value="' + i.id + '"' + (_data.immeuble_id == i.id ? ' selected' : '') + '>' + esc(i.nom_immeuble || i.nom) + '</option>';
          }).join('');
        html += '<div style="font-size:15px;font-weight:700;margin-bottom:16px">🏢 Logement</div>' +
          _grp(_lbl('Immeuble', true) + '<select id="wz-imm" onchange="window.IG.locataires._chargerLocaux()" style="' + _inp() + '">' + immOptions + '</select>') +
          _grp(_lbl('Numéro de local', true) +
            '<div style="display:flex;gap:8px;margin-top:4px">' +
            '<input id="wz-appt" value="' + esc(_data.appt || '') + '" placeholder="Ex: A1, S2, C3" style="' + _inp('flex:1;margin-top:0') + '" onblur="window.IG.locataires._checkLocalOccupe()">' +
            '<button type="button" onclick="window.IG.locataires._voirLocaux()" style="padding:10px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer;white-space:nowrap">Voir libres</button></div>') +
          '<div id="wz-occupe" style="display:none;margin:-10px 0 12px;padding:8px 12px;background:rgba(185,48,32,.1);border-radius:8px;color:var(--red);font-size:12px"></div>' +
          _grp(_lbl('Type de local') + '<select id="wz-type" style="' + _inp() + '">' +
            ['appartement','studio','chambre','duplex','bureau','commerce'].map(function(tp) {
              return '<option value="' + tp + '"' + (_data.type_local === tp ? ' selected' : '') + '>' + tp.charAt(0).toUpperCase() + tp.slice(1) + '</option>';
            }).join('') + '</select>');

      } else if (n === 3) {
        html += '<div style="font-size:15px;font-weight:700;margin-bottom:16px">📋 Contrat</div>' +
          _grp(_lbl('Date d\'entrée', true) + '<input type="date" id="wz-entree" value="' + esc(_data.entree || '') + '" style="' + _inp() + '">') +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          _grp(_lbl('Loyer mensuel (FCFA)', true) + '<input type="number" id="wz-loyer" value="' + (_data.loyer || '') + '" min="0" step="500" placeholder="Ex: 50000" style="' + _inp() + '">') +
          _grp(_lbl('Caution') + '<input type="number" id="wz-caution" value="' + (_data.caution || '') + '" min="0" step="500" style="' + _inp() + '">') +
          '</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
          _grp(_lbl('Arriérés antérieurs (FCFA)') + '<input type="number" id="wz-arr" value="' + (_data.arrieres || 0) + '" min="0" step="500" oninput="window.IG.locataires._syncArrMois()" style="' + _inp() + '">') +
          _grp(_lbl('Nb mois arriérés') + '<input type="number" id="wz-arr-mois" value="' + (_data.mois_arrieres || 0) + '" min="0" step="1" oninput="window.IG.locataires._syncArrMontant()" style="' + _inp() + '">') +
          '</div>' +
          _grp(_lbl('Observations') + '<textarea id="wz-obs" rows="2" placeholder="Notes particulières..." style="' + _inp() + 'resize:vertical">' + esc(_data.observations || '') + '</textarea>');

      } else if (n === 4) {
        html += '<div style="text-align:center;padding:10px 0">' +
          '<div style="font-size:40px;margin-bottom:12px">🎉</div>' +
          '<div style="font-size:16px;font-weight:700;margin-bottom:6px">' + esc(_data.nom || '') + ' ajouté !</div>' +
          '<div style="font-size:13px;color:var(--text3);margin-bottom:20px">' + esc(_data.appt || '') + (imms.find(function(i) { return i.id == _data.immeuble_id; }) ? ' · ' + esc((imms.find(function(i) { return i.id == _data.immeuble_id; })).nom_immeuble || '') : '') + '</div>' +
          '<div id="wz-invite-zone"><div style="font-size:13px;color:var(--text3)">Génération de l\'accès locataire...</div></div>' +
          '</div>';
      }

      // Boutons navigation
      html += '<div style="display:flex;gap:10px;justify-content:space-between;margin-top:20px">';
      if (n > 1 && n < 4) {
        html += '<button onclick="window.IG.locataires._wzNav(-1)" style="padding:11px 20px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;cursor:pointer">← Retour</button>';
      } else {
        html += '<div></div>';
      }
      if (n < 3) {
        html += '<button onclick="window.IG.locataires._wzNav(1)" style="padding:11px 24px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer">Suivant →</button>';
      } else if (n === 3) {
        html += '<button onclick="window.IG.locataires._wzSauvegarder()" style="padding:11px 24px;border-radius:8px;border:none;background:var(--green);color:#fff;font-size:13px;font-weight:700;cursor:pointer">✅ Enregistrer</button>';
      } else {
        html += '<button onclick="window.IG.locataires._wzFermer()" style="padding:11px 24px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer">Terminer</button>';
      }
      html += '</div></div>';
      return html;
    }

    // Accès depuis les fonctions inline
    window.IG.locataires._wzData = _data;
    window.IG.locataires._wzEtape = function() { return _etape; };
    window.IG.locataires._wzNav = function(dir) {
      if (dir === 1) {
        // Valider étape courante
        if (_etape === 1) {
          var nom = (document.getElementById('wz-nom') || {}).value || '';
          var tel = (document.getElementById('wz-tel') || {}).value || '';
          if (!nom.trim()) { toast('Nom obligatoire', 'red'); return; }
          if (!tel.trim()) { toast('Téléphone obligatoire', 'red'); return; }
          _data.nom = nom.trim();
          _data.telephone = tel.trim();
          _data.whatsapp = (document.getElementById('wz-wa') || {}).value || '';
        } else if (_etape === 2) {
          var immId = (document.getElementById('wz-imm') || {}).value || '';
          var appt = (document.getElementById('wz-appt') || {}).value || '';
          if (!immId) { toast('Immeuble obligatoire', 'red'); return; }
          if (!appt.trim()) { toast('Numéro de local obligatoire', 'red'); return; }
          _data.immeuble_id = parseInt(immId);
          _data.appt = appt.trim();
          _data.type_local = (document.getElementById('wz-type') || {}).value || 'appartement';
        }
      }
      _etape += dir;
      var box = document.getElementById('wz-modal-body');
      if (box) box.innerHTML = _renderEtape(_etape);
    };
    window.IG.locataires._wzSauvegarder = async function() {
      var entree = (document.getElementById('wz-entree') || {}).value || '';
      var loyer  = parseFloat((document.getElementById('wz-loyer') || {}).value || 0);
      var caution = parseFloat((document.getElementById('wz-caution') || {}).value || 0);
      var arr = parseFloat((document.getElementById('wz-arr') || {}).value || 0);
      var arrM = parseInt((document.getElementById('wz-arr-mois') || {}).value || 0);
      var obs = (document.getElementById('wz-obs') || {}).value || '';
      if (!entree) { toast('Date d\'entrée obligatoire', 'red'); return; }
      if (!loyer) { toast('Loyer obligatoire', 'red'); return; }
      _data.entree = entree;
      _data.loyer = loyer;
      _data.caution = caution;
      _data.arrieres = arr;
      _data.mois_arrieres = arrM;
      _data.observations = obs;
      _data.statut = 'actif';
      _data.id = window.IG.utils.uid();
      try {
        await sauvegarder(_data);
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
        if (typeof onSuccess === 'function') onSuccess();
        _etape = 4;
        var box = document.getElementById('wz-modal-body');
        if (box) box.innerHTML = _renderEtape(4);
        // Générer invitation et afficher code
        setTimeout(function() { _genererInvitationLocataire(_data); }, 400);
      } catch(err) { toast('Erreur: ' + err.message, 'red'); }
    };
    window.IG.locataires._wzFermer = function() {
      var overlay = document.querySelector('[id="wz-overlay"]');
      if (overlay) overlay.remove();
    };
    window.IG.locataires._checkDoublon = function() {
      var tel = (document.getElementById('wz-tel') || {}).value || '';
      if (!tel) return;
      var existe = _cache.some(function(l) { return l.telephone && l.telephone.replace(/\D/g,'') === tel.replace(/\D/g,''); });
      var zone = document.getElementById('wz-doublon');
      if (zone) {
        if (existe) { zone.style.display = 'block'; zone.textContent = '⚠️ Ce numéro est déjà utilisé par un locataire existant.'; }
        else { zone.style.display = 'none'; }
      }
    };
    window.IG.locataires._checkLocalOccupe = function() {
      var immId = (document.getElementById('wz-imm') || {}).value || '';
      var appt = (document.getElementById('wz-appt') || {}).value || '';
      if (!immId || !appt) return;
      var occupe = _cache.find(function(l) { return l.immeuble_id == immId && l.appt === appt && l.statut !== 'libre'; });
      var zone = document.getElementById('wz-occupe');
      if (zone) {
        if (occupe) { zone.style.display = 'block'; zone.textContent = '⚠️ Ce local est déjà occupé par ' + esc(occupe.nom) + '.'; }
        else { zone.style.display = 'none'; }
      }
    };
    window.IG.locataires._chargerLocaux = function() {
      var immId = (document.getElementById('wz-imm') || {}).value || '';
      _data.immeuble_id = parseInt(immId) || null;
    };
    window.IG.locataires._voirLocaux = function() {
      var immId = (document.getElementById('wz-imm') || {}).value || '';
      if (!immId) { toast('Choisir d\'abord un immeuble', 'orange'); return; }
      var imm = imms.find(function(i) { return i.id == immId; });
      if (!imm) return;
      var occupesIds = _cache.filter(function(l) { return l.immeuble_id == immId && l.statut !== 'libre'; }).map(function(l) { return l.appt; });
      var types = [['A','apparts'],['S','studios'],['C','chambres'],['D','duplex']];
      var lignes = [];
      types.forEach(function(tp) {
        var nb = parseInt(imm[tp[1]] || 0);
        for (var k = 1; k <= nb; k++) {
          var code = tp[0] + k;
          var libre = !occupesIds.includes(code);
          lignes.push('<span style="display:inline-block;margin:3px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:700;background:' + (libre ? 'rgba(14,122,69,.15)' : 'rgba(185,48,32,.1)') + ';color:' + (libre ? 'var(--green)' : 'var(--red)') + ';cursor:' + (libre ? 'pointer' : 'default') + '"' +
            (libre ? ' onclick="document.getElementById(\'wz-appt\').value=\'' + code + '\';this.closest(\'[style*=z-index:950]\').remove()"' : '') + '>' +
            code + (libre ? ' ✓' : ' ✗') + '</span>');
        }
      });
      var pop = document.createElement('div');
      pop.style.cssText = 'position:fixed;inset:0;z-index:950;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center';
      pop.innerHTML = '<div style="background:var(--bg);border-radius:14px;padding:20px;max-width:340px;width:90%">' +
        '<div style="font-weight:700;font-size:14px;margin-bottom:12px">Locaux — ' + esc(imm.nom_immeuble || imm.nom) + '</div>' +
        '<div style="margin-bottom:12px">' + (lignes.join('') || 'Aucun local configuré') + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">✓ libre — cliquer pour sélectionner &nbsp;|&nbsp; ✗ occupé</div>' +
        '<button onclick="this.closest(\'[style*=z-index:950]\').remove()" style="margin-top:14px;width:100%;padding:9px;border-radius:8px;border:none;background:var(--bg3);color:var(--text);cursor:pointer">Fermer</button></div>';
      document.body.appendChild(pop);
    };
    window.IG.locataires._syncArrMois = function() {
      var loyer = parseFloat((document.getElementById('wz-loyer') || {}).value || 0);
      var arr = parseFloat((document.getElementById('wz-arr') || {}).value || 0);
      var moisEl = document.getElementById('wz-arr-mois');
      if (loyer > 0 && moisEl) moisEl.value = Math.round(arr / loyer);
    };
    window.IG.locataires._syncArrMontant = function() {
      var loyer = parseFloat((document.getElementById('wz-loyer') || {}).value || 0);
      var mois = parseInt((document.getElementById('wz-arr-mois') || {}).value || 0);
      var arrEl = document.getElementById('wz-arr');
      if (loyer > 0 && arrEl) arrEl.value = mois * loyer;
    };

    // Créer l'overlay
    var overlay = document.createElement('div');
    overlay.id = 'wz-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px';
    overlay.innerHTML = '<div style="background:var(--bg);border-radius:16px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto" id="wz-modal-body">' + _renderEtape(1) + '</div>';
    document.body.appendChild(overlay);
  }

  function _afficherFormulaireEdition(loc, onSuccess) {
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var immOptions = imms.map(function(i) {
      var sel = loc.immeuble_id == i.id ? ' selected' : '';
      return '<option value="' + i.id + '"' + sel + '>' + esc(i.nom_immeuble || i.nom) + '</option>';
    }).join('');

    var html = '<h3 style="margin-bottom:18px;font-size:16px">✏️ Modifier locataire</h3>' +
      '<form id="form-locataire">' +
      _field('nom', t('Nom complet'), loc.nom, true) +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      window.IG.utils.phoneField('telephone', t('Téléphone'), loc.telephone || '') +
      window.IG.utils.phoneField('whatsapp', 'WhatsApp', loc.whatsapp || '') +
      '</div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Immeuble') + ' *</label>' +
      '<select name="immeuble_id" required style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<option value="">' + t('Sélectionner...') + '</option>' + immOptions + '</select></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _field('appt', t('Local / Appt'), loc.appt || '') +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Type') + '</label>' +
      '<select name="type_local" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      ['appartement','studio','chambre','duplex','bureau','commerce'].map(function(tp) {
        return '<option value="' + tp + '"' + (loc.type_local === tp ? ' selected' : '') + '>' + tp + '</option>';
      }).join('') + '</select></div></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _fieldNum('loyer', t('Loyer (FCFA)'), loc.loyer || 0) +
      _fieldNum('caution', t('Caution'), loc.caution || 0) +
      '</div>' +
      _field('entree', t('Date entrée'), loc.entree || '', false, 'date') +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _fieldNum('arrieres', t('Arriérés (FCFA)'), loc.arrieres || 0) +
      _fieldNum('mois_arrieres', t('Nb mois arriérés'), loc.mois_arrieres || 0) +
      '</div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Observations') + '</label>' +
      '<textarea name="observations" rows="2" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text);resize:vertical">' + esc(loc.observations || '') + '</textarea></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">' +
      '<button type="button" onclick="window.IG.locataires._libererConfirm(' + loc.id + ')" data-modal-close style="padding:10px 16px;border-radius:8px;border:1px solid var(--red);color:var(--red);background:transparent;cursor:pointer;font-size:12px">' + t('Libérer') + '</button>' +
      '<button type="button" data-modal-close class="btn-secondary" style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer">' + t('Annuler') + '</button>' +
      '<button type="submit" style="padding:10px 20px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">' + t('Sauvegarder') + '</button>' +
      '</div></form>';

    var modal = window.IG.utils.showModal(html, { width: '540px' });
    modal.box.querySelector('#form-locataire').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var data = { ...loc };
      data.nom          = fd.get('nom');
      data.telephone    = fd.get('telephone');
      data.whatsapp     = fd.get('whatsapp');
      data.immeuble_id  = parseInt(fd.get('immeuble_id'));
      data.appt         = fd.get('appt');
      data.type_local   = fd.get('type_local');
      data.loyer        = parseFloat(fd.get('loyer')) || 0;
      data.caution      = parseFloat(fd.get('caution')) || 0;
      data.entree       = fd.get('entree');
      data.arrieres     = parseFloat(fd.get('arrieres')) || 0;
      data.mois_arrieres = parseInt(fd.get('mois_arrieres')) || 0;
      data.observations = fd.get('observations');
      try {
        await sauvegarder(data);
        modal.close();
        toast(t('Locataire sauvegardé'), 'green');
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
        if (typeof onSuccess === 'function') onSuccess();
      } catch(err) { toast(t('Erreur') + ': ' + err.message, 'red'); }
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
    if (tel.startsWith('0')) tel = tel.substring(1);
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

  function _getGlobalMenu() {
    var el = document.getElementById('loc-global-menu');
    if (!el) {
      el = document.createElement('div');
      el.id = 'loc-global-menu';
      el.className = 'action-dropdown';
      el.style.cssText = 'position:fixed;z-index:99999;display:none;flex-direction:column;min-width:200px;';
      document.body.appendChild(el);
      document.addEventListener('click', function(e) {
        if (!e.target.closest('#loc-global-menu') && !e.target.closest('.action-menu-btn')) {
          _closeMenus();
        }
      });
    }
    return el;
  }

  function _toggleMenu(btn, locId, hasTel) {
    var menu = _getGlobalMenu();
    var isOpen = menu.style.display === 'flex';
    _closeMenus();
    if (isOpen && menu._locId === locId) return;
    menu._locId = locId;
    menu.innerHTML =
      '<div class="action-dropdown-item" onclick="window.IG.paiements.afficherFormulaire(' + locId + ');window.IG.locataires._closeMenus()">💳 Paiement</div>' +
      '<div class="action-dropdown-item" onclick="window.IG.locataires.afficherFormulaire(' + locId + ');window.IG.locataires._closeMenus()">📝 Modifier</div>' +
      '<div class="action-dropdown-item" onclick="window.IG.locataires.afficherFiche(' + locId + ');window.IG.locataires._closeMenus()">📊 Fiche de suivi</div>' +
      (hasTel ? '<div class="action-dropdown-item" onclick="window.IG.locataires.envoyerAccesWA(' + locId + ');window.IG.locataires._closeMenus()">📲 Envoyer accès WhatsApp</div>' : '') +
      '<div class="action-dropdown-item" onclick="window.IG.juridique && window.IG.juridique.genererDocument(' + locId + ');window.IG.locataires._closeMenus()">📄 Documents</div>' +
      '<div class="action-dropdown-item" onclick="window.IG.juridique && window.IG.juridique.afficherEtatDesLieux(window.IG.locataires.getById(' + locId + '),\'entree\');window.IG.locataires._closeMenus()">🏠 État des lieux entrée</div>' +
      '<div class="action-dropdown-item" onclick="window.IG.juridique && window.IG.juridique.afficherEtatDesLieux(window.IG.locataires.getById(' + locId + '),\'sortie\');window.IG.locataires._closeMenus()">🔑 État des lieux sortie</div>' +
      '<div class="action-dropdown-item" onclick="window.IG.juridique && window.IG.juridique.deposerPlainte(window.IG.locataires.getById(' + locId + '));window.IG.locataires._closeMenus()">📋 Déposer une plainte</div>' +
      '<div class="action-dropdown-sep"></div>' +
      '<div class="action-dropdown-item danger" onclick="window.IG.locataires.liberer(' + locId + ');window.IG.locataires._closeMenus()">🔓 Libérer</div>' +
      '<div class="action-dropdown-item danger" onclick="window.IG.locataires.supprimer(' + locId + ');window.IG.locataires._closeMenus()">🗑️ Supprimer</div>';
    menu.style.display = 'flex';
    var btnRect = btn.getBoundingClientRect();
    menu.style.right = (window.innerWidth - btnRect.right) + 'px';
    menu.style.top = (btnRect.bottom + 4) + 'px';
    requestAnimationFrame(function() {
      var mH = menu.offsetHeight;
      if (btnRect.bottom + 4 + mH > window.innerHeight - 8) {
        menu.style.top = Math.max(8, btnRect.top - mH - 4) + 'px';
      }
    });
  }

  function _closeMenus() {
    var menu = document.getElementById('loc-global-menu');
    if (menu) menu.style.display = 'none';
  }

  function envoyerAccesWA(locId) {
    var loc = getById(locId);
    if (!loc) return;
    var tel = (loc.whatsapp || loc.telephone || '').replace(/\D/g,'');
    if (!tel) { window.IG.utils.showToast('Pas de numéro WhatsApp', 'red'); return; }
    if (tel.startsWith('0')) tel = tel.substring(1);
    var msg = 'Bonjour ' + loc.nom + ', voici votre accès au portail locataire ImmoGest : https://immogest-34w.pages.dev';
    window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
  }


  // ── Invitation automatique à la création d'un locataire ───────
  async function _genererInvitationLocataire(loc) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var WORKER  = (window.APP_CONFIG && window.APP_CONFIG.API_URL) || 'https://immogest1.fofefranklin57.workers.dev';
    var imm     = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    try {
      var res = await fetch(WORKER + '/generate-invite', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tenantId: session.tenantId, sessionToken: session.sessionToken || null, role: 'locataire', nom: loc.nom, telephone: loc.telephone, locataire_id: loc.id, immeuble_id: loc.immeuble_id || null })
      });
      var data = await res.json();
      if (!data.success) throw new Error(data.error || 'Erreur');
      var code = data.code;
      var tel  = (loc.whatsapp || loc.telephone || '').replace(/\s/g,'');
      var msg  = 'Bonjour ' + (loc.nom || '') + ' 👋\n' +
        'Votre espace locataire ImmoGest est prêt.\n' +
        (imm ? '🏢 Immeuble : ' + (imm.nom_immeuble || imm.nom) + '\n' : '') +
        '🏠 Local : ' + (loc.appt || '') + '\n' +
        '💰 Loyer : ' + window.IG.utils.formatMontant(loc.loyer || 0) + '/mois\n\n' +
        '📲 Connexion portail locataire :\n' +
        '• Login : *' + (loc.telephone || '') + '*\n' +
        '• Mot de passe : *' + code + '*\n' +
        'Téléchargez ImmoGest et connectez-vous avec votre numéro + ce mot de passe.';
      var waUrl = 'https://wa.me/' + (tel.startsWith('+') ? tel.slice(1) : tel.replace(/^0+/, '')) + '?text=' + encodeURIComponent(msg);

      window.IG.utils.showModal(
        '<div style="text-align:center;padding:8px 0 16px">' +
        '<div style="font-size:36px;margin-bottom:10px">🎉</div>' +
        '<h3 style="font-size:15px;margin-bottom:6px">' + t('Locataire ajouté !') + '</h3>' +
        '<p style="font-size:13px;color:var(--text3);margin-bottom:16px">' + esc(loc.nom) + ' — Local ' + esc(loc.appt || '?') + '</p>' +
        '<div style="background:var(--bg3);border-radius:12px;padding:16px;margin-bottom:16px">' +
        '<div style="font-size:11px;color:var(--text3);margin-bottom:8px">ACCÈS PORTAIL LOCATAIRE</div>' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
        '<span style="font-size:11px;color:var(--text3);min-width:50px">📱 Login</span>' +
        '<span style="font-family:monospace;font-size:13px;font-weight:700;color:var(--text)">' + esc(loc.telephone || '—') + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:11px;color:var(--text3);min-width:50px">🔑 MP</span>' +
        '<span style="font-family:monospace;font-size:26px;font-weight:900;letter-spacing:4px;color:var(--accent)">' + code + '</span></div>' +
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
    liberer, supprimer, renderListe, renderListeFiltree, afficherFormulaire, afficherFiche,
    lienWA, _libererConfirm, _toggleMenu, _closeMenus, envoyerAccesWA,
    _publierAnnonce, rafraichirFiche
  };

})();
