// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Paiements
//  Algorithme cumul fiche de suivi CORRIGÉ (spéc CDC)
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.paiements = (function() {

  var _cache = [];

  function t(k)   { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function toast(msg, type) { window.IG.utils.showToast(msg, type); }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── CRUD ─────────────────────────────────────────────────────
  async function charger(filters) {
    try {
      _cache = await window.IG.db.select('paiements', filters || null);
      return _cache;
    } catch(e) {
      return [];
    }
  }

  function getCache()             { return _cache; }
  function getByLocataire(locId)  { return _cache.filter(function(p) { return p.locataire_id == locId; }); }

  async function enregistrer(paiement) {
    if (!paiement.id) paiement.id = window.IG.utils.uid();
    if (!paiement.type) paiement.type = 'loyer';
    var result = await window.IG.db.upsert('paiements', [paiement]);
    var idx = _cache.findIndex(function(p) { return p.id == paiement.id; });
    if (idx >= 0) _cache[idx] = paiement; else _cache.push(paiement);
    return result;
  }

  async function annuler(id) {
    await window.IG.db.remove('paiements', id);
    _cache = _cache.filter(function(p) { return p.id != id; });
    toast(t('Paiement supprimé'), 'orange');
  }

  // ── Algorithme cumul fiche de suivi (CDC obligatoire) ─────────
  function calculerFiche(locataire, versements) {
    if (!locataire || !locataire.entree) return [];

    var loyers = versements
      .filter(function(v) { return v.type === 'loyer' || !v.type; })
      .map(function(v) { return { ...v, _restant: parseFloat(v.montant) || 0 }; })
      .sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });

    var avances = versements.filter(function(v) { return v.type === 'avance'; });
    var cumulAvance = avances.reduce(function(s, v) { return s + (parseFloat(v.montant) || 0); }, 0);

    var moisList = window.IG.utils.getMoisDepuisEntree(locataire.entree);
    var lignes   = [];
    var loyer    = parseFloat(locataire.loyer) || 0;

    moisList.forEach(function(m) {
      var cumul = 0;
      var versementsMois = [];

      // 1. Consommer avance
      if (cumulAvance >= loyer) {
        cumul = loyer;
        cumulAvance -= loyer;
      } else if (cumulAvance > 0) {
        cumul += cumulAvance;
        cumulAvance = 0;
      }

      // 2. Consommer versements dans l'ordre
      loyers.forEach(function(v) {
        if (v._restant <= 0 || cumul >= loyer) return;
        var pris = Math.min(loyer - cumul, v._restant);
        v._restant -= pris;
        cumul += pris;
        versementsMois.push({ montant: pris, date: v.date_paiement, note: v.note, id: v.id });
      });

      var paye = cumul >= loyer;
      lignes.push({
        periode:    window.IG.utils.nomMois(m.mois) + ' ' + m.annee,
        mois:       m.mois,
        annee:      m.annee,
        statut:     paye ? 'Payé' : (cumul > 0 ? 'Partiel' : 'Impayé'),
        versements: versementsMois,
        cumul:      cumul,
        reste:      paye ? 0 : loyer - cumul
      });
    });

    return lignes;
  }

  // ── Rendu fiche de suivi ─────────────────────────────────────
  function renderFiche(loc, versements) {
    var lignes = calculerFiche(loc, versements);
    var imm = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;

    var html = '<div style="font-size:14px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px">' +
      '<div>' +
      '<h3 style="font-size:17px;font-weight:700;margin-bottom:4px">' + esc(loc.nom) + '</h3>' +
      '<div style="color:var(--text3);font-size:12px">' +
      esc(imm ? (imm.nom_immeuble || imm.nom) : '') + ' — Local ' + esc(loc.appt || '?') + ' — ' + fmt(loc.loyer) + '/mois' +
      '</div></div>' +
      '<button onclick="window.IG.paiements.afficherFormulaire(' + loc.id + ')" ' +
        'style="padding:8px 14px;border-radius:8px;border:none;background:var(--green);color:#fff;font-size:12px;font-weight:600;cursor:pointer">+ ' + t('Paiement') + '</button>' +
      '</div>';

    if (!lignes.length) {
      html += '<p style="color:var(--text3);text-align:center;padding:20px">' + t('Pas encore de données') + '</p>';
    } else {
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
        '<thead><tr style="background:var(--bg3);color:var(--text3);text-transform:uppercase;font-size:10px">' +
        '<th style="padding:8px 12px;text-align:left">' + t('Période') + '</th>' +
        '<th style="padding:8px 12px;text-align:center">' + t('Statut') + '</th>' +
        '<th style="padding:8px 12px;text-align:right">' + t('Versement(s)') + '</th>' +
        '<th style="padding:8px 12px;text-align:right">' + t('Reste') + '</th>' +
        '</tr></thead><tbody>';

      lignes.forEach(function(lg) {
        var color = lg.statut === 'Payé' ? 'var(--green)' : lg.statut === 'Partiel' ? 'var(--yellow)' : 'var(--red)';
        var bg    = lg.statut === 'Payé' ? 'var(--green-bg)' : lg.statut === 'Partiel' ? 'var(--yellow-bg)' : 'var(--red-bg)';
        var txt   = lg.versements.map(function(v) {
          return fmt(v.montant) + (v.date ? ' (' + window.IG.utils.formatDate(v.date) + ')' : '');
        }).join('<br>') || '—';

        html += '<tr style="border-bottom:1px solid var(--border2)">' +
          '<td style="padding:8px 12px;font-weight:600">' + esc(lg.periode) + '</td>' +
          '<td style="padding:8px 12px;text-align:center">' +
          '<span style="background:' + bg + ';color:' + color + ';padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700">' + t(lg.statut) + '</span>' +
          '</td>' +
          '<td style="padding:8px 12px;text-align:right">' + txt + '</td>' +
          '<td style="padding:8px 12px;text-align:right;font-weight:600;color:' + (lg.reste > 0 ? 'var(--red)' : 'var(--green)') + '">' +
          (lg.reste > 0 ? fmt(lg.reste) : '—') + '</td>' +
          '</tr>';
      });
      html += '</tbody></table></div>';
    }

    // Historique versements bruts
    if (versements.length) {
      html += '<details style="margin-top:16px"><summary style="cursor:pointer;font-size:12px;color:var(--text3);font-weight:600">' +
        t('Historique versements') + ' (' + versements.length + ')</summary>' +
        '<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">';
      versements.slice().reverse().forEach(function(v) {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg3);border-radius:8px;padding:8px 12px;font-size:12px">' +
          '<div>' +
          '<span style="font-weight:600">' + fmt(v.montant) + '</span>' +
          '<span style="color:var(--text3);margin-left:8px">' + esc(v.mode_paiement || 'espèces') + '</span>' +
          (v.note ? '<span style="color:var(--text3);margin-left:8px;font-style:italic">' + esc(v.note) + '</span>' : '') +
          '</div>' +
          '<div style="color:var(--text3)">' + window.IG.utils.formatDate(v.date_paiement) + '' +
          '<button onclick="window.IG.paiements.annuler(' + v.id + ')" title="' + t('Supprimer') + '" ' +
            'style="margin-left:8px;border:none;background:none;color:var(--red);cursor:pointer;font-size:14px">×</button>' +
          '</div></div>';
      });
      html += '</div></details>';
    }

    html += '<div id="ig-ad-fiche" style="margin-top:16px;text-align:center"></div>';
    html += '</div>';
    return html;
  }

  // ── Formulaire enregistrement paiement ────────────────────────
  function afficherFormulaire(locId) {
    var loc = window.IG.locataires ? window.IG.locataires.getById(locId) : null;
    if (!loc) { toast(t('Locataire introuvable'), 'red'); return; }

    var now = new Date();
    var html = '<h3 style="margin-bottom:18px;font-size:16px">💵 ' + t('Enregistrer un paiement') + '</h3>' +
      '<p style="font-size:13px;color:var(--text2);margin-bottom:16px"><strong>' + esc(loc.nom) + '</strong> — Local ' + esc(loc.appt || '?') + ' — Loyer : ' + fmt(loc.loyer) + '</p>' +
      '<form id="form-paiement">' +
      '<input type="hidden" name="locataire_id" value="' + loc.id + '">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      _fieldNum('montant', t('Montant (FCFA)'), loc.loyer) +
      _field('date_paiement', t('Date paiement'), now.toISOString().split('T')[0], true, 'date') +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Mois') + '</label>' +
      '<input type="number" name="mois" value="' + (now.getMonth()+1) + '" min="1" max="12" ' +
        'style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Année') + '</label>' +
      '<input type="number" name="annee" value="' + now.getFullYear() + '" min="2020" max="2030" ' +
        'style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '</div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Mode paiement') + '</label>' +
      '<select name="mode_paiement" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      ['espèces','virement','mobile money','chèque'].map(function(m) {
        return '<option value="' + m + '">' + t(m) + '</option>';
      }).join('') + '</select></div>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + t('Type') + '</label>' +
      '<select name="type" style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<option value="loyer">Loyer</option>' +
      '<option value="avance">Avance</option>' +
      '<option value="caution">Caution</option>' +
      '<option value="charge">Charge</option>' +
      '</select></div>' +
      _field('note', t('Note (optionnel)'), '') +
      '<div id="ig-ad-pay-form" style="margin:14px 0 10px;text-align:center"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">' +
      '<button type="button" data-modal-close style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer">' + t('Annuler') + '</button>' +
      '<button type="submit" style="padding:10px 20px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-weight:600">💵 ' + t('Enregistrer') + '</button>' +
      '</div></form>';

    var modal = window.IG.utils.showModal(html, { width: '480px' });
    setTimeout(function() { if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-pay-form', 'ad1'); }, 80);
    modal.box.querySelector('#form-paiement').addEventListener('submit', async function(e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      var pay = {
        id:             window.IG.utils.uid(),
        locataire_id:   parseInt(fd.get('locataire_id')),
        montant:        parseFloat(fd.get('montant')) || 0,
        date_paiement:  fd.get('date_paiement'),
        mois:           parseInt(fd.get('mois')),
        annee:          parseInt(fd.get('annee')),
        mode_paiement:  fd.get('mode_paiement'),
        type:           fd.get('type'),
        note:           fd.get('note')
      };
      try {
        await enregistrer(pay);
        modal.close();
        toast('✓ ' + t('Paiement enregistré'), 'green');
        if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
      } catch(err) {
        toast(t('Erreur') + ': ' + err.message, 'red');
      }
    });
  }

  // ── Résumé dashboard ─────────────────────────────────────────
  function calculerStats(locataires, paiements) {
    var now = new Date();
    var mois = now.getMonth() + 1;
    var annee = now.getFullYear();
    var actifs = locataires.filter(function(l) { return l.statut !== 'libre'; });
    var aJour  = 0;
    var impayes = 0;

    actifs.forEach(function(loc) {
      var pays = paiements.filter(function(p) {
        return p.locataire_id == loc.id && parseInt(p.mois) === mois && parseInt(p.annee) === annee;
      });
      var total = pays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
      if (total >= (parseFloat(loc.loyer) || 0)) aJour++;
      else impayes++;
    });

    var recetteMois = paiements
      .filter(function(p) { return parseInt(p.mois) === mois && parseInt(p.annee) === annee; })
      .reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    return { actifs: actifs.length, aJour, impayes, recetteMois };
  }

  function _field(name, label, val, required, type) {
    return '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + label + (required ? ' *' : '') + '</label>' +
      '<input type="' + (type || 'text') + '" name="' + name + '" value="' + esc(val || '') + '"' + (required ? ' required' : '') +
      ' style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>';
  }

  function _fieldNum(name, label, val) {
    return '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text2);font-weight:600">' + label + '</label>' +
      '<input type="number" name="' + name + '" value="' + (parseFloat(val)||0) + '" min="0" step="500" required ' +
      'style="width:100%;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>';
  }

  return {
    charger, getCache, getByLocataire, enregistrer, annuler,
    calculerFiche, renderFiche, afficherFormulaire, calculerStats
  };

})();
