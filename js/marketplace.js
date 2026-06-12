// ═══════════════════════════════════════════════════════════════
// MARKETPLACE IMMOGEST — Annonces de location
// Appartements, maisons, studios, hôtels, meublés, commerciaux
// ═══════════════════════════════════════════════════════════════

var _mkPage = 1;
var _mkFilters = {};
var _mkFavoris = JSON.parse(localStorage.getItem('immogest_favoris') || '[]');
var _mkAnnonces = [];

// ── Supabase helpers ───────────────────────────────────────────
async function mkLoadAnnonces(filters) {
  try {
    var q = _sb.from('annonces').select('*').eq('actif', true).order('date_publication', { ascending: false });
    if (filters.ville)     q = q.ilike('ville', '%' + filters.ville + '%');
    if (filters.type)      q = q.eq('type', filters.type);
    if (filters.meuble !== undefined && filters.meuble !== '') q = q.eq('meuble', filters.meuble === 'true');
    if (filters.prix_max)  q = q.lte('prix', parseInt(filters.prix_max));
    if (filters.prix_min)  q = q.gte('prix', parseInt(filters.prix_min));
    if (filters.chambres)  q = q.gte('nb_chambres', parseInt(filters.chambres));
    var { data, error } = await q.limit(60);
    if (error) throw error;
    return data || [];
  } catch(e) { console.warn('mkLoadAnnonces:', e.message); return []; }
}

async function mkLoadAnnonce(id) {
  try {
    var { data } = await _sb.from('annonces').select('*').eq('id', id).single();
    return data;
  } catch(e) { return null; }
}

async function mkInsertAnnonce(row) {
  try {
    var { data, error } = await _sb.from('annonces').insert(row).select().single();
    if (error) throw error;
    return data;
  } catch(e) { console.warn('mkInsertAnnonce:', e.message); return null; }
}

async function mkUpdateAnnonce(id, updates) {
  try {
    var { error } = await _sb.from('annonces').update(updates).eq('id', id);
    return !error;
  } catch(e) { return false; }
}

async function mkDeleteAnnonce(id) {
  try {
    await _sb.from('annonces').update({ actif: false }).eq('id', id);
    return true;
  } catch(e) { return false; }
}

async function mkIncrementVues(id) {
  try { await _sb.rpc('increment_annonce_vues', { annonce_id: id }); } catch(e) {}
}

async function mkLoadMesAnnonces() {
  if (!window.SESSION) return [];
  try {
    var { data } = await _sb.from('annonces').select('*')
      .eq('tenant_id', SESSION.tenantId).order('date_publication', { ascending: false });
    return data || [];
  } catch(e) { return []; }
}

// ── Favoris (localStorage) ─────────────────────────────────────
function mkToggleFavori(id) {
  var idx = _mkFavoris.indexOf(id);
  if (idx >= 0) _mkFavoris.splice(idx, 1);
  else _mkFavoris.push(id);
  localStorage.setItem('immogest_favoris', JSON.stringify(_mkFavoris));
  var btn = document.querySelector('[data-favori="' + id + '"]');
  if (btn) btn.textContent = _mkFavoris.includes(id) ? '❤️' : '🤍';
}

