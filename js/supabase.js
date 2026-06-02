const SUPABASE_URL  = 'https://uggxfmwpttfsfcirmeqx.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ3hmbXdwdHRmc2ZjaXJtZXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTA4MjIsImV4cCI6MjA5NDYyNjgyMn0.l8iYlJHOt6evNlBQ3zRskZasn_J2BjAUs1l2vKOZNvY';
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Helpers Supabase ──────────────────────────────────────────
async function sbLoad(table) {
  try {
    const { data, error } = await _sb.from(table).select('*');
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('sbLoad error:', table, e.message || e);
    return null;
  }
}

async function sbUpsert(table, rows) {
  try {
    const { error } = await _sb.from(table).upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch(e) {
    console.warn('sbUpsert error:', table, e.message || e, e.details || '', e.hint || '');
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
// Schéma immeubles : id, nom, ville, quartier, couleur
function _mapImmeuble(r) {
  return {
    id:       r.id,
    nom:      r.nom || '',
    adresse:  '',
    ville:    r.ville || '',
    quartier: r.quartier || '',
    col:      r.couleur || '#0E6AAF',
    proprio:  '',
    tel:      '',
    notes:    ''
  };
}

// Schéma locataires : id, immeuble_id, nom, telephone, whatsapp, appt, type_local,
//                     loyer, reste, statut, observations, entree, caution
function _mapLocataire(r) {
  return {
    id:         r.id,
    iid:        r.immeuble_id,
    nom:        r.nom || '',
    tel:        r.telephone || '',
    whatsapp:   r.whatsapp || '',
    appt:       r.appt || '',
    type:       r.type_local || 'appartement',
    loyer:      r.loyer || 0,
    reste:      r.reste || 0,
    s:          r.statut || 'libre',
    obs:        r.observations || '',
    entree:     r.entree || '',
    caution:    r.caution || 0,
    pin:        null,
    firstLogin: false,
    actif:      true
  };
}

// Schéma paiements : id, locataire_id, montant, date_paiement, mois, annee,
//                    mode_paiement, note
function _mapPaiement(r) {
  return {
    id:      r.id,
    locId:   r.locataire_id,
    iid:     null,
    mois:    r.mois,    // 1-12 (Supabase)
    annee:   r.annee,
    moisC:   r.mois !== undefined ? r.mois - 1 : undefined, // 0-11 (compatibilité app)
    anneeC:  r.annee,
    montant: r.montant || 0,
    date:    r.date_paiement || '',
    mode:    r.mode_paiement || 'espèces',
    notes:   r.note || ''
  };
}

// ── Helpers Maintenance ───────────────────────────────────────
async function loadMaintenances() {
  try {
    const { data, error } = await _sb.from('maintenances').select('*').order('date_soumission', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('loadMaintenances error:', e.message || e);
    return [];
  }
}

async function loadMaintenancesByLocataire(locataireId) {
  try {
    const { data, error } = await _sb.from('maintenances').select('*')
      .eq('locataire_id', locataireId).order('date_soumission', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('loadMaintenancesByLocataire error:', e.message || e);
    return [];
  }
}

async function insertMaintenance(row) {
  try {
    const { data, error } = await _sb.from('maintenances').insert(row).select().single();
    if (error) throw error;
    return data;
  } catch(e) {
    console.warn('insertMaintenance error:', e.message || e);
    return null;
  }
}

async function updateMaintenanceStatut(id, statut, note) {
  try {
    const upd = { statut };
    if (note !== undefined) upd.note_gestionnaire = note;
    if (statut === 'resolu') upd.date_resolution = new Date().toISOString();
    const { error } = await _sb.from('maintenances').update(upd).eq('id', id);
    if (error) throw error;
    return true;
  } catch(e) {
    console.warn('updateMaintenanceStatut error:', e.message || e);
    return false;
  }
}

// ── Helpers État des lieux ────────────────────────────────────
async function loadEtatsLieux() {
  try {
    const { data, error } = await _sb.from('etats_lieux').select('*').order('date_etat', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('loadEtatsLieux error:', e.message || e);
    return [];
  }
}

async function loadEtatsLieuxByLocataire(locataireId) {
  try {
    const { data, error } = await _sb.from('etats_lieux').select('*')
      .eq('locataire_id', locataireId).order('date_etat', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch(e) {
    console.warn('loadEtatsLieuxByLocataire error:', e.message || e);
    return [];
  }
}

async function insertEtatLieux(row) {
  try {
    const { data, error } = await _sb.from('etats_lieux').insert(row).select().single();
    if (error) throw error;
    return data;
  } catch(e) {
    console.warn('insertEtatLieux error:', e.message || e);
    return null;
  }
}

async function updateEtatLieux(id, fields) {
  try {
    const { error } = await _sb.from('etats_lieux').update(fields).eq('id', id);
    if (error) throw error;
    return true;
  } catch(e) {
    console.warn('updateEtatLieux error:', e.message || e);
    return false;
  }
}

// ── Helpers Charges ──────────────────────────────────────────
async function loadChargesByImmeuble(immeubleId) {
  try {
    const { data, error } = await _sb.from('charges').select('*')
      .eq('immeuble_id', immeubleId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch(e) { console.warn('loadCharges error:', e.message); return []; }
}

async function insertCharge(row) {
  try {
    const { data, error } = await _sb.from('charges').insert(row).select().single();
    if (error) throw error;
    return data;
  } catch(e) { console.warn('insertCharge error:', e.message); return null; }
}

async function updateCharge(id, fields) {
  try {
    const { error } = await _sb.from('charges').update(fields).eq('id', id);
    if (error) throw error;
    return true;
  } catch(e) { console.warn('updateCharge error:', e.message); return false; }
}

async function deleteCharge(id) {
  try {
    const { error } = await _sb.from('charges').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch(e) { console.warn('deleteCharge error:', e.message); return false; }
}

// ── Helpers Contrats ─────────────────────────────────────────
async function loadContratByLocataire(locataireId) {
  try {
    const { data, error } = await _sb.from('contrats').select('*')
      .eq('locataire_id', locataireId).maybeSingle();
    if (error) throw error;
    return data;
  } catch(e) { console.warn('loadContrat error:', e.message); return null; }
}

async function upsertContrat(row) {
  try {
    const { data, error } = await _sb.from('contrats')
      .upsert(row, { onConflict: 'locataire_id' }).select().single();
    if (error) throw error;
    return data;
  } catch(e) { console.warn('upsertContrat error:', e.message); return null; }
}

async function updateContratAutorisation(locataireId, fields) {
  try {
    const { error } = await _sb.from('contrats').update(fields).eq('locataire_id', locataireId);
    if (error) throw error;
    return true;
  } catch(e) { console.warn('updateContratAutorisation error:', e.message); return false; }
}

async function uploadContratTemplate(immeubleId, file) {
  try {
    const path = `templates/immeuble_${immeubleId}.docx`;
    const { error } = await _sb.storage.from('contrats').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = _sb.storage.from('contrats').getPublicUrl(path);
    return data.publicUrl;
  } catch(e) { console.warn('uploadContratTemplate error:', e.message); return null; }
}

async function getContratTemplateUrl(immeubleId) {
  try {
    const { data } = _sb.storage.from('contrats').getPublicUrl(`templates/immeuble_${immeubleId}.docx`);
    return data.publicUrl;
  } catch(e) { return null; }
}

// ── loadDataFromSupabase ──────────────────────────────────────
async function loadDataFromSupabase() {
  try {
    showToast('Chargement des données...', 'blue');
    const [immeubles, locataires, paiements] = await Promise.all([
      sbLoad('immeubles'),
      sbLoad('locataires'),
      sbLoad('paiements')
    ]);

    if (immeubles === null || locataires === null) {
      console.warn('Supabase indisponible — fallback localStorage');
      return false;
    }

    // Si Supabase vide ET données locales présentes → migration automatique
    if (immeubles.length === 0 && locataires.length === 0) {
      const _cacheKey = (SESSION && SESSION.version === 'individuel') ? STORE_KEY_IND : 'immogest_data';
      const _cacheCheck = localStorage.getItem(_cacheKey);
      if (_cacheCheck) {
        const _localData = JSON.parse(_cacheCheck);
        if ((_localData.immeubles && _localData.immeubles.length > 0) ||
            (_localData.locataires && _localData.locataires.length > 0)) {
          console.log('Migration locale → Supabase...');
          showToast('Synchronisation en cours...', 'blue');
          const _mig  = _localData.immeubles || [];
          const _mloc = (_localData.locataires || []).filter(function(l) {
            return l.s !== 'libre' && l.nom !== '(Libre)';
          });
          const _mpay = _localData.paiements || [];
          await Promise.all([
            ..._mig.map(function(im) { return saveImmeubleToSupabase(im); }),
            ..._mloc.map(function(lc) { return saveLocataireToSupabase(lc); }),
            ..._mpay.map(function(p)  { return savePaiementToSupabase(p); })
          ]);
          showToast('Données synchronisées avec Supabase ✓', 'green');
          return true;
        }
      }
      console.log('Supabase vide — premier lancement');
      return true;
    }

    DATA.immeubles  = immeubles.map(_mapImmeuble);
    DATA.locataires = locataires.map(_mapLocataire);
    DATA.paiements  = (paiements || []).map(_mapPaiement);

    // Calculer nextIds
    DATA.nextImmId = Math.max(0, ...DATA.immeubles.map(i => i.id)) + 1;
    DATA.nextLocId = Math.max(0, ...DATA.locataires.map(l => l.id)) + 1;
    DATA.nextPayId = Math.max(0, ...DATA.paiements.map(p => p.id)) + 1;

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
// Colonnes existantes dans immeubles : id, nom, ville, quartier, couleur
async function saveImmeubleToSupabase(im) {
  return sbUpsert('immeubles', [{
    id:       im.id,
    nom:      im.nom,
    ville:    im.ville || '',
    quartier: im.quartier || '',
    couleur:  im.col || '#0E6AAF'
  }]);
}

// Colonnes existantes dans locataires : id, immeuble_id, nom, telephone, appt,
//   type_local, loyer, reste, statut, observations, entree, caution
async function saveLocataireToSupabase(l) {
  return sbUpsert('locataires', [{
    id:           l.id,
    immeuble_id:  l.iid,
    nom:          l.nom,
    telephone:    l.tel || '',
    whatsapp:     l.whatsapp || '',
    appt:         l.appt || '',
    type_local:   l.type || 'appartement',
    loyer:        l.loyer || 0,
    reste:        l.reste || 0,
    statut:       l.s || 'libre',
    observations: l.obs || '',
    entree:       l.entree || '',
    caution:      l.caution || 0
  }]);
}

// Colonnes existantes dans paiements : id, locataire_id, montant, date_paiement,
//   mois, annee, mode_paiement, note
async function savePaiementToSupabase(p) {
  return sbUpsert('paiements', [{
    id:            p.id,
    locataire_id:  p.locId,
    mois:          p.mois,
    annee:         p.annee,
    montant:       p.montant || 0,
    date_paiement: p.date || '',
    mode_paiement: p.mode || 'espèces',
    note:          p.notes || ''
  }]);
}

// ── Archives Supabase ──────────────────────────────────────────
// Colonnes archives : id, locataire_id, immeuble_id, nom, telephone, appt,
//   loyer, entree, date_sortie, solde_final, motif, obs_depart
async function archiverLocataireSupabase(l, motif, paiements, dateSortie, obs) {
  try {
    await _sb.from('archives').insert([{
      locataire_id: l.id,
      immeuble_id:  l.iid,
      nom:          l.nom || '',
      telephone:    l.tel || '',
      appt:         l.appt || '',
      loyer:        l.loyer || 0,
      entree:       l.entree || null,
      date_sortie:  dateSortie || null,
      solde_final:  l.reste || 0,
      motif:        motif || 'inconnu',
      obs_depart:   obs || l.obs || ''
    }]);
  } catch(e) { console.warn('archiverLocataire error:', e); }
}

async function mettreEnCorbeilleSupabase(l, paiements) {
  try {
    await _sb.from('corbeille').insert([{
      locataire_id:   String(l.id),
      locataire_data: Object.assign({}, l, { _paiements: paiements || [] })
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
    var query = _sb.from('archives').select('*');
    if (tel) query = query.eq('telephone', tel);
    else     query = query.ilike('nom', '%' + nom + '%');
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  } catch(e) { return []; }
}

// ── Helpers Déclarations ──────────────────────────────────────

function _mapDeclaration(r) {
  return {
    id:             r.id,
    locId:          r.locataire_id,
    montant:        r.montant || 0,
    date:           r.date_paiement || '',
    moisC:          r.mois_c,
    anneeC:         r.annee_c,
    moisFin:        r.mois_fin,
    anneeFin:       r.annee_fin,
    periodeLabel:   r.periode_label || '',
    mode:           r.mode || 'especes',
    ref:            r.ref || null,
    obs:            r.obs || null,
    statut:         r.statut || 'pending',
    dateDeclaration:r.date_declaration || new Date().toISOString(),
    dateValidation: r.date_validation || null,
    noteComptable:  r.note_comptable || null,
    montantValidé:  r.montant_valide || null,
    payId:          r.pay_id || null,
    receiptId:      r.receipt_id || null,
    nomLocataire:   r.nom_locataire || '',
    apptLocataire:  r.appt_locataire || '',
    nomImmeuble:    r.nom_immeuble || '',
    photoUrl:       r.photo_url || null,
    declaredBy:     r.declared_by || 'locataire',
    type:           r.type || 'locataire'
  };
}

async function saveDeclarationToSupabase(decl) {
  try {
    const row = {
      locataire_id:  decl.locId,
      montant:       decl.montant,
      date_paiement: decl.date || null,
      mois_c:        decl.moisC,
      annee_c:       decl.anneeC,
      mois_fin:      decl.moisFin,
      annee_fin:     decl.anneeFin,
      periode_label: decl.periodeLabel || null,
      mode:          decl.mode || 'especes',
      ref:           decl.ref || null,
      obs:           decl.obs || null,
      statut:        decl.statut || 'pending',
      nom_locataire: decl.nomLocataire || '',
      appt_locataire:decl.apptLocataire || '',
      nom_immeuble:  decl.nomImmeuble || '',
      photo_url:     decl.photoUrl || null,
      declared_by:   decl.declaredBy || 'locataire',
      type:          decl.type || 'locataire'
    };
    const { data, error } = await _sb.from('declarations').insert(row).select().single();
    if (error) throw error;
    return data;
  } catch(e) {
    console.warn('saveDeclaration error:', e.message || e);
    return null;
  }
}

async function loadDeclarationsFromSupabase() {
  try {
    const { data, error } = await _sb.from('declarations').select('*').order('date_declaration', { ascending: false });
    if (error) throw error;
    return (data || []).map(_mapDeclaration);
  } catch(e) {
    console.warn('loadDeclarations error:', e.message || e);
    return null;
  }
}

async function loadDeclarationsByLocataireFromSupabase(locataireId) {
  try {
    const { data, error } = await _sb.from('declarations').select('*')
      .eq('locataire_id', locataireId).order('date_declaration', { ascending: false });
    if (error) throw error;
    return (data || []).map(_mapDeclaration);
  } catch(e) {
    console.warn('loadDeclsByLoc error:', e.message || e);
    return [];
  }
}

async function updateDeclarationInSupabase(id, fields) {
  try {
    const { error } = await _sb.from('declarations').update(fields).eq('id', id);
    if (error) throw error;
    return true;
  } catch(e) {
    console.warn('updateDeclaration error:', e.message || e);
    return false;
  }
}

async function uploadPhotoRecu(file, declId) {
  try {
    const ext = (file.name || 'img').split('.').pop() || 'jpg';
    const path = 'receipts/' + declId + '_' + Date.now() + '.' + ext;
    const { error } = await _sb.storage.from('declarations').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = _sb.storage.from('declarations').getPublicUrl(path);
    return data.publicUrl;
  } catch(e) {
    console.warn('uploadPhotoRecu error:', e.message || e);
    return null;
  }
}
