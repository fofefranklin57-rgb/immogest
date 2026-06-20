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

  // ── Helpers fiche ────────────────────────────────────────────
  function _formatPeriode(mois, annee) {
    var debut = new Date(annee, mois - 1, 1);
    var fin   = new Date(annee, mois, 0);
    var d = function(dt) {
      return ('0' + dt.getDate()).slice(-2) + '/' + ('0' + (dt.getMonth()+1)).slice(-2) + '/' + dt.getFullYear();
    };
    return d(debut) + ' — ' + d(fin);
  }

  function _infoRow(l1, v1, l2, v2) {
    var cell = 'border:1px solid #BBBBBB;padding:4px 7px;font-size:10px;vertical-align:middle;';
    var lbl  = cell + 'background:#D8E8F7;font-weight:700;color:#1A1A1A;width:22%;';
    return '<tr><td style="' + lbl + '">' + l1 + '</td><td style="' + cell + '">' + v1 + '</td>' +
           '<td style="' + lbl + '">' + l2 + '</td><td style="' + cell + '">' + v2 + '</td></tr>';
  }

  // ── Algorithme cumul FIFO (du plus ancien au plus récent) ────
  function calculerFiche(locataire, versements, anneeMax) {
    if (!locataire || !locataire.entree) return [];

    var annee = anneeMax || new Date().getFullYear();

    var loyers = versements
      .filter(function(v) { return v.type === 'loyer' || !v.type; })
      .map(function(v) { return Object.assign({}, v, { _restant: parseFloat(v.montant) || 0 }); })
      .sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });

    var avances     = versements.filter(function(v) { return v.type === 'avance'; });
    var cumulAvance = avances.reduce(function(s, v) { return s + (parseFloat(v.montant) || 0); }, 0);

    // Générer les mois de la date d'entrée jusqu'à décembre de annee
    var entree  = new Date(locataire.entree);
    var moisList = [];
    var cur = new Date(entree.getFullYear(), entree.getMonth(), 1);
    var end = new Date(annee, 11, 31);
    while (cur <= end) {
      moisList.push({ mois: cur.getMonth() + 1, annee: cur.getFullYear() });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    var lignes = [];
    var loyer  = parseFloat(locataire.loyer) || 0;

    var aujourdhui = new Date();
    var moisCourant = aujourdhui.getMonth() + 1;
    var anneeCourante = aujourdhui.getFullYear();

    moisList.forEach(function(m) {
      // Mois futur = pas encore échu
      var futur = (m.annee > anneeCourante) ||
                  (m.annee === anneeCourante && m.mois > moisCourant);

      var cumul = 0;
      var versementsMois = [];

      if (!futur) {
        // 1. Consommer avance en premier
        if (cumulAvance >= loyer) {
          cumul = loyer;
          cumulAvance -= loyer;
        } else if (cumulAvance > 0) {
          cumul += cumulAvance;
          cumulAvance = 0;
        }

        // 2. Consommer versements FIFO
        loyers.forEach(function(v) {
          if (v._restant <= 0 || cumul >= loyer) return;
          var pris = Math.min(loyer - cumul, v._restant);
          v._restant -= pris;
          cumul += pris;
          versementsMois.push({ montant: pris, date: v.date_paiement, note: v.note, id: v.id, mode_paiement: v.mode_paiement || 'espèces' });
        });
      }

      var paye = !futur && cumul >= loyer;
      lignes.push({
        periode:    _formatPeriode(m.mois, m.annee),
        mois:       m.mois,
        annee:      m.annee,
        futur:      futur,
        statut:     futur ? 'À venir' : (paye ? 'Payé' : (cumul > 0 ? 'Partiel' : 'Impayé')),
        versements: versementsMois,
        cumul:      cumul,
        reste:      futur ? 0 : (paye ? 0 : loyer - cumul)
      });
    });

    return lignes;
  }

  // ── Rendu fiche de suivi V2 ──────────────────────────────────
  function renderFiche(loc, versements, anneeParam) {
    var annee      = anneeParam || new Date().getFullYear();
    var toutesLignes = calculerFiche(loc, versements, annee);
    var imm        = window.IG.immeubles ? window.IG.immeubles.getById(loc.immeuble_id) : null;
    var session    = window.IG.auth ? window.IG.auth.getSession() : {};
    var params     = session.parametres || {};
    var loyer      = parseFloat(loc.loyer) || 0;

    // Paramètres cabinet (auto depuis settings)
    var cabNom       = params.nom_cabinet  || session.nomCabinet || session.nom || 'Cabinet';
    var cabAdresse   = params.adresse      || session.adresse    || '';
    var cabTel       = params.tel          || session.telephone  || '';
    var cabEmail     = params.email        || (params && params.email) || '';
    var cabVille     = params.ville        || (imm && imm.ville) || 'Yaoundé';
    var cabLogo      = params.logo_url     || null;
    var cabSignataire= params.signataire   || '';
    var cabRccm      = params.rccm         || '';

    // Lignes de l'année affichée
    var lignes = toutesLignes.filter(function(lg) { return lg.annee === annee; });

    // Statistiques
    var now        = new Date();
    var todayYYMM  = now.getFullYear() * 100 + (now.getMonth() + 1);
    var nbPayes    = lignes.filter(function(l) { return l.statut === 'Payé'; }).length;
    var totalVerse = lignes.reduce(function(s, l) { return s + (l.cumul  || 0); }, 0);
    var totalReste = lignes.reduce(function(s, l) { return s + (l.reste  || 0); }, 0);
    var nbMoisAll  = toutesLignes.length;
    var nbPayesAll = toutesLignes.filter(function(l) { return l.statut === 'Payé'; }).length;
    var score      = nbMoisAll ? Math.round((nbPayesAll / nbMoisAll) * 100) : 100;
    var scoreCouleur = score >= 80 ? '#27ae60' : score >= 50 ? '#f39c12' : '#e74c3c';
    var scoreLabel   = score >= 80 ? 'Fiable' : score >= 50 ? 'Moyen' : 'À risque';

    // Sélecteur d'années
    var entreeY = loc.entree ? new Date(loc.entree).getFullYear() : now.getFullYear();
    var curY    = now.getFullYear();
    var years   = [];
    for (var y = entreeY; y <= curY; y++) years.push(y);

    // Infos immeuble
    var immNom    = imm ? (imm.nom_immeuble || imm.nom || '—') : '—';

    // Date edition
    var dateEdition = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    var refDoc      = cabNom.replace(/\s/g,'').substring(0,4).toUpperCase() + '/FS/' + annee + '/' + esc(loc.appt || loc.nom || '').replace(/\s/g,'');

    var TH = 'background:#0E6AAF;color:#fff;padding:5px 7px;font-size:9.5px;text-align:left;font-weight:700;border:1px solid #0E6AAF;';
    var TD = 'border:1px solid #CCCCCC;padding:4px 7px;font-size:9.5px;vertical-align:top;';

    // ── Barre actions ─────────────────────────────────────────
    var html = '<div id="fiche-print-zone">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;gap:8px;flex-wrap:wrap">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<label style="font-size:12px;color:var(--text2);font-weight:600">Année :</label>' +
      '<select id="fiche-annee-sel" style="padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)" onchange="window.IG.locataires.rafraichirFiche(' + loc.id + ')">' +
      years.map(function(y) { return '<option value="' + y + '"' + (y === annee ? ' selected' : '') + '>' + y + '</option>'; }).join('') +
      '</select></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
      '<button onclick="window.IG.paiements.afficherFormulaireFiche(' + loc.id + ')" style="padding:7px 13px;border-radius:8px;border:none;background:var(--green);color:#fff;font-size:12px;font-weight:600;cursor:pointer">+ Paiement</button>' +
      '<button onclick="window.IG.paiements.imprimerFiche()" style="padding:7px 13px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">🖨️ PDF</button>' +
      (window.IG.ai ? '<button onclick="window.IG.ai.analyserLocataire(' + loc.id + ')" style="padding:7px 13px;border-radius:8px;border:none;background:linear-gradient(135deg,#7C3AED,#0E6AAF);color:#fff;font-size:12px;font-weight:600;cursor:pointer">✨ IA</button>' : '') +
      '</div></div>';

    // Cards solde + score
    html +=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">' +
      '<div style="background:' + (totalReste > 0 ? 'rgba(231,76,60,0.1)' : 'rgba(39,174,96,0.1)') + ';border-radius:10px;padding:12px;text-align:center">' +
      '<div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text3);margin-bottom:4px">' + (totalReste > 0 ? '⚠️ Solde dû' : '✅ À jour') + '</div>' +
      '<div style="font-size:20px;font-weight:800;color:' + (totalReste > 0 ? '#e74c3c' : '#27ae60') + '">' + fmt(Math.abs(totalReste)) + '</div>' +
      '</div>' +
      '<div style="background:var(--bg3);border-radius:10px;padding:12px;text-align:center">' +
      '<div style="font-size:10px;text-transform:uppercase;font-weight:700;color:var(--text3);margin-bottom:4px">🎯 Score fiabilité</div>' +
      '<div style="font-size:20px;font-weight:800;color:' + scoreCouleur + '">' + score + '<span style="font-size:12px;font-weight:500">/100</span></div>' +
      '<div style="font-size:11px;color:' + scoreCouleur + ';margin-top:2px">' + scoreLabel + '</div>' +
      '</div></div>';

    // ── Document papier ──────────────────────────────────────
    html += '<div id="fiche-doc" style="font-family:\'Times New Roman\',serif;font-size:11px;background:#fff;color:#111;padding:20px;border:0.5px solid #ddd;border-radius:4px">';

    // En-tête cabinet (logo ou nom texte)
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:8px"><tr>' +
      '<td style="vertical-align:top;width:55%">';
    if (cabLogo) {
      html += '<img src="' + cabLogo + '" style="max-height:48px;max-width:140px;margin-bottom:4px"><br>';
    } else {
      html += '<div style="font-size:13px;font-weight:700;color:#0E6AAF">' + esc(cabNom) + '</div>';
    }
    if (cabAdresse)  html += '<div style="font-size:9px;color:#333">' + esc(cabAdresse) + '</div>';
    if (cabTel)      html += '<div style="font-size:9px;color:#333">Tél : ' + esc(cabTel) + '</div>';
    if (cabEmail)    html += '<div style="font-size:9px;color:#333">Email : ' + esc(cabEmail) + '</div>';
    if (cabRccm)     html += '<div style="font-size:9px;color:#666">RCCM : ' + esc(cabRccm) + '</div>';
    html += '</td><td style="vertical-align:top;text-align:right">' +
      '<div style="font-size:9px;color:#333">' + esc(cabVille) + ', le ' + dateEdition + '</div>' +
      '<div style="font-size:8.5px;color:#666;font-style:italic">Réf : ' + refDoc + '</div>' +
      '</td></tr></table>';

    // Séparateur
    html += '<div style="border-bottom:3px solid #0E6AAF;margin:8px 0 10px"></div>';

    // Titre + sous-titre
    html += '<div style="text-align:center;font-size:14px;font-weight:700;color:#0E6AAF;margin-bottom:4px;text-transform:uppercase;text-decoration:underline">Fiche de suivi des versements</div>';
    html += '<div style="text-align:center;font-style:italic;font-size:10px;color:#333;margin-bottom:12px">Depuis le ' + (loc.entree ? window.IG.utils.formatDate(loc.entree) : '—') + ' — Édition au ' + dateEdition + '</div>';

    // Infos locataire
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:12px">';
    html += _infoRow('Locataire',     esc(loc.nom),                                  'Immeuble',      esc(immNom));
    html += _infoRow('Local',         esc(loc.appt || '—'),                          'Date d\'entrée', loc.entree ? window.IG.utils.formatDate(loc.entree) : '—');
    html += _infoRow('Loyer mensuel', fmt(loyer) + ' F',                             'Caution versée', fmt(parseFloat(loc.caution) || 0) + ' F');
    html += '</table>';

    // Section Caution & avances
    var cautions = versements.filter(function(v) { return v.type === 'caution'; });
    var avances  = versements.filter(function(v) { return v.type === 'avance'; });
    var speciaux = cautions.concat(avances).sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });
    if (speciaux.length) {
      html += '<div style="font-size:10.5px;font-weight:700;color:#0E6AAF;margin:10px 0 5px;text-transform:uppercase">Caution &amp; avances versées à l\'entrée</div>';
      html += '<table style="width:100%;border-collapse:collapse;margin-bottom:10px">';
      html += '<thead><tr>' +
        '<th style="' + TH + '">Type</th>' +
        '<th style="' + TH + '">Date</th>' +
        '<th style="' + TH + '">Montant</th>' +
        '<th style="' + TH + '">Mode</th>' +
        '<th style="' + TH + '">Mois couverts</th>' +
        '<th style="' + TH + '">Note</th>' +
        '</tr></thead><tbody>';
      speciaux.forEach(function(v, i) {
        var bg = i % 2 === 0 ? '' : 'background:#F5F9FD;';
        var moisCouverts = v.type === 'avance' ? Math.floor((parseFloat(v.montant) || 0) / loyer) + ' mois' : '—';
        html += '<tr style="' + bg + '">' +
          '<td style="' + TD + 'font-weight:700">' + (v.type === 'caution' ? 'Caution' : 'Avance') + '</td>' +
          '<td style="' + TD + '">' + (v.date_paiement ? window.IG.utils.formatDate(v.date_paiement) : '—') + '</td>' +
          '<td style="' + TD + '">' + fmt(v.montant) + ' F</td>' +
          '<td style="' + TD + '">' + esc(v.mode_paiement || 'espèces') + '</td>' +
          '<td style="' + TD + '">' + moisCouverts + '</td>' +
          '<td style="' + TD + '">' + esc(v.note || '—') + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    // Section Historique
    html += '<div style="font-size:10.5px;font-weight:700;color:#0E6AAF;margin:10px 0 5px;text-transform:uppercase">Historique des versements</div>';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:10px">';
    html += '<thead><tr>' +
      '<th style="' + TH + 'width:22%">Période</th>' +
      '<th style="' + TH + 'width:10%">Statut</th>' +
      '<th style="' + TH + 'width:35%">Versement(s) — Montant / Date</th>' +
      '<th style="' + TH + 'width:13%">Reste dû</th>' +
      '<th style="' + TH + 'width:20%">Observation</th>' +
      '</tr></thead><tbody>';

    lignes.forEach(function(lg, i) {
      var bg      = i % 2 === 0 ? '' : 'background:#F5F9FD;';
      var isFutur = (lg.annee * 100 + lg.mois) > todayYYMM;

      if (isFutur) {
        html += '<tr style="' + bg + '">' +
          '<td style="' + TD + 'color:#bbb;font-style:italic">' + lg.periode + '</td>' +
          '<td style="' + TD + '"></td><td style="' + TD + '"></td>' +
          '<td style="' + TD + '"></td><td style="' + TD + '"></td>' +
          '</tr>';
        return;
      }

      // Statut : affiché uniquement si mois intégralement payé
      var statutCell = lg.statut === 'Payé'
        ? '<span style="color:#1a7a3a;font-weight:700">Payé</span>'
        : '';

      // Versements empilés
      var versCell = '';
      if (lg.versements && lg.versements.length > 0) {
        versCell = lg.versements.map(function(v) {
          return '<span style="display:block;line-height:1.8">' +
            fmt(v.montant) + ' F &nbsp;—&nbsp; ' +
            (v.date ? window.IG.utils.formatDate(v.date) : '—') +
            '</span>';
        }).join('');
      } else if (lg.cumul > 0) {
        versCell = '<span style="color:#888;font-style:italic;font-size:9px">Couvert par avance</span>';
      }

      var resteCell = (lg.reste > 0 && lg.cumul > 0)
        ? '<span style="color:#c0392b;font-weight:700">' + fmt(lg.reste) + ' F</span>'
        : (lg.statut === 'Payé' ? '—' : '');

      var obs = lg.versements && lg.versements.length > 1
        ? lg.versements.length + ' versements'
        : (lg.versements && lg.versements[0] ? esc(lg.versements[0].note || '') : '');

      var recuBtn = (lg.versements && lg.versements.length > 0)
        ? ' <button onclick="window.IG.paiements.imprimerRecu(' + loc.id + ',' + lg.mois + ',' + lg.annee + ')" style="border:none;background:none;cursor:pointer;font-size:11px;padding:0;margin-left:4px" title="Reçu">🖨️</button>'
        : '';

      html += '<tr style="' + bg + '">' +
        '<td style="' + TD + '">' + lg.periode + '</td>' +
        '<td style="' + TD + '">' + statutCell + '</td>' +
        '<td style="' + TD + '">' + versCell + '</td>' +
        '<td style="' + TD + '">' + resteCell + '</td>' +
        '<td style="' + TD + '">' + obs + recuBtn + '</td>' +
        '</tr>';
    });

    // Ligne TOTAUX
    html += '<tr style="background:#0E6AAF">' +
      '<td style="' + TD + 'border-color:#0E6AAF;font-weight:700;color:#fff">' + nbPayes + ' mois payés</td>' +
      '<td style="' + TD + 'border-color:#0E6AAF"></td>' +
      '<td style="' + TD + 'border-color:#0E6AAF;font-weight:700;color:#fff">' + fmt(totalVerse) + ' F</td>' +
      '<td style="' + TD + 'border-color:#0E6AAF;font-weight:700;color:#fff">' + fmt(totalReste) + ' F</td>' +
      '<td style="' + TD + 'border-color:#0E6AAF"></td>' +
      '</tr>';
    html += '</tbody></table>';

    // Solde dû / À jour
    if (totalReste > 0) {
      html += '<div style="background:#fff5f5;border:1px solid #e74c3c;padding:7px 12px;text-align:center;font-weight:700;font-size:11.5px;color:#c0392b;margin:12px 0;border-radius:3px">' +
        'SOLDE DÛ AU ' + dateEdition.toUpperCase() + ' : ' + fmt(totalReste) + ' F' +
        '</div>';
    } else {
      html += '<div style="background:#f0faf4;border:1px solid #27ae60;padding:7px 12px;text-align:center;font-weight:700;font-size:11.5px;color:#1a7a3a;margin:12px 0;border-radius:3px">' +
        '✓ À JOUR AU ' + dateEdition.toUpperCase() +
        '</div>';
    }

    // Signatures
    html += '<div style="display:flex;justify-content:space-between;margin-top:18px;border-top:1px solid #ddd;padding-top:12px">' +
      '<div style="text-align:center;width:45%;font-size:9.5px">' +
      '<div style="font-weight:700;font-size:10px">Le Gestionnaire</div>' +
      '<div>' + esc(cabNom) + '</div>' +
      (cabSignataire ? '<div style="color:#666;font-size:9px">' + esc(cabSignataire) + '</div>' : '') +
      '<div style="border-top:1px solid #555;margin-top:30px;padding-top:4px;font-style:italic;color:#666;font-size:9px">Signature et cachet</div>' +
      '</div>' +
      '<div style="text-align:center;width:45%;font-size:9.5px">' +
      '<div style="font-weight:700;font-size:10px">Le Locataire</div>' +
      '<div>' + esc(loc.nom) + '</div>' +
      '<div style="border-top:1px solid #555;margin-top:30px;padding-top:4px;font-style:italic;color:#666;font-size:9px">Signature</div>' +
      '</div></div>';

    html += '</div>'; // fin fiche-doc
    html += '<div id="ig-ad-fiche" style="margin-top:14px;text-align:center"></div>';
    html += '</div>'; // fin fiche-print-zone

    return html;
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
      (function() {
        var session = window.IG.auth ? window.IG.auth.getSession() : {};
        var profil = session.type_profil || '';
        if (profil === 'proprietaire') return '';
        return '<div style="margin-bottom:12px;padding:10px 12px;background:var(--bg3);border-radius:8px;display:flex;align-items:center;gap:10px">' +
          '<input type="checkbox" name="remisAuBailleur" id="chk-remis" value="1" style="width:16px;height:16px;cursor:pointer">' +
          '<label for="chk-remis" style="font-size:13px;color:var(--text);cursor:pointer">' +
          t('Loyer remis directement au bailleur') + '</label></div>';
      })() +
      '<div id="ig-ad-pay-form" style="margin:14px 0 10px;text-align:center"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px">' +
      '<button type="button" data-modal-close style="padding:10px 18px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer">' + t('Annuler') + '</button>' +
      '<button type="submit" style="padding:10px 20px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-weight:600">💵 ' + t('Enregistrer') + '</button>' +
      '</div></form>';

    var modal = window.IG.utils.showModal(html, { width: '480px' });
    setTimeout(function() { if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-pay-form', 'ad1'); }, 80);

    // Auto-dériver mois et année depuis la date de paiement
    var dateInput = modal.box.querySelector('[name="date_paiement"]');
    var moisInput = modal.box.querySelector('[name="mois"]');
    var anneeInput = modal.box.querySelector('[name="annee"]');
    if (dateInput && moisInput && anneeInput) {
      dateInput.addEventListener('change', function() {
        var d = new Date(this.value);
        if (!isNaN(d)) {
          moisInput.value = d.getMonth() + 1;
          anneeInput.value = d.getFullYear();
        }
      });
    }

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
        note:           fd.get('note'),
        remisAuBailleur: fd.get('remisAuBailleur') === '1'
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
