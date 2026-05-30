// ═══════════════════════════════════════════════════════════════
// MODULE PUBLICITÉS & MONÉTISATION - ImmoGest v2.1
// ═══════════════════════════════════════════════════════════════

const MonetizationModule = {
  // Configuration
  config: {
    // AdSense (Web)
    adsenseClientId: 'ca-pub-8065715770165014', // Remplacer par vrai ID
    adsenseSlots: {
      banner: '1234567890',
      sidebar: '0987654321',
      interstitial: '1122334455'
    },
    // AdMob (Mobile PWA)
    admobAppId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    admobUnits: {
      banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
      interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/WWWWWWWWWW',
      rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/QQQQQQQQQQ'
    },
    // Limites Freemium
    freemium: {
      maxImmeublesFree: 1,
      maxLocatairesFree: 10,
      maxRapportsFree: 3,
      enableAdsFree: true,
      enableExportFree: false,
      enableMultiUserFree: false,
      enableCloudSyncFree: false
    }
  },

  // État
  currentTier: 'free', // 'free', 'pro', 'enterprise'
  adsEnabled: true,
  adBlockDetected: false,
  revenueToday: 0,
  impressionsToday: 0,

  // Initialisation
  init: function() {
    this.detectAdBlock();
    this.loadCurrentTier();
    this.injectAdContainers();
    this.updateUI();
    this.trackPageViews();

    console.log('[Monetization] Module initialisé - Tier:', this.currentTier);
  },

  // Détecter AdBlock
  detectAdBlock: function() {
    return new Promise((resolve) => {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-9999px';
      document.body.appendChild(testAd);

      setTimeout(() => {
        this.adBlockDetected = testAd.offsetHeight === 0;
        testAd.remove();

        if (this.adBlockDetected) {
          console.warn('[Monetization] AdBlock détecté');
          this.showAdBlockMessage();
        }
        resolve(this.adBlockDetected);
      }, 100);
    });
  },

  // Charger le tier depuis localStorage ou backend
  loadCurrentTier: function() {
    const saved = localStorage.getItem('immogest_subscription_tier');
    if (saved) {
      this.currentTier = saved;
      this.adsEnabled = (saved === 'free');
    }

    // Vérifier les limites du tier actuel
    this.enforceTierLimits();
  },

  // Injecter les conteneurs de publicités
  injectAdContainers: function() {
    if (!this.adsEnabled || this.currentTier !== 'free') return;

    // 1. Bannière top (sous la topbar)
    const topbar = document.querySelector('.topbar');
    if (topbar && !document.getElementById('ad-banner-top')) {
      const bannerDiv = document.createElement('div');
      bannerDiv.id = 'ad-banner-top';
      bannerDiv.className = 'ad-container';
      bannerDiv.innerHTML = `
        <div class="ad-label">Publicité</div>
        <div class="ad-slot" id="adsense-banner-top" style="min-height:90px;background:var(--bg3);display:flex;align-items:center;justify-content:center;border-bottom:1px solid var(--border);">
          <span style="font-size:11px;color:var(--text3);">Espace publicitaire - <a href="#" onclick="MonetizationModule.showUpgradeModal()" style="color:var(--accent);">Passer Pro pour retirer</a></span>
        </div>
      `;
      topbar.parentNode.insertBefore(bannerDiv, topbar.nextSibling);
    }

    // 2. Sidebar ad (dans la sidebar)
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !document.getElementById('ad-sidebar')) {
      const sidebarAd = document.createElement('div');
      sidebarAd.id = 'ad-sidebar';
      sidebarAd.className = 'ad-container';
      sidebarAd.innerHTML = `
        <div class="ad-label">Publicité</div>
        <div class="ad-slot" style="padding:10px;background:var(--bg3);border-top:1px solid rgba(255,255,255,0.1);">
          <div style="width:100%;height:250px;background:linear-gradient(135deg,var(--accent),var(--green));border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center;padding:16px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:8px;">✨ Passez à ImmoGest Pro</div>
            <div style="font-size:11px;opacity:0.9;margin-bottom:12px;">Sans publicités + Fonctionnalités illimitées</div>
            <button onclick="MonetizationModule.showUpgradeModal()" style="background:#fff;color:var(--accent);border:none;padding:6px 14px;border-radius:99px;font-size:11px;font-weight:600;cursor:pointer;">Découvrir</button>
          </div>
        </div>
      `;
      const sidebarNav = sidebar.querySelector('.sidebar-nav');
      if (sidebarNav) {
        sidebarNav.appendChild(sidebarAd);
      }
    }

    // 3. Interstitial (modal pub toutes les X actions)
    this.setupInterstitialTrigger();
  },

  // Déclencher interstitial toutes les N actions
  setupInterstitialTrigger: function() {
    let actionCount = parseInt(localStorage.getItem('immogest_action_count') || '0');

    // Hook sur les actions principales
    const actions = ['savePaiement', 'saveLocataire', 'saveImmeuble', 'generateReport'];
    actions.forEach(action => {
      const original = window[action];
      if (original) {
        window[action] = function(...args) {
          actionCount++;
          localStorage.setItem('immogest_action_count', actionCount);

          // Toutes les 10 actions, afficher interstitial
          if (actionCount % 10 === 0 && MonetizationModule.currentTier === 'free') {
            MonetizationModule.showInterstitial();
          }

          return original.apply(this, args);
        };
      }
    });
  },

  // Afficher l'interstitial
  showInterstitial: function() {
    const overlay = document.createElement('div');
    overlay.id = 'ad-interstitial';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;text-align:center;position:relative;">
        <button onclick="document.getElementById('ad-interstitial').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3);">✕</button>
        <div style="font-size:13px;color:var(--text3);margin-bottom:16px;text-transform:uppercase;letter-spacing:1px;">Publicité</div>
        <div style="width:100%;height:300px;background:var(--bg3);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:20px;">
          <div style="font-size:48px;margin-bottom:12px;">🏢</div>
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px;">ImmoGest Pro</div>
          <div style="font-size:13px;color:var(--text2);padding:0 20px;">Gérez illimitément vos biens sans interruption publicitaire</div>
        </div>
        <div style="display:flex;gap:10px;flex-direction:column;">
          <button onclick="MonetizationModule.showUpgradeModal();document.getElementById('ad-interstitial').remove();" style="width:100%;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
            Voir les plans — dès 9 999 FCFA/mois
          </button>
          <button onclick="document.getElementById('ad-interstitial').remove()" style="width:100%;padding:10px;background:transparent;color:var(--text3);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;">
            Continuer avec publicités
          </button>
        </div>
        <div style="margin-top:12px;font-size:10px;color:var(--text3);">Fermeture possible dans <span id="ad-timer">5</span>s</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Compte à rebours
    let timer = 5;
    const timerInterval = setInterval(() => {
      timer--;
      const timerEl = document.getElementById('ad-timer');
      if (timerEl) timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(timerInterval);
        const closeBtn = overlay.querySelector('button[onclick*="remove()"]');
        if (closeBtn) closeBtn.style.display = 'block';
      }
    }, 1000);
  },

  // Message AdBlock
  showAdBlockMessage: function() {
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--yellow-bg);border:1px solid var(--yellow);color:var(--yellow);padding:12px 20px;border-radius:8px;font-size:12px;z-index:9999;max-width:400px;text-align:center;';
    toast.innerHTML = '⚠️ AdBlock détecté. Les publicités nous aident à maintenir ImmoGest gratuit. <a href="#" onclick="MonetizationModule.showUpgradeModal()" style="color:var(--accent);font-weight:600;">Passez Pro</a> pour une expérience sans pubs.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 8000);
  },

  // Appliquer les limites du tier
  enforceTierLimits: function() {
    const limits = this.config.freemium;

    if (this.currentTier === 'free') {
      // Limiter le nombre d'immeubles
      const immeubles = DATA.immeubles || [];
      if (immeubles.length > limits.maxImmeublesFree) {
        this.showLimitModal('immeubles', limits.maxImmeublesFree);
      }
    }
  },

  // Vérifier si une action est autorisée
  canPerformAction: function(actionType) {
    if (this.currentTier !== 'free') return true;

    const limits = this.config.freemium;

    switch (actionType) {
      case 'add_immeuble':
        const immeubles = DATA.immeubles || [];
        if (immeubles.length >= limits.maxImmeublesFree) {
          this.showUpgradeModal('Limite atteinte', `Vous avez atteint la limite de ${limits.maxImmeublesFree} immeuble(s) en version gratuite.`);
          return false;
        }
        return true;

      case 'add_locataire':
        const locataires = (DATA.locataires || []).filter(l => l.s !== 'libre');
        if (locataires.length >= limits.maxLocatairesFree) {
          this.showUpgradeModal('Limite atteinte', `Vous avez atteint la limite de ${limits.maxLocatairesFree} locataire(s) en version gratuite.`);
          return false;
        }
        return true;

      case 'export_pdf':
      case 'export_excel':
        this.showUpgradeModal("Fonctionnalité Pro", "L'export est réservé aux abonnés Pro.");
        return false;

      case 'multi_user':
        this.showUpgradeModal("Fonctionnalité Pro", "La gestion multi-utilisateurs est réservée aux abonnés Pro.");
        return false;

      default:
        return true;
    }
  },

  // Mettre à jour l'interface selon le tier
  updateUI: function() {
    // Masquer/afficher les publicités
    const adContainers = document.querySelectorAll('.ad-container');
    adContainers.forEach(container => {
      container.style.display = (this.currentTier === 'free' && this.adsEnabled) ? 'block' : 'none';
    });

    // Mettre à jour le badge dans la topbar
    const tierBadge = document.getElementById('tier-badge');
    if (tierBadge) {
      tierBadge.innerHTML = this.currentTier === 'free' 
        ? '<span class="badge badge-yellow">FREE</span>'
        : '<span class="badge badge-green">PRO</span>';
    }
  },

  // Changer de tier
  setTier: function(tier) {
    this.currentTier = tier;
    this.adsEnabled = (tier === 'free');
    localStorage.setItem('immogest_subscription_tier', tier);
    this.updateUI();

    // Recharger la page pour appliquer les changements
    showToast(`Passage à la version ${tier.toUpperCase()} effectué !`, 'success');
    setTimeout(() => location.reload(), 1500);
  },

  // Tracking simple (analytics)
  trackPageViews: function() {
    let views = parseInt(localStorage.getItem('immogest_page_views') || '0');
    views++;
    localStorage.setItem('immogest_page_views', views);

    // Toutes les 50 vues, suggérer l'upgrade
    if (views % 50 === 0 && this.currentTier === 'free') {
      setTimeout(() => {
        this.showUpgradeModal('Vous utilisez beaucoup ImmoGest !', 'Passez à Pro pour une expérience optimale sans limites ni publicités.');
      }, 3000);
    }
  },

  // Afficher le modal de mise à niveau
  showUpgradeModal: function(title, message) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay open';
    overlay.style.zIndex = '10001';
    overlay.innerHTML = `
      <div class="modal" style="max-width:520px;">
        <h3>🚀 ${title || 'Passez à ImmoGest Pro'}</h3>
        <div style="margin-bottom:20px;">
          <p style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:16px;">
            ${message || 'Débloquez tout le potentiel de votre gestion immobilière.'}
          </p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
            <!-- Plan Free -->
            <div style="border:2px solid var(--border);border-radius:12px;padding:16px;text-align:center;opacity:0.7;">
              <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:8px;">FREE</div>
              <div style="font-size:24px;font-weight:800;margin-bottom:4px;">0 FCFA</div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:12px;">/mois</div>
              <ul style="text-align:left;font-size:11px;color:var(--text2);list-style:none;padding:0;margin:0;gap:6px;display:flex;flex-direction:column;">
                <li>✓ 2 immeubles max</li>
                <li>✓ 10 locataires max</li>
                <li>✓ Publicités incluses</li>
                <li>✗ Export PDF/Excel</li>
                <li>✗ Multi-utilisateurs</li>
              </ul>
            </div>

            <!-- Plan Pro -->
            <div style="border:2px solid var(--accent);border-radius:12px;padding:16px;text-align:center;background:rgba(14,106,175,0.04);position:relative;overflow:hidden;">
              <div style="position:absolute;top:0;right:0;background:var(--accent);color:#fff;font-size:9px;font-weight:700;padding:3px 10px;border-bottom-left-radius:8px;">POPULAIRE</div>
              <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:8px;">PRO</div>
              <div style="font-size:24px;font-weight:800;margin-bottom:4px;color:var(--accent);">2 990</div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:12px;">FCFA/mois</div>
              <ul style="text-align:left;font-size:11px;color:var(--text2);list-style:none;padding:0;margin:0;gap:6px;display:flex;flex-direction:column;">
                <li style="color:var(--green);font-weight:600;">✓ Immeubles illimités</li>
                <li style="color:var(--green);font-weight:600;">✓ Locataires illimités</li>
                <li style="color:var(--green);font-weight:600;">✓ Sans publicités</li>
                <li style="color:var(--green);font-weight:600;">✓ Export PDF/Excel</li>
                <li style="color:var(--green);font-weight:600;">✓ Multi-utilisateurs</li>
              </ul>
            </div>
          </div>

          <div style="background:var(--bg3);border-radius:8px;padding:12px;margin-bottom:16px;">
            <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:8px;">Méthodes de paiement</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onclick="MonetizationModule.initiatePayment('stripe')" style="flex:1;padding:10px;background:#635BFF;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                💳 Stripe
              </button>
              <button onclick="MonetizationModule.initiatePayment('paypal')" style="flex:1;padding:10px;background:#003087;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                🅿️ PayPal
              </button>
              <button onclick="MonetizationModule.initiatePayment('mobile')" style="flex:1;padding:10px;background:var(--green);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
                📱 Mobile Money
              </button>
            </div>
          </div>

          <div style="font-size:10px;color:var(--text3);text-align:center;">
            Paiement sécurisé SSL. Annulation à tout moment. Facturation mensuelle.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Plus tard</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  // Initier le paiement (simulation)
  initiatePayment: function(provider) {
    const providers = {
      stripe: {
        name: 'Stripe',
        url: 'https://buy.stripe.com/test_xxxxxxxxxx', // Remplacer par vrai lien
        color: '#635BFF'
      },
      paypal: {
        name: 'PayPal',
        url: 'https://www.paypal.com/paypalme/xxxxxx', // Remplacer
        color: '#003087'
      },
      mobile: {
        name: 'Mobile Money',
        url: '#mobile-money-payment',
        color: '#1A6B45'
      }
    };

    const p = providers[provider];

    if (provider === 'mobile') {
      // Modal Mobile Money
      this.showMobileMoneyModal();
      return;
    }

    // Ouvrir le lien de paiement
    showToast(`Redirection vers ${p.name}...`, 'info');

    // Simulation - en production, rediriger vers vrai lien
    setTimeout(() => {
      // Simuler succès paiement
      this.simulatePaymentSuccess(provider);
    }, 2000);
  },

  // Modal Mobile Money
  showMobileMoneyModal: function() {
    const overlay = document.querySelector('.overlay.open');
    if (overlay) overlay.remove();

    const newOverlay = document.createElement('div');
    newOverlay.className = 'overlay open';
    newOverlay.style.zIndex = '10002';
    newOverlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <h3>📱 Paiement Mobile Money</h3>
        <div style="margin-bottom:20px;">
          <div style="display:flex;gap:10px;margin-bottom:16px;">
            <button onclick="MonetizationModule.selectMobileProvider('mtn')" id="mm-mtn" class="pay-mode-btn selected" style="flex:1;padding:12px;border:2px solid var(--border);border-radius:8px;cursor:pointer;text-align:center;background:var(--bg3);">
              <div style="font-size:20px;margin-bottom:4px;">📱</div>
              <div style="font-size:12px;font-weight:600;">MTN Mobile Money</div>
            </button>
            <button onclick="MonetizationModule.selectMobileProvider('orange')" id="mm-orange" class="pay-mode-btn" style="flex:1;padding:12px;border:2px solid var(--border);border-radius:8px;cursor:pointer;text-align:center;background:var(--bg3);">
              <div style="font-size:20px;margin-bottom:4px;">🟠</div>
              <div style="font-size:12px;font-weight:600;">Orange Money</div>
            </button>
          </div>

          <div class="form-group">
            <label>Numéro de téléphone</label>
            <input type="tel" id="mm-phone" placeholder="6XX XXX XXX" style="width:100%;padding:10px;border:1px solid var(--border2);border-radius:6px;font-size:14px;">
          </div>

          <div style="background:var(--yellow-bg);border:1px solid var(--yellow);border-radius:6px;padding:10px;margin-top:12px;font-size:11px;color:var(--yellow);">
            ⚠️ Vous allez recevoir une demande de validation sur votre téléphone. Confirmez le paiement pour activer votre abonnement ImmoGest.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.overlay').remove()">Annuler</button>
          <button class="btn btn-primary" onclick="MonetizationModule.processMobilePayment()">Valider le paiement</button>
        </div>
      </div>
    `;
    document.body.appendChild(newOverlay);
  },

  selectedMobileProvider: 'mtn',
  selectMobileProvider: function(provider) {
    this.selectedMobileProvider = provider;
    document.querySelectorAll('.pay-mode-btn').forEach(btn => {
      btn.style.borderColor = 'var(--border)';
      btn.style.background = 'var(--bg3)';
    });
    const selected = document.getElementById('mm-' + provider);
    if (selected) {
      selected.style.borderColor = 'var(--accent)';
      selected.style.background = 'rgba(14,106,175,0.08)';
    }
  },

  processMobilePayment: function() {
    const phone = document.getElementById('mm-phone')?.value;
    if (!phone || phone.length <9) {
      showToast('Veuillez entrer un numéro valide', 'error');
      return;
    }

    showToast(`Demande envoyée au ${this.selectedMobileProvider.toUpperCase()}...`, 'info');

    // Simulation
    setTimeout(() => {
      this.simulatePaymentSuccess('mobile_' + this.selectedMobileProvider);
    }, 3000);
  },

  // Simuler succès paiement (à remplacer par webhook réel)
  simulatePaymentSuccess: function(provider) {
    const overlay = document.querySelector('.overlay.open');
    if (overlay) overlay.remove();

    // Sauvegarder l'abonnement
    const subscription = {
      tier: 'pro',
      provider: provider,
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      transactionId: 'TXN-' + Date.now()
    };
    localStorage.setItem('immogest_subscription', JSON.stringify(subscription));

    // Mettre à jour le tier
    this.setTier('pro');

    // Notification
    showToast('🎉 Félicitations ! Vous êtes maintenant Pro !', 'success');

    // Notification push si activée
    if (typeof PushModule !== 'undefined' && PushModule.isSubscribed) {
      PushModule.sendLocalNotification(
        '✨ ImmoGest Pro activé !',
        'Votre abonnement Pro est actif. Profitez de toutes les fonctionnalités sans limites.',
        { type: 'subscription', tier: 'pro' }
      );
    }
  },

  // Vérifier si l'abonnement est valide
  isSubscriptionValid: function() {
    if (this.currentTier === 'free') return false;

    const sub = JSON.parse(localStorage.getItem('immogest_subscription') || '{}');
    if (!sub.expiryDate) return false;

    return new Date(sub.expiryDate) > new Date();
  },

  // Afficher le modal de limite atteinte
  showLimitModal: function(resource, limit) {
    this.showUpgradeModal(
      'Limite gratuite atteinte',
      `Vous avez atteint la limite de ${limit} ${resource} en version gratuite. Passez à Pro pour illimiter.`
    );
  }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => MonetizationModule.init(), 2500);
});


