// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Dashboard KPIs avancés
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.dashboard = (function() {

  function t(k)   { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function fmt(n) { return window.IG.utils.formatMontant(n); }
  function esc(s) { return window.IG.utils.esc(s); }
  var LOCALE_DATE = { fr:'fr-FR', en:'en-GB', pt:'pt-BR', es:'es-ES', ha:'ha', ar:'ar-SA' };
  function _dateLocale() { return LOCALE_DATE[(window.IG.i18n && window.IG.i18n.lang) || 'fr'] || 'fr-FR'; }

  // ── KPIs annuels ─────────────────────────────────────────────
  function calculerKPIs(locataires, paiements) {
    var now = new Date();
    var annee = now.getFullYear();
    var moisCourant = now.getMonth() + 1;

    var actifs = locataires.filter(function(l) { return l.statut !== 'libre'; });
    var libres  = locataires.filter(function(l) { return l.statut === 'libre'; });

    // Recettes par mois (année courante)
    var recettesParMois = {};
    for (var m = 1; m <= 12; m++) recettesParMois[m] = 0;
    paiements.forEach(function(p) {
      if (parseInt(p.annee) === annee && p.mois >= 1 && p.mois <= 12) {
        recettesParMois[parseInt(p.mois)] += parseFloat(p.montant) || 0;
      }
    });

    // Taux de recouvrement mois courant
    var loyerTheoriqueM = actifs.reduce(function(s, l) { return s + (parseFloat(l.loyer) || 0); }, 0);
    var recetteMois = recettesParMois[moisCourant] || 0;
    var txRecouvrement = loyerTheoriqueM > 0 ? Math.round(recetteMois / loyerTheoriqueM * 100) : 0;

    // Total impayés
    var totalDu = 0;
    actifs.forEach(function(loc) {
      var pays = paiements.filter(function(p) { return p.locataire_id == loc.id; });
      var fiche = window.IG.paiements ? window.IG.paiements.calculerFiche(loc, pays) : [];
      totalDu += fiche.reduce(function(s, l) { return s + (l.reste || 0); }, 0);
    });

    return {
      actifs: actifs.length,
      libres: libres.length,
      total: locataires.length,
      loyerTheorique: loyerTheoriqueM,
      recetteMois,
      txRecouvrement,
      totalDu,
      recettesParMois,
      recetteAnnuelle: Object.values(recettesParMois).reduce(function(s,v) { return s+v; }, 0)
    };
  }

  // ── Graphique barres mensuel (SVG) ────────────────────────────
  function renderGrapheMensuel(recettesParMois, loyer) {
    var max = Math.max(loyer, ...Object.values(recettesParMois), 1);
    var W = 560, H = 160, barW = 36, gap = 10;
    var now = new Date();
    var moisCourant = now.getMonth() + 1;

    var svg = '<svg viewBox="0 0 ' + W + ' ' + (H + 40) + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:' + W + 'px;overflow:visible">';

    // Ligne loyer théorique
    var yLoyer = H - Math.round(loyer / max * H);
    svg += '<line x1="20" y1="' + yLoyer + '" x2="' + (W-10) + '" y2="' + yLoyer + '" stroke="rgba(14,106,175,0.2)" stroke-dasharray="4,4" stroke-width="1"/>';
    svg += '<text x="' + (W-8) + '" y="' + (yLoyer-3) + '" fill="rgba(14,106,175,0.5)" font-size="9" text-anchor="end">' + t('Loyer théorique') + '</text>';

    // Barres
    for (var m = 1; m <= 12; m++) {
      var x = 20 + (m-1) * (barW + gap);
      var val = recettesParMois[m] || 0;
      var h = Math.round(val / max * H) || 2;
      var y = H - h;
      var isCurrent = m === moisCourant;
      var color = val >= loyer ? '#0E7A45' : val > 0 ? '#E0A040' : '#E8EEFF';
      if (isCurrent) color = val >= loyer ? '#0E7A45' : '#0E6AAF';

      svg += '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="4" fill="' + color + '" opacity="' + (isCurrent ? '1' : '0.7') + '"/>';
      if (val > 0) svg += '<text x="' + (x + barW/2) + '" y="' + (y-4) + '" fill="' + color + '" font-size="8" text-anchor="middle" font-weight="600">' + Math.round(val/1000) + 'k</text>';
      svg += '<text x="' + (x + barW/2) + '" y="' + (H+16) + '" fill="#7A90A8" font-size="9" text-anchor="middle">' + (window.IG.i18n ? window.IG.i18n.nomMoisCourt(m) : m) + '</text>';
    }

    svg += '</svg>';
    return svg;
  }

  // ── Render dashboard complet ──────────────────────────────────
  function render(data) {
    var content = document.getElementById('page-content');
    if (!content) return;

    var kpis = calculerKPIs(data.locataires, data.paiements);
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var now = new Date();
    var moisNom = t(window.IG.utils.nomMois(now.getMonth() + 1));

    // Compter retards
    var nbRetards = 0;
    data.locataires.filter(function(l){ return l.statut !== 'libre'; }).forEach(function(loc) {
      var pays = data.paiements.filter(function(p){ return p.locataire_id == loc.id; });
      var ret = window.IG.relances ? window.IG.relances.calculerRetard(loc, pays) : 0;
      if (ret > 0) nbRetards++;
    });

    var html = '<div class="content">' +

      // En-tête
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;flex-wrap:wrap;gap:10px">' +
      '<div>' +
      '<h2 style="font-size:19px;font-weight:700;margin-bottom:3px">' + t('Bonjour') + ' ' + esc(session.nom || '') + ' 👋</h2>' +
      '<p style="color:var(--text3);font-size:13px">' + now.toLocaleDateString(_dateLocale(), { weekday:'long', year:'numeric', month:'long', day:'numeric' }) + '</p>' +
      '</div>' +
      '<button onclick="window.IG.app.refresh()" style="padding:8px 14px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:12px;color:var(--text2)">↻ ' + t('Actualiser') + '</button>' +
      '</div>' +

      // KPIs principaux
      '<div class="metrics-grid" style="margin-bottom:20px">' +
      _kpi('🏢', data.immeubles.length, t('Immeubles'), '') +
      _kpi('👥', kpis.actifs, t('Locataires actifs'), '') +
      _kpi('💰', fmt(kpis.recetteMois), moisNom, 'blue') +
      _kpi('📈', kpis.txRecouvrement + '%', t('Recouvrement'), kpis.txRecouvrement >= 80 ? 'green' : 'red') +
      _kpi('⚠️', nbRetards, t('En retard'), nbRetards > 0 ? 'red' : '') +
      _kpi('🏠', kpis.libres, t('Locaux libres'), '') +
      '</div>' +

      // Graphique + actions rapides
      '<div style="display:grid;grid-template-columns:1fr auto;gap:16px;margin-bottom:20px;align-items:start">' +
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">📊 ' + t('Recettes') + ' ' + now.getFullYear() + ' — ' + fmt(kpis.recetteAnnuelle) + '</div></div>' +
      '<div style="padding-top:8px">' + renderGrapheMensuel(kpis.recettesParMois, kpis.loyerTheorique) + '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;min-width:200px">' +
      _actionBtn('🏢', t('Ajouter immeuble'), 'window.IG.immeubles.afficherFormulaire()') +
      _actionBtn('👤', t('Ajouter locataire'), 'window.IG.locataires.afficherFormulaire()') +
      _actionBtn('💵', t('Encaisser loyer'), 'window.IG.app.showPage(\'locataires\')') +
      _actionBtn('📊', t('Rapport mensuel'), 'window.IG.rapports.afficherRapportMensuel()') +
      (nbRetards > 0 ? _actionBtn('🔔', t('Relances') + ' (' + nbRetards + ')', 'window.IG.app.showPage(\'relances\')', '#B93020') : '') +
      '</div></div>' +

      // Alertes impayés
      (kpis.totalDu > 0 ? _alerteDu(kpis.totalDu, data.locataires, data.paiements) : '') +

      // Immeubles mini
      '<div class="card">' +
      '<div class="card-header">' +
      '<div class="card-title">🏢 ' + t('Mes immeubles') + '</div>' +
      '<button onclick="window.IG.app.showPage(\'immeubles\')" style="font-size:12px;color:var(--accent);background:none;border:none;cursor:pointer">' + t('Voir tout') + ' →</button>' +
      '</div>' + _immeublesMini(data) + '</div>' +
      '</div>';

    content.innerHTML = html;

    // Bannière pub CPM — tous plans
    if (window.IG.ads) window.IG.ads.rendreBannierePromo('page-content');
  }

  function _kpi(icon, val, label, color) {
    var c = { green:'var(--green)', red:'var(--red)', blue:'var(--accent)' }[color] || 'var(--text)';
    return '<div class="metric-card" onclick="window.IG.app.showPage(\'locataires\')" style="cursor:pointer">' +
      '<div class="metric-label">' + icon + ' ' + label + '</div>' +
      '<div class="metric-value" style="color:' + c + '">' + val + '</div></div>';
  }

  function _actionBtn(icon, label, onclick, color) {
    return '<button onclick="' + onclick + '" style="padding:11px 16px;border-radius:10px;border:1px solid var(--border2);background:var(--bg2);cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;width:100%;color:' + (color || 'var(--text)') + ';box-shadow:var(--shadow)">' +
      icon + ' ' + label + '</button>';
  }

  function _alerteDu(totalDu, locataires, paiements) {
    var topImpayes = locataires
      .filter(function(l) { return l.statut !== 'libre'; })
      .map(function(loc) {
        var pays = paiements.filter(function(p) { return p.locataire_id == loc.id; });
        var du = window.IG.relances ? window.IG.relances.montantDu(loc, pays) : 0;
        return { loc, du };
      })
      .filter(function(x) { return x.du > 0; })
      .sort(function(a, b) { return b.du - a.du; })
      .slice(0, 5);

    var html = '<div class="card" style="border-left:4px solid var(--red);margin-bottom:20px">' +
      '<div class="card-header"><div class="card-title" style="color:var(--red)">⚠️ ' + t('Total impayés') + ' : ' + fmt(totalDu) + '</div>' +
      '<button onclick="window.IG.app.showPage(\'relances\')" style="font-size:12px;color:var(--red);background:none;border:none;cursor:pointer">' + t('Voir relances') + ' →</button></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">';
    topImpayes.forEach(function(x) {
      var wa = window.IG.locataires ? window.IG.locataires.lienWA(x.loc, 'Bonjour ' + x.loc.nom + ', votre loyer de ' + fmt(x.du) + ' est attendu. ImmoGest') : null;
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;background:var(--red-bg);border-radius:8px">' +
        '<span style="font-size:13px;font-weight:600">' + esc(x.loc.nom) + (x.loc.appt ? ' — ' + esc(x.loc.appt) : '') + '</span>' +
        '<div style="display:flex;gap:6px;align-items:center">' +
        (wa ? '<a href="' + wa + '" target="_blank" style="padding:3px 8px;border-radius:5px;background:#25D366;color:#fff;font-size:11px;font-weight:700;text-decoration:none">WA</a>' : '') +
        '<span style="font-size:12px;font-weight:700;color:var(--red)">' + fmt(x.du) + '</span>' +
        '</div></div>';
    });
    html += '</div></div>';
    return html;
  }

  function _immeublesMini(data) {
    if (!data.immeubles.length) return '<p style="color:var(--text3);font-size:13px;text-align:center;padding:20px">' + t('Aucun immeuble') + '</p>';
    var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">';
    data.immeubles.forEach(function(imm) {
      var actifs = data.locataires.filter(function(l) { return l.immeuble_id == imm.id && l.statut !== 'libre'; }).length;
      var total  = (imm.apparts || 0) + (imm.studios || 0) + (imm.chambres || 0) + (imm.duplex || 0);
      html += '<div style="background:var(--bg3);border-radius:10px;padding:12px;cursor:pointer;border-left:3px solid ' + esc(imm.couleur || '#0E6AAF') + '" ' +
        'onclick="window.IG.app.showPage(\'locataires\',{immeubleId:' + imm.id + '})">' +
        '<div style="font-weight:700;font-size:13px;margin-bottom:4px">' + esc(imm.nom_immeuble || imm.nom) + '</div>' +
        '<div style="font-size:11px;color:var(--text3)">' + actifs + '/' + total + ' ' + t('occupés') + '</div>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  return { render, calculerKPIs, renderGrapheMensuel };

})();
