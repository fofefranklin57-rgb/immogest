// ── ImmoGest Ads — Monetag Direct Link ───────────────────────────
// Bannière discrète fixe en bas — TOUT LE MONDE, TOUJOURS
// Direct Link zone 11144803
// ─────────────────────────────────────────────────────────────────

(function() {

  var DIRECT_LINK = 'https://omg10.com/4/11144803';

  // Messages rotatifs pour rendre la bannière naturelle
  var ADS_MSGS = [
    { icon: '💰', text: 'Boostez vos revenus locatifs — offre exclusive', cta: 'Voir' },
    { icon: '🏦', text: 'Gestion financière simplifiée — essai gratuit',   cta: 'Essayer' },
    { icon: '📱', text: 'Application mobile — téléchargez maintenant',     cta: 'Télécharger' },
    { icon: '🎁', text: 'Offre spéciale pour propriétaires immobiliers',   cta: 'Découvrir' },
    { icon: '💳', text: 'Paiements en ligne sécurisés — sans frais cachés', cta: 'En savoir +' },
  ];

  var _bannerShown = false;

  function injectBanner() {
    if (document.getElementById('immogest-ad-bar')) return;
    _bannerShown = true;

    var msg = ADS_MSGS[Math.floor(Math.random() * ADS_MSGS.length)];

    var bar = document.createElement('div');
    bar.id = 'immogest-ad-bar';
    bar.style.cssText = [
      'position:fixed', 'bottom:0', 'left:0', 'right:0',
      'height:50px', 'z-index:9998',
      'background:rgba(15,23,42,0.93)',
      'backdrop-filter:blur(6px)',
      'border-top:1px solid rgba(255,255,255,0.08)',
      'display:flex', 'align-items:center',
      'padding:0 12px 0 10px',
      'gap:10px',
      'cursor:pointer',
      'user-select:none',
      'box-shadow:0 -2px 12px rgba(0,0,0,0.18)'
    ].join(';');

    // Click sur la barre → ouvre le lien
    bar.addEventListener('click', function(e) {
      if (e.target === closeBtn) return;
      window.open(DIRECT_LINK, '_blank', 'noopener');
    });

    // Icône
    var icon = document.createElement('span');
    icon.textContent = msg.icon;
    icon.style.cssText = 'font-size:20px;flex-shrink:0;';
    bar.appendChild(icon);

    // Texte + label "Sponsorisé"
    var txtWrap = document.createElement('div');
    txtWrap.style.cssText = 'flex:1;min-width:0;overflow:hidden;';
    txtWrap.innerHTML =
      '<div style="color:#f1f5f9;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + msg.text + '</div>' +
      '<div style="color:#64748b;font-size:10px;margin-top:1px;">Sponsorisé</div>';
    bar.appendChild(txtWrap);

    // Bouton CTA
    var cta = document.createElement('a');
    cta.href = DIRECT_LINK;
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.textContent = msg.cta;
    cta.style.cssText = [
      'flex-shrink:0',
      'background:#3b82f6',
      'color:#fff',
      'font-size:11px',
      'font-weight:600',
      'padding:5px 10px',
      'border-radius:6px',
      'text-decoration:none',
      'white-space:nowrap'
    ].join(';');
    cta.addEventListener('click', function(e) { e.stopPropagation(); });
    bar.appendChild(cta);

    // Bouton fermer
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = [
      'flex-shrink:0',
      'background:none', 'border:none',
      'color:#475569', 'font-size:11px',
      'cursor:pointer', 'padding:4px',
      'line-height:1', 'margin-left:4px'
    ].join(';');
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      bar.style.display = 'none';
      // Réafficher après 3 min
      setTimeout(function() {
        if (document.getElementById('immogest-ad-bar')) {
          document.getElementById('immogest-ad-bar').style.display = 'flex';
        }
      }, 3 * 60 * 1000);
    });
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);

    // Décaler le contenu principal pour ne pas cacher du contenu
    var shell = document.getElementById('app-shell');
    if (shell) shell.style.paddingBottom = '54px';
  }

  // ── Point d'entrée — appelé après login, TOUT LE MONDE ──
  window.initAds = function() {
    injectBanner();
  };

  // ── Appelé après upgrade — on garde la bannière quand même ──
  window.refreshAds = function() {
    injectBanner();
  };

})();