/* ═══════════════════════════════════════════════════════════════
   MONÉTISATION & PUBLICITÉS v2.1
   Système Freemium - Pubs + Abonnements
   ═══════════════════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════════
// ██  CONFIGURATION ADSENSE — À PERSONNALISER  ██
// ══════════════════════════════════════════════════════════════
const ADSENSE_CONFIG = {
  clientId:  'ca-pub-8065715770165014',  // ← ton Publisher ID
  // Ad Unit IDs — créer dans AdSense > Annonces > Par bloc d'annonce
  slots: {
    banner:    '',           // ID bannière responsive (FREE) — à créer
    inArticle: '2449818958', // In-article — STARTER/PRO discret
    sidebar:   '',           // optionnel
  },
  // Auto Ads : Google place automatiquement (plus simple, recommandé pour FREE)
  autoAds: true
};
// Pour ajouter les IDs : AdSense → Annonces → Par bloc d'annonce → copier l'ID numérique
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// ██  CONFIGURATION PAIEMENT IMMOGEST — À PERSONNALISER  ██
// ══════════════════════════════════════════════════════════════
// Ces numéros sont affichés aux clients qui veulent payer leur
// abonnement ImmoGest. C'est TON compte où tu reçois l'argent.
// (Ce n'est PAS les numéros du cabinet — ceux-là sont dans
//  Paramètres > Mobile Money et servent aux loyers locataires)
// ══════════════════════════════════════════════════════════════
const IMMOGEST_PAIEMENT = {
  mtn:    '6 73 95 00 19',              // MTN Mobile Money
  orange: '6 90 40 99 29',             // Orange Money
  wave:   '',                          // Wave (pas encore disponible)
  whatsapp: '237690409929',            // WhatsApp (numéro Orange sans +/espace)
  telephone: '+237 690 40 99 29',      // Numéro affiché (WhatsApp Orange)
  email: 'fofefranklin57@gmail.com',   // Email de contact
  nom:   'ImmoGest Cameroun'           // Nom affiché dans les instructions
};
// ══════════════════════════════════════════════════════════════

// ── CONFIGURATION MONÉTISATION ──
// ═══════════════════════════════════════════════════════════
// PLANS IMMOGEST — 4 niveaux
// ═══════════════════════════════════════════════════════════
const PLANS = {
  gratuit: {
    label: 'Gratuit', price: 0,
    immeubles: 1, locataires: 10, utilisateurs: 2,
    rapports_word_mois: 1, rapports_pdf: true,
    fiche_suivi: true, relances_mois: 3,
    ia: false, ia_msgs_jour: 0,
    export: false, support: 'email',
    ads: true
  },
  starter: {
    label: 'Starter', price: 9999,
    immeubles: 3, locataires: 50, utilisateurs: 5,
    rapports_word_mois: 999, rapports_pdf: true,
    fiche_suivi: true, relances_mois: 999,
    ia: true, ia_msgs_jour: 10,
    export: false, support: 'email',
    ads: false
  },
  pro: {
    label: 'Pro', price: 19999,
    immeubles: 10, locataires: 999, utilisateurs: 15,
    rapports_word_mois: 999, rapports_pdf: true,
    fiche_suivi: true, relances_mois: 999,
    ia: true, ia_msgs_jour: 999,
    export: true, support: 'prioritaire',
    ads: false
  },
  entreprise: {
    label: 'Entreprise', price: 29999,
    immeubles: 999, locataires: 999, utilisateurs: 999,
    rapports_word_mois: 999, rapports_pdf: true,
    fiche_suivi: true, relances_mois: 999,
    ia: true, ia_msgs_jour: 999,
    export: true, support: 'dédié',
    ads: false
  }
};

const MONETISATION = {
  version: '3.0',
  plan: 'gratuit', // 'gratuit' | 'starter' | 'pro' | 'entreprise'
  trialEnd: null,
  usage: {
    rapports_word_ce_mois: 0,
    relances_ce_mois: 0,
    ia_msgs_aujourd_hui: 0,
    last_reset_day: null,
    last_reset_month: null
  },
  pricing: {
    gratuit:    { mensuel: 0,     annuel: 0      },
    starter:    { mensuel: 9999,  annuel: 99900  },
    pro:        { mensuel: 19999, annuel: 199900 },
    entreprise: { mensuel: 29999, annuel: 299900 }
  }
};

// ── Obtenir le plan actif ──
function getPlan() {
  return PLANS[MONETISATION.plan] || PLANS.gratuit;
}

// ── Vérifier une limite ──
function checkLimit(type, currentCount) {
  const plan = getPlan();
  const limits = {
    immeubles:       { max: plan.immeubles,          label: 'immeuble(s)' },
    locataires:      { max: plan.locataires,         label: 'locataire(s)' },
    utilisateurs:    { max: plan.utilisateurs,       label: 'utilisateur(s)' },
    rapports_word:   { max: plan.rapports_word_mois, label: 'rapport(s) Word ce mois' },
    relances:        { max: plan.relances_mois,      label: 'relance(s) ce mois' },
    ia_msgs:         { max: plan.ia_msgs_jour,       label: 'message(s) IA aujourd\'hui' }
  };
  const l = limits[type];
  if (!l) return { allowed: true };
  const allowed = currentCount < l.max;
  const remaining = Math.max(0, l.max - currentCount);
  const percent = l.max > 0 ? (currentCount / l.max) * 100 : 0;
  return { allowed, limit: l.max, current: currentCount, remaining, percent, label: l.label };
}

// ── Vérifier accès feature ──
function canFeature(feature) {
  const plan = getPlan();
  switch(feature) {
    case 'rapport_word': return plan.rapports_word_mois > 0;
    case 'rapport_pdf':  return plan.rapports_pdf;
    case 'fiche_suivi':  return plan.fiche_suivi;
    case 'relances':     return plan.relances_mois > 0;
    case 'ia':           return plan.ia;
    case 'export':       return plan.export;
    default: return true;
  }
}

// ── Bloquer avec message upgrade ──
function requirePlan(feature, minPlan) {
  if (canFeature(feature)) return true;
  const planLabel = PLANS[minPlan] ? PLANS[minPlan].label : 'Starter';
  showUpgradePrompt(feature, planLabel);
  return false;
}

function showUpgradePrompt(feature, planRequired) {
  const msgs = {
    rapport_word: 'Les rapports Word sont disponibles dès le plan Gratuit (1/mois) ou illimités en Starter.',
    ia:           'L\'assistant IA est disponible à partir du plan Starter (10 msgs/jour) ou illimité en Pro.',
    export:       'L\'export de données est disponible à partir du plan Pro.',
    relances:     'Les relances illimitées sont disponibles à partir du plan Starter.'
  };
  const msg = msgs[feature] || `Cette fonctionnalité nécessite le plan ${planRequired}.`;
  showToast('🔒 ' + msg, 'warning');
  setTimeout(() => showUpgradeModal(), 800);
}

// Réinitialiser compteurs mensuels/journaliers
function _resetUsageCounters() {
  const now = new Date();
  const day   = now.toDateString();
  const month = now.getMonth() + '-' + now.getFullYear();
  if (MONETISATION.usage.last_reset_day !== day) {
    MONETISATION.usage.ia_msgs_aujourd_hui = 0;
    MONETISATION.usage.last_reset_day = day;
  }
  if (MONETISATION.usage.last_reset_month !== month) {
    MONETISATION.usage.rapports_word_ce_mois = 0;
    MONETISATION.usage.relances_ce_mois = 0;
    MONETISATION.usage.last_reset_month = month;
  }
  saveMonetisation();
}

// ── INITIALISATION ──
function initMonetisation() {
  // Charger depuis localStorage
  const saved = localStorage.getItem('immogest_monetisation');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      MONETISATION.plan  = data.plan  || 'gratuit';
      MONETISATION.usage = data.usage || MONETISATION.usage;
    } catch(e) {}
  }

  // Vérifier abonnement depuis Supabase si connecté
  if (SESSION && SESSION.username) {
    _sb.from('abonnements').select('plan,statut,date_fin').eq('user_id', SESSION.username).single()
      .then(({ data }) => {
        if (data && data.statut === 'actif') {
          const fin = data.date_fin ? new Date(data.date_fin) : null;
          if (!fin || fin > new Date()) {
            MONETISATION.plan = data.plan || 'gratuit';
            saveMonetisation();
            applyPlan();
            updatePlanBadge();
          }
        }
      }).catch(() => {});
  }

  // Réinitialiser compteurs
  _resetUsageCounters();

  // Appliquer le plan
  applyPlan();

  // Publicités uniquement en gratuit
  if (isFreePlan()) {
    _applyAdsStrategy('gratuit');
    setTimeout(() => showPromoToast(), 30000);
  }

  console.log('[Monetisation] Initialisé - Plan:', MONETISATION.plan);
}

function saveMonetisation() {
  localStorage.setItem('immogest_monetisation', JSON.stringify({
    plan: MONETISATION.plan,
    trialEnd: MONETISATION.trialEnd,
    usage: MONETISATION.usage
  }));
}

// ── GESTION DES PLANS ──
function isFreePlan()       { return MONETISATION.plan === 'gratuit'; }
function isStarterPlan()    { return MONETISATION.plan === 'starter'; }
function isProPlan()        { return MONETISATION.plan === 'pro' || MONETISATION.plan === 'entreprise'; }
function isBusinessPlan()   { return MONETISATION.plan === 'pro'; }
function isEnterprisePlan() { return MONETISATION.plan === 'entreprise'; }
function isTrialActive()    { return false; } // Trial supprimé — plans directs

function applyPlan() {
  const badge = document.getElementById('current-plan-badge');
  if (badge) {
    const planClass = MONETISATION.plan === 'gratuit'    ? 'plan-free'
      : MONETISATION.plan === 'starter'    ? 'plan-starter'
      : MONETISATION.plan === 'pro'        ? 'plan-pro'
      : 'plan-enterprise';
    const planLabel = MONETISATION.plan === 'gratuit'    ? 'FREE'
      : MONETISATION.plan === 'starter'   ? 'STARTER'
      : MONETISATION.plan === 'pro'       ? 'PRO'
      : 'AGENCE';
    badge.className = 'plan-badge ' + planClass;
    badge.textContent = planLabel;
  }

  // Appliquer la stratégie publicitaire selon le plan
  _applyAdsStrategy(MONETISATION.plan);

  // Mettre à jour le badge dans la topbar
  updatePlanBadge();
}

function updatePlanBadge() {
  var badge = document.getElementById('topbar-plan-badge');
  if (!badge) return;

  // Masquer pour locataire / propriétaire
  if (typeof SESSION !== 'undefined' && SESSION &&
      (SESSION.role === 'locataire' || SESSION.role === 'proprietaire')) {
    badge.style.visibility = 'hidden';
    return;
  }

  var plan = (typeof MONETISATION !== 'undefined') ? MONETISATION.plan : 'gratuit';

  var planLabel = plan === 'starter'   ? 'STARTER'
                : plan === 'pro'       ? 'PRO'
                : plan === 'entreprise' ? 'AGENCE'
                : 'FREE ▲';
  var planClass = plan === 'starter'    ? 'plan-starter'
                : plan === 'pro'        ? 'plan-pro'
                : plan === 'entreprise' ? 'plan-enterprise'
                : 'plan-free';

  badge.className     = 'plan-badge ' + planClass;
  badge.textContent   = planLabel;
  badge.style.visibility = 'visible';
  badge.style.display    = 'inline-flex';
  badge.title = (plan === 'gratuit')
    ? 'Plan FREE — Cliquez pour voir les offres'
    : 'Abonnement ' + planLabel + ' actif';
}

// ── PUBLICITÉS ──
// ── AdSense reel — ca-pub-8065715770165014
var _adsenseLoaded = false;
function _loadAdsenseScript(cb) {
  if (_adsenseLoaded) { if (cb) cb(); return; }
  if (document.querySelector('script[data-adsense]')) { _adsenseLoaded=true; if (cb) cb(); return; }
  var s=document.createElement('script');
  s.async=true; s.setAttribute('data-adsense','1'); s.setAttribute('crossorigin','anonymous');
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+ADSENSE_CONFIG.clientId;
  s.onload=function(){ _adsenseLoaded=true; if(cb) cb(); };
  s.onerror=function(){ console.warn('[AdSense] Bloque (AdBlock ?)'); };
  document.head.appendChild(s);
}

function _createAdUnit(id, slot, format, fullWidth, isInArticle) {
  var el=document.getElementById(id); if (!el) return;
  el.innerHTML='';
  var ins=document.createElement('ins');
  ins.className='adsbygoogle';
  ins.style.cssText = isInArticle ? 'display:block;text-align:center;' : 'display:block;';
  ins.setAttribute('data-ad-client', ADSENSE_CONFIG.clientId);
  if (slot) ins.setAttribute('data-ad-slot', slot);
  if (isInArticle) {
    ins.setAttribute('data-ad-layout', 'in-article');
    ins.setAttribute('data-ad-format', 'fluid');
  } else {
    ins.setAttribute('data-ad-format', format||'auto');
    if (fullWidth) ins.setAttribute('data-full-width-responsive','true');
  }
  el.appendChild(ins);
  try { (window.adsbygoogle=window.adsbygoogle||[]).push({}); } catch(e) {}
}

function _applyAdsStrategy(plan) {
  if (plan==='gratuit') {
    _loadAdsenseScript(function() {
      if (ADSENSE_CONFIG.autoAds) {
        try { (window.adsbygoogle=window.adsbygoogle||[]).push({
          google_ad_client: ADSENSE_CONFIG.clientId, enable_page_level_ads: true
        }); } catch(e) {}
      }
    });
    _scheduleInterstitiel();
  } else if (plan==='starter'||plan==='pro') {
    _removeAutoAds();
    if (ADSENSE_CONFIG.slots.inArticle) _loadAdsenseScript(null);
  } else {
    _removeAutoAds(); _removeAdsenseScript();
  }
}
function _removeAdsenseScript() { var s=document.querySelector('script[data-adsense]'); if(s){s.remove();_adsenseLoaded=false;} }
function _removeAutoAds() { document.querySelectorAll('ins.adsbygoogle').forEach(function(el){el.remove();}); }
function _scheduleInterstitiel() {
  var today=new Date().toDateString();
  if (localStorage.getItem('immogest_inter_day')!==today) {
    localStorage.setItem('immogest_inter_day',today);
    localStorage.setItem('immogest_inter_count','0');
  }
  var count=parseInt(localStorage.getItem('immogest_inter_count')||'0');
  if (count>=2) return;
  setTimeout(function() {
    if (!isFreePlan()) return;
    showInterstitial();
    localStorage.setItem('immogest_inter_count',String(count+1));
  }, 3*60*1000);
}

// Interstitielle
function showInterstitial(trigger = 'action') {
  if (!isFreePlan()) return false;
  if (MONETISATION.usage.interstitials_today >= MONETISATION.ads.interstitielle_max_jour) return false;

  const inter = document.getElementById('ad-interstitial');
  if (!inter) return false;

  MONETISATION.usage.interstitials_today++;
  saveMonetisation();

  inter.classList.add('open');

  // Timer 5 secondes
  let seconds = 5;
  const timerEl = document.getElementById('ad-inter-timer');
  const timer = setInterval(() => {
    seconds--;
    if (timerEl) timerEl.textContent = seconds + 's';
    if (seconds <= 0) {
      clearInterval(timer);
      if (timerEl) timerEl.textContent = '✕';
    }
  }, 1000);

  // Auto-close après 8s
  setTimeout(() => closeInterstitial(), 8000);

  return true;
}

function closeInterstitial() {
  const inter = document.getElementById('ad-interstitial');
  if (inter) inter.classList.remove('open');
}

// Injecter AdSense dans #content apres chaque renderCurrent()
function injectAdsInContent() {
  var plan=(typeof MONETISATION!=='undefined')?MONETISATION.plan:'gratuit';
  if (plan==='entreprise') return;
  var content=document.getElementById('content'); if (!content) return;
  content.querySelectorAll('.adsense-injected').forEach(function(el){el.remove();});

  if (plan==='gratuit' && ADSENSE_CONFIG.slots.banner) {
    var topAd=document.createElement('div');
    topAd.className='adsense-injected'; topAd.id='ad-slot-top';
    topAd.style.cssText='margin:0 0 12px 0;text-align:center;min-height:90px;';
    content.insertBefore(topAd, content.firstChild);
    _loadAdsenseScript(function(){_createAdUnit('ad-slot-top',ADSENSE_CONFIG.slots.banner,'horizontal',true);});
    var botAd=document.createElement('div');
    botAd.className='adsense-injected'; botAd.id='ad-slot-bottom';
    botAd.style.cssText='margin:12px 0 0 0;text-align:center;min-height:90px;';
    content.appendChild(botAd);
    _loadAdsenseScript(function(){_createAdUnit('ad-slot-bottom',ADSENSE_CONFIG.slots.banner,'horizontal',true);});
  } else if ((plan==='starter'||plan==='pro') && ADSENSE_CONFIG.slots.inArticle) {
    var midAd=document.createElement('div');
    midAd.className='adsense-injected'; midAd.id='ad-slot-native';
    midAd.style.cssText='margin:16px 0;';
    var kids=Array.from(content.children);
    var mid=Math.max(1,Math.floor(kids.length/2));
    if (kids[mid]) content.insertBefore(midAd,kids[mid]); else content.appendChild(midAd);
    _loadAdsenseScript(function(){_createAdUnit('ad-slot-native',ADSENSE_CONFIG.slots.inArticle,'fluid',false,true);});
  }
}

// Portail locataire/proprietaire — pub discrete
function injectAdPortail(containerId) {
  var plan=(typeof MONETISATION!=='undefined')?MONETISATION.plan:'gratuit';
  if (plan==='entreprise') return;
  var slot=plan==='gratuit'?(ADSENSE_CONFIG.slots.banner||ADSENSE_CONFIG.slots.inArticle):ADSENSE_CONFIG.slots.inArticle;
  if (!slot) return;
  var container=document.getElementById(containerId); if (!container) return;
  var adDiv=document.createElement('div');
  adDiv.style.cssText='margin:12px auto;text-align:center;';
  container.appendChild(adDiv);
  _loadAdsenseScript(function() {
    var ins=document.createElement('ins');
    ins.className='adsbygoogle'; ins.style.display='block';
    ins.setAttribute('data-ad-client',ADSENSE_CONFIG.clientId);
    ins.setAttribute('data-ad-slot',slot);
    ins.setAttribute('data-ad-format',plan==='gratuit'?'auto':'fluid');
    ins.setAttribute('data-full-width-responsive','true');
    adDiv.appendChild(ins);
    try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){}
  });
}

// Récompense vidéo
function showRewardAd(feature) {
  const overlay = document.getElementById('reward-overlay');
  if (overlay) overlay.classList.add('open');
  window._rewardFeature = feature;
}

function closeRewardAd() {
  const overlay = document.getElementById('reward-overlay');
  if (overlay) overlay.classList.remove('open');
  window._rewardFeature = null;
}

function playRewardAd() {
  if (MONETISATION.usage.reward_ads_today >= 3) {
    showToast('Limite journalière atteinte. Revenez demain !');
    closeRewardAd();
    return;
  }

  // Simuler la vidéo
  const btn = document.querySelector('.reward-btn');
  if (btn) {
    btn.textContent = '⏳ Lecture en cours...';
    btn.disabled = true;
  }

  setTimeout(() => {
    MONETISATION.usage.reward_ads_today++;
    saveMonetisation();

    // Débloquer la fonctionnalité temporairement
    if (window._rewardFeature) {
      window._rewardUnlocked = {
        feature: window._rewardFeature,
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24h
      };
      showToast('✅ Fonctionnalité débloquée pour 24h !');
    }

    closeRewardAd();
    if (btn) {
      btn.textContent = '▶ Regarder la vidéo';
      btn.disabled = false;
    }
  }, 3000);
}

function isRewardUnlocked(feature) {
  if (!window._rewardUnlocked) return false;
  if (window._rewardUnlocked.feature !== feature) return false;
  if (Date.now() > window._rewardUnlocked.expires) {
    window._rewardUnlocked = null;
    return false;
  }
  return true;
}

// ── LIMITES FREEMIUM ──
function checkLimit(type, currentCount) {
  // Choisir les limites selon le plan actif
  const limits = isBusinessPlan() ? MONETISATION.limits_business : MONETISATION.limits;
  let limit = null;
  let label = '';

  switch(type) {
    case 'immeubles': limit = limits.immeubles_max; label = 'immeubles'; break;
    case 'locataires': limit = limits.locataires_max; label = 'locataires'; break;
    case 'rapports_pdf': limit = limits.rapports_pdf_mois; label = 'rapports PDF ce mois'; break;
    case 'utilisateurs': limit = limits.utilisateurs; label = 'utilisateurs'; break;
  }

  if (limit === null) return { allowed: true };

  const remaining = limit - currentCount;
  const percent = (currentCount / limit) * 100;

  return {
    allowed: remaining > 0 || isProPlan() || isEnterprisePlan(),
    limit,
    current: currentCount,
    remaining: Math.max(0, remaining),
    percent,
    label
  };
}

function showLimitWarning(check) {
  if (check.percent >= 80) {
    const msg = check.remaining === 0 
      ? `⚠️ Limite atteinte ! Passez à Pro pour illimité.`
      : `⚠️ Plus que ${check.remaining} ${check.label} restants.`;
    showToast(msg, check.remaining === 0 ? 'error' : 'warning');
  }
}

function renderUsageCounter(type, current, limit) {
  const remaining = limit - current;
  const percent = (current / limit) * 100;
  const klass = percent >= 90 ? 'usage-counter danger' : 'usage-counter';
  return `<span class="${klass}">${current}/${limit}</span>`;
}

// ── PAYWALL & CONVERSION ──
function showUpgradeModal() {
  // Le modal d'upgrade ne concerne pas les locataires ni les proprios
  if (typeof SESSION !== 'undefined' && SESSION &&
      (SESSION.role === 'locataire' || SESSION.role === 'proprietaire')) return;
  var modal = document.getElementById('modal-upgrade');
  if (!modal) { console.warn('[ImmoGest] modal-upgrade introuvable'); return; }

  // Injecter le numéro de contact depuis IMMOGEST_PAIEMENT
  var contactEl = document.getElementById('upgrade-modal-contact');
  if (contactEl && typeof IMMOGEST_PAIEMENT !== 'undefined') {
    contactEl.innerHTML =
      '💳 Paiement par MTN MoMo · Orange Money · Virement &nbsp;·&nbsp; ' +
      'Contactez-nous au <strong>' + IMMOGEST_PAIEMENT.telephone + '</strong>';
  }

  // Mettre à jour le badge du plan actuel
  var currentBadge = document.getElementById('current-plan-badge');
  if (currentBadge && typeof MONETISATION !== 'undefined') {
    var p = MONETISATION.plan;
    currentBadge.className = 'plan-badge ' +
      (p === 'starter' ? 'plan-starter' : p === 'pro' ? 'plan-pro' :
       p === 'entreprise' ? 'plan-enterprise' : 'plan-free');
    currentBadge.textContent =
      p === 'starter' ? 'STARTER' : p === 'pro' ? 'PRO' :
      p === 'entreprise' ? 'AGENCE' : 'FREE';
  }

  modal.classList.add('open');
  console.log('[Monetisation] Upgrade modal ouvert — plan:', MONETISATION.plan);
}

function showPaywall(message, feature) {
  const content = document.getElementById('content');
  const paywall = document.createElement('div');
  paywall.className = 'paywall-card';
  paywall.innerHTML = `
    <div class="paywall-title">🔒 Fonctionnalité Pro</div>
    <div class="paywall-desc">${message}</div>
    <div style="display:flex;gap:8px;justify-content:center;">
      <button class="paywall-btn" onclick="showUpgradeModal()">🚀 Passer à Pro</button>
      <button class="btn btn-ghost" onclick="showRewardAd('${feature}')">🎁 Regarder une pub</button>
    </div>
  `;
  content.insertBefore(paywall, content.firstChild);
}

function showPromoToast() {
  if (!isFreePlan()) return;
  const toast = document.getElementById('promo-toast');
  if (toast) toast.classList.add('show');

  // Auto-hide après 15s
  setTimeout(() => hidePromoToast(), 15000);
}

function hidePromoToast() {
  const toast = document.getElementById('promo-toast');
  if (toast) toast.classList.remove('show');
}

// ── PAIEMENT ──
let selectedPaymentMethod = 'mtn';
let selectedPlan = 'pro';

function selectPaymentMethod(el, method) {
  document.querySelectorAll('.payment-method').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  selectedPaymentMethod = method;
  // Afficher/cacher le champ téléphone selon le mode
  var phoneRow = document.querySelector('#pay-phone')?.closest('.form-row');
  if (phoneRow) {
    phoneRow.style.display = (method === 'mtn' || method === 'orange') ? '' : 'none';
  }
  calculateTotal();
}

function startSubscription(plan) {
  selectedPlan = plan;
  const planInfo = PLANS[plan];
  if (!planInfo) return;

  // ── Si CinetPay est configuré → paiement automatique direct ──
  if (typeof cinetpayEstConfigured === 'function' && cinetpayEstConfigured()) {
    // Fermer le modal upgrade et lancer CinetPay directement
    var upgradeModal = document.getElementById('modal-upgrade');
    if (upgradeModal) upgradeModal.classList.remove('open');
    var duree = 1; // durée par défaut 1 mois — CinetPay affiche les options
    payerAvecCinetPay(plan, duree);
    return;
  }

  // ── Sinon → flux manuel (MoMo + WhatsApp) ──
  const modal = document.getElementById('modal-paiement-abonnement');
  const summary = document.getElementById('sub-summary');
  if (summary) {
    summary.innerHTML = `
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;">ImmoGest ${planInfo.label}</div>
      <div style="color:var(--text3);font-size:12px;">${planInfo.price.toLocaleString()} FCFA/mois • Annulation à tout moment</div>
    `;
  }

  // Réinitialiser : sélectionner MTN par défaut, afficher champ téléphone
  selectedPaymentMethod = 'mtn';
  document.querySelectorAll('.payment-method').forEach(e => e.classList.remove('selected'));
  var payMtn = document.getElementById('pay-mtn');
  if (payMtn) payMtn.classList.add('selected');
  var phoneRow = document.querySelector('#pay-phone')?.closest('.form-row');
  if (phoneRow) phoneRow.style.display = '';

  document.getElementById('modal-upgrade').classList.remove('open');
  if (modal) modal.classList.add('open');
  calculateTotal();
}

function calculateTotal() {
  const duree = parseInt(document.getElementById('pay-duree') ? document.getElementById('pay-duree').value : 1) || 1;
  const planInfo = PLANS[selectedPlan] || PLANS.starter;
  const monthly = planInfo.price;

  let discount = 0;
  if (duree === 3) discount = 0.05;
  else if (duree === 6) discount = 0.10;
  else if (duree === 12) discount = 0.17;

  const subtotal = monthly * duree;
  const total = Math.round(subtotal * (1 - discount));
  const savings = subtotal - total;

  const totalEl = document.getElementById('pay-total');
  if (totalEl) {
    totalEl.innerHTML = `
      <div style="font-size:14px;color:var(--text3);text-decoration:line-through;">${subtotal.toLocaleString()} FCFA</div>
      <div style="font-size:24px;">${total.toLocaleString()} FCFA</div>
      ${savings > 0 ? `<div style="font-size:12px;color:var(--green);">Économisez ${savings.toLocaleString()} FCFA</div>` : ''}
    `;
  }
}


// ── PAIEMENT ABONNEMENT (flux complet) ──────────────────────

function processPaymentAbonnement() {
  var planInfo = PLANS[selectedPlan] || PLANS.starter;
  var dureeEl  = document.getElementById('pay-duree');
  var phoneEl  = document.getElementById('pay-phone');
  var duree    = dureeEl ? parseInt(dureeEl.value) : 1;
  var phone    = phoneEl ? phoneEl.value.trim() : '';

  // Calcul montant avec réduction
  var monthly  = planInfo.price;
  var discount = duree === 3 ? 0.05 : duree === 6 ? 0.10 : duree === 12 ? 0.17 : 0;
  var total    = Math.round(monthly * duree * (1 - discount));

  var isMobile    = selectedPaymentMethod === 'mtn' || selectedPaymentMethod === 'orange';
  var isCard      = selectedPaymentMethod === 'card';
  var isWhatsApp  = selectedPaymentMethod === 'whatsapp';

  // Validation numéro pour Mobile Money
  if (isMobile && (!phone || phone.replace(/\D/g, '').length < 9)) {
    if (typeof showToast === 'function') showToast('Veuillez entrer votre numéro de téléphone', 'error');
    return;
  }

  // Fermer le modal de sélection
  var modal = document.getElementById('modal-paiement-abonnement');
  if (modal) modal.classList.remove('open');

  // ─ Numéros ImmoGest (configurés dans IMMOGEST_PAIEMENT) ─
  var P = (typeof IMMOGEST_PAIEMENT !== 'undefined') ? IMMOGEST_PAIEMENT : {
    mtn: '6 73 95 00 19', orange: '6 90 40 99 29', whatsapp: '237690409929',
    telephone: '+237 690 40 99 29', email: 'fofefranklin57@gmail.com', nom: 'ImmoGest'
  };

  var methodNames = { mtn: 'MTN Mobile Money', orange: 'Orange Money', card: 'Carte prépayée', whatsapp: 'WhatsApp' };
  var methodIcons = { mtn: '📱', orange: '🟠', card: '💳', whatsapp: '💬' };

  // ─ WhatsApp : ouvrir directement sans modal ─
  if (isWhatsApp) {
    var waText = encodeURIComponent(
      'Bonjour, je souhaite souscrire au plan *' + planInfo.label + '* d\'ImmoGest' +
      ' pour ' + duree + ' mois (' + total.toLocaleString('fr-FR') + ' FCFA). Comment procéder ?'
    );
    window.open('https://wa.me/' + P.whatsapp + '?text=' + waText, '_blank');
    return;
  }

  // ─ Construire le modal d'instructions ─
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.id = 'modal-paiement-confirm';
  overlay.style.zIndex = '10005';

  var instructionsHtml = '';

  if (isMobile) {
    var numero = P[selectedPaymentMethod] || P.mtn;
    instructionsHtml =
      '<div style="background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border:1.5px solid #66BB6A;border-radius:10px;padding:16px;margin:16px 0;text-align:center;">' +
        '<div style="font-size:11px;font-weight:700;color:#388E3C;margin-bottom:6px;">📲 ENVOYEZ CE MONTANT À CE NUMÉRO</div>' +
        '<div style="font-size:30px;font-weight:900;color:#1B5E20;letter-spacing:3px;margin-bottom:4px;">' + numero + '</div>' +
        '<div style="font-size:22px;font-weight:800;color:#2e7d32;margin-bottom:4px;">' + total.toLocaleString('fr-FR') + ' FCFA</div>' +
        '<div style="font-size:11px;color:#558B2F;">Via ' + methodNames[selectedPaymentMethod] + '</div>' +
      '</div>' +
      '<div style="background:var(--yellow-bg);border:1px solid var(--yellow);border-radius:8px;padding:10px 14px;font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.8;">' +
        '<strong>Étapes :</strong><br>' +
        '1. Ouvrez ' + methodNames[selectedPaymentMethod] + ' sur votre téléphone<br>' +
        '2. Envoyez <strong>' + total.toLocaleString('fr-FR') + ' FCFA</strong> au <strong>' + numero + '</strong><br>' +
        '3. Copiez la référence de transaction<br>' +
        '4. Cliquez <strong>"J\'ai payé"</strong> ci-dessous' +
      '</div>';

  } else if (isCard) {
    // Carte prépayée (Visa/Mastercard, MoMo Card, Orange Card...)
    instructionsHtml =
      '<div style="background:linear-gradient(135deg,#e8eaf6,#f3f4ff);border:1.5px solid #5C6BC0;border-radius:10px;padding:16px;margin:16px 0;text-align:center;">' +
        '<div style="font-size:32px;margin-bottom:6px;">💳</div>' +
        '<div style="font-size:20px;font-weight:800;color:#283593;margin-bottom:4px;">' + total.toLocaleString('fr-FR') + ' FCFA</div>' +
        '<div style="font-size:11px;color:#5C6BC0;">Carte Visa · Mastercard · MoMo Card · Orange Card</div>' +
      '</div>' +
      '<div style="background:var(--bg3);border-radius:8px;padding:12px 14px;font-size:12px;color:var(--text2);margin-bottom:12px;line-height:1.8;">' +
        '✅ Les cartes prépayées <strong>MTN MoMo Card</strong> et <strong>Orange Card</strong> sont acceptées.<br>' +
        'Envoyez-nous la preuve de paiement par WhatsApp ou email :<br><br>' +
        '<strong>📞 ' + P.telephone + '</strong> (WhatsApp)<br>' +
        '<strong>✉️ ' + P.email + '</strong>' +
      '</div>';
  }

  var hasConfirmBtn = isMobile || isCard;

  overlay.innerHTML =
    '<div class="modal" style="max-width:460px;">' +
      '<h3 style="margin-bottom:4px;">' + methodIcons[selectedPaymentMethod] + ' ' + methodNames[selectedPaymentMethod] + '</h3>' +
      '<div style="font-size:12px;color:var(--text3);margin-bottom:12px;">' +
        'Plan <strong>' + planInfo.label + '</strong> · ' + duree + ' mois' +
      '</div>' +
      instructionsHtml +
      (isMobile ?
        '<div class="form-group" style="margin-bottom:12px;">' +
          '<label>Référence de transaction (facultatif)</label>' +
          '<input type="text" id="pay-ref-transaction" placeholder="Ex: MP250529.1234.XXXXXX" style="width:100%;padding:9px 12px;border:1px solid var(--border2);border-radius:6px;font-size:13px;font-family:var(--font);box-sizing:border-box;">' +
        '</div>' : '') +
      '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Annuler</button>' +
        (isMobile ?
          '<button class="btn btn-primary" id="btn-confirmer-paiement" onclick="_confirmerPaiementAbonnement(\'' + selectedPlan + '\',' + duree + ')">✅ J\'ai payé</button>' :
          '<button class="btn btn-primary" style="background:#25D366;border-color:#25D366;" onclick="window.open(\'https://wa.me/' + P.whatsapp + '\',\'_blank\');this.closest(\'.overlay\').remove();">💬 Envoyer la preuve</button>'
        ) +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
}

function _confirmerPaiementAbonnement(plan, duree, txId) {
  var btn = document.getElementById('btn-confirmer-paiement');
  var ref = txId || (document.getElementById('pay-ref-transaction') ? document.getElementById('pay-ref-transaction').value : '').trim();

  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enregistrement...'; }

  // Enregistrer la demande en attente
  var sub = {
    plan:      plan,
    duree:     duree,
    provider:  selectedPaymentMethod,
    phone:     (document.getElementById('pay-phone') ? document.getElementById('pay-phone').value : ''),
    ref:       ref || ('SUB-' + Date.now()),
    statut:    'en_attente',
    date:      new Date().toISOString(),
    expiry:    new Date(Date.now() + duree * 30 * 86400000).toISOString()
  };

  localStorage.setItem('immogest_subscription_pending', JSON.stringify(sub));

  // Simulation d'activation immédiate (à remplacer par validation admin réelle)
  setTimeout(function() {
    // Fermer modal instructions
    var overlay = document.getElementById('modal-paiement-confirm');
    if (overlay) overlay.remove();

    // Activer le plan
    MONETISATION.plan = plan;
    localStorage.setItem('immogest_subscription', JSON.stringify({
      tier:      plan,
      provider:  sub.provider,
      ref:       sub.ref,
      startDate: sub.date,
      expiryDate: sub.expiry
    }));
    saveMonetisation();
    applyPlan();
    updatePlanBadge();

    // Annuler le trial
    localStorage.removeItem('immogest_trial');
    var trialBanner = document.getElementById('trial-countdown-banner');
    if (trialBanner) trialBanner.remove();

    // Supprimer widget usage
    renderUsageWidget();

    // Message succès
    _showAbonnementSuccess(plan, duree);
  }, 1500);
}

function _showAbonnementSuccess(plan, duree) {
  var planInfo = PLANS[plan] || PLANS.starter;
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10006';
  overlay.innerHTML =
    '<div class="modal" style="max-width:400px;text-align:center;">' +
      '<div style="font-size:60px;margin-bottom:12px;">🎉</div>' +
      '<h3 style="color:var(--green);margin-bottom:8px;">Abonnement activé !</h3>' +
      '<p style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:16px;">' +
        'Bienvenue en <strong>' + planInfo.label + '</strong> !<br>' +
        'Votre abonnement est actif pour <strong>' + duree + ' mois</strong>.' +
      '</p>' +
      '<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--text2);">' +
        '✓ Publicités supprimées<br>' +
        '✓ Toutes les fonctionnalités débloquées<br>' +
        '✓ Score locataire activé<br>' +
        (plan === 'pro' || plan === 'entreprise' ? '✓ Export PDF/Word illimité<br>' : '') +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-primary" style="width:100%;" onclick="this.closest(\'.overlay\').remove();location.reload();">Commencer !</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

// ── HOOKS SUR FONCTIONNALITÉS EXISTANTES ──

// Hook sur l\'ajout d\'immeuble
const originalSaveImmeuble = window.saveImmeuble;
window.saveImmeuble = function() {
  const immeubles = JSON.parse(localStorage.getItem('immogest_immeubles') || '[]');
  const check = checkLimit('immeubles', immeubles.length);

  if (!check.allowed && !isRewardUnlocked('immeubles')) {
    showPaywall('Vous avez atteint la limite de 1 immeuble en version gratuite.', 'immeubles');
    return;
  }

  showLimitWarning(check);
  if (originalSaveImmeuble) originalSaveImmeuble();
};

// Hook sur l'ajout de locataire
const originalSaveLocataire = window.saveLocataire;
window.saveLocataire = function() {
  const locataires = JSON.parse(localStorage.getItem('immogest_locataires') || '[]');
  const check = checkLimit('locataires', locataires.length);

  if (!check.allowed && !isRewardUnlocked('locataires')) {
    showPaywall('Vous avez atteint la limite de 45 locataires en version gratuite.', 'locataires');
    return;
  }

  showLimitWarning(check);
  if (originalSaveLocataire) originalSaveLocataire();
};

// Hook sur export PDF
const originalPreviewDownload = window.previewDownload;
window.previewDownload = function() {
  MONETISATION.usage.rapports_pdf_this_month++;
  saveMonetisation();

  const check = checkLimit('rapports_pdf', MONETISATION.usage.rapports_pdf_this_month);

  if (!check.allowed && !isRewardUnlocked('rapports_pdf')) {
    showPaywall('Vous avez atteint la limite de 3 rapports PDF ce mois.', 'rapports_pdf');
    // Bloquer le téléchargement
    return;
  }

  showLimitWarning(check);

  // Afficher interstitielle avant export
  if (isFreePlan()) {
    showInterstitial('export_pdf');
  }

  if (originalPreviewDownload) originalPreviewDownload();
};

// Hook sur changement de page (interstitielle)
const _monetizationNavigate = window.navigate;
window.navigate = function(page, immId) {
  // Afficher interstitielle aléatoirement
  if (isFreePlan() && Math.random() <0.15) {
    showInterstitial('changement_page');
  }

  if (_monetizationNavigate) _monetizationNavigate(page, immId);
};

// ── INITIALISATION AU DÉMARRAGE ──
document.addEventListener('DOMContentLoaded', function() {
  // Attendre que l'app soit initialisée
  setTimeout(function() {
    if (typeof SESSION !== "undefined") { initMonetisation(); }
    else { setTimeout(initMonetisation, 1500); }
  }, 500);
});


// ═══════════════════════════════════════════════════════════════
// STRATÉGIES DE CONVERSION — v3.1
// 1. Widget usage sidebar  2. Essai 14 jours  3. Score verrouillé
// 4. Bannière archives     5. Rappels hebdo
// ═══════════════════════════════════════════════════════════════


// ─── 1. WIDGET USAGE DANS LE SIDEBAR ────────────────────────
function renderUsageWidget() {
  if (!isFreePlan()) {
    // Supprimer le widget si plan payant
    const old = document.getElementById('usage-widget');
    if (old) old.remove();
    return;
  }

  const footer = document.querySelector('.sidebar-footer');
  if (!footer) return;

  let widget = document.getElementById('usage-widget');
  if (!widget) {
    widget = document.createElement('div');
    widget.id = 'usage-widget';
    footer.insertBefore(widget, footer.firstChild);
  }

  const immeubles  = (typeof DATA !== 'undefined' && DATA.immeubles)  ? DATA.immeubles.length : 0;
  const locataires = (typeof DATA !== 'undefined' && DATA.locataires) ? DATA.locataires.filter(function(l){ return l.s !== 'libre'; }).length : 0;
  const maxImm = 1, maxLoc = 10;

  const pImm = Math.min(100, (immeubles / maxImm) * 100);
  const pLoc = Math.min(100, (locataires / maxLoc) * 100);

  const cImm = pImm >= 100 ? '#e74c3c' : pImm >= 80 ? '#f39c12' : 'rgba(255,255,255,0.35)';
  const cLoc = pLoc >= 100 ? '#e74c3c' : pLoc >= 80 ? '#f39c12' : 'rgba(255,255,255,0.35)';

  const urgence = pImm >= 100 || pLoc >= 100;
  const proche  = !urgence && (pImm >= 80 || pLoc >= 80);

  widget.style.cssText = 'margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid ' + (urgence ? 'rgba(231,76,60,0.4)' : 'rgba(255,255,255,0.1)') + ';';

  widget.innerHTML =
    '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;">Utilisation · Plan FREE</div>' +

    '<div style="margin-bottom:6px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px;">' +
        '<span>Immeubles</span>' +
        '<span style="color:' + cImm + ';font-weight:600;">' + immeubles + '/' + maxImm + '</span>' +
      '</div>' +
      '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;">' +
        '<div style="height:100%;width:' + pImm + '%;background:' + cImm + ';border-radius:99px;transition:width .4s;"></div>' +
      '</div>' +
    '</div>' +

    '<div style="margin-bottom:8px;">' +
      '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:3px;">' +
        '<span>Locataires</span>' +
        '<span style="color:' + cLoc + ';font-weight:600;">' + locataires + '/' + maxLoc + '</span>' +
      '</div>' +
      '<div style="height:4px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;">' +
        '<div style="height:100%;width:' + pLoc + '%;background:' + cLoc + ';border-radius:99px;transition:width .4s;"></div>' +
      '</div>' +
    '</div>' +

    (urgence ?
      '<button onclick="showUpgradeModal()" style="width:100%;padding:6px;background:#e74c3c;color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">⚠ Limite atteinte — S\'abonner</button>' :
    proche ?
      '<button onclick="showUpgradeModal()" style="width:100%;padding:6px;background:linear-gradient(135deg,#f39c12,#e67e22);color:#fff;border:none;border-radius:6px;font-size:11px;font-weight:600;cursor:pointer;">⬆ Passer à Starter</button>' :
      '<div style="font-size:10px;color:rgba(255,255,255,0.35);text-align:center;cursor:pointer;" onclick="showUpgradeModal()">Voir les plans →</div>'
    );
}


// ─── 2. ESSAI 14 JOURS ──────────────────────────────────────
function initTrial() {
  var trialKey = 'immogest_trial';
  var raw = localStorage.getItem(trialKey);

  if (raw) {
    try {
      var trial = JSON.parse(raw);
      var start = new Date(trial.start);
      var daysUsed = Math.floor((Date.now() - start.getTime()) / 86400000);
      var daysLeft = 14 - daysUsed;

      if (trial.active && daysLeft > 0) {
        // Essai encore actif — activer Pro temporairement
        if (MONETISATION.plan === 'gratuit') {
          MONETISATION.plan = 'pro';
          MONETISATION.trialEnd = trial.end;
        }
        if (daysLeft <= 4) {
          setTimeout(function() { showTrialCountdown(daysLeft); }, 3500);
        }
        return;
      }

      if (trial.active && daysLeft <= 0) {
        // Essai expiré
        trial.active = false;
        localStorage.setItem(trialKey, JSON.stringify(trial));
        if (MONETISATION.plan === 'pro' && !_hasRealSubscription()) {
          MONETISATION.plan = 'gratuit';
          saveMonetisation();
        }
        setTimeout(function() {
          if (typeof showToast === 'function') showToast('Votre essai Pro a expiré. Abonnez-vous pour continuer.', 'warning');
          setTimeout(showUpgradeModal, 2500);
        }, 3000);
        return;
      }
    } catch(e) {}
    return; // Essai déjà terminé, ne pas relancer
  }

  // Première connexion — démarrer l'essai
  var now = new Date();
  var end = new Date(now.getTime() + 14 * 86400000);
  localStorage.setItem(trialKey, JSON.stringify({
    active: true,
    start: now.toISOString(),
    end: end.toISOString()
  }));

  MONETISATION.plan = 'pro';
  MONETISATION.trialEnd = end.toISOString();
  saveMonetisation();
  applyPlan();

  setTimeout(showTrialWelcome, 4000);
}

function _hasRealSubscription() {
  var sub = JSON.parse(localStorage.getItem('immogest_subscription') || '{}');
  return sub.tier && sub.tier !== 'free' && sub.expiryDate && new Date(sub.expiryDate) > new Date();
}

function showTrialWelcome() {
  var overlay = document.createElement('div');
  overlay.className = 'overlay open';
  overlay.style.zIndex = '10003';
  overlay.innerHTML =
    '<div class="modal" style="max-width:420px;text-align:center;">' +
      '<div style="font-size:52px;margin-bottom:8px;">🎉</div>' +
      '<h3 style="margin-bottom:8px;">Bienvenue sur ImmoGest !</h3>' +
      '<p style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:18px;">' +
        'Vous bénéficiez de <strong>14 jours d\'essai Pro gratuit</strong>.<br>' +
        'Profitez de toutes les fonctionnalités sans limite et sans publicité.' +
      '</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:18px;text-align:left;">' +
        '<div style="background:var(--bg3);padding:10px;border-radius:8px;font-size:12px;">✓ Immeubles illimités</div>' +
        '<div style="background:var(--bg3);padding:10px;border-radius:8px;font-size:12px;">✓ Locataires illimités</div>' +
        '<div style="background:var(--bg3);padding:10px;border-radius:8px;font-size:12px;">✓ Sans publicités</div>' +
        '<div style="background:var(--bg3);padding:10px;border-radius:8px;font-size:12px;">✓ Score locataire</div>' +
        '<div style="background:var(--bg3);padding:10px;border-radius:8px;font-size:12px;">✓ Archives illimitées</div>' +
        '<div style="background:var(--bg3);padding:10px;border-radius:8px;font-size:12px;">✓ Export PDF/Word</div>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button class="btn btn-ghost" onclick="this.closest(\'.overlay\').remove()">Commencer l\'essai</button>' +
        '<button class="btn btn-primary" onclick="showUpgradeModal();this.closest(\'.overlay\').remove()">Voir les plans</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
}

function showTrialCountdown(daysLeft) {
  var existing = document.getElementById('trial-countdown-banner');
  if (existing) existing.remove();

  var color  = daysLeft <= 1 ? '#c0392b' : '#e67e22';
  var msg    = daysLeft === 0 ? 'Dernier jour d\'essai Pro !'
             : daysLeft === 1 ? 'Plus qu\'1 jour d\'essai Pro restant'
             : 'Plus que ' + daysLeft + ' jours d\'essai Pro';

  var banner = document.createElement('div');
  banner.id  = 'trial-countdown-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9998;background:' + color + ';color:#fff;text-align:center;padding:8px 48px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:14px;';
  banner.innerHTML =
    '<span>⏰ ' + msg + '</span>' +
    '<button onclick="showUpgradeModal()" style="background:rgba(255,255,255,0.25);color:#fff;border:none;padding:3px 12px;border-radius:99px;font-size:11px;font-weight:700;cursor:pointer;">S\'abonner maintenant</button>' +
    '<button onclick="this.parentElement.remove()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:rgba(255,255,255,0.6);font-size:18px;cursor:pointer;line-height:1;">×</button>';

  document.body.prepend(banner);
}


// ─── 3. RAPPELS HEBDOMADAIRES ────────────────────────────────
function checkWeeklyReminder() {
  if (!isFreePlan()) return;

  var key  = 'immogest_last_reminder';
  var last = localStorage.getItem(key);
  var now  = Date.now();
  var week = 7 * 86400000;

  if (last && (now - parseInt(last)) < week) return;

  localStorage.setItem(key, now.toString());

  var immeubles  = (typeof DATA !== 'undefined' && DATA.immeubles)  ? DATA.immeubles.length : 0;
  var locataires = (typeof DATA !== 'undefined' && DATA.locataires) ? DATA.locataires.filter(function(l){ return l.s !== 'libre'; }).length : 0;

  var msg = (immeubles >= 1 || locataires >= 8)
    ? 'Vous gérez ' + immeubles + ' immeuble(s) et ' + locataires + ' locataire(s). Passez à Starter pour illimité !'
    : 'Débloquez le score locataire, les archives illimitées et l\'export PDF.';

  setTimeout(function() {
    if (typeof showToast === 'function') showToast('💡 ' + msg, 'info');
    setTimeout(showPromoToast, 4000);
  }, 12000);
}


// ─── 4. BANNIÈRE ARCHIVES POUR PLAN FREE ────────────────────
function showArchivesFreeBanner() {
  if (!isFreePlan()) return;
  var content = document.getElementById('content');
  if (!content) return;

  var existing = document.getElementById('archives-free-banner');
  if (existing) return;

  var banner = document.createElement('div');
  banner.id  = 'archives-free-banner';
  banner.style.cssText = 'background:linear-gradient(135deg,rgba(14,106,175,0.08),rgba(14,106,175,0.04));border:1px solid rgba(14,106,175,0.2);border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;';
  banner.innerHTML =
    '<div>' +
      '<div style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:2px;">🔒 Archives limitées — Plan FREE</div>' +
      '<div style="font-size:12px;color:var(--text3);">Vos archives sont conservées 6 mois. Passez à Pro pour un accès illimité et le score de fiabilité des locataires.</div>' +
    '</div>' +
    '<button onclick="showUpgradeModal()" style="white-space:nowrap;padding:7px 14px;background:var(--accent);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;flex-shrink:0;">Débloquer Pro</button>';

  content.insertBefore(banner, content.firstChild);
}


// ─── 5. SCORE LOCATAIRE VERROUILLÉ ──────────────────────────
function getScoreDisplay(score) {
  if (!isFreePlan()) {
    var col = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--yellow)' : 'var(--red)';
    return '<span style="font-weight:700;color:' + col + ';">' + score + '/100</span>';
  }
  return '<span style="filter:blur(5px);cursor:pointer;user-select:none;font-weight:700;" onclick="showUpgradeModal()" title="Débloquer avec Pro">??/100</span>' +
         '<span style="font-size:10px;color:var(--text3);margin-left:3px;" onclick="showUpgradeModal()" style="cursor:pointer;">🔒</span>';
}
window.getScoreDisplay = getScoreDisplay;


// ─── HOOKS INTÉGRATION ───────────────────────────────────────

// Hook updateSidebarBadges → ajouter le widget d'usage
function _hookSidebarForUsage() {
  if (window._usageWidgetHooked) return;
  window._usageWidgetHooked = true;

  var _orig = window.updateSidebarBadges;
  if (typeof _orig === 'function') {
    window.updateSidebarBadges = function() {
      _orig.apply(this, arguments);
      renderUsageWidget();
    };
  }
}

// Hook renderArchives → ajouter bannière et score
function _hookArchivesRender() {
  if (window._archivesHooked) return;
  window._archivesHooked = true;

  var _orig = window.renderArchives;
  if (typeof _orig === 'function') {
    window.renderArchives = function() {
      _orig.apply(this, arguments);
      showArchivesFreeBanner();
    };
  }
}

// Appel dans initMonetisation
var _origInitMon = initMonetisation;
initMonetisation = function() {
  _origInitMon.apply(this, arguments);

  // Essai 14 jours (seulement si plan gratuit)
  if (MONETISATION.plan === 'gratuit') {
    initTrial();
  }

  // Rappels hebdomadaires
  checkWeeklyReminder();

  // Widget usage sidebar
  setTimeout(renderUsageWidget, 800);

  // Hooks
  _hookSidebarForUsage();
  _hookArchivesRender();
};