// ── Rendu principal marketplace ────────────────────────────────
async function renderMarketplace() {
  var pg = document.getElementById('content');
  if (!pg) return;
  document.getElementById('page-title').textContent = '🏘️ Marketplace';
  document.getElementById('page-sub').textContent = 'Trouvez votre logement idéal';

  pg.innerHTML = `
  <div style="max-width:1100px;margin:0 auto;">

    <!-- Barre de recherche + filtres -->
    <div style="background:var(--surface);border-radius:14px;padding:16px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:flex-end;">
        <div style="flex:2;min-width:160px;">
          <label style="font-size:11px;font-weight:600;color:var(--text3);display:block;margin-bottom:4px;">📍 Ville / Quartier</label>
          <input id="mk-ville" placeholder="Douala, Yaoundé…" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;box-sizing:border-box;background:var(--surface2);">
        </div>
        <div style="flex:1;min-width:130px;">
          <label style="font-size:11px;font-weight:600;color:var(--text3);display:block;margin-bottom:4px;">🏠 Type</label>
          <select id="mk-type" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface2);">
            <option value="">Tous types</option>
            <option value="appartement">Appartement</option>
            <option value="maison">Maison</option>
            <option value="studio">Studio</option>
            <option value="chambre">Chambre</option>
            <option value="meuble">Meublé</option>
            <option value="hotel">Hôtel / Résidence</option>
            <option value="commercial">Local commercial</option>
          </select>
        </div>
        <div style="flex:1;min-width:120px;">
          <label style="font-size:11px;font-weight:600;color:var(--text3);display:block;margin-bottom:4px;">💰 Prix max (FCFA)</label>
          <input id="mk-prix-max" type="number" placeholder="200 000" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;box-sizing:border-box;background:var(--surface2);">
        </div>
        <div style="flex:1;min-width:110px;">
          <label style="font-size:11px;font-weight:600;color:var(--text3);display:block;margin-bottom:4px;">🛏 Chambres min</label>
          <select id="mk-chambres" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface2);">
            <option value="">Peu importe</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div style="flex:1;min-width:110px;">
          <label style="font-size:11px;font-weight:600;color:var(--text3);display:block;margin-bottom:4px;">🪑 Meublé</label>
          <select id="mk-meuble" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--surface2);">
            <option value="">Peu importe</option>
            <option value="true">Meublé</option>
            <option value="false">Non meublé</option>
          </select>
        </div>
        <button onclick="mkRechercher()" style="padding:10px 20px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;white-space:nowrap;">🔍 Chercher</button>
      </div>
    </div>

    <!-- Bouton publier (si connecté admin/gestionnaire) -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div id="mk-count" style="font-size:13px;color:var(--text3);"></div>
      <div style="display:flex;gap:8px;">
        <button onclick="mkVoirMesAnnonces()" style="padding:8px 14px;border:1px solid var(--border);background:var(--surface);border-radius:8px;cursor:pointer;font-size:13px;">📋 Mes annonces</button>
        <button onclick="mkOuvrirFormPublier()" style="padding:8px 14px;background:#10b981;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;">+ Publier une annonce</button>
      </div>
    </div>

    <!-- Grille des annonces -->
    <div id="mk-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
      <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);">⏳ Chargement des annonces…</div>
    </div>

  </div>`;

  await mkRechercher();
}

