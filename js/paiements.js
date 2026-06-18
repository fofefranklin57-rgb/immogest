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

  // ── Rendu fiche de suivi (CDC complet) ───────────────────────
  function renderFiche(loc, versements) {
    var lignes = calculerFiche(loc, versements);
    var imm    = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var cabinet = session.nomCabinet || session.nom || 'ImmoGest';

    // Solde cumulé
    var totalDu   = lignes.reduce(function(s, l) { return s + (l.reste || 0); }, 0);
    var arrieres  = parseFloat(loc.arrieres) || 0;
    var soldeFinal = totalDu + arrieres;

    // Score fiabilité
    var nbMois  = lignes.length;
    var nbPayes = lignes.filter(function(l) { return l.statut === 'Payé'; }).length;
    var score   = nbMois ? Math.round((nbPayes / nbMois) * 100) : 100;
    var scoreCouleur = score >= 80 ? 'var(--green)' : score >= 50 ? '#f39c12' : 'var(--red)';
    var scoreLabel   = score >= 80 ? '😊 Fiable' : score >= 50 ? '😐 Moyen' : '😟 À risque';

    // ── En-tête ───────────────────────────────────────────────
    var html = '<div id="fiche-print-zone" style="font-size:13px">' +
      // Barre actions
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:8px;flex-wrap:wrap">' +
      '<div>' +
      '<h3 style="font-size:16px;font-weight:700;margin:0 0 2px">📋 ' + t('Fiche de suivi') + '</h3>' +
      '<div style="font-size:12px;color:var(--text3)">' + esc(loc.nom) + '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button onclick="window.IG.paiements.afficherFormulaireFiche(' + loc.id + ')" style="padding:7px 13px;border-radius:8px;border:none;background:var(--green);color:#fff;font-size:12px;font-weight:600;cursor:pointer">+ ' + t('Paiement') + '</button>' +
      '<button onclick="window.IG.paiements.imprimerFiche()" style="padding:7px 13px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">🖨️ PDF</button>' +
      (window.IG.ai ? '<button onclick="window.IG.ai.analyserLocataire(' + loc.id + ')" style="padding:7px 13px;border-radius:8px;border:none;background:linear-gradient(135deg,#7C3AED,#0E6AAF);color:#fff;font-size:12px;font-weight:600;cursor:pointer">✨ IA</button>' : '') +
      '</div></div>' +

      // Infos locataire
      '<div style="background:var(--bg3);border-radius:12px;padding:14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
      _ficheInfo('👤 ' + t('Locataire'), esc(loc.nom)) +
      _ficheInfo('🏢 ' + t('Immeuble'), esc(imm ? (imm.nom_immeuble || imm.nom) : '—')) +
      _ficheInfo('🚪 ' + t('Local'), esc(loc.appt || '—')) +
      _ficheInfo('💰 ' + t('Loyer'), fmt(loc.loyer) + '/mois') +
      _ficheInfo('📅 ' + t('Entrée'), loc.entree ? window.IG.utils.formatDate(loc.entree) : '—') +
      _ficheInfo('📞 ' + t('Téléphone'), esc(loc.telephone || '—')) +
      (loc.caution ? _ficheInfo('🔒 ' + t('Caution'), fmt(loc.caution)) : '') +
      _ficheInfo('🏷️ ' + t('Cabinet'), esc(cabinet)) +
      '</div>' +

      // Solde + score
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
      '<div style="background:' + (soldeFinal > 0 ? 'var(--red-bg)' : 'var(--green-bg)') + ';border-radius:10px;padding:14px;text-align:center">' +
      '<div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text3);margin-bottom:4px">' + (soldeFinal > 0 ? '⚠️ ' + t('Total dû') : '✅ ' + t('À jour')) + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:' + (soldeFinal > 0 ? 'var(--red)' : 'var(--green)') + '">' + fmt(Math.abs(soldeFinal)) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg3);border-radius:10px;padding:14px;text-align:center">' +
      '<div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text3);margin-bottom:4px">🎯 ' + t('Score fiabilité') + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:' + scoreCouleur + '">' + score + '<span style="font-size:13px;font-weight:500">/100</span></div>' +
      '<div style="font-size:11px;color:' + scoreCouleur + ';margin-top:2px">' + scoreLabel + '</div>' +
      '</div></div>' +
      // Ligne arriérés antérieurs résumé (si mois_arrieres renseigné)
      (loc.mois_arrieres > 0 ? '<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:var(--red)">' +
      '⚠️ <strong>' + fmt(arrieres) + '</strong> d\'arriérés antérieurs — représente <strong>' + loc.mois_arrieres + ' mois</strong> de loyer impayé avant l\'entrée dans ce suivi.' +
      '</div>' : '');

    // ── Tableau historique ────────────────────────────────────
    if (!lignes.length) {
      html += '<p style="color:var(--text3);text-align:center;padding:20px">' + t('Pas encore de données') + '</p>';
    } else {
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
        '<thead><tr style="background:var(--bg3);color:var(--text3);text-transform:uppercase;font-size:10px">' +
        '<th style="padding:8px 10px;text-align:left">' + t('Période') + '</th>' +
        '<th style="padding:8px 10px;text-align:right">' + t('Loyer dû') + '</th>' +
        '<th style="padding:8px 10px;text-align:center">' + t('Statut') + '</th>' +
        '<th style="padding:8px 10px;text-align:right">' + t('Versé') + '</th>' +
        '<th style="padding:8px 10px;text-align:right">' + t('Reste') + '</th>' +
        '<th style="padding:8px 10px;text-align:center">🖨️</th>' +
        '</tr></thead><tbody>';

      // Ligne arriérés antérieurs si présents
      if (arrieres > 0) {
        html += '<tr style="border-bottom:1px solid var(--border2);background:var(--red-bg)">' +
          '<td style="padding:8px 10px;font-weight:700;color:var(--red)">⚠️ ' + t('Arriérés antérieurs') + '</td>' +
          '<td style="padding:8px 10px;text-align:right;color:var(--red)">' + fmt(arrieres) + '</td>' +
          '<td style="padding:8px 10px;text-align:center"><span style="background:var(--red-bg);color:var(--red);padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700">' + t('Impayé') + '</span></td>' +
          '<td colspan="3" style="padding:8px 10px;text-align:right;font-weight:600;color:var(--red)">' + fmt(arrieres) + '</td>' +
          '</tr>';
      }

      lignes.forEach(function(lg) {
        var color = lg.statut === 'Payé' ? 'var(--green)' : lg.statut === 'Partiel' ? '#f39c12' : 'var(--red)';
        var bg    = lg.statut === 'Payé' ? 'var(--green-bg)' : lg.statut === 'Partiel' ? 'rgba(243,156,18,0.1)' : 'var(--red-bg)';
        var verseTxt = lg.versements.map(function(v) {
          return fmt(v.montant) + (v.date ? ' <span style="color:var(--text3);font-size:10px">(' + window.IG.utils.formatDate(v.date) + ')</span>' : '');
        }).join('<br>') || '—';
        var loyer = parseFloat(loc.loyer) || 0;

        html += '<tr style="border-bottom:1px solid var(--border2)">' +
          '<td style="padding:8px 10px;font-weight:600">' + esc(lg.periode) + '</td>' +
          '<td style="padding:8px 10px;text-align:right;color:var(--text2)">' + fmt(loyer) + '</td>' +
          '<td style="padding:8px 10px;text-align:center">' +
          '<span style="background:' + bg + ';color:' + color + ';padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700">' + t(lg.statut) + '</span>' +
          '</td>' +
          '<td style="padding:8px 10px;text-align:right">' + verseTxt + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-weight:700;color:' + (lg.reste > 0 ? 'var(--red)' : 'var(--text3)') + '">' +
          (lg.reste > 0 ? fmt(lg.reste) : '—') + '</td>' +
          '<td style="padding:8px 10px;text-align:center">' +
          (lg.versements.length ? '<button onclick="window.IG.paiements.imprimerRecu(' + loc.id + ',' + lg.mois + ',' + lg.annee + ')" style="border:none;background:none;cursor:pointer;font-size:14px" title="' + t('Reçu') + '">🖨️</button>' : '') +
          '</td>' +
          '</tr>';
      });

      // Ligne total
      var totalVerse = lignes.reduce(function(s, l) { return s + l.cumul; }, 0);
      html += '<tr style="background:var(--bg3);font-weight:700">' +
        '<td style="padding:8px 10px">' + t('TOTAL') + '</td>' +
        '<td style="padding:8px 10px;text-align:right">' + fmt((parseFloat(loc.loyer)||0) * nbMois + arrieres) + '</td>' +
        '<td></td>' +
        '<td style="padding:8px 10px;text-align:right">' + fmt(totalVerse) + '</td>' +
        '<td style="padding:8px 10px;text-align:right;color:' + (soldeFinal > 0 ? 'var(--red)' : 'var(--green)') + '">' + fmt(soldeFinal) + '</td>' +
        '<td></td>' +
        '</tr>';
      html += '</tbody></table></div>';
    }

    html += '<div id="ig-ad-fiche" style="margin-top:16px;text-align:center"></div>';
    html += '</div>';
    return html;
  }

  function _ficheInfo(label, val) {
    return '<div><div style="font-size:10px;color:var(--text3);font-weight:600;margin-bottom:2px">' + label + '</div>' +
      '<div style="font-size:12px;font-weight:600">' + val + '</div></div>';
  }

  // ── Aperçu avant impression (générique) ──────────────────────
  function _apercuImprimer(titre, bodyHtml, cssExtra) {
    var css = 'body{font-family:Arial,sans-serif;font-size:12px;padding:24px;color:#111;max-width:780px;margin:auto}' +
      'table{width:100%;border-collapse:collapse}th,td{padding:6px 10px;border:1px solid #ddd}' +
      'th{background:#f0f0f0;font-weight:700}.no-print{display:none}' + (cssExtra || '');

    var previewHtml =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">' +
      '<h3 style="font-size:15px;font-weight:700;margin:0">👁 Aperçu — ' + titre + '</h3>' +
      '<div style="display:flex;gap:8px">' +
      '<button id="btn-apercu-imprimer" style="padding:8px 18px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:600;cursor:pointer">🖨️ Imprimer / PDF</button>' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;cursor:pointer">✕ Fermer</button>' +
      '</div></div>' +
      '<div style="border:1px solid var(--border2);border-radius:8px;overflow:hidden">' +
      '<iframe id="apercu-iframe" style="width:100%;height:520px;border:none;background:#fff"></iframe>' +
      '</div>';

    var modal = window.IG.utils.showModal(previewHtml, { width: '800px' });

    var iframe = modal.box.querySelector('#apercu-iframe');
    var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (doc) {
      doc.open();
      doc.write('<html><head><style>' + css + '</style></head><body>' + bodyHtml + '</body></html>');
      doc.close();
    }

    modal.box.querySelector('#btn-apercu-imprimer').addEventListener('click', function() {
      var w = window.open('', '_blank', 'width=820,height=950');
      w.document.write('<html><head><title>' + titre + '</title><style>' + css + '@media print{.no-print{display:none}}</style></head><body>' + bodyHtml + '</body></html>');
      w.document.close();
      w.focus();
      setTimeout(function() { w.print(); }, 400);
    });
  }

  function imprimerFiche() {
    var zone = document.getElementById('fiche-print-zone');
    if (!zone) return;
    var titre = 'Fiche de suivi';
    var h3 = zone.querySelector('h3');
    if (h3) titre = h3.textContent.replace('📋', '').trim();
    _apercuImprimer(titre, zone.innerHTML);
  }

  function imprimerRecu(locId, mois, annee) {
    var loc = window.IG.locataires ? window.IG.locataires.getById(locId) : null;
    if (!loc) return;
    var imm    = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var cabinet = session.nomCabinet || session.nom || 'ImmoGest';
    var versements = (window.IG.paiements.getByLocataire(locId) || []).filter(function(v) {
      return parseInt(v.mois) === mois && parseInt(v.annee) === annee && (v.type === 'loyer' || !v.type);
    });
    var totalVerse = versements.reduce(function(s, v) { return s + (parseFloat(v.montant) || 0); }, 0);
    var nomMois = window.IG.utils.nomMois(mois) + ' ' + annee;

    var bodyHtml =
      '<h1 style="font-size:20px;text-align:center;margin-bottom:4px">REÇU DE LOYER</h1>' +
      '<div style="text-align:center;color:#666;font-size:12px;margin-bottom:30px">' + esc(cabinet) + ' — ' + new Date().toLocaleDateString('fr-FR') + '</div>' +
      '<table>' +
      '<tr><td>Locataire</td><td><strong>' + esc(loc.nom) + '</strong></td></tr>' +
      '<tr><td>Immeuble / Local</td><td>' + esc(imm ? (imm.nom_immeuble || imm.nom) : '') + ' — Local ' + esc(loc.appt || '?') + '</td></tr>' +
      '<tr><td>Période</td><td>' + nomMois + '</td></tr>' +
      '<tr><td>Loyer mensuel</td><td>' + fmt(loc.loyer) + '</td></tr>' +
      versements.map(function(v) {
        return '<tr><td>Versement du ' + window.IG.utils.formatDate(v.date_paiement) + '</td><td>' + fmt(v.montant) + ' (' + esc(v.mode_paiement || 'espèces') + ')</td></tr>';
      }).join('') +
      '<tr style="font-weight:700;font-size:15px;background:#f0f7ff"><td>TOTAL VERSÉ</td><td>' + fmt(totalVerse) + '</td></tr>' +
      (totalVerse < (parseFloat(loc.loyer)||0) ? '<tr><td style="color:#e74c3c">Reste dû</td><td style="color:#e74c3c;font-weight:700">' + fmt((parseFloat(loc.loyer)||0) - totalVerse) + '</td></tr>' : '') +
      '</table>' +
      '<div style="margin-top:40px;font-size:11px;color:#999;text-align:center">Document généré par ImmoGest · ' + new Date().toLocaleString('fr-FR') + '</div>';

    _apercuImprimer('Reçu ' + nomMois + ' — ' + esc(loc.nom), bodyHtml);
  }

  // ── Paiement depuis la fiche → rouvre la fiche après succès ──
  function afficherFormulaireFiche(locId) {
    afficherFormulaire(locId, function() {
      if (window.IG.locataires) window.IG.locataires.afficherFiche(locId);
    });
  }

  // ── Formulaire enregistrement paiement ────────────────────────
  function afficherFormulaire(locId, onSuccess) {
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
        if (onSuccess) {
          // Recharger les données puis rappeler le callback (ex: rouvrir la fiche)
          if (window.IG.app && window.IG.app.refresh) {
            window.IG.app.refresh();
            setTimeout(onSuccess, 500);
          } else {
            onSuccess();
          }
        } else {
          if (window.IG.app && window.IG.app.refresh) window.IG.app.refresh();
        }
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
    calculerFiche, renderFiche, afficherFormulaire, afficherFormulaireFiche,
    imprimerFiche, imprimerRecu, calculerStats
  };

})();
