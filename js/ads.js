// ── ImmoGest Ads — Monetag In-Page Push ──────────────────────────
// Plan gratuit  : pub chargée normalement
// Plans payants : pub chargée mais en mode discret (1 seule bannière bas de page)
// Locataires    : bannière discrète uniquement

(function() {
  function loadMonetag() {
    if (window._monetagLoaded) return;
    window._monetagLoaded = true;
    var s = document.createElement('script');
    s.dataset.zone = '11087888';
    s.src = 'https://nap5k.com/tag.min.js';
    s.async = true;
    document.body.appendChild(s);
  }

  // Attendre que la session soit prête
  window.initAds = function() {
    if (!window.SESSION) return;

    var role = SESSION.role;
    var plan = (window.MONETISATION && window.MONETISATION.plan) || 'gratuit';

    // Toujours charger Monetag (format In-Page Push est non intrusif)
    loadMonetag();

    // Pour les plans payants et locataires : injecter une seule bannière fixe discrète en bas
    if (plan !== 'gratuit') {
      injectDiscreetBanner();
    }
  };

  function injectDiscreetBanner() {
    // Vérifier qu'elle n'existe pas déjà
    if (document.getElementById('immogest-ad-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'immogest-ad-bar';
    bar.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'height:50px',
      'z-index:999',
      'background:#f8f9fa',
      'border-top:1px solid #e2e8f0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'overflow:hidden',
      'opacity:0.85'
    ].join(';');

    // Conteneur pub 320x50 (taille bannière mobile standard)
    var adSlot = document.createElement('div');
    adSlot.style.cssText = 'width:320px;height:50px;overflow:hidden;';
    bar.appendChild(adSlot);

    // Bouton fermer
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = [
      'position:absolute',
      'right:6px',
      'top:50%',
      'transform:translateY(-50%)',
      'background:none',
      'border:none',
      'color:#94a3b8',
      'font-size:12px',
      'cursor:pointer',
      'padding:4px'
    ].join(';');
    closeBtn.onclick = function() { bar.remove(); };
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);
  }
})();
