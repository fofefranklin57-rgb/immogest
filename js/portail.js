// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Portail Locataire
//  Accès locataire : solde, historique, déclarations, messages
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.portail = (function() {

  function t(k) { return window.IG.i18n ? window.IG.i18n.t(k) : k; }
  function esc(s) { return window.IG.utils.esc(s); }
  function fmt(n) { return window.IG.utils.formatMontant(n); }
  function db()  { return window.IG.db; }

  // ── Render portail locataire ──────────────────────────────────
  async function renderPage() {
    var content = document.getElementById('page-content');
    if (!content) return;

    var session = window.IG.auth ? window.IG.auth.getSession() : null;
    if (!session || session.role !== 'locataire') {
      content.innerHTML = '<div class="content"><div class="card" style="text-align:center;padding:60px 20px">' +
        '<div style="font-size:48px;margin-bottom:12px">🔒</div>' +
        '<p style="color:var(--text3)">' + t('Accès réservé aux locataires') + '</p></div></div>';
      return;
    }

    var locId = session.locataireId || session.locataire_id;
    if (!locId) { content.innerHTML = '<div class="content"><p style="color:var(--text3);padding:20px">' + t('Locataire non associé à ce compte.') + '</p></div>'; return; }

    var data = window.IG.app ? window.IG.app.getData() : { locataires: [], paiements: [] };
    var loc = data.locataires.find(function(l) { return l.id == locId; });
    if (!loc) {
      try {
        var locs = await db().select('locataires', { id: locId });
        loc = locs[0];
      } catch(e) {}
    }
    if (!loc) { content.innerHTML = '<div class="content"><p style="color:var(--text3);padding:20px">' + t('Fiche locataire introuvable.') + '</p></div>'; return; }

    var paiements = data.paiements.filter(function(p) { return p.locataire_id == loc.id; });
    var fiche = window.IG.paiements ? window.IG.paiements.calculerFiche(loc, paiements) : [];
    var impayes = fiche.filter(function(l) { return l.statut !== 'Payé'; });
    var montantDu = impayes.reduce(function(s, l) { return s + (l.reste || 0); }, 0);
    var score = window.IG.legal ? window.IG.legal.calculerScore(loc, paiements) : 100;
    var scoreBadge = window.IG.legal ? window.IG.legal.scoreBadge(score) : { emoji: '🟢', label: 'Bon', color: 'var(--green)' };

    var html = '<div class="content">' +
      // En-tête
      '<div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border:none">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">' +
      '<div>' +
      '<div style="font-size:11px;opacity:.75;margin-bottom:4px">' + t('MON ESPACE LOCATAIRE') + '</div>' +
      '<div style="font-size:20px;font-weight:700">' + esc(loc.nom) + '</div>' +
      '<div style="font-size:13px;opacity:.85;margin-top:4px">' + t('Local') + ' ' + esc(loc.appt || '—') + ' · ' + t('Loyer') + ' ' + fmt(loc.loyer) + t('/mois') + '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
      '<div style="font-size:24px">' + scoreBadge.emoji + '</div>' +
      '<div style="font-size:12px;opacity:.85">' + score + '/100</div>' +
      '<div style="font-size:11px;opacity:.7">' + scoreBadge.label + '</div>' +
      '</div>' +
      '</div></div>' +

      // KPIs
      '<div class="metrics-grid" style="margin-bottom:16px">' +
      _kpi('💰', fmt(montantDu), t('Solde dû'), montantDu > 0 ? 'red' : 'green') +
      _kpi('📅', impayes.length + ' ' + t('Mois'), t('En retard'), impayes.length > 0 ? 'red' : 'green') +
      _kpi('✅', paiements.length, t('Paiements'), '') +
      '</div>' +

      // Bouton déclarer paiement
      (montantDu > 0 ? '<button onclick="window.IG.portail.declarerPaiement(' + loc.id + ')" ' +
        'style="width:100%;padding:14px;border-radius:12px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:14px;font-weight:700;margin-bottom:16px">' +
        '💵 ' + t('Enregistrer un paiement') + '</button>' : '') +

      // Historique fiche
      '<div class="card">' +
      '<div class="card-header"><div class="card-title">📋 Historique des loyers</div></div>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg4)">' +
      '<th style="padding:8px 10px;text-align:left;font-weight:600">' + t('Période') + '</th>' +
      '<th style="padding:8px 10px;text-align:right;font-weight:600">' + t('Loyer') + '</th>' +
      '<th style="padding:8px 10px;text-align:center;font-weight:600">' + t('Statut') + '</th>' +
      '<th style="padding:8px 10px;text-align:right;font-weight:600">' + t('Reste') + '</th>' +
      '</tr></thead><tbody>' +
      fiche.slice().reverse().map(function(ligne) {
        var paye = ligne.statut === 'Payé';
        return '<tr style="border-bottom:1px solid var(--border2)">' +
          '<td style="padding:8px 10px">' + esc(ligne.periode) + '</td>' +
          '<td style="padding:8px 10px;text-align:right">' + fmt(loc.loyer) + '</td>' +
          '<td style="padding:8px 10px;text-align:center">' +
          '<span style="padding:2px 10px;border-radius:99px;font-size:11px;font-weight:700;' +
          'background:' + (paye ? 'var(--green-bg)' : 'var(--red-bg)') + ';' +
          'color:' + (paye ? 'var(--green)' : 'var(--red)') + '">' +
          (paye ? '✓ ' + t('Payé') : '✗ ' + t('Impayé')) + '</span></td>' +
          '<td style="padding:8px 10px;text-align:right;color:' + (ligne.reste > 0 ? 'var(--red)' : 'var(--green)') + ';font-weight:600">' +
          (ligne.reste > 0 ? fmt(ligne.reste) : '—') + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table></div></div>' +

      // Bannière pub
      '<div id="ig-ad-portail" style="margin:16px 0;text-align:center"></div>' +

      // Déclarations en attente
      '<div id="portail-declarations" style="margin-top:16px"></div>' +

      '</div>';

    content.innerHTML = html;
    _chargerDeclarations(loc.id);
    if (window.IG.ads) window.IG.ads.injecterSlot('ig-ad-portail', 'ad1');
  }

  async function _chargerDeclarations(locId) {
    var zone = document.getElementById('portail-declarations');
    if (!zone) return;
    try {
      var decls = await db().select('declarations', { locataire_id: locId });
      if (!decls.length) return;
      var html = '<div class="card">' +
        '<div class="card-header"><div class="card-title">📨 Mes déclarations</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px">';
      decls.forEach(function(d) {
        var colors = { pending: ['var(--yellow-bg)', 'var(--yellow)', 'En attente'], validated: ['var(--green-bg)', 'var(--green)', 'Validé'], rejected: ['var(--red-bg)', 'var(--red)', 'Rejeté'] };
        var c = colors[d.statut] || colors.pending;
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:' + c[0] + ';border-radius:8px">' +
          '<div>' +
          '<div style="font-size:13px;font-weight:600">' + fmt(d.montant) + ' — ' + esc(window.IG.utils.formatPeriode(d.mois_c, d.annee_c)) + '</div>' +
          '<div style="font-size:11px;color:var(--text3)">' + window.IG.utils.formatDate(d.date_declaration) + '</div>' +
          '</div>' +
          '<span style="font-size:11px;font-weight:700;color:' + c[1] + '">' + c[2] + '</span>' +
          '</div>';
      });
      html += '</div></div>';
      zone.innerHTML = html;
    } catch(e) {}
  }

  function _kpi(icon, val, label, color) {
    var c = { red: 'var(--red)', green: 'var(--green)' }[color] || 'var(--text)';
    return '<div class="metric-card"><div class="metric-label">' + icon + ' ' + label + '</div>' +
      '<div class="metric-value" style="color:' + c + '">' + val + '</div></div>';
  }

  // ── Déclarer paiement ────────────────────────────────────────
  function declarerPaiement(locId) {
    var data = window.IG.app ? window.IG.app.getData() : {};
    var loc = (data.locataires || []).find(function(l) { return l.id == locId; });
    var now = new Date();

    var modal = window.IG.utils.showModal(
      '<h3 style="margin-bottom:16px;font-size:15px;font-weight:700">💵 Déclarer un paiement</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +

      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Montant (FCFA) *</label>' +
      '<input id="decl-montant" type="number" value="' + (loc ? loc.loyer : '') + '" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +

      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Mois</label>' +
      '<select id="decl-mois" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      [1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
        return '<option value="' + m + '"' + (m === now.getMonth() + 1 ? ' selected' : '') + '>' + window.IG.utils.nomMois(m) + '</option>';
      }).join('') +
      '</select></div>' +
      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Année</label>' +
      '<input id="decl-annee" type="number" value="' + now.getFullYear() + '" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +
      '</div>' +

      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Mode de paiement</label>' +
      '<select id="decl-mode" onchange="window.IG.portail._afficherNumeroMomo(this.value)" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px">' +
      '<option value="mtn_momo">MTN MoMo 💛</option>' +
      '<option value="orange_money">Orange Money 🟠</option>' +
      '<option value="wave">Wave 🌊</option>' +
      '<option value="airtel">Airtel Money 🔴</option>' +
      '<option value="moov">Moov Money 🔵</option>' +
      '<option value="especes">Espèces 💵</option>' +
      '<option value="virement">Virement bancaire 🏦</option>' +
      '</select>' +
      '<div id="decl-momo-numero" style="display:none;margin-top:8px;padding:10px 14px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);font-size:13px">' +
      '📲 Envoyez à ce numéro : <strong id="decl-momo-num-val" style="font-size:15px;color:var(--accent)"></strong>' +
      '</div></div>' +

      '<div><label style="font-size:12px;color:var(--text2);font-weight:600">Référence de transaction</label>' +
      '<input id="decl-ref" placeholder="Ex: TXN123456" style="width:100%;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:13px;margin-top:4px"></div>' +

      '<p style="font-size:11px;color:var(--text3);background:var(--yellow-bg);padding:8px 12px;border-radius:8px">⏳ Votre déclaration sera validée par le gestionnaire avant d\'apparaître dans votre solde.</p>' +

      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="decl-save" style="padding:9px 16px;border-radius:8px;border:none;background:var(--green);color:#fff;cursor:pointer;font-size:13px;font-weight:600">Envoyer</button>' +
      '</div></div>',
      { width: '480px' }
    );

    modal.box.querySelector('#decl-save').addEventListener('click', async function() {
      var montant = parseFloat(modal.box.querySelector('#decl-montant').value) || 0;
      if (!montant) { window.IG.utils.showToast('Montant requis', 'red'); return; }
      try {
        await db().insert('declarations', {
          locataire_id:    locId,
          montant,
          mois_c:          parseInt(modal.box.querySelector('#decl-mois').value),
          annee_c:         parseInt(modal.box.querySelector('#decl-annee').value),
          mode:            modal.box.querySelector('#decl-mode').value,
          ref:             modal.box.querySelector('#decl-ref').value,
          statut:          'pending',
          nom_locataire:   loc ? loc.nom : '',
          date_declaration: new Date().toISOString()
        });
        modal.close();
        window.IG.utils.showToast('Déclaration envoyée — en attente de validation', 'green');
        renderPage();
      } catch(e) {
        window.IG.utils.showToast('Erreur: ' + e.message, 'red');
      }
    // Afficher le numéro du 1er opérateur configuré par défaut
    setTimeout(function() {
      var sel = modal.box.querySelector('#decl-mode');
      if (sel) window.IG.portail._afficherNumeroMomo(sel.value);
    }, 50);
  }

  function _afficherNumeroMomo(mode) {
    var data = window.IG.app ? window.IG.app.getData() : {};
    var momo = (data.settings && data.settings.momo_numeros) || {};
    var numero = momo[mode] || '';
    var bloc = document.getElementById('decl-momo-numero');
    var val  = document.getElementById('decl-momo-num-val');
    if (!bloc) return;
    if (numero) {
      val.textContent = numero;
      bloc.style.display = 'block';
    } else {
      bloc.style.display = 'none';
    }
  }

  return { renderPage, declarerPaiement, _afficherNumeroMomo };

})();
