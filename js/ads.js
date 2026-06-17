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
  }

  return { init, rendreBlocPub, surUpgrade };

})();
