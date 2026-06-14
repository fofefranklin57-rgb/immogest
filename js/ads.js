// ── ImmoGest Ads — Monetag Direct Link ───────────────────────────
// Bannière discrète fixe en bas — TOUT LE MONDE, TOUJOURS
// Thème glassmorphism — assortie à l'interface ImmoGest
// ─────────────────────────────────────────────────────────────────

(function() {

  var DIRECT_LINK = 'https://omg10.com/4/11144803';
  var BAR_H = 56; // hauteur bannière en px

  var ADS_MSGS = [
    { icon: '💼', text: 'Gérez vos finances facilement — offre exclusive', cta: 'Découvrir' },
    { icon: '🏦', text: 'Solution bancaire pour professionnels — essai gratuit', cta: 'Essayer' },
    { icon: '📊', text: 'Boostez vos revenus locatifs dès aujourd\'hui', cta: 'Voir' },
    { icon: '🎁', text: 'Offre spéciale propriétaires immobiliers', cta: 'En profiter' },
    { icon: '💳', text: 'Paiements sécurisés sans frais cachés', cta: 'En savoir +' },
  ];

  // ── Injection CSS globale ─────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('immogest-ads-style')) return;
    var s = document.createElement('style');
    s.id = 'immogest-ads-style';
    s.textContent = [
      // Remonter le bouton IA au-dessus de la bannière
      '#ai-float-btn { bottom: ' + (BAR_H + 28) + 'px !important; }',
      // Remonter le panneau IA avec
      '#ai-chat-panel { bottom: ' + (BAR_H + 64) + 'px !important; }',
      // Promo-toast : hidden par défaut, affiché au-dessus de la bannière
      '.promo-toast { display:none; position:fixed; bottom:' + (BAR_H + 12) + 'px;',
      '  left:16px; z-index:9980; background:rgba(255,255,255,0.96);',
      '  backdrop-filter:blur(12px); border:1px solid rgba(79,142,247,0.3);',
      '  border-radius:14px; padding:14px 16px; max-width:280px;',
      '  box-shadow:0 8px 32px rgba(14,106,175,0.18); }',
      '.promo-toast.show { display:block; }',
      '.promo-toast-title { font-size:13px; font-weight:700; color:#0F172A; margin-bottom:4px; }',
      '.promo-toast-desc  { font-size:11px; color:#3D5270; margin-bottom:10px; line-height:1.4; }',
      '.promo-toast-btn   { background:#0E6AAF; color:#fff; border:none; border-radius:8px;',
      '  padding:7px 14px; font-size:12px; font-weight:600; cursor:pointer; width:100%; }',
      '.promo-toast-btn:hover { background:#0A5490; }',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ── Bannière principale ───────────────────────────────────────
  function injectBanner() {
    // Ne pas afficher les pubs aux abonnés payants
    if (typeof MONETISATION !== 'undefined' &&
        MONETISATION.plan && MONETISATION.plan !== 'gratuit') return;
    if (document.getElementById('immogest-ad-bar')) return;

    injectCSS();

    var msg = ADS_MSGS[Math.floor(Math.random() * ADS_MSGS.length)];

    var bar = document.createElement('div');
    bar.id = 'immogest-ad-bar';
    bar.setAttribute('style', [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'height:' + BAR_H + 'px',
      'z-index:9998',
      // Thème glassmorphism — assortie à la topbar ImmoGest
      'background:rgba(255,255,255,0.94)',
      'backdrop-filter:blur(14px) saturate(180%)',
      '-webkit-backdrop-filter:blur(14px) saturate(180%)',
      'border-top:1px solid rgba(79,142,247,0.28)',
      'box-shadow:0 -4px 24px rgba(14,106,175,0.12)',
      'display:flex',
      'align-items:center',
      'padding:0 16px',
      'gap:12px',
      'cursor:pointer',
      'user-select:none',
      'font-family:system-ui,sans-serif',
    ].join(';'));

    bar.addEventListener('click', function(e) {
      if (e.target.id === 'immogest-ad-close') return;
      window.open(DIRECT_LINK, '_blank', 'noopener');
    });

    // Icône
    var icon = document.createElement('span');
    icon.textContent = msg.icon;
    icon.setAttribute('style', 'font-size:20px;flex-shrink:0;line-height:1;');
    bar.appendChild(icon);

    // Texte + label Sponsorisé
    var txtWrap = document.createElement('div');
    txtWrap.setAttribute('style', 'flex:1;min-width:0;overflow:hidden;');
    txtWrap.innerHTML =
      '<div style="color:#0F172A;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3;">' + msg.text + '</div>' +
      '<div style="color:#7A90A8;font-size:10px;margin-top:3px;line-height:1;letter-spacing:.03em;">Sponsorisé</div>';
    bar.appendChild(txtWrap);

    // CTA
    var cta = document.createElement('a');
    cta.href = DIRECT_LINK;
    cta.target = '_blank';
    cta.rel = 'noopener';
    cta.textContent = msg.cta;
    cta.setAttribute('style', [
      'flex-shrink:0',
      'background:#0E6AAF',
      'color:#fff',
      'font-size:12px',
      'font-weight:600',
      'padding:7px 14px',
      'border-radius:8px',
      'text-decoration:none',
      'white-space:nowrap',
      'line-height:1.4',
      'box-shadow:0 2px 8px rgba(14,106,175,0.25)',
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
      'color:#7A90A8',
      'font-size:12px',
      'cursor:pointer',
      'padding:6px 4px',
      'line-height:1',
    ].join(';'));
    closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      bar.style.display = 'none';
      // Remettre le bouton IA à sa position normale pendant la fermeture
      var s = document.getElementById('immogest-ads-style');
      if (s) s.remove();
      // Réafficher après 3 min
      setTimeout(function() {
        if (document.getElementById('immogest-ad-bar')) {
          document.getElementById('immogest-ad-bar').style.display = 'flex';
          injectCSS(); // Remettre le CSS
        }
      }, 3 * 60 * 1000);
    });
    bar.appendChild(closeBtn);

    document.body.appendChild(bar);

    // Décaler le contenu principal
    var shell = document.getElementById('app-shell');
    if (shell) shell.style.paddingBottom = (BAR_H + 4) + 'px';
  }

  // ── Auto-injection ────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(injectBanner, 1500); });
  } else {
    setTimeout(injectBanner, 1500);
  }

  window.initAds    = injectBanner;
  window.refreshAds = injectBanner;

})();
