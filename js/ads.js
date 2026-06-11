// ── ImmoGest Ads — Monetag ────────────────────────────────────────
// Locataires    : bannière discrète fixe en bas — TOUJOURS (revenu garanti)
// Plan gratuit  : Monetag complet (In-Page Push + bannière)
// Plan payant   : zéro pub
// ─────────────────────────────────────────────────────────────────

(function() {

  var _monetagLoaded = false;

  function loadMonetag() {
    if (_monetagLoaded) return;
    _monetagLoaded = true;
    var s = document.createElement('script');
    s.dataset.zone = '11087888';
    s.src = 'https://nap5k.com/tag.min.js';
    s.async = true;
    document.body.appendChild(s);
  }

  function injectDiscreteBanner() {
    if (document.getElementById('immogest-ad-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'immogest-ad-bar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'height:52px', 'z-index:998',
      'background:rgba(248,249,250,0.97)',
      'border-top:1px solid #e2e8f0',
      'display:flex', 'align-items:center', 'justify-content:center',
      'overflow:hidden'
    ].join(';');

    var slot = document.createElement('div');
    slot.style.cssText = 'width:320px;height:50px;overflow:hidden;';
    bar.appendChild(slot);

    // Bouton fermer discret
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.title = 'Fermer';
    closeBtn.style.cssText = [
      'position:absolute', 'right:6px', 'top:50%',
      'transform:translateY(-50%)',
      'background:none', 'border:none',
      'color:#94a3b8', 'font-size:11px',
      'cursor:pointer', 'padding:4px', 'line-height:1'
    ].join(';');
    closeBtn.onclick = function() {
      bar.style.display = 'none';
      // Réafficher après 5 min pour les locataires — revenu garanti
      if (window._adsRole === 'locataire' || window._adsRole === 'proprietaire') {
        setTimeout(function() { bar.style.display = 'flex'; }, 5 * 60 * 1000);
      }
    };
    bar.appendChild(closeBtn);
    document.body.appendChild(bar);

    // Marge bas de page pour ne pas masquer le contenu
    var shell = document.getElementById('app-shell');
    if (shell) shell.style.paddingBottom = '56px';
  }

  function removeDiscreteBanner() {
    var bar = document.getElementById('immogest-ad-bar');
    if (bar) bar.remove();
    var shell = document.getElementById('app-shell');
    if (shell) shell.style.paddingBottom = '';
  }

  // ── Point d'entrée appelé après login ──
  window.initAds = function() {
    if (!window.SESSION) return;

    var role = SESSION.role || 'admin';
    var plan = (window.MONETISATION && window.MONETISATION.plan) || 'gratuit';
    window._adsRole = role;

    if (role === 'locataire' || role === 'proprietaire') {
      // Locataires / propriétaires : bannière discrète toujours présente
      injectDiscreteBanner();
      loadMonetag();
      return;
    }

    // Gestionnaires / admins
    if (plan === 'gratuit') {
      // Plan gratuit : Monetag complet + bannière
      loadMonetag();
      injectDiscreteBanner();
    } else {
      // Plan payant : zéro pub
      removeDiscreteBanner();
    }
  };

  // ── Appelé quand le plan change (upgrade) ──
  window.refreshAds = function() {
    removeDiscreteBanner();
    window.initAds();
  };

})();