async function mkRechercher() {
  _mkFilters = {
    ville:    (document.getElementById('mk-ville') || {}).value || '',
    type:     (document.getElementById('mk-type') || {}).value || '',
    prix_max: (document.getElementById('mk-prix-max') || {}).value || '',
    chambres: (document.getElementById('mk-chambres') || {}).value || '',
    meuble:   (document.getElementById('mk-meuble') || {}).value || '',
  };
  var grid = document.getElementById('mk-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text3);">⏳ Chargement…</div>';

  _mkAnnonces = await mkLoadAnnonces(_mkFilters);
  var cnt = document.getElementById('mk-count');
  if (cnt) cnt.textContent = _mkAnnonces.length + ' annonce' + (_mkAnnonces.length > 1 ? 's' : '') + ' trouvée' + (_mkAnnonces.length > 1 ? 's' : '');

  if (!_mkAnnonces.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text3);">
      <div style="font-size:48px;margin-bottom:12px;">🏘️</div>
      <div style="font-size:16px;font-weight:600;">Aucune annonce disponible</div>
      <div style="font-size:13px;margin-top:8px;">Soyez le premier à publier un bien !</div>
      <button onclick="mkOuvrirFormPublier()" style="margin-top:16px;padding:12px 24px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">+ Publier une annonce</button>
    </div>`;
    return;
  }
  grid.innerHTML = _mkAnnonces.map(mkCardHtml).join('');
}

function mkCardHtml(a) {
  var photo = (a.photos && a.photos.length) ? a.photos[0] : '';
  var isFavori = _mkFavoris.includes(a.id);
  var badgeVerif = a.badge_verifie ? '<span style="background:#dcfce7;color:#166534;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;">✓ Vérifié</span>' : '';
  var badgeDispo = a.disponible !== false ? '<span style="background:#dbeafe;color:#1d4ed8;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;">● Disponible</span>' : '<span style="background:#fee2e2;color:#dc2626;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;">● Loué</span>';
  var typeLabel = { appartement:'Appartement', maison:'Maison', studio:'Studio', chambre:'Chambre', meuble:'Meublé', hotel:'Hôtel/Résidence', commercial:'Local commercial' }[a.type] || a.type;
  var periode = a.periode === 'jour' ? '/jour' : a.periode === 'an' ? '/an' : '/mois';

  return `<div style="background:var(--surface);border-radius:12px;overflow:hidden;box-shadow:0 1px 6px rgba(0,0,0,0.08);transition:transform 0.15s,box-shadow 0.15s;cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='';this.style.boxShadow='0 1px 6px rgba(0,0,0,0.08)'">
    <!-- Photo -->
    <div style="position:relative;height:180px;background:#e2e8f0;overflow:hidden;" onclick="mkOuvrirAnnonce(${a.id})">
      ${photo ? `<img src="${photo}" alt="${a.titre}" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" onerror="this.style.display='none'">` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;">🏠</div>'}
      <button data-favori="${a.id}" onclick="event.stopPropagation();mkToggleFavori(${a.id})" style="position:absolute;top:10px;right:10px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:34px;height:34px;font-size:16px;cursor:pointer;">${isFavori ? '❤️' : '🤍'}</button>
      <div style="position:absolute;bottom:8px;left:8px;display:flex;gap:4px;flex-wrap:wrap;">${badgeDispo}${badgeVerif}</div>
      ${a.prix_negociable ? '<div style="position:absolute;top:10px;left:10px;background:rgba(245,158,11,0.9);color:#fff;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700;">Prix négociable</div>' : ''}
    </div>
    <!-- Infos -->
    <div style="padding:14px;" onclick="mkOuvrirAnnonce(${a.id})">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">${typeLabel} · ${a.ville || ''}${a.quartier ? ' · ' + a.quartier : ''}</div>
      <div style="font-size:14px;font-weight:700;color:var(--text);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.titre || 'Sans titre'}</div>
      <div style="font-size:18px;font-weight:900;color:#0E6AAF;margin-bottom:8px;">${(a.prix||0).toLocaleString('fr-FR')} <span style="font-size:12px;font-weight:600;color:var(--text3);">FCFA${periode}</span></div>
      <div style="display:flex;gap:12px;font-size:12px;color:var(--text3);">
        ${a.nb_chambres ? '<span>🛏 ' + a.nb_chambres + ' ch.</span>' : ''}
        ${a.surface ? '<span>📐 ' + a.surface + ' m²</span>' : ''}
        ${a.meuble ? '<span>🪑 Meublé</span>' : ''}
        ${a.climatise ? '<span>❄️ Clim</span>' : ''}
      </div>
    </div>
    <!-- Contact rapide -->
    <div style="padding:0 14px 14px;display:flex;gap:8px;">
      <button onclick="mkContactWhatsApp(${JSON.stringify(a).replace(/"/g,'&quot;')})" style="flex:1;padding:8px;background:#25d366;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;">💬 WhatsApp</button>
      <button onclick="mkOuvrirAnnonce(${a.id})" style="flex:1;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;">Voir détails</button>
    </div>
  </div>`;
}

// ── Détail annonce ─────────────────────────────────────────────
async function mkOuvrirAnnonce(id) {
  var a = _mkAnnonces.find(x => x.id === id) || await mkLoadAnnonce(id);
  if (!a) return;
  mkIncrementVues(id);

  var photos = a.photos || [];
  var periode = a.periode === 'jour' ? '/jour' : a.periode === 'an' ? '/an' : '/mois';
  var typeLabel = { appartement:'Appartement', maison:'Maison', studio:'Studio', chambre:'Chambre', meuble:'Meublé', hotel:'Hôtel/Résidence', commercial:'Local commercial' }[a.type] || a.type;

  var overlay = document.createElement('div');
  overlay.id = 'mk-detail-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9900;background:rgba(0,0,0,0.7);overflow-y:auto;';
  overlay.innerHTML = `
    <div style="max-width:720px;margin:20px auto;background:var(--surface,#fff);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <!-- Photos galerie -->
      <div style="position:relative;height:260px;background:#e2e8f0;">
        ${photos.length ? `<img id="mk-main-photo" src="${photos[0]}" style="width:100%;height:100%;object-fit:cover;" alt="${a.titre}">` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;">🏠</div>'}
        <button onclick="document.getElementById(\'mk-detail-overlay\').remove()" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;">✕</button>
        ${a.badge_verifie ? '<div style="position:absolute;top:12px;left:12px;background:#22c55e;color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;">✓ Propriétaire vérifié</div>' : ''}
      </div>
      ${photos.length > 1 ? `<div style="display:flex;gap:6px;padding:10px;overflow-x:auto;">${photos.map((p,i)=>`<img src="${p}" onclick="document.getElementById('mk-main-photo').src='${p}'" style="width:70px;height:50px;object-fit:cover;border-radius:6px;cursor:pointer;flex-shrink:0;${i===0?'border:2px solid #0E6AAF':''}" loading="lazy">`).join('')}</div>` : ''}

      <div style="padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:16px;">
          <div>
            <div style="font-size:12px;color:var(--text3);margin-bottom:4px;">${typeLabel} · ${a.ville || ''}${a.quartier ? ' · ' + a.quartier : ''}</div>
            <h2 style="margin:0;font-size:20px;font-weight:800;">${a.titre || 'Sans titre'}</h2>
          </div>
          <div style="text-align:right;">
            <div style="font-size:26px;font-weight:900;color:#0E6AAF;">${(a.prix||0).toLocaleString('fr-FR')} FCFA</div>
            <div style="font-size:12px;color:var(--text3);">${periode}${a.prix_negociable ? ' · <span style="color:#f59e0b;font-weight:700;">Prix négociable</span>' : ''}</div>
          </div>
        </div>

        <!-- Caractéristiques -->
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:16px;">
          ${a.nb_chambres ? `<div style="background:var(--surface2);border-radius:8px;padding:8px 12px;font-size:13px;">🛏 <b>${a.nb_chambres}</b> chambre${a.nb_chambres>1?'s':''}</div>` : ''}
          ${a.nb_sdb ? `<div style="background:var(--surface2);border-radius:8px;padding:8px 12px;font-size:13px;">🚿 <b>${a.nb_sdb}</b> salle${a.nb_sdb>1?'s':''} de bain</div>` : ''}
          ${a.surface ? `<div style="background:var(--surface2);border-radius:8px;padding:8px 12px;font-size:13px;">📐 <b>${a.surface}</b> m²</div>` : ''}
          ${a.nb_pieces ? `<div style="background:var(--surface2);border-radius:8px;padding:8px 12px;font-size:13px;">🏠 <b>${a.nb_pieces}</b> pièce${a.nb_pieces>1?'s':''}</div>` : ''}
          ${a.meuble ? `<div style="background:#fef9c3;border-radius:8px;padding:8px 12px;font-size:13px;">🪑 Meublé</div>` : ''}
          ${a.climatise ? `<div style="background:#dbeafe;border-radius:8px;padding:8px 12px;font-size:13px;">❄️ Climatisé</div>` : ''}
          ${a.gardien ? `<div style="background:#f0fdf4;border-radius:8px;padding:8px 12px;font-size:13px;">👮 Gardien</div>` : ''}
          ${a.parking ? `<div style="background:#f0fdf4;border-radius:8px;padding:8px 12px;font-size:13px;">🚗 Parking</div>` : ''}
        </div>

        <!-- Description -->
        ${a.description ? `<div style="margin-bottom:16px;"><div style="font-weight:700;font-size:14px;margin-bottom:8px;">📝 Description</div><div style="font-size:13px;line-height:1.7;color:var(--text2);white-space:pre-line;">${a.description}</div></div>` : ''}

        <!-- Disponibilité -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:12px;background:var(--surface2);border-radius:8px;">
          <span style="font-size:20px;">${a.disponible !== false ? '✅' : '🔴'}</span>
          <span style="font-size:13px;font-weight:600;">${a.disponible !== false ? 'Disponible immédiatement' : 'Actuellement loué'}</span>
          ${a.date_disponibilite ? `<span style="font-size:12px;color:var(--text3);">· Dispo le ${new Date(a.date_disponibilite).toLocaleDateString('fr-FR')}</span>` : ''}
        </div>

        <!-- Contact -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${a.whatsapp ? `<button onclick="mkContactWhatsApp(${JSON.stringify(a).replace(/"/g,'&quot;')})" style="flex:1;min-width:140px;padding:14px;background:#25d366;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:15px;font-weight:700;">💬 Contacter sur WhatsApp</button>` : ''}
          <button onclick="mkPartagerAnnonce(${a.id},'${(a.titre||'').replace(/'/g,"\\\'")}')" style="padding:14px 18px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;cursor:pointer;font-size:14px;">🔗 Partager</button>
          <button data-favori="${a.id}" onclick="mkToggleFavori(${a.id})" style="padding:14px 18px;background:var(--surface2);border:1px solid var(--border);border-radius:10px;cursor:pointer;font-size:14px;">${_mkFavoris.includes(a.id)?'❤️':'🤍'}</button>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--text3);text-align:center;">👁 ${a.vues||0} vue${(a.vues||0)>1?'s':''} · Publiée le ${a.date_publication ? new Date(a.date_publication).toLocaleDateString('fr-FR') : '–'}</div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.scrollTop = 0;
}

