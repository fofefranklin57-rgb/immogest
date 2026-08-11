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

  function _docIdentity(params, session) {
    var nom = params.nom_cabinet || params.nom || session.nomCabinet || session.nom || t('Cabinet');
    var sigle = params.sigle || nom.replace(/[^A-Za-z]/g,'').substring(0,4).toUpperCase() || 'IG';
    var mention = params.mention || '';
    var tel = params.telephone || params.tel || session.telephone || '';
    var tel2 = params.tel2 || '';
    return {
      nom: nom,
      sigle: sigle,
      mention: mention,
      adresse: params.adresse || '',
      ville: params.ville || '',
      tel: tel,
      tel2: tel2,
      email: params.email || '',
      rccm: params.rccm || '',
      contribuable: params.contribuable || '',
      fiscal: params.fiscal || '',
      logo: params.logo_url || params.logo || '',
      signataire: params.signataire || nom
    };
  }

  // ── Reste dû sur le mois de clôture, vu par la fiche de suivi ──
  // Source unique de vérité pour « qui doit quoi » : la fiche consomme les
  // versements dans l'ordre chronologique, donc un règlement de juillet qui
  // couvre août est correctement imputé à août. Retourne null si la fiche
  // n'est pas calculable (module absent, pas de date d'entrée) — l'appelant
  // se replie alors sur l'ancien calcul.
  function _resteMoisFiche(loc, versementsLoc, dateFin) {
    if (!window.IG.paiements || !window.IG.paiements.calculerFiche || !loc || !loc.entree) return null;
    var lignes = window.IG.paiements.calculerFiche(loc, versementsLoc, dateFin.getFullYear());
    if (!lignes || !lignes.length) return null;
    var moisCible  = dateFin.getMonth() + 1;
    var anneeCible = dateFin.getFullYear();
    var ligne = lignes.filter(function(l) { return l.mois === moisCible && l.annee === anneeCible; })[0];
    if (!ligne) return null;
    return ligne.horsBail ? 0 : (parseFloat(ligne.reste) || 0);
  }

  // ── Mois dus à la date de clôture du rapport ──────────────────
  // `relances.calculerRetard()` compte les impayés à AUJOURD'HUI. Sur un
  // rapport édité en août mais portant sur juillet, il annonçait « 1 mois dû »
  // en face d'un « reste à payer » nul — le document se contredisait.
  // Ici on compte les mois non soldés jusqu'au mois de clôture inclus, pour
  // que toute la ligne parle de la même date.
  function _moisDusAuFiche(loc, versementsLoc, dateFin) {
    if (!window.IG.paiements || !window.IG.paiements.calculerFiche || !loc || !loc.entree) return null;
    var lignes = window.IG.paiements.calculerFiche(loc, versementsLoc, dateFin.getFullYear());
    if (!lignes || !lignes.length) return null;
    var moisFin = dateFin.getMonth() + 1, anneeFin = dateFin.getFullYear();
    return lignes.filter(function(l) {
      if (l.horsBail || l.futur) return false;
      if (l.annee > anneeFin || (l.annee === anneeFin && l.mois > moisFin)) return false;
      return (l.reste || 0) > 0;
    }).length;
  }

  // ── Rapport mensuel HTML — spec V2 (juin 2026) ──────────────
  function genererRapportMensuelHTML(immeubleId, dateDebut, dateFin, immeubles, locataires, paiements, filtreLoc) {
    var session  = window.IG.auth ? window.IG.auth.getSession() : {};
    var params   = session.parametres || {};
    var typeProfil = session.type_profil || 'gestionnaire';
    var isCab    = (typeProfil === 'gestionnaire' || typeProfil === 'cabinet');
    var devise   = (window.IG._locale && window.IG._locale.devise) || 'FCFA';

    var imm = immeubles.filter(function(i) { return i.id == immeubleId; })[0];
    if (!imm) return '<p style="padding:20px;color:var(--text3)">' + t('Sélectionnez un immeuble.') + '</p>';

    var docInfo = _docIdentity(params, session);
    var nomCab  = docInfo.nom;
    var adresse = docInfo.adresse;
    var tel     = docInfo.tel;
    var ville   = docInfo.ville || imm.ville || '';
    var nomImm  = imm.nom_immeuble || imm.nom || '';
    var quartier= imm.quartier || '';

    var debut = new Date(dateDebut);
    var fin   = new Date(dateFin);

    var MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

    var cabAbbr    = docInfo.sigle;
    var refDoc     = cabAbbr + '/RM/' + fin.getFullYear() + '/' + (quartier || nomImm).replace(/\s+/g,'');
    var dateDoc    = (ville ? ville + ', ' : '') + 'le ' + fin.getDate() + ' ' + MOIS_FR[fin.getMonth()] + ' ' + fin.getFullYear();
    var fmtDebut   = _fmtD(dateDebut);
    var fmtFin     = _fmtD(dateFin);
    var periodeEncL= debut.getDate() + ' ' + MOIS_FR[debut.getMonth()].toUpperCase() + ' AU ' + fin.getDate() + ' ' + MOIS_FR[fin.getMonth()].toUpperCase() + ' ' + fin.getFullYear();

    var locsImm = locataires.filter(function(l) {
      return l.immeuble_id == immeubleId && l.statut !== 'libre';
    });

    // Filtre optionnel : mois dus (seuil) ou locataires ayant payé d'avance.
    // Réutilise le calcul officiel (relances/calculerFiche) pour rester
    // cohérent avec les badges et le filtre de la page Locataires.
    if (filtreLoc) {
      locsImm = locsImm.filter(function(l) {
        var pl = paiements.filter(function(p) { return p.locataire_id == l.id; });
        if (filtreLoc === 'avance') {
          if (!window.IG.paiements || !l.entree) return false;
          return window.IG.paiements.calculerFiche(l, pl).some(function(lg) { return lg.statut === 'Payé (avance)'; });
        }
        var seuil = parseInt(filtreLoc) || 0;
        var retard = window.IG.relances ? window.IG.relances.calculerRetard(l, pl) : 0;
        return retard >= seuil;
      });
    }
    var locIds = locsImm.map(function(l) { return l.id; });
    var paysP  = paiements.filter(function(p) {
      if (locIds.indexOf(parseInt(p.locataire_id)) < 0 && locIds.indexOf(p.locataire_id) < 0) return false;
      if (!p.date_paiement) return false;
      var d = new Date(p.date_paiement);
      return d >= debut && d <= fin;
    }).sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });

    // ── Charte du rapport, calquée sur le modèle Word CRAA ────────
    // Grille fine sur toutes les cellules, alternance de lignes bleutée,
    // codes couleur porteurs de sens : bleu = repère (local, totaux),
    // vert = encaissé / à jour, rouge = dû.
    var C_BLEU = '#0E6AAF', C_BLEU_PALE = '#EEF6FC', C_BLEU_TOTAL = '#D6E9F6';
    var C_VERT = '#1A6B45', C_ROUGE = '#C0392B';
    var C_TEXTE = '#333333', C_GRIS = '#666666', C_TRAIT = '#7f7f7f';

    var TH = 'padding:5px 7px;background:' + C_BLEU + ';color:#fff;font-size:9pt;font-weight:700;' +
             'border:1px solid ' + C_TRAIT + ';text-transform:uppercase;';
    var TD = 'padding:4px 7px;border:1px solid ' + C_TRAIT + ';font-size:9pt;vertical-align:middle;';

    // Fond alterné : une ligne sur deux en bleu très pâle
    function _bg(i) { return 'background:' + (i % 2 ? C_BLEU_PALE : '#FFFFFF') + ';'; }
    // Cellule « code du local » : bleu, gras, centré — le repère visuel du tableau
    function _tdLocal(i, v) {
      return '<td style="' + TD + _bg(i) + 'text-align:center;font-weight:700;color:' + C_BLEU + '">' + v + '</td>';
    }

    // ── Section 1 : locataires ───────────────────────────────────
    var totalResteS1 = 0;
    var s1Rows = '';
    locsImm.forEach(function(loc, i) {
      var loyer = parseFloat(loc.loyer) || 0;
      var lPays = paysP.filter(function(p) {
        return (parseInt(p.locataire_id) == parseInt(loc.id) || p.locataire_id == loc.id) &&
               (p.type || 'loyer') !== 'caution';
      });
      // Continuité : le dernier versement affiché est le dernier versement
      // RÉEL du locataire, même s'il date d'avant la période du rapport.
      var lPaysAll = paiements.filter(function(p) {
        return (parseInt(p.locataire_id) == parseInt(loc.id) || p.locataire_id == loc.id) &&
               (p.type || 'loyer') !== 'caution' && p.date_paiement;
      }).sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); });

      var dernierPay = lPaysAll.length ? lPaysAll[lPaysAll.length - 1] : null;
      var horsPeriode = dernierPay && (new Date(dernierPay.date_paiement) < debut || new Date(dernierPay.date_paiement) > fin);
      var dernierStr = dernierPay
        ? '<strong>' + _fmtD(dernierPay.date_paiement) + '</strong>' +
          '<br><span style="color:' + C_GRIS + '">' + fmt(dernierPay.montant) + '</span>' +
          (horsPeriode ? '<br><span style="font-size:8pt;color:#999">(' + t('hors période') + ')</span>' : '')
        : '—';
      // Reste à payer pour le mois du rapport : on réutilise l'allocation
      // officielle de la fiche de suivi (consommation chronologique des
      // versements, avances comprises) au lieu de sommer les versements
      // tombant dans la fenêtre du rapport. Un locataire qui a réglé août
      // par un versement de juillet est à jour — la fenêtre seule le
      // déclarait à tort débiteur.
      var reste = _resteMoisFiche(loc, lPaysAll, fin);
      if (reste === null) {
        var totalPaye = lPays.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
        reste = Math.max(0, loyer - totalPaye);
      }
      totalResteS1 += reste;

      var obs = [];
      // Nombre de mois dus à la clôture + action recommandée
      var moisDus = _moisDusAuFiche(loc, lPaysAll, fin);
      if (moisDus === null) moisDus = window.IG.relances ? window.IG.relances.calculerRetard(loc, lPaysAll) : 0;
      if (moisDus > 0) {
        var reco = moisDus >= 7 ? t('à expulser')
                 : moisDus >= 4 ? t('à sommer')
                 : moisDus >= 2 ? t('à surveiller')
                 : t('à relancer');
        var recoCouleur = moisDus >= 7 ? '#8E1B10' : moisDus >= 4 ? '#B34700' : moisDus >= 2 ? '#8A6100' : C_ROUGE;
        obs.push('<strong style="color:' + recoCouleur + '">' + moisDus + ' ' + t('mois dû(s)') + ' — ' + reco + '</strong>');
      }
      if (isCab) {
        var remisLoc = lPays.filter(function(p) { return p.remisAuBailleur; });
        if (remisLoc.length) obs.push(fmt(remisLoc.reduce(function(s,p){return s+(parseFloat(p.montant)||0);},0)) + ' remis au bailleur');
      }
      var notesTous  = lPays.filter(function(p){ return p.note; });
      var notesSplit = notesTous.filter(function(p){ return /\[\d+\/\d+\]/.test(p.note); });
      var notesAutres = notesTous.filter(function(p){ return !/\[\d+\/\d+\]/.test(p.note); }).map(function(p){ return p.note; });
      if (notesSplit.length) {
        var totalSplit = notesSplit.reduce(function(s,p){ return s + (parseFloat(p.montant) || 0); }, 0);
        obs.push(notesSplit.length + ' mois payés d\'avance (' + fmt(totalSplit) + ')');
      }
      if (notesAutres.length) obs = obs.concat(notesAutres);
      if (!obs.length) obs.push(reste <= 0 ? t('À jour') : t('Doit') + ' ' + MOIS_FR[fin.getMonth()]);

      // La couleur de l'observation porte le verdict : vert si le mois est
      // soldé, rouge s'il reste dû. Le lecteur balaie la colonne, pas le texte.
      var obsCouleur = reste > 0 ? C_ROUGE : C_VERT;

      s1Rows += '<tr>' +
        _tdLocal(i, esc(loc.appt || '—')) +
        '<td style="'+TD+_bg(i)+'font-size:9.5pt;font-weight:700;color:'+C_TEXTE+'">'+esc(loc.nom)+
          (loc.telephone?'<br><span style="font-size:8pt;font-weight:400;color:#888">'+esc(loc.telephone)+'</span>':'')+'</td>' +
        '<td style="'+TD+_bg(i)+'text-align:right;color:'+C_TEXTE+'">'+fmt(loyer)+'</td>' +
        '<td style="'+TD+_bg(i)+'color:'+C_TEXTE+'">'+dernierStr+'</td>' +
        '<td style="'+TD+_bg(i)+'font-size:8.5pt;font-style:italic;color:'+obsCouleur+'">'+obs.join('<br>')+'</td>' +
        '<td style="'+TD+_bg(i)+'text-align:right;font-weight:700;color:'+(reste>0?C_ROUGE:C_VERT)+'">'+(reste>0?fmt(reste):'–')+'</td>' +
      '</tr>';
    });
    s1Rows += '<tr>' +
      '<td style="'+TD+'background:'+C_BLEU_TOTAL+';text-align:right;font-size:9.5pt;font-weight:700;color:'+C_BLEU+'" colspan="5">' + t('TOTAL') + '</td>' +
      '<td style="'+TD+'background:'+C_BLEU_TOTAL+';text-align:right;font-size:9.5pt;font-weight:700;color:'+(totalResteS1>0?C_ROUGE:C_BLEU)+'">'+fmt(totalResteS1)+'</td>' +
    '</tr>';

    // ── Section 2 : encaissements ────────────────────────────────
    // Un paiement multi-mois (ex: 10 mois payés d'avance en un seul versement)
    // cree une ligne par mois couvert avec la meme date_paiement — on les
    // regroupe ici en un seul versement reel pour ne pas donner l'impression
    // de doublons.
    var totalLoyers = 0, totalCautions = 0, totalRemis = 0;
    var groupes2 = [];
    var indexGroupe = {};
    paysP.forEach(function(p) {
      var estSplit = /\[\d+\/\d+\]/.test(p.note || '');
      var cle = p.locataire_id + '|' + p.date_paiement + '|' + (p.type || 'loyer') + (estSplit ? '' : '|' + p.id);
      if (!indexGroupe.hasOwnProperty(cle)) {
        indexGroupe[cle] = groupes2.length;
        groupes2.push({ p0: p, montant: 0, mois: [], remis: p.remisAuBailleur });
      }
      var g = groupes2[indexGroupe[cle]];
      g.montant += parseFloat(p.montant) || 0;
      if (p.mois && p.annee) g.mois.push(MOIS_FR[p.mois - 1] + ' ' + p.annee);
      var montant = parseFloat(p.montant) || 0;
      var typeP = (p.type || 'loyer').toLowerCase();
      if (typeP === 'caution') totalCautions += montant; else totalLoyers += montant;
      if (p.remisAuBailleur && isCab) totalRemis += montant;
    });

    var s2Rows = '';
    groupes2.forEach(function(g, i) {
      var p = g.p0;
      var loc = locsImm.filter(function(l){ return parseInt(l.id) == parseInt(p.locataire_id); })[0] || {};
      var typeP = (p.type || 'loyer').toLowerCase();
      var noteCell = (g.mois.length <= 1 && p.note && !/\[\d+\/\d+\]/.test(p.note)) ? esc(p.note) : (typeP === 'caution' ? t('Caution') : typeP === 'avance' ? t('Avance') : t('Loyer'));
      if (g.mois.length > 1) {
        noteCell += '<br><span style="font-size:9.5px;color:#888">' + g.mois.length + ' ' + t('mois') + ' : ' + esc(g.mois[0]) + ' → ' + esc(g.mois[g.mois.length - 1]) + '</span>';
      } else if (g.mois.length === 1) {
        noteCell += '<br><span style="font-size:9.5px;color:#888">' + t('mois') + ' : ' + esc(g.mois[0]) + '</span>';
      }
      s2Rows += '<tr>' +
        '<td style="'+TD+_bg(i)+'text-align:center;color:'+C_GRIS+'">'+_fmtD(p.date_paiement)+'</td>' +
        _tdLocal(i, esc(loc.appt || '—')) +
        '<td style="'+TD+_bg(i)+'font-size:9.5pt;font-weight:700;color:'+C_TEXTE+'">'+esc(loc.nom||'—')+'</td>' +
        '<td style="'+TD+_bg(i)+'font-size:8.5pt;font-style:italic;color:'+C_GRIS+'">'+noteCell+'</td>' +
        '<td style="'+TD+_bg(i)+'text-align:right;font-weight:700;color:'+C_VERT+'">'+fmt(g.montant)+'</td>' +
      '</tr>';
    });
    if (!paysP.length) {
      s2Rows = '<tr><td colspan="5" style="'+TD+'padding:14px;text-align:center;color:#999;font-style:italic">' + t('Aucun encaissement dans cette période') + '</td></tr>';
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

    // Le récapitulatif prolonge le tableau des encaissements au lieu de
    // former un bloc séparé : les sous-totaux restent alignés sous la
    // colonne des montants qu'ils additionnent (conforme au modèle Word).
    function _rl(lbl, val, opts) {
      var o = opts || {};
      var valStr = (o.neg ? '– ' : '') + fmt(val);
      return '<tr>' +
        '<td colspan="4" style="'+TD+'background:#F5F5F5;text-align:right;font-size:8.5pt;font-style:italic;color:'+C_GRIS+';'+
          (o.bold ? 'font-weight:700;' : '')+'">'+lbl+'</td>' +
        '<td style="'+TD+'background:#F5F5F5;text-align:right;font-size:8.5pt;font-weight:700;color:'+(o.color||C_TEXTE)+'">'+valStr+'</td>' +
      '</tr>';
    }
    function _rlFinal(lbl, val) {
      return '<tr>' +
        '<td colspan="4" style="'+TD+'background:'+C_BLEU_TOTAL+';text-align:right;font-size:9.5pt;font-weight:700;color:'+C_BLEU+'">'+lbl+'</td>' +
        '<td style="'+TD+'background:'+C_BLEU_TOTAL+';text-align:right;font-size:9.5pt;font-weight:700;color:'+C_BLEU+'">'+fmt(val)+'</td>' +
      '</tr>';
    }

    var recapRows = _rl(t('Loyers encaissés'), totalLoyers) +
      _rl(t('Cautions reçues'), totalCautions) +
      _rl(t('TOTAL LOYER'), totalBrut, { bold: true });
    if (isCab) {
      if (totalRemis) recapRows += _rl(t('Loyer reçu par le bailleur'), totalRemis, { neg: true, color: C_ROUGE });
      if (honoraires) recapRows += _rl(t('Paiement cabinet (honoraires)'), honoraires, { neg: true, color: C_ROUGE });
      recapRows += _rlFinal(t('NET À VERSER AU BAILLEUR'), netAPer);
    } else {
      recapRows += _rlFinal(t('NET ENCAISSÉ'), totalBrut);
    }

    var montantPhrase = isCab ? netAPer : totalBrut;
    var lettres       = _enLettres(Math.abs(montantPhrase));
    var nomProprio    = imm.nom_proprio || '';
    var docLegalLine = [
      docInfo.mention || nomCab,
      docInfo.sigle && docInfo.sigle !== nomCab ? docInfo.sigle : '',
      docInfo.rccm ? 'RCCM N° ' + docInfo.rccm : '',
      docInfo.contribuable ? 'N°Contrib. ' + docInfo.contribuable : '',
      docInfo.fiscal && !docInfo.rccm ? docInfo.fiscal : ''
    ].filter(Boolean).join(' · ');
    var docContactLine = [
      [docInfo.tel, docInfo.tel2].filter(Boolean).join(' / '),
      docInfo.email
    ].filter(Boolean).join(' / ');
    var logoCell = docInfo.logo
      ? '<img src="' + esc(docInfo.logo) + '" alt="Logo" style="max-width:82px;max-height:54px;object-fit:contain">'
      : '<div style="width:54px;height:54px;border:1px solid #d8d8d8;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#0E6AAF">' + esc(docInfo.sigle) + '</div>';

    // ── Assemblage ───────────────────────────────────────────────
    var html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:760px;margin:0 auto;color:#111">';

    // En-tête inspiré du modèle Word CRAA : logo, identité légale, contacts.
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:8px;border-bottom:3px solid #0E6AAF"><tr>' +
      '<td style="vertical-align:middle;width:16%;padding:0 8px 8px 0">' + logoCell + '</td>' +
      '<td style="vertical-align:middle;width:52%;padding:0 8px 8px 0">' +
      '<div style="font-size:12px;font-weight:900;color:#0E6AAF;text-transform:uppercase">'+esc(nomCab)+'</div>' +
      '<div style="font-size:9.5px;color:#333;line-height:1.35">'+esc(docLegalLine || nomCab)+'</div>' +
      (adresse ? '<div style="font-size:9px;color:#555;line-height:1.35">'+esc(adresse)+'</div>' : '') +
      '</td><td style="vertical-align:middle;text-align:right;width:32%;padding:0 0 8px 8px">' +
      (docContactLine ? '<div style="font-size:9px;color:#333;line-height:1.35">'+esc(docContactLine)+'</div>' : '') +
      '<div style="font-size:9px;color:#777;margin-top:3px">'+esc(dateDoc)+'</div>' +
      '<div style="font-size:8.5px;color:#888;font-style:italic">Réf : '+esc(refDoc)+'</div>' +
      '</td></tr></table>';

    // Titre centré
    html += '<div style="text-align:center;margin-bottom:14px">' +
      '<div style="font-size:13pt;font-weight:700;text-transform:uppercase;color:'+C_BLEU+';letter-spacing:0.3px">' + esc(t('Rapport mensuel').toUpperCase()) + ' – ' + esc(t('Immeuble').toUpperCase()) + ' ' + esc(nomImm.toUpperCase()) + '</div>' +
      '<div style="color:'+C_GRIS+';font-size:10pt;margin-top:3px">'+esc(quartier||nomImm)+'  ·  '+t('du')+' '+fmtDebut+'  ·  '+t('Au')+' '+fmtFin+'</div>' +
      '</div>';

    // Bandeau de section pleine largeur, comme dans le modèle Word
    function _bandeau(titre, suffixe) {
      return '<div style="background:'+C_BLEU+';color:#fff;font-size:11pt;font-weight:700;text-transform:uppercase;' +
        'padding:5px 9px;margin-bottom:0">' + titre +
        (suffixe ? ' <span style="font-weight:400;text-transform:none;font-size:9pt;opacity:.9">' + suffixe + '</span>' : '') +
        '</div>';
    }
    var TBL = 'width:100%;border-collapse:collapse;margin-bottom:16px;table-layout:fixed;';

    // Section 1 — situation locative
    var libelleFiltre = filtreLoc
      ? (filtreLoc === 'avance' ? t('locataires ayant payé d\'avance') : filtreLoc + ' ' + t('mois dus et +'))
      : '';
    html += _bandeau(t('LISTE DES LOCATAIRES ET SITUATION LOCATIVE'),
        libelleFiltre ? '— ' + t('filtre') + ' : ' + esc(libelleFiltre) + ' (' + locsImm.length + ')' : '') +
      '<table style="'+TBL+'">' +
      '<colgroup><col style="width:7%"><col style="width:26%"><col style="width:11%">' +
      '<col style="width:18%"><col style="width:23%"><col style="width:15%"></colgroup>' +
      '<thead><tr>' +
      '<th style="'+TH+'text-align:center">' + t('Local') + '</th>' +
      '<th style="'+TH+'text-align:left">' + t('Nom & Téléphone') + '</th>' +
      '<th style="'+TH+'text-align:right">' + t('Loyer') + '</th>' +
      '<th style="'+TH+'text-align:center">' + t('Dernier paiement') + '</th>' +
      '<th style="'+TH+'text-align:left">' + t('Observations') + '</th>' +
      '<th style="'+TH+'text-align:right">' + t('Reste à payer') + '</th>' +
      '</tr></thead><tbody>'+s1Rows+'</tbody></table>';

    // Section 2 — encaissements, récapitulatif financier inclus en pied
    html += _bandeau(t('ENCAISSEMENTS') + ' – ' + esc(periodeEncL)) +
      '<table style="'+TBL+'">' +
      '<colgroup><col style="width:14%"><col style="width:9%"><col style="width:36%">' +
      '<col style="width:23%"><col style="width:18%"></colgroup>' +
      '<thead><tr>' +
      '<th style="'+TH+'text-align:center">' + t('Date') + '</th>' +
      '<th style="'+TH+'text-align:center">' + t('Local') + '</th>' +
      '<th style="'+TH+'text-align:left">' + t('Locataire') + '</th>' +
      '<th style="'+TH+'text-align:left">' + t('Note') + '</th>' +
      '<th style="'+TH+'text-align:right">' + t('Montant') + '</th>' +
      '</tr></thead><tbody>'+s2Rows+recapRows+'</tbody></table>';

    // Arrêté en lettres
    html += '<div style="font-size:9.5pt;color:'+C_TEXTE+';font-style:italic;margin-bottom:18px;line-height:1.5">' +
      t('Soit') + ' : '+esc(lettres)+' ' + t('nets à percevoir au titre des loyers de') + ' '+MOIS_FR[fin.getMonth()]+' '+fin.getFullYear()+'.' +
      '</div>';

    // Signatures — tableau à deux volets, comme le pied du modèle Word
    var SIG = TD + 'padding:9px 10px;font-size:9pt;color:'+C_BLEU+';font-weight:700;font-style:italic;';
    html += '<table style="width:100%;border-collapse:collapse;margin-bottom:10px"><tr>' +
      '<td style="'+SIG+'width:38%">' + t('Le Gestionnaire') +
        '<br><span style="font-style:normal;color:'+C_TEXTE+'">'+esc(docInfo.signataire || docInfo.sigle || nomCab)+'</span>' +
        '<div style="height:34px"></div>' + t('Signature & Cachet') + ' :</td>' +
      '<td style="'+SIG+'">' + t('Lu et approuvé - Le Propriétaire') +
        '<br><span style="font-style:normal;color:'+C_TEXTE+'">'+esc(nomProprio||nomImm)+'</span>' +
        '<div style="height:34px"></div>' + t('Signature') + ' :</td>' +
      '</tr></table>';

    // Pied de page : adresse du cabinet et bailleur, comme le footer du modèle
    var piedLigne = [adresse, nomProprio].filter(Boolean).join('  ·  ');
    html += '<div style="text-align:center;color:'+C_GRIS+';font-size:8pt;margin-top:12px;border-top:1px solid '+C_BLEU+';padding-top:6px">' +
      (piedLigne ? esc(piedLigne) + '<br>' : '') +
      '<span style="color:#aaa">' + t('Document généré le') + ' '+_fmtD(new Date().toISOString().slice(0,10))+' ' + t('par') + ' ImmoGest · '+esc(docInfo.sigle || nomCab)+'</span></div>';
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
      '<div><label style="font-size:11px;font-weight:600;color:var(--text2)">' + t('Immeuble').toUpperCase() + '</label>' +
      '<select id="rapport-imm" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      (immOptions || '<option value="">—</option>') + '</select></div>' +

      '<div><label style="font-size:11px;font-weight:600;color:var(--text2)">' + t('Début').toUpperCase() + '</label>' +
      '<input id="rapport-debut" type="date" value="' + _iso(defDebut) + '" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +

      '<div><label style="font-size:11px;font-weight:600;color:var(--text2)">' + t('Fin').toUpperCase() + '</label>' +
      '<input id="rapport-fin" type="date" value="' + _iso(defFin) + '" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '</div>' +

      '<div style="margin-bottom:8px">' +
      '<label style="font-size:11px;font-weight:600;color:var(--text2)">' + t('Filtrer les locataires').toUpperCase() + '</label>' +
      '<select id="rapport-filtre" style="width:100%;margin-top:4px;padding:7px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '<option value="">' + t('Tous les locataires') + '</option>' +
      '<option value="1">🟡 ' + t('1 mois dû et +') + '</option>' +
      '<option value="2">🟠 ' + t('2 mois dus et +') + '</option>' +
      '<option value="4">🔴 ' + t('4 mois dus et +') + '</option>' +
      '<option value="7">⛔ ' + t('7 mois dus et + (à expulser)') + '</option>' +
      '<option value="avance">✅ ' + t('Ayant payé d\'avance') + '</option>' +
      '</select></div>' +

      '<div style="margin-bottom:12px;display:flex;gap:8px">' +
      '<button id="btn-mois-courant" style="padding:5px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--bg3);font-size:11px;cursor:pointer">' + t('Mois courant') + '</button>' +
      '<button id="btn-mois-prec" style="padding:5px 12px;border-radius:20px;border:1px solid var(--border2);background:var(--bg3);font-size:11px;cursor:pointer">' + t('Mois précédent') + '</button>' +
      '<button id="btn-generer-rapport" style="padding:5px 20px;border-radius:20px;border:none;background:var(--accent);color:#fff;font-size:12px;font-weight:700;cursor:pointer;margin-left:auto">▶ ' + t('Générer') + '</button>' +
      '</div>' +

      '<div id="rapport-contenu"></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Fermer') + '</button>' +
      '<button id="btn-word-rapport" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:13px;display:none">📄 ' + t('Télécharger') + ' DOCX</button>' +
      '<button id="btn-imprimer-rapport" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);cursor:pointer;font-size:13px;display:none">🖨️ ' + t('Imprimer') + '</button>' +
      '<button id="btn-wa-rapport" style="padding:8px 16px;border-radius:8px;border:none;background:#25D366;color:#fff;cursor:pointer;font-size:13px;font-weight:600;display:none">📱 ' + t('Envoyer au bailleur') + '</button>' +
      '</div>';

    var modal = window.IG.utils.showModal(html, { width: '820px' });

    var _lastHtml = '';

    function generer() {
      var immId = modal.box.querySelector('#rapport-imm').value;
      var debut = modal.box.querySelector('#rapport-debut').value;
      var fin   = modal.box.querySelector('#rapport-fin').value;
      if (!immId) {
        modal.box.querySelector('#rapport-contenu').innerHTML = '<p style="padding:20px;text-align:center;color:var(--text3)">' + t('Sélectionnez un immeuble.') + '</p>';
        return;
      }
      var filtre = (modal.box.querySelector('#rapport-filtre') || {}).value || '';
      try {
        _lastHtml = genererRapportMensuelHTML(immId, debut, fin, imm, loc, pay, filtre);
        modal.box.querySelector('#rapport-contenu').innerHTML = _lastHtml;
        modal.box.querySelector('#btn-imprimer-rapport').style.display = 'inline-block';
        modal.box.querySelector('#btn-word-rapport').style.display = 'inline-block';
        var immSel = imm.filter(function(i) { return i.id == immId; })[0] || {};
        modal.box.querySelector('#btn-wa-rapport').style.display = immSel.tel_proprio ? 'inline-block' : 'none';
      } catch(e) {
        // Ne jamais échouer en silence : afficher l'erreur dans le modal
        console.error('Rapport mensuel:', e);
        modal.box.querySelector('#rapport-contenu').innerHTML =
          '<p style="padding:20px;text-align:center;color:var(--red)">' + t('Erreur lors de la génération du rapport') + ' : ' + esc(e.message) + '</p>';
        window.IG.utils.showToast(t('Erreur rapport') + ' : ' + e.message, 'red');
      }
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
      var titre  = t('Rapport') + ' — ' + (immSel.nom_immeuble || immSel.nom || t('Immeuble'));
      w.document.write('<html><head><title>' + titre + '</title>' +
        '<style>*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:24px;color:#111;margin:0}' +
        'table{width:100%;border-collapse:collapse}@media print{.no-print{display:none}}</style></head>' +
        '<body>' + _lastHtml + '</body></html>');
      w.document.close();
      w.focus();
    });

    modal.box.querySelector('#btn-word-rapport').addEventListener('click', function() {
      if (!_lastHtml) generer();
      var immSelW = imm.filter(function(i) { return i.id == modal.box.querySelector('#rapport-imm').value; })[0] || {};
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      var titreDoc = (session.nomCabinet || 'ImmoGest') + ' — ' + t('Rapport mensuel') +
        (immSelW.nom_immeuble || immSelW.nom ? ' — ' + (immSelW.nom_immeuble || immSelW.nom) : '');
      exporterRapportMensuelDocx(_lastHtml, titreDoc);
    });

    modal.box.querySelector('#btn-wa-rapport').addEventListener('click', function() {
      var immSel = imm.filter(function(i) { return i.id == modal.box.querySelector('#rapport-imm').value; })[0] || {};
      envoyerRapportWhatsApp(_lastHtml, immSel);
    });

    // Générer automatiquement si un immeuble est présélectionné
    if (immeubleIdPreselect && immOptions) generer();
  }

  // ── Export Word conservant la mise en page HTML du rapport ───
  function _creerBlobDocx(htmlContent) {
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var title = (session.nomCabinet || 'ImmoGest') + ' - ' + t('Rapport mensuel');
    var wordHtml = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<title>' + esc(title) + '</title>' +
      '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111}table{border-collapse:collapse}img{max-width:100%}</style>' +
      '</head><body>' + htmlContent + '</body></html>';
    var blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
    return { blob: blob, filename: 'rapport-immogest-' + Date.now() + '.doc' };
  }

  // Téléchargement fiable : certains navigateurs (mobile notamment)
  // ignorent un link.click() si le lien n'est pas attaché au document.
  function _telechargerBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(function() {
      URL.revokeObjectURL(url);
      if (link.parentNode) link.parentNode.removeChild(link);
    }, 2000);
  }

  // Vrai fichier .docx à partir du rapport affiché (réutilise la
  // bibliothèque docx déjà chargée pour le rapport annuel). On relit
  // les tableaux du HTML généré : le DOCX reflète exactement l'écran.
  function exporterRapportMensuelDocx(htmlContent, titreDoc) {
    if (typeof docx === 'undefined') { exporterDocx(htmlContent); return; }
    try {
      var session = window.IG.auth ? window.IG.auth.getSession() : {};
      var docHtml = new DOMParser().parseFromString(htmlContent, 'text/html');
      var children = [
        new docx.Paragraph({ text: titreDoc || ((session.nomCabinet || 'ImmoGest') + ' — ' + t('Rapport mensuel')), heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: t('Généré le') + ' ' + new Date().toLocaleDateString('fr-FR') }),
        new docx.Paragraph({ text: '' })
      ];

      // Ne garder que les tableaux de premier niveau : un tableau imbriqué
      // serait sinon exporté deux fois (et son contenu dupliqué).
      var tables = Array.prototype.filter.call(docHtml.body.querySelectorAll('table'), function(tbl) {
        return !(tbl.parentElement && tbl.parentElement.closest('table'));
      });

      tables.forEach(function(tbl) {
        // 1re passe : extraire le texte et les colspan, ligne par ligne
        var brut = [];
        Array.prototype.forEach.call(tbl.querySelectorAll('tr'), function(tr) {
          var ligne = [];
          Array.prototype.forEach.call(tr.children, function(td) {
            if (td.tagName !== 'TD' && td.tagName !== 'TH') return;
            ligne.push({
              texte: (td.textContent || '').replace(/\s+/g, ' ').trim(),
              span:  Math.max(1, parseInt(td.getAttribute('colspan')) || 1)
            });
          });
          if (ligne.length) brut.push(ligne);
        });
        if (!brut.length) return;

        // Word refuse une grille irrégulière : toutes les lignes doivent
        // totaliser le même nombre de colonnes.
        var nbCols = brut.reduce(function(max, ligne) {
          var total = ligne.reduce(function(s, c) { return s + c.span; }, 0);
          return Math.max(max, total);
        }, 0);
        if (!nbCols) return;

        var rows = brut.map(function(ligne) {
          var cells = ligne.map(function(c) {
            var opts = { children: [new docx.Paragraph({ text: c.texte })] };
            if (c.span > 1) opts.columnSpan = c.span;
            return new docx.TableCell(opts);
          });
          // Compléter la ligne si elle est plus courte que la grille
          var total = ligne.reduce(function(s, c) { return s + c.span; }, 0);
          for (var k = total; k < nbCols; k++) {
            cells.push(new docx.TableCell({ children: [new docx.Paragraph({ text: '' })] }));
          }
          return new docx.TableRow({ children: cells });
        });

        var largeurCol = Math.floor(9360 / nbCols); // largeur page utile en twips
        var tableOpts = { rows: rows, columnWidths: new Array(nbCols).fill(largeurCol) };
        if (docx.WidthType && docx.WidthType.PERCENTAGE) {
          tableOpts.width = { size: 100, type: docx.WidthType.PERCENTAGE };
        }
        children.push(new docx.Table(tableOpts));
        children.push(new docx.Paragraph({ text: '' }));
      });

      docx.Packer.toBlob(new docx.Document({ sections: [{ children: children }] })).then(function(blob) {
        _telechargerBlob(blob, 'rapport-immogest-' + Date.now() + '.docx');
        window.IG.utils.showToast(t('Rapport DOCX téléchargé') + ' ✓', 'green');
      }).catch(function(e) {
        window.IG.utils.showToast(t('Erreur DOCX') + ': ' + e.message, 'red');
      });
    } catch(e) {
      window.IG.utils.showToast(t('Erreur DOCX') + ': ' + e.message, 'red');
    }
  }

  function exporterDocx(htmlContent) {
    try {
      var f = _creerBlobDocx(htmlContent);
      _telechargerBlob(f.blob, f.filename);
      window.IG.utils.showToast(t('Rapport téléchargé') + ' ✓', 'green');
    } catch(e) {
      window.IG.utils.showToast(t('Erreur export DOCX') + ': ' + e.message, 'red');
    }
  }

  // \u2500\u2500 Envoi direct du rapport au bailleur par WhatsApp \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Utilise le partage natif (Web Share API + fichier) si disponible :
  // ouvre le s\u00e9lecteur d'apps avec le rapport d\u00e9j\u00e0 joint, sans passer
  // par un t\u00e9l\u00e9chargement manuel pr\u00e9alable. Sinon, replie sur un lien
  // wa.me pr\u00e9-rempli + t\u00e9l\u00e9chargement du fichier \u00e0 joindre \u00e0 la main.
  async function envoyerRapportWhatsApp(htmlContent, immeuble) {
    if (!htmlContent) { window.IG.utils.showToast(t('G\u00e9n\u00e9rez d\'abord le rapport'), 'orange'); return; }
    var tel = (immeuble && immeuble.tel_proprio) || '';
    if (!tel) { window.IG.utils.showToast(t('Aucun num\u00e9ro de bailleur enregistr\u00e9 pour cet immeuble'), 'orange'); return; }

    var f = _creerBlobDocx(htmlContent);
    var nomImm = immeuble.nom_immeuble || immeuble.nom || '';
    var texte = t('Rapport') + ' \u2014 ' + nomImm;

    var partageOk = false;
    if (navigator.share) {
      try {
        var file = new File([f.blob], f.filename, { type: 'application/msword' });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: texte, text: texte });
          partageOk = true;
        }
      } catch(e) {
        if (e && e.name === 'AbortError') { partageOk = true; } // annul\u00e9 par l'utilisateur, pas une erreur
      }
    }
    if (partageOk) return;

    // Repli : t\u00e9l\u00e9chargement + ouverture WhatsApp pr\u00e9-rempli vers le bailleur
    var link = document.createElement('a');
    link.href = URL.createObjectURL(f.blob);
    link.download = f.filename;
    link.click();
    setTimeout(function() { URL.revokeObjectURL(link.href); }, 1500);

    var telClean = tel.replace(/[^0-9+]/g, '');
    var msg = encodeURIComponent(texte + '\n\n' + t('Fichier t\u00e9l\u00e9charg\u00e9 \u2014 joignez-le \u00e0 ce message.'));
    window.open('https://wa.me/' + (telClean.startsWith('+') ? telClean.slice(1) : telClean) + '?text=' + msg, '_blank');
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
      else window.IG.utils.showToast(t('Dates invalides'), 'red');
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

    var nomCab   = session.nomCabinet || session.nom || t('Cabinet') + ' ImmoGest';
    var typePro  = session.type_profil || 'gestionnaire';
    var showCom  = typePro !== 'proprietaire';
    var ville    = im.ville || '';
    var tel      = session.telephone || '';
    var nomImm   = im.nom_immeuble || im.nom || t('Immeuble');
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
          t('Locaux vacants') + ' (' + locsLibres.length + ')' +
        '</h3>' +
        '<table>' +
          '<thead><tr>' +
            '<th style="' + TH + ';text-align:left">' + t('Local / Appt') + '</th>' +
            '<th style="' + TH + '">' + t('Type') + '</th>' +
            '<th style="' + TH + '">' + t('Loyer/mois') + '</th>' +
            '<th style="' + TH + '">' + t('Date libération') + '</th>' +
            '<th style="' + TH + '">' + t('Durée vacante') + '</th>' +
            '<th style="' + TH + ';text-align:left">' + t('Manque à gagner') + '</th>' +
          '</tr></thead>' +
          '<tbody>' + libresRows + '</tbody>' +
          '<tfoot><tr style="background:#fff6f6;color:#a32d2d;font-weight:700">' +
            '<td style="padding:6px 9px;border:1px solid #e0e0e0" colspan="5">' + t('TOTAL MANQUE À GAGNER') + '</td>' +
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
          t('Honoraires cabinet') + ' — ' + (typeHon === 'pourcentage' ? valHon + '% ' + t('sur encaissements') : t('Forfait mensuel')) +
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

    var sigLabel = typePro==='cabinet'? t('Le Gestionnaire du Cabinet') : t('Le Gestionnaire');

    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<title>' + t('Rapport') + ' — '+esc(nomImm)+'</title><style>'+css+'</style></head><body>' +

      // En-tête cabinet
      '<div style="background:#1a2e4a;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:0">' +
        '<div><div style="font-size:14px;font-weight:700;color:#fff">'+esc(nomCab)+'</div>' +
          '<div style="font-size:9px;color:rgba(255,255,255,.5);margin-top:1px">' + t('Gestion immobilière') + (ville?' · '+esc(ville):'')+'</div></div>' +
        '<div style="text-align:right;font-size:9px;color:rgba(255,255,255,.5)">'+(tel?t('Tél')+' : '+esc(tel):'')+'</div>' +
      '</div>' +

      // Titre
      '<div style="border-bottom:2px solid #1a2e4a;padding:10px 18px 8px;text-align:center">' +
        '<div style="font-size:13px;font-weight:700;text-decoration:underline;text-transform:uppercase;letter-spacing:.4px;color:#1a2e4a">' +
          t('Rapport du') + ' '+_fmtD(dateDebut)+' ' + t('au') + ' '+_fmtD(dateFin)+'</div>' +
        '<div style="font-size:11px;font-style:italic;color:#555;margin-top:3px">'+esc(nomImm)+
          (bailleur?' — '+esc(bailleur):'')+
        '</div>' +
        '<div style="font-size:9px;color:#aaa;margin-top:1px">' + t('Généré le') + ' '+now.toLocaleDateString('fr-FR')+'</div>' +
      '</div>' +

      // Tableau principal
      '<div style="padding:10px 18px 0">' +
      '<table>' +
        '<thead><tr>' +
          '<th style="'+TH+';text-align:left;min-width:130px">' + t('Noms et prénoms') + '<br><span style="font-weight:400;font-size:9px;opacity:.6">' + t('Tél') + ' · ' + t('Local') + '</span></th>' +
          '<th style="'+TH+'">' + t('Loyer/mois') + '</th>' +
          '<th style="'+TH+'">' + t('Situation') + '</th>' +
          '<th style="'+TH+'">' + t('Caution') + '</th>' +
          '<th style="'+TH+';text-align:left;min-width:150px">' + t('Montants versés') + '</th>' +
          (showCom?'<th style="'+TH+'">' + t('Remis bailleur') + '</th>':'') +
          '<th style="'+TH+'">' + t('Passif') + '</th>' +
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
          '<thead><tr style="background:#1a2e4a;color:#fff"><th style="padding:6px 14px;border:1px solid #2d4a6e;font-weight:500;text-align:left" colspan="2">' + t('Récapitulatif financier') + '</th></tr></thead>' +
          '<tbody>'+recapRows+'</tbody>' +
        '</table>' +

        '<div style="flex:1;display:flex;flex-direction:column;gap:10px">' +
          '<div style="border:0.5px solid #ccc;border-radius:4px;padding:9px 14px;font-size:10.5px;color:#555;font-style:italic;background:#f9f9f9">' +
            t('Arrêtée la présente à la somme de') + ' :<br>' +
            '<strong style="font-style:normal;color:#1a2e4a;font-size:11px">'+lettres+' '+devise()+'</strong>' +
            '<br><span style="font-size:9px;color:#aaa">(' + t('net remis au bailleur') + ')</span>' +
          '</div>' +
          '<div style="display:flex;gap:30px;margin-top:8px">' +
            '<div class="sig"><div style="font-size:10.5px;color:#444">'+sigLabel+'</div><div style="height:32px"></div><div style="font-size:9px;color:#bbb">(' + t('Nom, Signature, Cachet') + ')</div></div>' +
            '<div class="sig"><div style="font-size:10.5px;color:#444">' + t('Le Bailleur') + '</div><div style="height:32px"></div><div style="font-size:9px;color:#bbb">(' + t('Nom, Signature') + ')</div></div>' +
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
      if (typeof docx === 'undefined') { window.IG.utils.showToast(t('Bibliothèque DOCX non chargée'), 'red'); return; }
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
        new docx.Paragraph({ text: (session.nomCabinet || 'ImmoGest') + ' — ' + t('Rapport annuel') + ' ' + annee, heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: t('Généré le') + ' ' + now.toLocaleDateString('fr-FR') }),
        new docx.Paragraph({ text: '' }),
        new docx.Paragraph({ text: t('Synthèse'), heading: docx.HeadingLevel.HEADING_2 }),
        new docx.Paragraph({ text: t('Locataires actifs') + ' : ' + actifs.length }),
        new docx.Paragraph({ text: t('Loyer mensuel théorique') + ' : ' + fmt(loyerMensuel) }),
        new docx.Paragraph({ text: t('Total encaissé') + ' ' + annee + ' : ' + fmt(totalAnnuel) }),
        new docx.Paragraph({ text: t('Potentiel annuel') + ' : ' + fmt(loyerMensuel * 12) }),
        new docx.Paragraph({ text: t('Taux de recouvrement') + ' : ' + (loyerMensuel * 12 > 0 ? Math.round(totalAnnuel / (loyerMensuel * 12) * 100) : 0) + '%' }),
        new docx.Paragraph({ text: '' }),
        new docx.Paragraph({ text: t('Détail mensuel'), heading: docx.HeadingLevel.HEADING_2 }),
        new docx.Table({ rows: [
          new docx.TableRow({ children: [
            new docx.TableCell({ children: [new docx.Paragraph({ text: t('Mois'), bold: true })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: t('Loyer théorique'), bold: true })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: t('Encaissé'), bold: true })] }),
            new docx.TableCell({ children: [new docx.Paragraph({ text: t('Taux'), bold: true })] }),
          ], tableHeader: true })
        ].concat(rows) })
      ]}] });

      docx.Packer.toBlob(doc2).then(function(blob) {
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'rapport-annuel-' + annee + '.docx';
        link.click();
        window.IG.utils.showToast(t('Rapport DOCX téléchargé') + ' ✓', 'green');
      });
    } catch(e) { window.IG.utils.showToast(t('Erreur DOCX') + ': ' + e.message, 'red'); }
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

    var html = '<h3 style="font-size:16px;margin-bottom:16px">🏢 ' + t('État des lieux') + ' — ' + imms.length + ' ' + t('immeuble(s)') + '</h3>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">' +
      '<thead><tr style="background:var(--bg3);font-size:11px;text-transform:uppercase;color:var(--text3)">' +
      '<th style="padding:8px 12px;text-align:left">' + t('Immeuble') + '</th>' +
      '<th style="padding:8px 12px;text-align:center">' + t('Total locaux') + '</th>' +
      '<th style="padding:8px 12px;text-align:center">' + t('Occupés') + '</th>' +
      '<th style="padding:8px 12px;text-align:center">' + t('Vacants') + '</th>' +
      '<th style="padding:8px 12px;text-align:center">' + t('Taux') + '</th>' +
      '<th style="padding:8px 12px;text-align:right">' + t('Loyers/mois') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">' +
      '<button data-modal-close style="padding:8px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Fermer') + '</button>' +
      '</div>';

    window.IG.utils.showModal(html, { width: '680px' });
  }

  function _exportRelancesDocx() {
    try {
      if (typeof docx === 'undefined') { window.IG.utils.showToast(t('Bibliothèque DOCX non chargée'), 'red'); return; }
      var loc = window.IG.locataires ? window.IG.locataires.getCache() : [];
      var pay = window.IG.paiements ? window.IG.paiements.getCache() : [];
      var alertes = loc.filter(function(l) { return l.statut !== 'libre'; }).map(function(l) {
        var pays = pay.filter(function(p) { return p.locataire_id == l.id; });
        var retard = window.IG.relances ? window.IG.relances.calculerRetard(l, pays) : 0;
        var du = window.IG.relances ? window.IG.relances.montantDu(l, pays) : 0;
        return { loc: l, retard: retard, du: du };
      }).filter(function(a) { return a.retard > 0; }).sort(function(a, b) { return b.retard - a.retard; });

      var children = [new docx.Paragraph({ text: t('RAPPORT RELANCES') + ' — ImmoGest', heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: t('Généré le') + ' ' + new Date().toLocaleDateString('fr-FR') })];
      alertes.forEach(function(a) {
        children.push(new docx.Paragraph({ text: a.loc.nom + ' — ' + a.retard + ' ' + t('mois') + ' — ' + fmt(a.du) + ' ' + t('dû') }));
      });
      var doc2 = new docx.Document({ sections: [{ children: children }] });
      docx.Packer.toBlob(doc2).then(function(blob) {
        var link = document.createElement('a'); link.href = URL.createObjectURL(blob);
        link.download = 'rapport-relances-' + Date.now() + '.docx'; link.click();
      });
    } catch(e) { window.IG.utils.showToast(t('Erreur DOCX') + ': ' + e.message, 'red'); }
  }

  // ── Rapport caisse (synthèse encaissements sur période) ──────
  function afficherRapportCaisse() {
    var now = new Date();
    var debutDef = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    var finDef   = now.toISOString().split('T')[0];

    var formHtml =
      '<h3 style="font-size:16px;margin-bottom:16px">💰 Rapport de caisse</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">' +
      '<div><label style="font-size:12px;font-weight:600;color:var(--text2)">Du</label>' +
      '<input type="date" id="rc-debut" value="' + debutDef + '" style="width:100%;box-sizing:border-box;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '<div><label style="font-size:12px;font-weight:600;color:var(--text2)">Au</label>' +
      '<input type="date" id="rc-fin" value="' + finDef + '" style="width:100%;box-sizing:border-box;margin-top:4px;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)"></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
      '<button data-modal-close style="padding:9px 16px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">Annuler</button>' +
      '<button id="rc-gen" style="padding:9px 18px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-weight:600;font-size:13px">Générer</button>' +
      '</div>';

    var modal = window.IG.utils.showModal(formHtml, { width: '420px' });
    modal.box.querySelector('#rc-gen').addEventListener('click', function() {
      var debut = modal.box.querySelector('#rc-debut').value;
      var fin   = modal.box.querySelector('#rc-fin').value;
      if (!debut || !fin) return;
      modal.close();
      _genererRapportCaisse(debut, fin);
    });
  }

  function _genererRapportCaisse(debut, fin) {
    var pay  = window.IG.paiements   ? window.IG.paiements.getCache()   : [];
    var locs = window.IG.locataires  ? window.IG.locataires.getCache()  : [];
    var imms = window.IG.immeubles   ? window.IG.immeubles.getCache()   : [];
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var params  = session.parametres || {};

    var d1 = new Date(debut), d2 = new Date(fin + 'T23:59:59');
    var filtered = pay.filter(function(p) {
      var dp = new Date(p.date_paiement);
      return dp >= d1 && dp <= d2;
    });

    // Regrouper par mode paiement
    var parMode = {};
    filtered.forEach(function(p) {
      var m = p.mode_paiement || 'espèces';
      parMode[m] = (parMode[m] || 0) + (parseFloat(p.montant) || 0);
    });

    // Regrouper par immeuble
    var parImm = {};
    filtered.forEach(function(p) {
      var loc = locs.find(function(l) { return l.id == p.locataire_id; });
      var immId = loc ? loc.immeuble_id : 'inconnu';
      parImm[immId] = (parImm[immId] || 0) + (parseFloat(p.montant) || 0);
    });

    var total = filtered.reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
    var remis = filtered.filter(function(p) { return p.remisAuBailleur; }).reduce(function(s, p) { return s + (parseFloat(p.montant) || 0); }, 0);
    var encaisseNet = total - remis;
    var dateEd = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    var cabNom = params.nom_cabinet || session.nomCabinet || session.nom || t('Cabinet');

    // Tableau lignes détail
    var lignes = filtered
      .sort(function(a, b) { return new Date(a.date_paiement) - new Date(b.date_paiement); })
      .map(function(p, i) {
        var loc = locs.find(function(l) { return l.id == p.locataire_id; });
        var imm = loc ? imms.find(function(x) { return x.id == loc.immeuble_id; }) : null;
        var bg = i % 2 === 0 ? '' : 'background:#F5F9FD;';
        return '<tr style="' + bg + '">' +
          '<td style="padding:6px 10px;font-size:12px">' + _fmtD(p.date_paiement) + '</td>' +
          '<td style="padding:6px 10px;font-size:12px;font-weight:600">' + esc(loc ? loc.nom : '—') + '</td>' +
          '<td style="padding:6px 10px;font-size:12px;color:#555">' + esc(imm ? (imm.nom_immeuble || imm.nom) : '—') + '</td>' +
          '<td style="padding:6px 10px;font-size:12px">' + esc(loc ? (loc.appt || '—') : '—') + '</td>' +
          '<td style="padding:6px 10px;font-size:12px">' + esc(p.mode_paiement || 'espèces') + '</td>' +
          '<td style="padding:6px 10px;font-size:12px;text-align:right;font-weight:700">' + fmt(p.montant) + '</td>' +
          '<td style="padding:6px 10px;font-size:12px;text-align:center">' + (p.remisAuBailleur ? '✓' : '') + '</td>' +
          '</tr>';
      }).join('');

    // Synthèse modes
    var synthMode = Object.keys(parMode).map(function(m) {
      return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:11px">' +
        '<span>' + esc(m) + '</span><strong>' + fmt(parMode[m]) + '</strong></div>';
    }).join('');

    // Synthèse immeuble
    var synthImm = Object.keys(parImm).map(function(id) {
      var imm = imms.find(function(x) { return x.id == id; });
      return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:11px">' +
        '<span>' + esc(imm ? (imm.nom_immeuble || imm.nom) : '—') + '</span><strong>' + fmt(parImm[id]) + '</strong></div>';
    }).join('');

    var TH = 'background:#0E6AAF;color:#fff;padding:6px 10px;font-size:10px;text-align:left;font-weight:700;';
    var html =
      '<div id="caisse-print-zone" style="font-family:\'Times New Roman\',serif;font-size:11px;background:#fff;color:#111;padding:20px">' +
      '<div style="text-align:center;margin-bottom:16px">' +
      '<div style="font-size:15px;font-weight:700;color:#0E6AAF">' + esc(cabNom) + '</div>' +
      '<div style="font-size:13px;font-weight:700;text-transform:uppercase;text-decoration:underline;margin:8px 0 4px">Rapport de caisse</div>' +
      '<div style="font-size:11px;color:#555">Période du ' + _fmtD(debut) + ' au ' + _fmtD(fin) + ' · Édité le ' + dateEd + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">' +
      _metricCard('💰', fmt(total), t('Total encaissé')) +
      _metricCard('🏦', fmt(encaisseNet), t('Net cabinet')) +
      _metricCard('📋', filtered.length + '', t('Opérations')) +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">' +
      '<div style="background:#F5F9FD;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#0E6AAF;margin-bottom:8px;text-transform:uppercase">Par mode de paiement</div>' + synthMode + '</div>' +
      '<div style="background:#F5F9FD;border-radius:8px;padding:12px"><div style="font-size:10px;font-weight:700;color:#0E6AAF;margin-bottom:8px;text-transform:uppercase">Par immeuble</div>' + synthImm + '</div>' +
      '</div>' +
      (remis > 0 ? '<div style="background:#FFF5E0;border:1px solid #E07B00;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:11px">⚠️ <strong>' + fmt(remis) + '</strong> remis directement au bailleur (déduit du net cabinet)</div>' : '') +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">' +
      '<thead><tr>' +
      '<th style="' + TH + '">Date</th><th style="' + TH + '">Locataire</th><th style="' + TH + '">Immeuble</th>' +
      '<th style="' + TH + '">Local</th><th style="' + TH + '">Mode</th><th style="' + TH + 'text-align:right">Montant</th>' +
      '<th style="' + TH + 'text-align:center">Bailleur</th>' +
      '</tr></thead><tbody>' + (lignes || '<tr><td colspan="7" style="padding:12px;text-align:center;color:#999;font-style:italic">Aucun encaissement sur cette période</td></tr>') + '</tbody>' +
      '<tfoot><tr style="background:#0E6AAF;color:#fff"><td colspan="5" style="padding:6px 10px;font-weight:700;font-size:12px">TOTAL</td>' +
      '<td style="padding:6px 10px;font-weight:700;font-size:12px;text-align:right">' + fmt(total) + '</td><td></td></tr></tfoot>' +
      '</table></div></div>';

    var modalHtml =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<h3 style="font-size:15px;font-weight:700">💰 Rapport de caisse</h3>' +
      '<div style="display:flex;gap:8px">' +
      '<button onclick="window.print()" style="padding:7px 13px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">🖨️ Imprimer</button>' +
      '<button data-modal-close style="padding:7px 13px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">Fermer</button>' +
      '</div></div>' + html;

    window.IG.utils.showModal(modalHtml, { width: '760px' });
  }

  // ── Rapport portefeuille (vue consolidée multi-immeubles) ─────
  function afficherRapportPortefeuille() {
    var imms = window.IG.immeubles  ? window.IG.immeubles.getCache()  : [];
    var locs = window.IG.locataires ? window.IG.locataires.getCache() : [];
    var pay  = window.IG.paiements  ? window.IG.paiements.getCache()  : [];
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var params  = session.parametres || {};

    var now = new Date();
    var moisCur = now.getMonth() + 1;
    var annCur  = now.getFullYear();
    var dateEd  = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    var cabNom  = params.nom_cabinet || session.nomCabinet || session.nom || t('Cabinet');

    // Totaux globaux
    var totalLocaux    = imms.reduce(function(s, i) { return s + (i.apparts||0) + (i.studios||0) + (i.chambres||0) + (i.duplex||0); }, 0);
    var totalOccupes   = locs.filter(function(l) { return l.statut !== 'libre'; }).length;
    var totalLoyersMRC = locs.filter(function(l) { return l.statut !== 'libre'; }).reduce(function(s, l) { return s + (parseFloat(l.loyer)||0); }, 0);
    var totalEncMois   = pay.filter(function(p) { return parseInt(p.mois) === moisCur && parseInt(p.annee) === annCur; }).reduce(function(s, p) { return s + (parseFloat(p.montant)||0); }, 0);
    var totalArrieres  = locs.filter(function(l) { return l.statut !== 'libre'; }).reduce(function(s, l) { return s + (parseFloat(l.arrieres)||0); }, 0);
    var tauxGlobal     = totalLocaux > 0 ? Math.round(totalOccupes / totalLocaux * 100) : 0;

    // Lignes par immeuble
    var rows = imms.map(function(imm, i) {
      var locsImm  = locs.filter(function(l) { return l.immeuble_id == imm.id; });
      var actifs   = locsImm.filter(function(l) { return l.statut !== 'libre'; });
      var total    = (imm.apparts||0) + (imm.studios||0) + (imm.chambres||0) + (imm.duplex||0);
      var taux     = total > 0 ? Math.round(actifs.length / total * 100) : 0;
      var loyerMRC = actifs.reduce(function(s, l) { return s + (parseFloat(l.loyer)||0); }, 0);
      var encMois  = pay.filter(function(p) {
        var lid = actifs.map(function(l) { return l.id; });
        return lid.includes(p.locataire_id) && parseInt(p.mois) === moisCur && parseInt(p.annee) === annCur;
      }).reduce(function(s, p) { return s + (parseFloat(p.montant)||0); }, 0);
      var recouvr  = loyerMRC > 0 ? Math.round(encMois / loyerMRC * 100) : 0;
      var colTaux  = taux >= 80 ? '#1a7a3a' : taux >= 50 ? '#E07B00' : '#c0392b';
      var colRec   = recouvr >= 80 ? '#1a7a3a' : recouvr >= 50 ? '#E07B00' : '#c0392b';
      var bg = i % 2 === 0 ? '' : 'background:#F5F9FD;';
      return '<tr style="' + bg + '">' +
        '<td style="padding:7px 10px;font-size:12px;font-weight:700">' + esc(imm.nom_immeuble || imm.nom) + '</td>' +
        '<td style="padding:7px 10px;font-size:12px;color:#555">' + esc(imm.ville || '—') + '</td>' +
        '<td style="padding:7px 10px;font-size:12px;text-align:center">' + total + '</td>' +
        '<td style="padding:7px 10px;font-size:12px;text-align:center;color:#1a7a3a;font-weight:700">' + actifs.length + '</td>' +
        '<td style="padding:7px 10px;font-size:12px;text-align:center;font-weight:700;color:' + colTaux + '">' + taux + '%</td>' +
        '<td style="padding:7px 10px;font-size:12px;text-align:right">' + fmt(loyerMRC) + '</td>' +
        '<td style="padding:7px 10px;font-size:12px;text-align:right;font-weight:700;color:' + colRec + '">' + fmt(encMois) + ' <span style="font-weight:400;font-size:10px;color:#999">(' + recouvr + '%)</span></td>' +
        '</tr>';
    }).join('');

    var TH = 'background:#0E6AAF;color:#fff;padding:7px 10px;font-size:10px;font-weight:700;text-align:left;';
    var html =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">' +
      '<h3 style="font-size:15px;font-weight:700">🗂️ Rapport portefeuille</h3>' +
      '<div style="display:flex;gap:8px">' +
      '<button onclick="window.print()" style="padding:7px 13px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">🖨️ Imprimer</button>' +
      '<button data-modal-close style="padding:7px 13px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);color:var(--text);font-size:12px;cursor:pointer">Fermer</button>' +
      '</div></div>' +
      '<div style="font-size:11px;color:var(--text3);margin-bottom:14px">Édité le ' + dateEd + ' · ' + esc(cabNom) + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">' +
      _metricCard('🏢', imms.length + '', t('Immeubles')) +
      _metricCard('🔑', totalOccupes + '/' + totalLocaux, t('Occupation')) +
      _metricCard('📈', tauxGlobal + '%', t('Taux global')) +
      _metricCard('💰', fmt(totalEncMois), t('Encaissé ce mois')) +
      '</div>' +
      (totalArrieres > 0 ? '<div style="background:rgba(185,48,32,.08);border:1px solid var(--red);border-radius:8px;padding:8px 14px;margin-bottom:14px;font-size:12px">⚠️ Arriérés cumulés déclarés : <strong style="color:var(--red)">' + fmt(totalArrieres) + '</strong></div>' : '') +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse">' +
      '<thead><tr>' +
      '<th style="' + TH + '">Immeuble</th>' +
      '<th style="' + TH + '">Ville</th>' +
      '<th style="' + TH + 'text-align:center">Locaux</th>' +
      '<th style="' + TH + 'text-align:center">Actifs</th>' +
      '<th style="' + TH + 'text-align:center">Occupation</th>' +
      '<th style="' + TH + 'text-align:right">Loyers/mois</th>' +
      '<th style="' + TH + 'text-align:right">Encaissé ce mois</th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="7" style="padding:14px;text-align:center;color:#999;font-style:italic">Aucun immeuble</td></tr>') + '</tbody>' +
      '<tfoot><tr style="background:#0E6AAF;color:#fff">' +
      '<td colspan="2" style="padding:7px 10px;font-weight:700;font-size:12px">TOTAUX PORTEFEUILLE</td>' +
      '<td style="padding:7px 10px;text-align:center;font-weight:700">' + totalLocaux + '</td>' +
      '<td style="padding:7px 10px;text-align:center;font-weight:700">' + totalOccupes + '</td>' +
      '<td style="padding:7px 10px;text-align:center;font-weight:700">' + tauxGlobal + '%</td>' +
      '<td style="padding:7px 10px;text-align:right;font-weight:700">' + fmt(totalLoyersMRC) + '</td>' +
      '<td style="padding:7px 10px;text-align:right;font-weight:700">' + fmt(totalEncMois) + '</td>' +
      '</tr></tfoot></table></div>';

    window.IG.utils.showModal(html, { width: '800px' });
  }

  return {
    genererRapportMensuelHTML, afficherRapportMensuel, exporterDocx,
    genererRapportAnnuelHTML,
    afficherRapportAnnuel, ouvrirDetailAnnuel, imprimerDetailAnnuel, exporterRapportAnnuelDocx,
    afficherRapportRelances, afficherEtatLieux, _exportRelancesDocx,
    afficherRapportCaisse, afficherRapportPortefeuille
  };

})();
