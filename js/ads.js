// ── ImmoGest Ads — Monetag Direct Link ───────────────────────────
// Bannière discrète fixe en bas — TOUT LE MONDE, TOUJOURS
// Auto-injection sans dépendance à initAds()
// ─────────────────────────────────────────────────────────────────

(function() {

  var DIRECT_LINK = 'https://omg10.com/4/11144803';

  var ADS_MSGS = [
    { icon: '💰', text: 'Boostez vos revenus locatifs — offre exclusive', cta: 'Voir' },
    { icon: '🏦', text: 'Gestion financière simplifiée — essai gratuit',   cta: 'Essayer' },
    { icon: '📱', text: 'Application mobile — téléchargez maintenant',     cta: 'Télécharger' },
    { icon: '🎁', text: 'Offre spéciale pour propriétaires immobiliers',   cta: 'Découvrir' },
    { icon: '💳', text: 'Paiements en ligne sécurisés — sans frais cachés', cta: 'En savoir +' },
  ];

  function injectBanner() {
    if (document.getElementById('immogest-ad-bar')) return;

    var msg = ADS_MSGS[Math.floor(Math.random() * ADS_MSGS.length)];

    var bar = document.createElement('div');
    bar.id = 'immogest-ad-bar';
    bar.setAttribute('style', [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'height:50px',
      'z-index:99999',
      'background:rgba(15,23,42,0.95)',
      'border-top:1px solid rgba(255,255,255,0.10)',
      'display:flex',
      'align-items:center',
      'padding:0 10px 0 10px',
      'gap:8px',
      'cursor:pointer',
      'user-select:none',
      'box-shadow:0 -2px 12px rgba(0,0,0,0.3)',
      'font-family:system-ui,sans-serif'
    ].join(';'));

    bar.addEventListener('click', function(e) {
      if (e.target.id === 'immogest-ad-close') return;
      window.open(DIRECT_LINK, '_blank', 'noopener');
    });

    // Icône
    var icon = document.createElement('span');
    icon.textContent = msg.icon;
    icon.setAttribute('style', 'font-size:18px;flex-shrink:0;line-height:1;');
    bar.appendChild(icon);

    // Texte
    var txtWrap = document.createElement('div');
    txtWrap.setAttribute('style', 'flex:1;min-width:0;overflow:hidden;');
    txtWrap.innerHTML =
      '<div style="color:#f1f5f9;font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">' + msg.text + '</div>' +
      '<div style="color:#64748b;font-size:10px;margin-top:2px;line-height:1;">Sponsorisé</div>';
    bar.appendChild(txtWrap);

    // CTA
    var cta = document.createElement('a');
    cta.href = DIRECT_LINK;
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.textContent = msg.cta;
    cta.setAttribute('style', [
      'flex-shrink:0',
      'background:#3b82f6',
      'color:#fff',
      'font-size:11px',
      'font-weight:600',
      'padding:5px 10px',
      'border-radius:6px',
      'text-decoration:none',
      'white-space:nowrap',
      'line-height:1.4'
    ].join(';'));
    cta.addEventListener('click', function(e) { e.stopPropagation(); });
    bar.appendChild(cta);

    // Fermer
    var closeBtn = document.createElement('button');
    closeBtn.id = 'immogest-ad-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('style', [
      'flex-shrink:0',
      'background:none',
      'border:none',
      'color:#475569',
      'font-size:12px',
      'cursor:pointer',
      'padding:6px 4px',
      'line-height:1',
      'margin-left:2px'
    ].join(';'));
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      bar.style.display = 'none';
      // Réafficher après 3 min
      setTimeout(function() {
        var b = document.getElementById('immogest-ad-bar');
        if (b) b.style.display = 'flex';
      }, 3 * 60 * 1000);
    });
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);

    // Décaler le contenu
    var shell = document.getElementById('app-shell');
    if (shell) shell.style.paddingBottom = '54px';
  }

  // Injection automatique — pas besoin d'appeler initAds()
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(injectBanner, 1500);
    });
  } else {
    setTimeout(injectBanner, 1500);
  }

  // API publique (compatible avec l'ancien appel dans app.js)
  window.initAds   = injectBanner;
  window.refreshAds = injectBanner;

})();
