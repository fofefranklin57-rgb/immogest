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
      maxLocatairesFree: 45,
      maxRapportsFree: 5,
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
            Passer à Pro - 2 990 FCFA/mois
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
            ⚠️ Vous allez recevoir une demande de validation sur votre téléphone. Confirmez le paiement de <strong>2 990 FCFA</strong> pour activer ImmoGest Pro.
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
    starter:    { mensuel: 9999,  annuel: 89990  },
    pro:        { mensuel: 19999, annuel: 179990 },
    entreprise: { mensuel: 29999, annuel: 269990 }
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
  if (window.SESSION && window.SESSION.username) {
    _sb.from('abonnements').select('plan,statut,date_fin').eq('user_id', window.SESSION.username).single()
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
    startAds();
    setTimeout(() => showPromoToast(), 30000);
  }

  console.log('[Monetisation] Initialisé - Plan:', MONETISATION.plan);
}

function saveMonetisation() {
  localStorage.setItem('immoget_monetisation', JSON.stringify({
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
    const planClass = MONETISATION.plan === 'gratuit' ? 'plan-free'
      : MONETISATION.plan === 'premium'    ? 'plan-pro'
      : MONETISATION.plan === 'business'   ? 'plan-pro'
      : 'plan-enterprise';
    const planLabel = MONETISATION.plan === 'gratuit'  ? (isTrialActive() ? 'ESSAI' : 'FREE')
      : MONETISATION.plan === 'premium'   ? 'PRO'
      : MONETISATION.plan === 'business'  ? 'BUSINESS'
      : 'ENTERPRISE';
    badge.className = 'plan-badge ' + planClass;
    badge.textContent = planLabel;
  }

  if (isFreePlan()) {
    // Gratuit : toutes les pubs visibles (bannières top/bottom/sidebar + interstitielle + native)
    document.querySelectorAll('.ad-banner').forEach(el => el.style.display = 'flex');
  } else if (isProPlan() || isBusinessPlan()) {
    // Pro / Business : bannière discrète en bas seulement, pas d'interstitielle ni native
    const top  = document.getElementById('ad-banner-top');
    const side = document.getElementById('ad-banner-sidebar');
    const bot  = document.getElementById('ad-banner-bottom');
    if (top)  top.style.display  = 'none';
    if (side) side.style.display = 'none';
    if (bot) {
      bot.style.display = 'flex';
      bot.style.opacity = '0.55';
      bot.style.fontSize = '11px';
      bot.style.padding = '4px 12px';
      bot.style.minHeight = '0';
    }
    document.querySelectorAll('.ad-banner-native').forEach(el => el.style.display = 'none');
  } else {
    // Enterprise : aucune pub
    document.querySelectorAll('.ad-banner, .ad-banner-native').forEach(el => el.style.display = 'none');
  }

  // Mettre à jour le badge dans la topbar
  updatePlanBadge();
}

function updatePlanBadge() {
  // Badge plan visible uniquement pour admin/gestionnaire/comptable
  if (SESSION && (SESSION.role === 'locataire' || SESSION.role === 'proprietaire')) {
    const existing = document.getElementById('topbar-plan-badge');
    if (existing) existing.remove();
    return;
  }
  const topbar = document.querySelector('.topbar-actions');
  if (!topbar) return;

  let badge = document.getElementById('topbar-plan-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'topbar-plan-badge';
    badge.style.cssText = 'margin-right:8px;cursor:pointer;';
    badge.onclick = showUpgradeModal;
    topbar.insertBefore(badge, topbar.firstChild);
  }

  const planLabel = MONETISATION.plan === 'gratuit' ? (isTrialActive() ? 'ESSAI' : 'FREE')
    : MONETISATION.plan === 'premium'  ? 'PRO'
    : MONETISATION.plan === 'business' ? 'BIZ'
    : 'ENT';
  const planClass = MONETISATION.plan === 'gratuit' ? 'plan-free'
    : MONETISATION.plan === 'premium'  ? 'plan-pro'
    : MONETISATION.plan === 'business' ? 'plan-pro'
    : 'plan-enterprise';
  badge.className = 'plan-badge ' + planClass;
  badge.textContent = planLabel;

  if (isFreePlan()) {
    badge.innerHTML += ' <span style="font-size:9px;opacity:0.7;">▲</span>';
  }
}

// ── PUBLICITÉS ──
function startAds() {
  if (!isFreePlan()) return;

  // Afficher bannières
  const topBanner = document.getElementById('ad-banner-top');
  const bottomBanner = document.getElementById('ad-banner-bottom');
  const sidebarBanner = document.getElementById('ad-banner-sidebar');

  if (topBanner) topBanner.style.display = 'flex';
  if (bottomBanner) bottomBanner.style.display = 'flex';
  if (sidebarBanner) sidebarBanner.style.display = 'flex';

  // Rotation des bannières toutes les 30s
  setInterval(() => rotateBanners(), 30000);
}

function rotateBanners() {
  if (!isFreePlan()) return;
  const banners = document.querySelectorAll('.ad-banner');
  banners.forEach(banner => {
    // Simuler le refresh
    banner.style.opacity = '0.5';
    setTimeout(() => banner.style.opacity = '1', 300);
  });
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

// Publicité native (dans les listes)
function insertNativeAd(container, position = 'middle') {
  if (!isFreePlan()) return;

  const ad = document.createElement('div');
  ad.className = 'ad-banner-native';
  ad.innerHTML = `
    <div class="ad-native-img">🏢</div>
    <div class="ad-native-content">
      <div class="ad-native-title">Gérez vos biens comme un pro</div>
      <div class="ad-native-desc">Passez à ImmoGest Pro pour débloquer toutes les fonctionnalités avancées.</div>
      <div class="ad-native-cta" onclick="showUpgradeModal()">En savoir plus →</div>
    </div>
  `;

  if (position === 'middle' && container.children.length > 2) {
    container.insertBefore(ad, container.children[Math.floor(container.children.length / 2)]);
  } else {
    container.appendChild(ad);
  }
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
  if (SESSION && (SESSION.role === 'locataire' || SESSION.role === 'proprietaire')) return;
  document.getElementById('modal-upgrade').classList.add('open');
  // Tracker
  console.log('[Monetisation] Upgrade modal ouvert');
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
  calculateTotal();
}

function startSubscription(plan) {
  selectedPlan = plan;
  const planInfo = PLANS[plan];
  if (!planInfo) return;

  const modal = document.getElementById('modal-paiement-abonnement');
  const summary = document.getElementById('sub-summary');
  if (summary) {
    summary.innerHTML = `
      <div style="font-weight:700;font-size:14px;margin-bottom:4px;">ImmoGest ${planInfo.label}</div>
      <div style="color:var(--text3);font-size:12px;">${planInfo.price.toLocaleString()} FCFA/mois • Annulation à tout moment</div>
    `;
  }

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
  setTimeout(initMonetisation, 500);
});

