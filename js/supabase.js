const SUPABASE_URL  = 'https://uggxfmwpttfsfcirmeqx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ3hmbXdwdHRmc2ZjaXJtZXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTA4MjIsImV4cCI6MjA5NDYyNjgyMn0.l8iYlJHOt6evNlBQ3zRskZasn_J2BjAUs1l2vKOZNvY';
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Helpers Supabase ──────────────────────────────────────────
async function sbLoad(table, mode) {
  try {
    let query = _sb.from(table).select('*');
    if (mode) query = query.eq('mode', mode);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('sbLoad error:', table, e);
    return null;
  }
}

async function sbUpsert(table, rows) {
  try {
    const { error } = await _sb.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch(e) {
    console.warn('sbUpsert error:', table, e);
    return false;
  }
}

async function sbDelete(table, id) {
  try {
    const { error } = await _sb.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch(e) {
    console.warn('sbDelete error:', table, e);
    return false;
  }
}

// ── Mapper Supabase → DATA ────────────────────────────────────
function _mapImmeuble(r) {
  return {
    id:       r.id,
    nom:      r.nom || '',
    adresse:  r.adresse || '',
    ville:    r.ville || '',
    quartier: r.quartier || '',
    col:      r.couleur || '#0E6AAF',
    proprio:  r.proprio || '',
    tel:      r.telephone || '',
    notes:    r.notes || ''
  };
}

function _mapLocataire(r) {
  return {
    id:     r.id,
    iid:    r.immeuble_id,
    nom:    r.nom || '',
    tel:    r.telephone || '',
    appt:   r.appt || '',
    type:   r.type_local || 'appartement',
    loyer:  r.loyer || 0,
    reste:  r.reste || 0,
    s:      r.statut || 'libre',
    obs:    r.observations || '',
    entree: r.entree || '',
    caution:r.caution || 0,
    pin:    r.pin || null,
    firstLogin: r.first_login || false,
    actif:  r.actif !== false
  };
}

function _mapPaiement(r) {
  return {
    id:     r.id,
    locId:  r.locataire_id,
    iid:    r.immeuble_id,
    mois:   r.mois,
    annee:  r.annee,
    montant:r.montant || 0,
    date:   r.date_paiement || '',
    mode:   r.mode_paiement || 'espèces',
    notes:  r.notes || ''
  };
}

// ── loadDataFromSupabase ──────────────────────────────────────
async function loadDataFromSupabase() {
  try {
    showToast('Chargement des données...', 'blue');
    const _mode = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
    const [immeubles, locataires, paiements] = await Promise.all([
      sbLoad('immeubles', _mode),
      sbLoad('locataires', _mode),
      sbLoad('paiements', _mode)
    ]);

    if (immeubles === null || locataires === null) {
      console.warn('Supabase indisponible — fallback localStorage');
      return false;
    }

    // Si Supabase vide pour mode individuel ET données locales présentes → migration automatique
    if (_mode === 'individuel' && immeubles.length === 0 && locataires.length === 0) {
      const _cacheCheck = localStorage.getItem(STORE_KEY_IND);
      if (_cacheCheck) {
        const _localData = JSON.parse(_cacheCheck);
        if ((_localData.immeubles && _localData.immeubles.length > 0) ||
            (_localData.locataires && _localData.locataires.length > 0)) {
          console.log('Migration locale → Supabase individuel...');
          showToast('Synchronisation en cours...', 'blue');
          // Pousser chaque immeuble et locataire vers Supabase
          const _mig = _localData.immeubles || [];
          const _mloc = (_localData.locataires || []).filter(function(l){ return l.s !== 'libre' && l.nom !== '(Libre)'; });
          const _mpay = _localData.paiements || [];
          await Promise.all([
            ..._mig.map(function(im){ return saveImmeubleToSupabase(im); }),
            ..._mloc.map(function(lc){ return saveLocataireToSupabase(lc); }),
            ..._mpay.map(function(p){ return savePaiementToSupabase(p); })
          ]);
          showToast('Données synchronisées avec Supabase ✓', 'green');
          return true; // Données locales déjà dans DATA, pas besoin de re-charger
        }
      }
      // Supabase vide ET localStorage vide → premier lancement propre
      console.log('Premier lancement mode individuel — base vide');
      return true;
    }


    DATA.immeubles  = immeubles.map(_mapImmeuble);
    DATA.locataires = locataires.map(_mapLocataire);
    DATA.paiements  = (paiements || []).map(_mapPaiement);

    // Calculer nextIds
    DATA.nextImmId  = Math.max(0, ...DATA.immeubles.map(i => i.id)) + 1;
    DATA.nextLocId  = Math.max(0, ...DATA.locataires.map(l => l.id)) + 1;
    DATA.nextPayId  = Math.max(0, ...DATA.paiements.map(p => p.id)) + 1;

    // Sauvegarder en localStorage comme cache (clé selon le mode)
    const _cacheKey = (SESSION && SESSION.version === 'individuel') ? STORE_KEY_IND : 'immogest_data';
    localStorage.setItem(_cacheKey, JSON.stringify(DATA));
    console.log('Supabase chargé:', DATA.immeubles.length, 'imm,', DATA.locataires.length, 'loc,', DATA.paiements.length, 'pay');
    return true;
  } catch(e) {
    console.warn('loadDataFromSupabase error:', e);
    return false;
  }
}

// ── saveToSupabase ────────────────────────────────────────────
async function saveLocataireToSupabase(l) {
  const _m = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
  return sbUpsert('locataires', [{
    id:           l.id,
    mode:         _m,
    immeuble_id:  l.iid,
    nom:          l.nom,
    telephone:    l.tel || '',
    appt:         l.appt || '',
    type_local:   l.type || 'appartement',
    loyer:        l.loyer || 0,
    reste:        l.reste || 0,
    statut:       l.s || 'libre',
    observations: l.obs || '',
    entree:       l.entree || '',
    caution:      l.caution || 0,
    pin:          l.pin || null,
    first_login:  l.firstLogin || false,
    actif:        l.actif !== false
  }]);
}

async function saveImmeubleToSupabase(im) {
  const _mv = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
  return sbUpsert('immeubles', [{
    id:        im.id,
    mode:      _mv,
    nom:       im.nom,
    adresse:   im.adresse || '',
    ville:     im.ville || '',
    quartier:  im.quartier || '',
    couleur:   im.col || '#0E6AAF',
    proprio:   im.proprio || '',
    telephone: im.tel || '',
    notes:     im.notes || ''
  }]);
}

async function savePaiementToSupabase(p) {
  const _mp = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
  return sbUpsert('paiements', [{
    id:             p.id,
    mode:           _mp,
    locataire_id:   p.locId,
    immeuble_id:    p.iid,
    mois:           p.mois,
    annee:          p.annee,
    montant:        p.montant || 0,
    date_paiement:  p.date || '',
    mode_paiement:  p.mode || 'espèces',
    notes:          p.notes || ''
  }]);
}

// ── Archives & Corbeille Supabase ──────────────────────────────

function _calculerScoreJS(reste, loyer, motif) {
  var score = 100;
  var nbImpayes = (reste > 0 && loyer > 0) ? Math.ceil(reste / loyer) : 0;
  score -= nbImpayes * 15;
  if (reste > 100000) score -= 10;
  if (motif === 'expulsion') score -= 20;
  if (nbImpayes === 0 && motif === 'depart_volontaire') score += 10;
  return Math.max(0, Math.min(100, score));
}

async function archiverLocataireSupabase(l, motif, paiements, dateSortie, obs) {
  const _mode = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
  const im = DATA.immeubles ? DATA.immeubles.find(function(i){ return i.id === l.iid; }) : null;
  const pays = paiements || [];
  const score = _calculerScoreJS(l.reste || 0, l.loyer || 1, motif);
  try {
    await _sb.from('archives').insert([{
      locataire_id:   String(l.id),
      nom:            l.nom || '',
      telephone:      l.tel || '',
      immeuble_nom:   im ? im.nom : (l.immeuble_nom || ''),
      immeuble_id:    String(l.iid || ''),
      local_num:      l.appt || '',
      loyer:          l.loyer || 0,
      date_entree:    l.entree || null,
      date_sortie:    dateSortie || null,
      motif:          motif || 'inconnu',
      nb_paiements:   pays.length,
      nb_impayes:     (l.reste > 0 && l.loyer > 0) ? Math.ceil(l.reste / l.loyer) : 0,
      montant_impaye: l.reste || 0,
      note:           obs || l.obs || '',
      score:          score,
      mode:           _mode
    }]);
  } catch(e) { console.warn('archiverLocataire error:', e); }
}

async function mettreEnCorbeilleSupabase(l, paiements) {
  const _mode = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
  try {
    await _sb.from('corbeille').insert([{
      locataire_id:   String(l.id),
      locataire_data: Object.assign({}, l, { _paiements: paiements || [] }),
      mode:           _mode
    }]);
  } catch(e) { console.warn('mettreEnCorbeille error:', e); }
}

async function retirerDeCorbeilleSupabase(locataireId) {
  try {
    await _sb.from('corbeille').delete().eq('locataire_id', String(locataireId));
  } catch(e) { console.warn('retirerCorbeille error:', e); }
}

async function verifierLocataireArchives(nom, tel) {
  if (!nom && !tel) return [];
  try {
    const _mode = (SESSION && SESSION.version === 'individuel') ? 'individuel' : 'entreprise';
    var query = _sb.from('archives').select('*').eq('mode', _mode);
    if (tel) query = query.eq('telephone', tel);
    else     query = query.ilike('nom', '%' + nom + '%');
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch(e) { return []; }
}
