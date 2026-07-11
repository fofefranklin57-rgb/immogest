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
    // Table v1 `annonces` supprimée : on lit uniquement `marketplace_annonces`.
    try {
      return await db().select('marketplace_annonces', filters);
    } catch(e) {
      return [];
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

      // Annonces standard avec pubs toutes les 3 annonces
      var standardHtml = '';
      standard.forEach(function(a, i) {
        standardHtml += _carteAnnonce(a, false);
        // Pub après la 3e, 6e, 9e annonce...
        if ((i + 1) % 3 === 0) {
          var adId = 'ig-ad-mkt-' + i;
          standardHtml += '</div><div id="' + adId + '" style="grid-column:1/-1;margin:4px 0;text-align:center;min-height:90px"></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
          // Injection différée pour que le DOM existe
          (function(id, idx) {
            setTimeout(function() {
              // Alterner Adsterra et Monetag
              if (idx % 2 === 0) {
                window.IG.ads && window.IG.ads.injecterSlot(id, 'ad2');
              } else {
                window.IG.ads && window.IG.ads.injecterMonetag(id, 29679261);
              }
            }, 300);
          })(adId, Math.floor(i / 3));
        }
      });
      html += '<div class="mkt-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">' + standardHtml + '</div>';
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

    // Galerie photos standard
    var photosHtml = '';
    if (a.photos && a.photos.length) {
      photosHtml = '<div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px;padding-bottom:4px">' +
        a.photos.map(function(url) {
          return '<img src="' + esc(url) + '" style="height:120px;min-width:160px;object-fit:cover;border-radius:8px;flex-shrink:0">';
        }).join('') + '</div>';
    }

    // Viewer 360° Pannellum si photo_360 présente
    var viewer360Html = '';
    var viewer360Id   = 'pnl-' + a.id;
    if (a.photo_360) {
      viewer360Html =
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css">' +
        '<script src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"><\/script>' +
        '<div style="margin-bottom:14px">' +
        '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:6px">🔮 ' + t('Visite virtuelle 360°') + '</div>' +
        '<div id="' + viewer360Id + '" style="width:100%;height:240px;border-radius:10px;overflow:hidden"></div></div>';
    }

    var modal = window.IG.utils.showModal(
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">' +
      '<h3 style="font-size:15px;font-weight:700;flex:1">' + esc(a.titre) + '</h3>' +
      '<button data-modal-close style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +
      photosHtml +
      viewer360Html +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:12px">' + cat.icon + ' ' + cat.label + ' · ' + esc(a.ville || '') + ' · ' + (a.pays || 'CM') + '</div>' +
      '<div style="font-size:24px;font-weight:700;color:var(--accent);margin-bottom:12px">' + fmt(a.loyer) + t('/mois') + '</div>' +
      (a.description ? '<p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:16px">' + esc(a.description) + '</p>' : '') +
      '<div style="display:flex;gap:8px">' +
      '<a href="https://wa.me/?text=' + encodeURIComponent('Je suis intéressé par cette annonce : ' + a.titre + ' — ' + window.IG.utils.formatMontant(a.loyer || 0)) + '" target="_blank" ' +
      'style="flex:1;padding:10px;border-radius:8px;background:#25D366;color:#fff;font-weight:700;font-size:13px;text-align:center;text-decoration:none">📱 ' + t('Contacter') + '</a>' +
      '</div>',
      { width: '560px' }
    );

    // Initialiser Pannellum après injection DOM
    if (a.photo_360) {
      setTimeout(function() {
        if (typeof pannellum !== 'undefined' && document.getElementById(viewer360Id)) {
          pannellum.viewer(viewer360Id, {
            type:        'equirectangular',
            panorama:    a.photo_360,
            autoLoad:    true,
            showControls: true,
            hfov:        100
          });
        }
      }, 300);
    }
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

      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Photos') + ' <span style="font-weight:400;color:var(--text3)">(max 5 · JPG/PNG/WEBP · 5 Mo)</span></label>' +
      '<div id="mkt-photos-zone" style="margin-top:6px;border:2px dashed var(--border2);border-radius:10px;padding:16px;text-align:center;cursor:pointer;color:var(--text3);font-size:13px" onclick="document.getElementById(\'mkt-photo-input\').click()">' +
      '📷 ' + t('Cliquer pour ajouter des photos') + '</div>' +
      '<input type="file" id="mkt-photo-input" accept=".jpg,.jpeg,.png,.webp" multiple style="display:none">' +
      '<div id="mkt-photos-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div></div>' +

      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">🌐 ' + t('Photo 360° (visite virtuelle)') + ' <span style="font-weight:400;color:var(--text3)">(max 20 Mo)</span></label>' +
      '<div id="mkt-360-zone" style="margin-top:6px;border:2px dashed #7C3AED44;border-radius:10px;padding:14px;text-align:center;cursor:pointer;color:var(--text3);font-size:13px;background:var(--bg3)" onclick="document.getElementById(\'mkt-360-input\').click()">' +
      '🔮 ' + t('Ajouter une photo 360° équirectangulaire') + '</div>' +
      '<input type="file" id="mkt-360-input" accept=".jpg,.jpeg,.png" style="display:none">' +
      '<div id="mkt-360-preview" style="margin-top:8px"></div></div>' +

      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Annuler') + '</button>' +
      '<button id="mkt-save" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + t('Publier') + '</button>' +
      '</div></div>',
      { width: '520px' }
    );

    // ── Gestion photos standard (max 5 · 5 Mo · jpg/png/webp) ───
    var selectedFiles = [];
    var file360 = null;
    var photoInput    = modal.box.querySelector('#mkt-photo-input');
    var photosPreview = modal.box.querySelector('#mkt-photos-preview');
    var input360      = modal.box.querySelector('#mkt-360-input');
    var preview360    = modal.box.querySelector('#mkt-360-preview');
    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    var MAX_SIZE      = 5 * 1024 * 1024;   // 5 Mo
    var MAX_SIZE_360  = 20 * 1024 * 1024;  // 20 Mo

    function _addPhotoThumb(f, onRemove) {
      var div = document.createElement('div');
      div.style.cssText = 'position:relative;width:72px;height:72px';
      var img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.style.cssText = 'width:72px;height:72px;object-fit:cover;border-radius:8px;border:1px solid var(--border2)';
      var btn = document.createElement('button');
      btn.textContent = '×';
      btn.style.cssText = 'position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#e53e3e;color:#fff;font-size:12px;cursor:pointer;line-height:20px;padding:0';
      btn.addEventListener('click', function() { onRemove(); div.remove(); });
      div.appendChild(img); div.appendChild(btn);
      return div;
    }

    photoInput.addEventListener('change', function() {
      Array.from(this.files).forEach(function(f) {
        if (selectedFiles.length >= 5) { window.IG.utils.showToast(t('Maximum 5 photos'), 'orange'); return; }
        if (!ALLOWED_TYPES.includes(f.type)) { window.IG.utils.showToast(f.name + ' : format non supporté (JPG/PNG/WEBP)', 'red'); return; }
        if (f.size > MAX_SIZE) { window.IG.utils.showToast(f.name + ' : fichier trop lourd (max 5 Mo)', 'red'); return; }
        selectedFiles.push(f);
        var idx = selectedFiles.length - 1;
        photosPreview.appendChild(_addPhotoThumb(f, function() { selectedFiles.splice(idx, 1); }));
      });
      this.value = '';
    });

    // ── Gestion photo 360° ────────────────────────────────────────
    input360.addEventListener('change', function() {
      var f = this.files[0];
      if (!f) return;
      if (!['image/jpeg', 'image/png'].includes(f.type)) { window.IG.utils.showToast('Format 360° : JPG ou PNG uniquement', 'red'); return; }
      if (f.size > MAX_SIZE_360) { window.IG.utils.showToast('Photo 360° trop lourde (max 20 Mo)', 'red'); return; }
      file360 = f;
      preview360.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg3);border-radius:8px;font-size:12px;color:var(--text2)';
      wrap.innerHTML = '🔮 <span style="flex:1">' + f.name + ' (' + (f.size/1024/1024).toFixed(1) + ' Mo)</span>';
      var rm = document.createElement('button');
      rm.textContent = '×';
      rm.style.cssText = 'border:none;background:none;color:var(--red);font-size:16px;cursor:pointer;padding:0';
      rm.addEventListener('click', function() { file360 = null; preview360.innerHTML = ''; });
      wrap.appendChild(rm);
      preview360.appendChild(wrap);
      this.value = '';
    });

    modal.box.querySelector('#mkt-save').addEventListener('click', async function() {
      var titre = modal.box.querySelector('#mkt-titre').value.trim();
      if (!titre) { window.IG.utils.showToast(t('Le titre est requis'), 'red'); return; }
      var btn = this;
      btn.disabled = true;
      btn.textContent = t('Publication...');
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      try {
        var result = await db().insert('marketplace_annonces', {
          titre,
          categorie:   modal.box.querySelector('#mkt-cat').value,
          loyer:       parseFloat(modal.box.querySelector('#mkt-loyer').value) || 0,
          ville:       modal.box.querySelector('#mkt-ville').value,
          quartier:    modal.box.querySelector('#mkt-qrt').value,
          description: modal.box.querySelector('#mkt-desc').value,
          pays:        (session.locale && session.locale.pays) || 'CM',
          devise:      (session.locale && session.locale.devise) || 'XAF',
          statut:      'active'
        });
        var annonce = Array.isArray(result) ? result[0] : result;

        if (annonce && annonce.id) {
          var updates = {};

          // Upload photos standard
          if (selectedFiles.length) {
            var urls = await Promise.all(selectedFiles.map(function(f) {
              return db().uploadPhoto(f, 'annonces/' + annonce.id).catch(function(e) { console.warn(e.message); return null; });
            }));
            var validUrls = urls.filter(Boolean);
            if (validUrls.length) updates.photos = validUrls;
          }

          // Upload photo 360°
          if (file360) {
            var url360 = await db().uploadPhoto(file360, 'annonces360/' + annonce.id).catch(function(e) { console.warn(e.message); return null; });
            if (url360) updates.photo_360 = url360;
          }

          if (Object.keys(updates).length) {
            await db().update('marketplace_annonces', annonce.id, updates).catch(function() {});
          }
        }

        modal.close();
        window.IG.utils.showToast(t('Annonce publiée !'), 'green');
        renderPage();
      } catch(e) {
        btn.disabled = false;
        btn.textContent = t('Publier');
        window.IG.utils.showToast(t('Erreur') + ': ' + e.message, 'red');
      }
    });
  }

  return { renderPage, getAnnonces, publierDepuisLocal, afficherFormulaire, voirAnnonce, _filtrer };

})();
