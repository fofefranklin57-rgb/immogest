// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Module Rapports (HTML aperçu + DOCX)
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.rapports = (function() {

  function t(k)   { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }

  // ── Rapport mensuel HTML (aperçu) ────────────────────────────
  function genererRapportMensuelHTML(mois, annee, immeubles, locataires, paiements) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var nomMois = window.IG.utils.nomMois(mois);
    var totalRecettes = paiements
      .filter(function(p) { return parseInt(p.mois) === mois && parseInt(p.annee) === annee; })
      .reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

    var actifs = locataires.filter(function(l) { return l.statut !== 'libre'; });
    var libres = locataires.filter(function(l) { return l.statut === 'libre'; });

    var html = '<div style="font-family:var(--font);padding:20px">' +
      '<div style="text-align:center;margin-bottom:24px;border-bottom:2px solid var(--accent);padding-bottom:16px">' +
      '<h2 style="color:var(--accent);font-size:20px;margin-bottom:4px">RAPPORT MENSUEL — ' + nomMois.toUpperCase() + ' ' + annee + '</h2>' +
      '<p style="color:var(--text3);font-size:13px">' + esc(session.nomCabinet || session.nom || 'ImmoGest') + '</p>' +
      '</div>' +

      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">' +
      _metricCard('🏢', immeubles.length, t('Immeubles')) +
      _metricCard('👤', actifs.length, t('Locataires actifs')) +
      _metricCard('💰', fmt(totalRecettes), t('Recettes') + ' ' + t(nomMois)) +
      '</div>';

    // Tableau par immeuble
    immeubles.forEach(function(imm) {
      var locs = locataires.filter(function(l) { return l.immeuble_id == imm.id; });
      var actifImm = locs.filter(function(l) { return l.statut !== 'libre'; });
      if (!actifImm.length) return;

      var recetteImm = paiements
        .filter(function(p) {
          return parseInt(p.mois) === mois && parseInt(p.annee) === annee &&
            actifImm.some(function(l) { return l.id == p.locataire_id; });
        })
        .reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);

      html += '<div style="margin-bottom:20px;border:1px solid var(--border2);border-radius:10px;overflow:hidden">' +
        '<div style="background:' + esc(imm.couleur || '#0E6AAF') + ';color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">' +
        '<span style="font-weight:700">' + esc(imm.nom_immeuble || imm.nom) + '</span>' +
        '<span style="font-size:13px">' + fmt(recetteImm) + '</span></div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px">' +
        '<thead><tr style="background:var(--bg3);color:var(--text3)">' +
        '<th style="padding:8px 10px;text-align:left">' + t('Locataire') + '</th>' +
        '<th style="padding:8px 10px;text-align:left">' + t('Local') + '</th>' +
        '<th style="padding:8px 10px;text-align:right">' + t('Loyer') + '</th>' +
        '<th style="padding:8px 10px;text-align:right">' + t('Payé') + '</th>' +
        '<th style="padding:8px 10px;text-align:center">' + t('Statut') + '</th>' +
        '</tr></thead><tbody>';

      actifImm.forEach(function(loc) {
        var pays = paiements.filter(function(p) {
          return p.locataire_id == loc.id && parseInt(p.mois) === mois && parseInt(p.annee) === annee;
        });
        var montantPaye = pays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
        var paye = montantPaye >= (parseFloat(loc.loyer) || 0);
        html += '<tr style="border-bottom:1px solid var(--border2)">' +
          '<td style="padding:8px 10px;font-weight:600">' + esc(loc.nom) + '</td>' +
          '<td style="padding:8px 10px;color:var(--text3)">' + esc(loc.appt || '—') + '</td>' +
          '<td style="padding:8px 10px;text-align:right">' + fmt(loc.loyer) + '</td>' +
          '<td style="padding:8px 10px;text-align:right;font-weight:600;color:' + (montantPaye > 0 ? 'var(--green)' : 'var(--text3)') + '">' + fmt(montantPaye) + '</td>' +
          '<td style="padding:8px 10px;text-align:center">' +
          (paye ? '<span style="color:var(--green);font-weight:700">✓</span>' : '<span style="color:var(--red);font-weight:700">✗</span>') +
          '</td></tr>';
      });
      html += '</tbody></table></div>';
    });

    html += '<div style="text-align:center;color:var(--text3);font-size:11px;margin-top:16px;border-top:1px solid var(--border2);padding-top:12px">' +
      'Généré par ImmoGest v2 — ' + new Date().toLocaleDateString('fr-FR') + '</div></div>';

    return html;
  }

  function _metricCard(icon, val, label) {
    return '<div style="background:var(--bg3);border-radius:10px;padding:16px;text-align:center">' +
      '<div style="font-size:24px;margin-bottom:6px">' + icon + '</div>' +
      '<div style="font-size:20px;font-weight:700;color:var(--accent)">' + val + '</div>' +
      '<div style="font-size:11px;color:var(--text3);text-transform:uppercase;margin-top:4px">' + label + '</div>' +
      '</div>';
  }

  // ── Afficher modal rapport ────────────────────────────────────
  function afficherRapportMensuel() {
    var now = new Date();
    var imm = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay = window.IG.paiements ? window.IG.paiements.getCache() : [];

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
      '<h3 style="font-size:16px">📊 ' + t('Rapport mensuel') + '</h3>' +
      '<div style="display:flex;gap:8px">' +
      '<select id="rapport-mois" style="padding:6px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      Array.from({length:12}, function(_, i) {
        var m = i + 1;
        var sel = m === now.getMonth()+1 ? ' selected' : '';
        return '<option value="' + m + '"' + sel + '>' + window.IG.utils.nomMois(m) + '</option>';
      }).join('') + '</select>' +
      '<input id="rapport-annee" type="number" value="' + now.getFullYear() + '" min="2020" max="2030" ' +
        'style="width:80px;padding:6px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<button id="btn-generer-rapport" style="padding:6px 14px;border-radius:6px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + t('Générer') + '</button>' +
      '</div></div>' +
      '<div id="rapport-contenu"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Fermer') + '</button>' +
      '<button id="btn-export-docx" style="padding:8px 16px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600;display:none">📥 DOCX</button>' +
      '</div>';

    var modal = window.IG.utils.showModal(html, { width: '720px' });

    var _lastHtml = '';
    function generer() {
      var m = parseInt(modal.box.querySelector('#rapport-mois').value);
      var a = parseInt(modal.box.querySelector('#rapport-annee').value);
      _lastHtml = genererRapportMensuelHTML(m, a, imm, loc, pay);
      modal.box.querySelector('#rapport-contenu').innerHTML = _lastHtml;
      modal.box.querySelector('#btn-export-docx').style.display = 'inline-block';
    }

    modal.box.querySelector('#btn-generer-rapport').addEventListener('click', generer);
    generer();

    modal.box.querySelector('#btn-export-docx').addEventListener('click', function() {
      exporterDocx(_lastHtml);
    });
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

  // ── Rapport annuel (pleine page) ────────────────────────────
  function afficherRapportAnnuel(anneeParam) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var now = new Date();
    var annee = anneeParam || now.getFullYear();
    var imm = window.IG.immeubles ? window.IG.immeubles.getCache() : [];
    var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay = window.IG.paiements ? window.IG.paiements.getCache() : [];
    var session = window.IG.auth ? window.IG.auth.getSession() : {};

    var MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    var MOIS_COURT = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    var totalAnnuel = 0;
    var rows = '';
    var actifs = loc.filter(function(l) { return l.statut !== 'libre'; });
    var loyerMensuel = actifs.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
    var recettesParMois = {};

    for (var m = 1; m <= 12; m++) {
      var recette = pay.filter(function(p) { return parseInt(p.mois) === m && parseInt(p.annee) === annee; })
        .reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
      recettesParMois[m] = recette;
      totalAnnuel += recette;
      var taux = loyerMensuel > 0 ? Math.round(recette / loyerMensuel * 100) : 0;
      var color = taux >= 80 ? 'var(--green)' : taux >= 40 ? '#E0A040' : (recette > 0 ? 'var(--red)' : 'var(--text3)');
      var bar = taux > 0 ? '<div style="display:inline-block;width:' + Math.min(taux, 100) + 'px;height:6px;background:' + color + ';border-radius:3px;vertical-align:middle;margin-right:6px"></div>' : '';
      rows += '<tr style="border-bottom:1px solid var(--border2)">' +
        '<td style="padding:9px 14px;font-weight:600;color:var(--text)">' + MOIS[m-1] + '</td>' +
        '<td style="padding:9px 14px;text-align:right;color:var(--text3);font-size:12px">' + fmt(loyerMensuel) + '</td>' +
        '<td style="padding:9px 14px;text-align:right;font-weight:700;color:' + color + '">' + fmt(recette) + '</td>' +
        '<td style="padding:9px 14px"><div style="display:flex;align-items:center">' + bar + '<span style="color:' + color + ';font-weight:700;font-size:12px">' + taux + '%</span></div></td>' +
        '</tr>';
    }

    var txAnnuel = loyerMensuel * 12 > 0 ? Math.round(totalAnnuel / (loyerMensuel * 12) * 100) : 0;
    var graphe = window.IG.dashboard ? window.IG.dashboard.renderGrapheMensuel(recettesParMois, loyerMensuel) : '';

    // Sélecteur d'année (5 ans)
    var anneeSel = '<select id="ra-annee" onchange="window.IG.rapports.afficherRapportAnnuel(parseInt(this.value))" style="padding:6px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">';
    for (var y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
      anneeSel += '<option value="' + y + '"' + (y === annee ? ' selected' : '') + '>' + y + '</option>';
    }
    anneeSel += '</select>';

    var html = '<div class="content" id="rapport-annuel-page">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px">' +
      '<h2 style="font-size:17px;font-weight:700">📆 Rapport annuel ' + annee + '</h2>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      anneeSel +
      '<button onclick="window.IG.rapports.exporterRapportAnnuelDocx(' + annee + ')" style="padding:7px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:13px;font-weight:600">📥 DOCX</button>' +
      '<button onclick="window.print()" style="padding:7px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">🖨️ Imprimer</button>' +
      '</div></div>' +

      // En-tête cabinet
      '<div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none;padding:18px 20px">' +
      '<div style="font-size:14px;font-weight:700;margin-bottom:2px">' + esc(session.nomCabinet || session.nom || 'ImmoGest') + '</div>' +
      '<div style="font-size:12px;opacity:.8">Rapport de gestion locative — Exercice ' + annee + '</div>' +
      '</div>' +

      // KPIs
      '<div class="metrics-grid" style="margin-bottom:20px">' +
      '<div class="metric-card"><div class="metric-label">💰 Total encaissé</div><div class="metric-value green" style="font-size:18px">' + fmt(totalAnnuel) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">🏢 Potentiel annuel</div><div class="metric-value" style="font-size:16px">' + fmt(loyerMensuel * 12) + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">📈 Taux recouvrement</div><div class="metric-value" style="color:' + (txAnnuel >= 80 ? 'var(--green)' : 'var(--red)') + '">' + txAnnuel + '%</div></div>' +
      '<div class="metric-card"><div class="metric-label">👥 Locataires actifs</div><div class="metric-value">' + actifs.length + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">🏠 Immeubles</div><div class="metric-value">' + imm.length + '</div></div>' +
      '<div class="metric-card"><div class="metric-label">📉 Non encaissé</div><div class="metric-value red" style="font-size:16px">' + fmt(loyerMensuel * 12 - totalAnnuel) + '</div></div>' +
      '</div>' +

      // Graphe
      '<div class="card" style="margin-bottom:20px"><div class="card-header"><div class="card-title">📊 Recettes mensuelles ' + annee + '</div></div>' +
      '<div style="padding-top:8px">' + graphe + '</div></div>' +

      // Tableau mensuel
      '<div class="card"><div class="card-header"><div class="card-title">📋 Détail mensuel</div></div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:9px 14px;text-align:left">Mois</th>' +
      '<th style="padding:9px 14px;text-align:right">Loyer théorique</th>' +
      '<th style="padding:9px 14px;text-align:right">Encaissé</th>' +
      '<th style="padding:9px 14px;text-align:left;min-width:140px">Taux</th>' +
      '</tr></thead><tbody>' + rows + '</tbody>' +
      '<tfoot><tr style="background:var(--bg3);font-weight:700">' +
      '<td style="padding:9px 14px">TOTAL ' + annee + '</td>' +
      '<td style="padding:9px 14px;text-align:right">' + fmt(loyerMensuel * 12) + '</td>' +
      '<td style="padding:9px 14px;text-align:right;color:var(--green)">' + fmt(totalAnnuel) + '</td>' +
      '<td style="padding:9px 14px">' + txAnnuel + '%</td>' +
      '</tr></tfoot>' +
      '</table></div></div>' +
      '</div>';

    content.innerHTML = html;
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
    afficherRapportAnnuel, exporterRapportAnnuelDocx,
    afficherRapportRelances, afficherEtatLieux, _exportRelancesDocx
  };

})();
