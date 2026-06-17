// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Marketplace multi-pays
//  Prompt 1 adapté : Marketplace mondiale — location, vente, luxe...
//  Architecture : multi-pays, catégories, premium, enchères (Phase 3)
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.marketplace = (function() {

  function t(k) { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }
  function db()  { return window.IG.db; }

  var CATEGORIES_RAW = {
    location_residentielle: { labelKey: 'Location résidentielle', icon: '🏠' },
    location_commerciale:   { labelKey: 'Local commercial',       icon: '🏪' },
    bureau:                 { labelKey: 'Bureau',                 icon: '🏢' },
    colocation:             { labelKey: 'Colocation',             icon: '👥' },
    location_saisonniere:   { labelKey: 'Location saisonnière',   icon: '🌴' },
    vente:                  { labelKey: 'Vente',                  icon: '🔑' },
    luxe:                   { labelKey: 'Prestige & Luxe',        icon: '💎' },
    professionnel:          { labelKey: 'Professionnel',          icon: '🏭' }
  };

  function CATEGORIES() {
    var result = {};
    Object.keys(CATEGORIES_RAW).forEach(function(k) {
      result[k] = { label: t(CATEGORIES_RAW[k].labelKey), icon: CATEGORIES_RAW[k].icon };
    });
    return result;
  }

  var PAYS_DEVISES = {
    CM: { label: 'Cameroun',     devise: 'XAF',  symbol: 'FCFA' },
    SN: { label: 'Sénégal',      devise: 'XOF',  symbol: 'FCFA' },
    CI: { label: "Côte d'Ivoire",devise: 'XOF',  symbol: 'FCFA' },
    GA: { label: 'Gabon',        devise: 'XAF',  symbol: 'FCFA' },
    MR: { label: 'Maroc',        devise: 'MAD',  symbol: 'MAD'  },
    TN: { label: 'Tunisie',      devise: 'TND',  symbol: 'TND'  },
    FR: { label: 'France',       devise: 'EUR',  symbol: '€'    },
    BE: { label: 'Belgique',     devise: 'EUR',  symbol: '€'    }
  };

  // ── Charger annonces ──────────────────────────────────────────
  async function getAnnonces(filters) {
    try {
      // Essayer marketplace_annonces, fallback sur annonces (v1)
      var res = await db().select('marketplace_annonces', filters);
      if (res.length === 0 && !filters) {
        res = await db().select('annonces', filters).catch(function() { return []; });
      }
      return res;
    } catch(e) {
      try {
        return await db().select('annonces', filters);
      } catch(e2) {
        return [];
      }
    }
  }

  // ── Créer annonce depuis un local libre ───────────────────────
  async function publierDepuisLocal(loc, imm) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var annonce = {
      immeuble_id:  imm ? imm.id : null,
      titre:        (imm ? (imm.nom_immeuble || imm.nom) + ' — ' : '') + 'Local ' + (loc.appt || '') + ' disponible',
      description:  'Local disponible à ' + (imm ? (imm.quartier || '') + ' ' + (imm.ville || '') : '') + '. ' + (loc.type_local || 'Appartement') + '.',
      loyer:        loc.loyer || 0,
      ville:        imm ? imm.ville : '',
      quartier:     imm ? imm.quartier : '',
      pays:         (session.locale && session.locale.pays) || 'CM',
      devise:       (session.locale && session.locale.devise) || 'XAF',
      type_local:   loc.type_local || 'appartement',
      categorie:    'location_residentielle',
      statut:       'active'
    };
    try {
      var result = await db().insert('marketplace_annonces', annonce);
      window.IG.utils.showToast('Annonce publiée sur la marketplace', 'green');
      return result[0];
    } catch(e) {
      window.IG.utils.showToast('Erreur publication: ' + e.message, 'red');
      return null;
    }
  }

  // ── Render page marketplace ───────────────────────────────────
  async function renderPage() {
    var content = document.getElementById('page-content');
    if (!content) return;

    content.innerHTML = '<div class="content"><div style="text-align:center;padding:40px;color:var(--text3)"><div style="font-size:32px">🏪</div><p>' + t('Chargement marketplace...') + '</p></div></div>';

    var annonces = await getAnnonces();
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var paysSession = (session.locale && session.locale.pays) || 'CM';

    // Séparer premium et standard (Prompt 1 : premium_niveau)
    var premium  = annonces.filter(function(a) { return a.premium || a.premium_niveau > 0; });
    var standard = annonces.filter(function(a) { return !a.premium && !a.premium_niveau; });

    var html = '<div class="content">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">' +
      '<h2 style="font-size:17px;font-weight:700">🏪 Marketplace ImmoGest</h2>' +
      '<div style="display:flex;gap:8px">' +
      '<button onclick="window.IG.marketplace.afficherFormulaire()" style="padding:9px 16px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">+ ' + t('Publier une annonce') + '</button>' +
      '</div></div>' +

      // Filtres catégories
      '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;flex-wrap:nowrap">' +
      '<button onclick="window.IG.marketplace._filtrer(\'tous\')" style="padding:6px 14px;border-radius:99px;border:1px solid var(--border2);background:var(--accent);color:#fff;cursor:pointer;font-size:12px;white-space:nowrap;font-weight:600">' + t('Tout') + '</button>' +
      Object.entries(CATEGORIES()).map(function(entry) {
        return '<button onclick="window.IG.marketplace._filtrer(\'' + entry[0] + '\')" style="padding:6px 14px;border-radius:99px;border:1px solid var(--border2);background:var(--bg4);color:var(--text2);cursor:pointer;font-size:12px;white-space:nowrap">' + entry[1].icon + ' ' + entry[1].label + '</button>';
      }).join('') +
      '</div>';

    if (!annonces.length) {
      html += '<div class="card" style="text-align:center;padding:60px 20px;color:var(--text3)">' +
        '<div style="font-size:48px;margin-bottom:12px">🏠</div>' +
        '<p style="font-size:16px;font-weight:600;margin-bottom:8px">' + t('Aucune annonce publiée') + '</p>' +
        '<p style="font-size:13px;margin-bottom:20px">' + t('Publiez des annonces pour vos locaux disponibles') + '</p>' +
        '<button onclick="window.IG.marketplace.afficherFormulaire()" style="padding:10px 24px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600">+ ' + t('Publier une annonce') + '</button>' +
        '</div>' +
        '<div id="ig-ad-marketplace" style="margin-top:16px;text-align:center"></div>';
    } else {
      // Annonces premium (Prompt 1 : niveaux de visibilité)
      if (premium.length) {
        html += '<div style="margin-bottom:16px">' +
          '<div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px;display:flex;align-items:center;gap:6px">' +
          '<span style="background:linear-gradient(135deg,#F59E0B,#EF4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:14px">⭐</span>' +
          + t('ANNONCES PREMIUM') + '</div>' +
          '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">' +
          premium.map(function(a) { return _carteAnnonce(a, true); }).join('') +
          '</div></div>';
      }

      // Slot pub entre premium et standard
      html += '<div id="ig-ad-marketplace" style="margin:8px 0 16px;text-align:center"></div>';

      // Annonces standard
      html += '<div class="mkt-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">' +
        standard.map(function(a) { return _carteAnnonce(a, false); }).join('') +
        '</div>';
    }

    html += '</div>';
    content.innerHTML = html;
    window._mktAnnonces = annonces;
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-marketplace', 'ad1');
  }

  function _carteAnnonce(a, isPremium) {
    var _cats = CATEGORIES();
    var cat = _cats[a.categorie] || { icon: '🏠', label: a.categorie || 'Location' };
    var paysInfo = PAYS_DEVISES[a.pays] || PAYS_DEVISES.CM;
    var photo = (a.photos && a.photos[0]) || null;

    return '<div class="card" style="padding:0;overflow:hidden;cursor:pointer;transition:box-shadow .2s;' +
      (isPremium ? 'border:2px solid #F59E0B;box-shadow:0 4px 16px rgba(245,158,11,.15)' : '') + '" ' +
      'onclick="window.IG.marketplace.voirAnnonce(' + a.id + ')">' +

      // Photo ou placeholder
      '<div style="height:140px;background:' + (photo ? 'url(' + esc(photo) + ') center/cover' : 'linear-gradient(135deg,var(--bg3),var(--bg4))') + ';position:relative;display:flex;align-items:flex-end;padding:8px">' +
      (isPremium ? '<span style="position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px">⭐ PREMIUM</span>' : '') +
      '<span style="background:rgba(0,0,0,.55);color:#fff;font-size:11px;padding:2px 8px;border-radius:99px">' + cat.icon + ' ' + cat.label + '</span>' +
      '</div>' +

      '<div style="padding:12px">' +
      '<div style="font-weight:700;font-size:13px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(a.titre) + '</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:8px">' + esc(a.ville || '') + (a.quartier ? ' — ' + esc(a.quartier) : '') + ' · ' + (a.pays || 'CM') + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<div style="font-size:16px;font-weight:700;color:var(--accent)">' + fmt(a.loyer) + '</div>' +
      '<div style="font-size:11px;color:var(--text3)">' + (a.vues || 0) + ' ' + t('vues') + '</div>' +
      '</div></div></div>';
  }

  function _filtrer(categorie) {
    var annonces = window._mktAnnonces || [];
    var filtrees = categorie === 'tous' ? annonces : annonces.filter(function(a) { return a.categorie === categorie; });
    // Re-render uniquement la grille
    var grid = document.querySelector('.content .mkt-grid');
    if (grid) {
      grid.innerHTML = filtrees.map(function(a) { return _carteAnnonce(a, a.premium); }).join('');
    }
  }

  function voirAnnonce(id) {
    var annonces = window._mktAnnonces || [];
    var a = annonces.find(function(x) { return x.id == id; });
    if (!a) return;
    var _cats = CATEGORIES();
    var cat = _cats[a.categorie] || { icon: '🏠', label: '' };

    window.IG.utils.showModal(
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">' +
      '<h3 style="font-size:15px;font-weight:700;flex:1">' + esc(a.titre) + '</h3>' +
      '<button data-modal-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">' + cat.icon + ' ' + cat.label + ' · ' + esc(a.ville || '') + ' · ' + (a.pays || 'CM') + '</div>' +
      '<div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:12px">' + fmt(a.loyer) + t('/mois') + '</div>' +
      (a.description ? '<p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:16px">' + esc(a.description) + '</p>' : '') +
      '<div style="display:flex;gap:8px">' +
      '<a href="https://wa.me/?text=' + encodeURIComponent('Je suis intéressé par cette annonce : ' + a.titre + ' — ' + (a.loyer || '') + ' FCFA') + '" target="_blank" ' +
      'style="flex:1;padding:10px;border-radius:8px;background:#25D366;color:#fff;font-weight:700;font-size:13px;text-align:center;text-decoration:none">📱 ' + t('Contacter') + '</a>' +
      '</div>',
      { width: '500px' }
    );
  }

  // ── Formulaire publication ────────────────────────────────────
  function afficherFormulaire(immeubleId) {
    var immeubles = window.IG.app ? window.IG.app.getData().immeubles : [];

    var modal = window.IG.utils.showModal(
      '<h3 style="margin-bottom:16px;font-size:15px;font-weight:700">🏪 ' + t('Publier une annonce') + '</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +

      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Titre *') + '</label>' +
      '<input id="mkt-titre" placeholder="Ex: Appartement 3 pièces disponible" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Catégorie') + '</label>' +
      '<select id="mkt-cat" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      Object.entries(CATEGORIES()).map(function(e) { return '<option value="' + e[0] + '">' + e[1].icon + ' ' + e[1].label + '</option>'; }).join('') +
      '</select></div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Loyer/Prix') + '</label>' +
      '<input id="mkt-loyer" type="number" placeholder="0" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Ville') + '</label>' +
      '<input id="mkt-ville" placeholder="Douala" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Quartier') + '</label>' +
      '<input id="mkt-qrt" placeholder="Bastos" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +
      '</div>' +

      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Description') + '</label>' +
      '<textarea id="mkt-desc" rows="3" placeholder="Décrivez le bien..." style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;resize:vertical;margin-top:4px"></textarea></div>' +

      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Annuler') + '</button>' +
      '<button id="mkt-save" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + t('Publier') + '</button>' +
      '</div></div>',
      { width: '520px' }
    );

    modal.box.querySelector('#mkt-save').addEventListener('click', async function() {
      var titre = modal.box.querySelector('#mkt-titre').value.trim();
      if (!titre) { window.IG.utils.showToast(t('Le titre est requis'), 'red'); return; }
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      await db().insert('marketplace_annonces', {
        titre,
        categorie: modal.box.querySelector('#mkt-cat').value,
        loyer:     parseFloat(modal.box.querySelector('#mkt-loyer').value) || 0,
        ville:     modal.box.querySelector('#mkt-ville').value,
        quartier:  modal.box.querySelector('#mkt-qrt').value,
        description: modal.box.querySelector('#mkt-desc').value,
        pays:      (session.locale && session.locale.pays) || 'CM',
        devise:    (session.locale && session.locale.devise) || 'XAF',
        statut:    'active'
      }).catch(function(e) {
        // Fallback sur table annonces si marketplace_annonces n'existe pas encore
        return db().insert('annonces', { titre, loyer: parseFloat(modal.box.querySelector('#mkt-loyer').value) || 0 });
      });
      modal.close();
      window.IG.utils.showToast(t('Annonce publiée !'), 'green');
      renderPage();
    });
  }

  return { renderPage, getAnnonces, publierDepuisLocal, afficherFormulaire, voirAnnonce, _filtrer };

})();