function mkContactWhatsApp(a) {
  if (typeof a === 'string') try { a = JSON.parse(a); } catch(e) {}
  var tel = (a.whatsapp || '').replace(/[^0-9]/g,'');
  if (!tel) { alert('Numéro WhatsApp non disponible pour cette annonce.'); return; }
  if (tel.length === 9) tel = '237' + tel;
  var msg = 'Bonjour, je suis intéressé(e) par votre annonce sur ImmoGest :\n\n'
    + '📌 *' + (a.titre || 'Bien immobilier') + '*\n'
    + '📍 ' + (a.ville || '') + (a.quartier ? ' · ' + a.quartier : '') + '\n'
    + '💰 ' + (a.prix||0).toLocaleString('fr-FR') + ' FCFA\n\n'
    + 'Est-il toujours disponible ?';
  window.open('https://wa.me/' + tel + '?text=' + encodeURIComponent(msg), '_blank');
}

function mkPartagerAnnonce(id, titre) {
  var url = 'https://immogest-34w.pages.dev/?annonce=' + id;
  var text = encodeURIComponent('🏘️ ' + (titre || 'Annonce ImmoGest') + ' — Voir sur ImmoGest');
  var encodedUrl = encodeURIComponent(url);

  // Overlay de partage avec options
  var existing = document.getElementById('mk-share-overlay');
  if (existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'mk-share-overlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;justify-content:center;padding:16px;';
  ov.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:20px;width:100%;max-width:420px;box-shadow:0 -4px 30px rgba(0,0,0,0.2);">
      <div style="font-size:15px;font-weight:800;margin-bottom:16px;text-align:center;">📤 Partager cette annonce</div>
      <div style="background:#f8fafc;border-radius:10px;padding:10px 14px;font-size:12px;color:#555;word-break:break-all;margin-bottom:16px;">${url}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        <button onclick="window.open('https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${text}','_blank')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:none;border-radius:10px;background:#1877F2;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          Facebook
        </button>
        <button onclick="window.open('https://wa.me/?text=${text}%20${encodedUrl}','_blank')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:none;border-radius:10px;background:#25D366;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button onclick="window.open('https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}','_blank')" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:none;border-radius:10px;background:#000;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.746-8.854L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          X (Twitter)
        </button>
        <button onclick="(navigator.clipboard||{writeText:function(t){var ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}}).writeText('${url}');showToast&&showToast('🔗 Lien copié !');document.getElementById('mk-share-overlay').remove();" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;color:#333;font-size:13px;font-weight:700;cursor:pointer;">
          📋 Copier le lien
        </button>
      </div>
      <button onclick="document.getElementById('mk-share-overlay').remove()" style="width:100%;padding:11px;border:1px solid #e2e8f0;border-radius:10px;background:none;cursor:pointer;font-size:14px;color:#666;">Fermer</button>
    </div>`;
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);
}

// ── Formulaire de publication ──────────────────────────────────
function mkOuvrirFormPublier(annonce) {
  var isEdit = !!annonce;
  var a = annonce || {};
  var overlay = document.createElement('div');
  overlay.id = 'mk-form-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9900;background:rgba(0,0,0,0.6);overflow-y:auto;';
  overlay.innerHTML = `
    <div style="max-width:640px;margin:20px auto;background:var(--surface,#fff);border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h3 style="margin:0;font-size:18px;font-weight:800;">${isEdit ? '✏️ Modifier' : '+ Publier'} une annonce</h3>
        <button onclick="document.getElementById('mk-form-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text3);">✕</button>
      </div>
      <form id="mk-form" onsubmit="mkSoumettre(event,${isEdit ? a.id : 'null'})">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">

          <div style="grid-column:1/-1;">
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Titre de l'annonce *</label>
            <input name="titre" required placeholder="Ex: Appartement 3 pièces à Makepe" value="${a.titre||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Type de bien *</label>
            <select name="type" required style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;font-size:13px;">
              <option value="appartement" ${a.type==='appartement'?'selected':''}>Appartement</option>
              <option value="maison" ${a.type==='maison'?'selected':''}>Maison</option>
              <option value="studio" ${a.type==='studio'?'selected':''}>Studio</option>
              <option value="chambre" ${a.type==='chambre'?'selected':''}>Chambre</option>
              <option value="meuble" ${a.type==='meuble'?'selected':''}>Meublé</option>
              <option value="hotel" ${a.type==='hotel'?'selected':''}>Hôtel / Résidence</option>
              <option value="commercial" ${a.type==='commercial'?'selected':''}>Local commercial</option>
            </select>
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Ville *</label>
            <input name="ville" required placeholder="Douala" value="${a.ville||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Quartier</label>
            <input name="quartier" placeholder="Makepe, Bastos…" value="${a.quartier||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Prix (FCFA) *</label>
            <input name="prix" type="number" required placeholder="150000" value="${a.prix||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Période</label>
            <select name="periode" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;font-size:13px;">
              <option value="mois" ${a.periode==='mois'||!a.periode?'selected':''}>Par mois</option>
              <option value="jour" ${a.periode==='jour'?'selected':''}>Par jour</option>
              <option value="an" ${a.periode==='an'?'selected':''}>Par an</option>
            </select>
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Nb chambres</label>
            <input name="nb_chambres" type="number" min="0" placeholder="2" value="${a.nb_chambres||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Surface (m²)</label>
            <input name="surface" type="number" min="0" placeholder="80" value="${a.surface||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">WhatsApp contact *</label>
            <input name="whatsapp" required placeholder="6XXXXXXXX" value="${a.whatsapp||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:14px;">
          </div>

          <div>
            <label style="font-size:12px;font-weight:600;color:var(--text3);">URLs photos (séparées par virgule)</label>
            <input name="photos_raw" placeholder="https://... , https://..." value="${(a.photos||[]).join(', ')}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:13px;">
          </div>

          <div style="grid-column:1/-1;">
            <label style="font-size:12px;font-weight:600;color:var(--text3);">Description</label>
            <textarea name="description" rows="4" placeholder="Décrivez le bien, les équipements, le quartier…" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;box-sizing:border-box;font-size:13px;resize:vertical;">${a.description||''}</textarea>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:16px;grid-column:1/-1;">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" name="meuble" ${a.meuble?'checked':''}>🪑 Meublé</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" name="climatise" ${a.climatise?'checked':''}>❄️ Climatisé</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" name="gardien" ${a.gardien?'checked':''}>👮 Gardien</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" name="parking" ${a.parking?'checked':''}>🚗 Parking</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" name="prix_negociable" ${a.prix_negociable?'checked':''}>💬 Prix négociable</label>
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;"><input type="checkbox" name="disponible" ${a.disponible!==false?'checked':''}>✅ Disponible maintenant</label>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-top:20px;">
          <button type="button" onclick="document.getElementById('mk-form-overlay').remove()" style="flex:1;padding:13px;border:1px solid var(--border);background:none;border-radius:8px;cursor:pointer;font-size:14px;">Annuler</button>
          <button type="submit" id="mk-submit-btn" style="flex:2;padding:13px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:15px;font-weight:700;">${isEdit ? '✅ Enregistrer' : '🚀 Publier l\'annonce'}</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);
}

