// ═══════════════════════════════════════════════════════════════
// MODULE NOTIFICATIONS PUSH - ImmoGest v2.1
// ═══════════════════════════════════════════════════════════════

const PushModule = {
  // Configuration VAPID (clé publique pour tests - à remplacer en production)
  VAPID_PUBLIC_KEY: 'BLjmecELgzCq4S-fJyRx9j03wvR0yjSs6O13L6qABrj7CadS8689Lvi2iErzG8SeaPSX_ezoyD2O0MMkGZcj4c0',

  // État du module
  swRegistration: null,
  subscription: null,
  isPushSupported: false,
  isSubscribed: false,

  // Initialisation
  init: async function() {
    // Vérifier le support des notifications
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Worker non supporté');
      this.isPushSupported = false;
      return false;
    }

    if (!('PushManager' in window)) {
      console.warn('[Push] Push API non supportée');
      this.isPushSupported = false;
      return false;
    }

    if (!('Notification' in window)) {
      console.warn('[Push] Notification API non supportée');
      this.isPushSupported = false;
      return false;
    }

    this.isPushSupported = true;

    // Vérifier si on est en local (file://) - ServiceWorker non supporté
    if (location.protocol === 'file:') {
      console.log('[Push] Service Worker désactivé en mode fichier local (normal)');
      this.isSubscribed = false;
      return false;
    }

    try {
      // Créer un Service Worker inline via Blob
      const swBlob = new Blob([document.getElementById('sw-code').textContent], 
        { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(swBlob);
      this.swRegistration = await navigator.serviceWorker.register(swUrl).catch(e => {
        console.warn('[Push] Blob SW non supporté sur cet hébergeur (normal sur Cloudflare/Vercel):', e.message);
        return null;
      });
      if (!this.swRegistration) { this.isPushSupported = false; return false; }
      console.log('[Push] Service Worker enregistré:', this.swRegistration.scope);

      // Vérifier l'état de la souscription existante
      this.subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = !!this.subscription;

      if (this.isSubscribed) {
        console.log('[Push] Déjà souscrit aux notifications');
        this.updateUI();
      }

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[Push] Message reçu du SW:', event.data);
      });

      return true;
    } catch (error) {
      console.error('[Push] Erreur initialisation:', error);
      return false;
    }
  },

  // Demander la permission de notification
  requestPermission: async function() {
    if (!this.isPushSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('[Push] Permission accordée');
        return true;
      } else {
        console.warn('[Push] Permission refusée:', permission);
        showToast('Permission de notification refusée', 'error');
        return false;
      }
    } catch (error) {
      console.error('[Push] Erreur permission:', error);
      return false;
    }
  },

  // Souscrire aux notifications push
  subscribe: async function() {
    if (!this.isPushSupported || !this.swRegistration) {
      showToast('Notifications push non supportées', 'error');
      return false;
    }

    // Demander d'abord la permission
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return false;

    try {
      // Convertir la clé VAPID
      const applicationServerKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);

      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      this.isSubscribed = true;
      console.log('[Push] Souscription réussie:', this.subscription);

      // Envoyer la souscription au serveur (simulation)
      await this.sendSubscriptionToServer(this.subscription);

      this.updateUI();
      showToast('Notifications push activées !', 'success');

      // Envoyer une notification de test
      this.sendLocalNotification(
        'ImmoGest', 
        'Notifications push activées avec succès !',
        { url: window.location.href }
      );

      return true;
    } catch (error) {
      console.error('[Push] Erreur souscription:', error);
      showToast("Erreur lors de l'activation des notifications", "error");
      return false;
    }
  },

  // Se désinscrire des notifications
  unsubscribe: async function() {
    if (!this.subscription) return false;

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      this.isSubscribed = false;

      console.log('[Push] Désinscription réussie');
      this.updateUI();
      showToast('Notifications push désactivées', 'info');
      return true;
    } catch (error) {
      console.error('[Push] Erreur désinscription:', error);
      return false;
    }
  },

  // Envoyer la souscription au serveur
  sendSubscriptionToServer: async function(subscription) {
    // Simulation - En production, envoyer à votre backend
    console.log('[Push] Souscription à envoyer au serveur:', JSON.stringify(subscription));

    // Stockage local pour démo
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));

    // TODO: Remplacer par un vrai appel API
    // await fetch('/api/push/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription)
    // });
  },

  // Envoyer une notification locale (sans serveur)
  sendLocalNotification: function(title, body, data = {}) {
    if (!this.swRegistration) return;

    this.swRegistration.showNotification(title, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/263/263115.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/263/263115.png',
      tag: 'immogest-' + Date.now(),
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' }
      ],
      data: {
        url: data.url || window.location.href,
        ...data
      }
    });
  },

  // Planifier une notification (simulation de push différé)
  scheduleNotification: function(title, body, delayMs = 5000, data = {}) {
    setTimeout(() => {
      this.sendLocalNotification(title, body, data);
    }, delayMs);
    console.log(`[Push] Notification planifiée dans ${delayMs}ms`);
  },

  // Mettre à jour l'interface utilisateur
  updateUI: function() {
    const btn = document.getElementById('push-toggle-btn');
    const status = document.getElementById('push-status');

    if (btn) {
      btn.innerHTML = this.isSubscribed ? '🔕 Désactiver' : '🔔 Activer';
      btn.className = this.isSubscribed ? 'btn btn-danger' : 'btn btn-primary';
    }

    if (status) {
      status.innerHTML = this.isSubscribed 
        ? '<span class="badge badge-green">✓ Activées</span>' 
        : '<span class="badge badge-neutral">✗ Désactivées</span>';
    }
  },

  // Utilitaire: Convertir base64url en Uint8Array
  urlBase64ToUint8Array: function(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i <rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // Vérifier l'état actuel
  getStatus: function() {
    return {
      supported: this.isPushSupported,
      subscribed: this.isSubscribed,
      permission: Notification.permission,
      subscription: this.subscription
    };
  }
};

