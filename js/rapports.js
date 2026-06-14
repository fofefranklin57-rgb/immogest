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
      _metricCard('💰', fmt(totalRecettes), t('Recettes ' + nomMois)) +
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

  return {
    genererRapportMensuelHTML, afficherRapportMensuel, exporterDocx
  };

})();
