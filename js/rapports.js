// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Rapports (HTML aperçu + DOCX)
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.rapports = (function() {

  function t(k)   { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  function devise() { return (window.IG._locale && window.IG._locale.devise) || 'FCFA'; }

  // ── Nombres en lettres ───────────────────────────────────────
  function _enLettres(n) {
    var u = ['','un','deux','trois','quatre','cinq','six','sept','huit','neuf',
             'dix','onze','douze','treize','quatorze','quinze','seize','dix-sept','dix-huit','dix-neuf'];
    var d = ['','','vingt','trente','quarante','cinquante','soixante','soixante','quatre-vingt','quatre-vingt'];
    function _diz(n) {
      if (n < 20) return u[n];
      var q = Math.floor(n / 10), r = n % 10;
      if (q === 7) return 'soixante-' + (r === 1 ? 'et-onze' : (r > 0 ? u[10+r] : 'dix'));
      if (q === 9) return 'quatre-vingt-' + (r > 0 ? u[r] : '');
      return d[q] + (r === 1 && q !== 8 ? '-et-un' : (r > 0 ? '-' + u[r] : (q === 8 ? 's' : '')));
    }
    function _cent(n) {
      if (n < 100) return _diz(n);
      var c = Math.floor(n / 100), r = n % 100;
      var base = c > 1 ? u[c] + '-cent' : 'cent';
      return r > 0 ? base + '-' + _diz(r) : base + (c > 1 ? 's' : '');
    }
    function _mille(n) {
      if (n < 1000) return _cent(n);
      var m = Math.floor(n / 1000), r = n % 1000;
      var base = m === 1 ? 'mille' : _cent(m) + '-mille';
      return r > 0 ? base + '-' + _cent(r) : base;
    }
    function _million(n) {
      if (n < 1000000) return _mille(n);
      var m = Math.floor(n / 1000000), r = n % 1000000;
      var base = _mille(m) + (m > 1 ? '-millions' : '-million');
      return r > 0 ? base + '-' + _mille(r) : base;
    }
    n = Math.round(n);
    if (!n) return 'zéro';
    var sign = n < 0 ? 'moins-' : '';
    var s = _million(Math.abs(n));
    return (sign + s).replace(/-+/g,'-').replace(/^-|-$/g,'') + ' francs CFA';
  }

  function _fmtD(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return ('0'+d.getDate()).slice(-2) + '/' + ('0'+(d.getMonth()+1)).slice(-2) + '/' + d.getFullYear();
  }

  // ── Rapport mensuel HTML — spec V2 (juin 2026) ──────────────
  function genererRapportMensuelHTML(immeubleId, dateDebut, dateFin, immeubles, locataires, paiements) {
    var session  = window.IG.auth ? window.IG.auth.getSession() : {};
    var params   = session.parametres || {};
    var typeProfil = session.type_profil || 'gestionnaire';
    var isCab    = (typeProfil === 'gestionnaire' || typeProfil === 'cabinet');
    var devise   = (window.IG._locale && window.IG._locale.devise) || 'FCFA';

    var imm = immeubles.filter(function(i) { return i.id == immeubleId; })[0];
    if (!imm) return '<p style="padding:20px;color:var(--text3)">Sélectionnez un immeuble.</p>';

    var nomCab  = params.nom_cabinet || session.nomCabinet || session.nom || 'Cabinet';
    var adresse = params.adresse || '';
    var tel     = params.telephone || session.telephone || '';
    var ville   = params.ville || imm.ville || '';
    var nomImm  = imm.nom_immeuble || imm.nom || '';
    var quartier= imm.quartier || '';

    var debut = new Date(dateDebut);
    var fin   = new Date(dateFin);

    var MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

    var cabAbbr    = nomCab.replace(/[^A-Za-z]/g,'').substring(0,4).toUpperCase();
    var refDoc     = cabAbbr + '/RM/' + fin.getFullYear() + '/' + (quartier || nomImm).replace(/\s+/g,'');
    var dateDoc    = (ville ? ville + ', ' : '') + 'le ' + fin.getDate() + ' ' + MOIS_FR[fin.getMonth()] + ' ' + fin.getFullYear();
    var fmtDebut   = _fmtD(dateDebut);
    var fmtFin     = _fmtD(dateFin);
    var periodeEncL= debut.getDate() + ' ' + MOIS_FR[debut.getMonth()].toUpperCase() + ' AU ' + fin.getDate() + ' ' + MOIS_FR[fin.getMonth()].toUpperCase() + ' ' + fin.getFullYear();

    var locsImm = locataires.filter(function(l) {
      return l.immeuble_id == immeubleId && l.statut !== 'libre';
    });
    var locIds = locsImm.map(function(l) { return l.id; });
    var paysP  = paiements.filter(function(p) {
      if (locIds.indexOf(parseInt(p.locataire_id)) < 0 && locIds.indexOf(p.locataire_id) < 0) return false;
      if (!p.date_paiement) return false;
      var d = new Date(p.date_paiement);
      return d >= debut && d <= fin;
    }).sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });

    var TH = 'padding:7px 9px;background:#0E6AAF;color:#fff;font-size:10.5px;font-weight:700;border:1px solid #0d5fa0;text-align:left;';
    var TD = 'padding:6px 9px;border:1px solid #e0e0e0;font-size:11px;vertical-align:top;';

    // ── Section 1 : locataires ───────────────────────────────────
    var totalResteS1 = 0;
    var s1Rows = '';
    locsImm.forEach(function(loc, i) {
      var loyer = parseFloat(loc.loyer) || 0;
      var lPays = paysP.filter(function(p) {
        return (parseInt(p.locataire_id) == parseInt(loc.id) || p.locataire_id == loc.id) &&
               (p.type || 'loyer') !== 'caution';
      });
      var dernierPay = lPays.length ? lPays[lPays.length - 1] : null;
      var dernierStr = dernierPay
        ? _fmtD(dernierPay.date_paiement) + '<br><span style="color:#555">' + fmt(dernierPay.montant) + '</span>'
        : '—';
      var totalPaye = lPays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
      var reste     = Math.max(0, loyer - totalPaye);
      totalResteS1 += reste;

      var obs = [];
      if (isCab) {
        var remisLoc = lPays.filter(function(p) { return p.remisAuBailleur; });
        if (remisLoc.length) obs.push(fmt(remisLoc.reduce(function(s,p){return s+(parseFloat(p.montant)||0);},0)) + ' remis au bailleur');
      }
      var notes = lPays.filter(function(p){ return p.note; }).map(function(p){ return p.note; });
      if (notes.length) obs = obs.concat(notes);
      if (!obs.length) obs.push(reste <= 0 ? 'À jour' : 'Doit ' + MOIS_FR[fin.getMonth()]);

      s1Rows += '<tr style="'+(i%2?'background:#f9fafb;':'')+'">' +
        '<td style="'+TD+'font-weight:700">'+esc(loc.appt||'—')+'</td>' +
        '<td style="'+TD+'">'+esc(loc.nom)+(loc.telephone?'<br><span style="font-size:10px;color:#888">'+esc(loc.telephone)+'</span>':'')+'</td>' +
        '<td style="'+TD+'text-align:right">'+fmt(loyer)+'</td>' +
        '<td style="'+TD+'font-size:10.5px">'+dernierStr+'</td>' +
        '<td style="'+TD+'font-size:10px;color:#555">'+obs.join('<br>')+'</td>' +
        '<td style="'+TD+'text-align:right;font-weight:700;color:'+(reste>0?'#c62828':'#aaa')+'">'+( reste>0?fmt(reste):'—')+'</td>' +
      '</tr>';
    });
    s1Rows += '<tr style="background:#1a2e4a;color:#fff;font-weight:700">' +
      '<td style="padding:7px 9px;border:1px solid #2d4a6e" colspan="5">TOTAL RESTE À PAYER</td>' +
      '<td style="padding:7px 9px;border:1px solid #2d4a6e;text-align:right;color:#f1948a">'+fmt(totalResteS1)+'</td>' +
    '</tr>';

    // ── Section 2 : encaissements ────────────────────────────────
    var totalLoyers = 0, totalCautions = 0, totalRemis = 0;
    var s2Rows = '';
    paysP.forEach(function(p, i) {
      var loc = locsImm.filter(function(l){ return parseInt(l.id) == parseInt(p.locataire_id); })[0] || {};
      var montant = parseFloat(p.montant) || 0;
      var typeP   = (p.type || 'loyer').toLowerCase();
      if (typeP === 'caution') totalCautions += montant; else totalLoyers += montant;
      if (p.remisAuBailleur && isCab) totalRemis += montant;
      var noteCell = p.note ? esc(p.note) : (typeP === 'caution' ? 'Caution' : typeP === 'avance' ? 'Avance' : 'Loyer');
      s2Rows += '<tr style="'+(i%2?'background:#f9fafb;':'')+'">' +
        '<td style="'+TD+'">'+_fmtD(p.date_paiement)+'</td>' +
        '<td style="'+TD+'font-weight:700">'+esc(loc.appt||'—')+'</td>' +
        '<td style="'+TD+'">'+esc(loc.nom||'—')+'</td>' +
        '<td style="'+TD+'font-size:10px;color:#555">'+noteCell+'</td>' +
        '<td style="'+TD+'text-align:right;font-weight:700">'+fmt(montant)+'</td>' +
      '</tr>';
    });
    if (!paysP.length) {
      s2Rows = '<tr><td colspan="5" style="padding:14px;text-align:center;color:#999;font-style:italic">Aucun encaissement dans cette période</td></tr>';
    }

    // ── Récapitulatif financier ──────────────────────────────────
    var honoraires = 0;
    if (isCab) {
      if ((imm.type_honoraires || 'aucun') === 'pourcentage') {
        honoraires = Math.round(totalLoyers * ((parseFloat(imm.valeur_honoraires) || 0) / 100));
      } else if (imm.type_honoraires === 'forfait') {
        honoraires = parseFloat(imm.valeur_honoraires) || 0;
      }
    }
    var totalBrut   = totalLoyers + totalCautions;
    var totalCab    = totalBrut - totalRemis;
    var netAPer     = totalCab - honoraires;

    function _rl(lbl, val, opts) {
      var o = opts || {};
      var color = o.color || '#111';
      var valStr = (o.neg ? '— ' : '') + fmt(val);
      return '<tr style="border-bottom:1px solid #eee">' +
        '<td style="padding:5px 10px;font-size:11px;'+(o.bold?'font-weight:700':'')+'">'+lbl+'</td>' +
        '<td style="padding:5px 10px;text-align:right;font-size:11px;font-weight:700;color:'+color+'">'+valStr+'</td></tr>';
    }

    var recapHtml = '<table style="width:100%;border-collapse:collapse;border:1px solid #ddd">' +
      _rl('Loyers encaissés', totalLoyers) +
      _rl('Cautions reçues', totalCautions) +
      '<tr style="background:#e8f4fd"><td style="padding:6px 10px;font-size:11px;font-weight:800">TOTAL LOYER</td>' +
      '<td style="padding:6px 10px;text-align:right;font-size:12px;font-weight:800">'+fmt(totalBrut)+'</td></tr>';
    if (isCab) {
      recapHtml += _rl('Loyer reçu par le bailleur', totalRemis, { neg: true, color: '#c62828' }) +
        _rl('Total collecté au cabinet', totalCab, { bold: true }) +
        _rl('Paiement cabinet (honoraires)', honoraires, { neg: true, color: '#c62828' });
      recapHtml += '<tr style="background:#1a2e4a"><td style="padding:8px 10px;font-size:13px;font-weight:900;color:#fff">NET À PERCEVOIR</td>' +
        '<td style="padding:8px 10px;text-align:right;font-size:14px;font-weight:900;color:#7ecba0">'+fmt(netAPer)+'</td></tr>';
    } else {
      recapHtml += '<tr style="background:#e8f5e9"><td style="padding:8px 10px;font-size:13px;font-weight:900">NET ENCAISSÉ</td>' +
        '<td style="padding:8px 10px;text-align:right;font-size:14px;font-weight:900;color:#1a6b3a">'+fmt(totalBrut)+'</td></tr>';
    }
    recapHtml += '</table>';

    var montantPhrase = isCab ? netAPer : totalBrut;
    var lettres       = _enLettres(Math.abs(montantPhrase));
    var nomProprio    = imm.nom_proprio || '';

    // ── Assemblage ───────────────────────────────────────────────
    var html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;color:#111">';

    // En-tête
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tr>' +
      '<td style="vertical-align:top;width:60%">' +
      '<div style="font-size:13px;font-weight:900;color:#0E6AAF">'+esc(nomCab)+'</div>' +
      (adresse ? '<div style="font-size:9.5px;color:#333">'+esc(adresse)+'</div>' : '') +
      (tel     ? '<div style="font-size:9.5px;color:#333">Tél : '+esc(tel)+'</div>' : '') +
      '</td><td style="vertical-align:top;text-align:right">' +
      '<div style="font-size:9.5px;color:#333">'+esc(dateDoc)+'</div>' +
      '<div style="font-size:9px;color:#777;font-style:italic">Réf : '+esc(refDoc)+'</div>' +
      '</td></tr></table>';

    // Séparateur bleu
    html += '<div style="border-bottom:3px solid #0E6AAF;margin-bottom:14px"></div>';

    // Titre centré
    html += '<div style="text-align:center;margin-bottom:16px">' +
      '<div style="font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:0.3px">RAPPORT MENSUEL — IMMEUBLE ' + esc(nomImm.toUpperCase()) + '</div>' +
      '<div style="font-style:italic;color:#555;font-size:11px;margin-top:4px">'+esc(quartier||nomImm)+' · du '+fmtDebut+' · au '+fmtFin+'</div>' +
      '</div>';

    // Section 1
    html += '<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:#0E6AAF;margin-bottom:8px;border-left:4px solid #0E6AAF;padding-left:8px">LISTE DES LOCATAIRES ET SITUATION LOCATIVE</div>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:18px"><thead><tr>' +
      '<th style="'+TH+'">Local</th>' +
      '<th style="'+TH+'">Nom &amp; Téléphone</th>' +
      '<th style="'+TH+'text-align:right">Loyer</th>' +
      '<th style="'+TH+'">Dernier paiement</th>' +
      '<th style="'+TH+'">Observations</th>' +
      '<th style="'+TH+'text-align:right">Reste à payer</th>' +
      '</tr></thead><tbody>'+s1Rows+'</tbody></table>';

    // Section 2
    html += '<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:#0E6AAF;margin-bottom:8px;border-left:4px solid #0E6AAF;padding-left:8px">ENCAISSEMENTS — '+esc(periodeEncL)+'</div>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:18px"><thead><tr>' +
      '<th style="'+TH+'">Date</th>' +
      '<th style="'+TH+'">Local</th>' +
      '<th style="'+TH+'">Locataire</th>' +
      '<th style="'+TH+'">Note</th>' +
      '<th style="'+TH+'text-align:right">Montant</th>' +
      '</tr></thead><tbody>'+s2Rows+'</tbody></table>';

    // Récapitulatif aligné à droite
    html += '<div style="max-width:380px;margin-left:auto;margin-bottom:18px">' + recapHtml + '</div>';

    // Arrêté en lettres
    html += '<div style="font-size:11px;color:#333;font-style:italic;margin-bottom:22px;line-height:1.5">' +
      'Soit : '+esc(lettres)+' nets à percevoir au titre des loyers de '+MOIS_FR[fin.getMonth()]+' '+fin.getFullYear()+'.' +
      '</div>';

    // Signatures
    html += '<div style="border-top:1px solid #ddd;padding-top:14px;display:flex;justify-content:space-between">' +
      '<div style="text-align:center;width:44%">' +
      '<div style="font-size:10.5px;font-weight:700">Le Gestionnaire</div>' +
      '<div style="font-size:10px;color:#555">'+esc(nomCab)+'</div>' +
      '<div style="height:38px"></div>' +
      '<div style="border-top:1px solid #555;padding-top:3px;font-size:9px;color:#888;font-style:italic">Signature &amp; Cachet</div>' +
      '</div>' +
      '<div style="text-align:center;width:44%">' +
      '<div style="font-size:10.5px;font-weight:700">Lu et approuvé — Le Propriétaire</div>' +
      '<div style="font-size:10px;color:#555">'+esc(nomProprio||nomImm)+'</div>' +
      '<div style="height:38px"></div>' +
      '<div style="border-top:1px solid #555;padding-top:3px;font-size:9px;color:#888;font-style:italic">Signature</div>' +
      '</div></div>';

    html += '<div style="text-align:center;color:#ccc;font-size:9px;margin-top:20px;border-top:1px solid #f0f0f0;padding-top:8px">Document généré le '+_fmtD(new Date().toISOString().slice(0,10))+' par ImmoGest v2 — '+esc(nomCab)+'</div>';
    html += '</div>';
    return html;
  }


  function _metricCard(icon, val, label) {
    return '<div style="background:var(--bg3);border-radius:10px;padding:16px;text-align:center">' +
      '<div style="font-size:24px;margin-bottom:6px">' + icon + '</div>' +
      '<div style="font-size:20px;font-weight:700;color:var(--accent)">' + val + '</div>' +
      '<div style="font-size:11px;color:var(--text3);text-transform:uppercase;margin-top:4px">' + label + '</div>' +
      '</div>';
  }

  // ── Afficher modal rapport mensuel ───────────────────────────
  function afficherRapportMensuel(immeubleIdPreselect) {
    var now = new Date();
    var imm = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay = window.IG.paiements  ? window.IG.paiements.getCache()  : [];

    // 1er et dernier jour du mois courant
    var defDebut = new Date(now.getFullYear(), now.getMonth(), 1);
    var defFin   = new Date(now.getFullYear(), now.getMonth()+1, 0);
    function _iso(d) { return d.toISOString().split('T')[0]; }

    var immOptions = imm.map(function(i) {
      var sel = immeubleIdPreselect ? (i.id == immeubleIdPreselect ? ' selected' : '') : '';
      return '<option value="' + i.id + '"' + sel + '>' + esc(i.nom_immeuble || i.nom) + '</option>';
    }).join('');

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<h3 style="font-size:16px">📊 ' + t('Rapport mensuel') + '</h3>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-bottom:8px;align-items:end">' +
      '<div><label style="font-size:11px;font-weight:600;color:var(--text2)">IMMEUBLE</label>' +
      '<select id="rapport-imm" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      (immOptions || '<option value="">—</option>') + '</select></div>' +

      '<div><label style="font-size:11px;font-weight:600;color:var(--text2)">DÉBUT</label>' +
      '<input id="rapport-debut" type="date" value="' + _iso(defDebut) + '" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +

      '<div><label style="font-size:11px;font-weight:600;color:var(--text2)">FIN</label>' +
      '<input id="rapport-fin" type="date" value="' + _iso(defFin) + '" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '</div>' +

      '<div style="margin-bottom:12px;display:flex;gap:8px">' +
      '<button id="btn-mois-courant" style="padding:5px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--bg3);font-size:11px;cursor:pointer">Mois courant</button>' +
      '<button id="btn-mois-prec" style="padding:5px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--bg3);font-size:11px;cursor:pointer">Mois précédent</button>' +
      '<button id="btn-generer-rapport" style="padding:5px 20px;border-radius:20px;border:none;background:var(--accent);color:#fff;font-size:12px;font-weight:700;cursor:pointer;margin-left:auto">▶ Générer</button>' +
      '</div>' +

      '<div id="rapport-contenu"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Fermer') + '</button>' +
      '<button id="btn-imprimer-rapport" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:13px;display:none">🖨️ Imprimer</button>' +
      '</div>';

    var modal = window.IG.utils.showModal(html, { width: '820px' });

    var _lastHtml = '';

    function generer() {
      var immId = modal.box.querySelector('#rapport-imm').value;
      var debut = modal.box.querySelector('#rapport-debut').value;
      var fin   = modal.box.querySelector('#rapport-fin').value;
      if (!immId) {
        modal.box.querySelector('#rapport-contenu').innerHTML = '<p style="padding:20px;text-align:center;color:var(--text3)">Sélectionnez un immeuble.</p>';
        return;
      }
      _lastHtml = genererRapportMensuelHTML(immId, debut, fin, imm, loc, pay);
      modal.box.querySelector('#rapport-contenu').innerHTML = _lastHtml;
      modal.box.querySelector('#btn-imprimer-rapport').style.display = 'inline-block';
    }

    function _setPeriode(debut, fin) {
      modal.box.querySelector('#rapport-debut').value = _iso(debut);
      modal.box.querySelector('#rapport-fin').value   = _iso(fin);
    }

    modal.box.querySelector('#btn-generer-rapport').addEventListener('click', generer);
    modal.box.querySelector('#btn-mois-courant').addEventListener('click', function() {
      var d = new Date(); _setPeriode(new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth()+1, 0));
    });
    modal.box.querySelector('#btn-mois-prec').addEventListener('click', function() {
      var d = new Date(); _setPeriode(new Date(d.getFullYear(), d.getMonth()-1, 1), new Date(d.getFullYear(), d.getMonth(), 0));
    });

    modal.box.querySelector('#btn-imprimer-rapport').addEventListener('click', function() {
      var w = window.open('', '_blank', 'width=860,height=1000');
      var immSel = imm.filter(function(i){ return i.id == modal.box.querySelector('#rapport-imm').value; })[0] || {};
      var titre  = 'Rapport — ' + (immSel.nom_immeuble || immSel.nom || 'Immeuble');
      w.document.write('<html><head><title>' + titre + '</title>' +
        '<style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:24px;color:#111;margin:0}' +
        'table{width:100%;border-collapse:collapse}@media print{.no-print{display:none}}</style></head>' +
        '<body>' + _lastHtml + '</body></html>');
      w.document.close();
      w.focus();
    });

    // Générer automatiquement si un immeuble est présélectionné
    if (immeubleIdPreselect && immOptions) generer();
  }

  // ── Export DOCX via docx.bundle.js ───────────────────────────
  function exporterDocx(htmlContent) {
    try {
      if (typeof docx === 'undefined') {
        window.IG.utils.showToast(t('Bibliothèque DOCX non chargée'), 'red');
        return;
      }
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      var doc = new docx.Document({
        sections: [{
          children: [
            new docx.Paragraph({
              text: (session.nomCabinet || 'ImmoGest') + ' — Rapport mensuel',
              heading: docx.HeadingLevel.HEADING_1,
            }),
            new docx.Paragraph({
              text: 'Généré le ' + new Date().toLocaleDateString('fr-FR'),
            }),
            new docx.Paragraph({
              text: htmlContent.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),
            })
          ]
        }]
      });
      docx.Packer.toBlob(doc).then(function(blob) {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'rapport-immogest-' + Date.now() + '.docx';
        link.click();
      });
    } catch(e) {
      window.IG.utils.showToast(t('Erreur export DOCX') + ': ' + e.message, 'red');
    }
  }

  // ── Rapport annuel — hub avec sélecteur de période libre ─────
  function afficherRapportAnnuel(debParam, finParam) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var now  = new Date();
    var debDef = new Date(now.getFullYear(), 0, 1).toISOString().slice(0,10);
    var finDef = new Date(now.getFullYear(), 11, 31).toISOString().slice(0,10);
    var deb  = debParam || debDef;
    var fin  = finParam || finDef;
    var debD = new Date(deb);
    var finD = new Date(fin);

    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var loc  = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay  = window.IG.paiements  ? window.IG.paiements.getCache()  : [];

    function _paysDansPeriode(paiements) {
      return paiements.filter(function(p) {
        var pd = new Date(p.date_paiement || (p.annee + '-' + String(p.mois).padStart(2,'0') + '-01'));
        return pd >= debD && pd <= finD;
      });
    }

    var cartes = '';
    imms.forEach(function(im) {
      var locs    = loc.filter(function(l) { return l.immeuble_id == im.id; });
      var locsAct = locs.filter(function(l) { return l.statut !== 'libre'; });
      var paysImm = _paysDansPeriode(pay.filter(function(p) {
        return locs.some(function(l) { return l.id == p.locataire_id; });
      }));
      var totalVerse   = paysImm.reduce(function(s,p) { return s + (parseFloat(p.montant)||0); }, 0);
      var totalAttendu = locsAct.reduce(function(s,l) { return s + (parseFloat(l.loyer)||0); }, 0) *
        (function() {
          var n = 0; var cur = new Date(debD.getFullYear(), debD.getMonth(), 1);
          while (cur <= finD) { n++; cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1); }
          return n;
        })();
      var taux      = totalAttendu > 0 ? Math.round(totalVerse / totalAttendu * 100) : 0;
      var passif    = locsAct.reduce(function(s,l) { return s + Math.max(0, (parseFloat(l.loyer)||0) - paysImm.filter(function(p){ return p.locataire_id==l.id; }).reduce(function(ss,p){ return ss+(parseFloat(p.montant)||0); },0)); }, 0);
      var couleur   = im.couleur || '#0E6AAF';
      var tauxColor = taux >= 80 ? '#0f6e56' : taux >= 50 ? '#ba7517' : '#a32d2d';
      var label = deb.slice(0,7) === fin.slice(0,7) ? deb.slice(0,7) : deb.slice(0,7) + ' › ' + fin.slice(0,7);

      cartes += '<div class="card" style="cursor:pointer;border-left:4px solid ' + esc(couleur) + ';transition:all .15s" ' +
        'onclick="window.IG.rapports.ouvrirDetailAnnuel(' + im.id + ',\'' + deb + '\',\'' + fin + '\')" ' +
        'onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.12)\'" ' +
        'onmouseout="this.style.transform=\'\';this.style.boxShadow=\'\'">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">' +
        '<div>' +
        '<div style="font-weight:700;font-size:14px;color:var(--text)">' + esc(im.nom_immeuble || im.nom) + '</div>' +
        '<div style="font-size:11px;color:var(--text3);margin-top:2px">📍 ' + esc(im.ville||'') + (im.quartier ? ' · '+esc(im.quartier) : '') + '</div>' +
        '</div>' +
        '<div style="background:' + esc(couleur) + '22;color:' + esc(couleur) + ';font-size:10px;font-weight:700;padding:3px 9px;border-radius:99px">' + esc(label) + '</div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">' +
        '<div style="background:var(--bg2);border-radius:8px;padding:8px"><div style="font-size:10px;color:var(--text3)">Encaissé</div><div style="font-size:13px;font-weight:700;color:var(--green)">' + fmt(totalVerse) + '</div></div>' +
        '<div style="background:var(--bg2);border-radius:8px;padding:8px"><div style="font-size:10px;color:var(--text3)">Recouvrement</div><div style="font-size:18px;font-weight:700;color:' + tauxColor + '">' + taux + '%</div></div>' +
        '<div style="background:var(--bg2);border-radius:8px;padding:8px"><div style="font-size:10px;color:var(--text3)">Locataires</div><div style="font-size:18px;font-weight:700">' + locsAct.length + '</div></div>' +
        '<div style="background:var(--bg2);border-radius:8px;padding:8px"><div style="font-size:10px;color:var(--text3)">Passif</div><div style="font-size:13px;font-weight:700;color:var(--red)">' + fmt(passif) + '</div></div>' +
        '</div>' +
        '<span style="font-size:10px;background:var(--accent-bg,#e8f4fd);color:var(--accent);padding:3px 8px;border-radius:99px;font-weight:600">📄 Ouvrir le rapport</span>' +
        '</div>';
    });

    if (!cartes) cartes = '<div style="text-align:center;padding:40px;color:var(--text3)">Aucun immeuble enregistré</div>';

    // Contrôles de période
    var ctrl = '<div class="card" style="margin-bottom:16px">' +
      '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap">' +
      '<div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Du</label>' +
      '<input type="date" id="ra-deb" value="' + deb + '" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px"></div>' +
      '<div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Au</label>' +
      '<input type="date" id="ra-fin" value="' + fin + '" style="padding:7px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px"></div>' +
      '<button onclick="_raAppliquer()" style="padding:8px 18px;border-radius:8px;border:none;background:#1a2e4a;color:#fff;cursor:pointer;font-size:13px;font-weight:600">Appliquer</button>' +
      '<div style="display:flex;gap:6px;margin-left:4px">' +
      '<button onclick="_raRacc(\'an\')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:11px;color:var(--text)">Cette année</button>' +
      '<button onclick="_raRacc(\'prec\')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:11px;color:var(--text)">Année préc.</button>' +
      '<button onclick="_raRacc(\'12m\')" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:11px;color:var(--text)">12 derniers mois</button>' +
      '</div></div></div>';

    var html = '<div class="content" id="rapport-annuel-page">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h2 style="font-size:17px;font-weight:700">📄 Rapports — Vue période</h2></div>' +
      ctrl +
      '<div id="ig-ad-rapports" style="margin-bottom:16px;text-align:center"></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px">' + cartes + '</div></div>';

    content.innerHTML = html;
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-rapports', 'ad2');

    window._raAppliquer = function() {
      var d = document.getElementById('ra-deb').value;
      var f = document.getElementById('ra-fin').value;
      if (d && f && d <= f) afficherRapportAnnuel(d, f);
      else window.IG.utils.showToast('Dates invalides', 'red');
    };
    window._raRacc = function(type) {
      var n = new Date();
      var d, f;
      if (type === 'an')   { d = n.getFullYear()+'-01-01'; f = n.getFullYear()+'-12-31'; }
      if (type === 'prec') { d = (n.getFullYear()-1)+'-01-01'; f = (n.getFullYear()-1)+'-12-31'; }
      if (type === '12m')  { var p = new Date(n.getFullYear(), n.getMonth()-11, 1); d = p.toISOString().slice(0,10); f = n.toISOString().slice(0,10); }
      afficherRapportAnnuel(d, f);
    };
  }

  // ── Détail rapport annuel par immeuble ───────────────────────
  function ouvrirDetailAnnuel(iid, dateDebut, dateFin) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var now  = new Date();
    var deb  = dateDebut || (now.getFullYear() + '-01-01');
    var fin  = dateFin   || (now.getFullYear() + '-12-31');
    var debD = new Date(deb);
    var finD = new Date(fin);

    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var allLocs = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var allPays = window.IG.paiements  ? window.IG.paiements.getCache()  : [];
    var im   = imms.find(function(x) { return x.id == iid; });
    if (!im) return;

    var locs = allLocs.filter(function(l) { return l.immeuble_id == iid; });
    var pays = allPays.filter(function(p) {
      var pd = new Date(p.date || (p.annee+'-'+String(p.mois).padStart(2,'0')+'-01'));
      return locs.some(function(l){ return l.id == p.locataire_id; }) && pd >= debD && pd <= finD;
    });

    // ── Résumé cards dans l'app ──────────────────────────────────
    var totVerse = 0, totPassif = 0;
    var locsAct  = locs.filter(function(l){ return l.statut !== 'libre'; });
    locsAct.forEach(function(l) {
      var v = pays.filter(function(p){ return p.locataire_id==l.id; }).reduce(function(s,p){ return s+(parseFloat(p.montant)||0); },0);
      totVerse  += v;
      var attendu = (parseFloat(l.loyer)||0) * (function() {
        var n=0, cur=new Date(debD.getFullYear(),debD.getMonth(),1);
        while(cur<=finD){n++;cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);}return n;
      })() + (parseFloat(l.arrieres)||0);
      totPassif += Math.max(0, attendu - v);
    });
    var tauxR = totVerse+totPassif > 0 ? Math.round(totVerse/(totVerse+totPassif)*100) : 0;
    var tauxC = tauxR>=80?'#0f6e56':tauxR>=50?'#ba7517':'#a32d2d';

    var label = _fmtD(deb) + ' — ' + _fmtD(fin);

    var html = '<div class="content">' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
      '<button onclick="window.IG.rapports.afficherRapportAnnuel(\'' + deb + '\',\'' + fin + '\')" ' +
      'style="padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px;color:var(--text)">← Retour</button>' +
      '<span style="font-size:15px;font-weight:700;color:var(--text)">' + esc(im.nom_immeuble||im.nom) + '</span>' +
      '<span style="font-size:11px;color:var(--text3)">' + label + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">' +
      '<div class="card" style="text-align:center"><div style="font-size:10px;color:var(--text3)">Locataires</div><div style="font-size:20px;font-weight:700">' + locsAct.length + '</div></div>' +
      '<div class="card" style="text-align:center"><div style="font-size:10px;color:var(--text3)">Total versé</div><div style="font-size:13px;font-weight:700;color:#1a5276">' + fmt(totVerse) + '</div></div>' +
      '<div class="card" style="text-align:center"><div style="font-size:10px;color:var(--text3)">Passif</div><div style="font-size:13px;font-weight:700;color:#a32d2d">' + fmt(totPassif) + '</div></div>' +
      '<div class="card" style="text-align:center"><div style="font-size:10px;color:var(--text3)">Recouvrement</div><div style="font-size:20px;font-weight:700;color:' + tauxC + '">' + tauxR + '%</div></div>' +
      '</div>' +
      '<div id="ig-ad-rapports" style="margin-bottom:12px;text-align:center"></div>' +
      '<div class="card">' +
      '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px">' +
      '<button onclick="window.IG.rapports.imprimerDetailAnnuel(' + iid + ',\'' + deb + '\',\'' + fin + '\')" ' +
      'style="padding:8px 18px;border-radius:8px;border:none;background:#1a2e4a;color:#fff;cursor:pointer;font-size:13px;font-weight:700">🖨️ Imprimer le rapport</button>' +
      '</div>' +
      // Mini tableau récap dans l'app
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
      '<thead><tr style="background:#1a2e4a;color:#fff">' +
      '<th style="padding:7px 10px;border:1px solid #2d4a6e;text-align:left;font-weight:500">Locataire</th>' +
      '<th style="padding:7px 8px;border:1px solid #2d4a6e;text-align:center;font-weight:500">Loyer/mois</th>' +
      '<th style="padding:7px 8px;border:1px solid #2d4a6e;text-align:center;font-weight:500">Situation</th>' +
      '<th style="padding:7px 8px;border:1px solid #2d4a6e;text-align:left;font-weight:500">Versements</th>' +
      '<th style="padding:7px 8px;border:1px solid #2d4a6e;text-align:right;font-weight:500">Passif</th>' +
      '</tr></thead><tbody>' +
      (function() {
        var rows = ''; var gtVerse = 0, gtPassif = 0;
        locs.forEach(function(l) {
          var loyer  = parseFloat(l.loyer) || 0;
          var lPays  = pays.filter(function(p){ return p.locataire_id==l.id; });
          var verse  = lPays.reduce(function(s,p){ return s+(parseFloat(p.montant)||0); },0);
          var moisC  = (function(){
            var n=0,cur=new Date(debD.getFullYear(),debD.getMonth(),1);
            var e=l.entree?new Date(l.entree):null;
            while(cur<=finD){var mf=new Date(cur.getFullYear(),cur.getMonth()+1,0);
              if(!e||e<=mf)n++;
              cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);}return n;
          })();
          var attendu= loyer*moisC+(parseFloat(l.arrieres)||0);
          var passif = Math.max(0, attendu-verse);
          var moisDus= loyer>0 ? Math.ceil(passif/loyer) : 0;
          gtVerse+=verse; gtPassif+=passif;
          var badge = passif<=0
            ? '<span style="background:#e1f5ee;color:#0f6e56;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:500">À jour</span>'
            : moisDus<=2
              ? '<span style="background:#faeeda;color:#854f0b;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:500">Doit '+moisDus+' mois</span>'
              : '<span style="background:#fcebeb;color:#791f1f;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:500">Doit '+moisDus+' mois</span>';
          var fullM  = loyer>0?Math.floor(verse/loyer):0;
          var reste  = loyer>0?Math.round(verse-fullM*loyer):0;
          var formule= loyer>0?(reste>0?fmt(loyer)+' × '+fullM+' + '+fmt(reste)+' = '+fmt(verse):fmt(loyer)+' × '+fullM+' = '+fmt(verse)):fmt(verse);
          rows += '<tr' + (rows?'':'')+  '>' +
            '<td style="padding:6px 10px;border:1px solid #e8e8e8"><strong>'+esc(l.nom)+'</strong><br><span style="font-size:10px;color:#888">'+esc(l.appt||l.local||'')+(l.telephone?' · '+esc(l.telephone):'')+'</span></td>'+
            '<td style="padding:6px 8px;border:1px solid #e8e8e8;text-align:center">'+fmt(loyer)+'</td>'+
            '<td style="padding:6px 8px;border:1px solid #e8e8e8;text-align:center">'+badge+'</td>'+
            '<td style="padding:6px 8px;border:1px solid #e8e8e8;font-size:11px;color:#555">'+formule+'</td>'+
            '<td style="padding:6px 8px;border:1px solid #e8e8e8;text-align:right;font-weight:600;color:'+(passif>0?'#a32d2d':'#bbb')+'">'+( passif>0?fmt(passif):'—')+'</td>'+
            '</tr>';
        });
        rows += '<tr style="background:#1a2e4a;color:#fff;font-weight:600">'+
          '<td style="padding:7px 10px;border:1px solid #2d4a6e" colspan="3">TOTAL</td>'+
          '<td style="padding:7px 8px;border:1px solid #2d4a6e">'+fmt(gtVerse)+'</td>'+
          '<td style="padding:7px 8px;border:1px solid #2d4a6e;text-align:right;color:#f1948a">'+fmt(gtPassif)+'</td>'+
          '</tr>';
        return rows;
      })() +
      '</tbody></table></div></div></div>';

    content.innerHTML = html;
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-rapports', 'ad2');
  }

  // ── Rapport annuel imprimable — spec V2 (juin 2026) ────────────
  function genererRapportAnnuelHTML(iid, dateDebut, dateFin) {
    var session  = window.IG.auth ? window.IG.auth.getSession() : {};
    var params   = session.parametres || {};
    var imms     = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var allLocs  = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var allPays  = window.IG.paiements  ? window.IG.paiements.getCache()  : [];
    var im       = imms.find(function(x) { return x.id == iid; });
    if (!im) return '<html><body><p>Immeuble introuvable.</p></body></html>';

    var now        = new Date();
    var deb        = new Date(dateDebut || (now.getFullYear() + '-01-01'));
    var fin        = new Date(dateFin   || (now.getFullYear() + '-12-31'));
    var nomCab     = params.nom_cabinet || session.nomCabinet || session.nom || 'Cabinet';
    var adresse    = params.adresse || '';
    var telCab     = params.telephone || session.telephone || '';
    var emailCab   = params.email || '';
    var villeCab   = params.ville || im.ville || '';
    var typeProfil = session.type_profil || 'gestionnaire';
    var isCab      = typeProfil !== 'proprietaire';
    var MOIS_FR    = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

    var titrePeriode;
    if (deb.getMonth() === 0 && fin.getMonth() === 11 && deb.getFullYear() === fin.getFullYear()) {
      titrePeriode = 'RAPPORT DE JANVIER AU 31 DÉCEMBRE ' + fin.getFullYear();
    } else {
      titrePeriode = 'RAPPORT DU ' + deb.getDate() + ' ' + MOIS_FR[deb.getMonth()].toUpperCase() + ' AU ' + fin.getDate() + ' ' + MOIS_FR[fin.getMonth()].toUpperCase() + ' ' + fin.getFullYear();
    }
    var dateGen = ('0'+now.getDate()).slice(-2)+'/'+('0'+(now.getMonth()+1)).slice(-2)+'/'+now.getFullYear();

    var locs = allLocs.filter(function(l) { return l.immeuble_id == iid; });
    var pays = allPays.filter(function(p) {
      if (!locs.some(function(l){ return parseInt(l.id) == parseInt(p.locataire_id); })) return false;
      var pd = new Date(p.date_paiement || (p.annee+'-'+String(p.mois||1).padStart(2,'0')+'-01'));
      return pd >= deb && pd <= fin;
    });

    var tauxHon   = (isCab && im.type_honoraires === 'pourcentage') ? (parseFloat(im.valeur_honoraires) || 0) : 0;
    var forfaitHon= (isCab && im.type_honoraires === 'forfait')     ? (parseFloat(im.valeur_honoraires) || 0) : 0;

    function _moisC(l) {
      var n = 0, cur = new Date(deb.getFullYear(), deb.getMonth(), 1);
      while (cur <= fin) {
        var mFin = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
        var e    = l.entree ? new Date(l.entree) : null;
        if (!e || e <= mFin) n++;
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
      return n;
    }

    var TH  = 'padding:7px 10px;background:#1a2e4a;color:#fff;font-size:10.5px;font-weight:600;border:1px solid #2d4a6e;';
    var THL = TH + 'text-align:left;';
    var THC = TH + 'text-align:center;';
    var THR = TH + 'text-align:right;';
    var TD  = 'padding:6px 10px;border:1px solid #e0e0e0;font-size:11px;vertical-align:top;';

    var totCaution = 0, totVerse = 0, totPassif = 0;
    var rows = '';

    locs.forEach(function(l, i) {
      var loyer   = parseFloat(l.loyer)   || 0;
      var caution = parseFloat(l.caution) || 0;
      var moisC   = _moisC(l);
      var lPays   = pays.filter(function(p) {
        return parseInt(p.locataire_id) == parseInt(l.id) && (p.type || 'loyer') !== 'caution';
      });
      var verse   = lPays.reduce(function(s,p){ return s+(parseFloat(p.montant)||0); }, 0);
      var remis   = lPays.filter(function(p){ return p.remisAuBailleur; })
                        .reduce(function(s,p){ return s+(parseFloat(p.montant)||0); }, 0);
      var passif  = Math.max(0, loyer * moisC - verse);
      var moisDus = loyer > 0 ? Math.round(passif / loyer) : 0;
      var honLoc  = tauxHon > 0 ? Math.round(verse * tauxHon / 100) : 0;
      var netLoc  = verse - honLoc;

      totCaution += caution; totVerse += verse; totPassif += passif;

      var badge;
      if (passif <= 0) {
        badge = '<span style="background:#e1f5ee;color:#0f6e56;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:600">À jour</span>';
      } else {
        var bgB = moisDus <= 2 ? '#faeeda' : '#fcebeb';
        var fgB = moisDus <= 2 ? '#854f0b' : '#791f1f';
        badge = '<span style="background:'+bgB+';color:'+fgB+';padding:2px 10px;border-radius:99px;font-size:10px;font-weight:600">Doit '+(moisDus||1)+' mois</span>';
      }

      var fullM  = loyer > 0 ? Math.floor(verse / loyer) : 0;
      var resteV = loyer > 0 ? Math.round(verse - fullM * loyer) : 0;
      var formule;
      if (loyer > 0 && fullM > 0) {
        formule = '<span style="color:#aaa;font-size:10px">'+fmt(loyer)+' × '+fullM+(resteV>0?' + '+fmt(resteV):'')+' = </span><strong>'+fmt(verse)+'</strong>';
      } else {
        formule = '<strong>'+fmt(verse)+'</strong>';
      }

      rows += '<tr style="background:'+(i%2?'#f9f9f9':'#fff')+'">' +
        '<td style="'+TD+'padding:8px 10px">' +
          '<div style="font-weight:700;font-size:11.5px">'+esc(l.nom)+'</div>' +
          '<div style="font-size:9.5px;color:#888;margin-top:1px">'+(l.telephone?esc(l.telephone):'')+((l.telephone&&l.appt)?' · ':'')+esc(l.appt||'')+'</div>' +
        '</td>' +
        '<td style="'+TD+'text-align:center">'+fmt(loyer)+'</td>' +
        '<td style="'+TD+'text-align:center">'+badge+'</td>' +
        '<td style="'+TD+'text-align:center">'+fmt(caution)+'</td>' +
        '<td style="'+TD+'">'+formule+'</td>' +
        (isCab ? '<td style="'+TD+'text-align:right">'+fmt(netLoc)+'</td>' : '') +
        '<td style="'+TD+'text-align:right;font-weight:700;color:'+(passif>0?'#c0392b':'#bbb')+'">'+( passif>0?fmt(passif):'—')+'</td>' +
      '</tr>';
    });

    var honTotal = tauxHon > 0 ? Math.round(totVerse * tauxHon / 100) : forfaitHon;
    var netTotal = totVerse - honTotal;

    rows += '<tr style="background:#1a2e4a;color:#fff;font-weight:700">' +
      '<td style="padding:8px 10px;border:1px solid #2d4a6e" colspan="3">TOTAL</td>' +
      '<td style="padding:8px 10px;border:1px solid #2d4a6e;text-align:center">'+fmt(totCaution)+'</td>' +
      '<td style="padding:8px 10px;border:1px solid #2d4a6e">'+fmt(totVerse)+'</td>' +
      (isCab ? '<td style="padding:8px 10px;border:1px solid #2d4a6e;text-align:right">'+fmt(netTotal)+'</td>' : '') +
      '<td style="padding:8px 10px;border:1px solid #2d4a6e;text-align:right;color:#f1948a">'+fmt(totPassif)+'</td>' +
    '</tr>';

    var recapRows = [{ l:'Total versements locataires', v:fmt(totVerse), c:'#111', b:false }];
    if (isCab && honTotal > 0) {
      recapRows.push({ l:'Commission cabinet ('+(tauxHon?tauxHon+'%':'forfait')+')', v:'– '+fmt(honTotal), c:'#c0392b', b:false });
      recapRows.push({ l:'Net remis au bailleur', v:fmt(netTotal), c:'#111', b:true });
    }
    recapRows.push({ l:'Total passif (arriérés)', v:fmt(totPassif), c:'#c0392b', b:false });
    recapRows.push({ l:'Total cautions', v:fmt(totCaution), c:'#111', b:false });

    var recapHtml = recapRows.map(function(r) {
      return '<tr style="border-bottom:1px solid #eee">' +
        '<td style="padding:5px 10px;font-size:11px;'+(r.b?'font-weight:700;':'')+'color:'+r.c+'">'+r.l+'</td>' +
        '<td style="padding:5px 10px;text-align:right;font-size:11px;font-weight:700;color:'+r.c+'">'+r.v+'</td></tr>';
    }).join('');

    var lettres    = _enLettres(isCab ? netTotal : totVerse);
    var nomProprio = im.nom_proprio || '';
    var signataire = params.signataire || session.nom || nomCab;

    var html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>'+esc(titrePeriode)+'</title>' +
      '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;padding:20px}' +
      'table{width:100%;border-collapse:collapse}@media print{.no-print{display:none}}</style></head><body>';

    // En-tête sombre
    html += '<div style="background:#1a2e4a;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;border-radius:4px">' +
      '<div><div style="font-size:17px;font-weight:900;letter-spacing:0.5px">'+esc(nomCab.toUpperCase())+'</div>' +
      ((adresse||villeCab) ? '<div style="font-size:10px;color:#aac;margin-top:3px">'+(adresse?esc(adresse)+' — ':'')+esc(villeCab)+'</div>' : '') +
      '</div>' +
      '<div style="text-align:right;font-size:11px;color:#ccd">' + [telCab, emailCab].filter(Boolean).map(esc).join(' · ') + '</div>' +
      '</div>';

    // Titre centré
    html += '<div style="text-align:center;margin-bottom:18px">' +
      '<div style="font-size:17px;font-weight:900;text-decoration:underline;text-transform:uppercase;letter-spacing:0.5px">'+esc(titrePeriode)+'</div>' +
      '<div style="font-style:italic;color:#555;margin-top:6px;font-size:12px">'+esc(im.nom_immeuble||im.nom)+(nomProprio?' — '+esc(nomProprio):'')+'</div>' +
      '<div style="font-size:10px;color:#999;margin-top:4px">Généré le '+dateGen+'</div>' +
      '</div>';

    // Tableau locataires
    html += '<table style="margin-bottom:22px">' +
      '<thead><tr>' +
      '<th style="'+THL+'min-width:160px">Noms et prénoms<div style="font-weight:400;font-size:9px;color:#9ab;margin-top:1px">Tél · Local</div></th>' +
      '<th style="'+THC+'">Loyer/mois</th>' +
      '<th style="'+THC+'">Situation</th>' +
      '<th style="'+THC+'">Caution</th>' +
      '<th style="'+THL+'">Montants versés</th>' +
      (isCab ? '<th style="'+THR+'">Remis bailleur</th>' : '') +
      '<th style="'+THR+'">Passif</th>' +
      '</tr></thead><tbody>'+rows+'</tbody></table>';

    // Récapitulatif + Arrêté côte à côte
    html += '<div style="display:flex;gap:20px;margin-bottom:24px;align-items:flex-start">' +
      '<div style="flex:1"><div style="font-size:11px;font-weight:700;background:#f5f5f5;padding:6px 10px;border-left:3px solid #1a2e4a">Récapitulatif financier</div>' +
      '<table style="border:1px solid #ddd">'+recapHtml+'</table></div>' +
      '<div style="flex:1;border:1px solid #e0e0e0;border-radius:4px;padding:12px 14px;font-size:11px;background:#fafafa">' +
      '<div style="font-style:italic;font-weight:700;margin-bottom:6px">Arrêtée la présente à la somme de :</div>' +
      '<div style="line-height:1.6">'+esc(lettres)+'</div>' +
      (isCab ? '<div style="font-size:9.5px;color:#999;margin-top:8px;font-style:italic">(net remis au bailleur)</div>' : '') +
      '</div></div>';

    // Signatures
    html += '<div style="display:flex;justify-content:space-between;margin-top:32px;border-top:1px solid #ddd;padding-top:18px">' +
      '<div style="text-align:center;width:44%"><div style="font-weight:700;font-size:11px">Le Gestionnaire</div>' +
      '<div style="font-size:10px;color:#555;margin-top:2px">'+esc(signataire)+'</div>' +
      '<div style="height:40px"></div>' +
      '<div style="border-top:1px solid #555;padding-top:4px;font-size:9px;color:#888;font-style:italic">(Nom, Signature, Cachet)</div></div>' +
      '<div style="text-align:center;width:44%"><div style="font-weight:700;font-size:11px">Le Bailleur</div>' +
      '<div style="font-size:10px;color:#555;margin-top:2px">'+esc(nomProprio)+'</div>' +
      '<div style="height:40px"></div>' +
      '<div style="border-top:1px solid #555;padding-top:4px;font-size:9px;color:#888;font-style:italic">(Nom, Signature)</div></div></div>';

    html += '<div style="text-align:center;color:#ccc;font-size:9px;margin-top:20px;border-top:1px solid #f0f0f0;padding-top:8px">Document généré le '+dateGen+' par ImmoGest v2</div>';
    html += '</body></html>';
    return html;

  }

  // ── [obsolète — remplacé par la version avec période libre ci-dessus] ──
  function _ouvrirDetailAnnuelLegacy(iid, annee) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var now  = new Date();
    annee = annee || now.getFullYear();
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var loc  = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay  = window.IG.paiements  ? window.IG.paiements.getCache()  : [];
    var im   = imms.find(function(x) { return x.id == iid; });
    if (!im) return;

    var locs = loc.filter(function(l) { return l.immeuble_id == iid && l.statut !== 'libre'; });
    var MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    var MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

    var TH = 'border:1px solid #555;padding:5px 4px;color:#fff;text-align:center;font-size:10px;white-space:nowrap;';
    var TD = 'border:1px solid #ddd;padding:5px 4px;text-align:center;font-size:11px;';

    var totalParMois = {};
    for (var m = 1; m <= 12; m++) totalParMois[m] = 0;

    var rows = locs.map(function(l) {
      var fiche = window.IG.paiements ? window.IG.paiements.calculerFiche(l, pay.filter(function(p) { return p.locataire_id == l.id; })) : [];
      var lignesAnnee = fiche.filter(function(lg) { return lg.annee === annee; });
      var totalLoc = lignesAnnee.reduce(function(s, lg) { return s + (lg.cumul || 0); }, 0);
      var resteLoc = lignesAnnee.reduce(function(s, lg) { return s + (lg.reste || 0); }, 0);
      var arrLoc   = parseFloat(l.arrieres) || 0;

      var cells = '';
      for (var m = 1; m <= 12; m++) {
        var lg = lignesAnnee.find(function(x) { return x.mois === m; });
        var cell, bg;
        if (!lg || lg.cumul === 0) {
          cell = '<span style="color:#ccc">–</span>'; bg = '#fff5f5';
        } else if (lg.statut === 'Payé') {
          cell = '<span style="color:var(--green,#27ae60);font-weight:700">✓</span>'; bg = '#f0fff4';
          totalParMois[m] += lg.cumul;
        } else {
          var pct = Math.round((lg.cumul / (parseFloat(l.loyer) || 1)) * 100);
          cell = '<span style="color:var(--yellow,#f39c12);font-weight:700" title="' + fmt(lg.cumul) + '">' + pct + '%</span>'; bg = '#fffbf0';
          totalParMois[m] += lg.cumul;
        }
        cells += '<td style="' + TD + 'background:' + bg + '">' + cell + '</td>';
      }

      return '<tr>' +
        '<td style="' + TD + 'text-align:left;font-weight:600;font-size:12px;padding:5px 8px">' + esc(l.nom) + '</td>' +
        '<td style="' + TD + 'color:var(--text3)">' + esc(l.appt || '–') + '</td>' +
        cells +
        '<td style="' + TD + 'font-weight:700;font-size:11px;color:var(--green,#27ae60)">' + fmt(totalLoc) + '</td>' +
        '<td style="' + TD + 'font-size:11px;color:' + (resteLoc + arrLoc > 0 ? 'var(--red,#e74c3c)' : 'var(--text3)') + '">' + (resteLoc + arrLoc > 0 ? fmt(resteLoc + arrLoc) : '–') + '</td>' +
        '</tr>';
    }).join('');

    var totalCells = '';
    for (var m = 1; m <= 12; m++) {
      totalCells += '<td style="' + TD + 'font-weight:700;background:var(--bg2)">' + (totalParMois[m] > 0 ? fmt(totalParMois[m]) : '') + '</td>';
    }
    var grandTotal = Object.values(totalParMois).reduce(function(s, v) { return s + v; }, 0);
    var totalArrieres = locs.reduce(function(s, l) { return s + (parseFloat(l.arrieres) || 0); }, 0);

    // Sélecteur d'année
    var anneeSel = '<select onchange="window.IG.rapports.ouvrirDetailAnnuel(' + iid + ',parseInt(this.value))" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">';
    for (var y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      anneeSel += '<option value="' + y + '"' + (y === annee ? ' selected' : '') + '>' + y + '</option>';
    }
    anneeSel += '</select>';

    var html = '<div class="content" id="rapport-annuel-detail">' +
      '<div style="margin-bottom:12px">' +
      '<button onclick="window.IG.rapports.afficherRapportAnnuel(' + annee + ')" style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px;color:var(--text)">← Tous les immeubles</button>' +
      '</div>' +
      '<div class="card" style="margin-bottom:16px">' +
      '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:4px 0">' +
      '<div><label style="font-size:11px;color:var(--text3);display:block;margin-bottom:4px">Année</label>' + anneeSel + '</div>' +
      '<button onclick="window.IG.rapports.imprimerDetailAnnuel(' + iid + ',' + annee + ')" ' +
      'style="padding:7px 16px;border-radius:8px;border:none;background:#1a2e4a;color:#fff;cursor:pointer;font-size:13px;font-weight:700">📄 Rapport complet</button>' +
      '<button onclick="window.IG.rapports.exporterRapportAnnuelDocx(' + annee + ',' + iid + ')" style="padding:7px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">📊 Télécharger (.docx)</button>' +
      '<button onclick="window.IG.rapports.imprimerDetailAnnuel(' + iid + ',' + annee + ')" style="padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">🖨️ Imprimer</button>' +
      '</div></div>' +
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">📅 Synthèse annuelle ' + annee + ' — ' + esc(im.nom_immeuble || im.nom) + '</div></div>' +
      '<div id="ig-ad-rapports" style="margin:8px 0;text-align:center"></div>' +
      '<div style="overflow-x:auto" id="detail-annuel-table">' +
      '<table style="min-width:900px;width:100%;border-collapse:collapse;font-size:12px">' +
      '<thead><tr style="background:#0a1628">' +
      '<th style="' + TH + 'text-align:left;padding:5px 8px;min-width:140px">Locataire</th>' +
      '<th style="' + TH + 'min-width:50px">Local</th>' +
      MOIS_COURT.map(function(mc) { return '<th style="' + TH + 'min-width:45px">' + mc + '</th>'; }).join('') +
      '<th style="' + TH + 'min-width:80px">Total</th>' +
      '<th style="' + TH + 'min-width:70px">Arriérés</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '<tfoot><tr style="font-weight:700;background:var(--bg2)">' +
      '<td style="' + TD + 'text-align:left;padding:5px 8px" colspan="2">TOTAL</td>' +
      totalCells +
      '<td style="' + TD + 'font-weight:700;color:var(--green,#27ae60)">' + fmt(grandTotal) + '</td>' +
      '<td style="' + TD + 'color:var(--red,#e74c3c)">' + (totalArrieres > 0 ? fmt(totalArrieres) : '–') + '</td>' +
      '</tr></tfoot>' +
      '</table></div>' +
      '<div style="margin-top:10px;display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:var(--text3)">' +
      '<span style="color:var(--green,#27ae60);font-weight:700">✓</span><span> = Payé complet</span>' +
      '<span style="color:var(--yellow,#f39c12);font-weight:700;margin-left:8px">%</span><span> = Paiement partiel</span>' +
      '<span style="color:#ccc;margin-left:8px">–</span><span> = Non payé</span>' +
      '</div></div></div>';

    content.innerHTML = html;
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-rapports', 'ad2');
  }

  // ── [obsolète — remplacé par la version V5 ci-dessus] ──
  function _genererRapportAnnuelHTMLLegacy(iid, dateDebut, dateFin) {
    var session  = window.IG.auth ? window.IG.auth.getSession() : {};
    var imms     = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var allLocs  = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var allPays  = window.IG.paiements  ? window.IG.paiements.getCache()  : [];
    var im       = imms.find(function(x) { return x.id == iid; });
    if (!im) return '<p>Immeuble introuvable.</p>';

    var deb   = new Date(dateDebut);
    var fin   = new Date(dateFin);
    var locs  = allLocs.filter(function(l) { return l.immeuble_id == iid; });
    var pays  = allPays.filter(function(p) {
      var pd = new Date(p.date_paiement || (p.annee + '-' + String(p.mois).padStart(2,'0') + '-01'));
      return p.locataire_id && locs.some(function(l){ return l.id == p.locataire_id; }) &&
             pd >= deb && pd <= fin;
    });

    var nomCabinet = session.nomCabinet || session.nom || 'Cabinet ImmoGest';
    var typeProfil = session.type_profil || 'gestionnaire';
    var profShow   = typeProfil !== 'proprietaire';
    var ville      = session.ville || im.ville || '';
    var tel        = session.telephone || '';
    var nomImm     = im.nom_immeuble || im.nom || 'Immeuble';
    var now        = new Date();

    // ── Compter mois couverts pour un locataire dans la période ──
    function _moisCouverts(l) {
      var n = 0;
      var cur = new Date(deb.getFullYear(), deb.getMonth(), 1);
      while (cur <= fin) {
        var mFin = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
        var entree = l.date_entree ? new Date(l.date_entree) : null;
        var sortie = l.date_sortie  ? new Date(l.date_sortie)  : null;
        var actif  = (!entree || entree <= mFin) && (!sortie || sortie >= cur);
        if (actif) n++;
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
      return n;
    }

    var TH = 'padding:7px 9px;border:1px solid #ccc;background:#1a2e4a;color:#fff;font-size:10.5px;font-weight:700;text-align:center;white-space:nowrap';
    var TD = 'padding:6px 9px;border:1px solid #ddd;font-size:10.5px;vertical-align:top';
    var TDr = TD + ';text-align:right';
    var TDc = TD + ';text-align:center';

    // ── Section I — Récapitulatif par locataire ───────────────────
    var s1Rows = '';
    var totAttendu = 0, totVerse = 0, totArrieres = 0;

    var locData = locs.map(function(l) {
      var moisCouv   = _moisCouverts(l);
      var loyer      = parseFloat(l.loyer) || 0;
      var arrIniMax  = parseFloat(l.arrieres) || 0; // arriérés portés au bail
      var attendu    = loyer * moisCouv;
      var verse      = pays.filter(function(p){ return p.locataire_id == l.id; })
                          .reduce(function(s,p){ return s + (parseFloat(p.montant)||0); }, 0);
      var solde      = attendu + arrIniMax - verse; // positif = doit encore
      return { l: l, moisCouv: moisCouv, loyer: loyer, attendu: attendu, verse: verse, solde: solde };
    });

    locData.forEach(function(d) {
      var l = d.l;
      var soldeColor = d.solde > 0 ? '#c0392b' : d.solde < 0 ? '#27ae60' : '#555';
      var soldeText  = d.solde > 0 ? fmt(d.solde) : d.solde < 0 ? 'Avance ' + fmt(-d.solde) : '✓ À jour';
      totAttendu  += d.attendu;
      totVerse    += d.verse;
      totArrieres += Math.max(0, d.solde);

      s1Rows +=
        '<tr>' +
        '<td style="' + TD + '">' + esc(l.appt || l.local || '–') + '</td>' +
        '<td style="' + TD + '"><strong>' + esc(l.nom) + '</strong>' +
          (l.telephone ? '<br><span style="font-size:9px;color:#777">' + esc(l.telephone) + '</span>' : '') + '</td>' +
        '<td style="' + TDr + '">' + fmt(d.loyer) + '</td>' +
        '<td style="' + TDc + '">' + d.moisCouv + '</td>' +
        '<td style="' + TDr + '">' + fmt(d.attendu) + '</td>' +
        '<td style="' + TDr + ';color:#1a5276;font-weight:700">' + fmt(d.verse) + '</td>' +
        '<td style="' + TDr + ';color:' + soldeColor + ';font-weight:700">' + soldeText + '</td>' +
        '</tr>';
    });

    var s1Footer =
      '<tr style="background:#f2f8fd;font-weight:800">' +
      '<td style="' + TD + '" colspan="4"><strong>TOTAUX</strong></td>' +
      '<td style="' + TDr + '">' + fmt(totAttendu) + '</td>' +
      '<td style="' + TDr + ';color:#1a5276">' + fmt(totVerse) + '</td>' +
      '<td style="' + TDr + ';color:' + (totArrieres > 0 ? '#c0392b' : '#27ae60') + '">' +
        (totArrieres > 0 ? fmt(totArrieres) : '✓ Tout encaissé') + '</td>' +
      '</tr>';

    // ── Section II — Détail des versements par locataire ─────────
    var s2Html = '';
    locData.forEach(function(d) {
      var l    = d.l;
      var lpay = pays.filter(function(p){ return p.locataire_id == l.id; })
                     .sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });
      if (!lpay.length) return;

      var lignes = lpay.map(function(p) {
        return '<tr>' +
          '<td style="' + TDc + '">' + _fmtD(p.date || (p.annee+'-'+String(p.mois).padStart(2,'0')+'-01')) + '</td>' +
          '<td style="' + TD + '">' + esc(p.reference || p.ref || '–') + '</td>' +
          '<td style="' + TDc + '">' + esc(p.type_paiement || p.type || 'Loyer') + '</td>' +
          (profShow ? '<td style="' + TDc + '">' + (p.remisAuBailleur ? 'Bailleur' : 'Cabinet') + '</td>' : '') +
          '<td style="' + TDr + ';font-weight:700;color:#1a5276">' + fmt(parseFloat(p.montant)||0) + '</td>' +
          '<td style="' + TD + ';font-size:9.5px;color:#777">' + esc(p.note || '') + '</td>' +
          '</tr>';
      }).join('');

      s2Html +=
        '<div style="margin-bottom:16px">' +
        '<div style="background:#1a2e4a;color:#fff;padding:6px 10px;font-size:11px;font-weight:700;border-radius:4px 4px 0 0">' +
          esc(l.nom) + (l.appt ? ' — Local ' + esc(l.appt) : '') +
          (l.telephone ? ' · ' + esc(l.telephone) : '') +
        '</div>' +
        '<table style="width:100%;border-collapse:collapse">' +
        '<thead><tr>' +
          '<th style="' + TH + '">Date</th>' +
          '<th style="' + TH + '">Référence</th>' +
          '<th style="' + TH + '">Type</th>' +
          (profShow ? '<th style="' + TH + '">Remis à</th>' : '') +
          '<th style="' + TH + '">Montant (' + devise() + ')</th>' +
          '<th style="' + TH + '">Note</th>' +
        '</tr></thead>' +
        '<tbody>' + lignes + '</tbody>' +
        '<tfoot><tr style="background:#eaf2fb">' +
          '<td colspan="' + (profShow ? '4' : '3') + '" style="' + TD + ';font-weight:700">Total versé</td>' +
          '<td style="' + TDr + ';font-weight:800;color:#1a5276">' + fmt(d.verse) + '</td>' +
          '<td style="' + TD + '"></td>' +
        '</tr></tfoot>' +
        '</table></div>';
    });
    if (!s2Html) s2Html = '<p style="color:#999;font-style:italic">Aucun versement dans la période.</p>';

    // ── Bilan financier ──────────────────────────────────────────
    var tauxRecouv  = totAttendu > 0 ? Math.round(totVerse / totAttendu * 100) : 0;
    var tauxColor   = tauxRecouv >= 90 ? '#27ae60' : tauxRecouv >= 60 ? '#e67e22' : '#c0392b';
    var honoraires  = 0;
    if (profShow) {
      var th = im.type_honoraires || 'aucun';
      var vh = parseFloat(im.valeur_honoraires) || 0;
      if (th === 'pourcentage') honoraires = Math.round(totVerse * vh / 100);
      else if (th === 'forfait') honoraires = vh;
    }
    var netCabinet = totVerse - honoraires;

    // ── Montant en lettres ───────────────────────────────────────
    var lettres = _enLettres(Math.round(totVerse));

    // ── CSS impression ───────────────────────────────────────────
    var css = `
      @page { margin: 16mm 18mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 0; }
      h2 { font-size: 14px; font-weight: 800; color: #1a2e4a; margin: 0 0 4px; }
      h3 { font-size: 12px; font-weight: 700; color: #1a2e4a; margin: 18px 0 8px; padding: 5px 10px;
           background: #eaf2fb; border-left: 4px solid #1a5276; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
      th, td { border: 1px solid #ccc; padding: 6px 9px; font-size: 10.5px; }
      th { background: #1a2e4a; color: #fff; font-weight: 700; }
      tfoot tr td { background: #f0f4f8; }
      .header-bloc { display: flex; justify-content: space-between; align-items: flex-start;
                     border-bottom: 2px solid #1a2e4a; padding-bottom: 10px; margin-bottom: 14px; }
      .cabinet-name { font-size: 16px; font-weight: 900; color: #1a2e4a; }
      .cabinet-sub  { font-size: 10px; color: #555; margin-top: 2px; }
      .rapport-titre { text-align: right; }
      .rapport-titre h2 { font-size: 15px; }
      .bilan-table td { padding: 6px 12px; border: none; border-bottom: 1px solid #ddd; font-size: 11.5px; }
      .bilan-table tr:last-child td { border-bottom: none; }
      .lettres-bloc { background: #f0f4f8; border: 1px solid #ccc; border-radius: 4px;
                      padding: 8px 14px; margin: 14px 0; font-size: 11px; font-style: italic; }
      .signatures { display: flex; gap: 30px; margin-top: 32px; }
      .sig-bloc { flex: 1; border-top: 1px solid #555; padding-top: 6px; text-align: center;
                  font-size: 10.5px; color: #444; }
      @media print { button { display: none; } }
    `;

    // ── Assemblage HTML ──────────────────────────────────────────
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Rapport annuel — ' +
      esc(nomImm) + '</title><style>' + css + '</style></head><body>' +

      // En-tête cabinet
      '<div class="header-bloc">' +
        '<div>' +
          '<div class="cabinet-name">' + esc(nomCabinet) + '</div>' +
          '<div class="cabinet-sub">' +
            (ville ? esc(ville) + ' · ' : '') + (tel ? 'Tél : ' + esc(tel) : '') +
          '</div>' +
        '</div>' +
        '<div class="rapport-titre">' +
          '<h2>RAPPORT ANNUEL</h2>' +
          '<div style="font-size:11px;color:#555">' + esc(nomImm) + '</div>' +
          '<div style="font-size:10px;color:#888">Période : ' + _fmtD(dateDebut) + ' au ' + _fmtD(dateFin) + '</div>' +
          '<div style="font-size:9px;color:#aaa">Généré le ' + now.toLocaleDateString('fr-FR') + '</div>' +
        '</div>' +
      '</div>' +

      // SECTION I
      '<h3>I — RÉCAPITULATIF PAR LOCATAIRE</h3>' +
      '<table>' +
        '<thead><tr>' +
          '<th style="' + TH + '">Local</th>' +
          '<th style="' + TH + '">Locataire</th>' +
          '<th style="' + TH + '">Loyer/mois</th>' +
          '<th style="' + TH + '">Mois couverts</th>' +
          '<th style="' + TH + '">Loyer attendu</th>' +
          '<th style="' + TH + '">Total versé</th>' +
          '<th style="' + TH + '">Solde</th>' +
        '</tr></thead>' +
        '<tbody>' + s1Rows + '</tbody>' +
        '<tfoot>' + s1Footer + '</tfoot>' +
      '</table>' +

      // SECTION II
      '<h3>II — DÉTAIL DES VERSEMENTS</h3>' +
      s2Html +

      // Bilan financier
      '<h3>III — BILAN FINANCIER</h3>' +
      '<table class="bilan-table" style="width:55%;min-width:320px">' +
        '<tr><td>Loyers attendus (période)</td><td style="text-align:right;font-weight:700">' + fmt(totAttendu) + '</td></tr>' +
        '<tr><td>Total encaissé</td><td style="text-align:right;font-weight:700;color:#1a5276">' + fmt(totVerse) + '</td></tr>' +
        '<tr><td>Total arriérés</td><td style="text-align:right;font-weight:700;color:' + (totArrieres > 0 ? '#c0392b' : '#27ae60') + '">' +
          (totArrieres > 0 ? fmt(totArrieres) : '✓ Néant') + '</td></tr>' +
        (profShow && honoraires > 0 ? '<tr><td>Honoraires ' + (im.type_honoraires === 'pourcentage' ? '(' + im.valeur_honoraires + '%)' : 'forfait') + '</td>' +
          '<td style="text-align:right;font-weight:700">' + fmt(honoraires) + '</td></tr>' +
          '<tr style="background:#e8f5e9"><td><strong>NET À PERCEVOIR</strong></td>' +
          '<td style="text-align:right;font-weight:800;color:#1a5276">' + fmt(netCabinet) + '</td></tr>' : '') +
        '<tr><td>Taux de recouvrement</td><td style="text-align:right;font-weight:800;color:' + tauxColor + '">' + tauxRecouv + ' %</td></tr>' +
      '</table>' +

      '<div class="lettres-bloc">Arrêtée la présente situation à la somme de : <strong>' + lettres + ' francs CFA</strong> (Total versé)</div>' +

      // Signatures
      '<div class="signatures">' +
        '<div class="sig-bloc">' +
          '<div>' + (typeProfil === 'cabinet' ? 'Le Gestionnaire du Cabinet' : 'Le Gestionnaire') + '</div>' +
          '<div style="margin-top:40px;font-size:9px;color:#aaa">(Nom, Signature, Cachet)</div>' +
        '</div>' +
        '<div class="sig-bloc">' +
          '<div>Le Bailleur / Propriétaire</div>' +
          '<div style="margin-top:40px;font-size:9px;color:#aaa">(Nom, Signature)</div>' +
        '</div>' +
      '</div>' +

      '</body></html>';
  }

  // ── Générateur rapport annuel V5 — design validé ─────────────
  function genererRapportAnnuelHTML(iid, dateDebut, dateFin) {
    var session  = window.IG.auth ? window.IG.auth.getSession() : {};
    var imms     = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var allLocs  = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var allPays  = window.IG.paiements  ? window.IG.paiements.getCache()  : [];
    var im       = imms.find(function(x){ return x.id == iid; });
    if (!im) return '<p>Immeuble introuvable.</p>';

    var deb  = new Date(dateDebut);
    var fin  = new Date(dateFin);
    var locs = allLocs.filter(function(l){ return l.immeuble_id == iid; });
    var pays = allPays.filter(function(p){
      var pd = new Date(p.date || (p.annee+'-'+String(p.mois).padStart(2,'0')+'-01'));
      return locs.some(function(l){ return l.id==p.locataire_id; }) && pd>=deb && pd<=fin;
    });

    var nomCab   = session.nomCabinet || session.nom || 'Cabinet ImmoGest';
    var typePro  = session.type_profil || 'gestionnaire';
    var showCom  = typePro !== 'proprietaire';
    var ville    = im.ville || '';
    var tel      = session.telephone || '';
    var nomImm   = im.nom_immeuble || im.nom || 'Immeuble';
    var bailleur = im.nom_proprio || '';
    var now      = new Date();

    function _moisCouv(l) {
      var n=0, cur=new Date(deb.getFullYear(),deb.getMonth(),1);
      var e=l.entree?new Date(l.entree):null;
      while(cur<=fin){
        var mf=new Date(cur.getFullYear(),cur.getMonth()+1,0);
        if(!e||e<=mf) n++;
        cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);
      }
      return n;
    }

    var TH='padding:7px 9px;border:1px solid #2d4a6e;background:#1a2e4a;color:#fff;font-weight:500;font-size:10.5px;white-space:nowrap';
    var TD='padding:6px 9px;border:1px solid #e0e0e0;font-size:10.5px;vertical-align:middle';
    var TDr=TD+';text-align:right';
    var TDc=TD+';text-align:center';

    var totVerse=0, totPassif=0, totCaution=0, totRemis=0;
    var typeHon=im.type_honoraires||'aucun';
    var valHon=parseFloat(im.valeur_honoraires)||0;

    var rows = locs.map(function(l,i){
      var loyer  = parseFloat(l.loyer)||0;
      var mc     = _moisCouv(l);
      var lPays  = pays.filter(function(p){ return p.locataire_id==l.id; });
      var verse  = lPays.reduce(function(s,p){ return s+(parseFloat(p.montant)||0); },0);
      var arrIni = parseFloat(l.arrieres)||0;
      var attendu= loyer*mc+arrIni;
      var passif = Math.max(0,attendu-verse);
      var moisD  = loyer>0?Math.ceil(passif/loyer):0;
      var caution= parseFloat(l.caution||l.depot_garantie)||0;

      // Commission individuelle sur ce que ce locataire a versé
      var com = showCom ? (typeHon==='pourcentage'?Math.round(verse*valHon/100):typeHon==='forfait'?valHon:0) : 0;
      var remis = Math.max(0, verse - com);

      totVerse  += verse;
      totPassif += passif;
      totCaution+= caution;
      totRemis  += remis;

      // Formule versements
      var fullM = loyer>0?Math.floor(verse/loyer):0;
      var reste = loyer>0?Math.round(verse-fullM*loyer):0;
      var formule= loyer>0
        ? (reste>0 ? fmt(loyer)+' × '+fullM+' + '+fmt(reste)+' = <strong>'+fmt(verse)+'</strong>'
                   : fmt(loyer)+' × '+fullM+' = <strong>'+fmt(verse)+'</strong>')
        : '<strong>'+fmt(verse)+'</strong>';

      // Badge situation
      var badge;
      if(passif<=0){
        badge='<span style="background:#e1f5ee;color:#0f6e56;padding:2px 9px;border-radius:99px;font-size:9.5px;font-weight:500">À jour</span>';
      } else if(moisD<=2){
        badge='<span style="background:#faeeda;color:#854f0b;padding:2px 9px;border-radius:99px;font-size:9.5px;font-weight:500">Doit '+moisD+' mois</span>';
      } else {
        badge='<span style="background:#fcebeb;color:#791f1f;padding:2px 9px;border-radius:99px;font-size:9.5px;font-weight:500">Doit '+moisD+' mois</span>';
      }

      var bg = i%2===0?'#fff':'#fafafa';
      return '<tr style="background:'+bg+'">' +
        '<td style="'+TD+'"><strong>'+esc(l.nom)+'</strong>' +
          (l.telephone?'<br><span style="font-size:9px;color:#888">'+esc(l.telephone)+'</span>':'') +
          (l.appt||l.local?'<br><span style="font-size:9px;color:#999">'+esc(l.appt||l.local)+'</span>':'') +
          (l.entree&&new Date(l.entree)>=deb?'<br><span style="font-size:9px;color:#0f6e56">Entrée : '+_fmtD(l.entree)+'</span>':'') +
        '</td>' +
        '<td style="'+TDc+'">'+fmt(loyer)+'</td>' +
        '<td style="'+TDc+'">'+badge+'</td>' +
        '<td style="'+TDc+'">'+fmt(caution)+'</td>' +
        '<td style="'+TD+';color:#555">'+formule+'</td>' +
        (showCom?'<td style="'+TDr+';color:#1a2e4a;font-weight:500">'+fmt(remis)+'</td>':'') +
        '<td style="'+TDr+';color:'+(passif>0?'#a32d2d':'#bbb')+';font-weight:'+(passif>0?'500':'400')+'">'+
          (passif>0?fmt(passif):'—')+'</td>' +
        '</tr>';
    }).join('');

    // Ligne totaux
    var totRow='<tr style="background:#1a2e4a;color:#fff;font-weight:500">' +
      '<td style="padding:7px 9px;border:1px solid #2d4a6e" colspan="3">TOTAL</td>' +
      '<td style="padding:7px 9px;border:1px solid #2d4a6e;text-align:center">'+fmt(totCaution)+'</td>' +
      '<td style="padding:7px 9px;border:1px solid #2d4a6e">'+fmt(totVerse)+'</td>' +
      (showCom?'<td style="padding:7px 9px;border:1px solid #2d4a6e;text-align:right">'+fmt(totRemis)+'</td>':'') +
      '<td style="padding:7px 9px;border:1px solid #2d4a6e;text-align:right;color:#f1948a">'+fmt(totPassif)+'</td>' +
      '</tr>';

    // Récap financier
    var comGlob = showCom ? (typeHon==='pourcentage'?Math.round(totVerse*valHon/100):typeHon==='forfait'?valHon*locs.length:0) : 0;
    var netBailleur = totVerse - comGlob;
    var recapRows =
      '<tr><td style="padding:5px 14px;border:1px solid #e8e8e8;color:#555">Total versements locataires</td><td style="padding:5px 14px;border:1px solid #e8e8e8;text-align:right;font-weight:500">'+fmt(totVerse)+'</td></tr>' +
      (showCom&&comGlob>0?'<tr style="background:#fafafa"><td style="padding:5px 14px;border:1px solid #e8e8e8;color:#555">Commission cabinet'+(typeHon==='pourcentage'?' ('+valHon+'%)':' (forfait)')+'</td><td style="padding:5px 14px;border:1px solid #e8e8e8;text-align:right;color:#a32d2d;font-weight:500">− '+fmt(comGlob)+'</td></tr>':'') +
      '<tr><td style="padding:6px 14px;border:1px solid #e8e8e8;font-weight:500;color:#1a2e4a">Net remis au bailleur</td><td style="padding:6px 14px;border:1px solid #e8e8e8;text-align:right;font-weight:500;color:#1a2e4a">'+fmt(netBailleur)+'</td></tr>' +
      '<tr style="background:#fff6f6"><td style="padding:5px 14px;border:1px solid #e8e8e8;color:#a32d2d">Total passif (arriérés)</td><td style="padding:5px 14px;border:1px solid #e8e8e8;text-align:right;color:#a32d2d;font-weight:500">'+fmt(totPassif)+'</td></tr>' +
      '<tr style="background:#fafafa"><td style="padding:5px 14px;border:1px solid #e8e8e8;color:#555">Total cautions perçues</td><td style="padding:5px 14px;border:1px solid #e8e8e8;text-align:right;font-weight:500">'+fmt(totCaution)+'</td></tr>';

    // ── Section locaux libres ──────────────────────────────────
    var locsLibres = allLocs.filter(function(l) {
      return l.immeuble_id == iid && l.statut === 'libre';
    });

    var locauxLibresHtml = '';
    if (locsLibres.length) {
      var libresRows = locsLibres.map(function(l, i) {
        var bg = i % 2 === 0 ? '#fff' : '#fafafa';
        var dureeVide = l.date_sortie
          ? Math.round((now - new Date(l.date_sortie)) / (30 * 86400000)) + ' mois'
          : '—';
        return '<tr style="background:' + bg + '">' +
          '<td style="' + TD + '">' + esc(l.appt || l.local || '—') + '</td>' +
          '<td style="' + TD + '">' + esc(l.type_local || '—') + '</td>' +
          '<td style="' + TDr + '">' + fmt(l.loyer || 0) + '</td>' +
          '<td style="' + TDc + '">' + (l.date_sortie ? _fmtD(l.date_sortie) : '—') + '</td>' +
          '<td style="' + TDc + '">' + dureeVide + '</td>' +
          '<td style="' + TD + ';color:#a32d2d">' + fmt((l.loyer || 0) * (l.date_sortie ? Math.max(0, Math.round((now - new Date(l.date_sortie)) / (30 * 86400000))) : 0)) + ' manque à gagner</td>' +
        '</tr>';
      }).join('');
      var perteTotale = locsLibres.reduce(function(s, l) {
        var mois = l.date_sortie ? Math.max(0, Math.round((now - new Date(l.date_sortie)) / (30 * 86400000))) : 0;
        return s + (parseFloat(l.loyer) || 0) * mois;
      }, 0);
      locauxLibresHtml =
        '<div style="padding:8px 18px 0">' +
        '<h3 style="font-size:11px;font-weight:700;color:#a32d2d;text-transform:uppercase;letter-spacing:.3px;margin:10px 0 6px">' +
          'Locaux vacants (' + locsLibres.length + ')' +
        '</h3>' +
        '<table>' +
          '<thead><tr>' +
            '<th style="' + TH + ';text-align:left">Local / Appt</th>' +
            '<th style="' + TH + '">Type</th>' +
            '<th style="' + TH + '">Loyer/mois</th>' +
            '<th style="' + TH + '">Date libération</th>' +
            '<th style="' + TH + '">Durée vacante</th>' +
            '<th style="' + TH + ';text-align:left">Manque à gagner</th>' +
          '</tr></thead>' +
          '<tbody>' + libresRows + '</tbody>' +
          '<tfoot><tr style="background:#fff6f6;color:#a32d2d;font-weight:700">' +
            '<td style="padding:6px 9px;border:1px solid #e0e0e0" colspan="5">TOTAL MANQUE À GAGNER</td>' +
            '<td style="padding:6px 9px;border:1px solid #e0e0e0;text-align:right">' + fmt(perteTotale) + '</td>' +
          '</tr></tfoot>' +
        '</table></div>';
    }

    // ── Section honoraires cabinet ─────────────────────────────
    var honorairesCabHtml = '';
    if (showCom && typeHon !== 'aucun') {
      var MOIS_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
      var annee = deb.getFullYear();
      var moisRows = '';
      var totalHon = 0, totalVerseMois = 0;

      for (var m = deb.getMonth(); m <= (fin.getFullYear() > annee ? 11 : fin.getMonth()); m++) {
        var moisPays = pays.filter(function(p) {
          var pd = new Date(p.date_paiement || (p.annee+'-'+String(p.mois).padStart(2,'0')+'-01'));
          return pd.getMonth() === m && pd.getFullYear() === annee;
        });
        var verseMois = moisPays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
        var honMois = typeHon === 'pourcentage'
          ? Math.round(verseMois * valHon / 100)
          : typeHon === 'forfait' ? valHon * locs.length : 0;
        totalVerseMois += verseMois;
        totalHon += honMois;
        moisRows += '<tr style="background:' + (m % 2 === 0 ? '#fff' : '#fafafa') + '">' +
          '<td style="' + TD + '">' + MOIS_LABELS[m] + ' ' + annee + '</td>' +
          '<td style="' + TDr + '">' + fmt(verseMois) + '</td>' +
          '<td style="' + TDr + ';color:#a32d2d">' + (honMois > 0 ? fmt(honMois) : '—') + '</td>' +
          '<td style="' + TDr + ';color:#1a2e4a;font-weight:500">' + fmt(Math.max(0, verseMois - honMois)) + '</td>' +
        '</tr>';
      }

      honorairesCabHtml =
        '<div style="padding:8px 18px 0">' +
        '<h3 style="font-size:11px;font-weight:700;color:#1a2e4a;text-transform:uppercase;letter-spacing:.3px;margin:10px 0 6px">' +
          'Honoraires cabinet — ' + (typeHon === 'pourcentage' ? valHon + '% sur encaissements' : 'Forfait mensuel') +
        '</h3>' +
        '<table style="width:60%;min-width:400px">' +
          '<thead><tr>' +
            '<th style="' + TH + ';text-align:left">Mois</th>' +
            '<th style="' + TH + '">Encaissé</th>' +
            '<th style="' + TH + '">Honoraires</th>' +
            '<th style="' + TH + '">Net bailleur</th>' +
          '</tr></thead>' +
          '<tbody>' + moisRows + '</tbody>' +
          '<tfoot><tr style="background:#1a2e4a;color:#fff;font-weight:700">' +
            '<td style="padding:6px 9px;border:1px solid #2d4a6e">TOTAL ANNUEL</td>' +
            '<td style="padding:6px 9px;border:1px solid #2d4a6e;text-align:right">' + fmt(totalVerseMois) + '</td>' +
            '<td style="padding:6px 9px;border:1px solid #2d4a6e;text-align:right;color:#f1948a">' + fmt(totalHon) + '</td>' +
            '<td style="padding:6px 9px;border:1px solid #2d4a6e;text-align:right;color:#7ecba0">' + fmt(Math.max(0, totalVerseMois - totalHon)) + '</td>' +
          '</tr></tfoot>' +
        '</table></div>';
    }

    var lettres = _enLettres(Math.round(netBailleur));

    var css = '@page{size:A4 landscape;margin:12mm 14mm}' +
      '*{box-sizing:border-box}' +
      'body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:0;padding:0}' +
      'table{width:100%;border-collapse:collapse}' +
      'th,td{border:1px solid #ddd;padding:6px 9px;font-size:10.5px}' +
      '.sig{border-top:1px solid #888;padding-top:6px;text-align:center;width:180px}' +
      '@media print{button{display:none}}';

    var sigLabel = typePro==='cabinet'?'Le Gestionnaire du Cabinet':'Le Gestionnaire';

    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<title>Rapport — '+esc(nomImm)+'</title><style>'+css+'</style></head><body>' +

      // En-tête cabinet
      '<div style="background:#1a2e4a;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0">' +
        '<div><div style="font-size:14px;font-weight:700;color:#fff">'+esc(nomCab)+'</div>' +
          '<div style="font-size:9px;color:rgba(255,255,255,.5);margin-top:1px">Gestion immobilière'+(ville?' · '+esc(ville):'')+'</div></div>' +
        '<div style="text-align:right;font-size:9px;color:rgba(255,255,255,.5)">'+(tel?'Tél : '+esc(tel):'')+'</div>' +
      '</div>' +

      // Titre
      '<div style="border-bottom:2px solid #1a2e4a;padding:10px 18px 8px;text-align:center">' +
        '<div style="font-size:13px;font-weight:700;text-decoration:underline;text-transform:uppercase;letter-spacing:.4px;color:#1a2e4a">' +
          'Rapport du '+_fmtD(dateDebut)+' au '+_fmtD(dateFin)+'</div>' +
        '<div style="font-size:11px;font-style:italic;color:#555;margin-top:3px">'+esc(nomImm)+
          (bailleur?' — '+esc(bailleur):'')+
        '</div>' +
        '<div style="font-size:9px;color:#aaa;margin-top:1px">Généré le '+now.toLocaleDateString('fr-FR')+'</div>' +
      '</div>' +

      // Tableau principal
      '<div style="padding:10px 18px 0">' +
      '<table>' +
        '<thead><tr>' +
          '<th style="'+TH+';text-align:left;min-width:130px">Noms et prénoms<br><span style="font-weight:400;font-size:9px;opacity:.6">Tél · Local</span></th>' +
          '<th style="'+TH+'">Loyer/mois</th>' +
          '<th style="'+TH+'">Situation</th>' +
          '<th style="'+TH+'">Caution</th>' +
          '<th style="'+TH+';text-align:left;min-width:150px">Montants versés</th>' +
          (showCom?'<th style="'+TH+'">Remis bailleur</th>':'') +
          '<th style="'+TH+'">Passif</th>' +
        '</tr></thead>' +
        '<tbody>'+rows+'</tbody>' +
        '<tfoot>'+totRow+'</tfoot>' +
      '</table></div>' +

      // Locaux vacants + Honoraires cabinet
      locauxLibresHtml +
      honorairesCabHtml +

      // Récap + lettres + signatures côte à côte
      '<div style="padding:10px 18px 14px;display:flex;gap:18px;align-items:flex-start">' +

        '<table style="width:340px;min-width:280px;border-collapse:collapse;font-size:10.5px;border:1px solid #ccc;flex-shrink:0">' +
          '<thead><tr style="background:#1a2e4a;color:#fff"><th style="padding:6px 14px;border:1px solid #2d4a6e;font-weight:500;text-align:left" colspan="2">Récapitulatif financier</th></tr></thead>' +
          '<tbody>'+recapRows+'</tbody>' +
        '</table>' +

        '<div style="flex:1;display:flex;flex-direction:column;gap:10px">' +
          '<div style="border:0.5px solid #ccc;border-radius:4px;padding:9px 14px;font-size:10.5px;color:#555;font-style:italic;background:#f9f9f9">' +
            'Arrêtée la présente à la somme de :<br>' +
            '<strong style="font-style:normal;color:#1a2e4a;font-size:11px">'+lettres+' '+devise()+'</strong>' +
            '<br><span style="font-size:9px;color:#aaa">(net remis au bailleur)</span>' +
          '</div>' +
          '<div style="display:flex;gap:30px;margin-top:8px">' +
            '<div class="sig"><div style="font-size:10.5px;color:#444">'+sigLabel+'</div><div style="height:32px"></div><div style="font-size:9px;color:#bbb">(Nom, Signature, Cachet)</div></div>' +
            '<div class="sig"><div style="font-size:10.5px;color:#444">Le Bailleur</div><div style="height:32px"></div><div style="font-size:9px;color:#bbb">(Nom, Signature)</div></div>' +
          '</div>' +
        '</div>' +

      '</div>' +
      '</body></html>';
  }

  function imprimerDetailAnnuel(iid, dateDebut, dateFin) {
    var html = genererRapportAnnuelHTML(iid, dateDebut, dateFin);
    var w = window.open('', '_blank', 'width=1100,height=820');
    w.document.write(html);
    w.document.close();
    w.focus();
  }

  // ── Export DOCX rapport annuel ────────────────────────────────
  function exporterRapportAnnuelDocx(annee) {
    try {
      if (typeof docx === 'undefined') { window.IG.utils.showToast('Bibliothèque DOCX non chargée', 'red'); return; }
      var now = new Date();
      var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
      var pay = window.IG.paiements ? window.IG.paiements.getCache() : [];
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      var MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      var actifs = loc.filter(function(l) { return l.statut !== 'libre'; });
      var loyerMensuel = actifs.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
      var totalAnnuel = 0;

      var rows = [];
      for (var m = 1; m <= 12; m++) {
        var recette = pay.filter(function(p) { return parseInt(p.mois) === m && parseInt(p.annee) === annee; })
          .reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
        totalAnnuel += recette;
        var taux = loyerMensuel > 0 ? Math.round(recette / loyerMensuel * 100) : 0;
        rows.push(new docx.TableRow({ children: [
          new docx.TableCell({ children: [new docx.Paragraph({ text: MOIS[m-1] + ' ' + annee })] }),
          new docx.TableCell({ children: [new docx.Paragraph({ text: fmt(loyerMensuel), alignment: docx.AlignmentType.RIGHT })] }),
          new docx.TableCell({ children: [new docx.Paragraph({ text: fmt(recette), alignment: docx.AlignmentType.RIGHT })] }),
          new docx.TableCell({ children: [new docx.Paragraph({ text: taux + '%', alignment: docx.AlignmentType.CENTER })] }),
        ]}));
      }

      var doc2 = new docx.Document({ sections: [{ children: [
        new docx.Paragraph({ text: (session.nomCabinet || 'ImmoGest') + ' — Rapport annuel ' + annee, heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: 'Généré le ' + now.toLocaleDateString('fr-FR') }),
        new docx.Paragraph({ text: '' }),
        new docx.Paragraph({ text: 'Synthèse', heading: docx.HeadingLevel.HEADING_2 }),
        new docx.Paragraph({ text: 'Locataires actifs : ' + actifs.length }),
        new docx.Paragraph({ text: 'Loyer mensuel théorique : ' + fmt(loyerMensuel) }),
        new docx.Paragraph({ text: 'Total encaissé ' + annee + ' : ' + fmt(totalAnnuel) }),
        new docx.Paragraph({ text: 'Potentiel annuel : ' + fmt(loyerMensuel * 12) }),
        new docx.Paragraph({ text: 'Taux de recouvrement : ' + (loyerMensuel * 12 > 0 ? Math.round(totalAnnuel / (loyerMensuel * 12) * 100) : 0) + '%' }),
        new docx.Paragraph({ text: '' }),
        new docx.Paragraph({ text: 'Détail mensuel', heading: docx.HeadingLevel.HEADING_2 }),
        new docx.Table({ rows: [
          new docx.TableRow({ children: [
            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Mois', bold: true })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Loyer théorique', bold: true })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Encaissé', bold: true })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: 'Taux', bold: true })] }),
          ], tableHeader: true })
        ].concat(rows) })
      ]}] });

      docx.Packer.toBlob(doc2).then(function(blob) {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'rapport-annuel-' + annee + '.docx';
        link.click();
        window.IG.utils.showToast('Rapport DOCX téléchargé ✓', 'green');
      });
    } catch(e) { window.IG.utils.showToast('Erreur DOCX: ' + e.message, 'red'); }
  }

  // ── Rapport relances ─────────────────────────────────────────
  function afficherRapportRelances() {
    var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay = window.IG.paiements ? window.IG.paiements.getCache() : [];

    var alertes = loc
      .filter(function(l) { return l.statut !== 'libre'; })
      .map(function(l) {
        var pays = pay.filter(function(p) { return p.locataire_id == l.id; });
        var retard = window.IG.relances ? window.IG.relances.calculerRetard(l, pays) : 0;
        var du = window.IG.relances ? window.IG.relances.montantDu(l, pays) : 0;
        return { loc: l, retard: retard, du: du };
      })
      .filter(function(a) { return a.retard > 0; })
      .sort(function(a, b) { return b.retard - a.retard; });

    var totalDu = alertes.reduce(function(s, a) { return s + a.du; }, 0);
    var rows = alertes.map(function(a) {
      var imm = window.IG.immeubles ? window.IG.immeubles.getById(a.loc.immeuble_id) : null;
      var color = a.retard >= 3 ? 'var(--red)' : a.retard === 2 ? '#E05A00' : 'var(--yellow)';
      return '<tr style="border-bottom:1px solid var(--border2)">' +
        '<td style="padding:8px 12px;font-weight:600">' + esc(a.loc.nom) + '</td>' +
        '<td style="padding:8px 12px;color:var(--text3);font-size:12px">' + esc(imm ? (imm.nom_immeuble || imm.nom) : '—') + '</td>' +
        '<td style="padding:8px 12px;color:var(--text3)">' + esc(a.loc.appt || '—') + '</td>' +
        '<td style="padding:8px 12px;text-align:center;font-weight:700;color:' + color + '">' + a.retard + ' mois</td>' +
        '<td style="padding:8px 12px;text-align:right;font-weight:700;color:' + color + '">' + fmt(a.du) + '</td>' +
        '</tr>';
    }).join('');

    var html = '<h3 style="font-size:16px;margin-bottom:16px">⚠️ Rapport relances — ' + alertes.length + ' locataire(s)</h3>' +
      '<div class="metrics-grid" style="margin-bottom:16px">' +
      '<div class="metric-card"><div class="metric-label">⚠️ En retard</div><div class="metric-value" style="color:var(--red)">' + alertes.length + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">💸 Total dû</div><div class="metric-value" style="color:var(--red)">' + fmt(totalDu) + '</div></div>' +
      '</div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:8px 12px;text-align:left">Locataire</th>' +
      '<th style="padding:8px 12px;text-align:left">Immeuble</th>' +
      '<th style="padding:8px 12px;text-align:left">Local</th>' +
      '<th style="padding:8px 12px;text-align:center">Retard</th>' +
      '<th style="padding:8px 12px;text-align:right">Montant dû</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      (alertes.length === 0 ? '<p style="text-align:center;padding:20px;color:var(--text3)">🎉 Aucun impayé !</p>' : '') +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Fermer</button>' +
      '<button onclick="window.IG.rapports._exportRelancesDocx()" style="padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">📥 DOCX</button>' +
      '</div>';

    window.IG.utils.showModal(html, { width: '700px' });
  }

  // ── État des lieux ────────────────────────────────────────────
  function afficherEtatLieux() {
    var imms = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var locs = window.IG.locataires ? window.IG.locataires.getCache() : [];

    var rows = imms.map(function(imm) {
      var locsImm = locs.filter(function(l) { return l.immeuble_id == imm.id; });
      var occupes = locsImm.filter(function(l) { return l.statut !== 'libre'; }).length;
      var total = (imm.apparts || 0) + (imm.studios || 0) + (imm.chambres || 0) + (imm.duplex || 0);
      var taux = total > 0 ? Math.round(occupes / total * 100) : 0;
      var color = taux >= 80 ? 'var(--green)' : taux >= 50 ? 'var(--yellow)' : 'var(--red)';
      var loyerTotal = locsImm.filter(function(l) { return l.statut !== 'libre'; }).reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
      return '<tr style="border-bottom:1px solid var(--border2)">' +
        '<td style="padding:10px 14px"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + esc(imm.couleur || '#0E6AAF') + ';margin-right:8px"></span><strong>' + esc(imm.nom_immeuble || imm.nom) + '</strong></td>' +
        '<td style="padding:10px 14px;text-align:center">' + total + '</td>' +
        '<td style="padding:10px 14px;text-align:center;color:var(--green);font-weight:700">' + occupes + '</td>' +
        '<td style="padding:10px 14px;text-align:center;color:var(--text3)">' + (total - occupes) + '</td>' +
        '<td style="padding:10px 14px;text-align:center;font-weight:700;color:' + color + '">' + taux + '%</td>' +
        '<td style="padding:10px 14px;text-align:right">' + fmt(loyerTotal) + '/mois</td>' +
        '</tr>';
    }).join('');

    var html = '<h3 style="font-size:16px;margin-bottom:16px">🏢 État des lieux — ' + imms.length + ' immeuble(s)</h3>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:8px 12px;text-align:left">Immeuble</th>' +
      '<th style="padding:8px 12px;text-align:center">Total locaux</th>' +
      '<th style="padding:8px 12px;text-align:center">Occupés</th>' +
      '<th style="padding:8px 12px;text-align:center">Vacants</th>' +
      '<th style="padding:8px 12px;text-align:center">Taux</th>' +
      '<th style="padding:8px 12px;text-align:right">Loyers/mois</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Fermer</button>' +
      '</div>';

    window.IG.utils.showModal(html, { width: '680px' });
  }

  function _exportRelancesDocx() {
    try {
      if (typeof docx === 'undefined') { window.IG.utils.showToast('Bibliothèque DOCX non chargée', 'red'); return; }
      var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
      var pay = window.IG.paiements ? window.IG.paiements.getCache() : [];
      var alertes = loc.filter(function(l) { return l.statut !== 'libre'; }).map(function(l) {
        var pays = pay.filter(function(p) { return p.locataire_id == l.id; });
        var retard = window.IG.relances ? window.IG.relances.calculerRetard(l, pays) : 0;
        var du = window.IG.relances ? window.IG.relances.montantDu(l, pays) : 0;
        return { loc: l, retard: retard, du: du };
      }).filter(function(a) { return a.retard > 0; }).sort(function(a, b) { return b.retard - a.retard; });

      var children = [new docx.Paragraph({ text: 'RAPPORT RELANCES — ImmoGest', heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: 'Généré le ' + new Date().toLocaleDateString('fr-FR') })];
      alertes.forEach(function(a) {
        children.push(new docx.Paragraph({ text: a.loc.nom + ' — ' + a.retard + ' mois — ' + fmt(a.du) + ' dû' }));
      });
      var doc2 = new docx.Document({ sections: [{ children: children }] });
      docx.Packer.toBlob(doc2).then(function(blob) {
        var link = document.createElement('a'); link.href = URL.createObjectURL(blob);
        link.download = 'rapport-relances-' + Date.now() + '.docx'; link.click();
      });
    } catch(e) { window.IG.utils.showToast('Erreur DOCX: ' + e.message, 'red'); }
  }

  return {
    genererRapportMensuelHTML, afficherRapportMensuel, exporterDocx,
    genererRapportAnnuelHTML,
    afficherRapportAnnuel, ouvrirDetailAnnuel, imprimerDetailAnnuel, exporterRapportAnnuelDocx,
    afficherRapportRelances, afficherEtatLieux, _exportRelancesDocx
  };

})();