// ═══════════════════════════════════════════════════════════════
// INTERFACE UTILISATEUR - Panneau de notifications
// ═══════════════════════════════════════════════════════════════

function renderPushPanel() {
  const container = document.getElementById('push-panel');
  if (!container) return;
  const status = PushModule.getStatus();
  const isExpanded = container.dataset.expanded === 'true';

  container.innerHTML = `
    <div style="margin-bottom:8px;">
      <button onclick="togglePushPanel()" 
        style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.1);border:none;border-radius:8px;color:rgba(255,255,255,0.85);cursor:pointer;font-family:inherit;font-size:12px;">
        <span>🔔 Notifications Push</span>
        <span>${isExpanded ? '▲' : '▼'}</span>
      </button>
      ${isExpanded ? `
      <div style="background:rgba(255,255,255,0.95);border-radius:8px;padding:12px;margin-top:6px;color:#333;">
        <div style="font-size:12px;margin-bottom:10px;color:#666;">${status.isSubscribed ? '✅ Activées' : '⚪ Désactivées'}</div>
        ${status.isSubscribed ? 
          '<button onclick="togglePushNotifications()" style="width:100%;padding:6px;background:#e74c3c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;margin-bottom:6px;">Désactiver</button>' :
          '<button onclick="togglePushNotifications()" style="width:100%;padding:6px;background:#27ae60;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;margin-bottom:6px;">🔔 Activer</button>'
        }
        <button onclick="testPushNotification()" style="width:100%;padding:6px;background:rgba(0,0,0,0.1);color:#333;border:none;border-radius:6px;cursor:pointer;font-size:11px;">🧪 Test</button>
      </div>` : ''}
    </div>`;
}

function togglePushPanel() {
  const container = document.getElementById('push-panel');
  if (!container) return;
  container.dataset.expanded = container.dataset.expanded === 'true' ? 'false' : 'true';
  renderPushPanel();
}


async function togglePushNotifications() {
  if (PushModule.isSubscribed) {
    await PushModule.unsubscribe();
  } else {
    await PushModule.subscribe();
  }
  renderPushPanel();
}

function testPushNotification() {
  PushModule.sendLocalNotification(
    'ImmoGest - Test',
    'Ceci est une notification de test ! Les paiements fonctionnent correctement.',
    { url: window.location.href, type: 'test' }
  );
  showToast('Notification de test envoyée !', 'success');
}

function showPushDetails() {
  const details = document.getElementById('push-details');
  if (details) details.style.display = details.style.display === 'none' ? 'block' : 'none';
}

// ═══════════════════════════════════════════════════════════════
// INTÉGRATION AVEC LE SYSTÈME EXISTANT
// ═══════════════════════════════════════════════════════════════

// Hook pour les événements métier existants
const originalSavePaiement = window.savePaiement;
window.savePaiement = async function() {
  const result = await originalSavePaiement.apply(this, arguments);

  // Envoyer une notification après un paiement réussi
  if (PushModule.isSubscribed) {
    PushModule.scheduleNotification(
      '💰 Nouveau Paiement',
      'Un paiement a été enregistré avec succès dans ImmoGest.',
      3000,
      { type: 'payment', url: window.location.href }
    );
  }

  return result;
};

// Hook pour les relances
const originalNavigate = window.navigate;
window.navigate = function(page) {
  if (originalNavigate) originalNavigate.apply(this, arguments);

  // Notification pour les relances
  if (page === 'relances' && PushModule.isSubscribed) {
    const relancesCount = document.getElementById('badge-relances')?.textContent || '0';
    if (parseInt(relancesCount) > 0) {
      PushModule.sendLocalNotification(
        '🔔 Relances en attente',
        `Vous avez ${relancesCount} relance(s) à effectuer.`,
        { type: 'relance', url: window.location.href }
      );
    }
  }
};

// Initialisation automatique au chargement
document.addEventListener('DOMContentLoaded', async () => {
  // Attendre que l'application soit initialisée
  setTimeout(async () => {
    await PushModule.init();

    // Ajouter le panneau de notifications dans la sidebar
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (sidebarFooter) {
      const pushPanel = document.createElement('div');
      pushPanel.id = 'push-panel-container';
      pushPanel.innerHTML = '<div id="push-panel"></div>';
      sidebarFooter.insertBefore(pushPanel, sidebarFooter.firstChild);
      renderPushPanel();
    }

    // Ajouter le bouton de test dans la topbar
    const topbarActions = document.querySelector('.topbar-actions');
    if (topbarActions) {
      const pushBtn = document.createElement('button');
      pushBtn.className = 'btn btn-ghost btn-sm';
      pushBtn.innerHTML = '🔔';
      pushBtn.title = 'Notifications Push';
      pushBtn.onclick = () => {
        const panel = document.getElementById('push-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
      };
      topbarActions.insertBefore(pushBtn, topbarActions.firstChild);
    }

    console.log('[Push] Module initialisé avec succès');
  }, 2000);
});
