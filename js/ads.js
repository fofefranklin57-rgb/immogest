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
    s.src = 'https://thubanoa.com/1?z=' + META_ID;
    s.async = true;
    document.head.appendChild(s);
  }

  function init() {
    var plan = window.IG.plans ? window.IG.plans.getPlan() : 'gratuit';

    if (plan === 'gratuit') {
      // Plan gratuit : toutes les pubs (Monetag native + Adsterra bannière fixe + in-page push)
      _injecterScript();          // Monetag native ads
      _injecterBanniereFixe();    // Adsterra bannière fixe en bas
      _injecterBanniereIA();      // Monetag in-page push
    } else if (plan === 'trial') {
      // Essai : zéro pub tierce mais promo upgrade dans panel IA
      _cacherToutesLesPubs();
      _injecterPromoIA();
    } else {
      // Payant (starter / pro / cabinet) : uniquement bannière statique Adsterra en bas
      _cacherToutesLesPubs();
      _injecterBanniereFixe();    // Bannière discrète non-intrusive
    }
  }

  function _injecterBanniereFixe() {
    if (document.getElementById('ig-fixed-ad')) return;

    var wrap = document.createElement('div');
    wrap.id = 'ig-fixed-ad';
    wrap.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:990;' +
      'background:var(--bg2);border-top:1px solid var(--border2);' +
      'display:flex;align-items:center;justify-content:center;' +
      'height:50px;max-height:50px;overflow:hidden;';

    // Étiquette "Pub"
    var lbl = document.createElement('span');
    lbl.style.cssText = 'position:absolute;top:2px;left:6px;font-size:9px;' +
      'color:var(--text3);text-transform:uppercase;letter-spacing:.05em;font-weight:600;opacity:.5;';
    lbl.textContent = 'Pub';
    wrap.appendChild(lbl);

    // Slot Adsterra zone 2 (728x90 leaderboard — format plat)
    var cfg = document.createElement('script');
    cfg.text = "atOptions={'key':'" + AD2_KEY + "','format':'iframe','height':50,'width':320,'params':{}};";
    wrap.appendChild(cfg);
    var s = document.createElement('script');
    s.src = AD2_SRC;
    s.async = true;
    wrap.appendChild(s);

    document.body.appendChild(wrap);

    // Décaler le contenu principal de 50px seulement
    document.body.style.paddingBottom = '54px';
  }

  function _injecterPromoIA() {
    var tries = 0;
    var iv = setInterval(function() {
      var b = document.getElementById('ai-ad-banner');
      if (b) {
        clearInterval(iv);
        if (!b.querySelector('script[data-zone]')) injecterMonetag('ai-ad-banner', 29679261);
      } else if (++tries > 80) {
        clearInterval(iv);
      }
    }, 250);
  }

  // Zone In-Page Push Monetag — CPM, impression seule, tous plans
  var IPP_ZONE_ID = '11087888';

  function _injecterBanniereIA() {
    // Injecte le script In-Page Push une seule fois (peut déjà être chargé par portail)
    if (document.getElementById('monetag-ipp-app')) return;
    var s = document.createElement('script');
    s.id = 'monetag-ipp-app';
    s.setAttribute('data-cfasync', 'false');
    s.dataset.zone = IPP_ZONE_ID;
    s.src = 'https://nap5k.com/tag.min.js';
    s.async = true;
    document.head.appendChild(s);

    // Zone Monetag 300x250 dans le panel IA
    var _tries = 0;
    var _check = setInterval(function() {
      var banner = document.getElementById('ai-ad-banner');
      if (banner || ++_tries > 40) {
        clearInterval(_check);
        if (banner && !banner.querySelector('script[data-zone]')) injecterMonetag('ai-ad-banner', 29679261);
      }
    }, 250);
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
      '<span>✨ <strong>' + t('Plan Gratuit') + '</strong> — 1 immeuble, 10 locataires max</span>' +
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
    // Seulement sur plan gratuit (pas essai, pas payant)
    if (plan !== 'gratuit') { el.style.display = 'none'; return; }

    el.className = 'ig-ad-zone';
    el.style.cssText = 'margin:16px 0;border-radius:12px;overflow:hidden;min-height:100px;background:var(--bg2);border:1px solid var(--border);';
    el.innerHTML =
      '<div style="padding:8px 12px;font-size:10px;color:var(--text3);border-bottom:1px solid var(--border)">PUBLICITÉ</div>' +
      '<div class="monetag-ad" style="min-height:90px;display:flex;align-items:center;justify-content:center;padding:12px">' +
      '<p style="font-size:12px;color:var(--text3);text-align:center">⬆ Passez à <strong>Starter</strong> (5 000 FCFA/mois) pour supprimer les publicités</p>' +
      '</div>';
  }

  function surUpgrade() {
    _cacherToutesLesPubs();
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
    // Masquer pour essai ET plans payants
    if (plan !== 'gratuit') { if (existing) existing.remove(); return; }

    // Afficher le badge essai si applicable
    var joursRestants = window.IG.plans ? window.IG.plans.getJoursEssaiRestants() : 0;
    if (joursRestants > 0) {
      if (!existing) {
        existing = document.createElement('div');
        existing.id = 'ig-usage-widget';
        footer.insertBefore(existing, footer.firstChild);
      }
      // Urgence progressive selon jours restants
    var urgColor = joursRestants > 14 ? '#7C3AED' : joursRestants > 7 ? '#d97706' : '#dc2626';
    var urgMsg   = joursRestants > 14
      ? 'Toutes les fonctionnalités actives'
      : joursRestants > 7
        ? '⚠️ Profitez-en — bientôt limité'
        : joursRestants > 3
          ? '🔥 Derniers jours — ne perdez pas vos données'
          : '⛔ Expiration imminente — agissez maintenant';
    var ctaText  = joursRestants > 14
      ? 'Choisir mon plan →'
      : joursRestants > 3
        ? 'Continuer sans interruption →'
        : '🔓 Sécuriser mon accès →';

    existing.style.cssText = 'margin-bottom:10px;padding:10px 12px;background:' + urgColor + '22;border-radius:8px;border:1px solid ' + urgColor + '55;';
    existing.innerHTML =
      '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">🎁 Période d\'essai</div>' +
      '<div style="font-size:16px;font-weight:900;color:' + urgColor.replace('#','').length === 6 ? urgColor : '#c4b5fd' + ';margin-bottom:2px">' + joursRestants + ' jour' + (joursRestants > 1 ? 's' : '') + ' restant' + (joursRestants > 1 ? 's' : '') + '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.55);margin-bottom:8px">' + urgMsg + '</div>' +
      '<button onclick="window.IG.plans.afficherUpgrade()" style="width:100%;padding:7px;background:' + urgColor + ';color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer">' + ctaText + '</button>';
    return;
    }

    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'ig-usage-widget';
      footer.insertBefore(existing, footer.firstChild);
    }

    var data = window.IG.app ? window.IG.app.getData() : { immeubles: [], locataires: [] };
    var nbImm = data.immeubles ? data.immeubles.length : 0;
    var nbLoc = data.locataires ? data.locataires.filter(function(l) { return l.statut !== 'libre'; }).length : 0;
    var maxImm = 1, maxLoc = 10; // limites plan gratuit
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

  // ── Banners Adsterra CPM ──────────────────────────────────────
  // Zone 1 : 300x250 / responsive — panel IA
  var AD1_KEY = 'a8b8306fd87bb4d734ff3ccae11c6e40';
  var AD1_SRC = 'https://pl29779759.effectivecpmnetwork.com/' + AD1_KEY + '/invoke.js';

  // Zone 2 : 728x90 leaderboard — dashboard
  var AD2_KEY = 'eca414bf7ac681267ea5cd09ff57482a';
  var AD2_SRC = 'https://www.highperformanceformat.com/' + AD2_KEY + '/invoke.js';

  var _ad1ScriptLoaded = false;
  var _ad1Loaded = false;
  var _ad2Loaded = false;

  function _chargerScriptAD1() {
    if (_ad1ScriptLoaded) return;
    _ad1ScriptLoaded = true;
    var s = document.createElement('script');
    s.async = true; s.setAttribute('data-cfasync', 'false');
    s.src = AD1_SRC;
    document.head.appendChild(s);
  }

  function _injecterAdsterra(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var isIA = containerId === 'ai-ad-banner';

    if (isIA && !_ad1Loaded) {
      _ad1Loaded = true;
      // Si la bannière fixe a déjà l'ID exact, le script AD1 est déjà chargé — rien à faire
      if (!document.getElementById('container-' + AD1_KEY)) {
        var slot = document.createElement('div');
        slot.id = 'container-' + AD1_KEY;
        container.appendChild(slot);
        _chargerScriptAD1();
      }
    }

    if (!isIA && !_ad2Loaded) {
      _ad2Loaded = true;
      // Zone 728x90 via atOptions
      var cfg = document.createElement('script');
      cfg.text = "atOptions={'key':'" + AD2_KEY + "','format':'iframe','height':90,'width':728,'params':{}};";
      container.appendChild(cfg);
      var s2 = document.createElement('script');
      s2.async = true; s2.setAttribute('data-cfasync', 'false');
      s2.src = AD2_SRC;
      container.appendChild(s2);
    }
  }

  // ── Monetag zones numériques (Banner / Native) ───────────────
  function injecterMonetag(containerId, zoneId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    if (container.querySelector('script[data-zone="' + zoneId + '"]')) return;
    var s = document.createElement('script');
    s.async = true;
    s.setAttribute('data-cfasync', 'false');
    s.setAttribute('data-zone', String(zoneId));
    s.src = 'https://pl' + zoneId + '.profitableratecpm.com/invokeMNTags.min.js';
    container.appendChild(s);
  }

  // ── Bannière promo maison (fallback si pub pas chargée) ──────
  function rendreBannierePromo(containerId) {
    var parent = document.getElementById(containerId);
    if (!parent) return;
    var existing = parent.querySelector('.ig-promo-banner');
    if (existing) existing.remove();
    var div = document.createElement('div');
    div.className = 'ig-promo-banner';
    div.style.cssText = 'border-radius:10px;border:1px solid var(--border2);background:var(--bg3);overflow:hidden;cursor:pointer;width:100%;box-sizing:border-box;';
    div.setAttribute('onclick', 'window.IG.plans.afficherUpgrade()');
    div.innerHTML =
      '<div style="padding:2px 10px;font-size:9px;letter-spacing:.06em;color:var(--text3);text-transform:uppercase;font-weight:600;border-bottom:1px solid var(--border2);background:var(--bg4)">Publicité</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;gap:10px">' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.5"><strong style="color:var(--accent)">ImmoGest Pro</strong> — IA illimitée, rapports, export.<br>' +
      '<span style="color:var(--text3);font-size:11px">Dès 9 999 FCFA/mois · 2 mois offerts</span></div>' +
      '<div style="flex-shrink:0;padding:6px 12px;border-radius:8px;background:var(--accent);color:#fff;font-size:12px;font-weight:700">Voir →</div>' +
      '</div>';
    parent.insertBefore(div, parent.firstChild);
  }

  // ── Slot iframe — compatible SPA (chargement frais à chaque navigation) ──
  function injecterSlot(containerId, zone) {
    var container = document.getElementById(containerId);
    if (!container) return;
    var key, src, extra = '', iw, ih;
    if (zone === 'ad2') {
      key = AD2_KEY; src = AD2_SRC; iw = '100%'; ih = '96px';
      extra = '<script>atOptions={\'key\':\'' + key + '\',\'format\':\'iframe\',\'height\':90,\'width\':728,\'params\':{}};<\/script>';
    } else {
      key = AD1_KEY; src = AD1_SRC; iw = '320px'; ih = '265px';
    }
    var inner = extra +
      '<script async data-cfasync="false" src="' + src + '"><\/script>' +
      '<div id="container-' + key + '"></div>';
    var iframe = document.createElement('iframe');
    iframe.style.cssText = 'border:none;overflow:hidden;width:' + iw + ';max-width:' + (zone === 'ad2' ? '728px' : '320px') + ';height:' + ih + ';display:block;margin:0 auto;';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    iframe.scrolling = 'no';
    container.appendChild(iframe);
    var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
    if (doc) { doc.open(); doc.write(inner); doc.close(); }
  }

  return { init, rendreBlocPub, surUpgrade, renderUsageWidget, scoreDisplay, checkExpiry, rendreBannierePromo, _injecterAdsterra, injecterSlot, injecterMonetag };

})();