async function mkSoumettre(e, editId) {
  e.preventDefault();
  var btn = document.getElementById('mk-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Publication…'; }
  var fd = new FormData(e.target);
  var photosRaw = fd.get('photos_raw') || '';
  var photos = photosRaw.split(',').map(s => s.trim()).filter(Boolean);

  var row = {
    tenant_id:      window.SESSION ? SESSION.tenantId : null,
    titre:          fd.get('titre'),
    type:           fd.get('type'),
    ville:          fd.get('ville'),
    quartier:       fd.get('quartier') || null,
    prix:           parseInt(fd.get('prix')) || 0,
    periode:        fd.get('periode') || 'mois',
    nb_chambres:    parseInt(fd.get('nb_chambres')) || null,
    surface:        parseInt(fd.get('surface')) || null,
    description:    fd.get('description') || null,
    whatsapp:       fd.get('whatsapp'),
    photos:         photos,
    meuble:         fd.get('meuble') === 'on',
    climatise:      fd.get('climatise') === 'on',
    gardien:        fd.get('gardien') === 'on',
    parking:        fd.get('parking') === 'on',
    prix_negociable:fd.get('prix_negociable') === 'on',
    disponible:     fd.get('disponible') === 'on',
    actif:          true,
    date_publication: new Date().toISOString(),
  };

  var result;
  if (editId) {
    result = await mkUpdateAnnonce(editId, row);
  } else {
    result = await mkInsertAnnonce(row);
  }

  document.getElementById('mk-form-overlay').remove();
  if (result) {
    showToast && showToast('✅ Annonce publiée avec succès !');
    mkRechercher();
  } else {
    alert('Erreur lors de la publication. Vérifiez votre connexion.');
  }
}

