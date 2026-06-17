// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Publicité Monetag (plan gratuit uniquement)
//  Affiche des pubs natives entre les sections sur plan gratuit
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.ads = (function() {

  var META_ID = window.IG.config ? window.IG.config.monetagMeta : 'd9b7d2935fbcb3e568288a4ff0852e32';
  var _injected = false;

  function _injecterScript() {
    if (_injected) return;
    _injected = true;
    var s = document.createElement('script');
    s.setAttribute('data-cfasync', 'false');
    s.src = '//thubanoa.com/1?z=' + META_ID;
    s.async = true;
    document.head.appendChild(s);
  }

  function init() {
    var plan = window.IG.plans ? window.IG.plans.getPlan() : 'gratuit';
    if (plan !== 'gratuit') {
      _cacherToutesLesPubs();
      return;
    }
    _injecterScript();
    _afficherBandeauUpgrade();
  }

  function _cacherToutesLesPubs() {
    document.querySelectorAll('.ig-ad-zone').forEach(function(el) {
      el.style.display = 'none';
    });
    var bandeau = document.getElementById('ig-upgrade-bandeau');
    if (bandeau) bandeau.style.display = 'none';
  }

  function _afficherBandeauUpgrade() {
    if (document.getElementById('ig-upgrade-bandeau')) return;
    var div = document.createElement('div');
    div.id = 'ig-upgrade-bandeau';
    div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;' +
      'background:linear-gradient(90deg,#0E6AAF,#7C3AED);' +
      'color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;' +
      'font-size:12px;box-shadow:0 -4px 20px rgba(0,0,0,0.2)';
    var t = window.IG.i18n ? window.IG.i18n.t.bind(window.IG.i18n) : function(k){return k;};
    div.innerHTML =
      '<span>✨ <strong>' + t('Plan Gratuit') + '</strong> — 2 ' + t('immeubles') + ', 20 ' + t('locataires') + ' max</span>' +
      '<button onclick="window.IG.plans.afficherUpgrade()" ' +
        'style="padding:6px 14px;border-radius:8px;border:none;background:#fff;color:#0E6AAF;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0">' +
        '⬆ ' + t('Passer Pro') + '</button>';
    document.body.appendChild(div);
    document.body.style.paddingBottom = '48px';
  }

  function rendreBlocPub(containerId) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var plan = window.IG.plans ? window.IG.plans.getPlan() : 'gratuit';
    if (plan !== 'gratuit') { el.style.display = 'none'; return; }

    el.className = 'ig-ad-zone';
    el.style.cssText = 'margin:16px 0;border-radius:12px;overflow:hidden;min-height:100px;background:var(--bg2);border:1px solid var(--border);';
    el.innerHTML =
      '<div style="padding:8px 12px;font-size:10px;color:var(--text3);border-bottom:1px solid var(--border)">PUBLICITÉ</div>' +
      '<div class="monetag-ad" style="min-height:90px;display:flex;align-items:center;justify-content:center;padding:12px">' +
      '<p style="font-size:12px;color:var(--text3);text-align:center">⬆ Passez au plan <strong>Starter</strong> (3 000 FCFA/mois) pour supprimer les publicités</p>' +
      '</div>';
  }

  function surUpgrade() {
    _cacherToutesLesPubs();
    var pb = document.getElementById('ig-upgrade-bandeau');
    if (pb) pb.remove();
    document.body.style.paddingBottom = '';
    var w = document.getElementById('ig-usage-widget');
    if (w) w.remove();
    var eb = document.getElementById('ig-expiry-banner');
    if (eb) eb.remove();
  }

  // ── Widget usage sidebar ──────────────────────────────────────
  function renderUsageWidget() {
    var plan = window.IG.plans ? window.IG.plans.getPlan() : 'gratuit';
    var footer = document.querySelector('.sidebar-footer');
    if (!footer) return;

    var existing = document.getElementById('ig-usage-widget');
    if (plan !== 'gratuit') { if (existing) existing.remove(); return; }

    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'ig-usage-widget';
      footer.insertBefore(existing, footer.firstChild);
    }

    var data = window.IG.app ? window.IG.app.getData() : { immeubles: [], locataires: [] };
    var nbImm = data.immeubles ? data.immeubles.length : 0;
    var nbLoc = data.locataires ? data.locataires.filter(function(l) { return l.statut !== 'libre'; }).length : 0;
    var maxImm = 1, maxLoc = 10;
    var pImm = Math.min(100, Math.round((nbImm / maxImm) * 100));
    var pLoc = Math.min(100, Math.round((nbLoc / maxLoc) * 100));
    var cImm = pImm >= 100 ? '#e74c3c' : pImm >= 80 ? '#f39c12' : 'rgba(255,255,255,0.35)';
    var cLoc = pLoc >= 100 ? '#e74c3c' : pLoc >= 80 ? '#f39c12' : 'rgba(255,255,255,0.35)';
    var urgence = pImm >= 100 || pLoc >= 100;
    var proche  = !urgence && (pImm >= 80 || pLoc >= 80);

    existing.style.cssText = 'margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid ' +
      (urgence ? 'rgba(231,76,60,0.4)' : 'rgba(255,255,255,0.1)') + ';';

    existing.innerHTML =
      '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Utilisation · GRATUIT</div>' +
      '<div style="margin-bottom:6px">' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px">' +
          '<span>Immeubles</span><span style="color:' + cImm + ';font-weight:600">' + nbImm + '/' + maxImm + '</span>' +
        '</div>' +
        '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">' +
          '<div style="height:100%;width:' + pImm + '%;background:' + cImm + ';border-radius:99px;transition:width .4s"></div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-bottom:8px">' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px">' +
          '<span>Locataires</span><span style="color:' + cLoc + ';font-weight:600">' + nbLoc + '/' + maxLoc + '</span>' +
        '</div>' +
        '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden">' +
          '<div style="height:100%;width:' + pLoc + '%;background:' + cLoc + ';border-radius:99px;transition:width .4s"></div>' +
        '</div>' +
      '</div>' +
      (urgence
        ? '<button onclick="window.IG.plans.afficherUpgrade()" style="width:100%;padding:6px;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">⚠ Limite atteinte — S\'abonner</button>'
        : proche
          ? '<button onclick="window.IG.plans.afficherUpgrade()" style="width:100%;padding:6px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer">⬆ Passer à Starter</button>'
          : '<div style="font-size:10px;color:rgba(255,255,255,0.35);text-align:center;cursor:pointer" onclick="window.IG.plans.afficherUpgrade()">Voir les plans →</div>'
      );
  }

  // ── Score locataire flou si plan gratuit ──────────────────────
  function scoreDisplay(score) {
    var plan = window.IG.plans ? window.IG.plans.getPlan() : 'gratuit';
    if (plan !== 'gratuit') {
      var col = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
      return '<span style="font-weight:700;color:' + col + '">' + score + '/100</span>';
    }
    return '<span style="filter:blur(4px);cursor:pointer;user-select:none;font-weight:700" onclick="window.IG.plans.afficherUpgrade()" title="Débloquer avec Starter">??/100</span>' +
           ' <span style="font-size:10px;cursor:pointer" onclick="window.IG.plans.afficherUpgrade()">🔒</span>';
  }

  // ── Bandeau expiration abonnement ─────────────────────────────
  function checkExpiry() {
    var plan = window.IG.plans ? window.IG.plans.getPlan() : 'gratuit';
    if (plan === 'gratuit') return;

    var raw = localStorage.getItem('ig_subscription');
    if (!raw) return;
    var sub; try { sub = JSON.parse(raw); } catch(e) { return; }
    if (!sub || !sub.expiry) return;

    var now  = Date.now();
    var exp  = new Date(sub.expiry).getTime();
    var days = Math.ceil((exp - now) / 86400000);
    if (days > 7) return;

    var existing = document.getElementById('ig-expiry-banner');
    if (existing) return;

    var isExpired = days <= 0;
    var color = isExpired ? '#c0392b' : days <= 3 ? '#e67e22' : '#f39c12';
    var msg = isExpired
      ? 'Votre abonnement a expiré — Renouvelez pour maintenir l\'accès.'
      : days === 0 ? 'Votre abonnement expire <strong>aujourd\'hui</strong>.'
      : 'Votre abonnement expire dans <strong>' + days + ' jour(s)</strong>.';

    var banner = document.createElement('div');
    banner.id = 'ig-expiry-banner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9998;background:' + color +
      ';color:#fff;padding:9px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:12px;font-weight:500;';
    banner.innerHTML =
      '<span>' + (isExpired ? '⛔' : '⚠️') + ' ' + msg + '</span>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<button onclick="window.IG.plans.afficherUpgrade()" style="background:#fff;color:' + color + ';border:none;padding:5px 14px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">🔄 Renouveler</button>' +
        '<button onclick="document.getElementById(\'ig-expiry-banner\').remove()" style="background:none;border:none;color:rgba(255,255,255,0.7);font-size:18px;cursor:pointer;line-height:1">×</button>' +
      '</div>';
    document.body.prepend(banner);
  }

  return { init, rendreBlocPub, surUpgrade, renderUsageWidget, scoreDisplay, checkExpiry };

})();