// ── Mes annonces ───────────────────────────────────────────────
async function mkVoirMesAnnonces() {
  var overlay = document.createElement('div');
  overlay.id = 'mk-mes-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9900;background:rgba(0,0,0,0.6);overflow-y:auto;';
  overlay.innerHTML = `
    <div style="max-width:640px;margin:20px auto;background:var(--surface,#fff);border-radius:16px;padding:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;font-weight:800;">📋 Mes annonces</h3>
        <button onclick="document.getElementById('mk-mes-overlay').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
      </div>
      <div id="mk-mes-list"><div style="text-align:center;padding:24px;color:var(--text3);">⏳ Chargement…</div></div>
    </div>`;
  document.body.appendChild(overlay);

  var annonces = await mkLoadMesAnnonces();
  var list = document.getElementById('mk-mes-list');
  if (!annonces.length) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Aucune annonce publiée.<br><button onclick="document.getElementById(\'mk-mes-overlay\').remove();mkOuvrirFormPublier()" style="margin-top:12px;padding:10px 20px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;cursor:pointer;">+ Publier une annonce</button></div>';
    return;
  }
  list.innerHTML = annonces.map(a => `
    <div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px;display:flex;gap:12px;align-items:center;">
      <div style="width:60px;height:50px;border-radius:6px;background:#e2e8f0;overflow:hidden;flex-shrink:0;">
        ${(a.photos && a.photos[0]) ? `<img src="${a.photos[0]}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;">🏠</div>'}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${a.titre}</div>
        <div style="font-size:12px;color:var(--text3);">${a.ville} · ${(a.prix||0).toLocaleString('fr-FR')} FCFA/mois</div>
        <div style="font-size:11px;margin-top:2px;">${a.disponible ? '<span style="color:#22c55e;">● Disponible</span>' : '<span style="color:#ef4444;">● Loué</span>'} · 👁 ${a.vues||0} vues</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0;">
        <button onclick="document.getElementById('mk-mes-overlay').remove();mkOuvrirFormPublier(${JSON.stringify(a).replace(/"/g,'&quot;')})" style="padding:6px 10px;border:1px solid var(--border);background:none;border-radius:6px;cursor:pointer;font-size:12px;">✏️</button>
        <button onclick="mkSupprimerAnnonce(${a.id},this)" style="padding:6px 10px;border:1px solid #fca5a5;background:none;color:#dc2626;border-radius:6px;cursor:pointer;font-size:12px;">🗑</button>
      </div>
    </div>`).join('');
}

async function mkSupprimerAnnonce(id, btn) {
  if (!confirm('Supprimer cette annonce ?')) return;
  if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
  await mkDeleteAnnonce(id);
  showToast && showToast('Annonce supprimée.');
  mkVoirMesAnnonces();
}
