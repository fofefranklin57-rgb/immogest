// ==================== PORTAIL LOCATAIRE JS ====================

let currentTab = 'dashboard';
let selectedMomo = null;

// Navigation
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';
  document.querySelectorAll('.tenant-nav button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  currentTab = tab;
}

// 7. Paiement Mobile Money
function selectMomo(btn, provider) {
  document.querySelectorAll('.momo-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedMomo = provider;

  // Show cabinet number
  const momo = (DATA.settings && DATA.settings.momo) ? DATA.settings.momo : {};
  const numero = momo[provider] || '';
  const infoDiv = document.getElementById('momo-cabinet-info');
  const numDiv  = document.getElementById('momo-cabinet-number');
  if (infoDiv && numDiv) {
    if (numero) {
      numDiv.textContent = numero;
      infoDiv.style.display = 'block';
    } else {
      infoDiv.style.display = 'none';
    }
  }
}

async function processPayment() {
  const l = _getLocataireConnecte();
  if (!selectedMomo) { alert('Veuillez sélectionner un mode de paiement'); return; }

  const amount = parseInt(document.getElementById('pay-amount').value);
  const phone  = document.getElementById('pay-phone').value.trim();

  if (!amount || amount <= 0) { alert('Montant invalide'); return; }
  if (!phone || phone.length < 9) { alert('Numéro de téléphone invalide'); return; }

  const btn = event.target;
  btn.innerHTML = '⏳ Traitement…';
  btn.disabled = true;

  // Simulation confirmation (2 s)
  await new Promise(r => setTimeout(r, 2000));

  try {
    const ref = 'PAY-' + Date.now();
    const now = new Date();

    // Enregistrer dans DATA.paiements
    if (l) {
      const newPay = {
        id: DATA.nextPayId++,
        locId: l.id,
        date: now.toISOString().split('T')[0],
        montant: amount,
        moisC: now.getMonth(),
        anneeC: now.getFullYear(),
        type: 'loyer',
        mode: selectedMomo === 'mtn' ? 'mtn' : selectedMomo === 'orange' ? 'orange' : 'wave',
        note: 'Déclaré via portail locataire · Réf: ' + ref,
        statut: 'en_attente' // attente validation comptable
      };
      DATA.paiements.push(newPay);
      // Ajouter en déclaration pour validation
      if (!DATA.declarations) DATA.declarations = [];
      DATA.declarations.push({ ...newPay, declId: DATA.nextDeclId++ });
      saveData();
    }

    alert('✅ Paiement de ' + amount.toLocaleString('fr-FR') + ' FCFA déclaré !\nRéférence: ' + ref + '\n\nVotre gestionnaire validera le paiement après vérification.');
    selectedMomo = null;
    document.querySelectorAll('.momo-btn').forEach(b => b.classList.remove('selected'));
    loadDashboard();
  } catch(e) {
    alert('❌ Erreur: ' + e.message);
  } finally {
    btn.innerHTML = '🔒 Payer maintenant';
    btn.disabled = false;
  }
}
function simulatePayment(provider, amount, phone) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        reference: 'PAY-' + Date.now(),
        provider: provider,
        amount: amount
      });
    }, 2000);
  });
}

// 8. Maintenance
function handleFileSelect(input) {
  const preview = document.getElementById('file-preview');
  preview.innerHTML = '';
  
  Array.from(input.files).forEach(file => {
    const div = document.createElement('div');
    div.style.cssText = 'width: 80px; height: 80px; border-radius: 8px; overflow: hidden; position: relative;';
    div.innerHTML = `
      <img src="${URL.createObjectURL(file)}" style="width: 100%; height: 100%; object-fit: cover;">
      <div style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer;">×</div>
    `;
    preview.appendChild(div);
  });
  
  document.querySelector('.photo-upload').classList.add('has-files');
}

async function submitMaintenance(e) {
  e.preventDefault();
  
  const data = {
    type: document.getElementById('maint-type').value,
    description: document.getElementById('maint-desc').value,
    access: document.getElementById('maint-access').value,
    files: document.getElementById('maint-files').files,
    tenantId: 'TENANT_001',
    date: new Date().toISOString()
  };

  // Simulation envoi
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerHTML = '⏳ Envoi...';
  btn.disabled = true;

  setTimeout(() => {
    alert('✅ Demande de maintenance soumise !\nN° ticket: MAINT-' + Date.now());
    e.target.reset();
    document.getElementById('file-preview').innerHTML = '';
    document.querySelector('.photo-upload').classList.remove('has-files');
    btn.innerHTML = '📤 Soumettre la demande';
    btn.disabled = false;
  }, 1500);
}

// 9. Chat
function sendMessage() {
  const input = document.getElementById('chat-message');
  const message = input.value.trim();
  if (!message) return;

  const container = document.getElementById('chat-messages');
  
  // Message envoyé
  const sent = document.createElement('div');
  sent.className = 'chat-bubble sent';
  sent.textContent = message;
  container.appendChild(sent);
  
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Réponse auto (simulation)
  setTimeout(() => {
    const reply = document.createElement('div');
    reply.className = 'chat-bubble received';
    reply.textContent = 'Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.';
    container.appendChild(reply);
    container.scrollTop = container.scrollHeight;
  }, 1000);
}

// 10. Documents
function downloadDoc(docId) {
  alert(`📥 Téléchargement de ${docId}...\n(En production: génération PDF à la volée)`);
}

// 11. Notifications Push
async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notifications activées');
      subscribeToPush();
    }
  }
}

function subscribeToPush() {
  // En production: enregistrement Service Worker + subscription Push API
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (!registration || !registration.pushManager) return;
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_KEY'
      }).catch(e => console.warn('[Push] Subscribe non disponible:', e.message));
    }).catch(e => console.warn('[Push] SW ready non disponible:', e.message));
  }
}

// 6. Commandes Vocales
let recognition = null;
let isListening = false;

function toggleVoice() {
  const btn = document.getElementById('voice-btn');
  
  if (!isListening) {
    startVoiceRecognition();
    btn.classList.add('listening');
    isListening = true;
  } else {
    stopVoiceRecognition();
    btn.classList.remove('listening');
    isListening = false;
  }
}

function startVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎤 Commande:', transcript);
      
      // Traiter la commande via l'AI service
      if (window.ImmoAI) {
        const result = window.ImmoAI.processVoiceCommand(transcript);
        handleVoiceResult(result);
      }
    };

    recognition.onerror = (event) => {
      console.error('Erreur reconnaissance:', event.error);
      toggleVoice();
    };

    recognition.onend = () => {
      if (isListening) toggleVoice();
    };

    recognition.start();
  } else {
    alert('La reconnaissance vocale n\'est pas supportée sur ce navigateur');
  }
}

function stopVoiceRecognition() {
  if (recognition) recognition.stop();
}

function handleVoiceResult(result) {
  if (result.action === 'navigate') {
    showTab(result.view);
    // Mettre à jour les données
    if (result.data) {
      console.log('Données:', result.data);
    }
  }
}

// 12. Dashboard — données réelles du locataire connecté
function _getLocataireConnecte() {
  if (SESSION && SESSION.locId)
    return DATA.locataires.find(l => l.id === SESSION.locId) || null;
  if (SESSION && SESSION.nom && SESSION.role === 'locataire')
    return DATA.locataires.find(l => l.nom === SESSION.nom) || null;
  return null;
}

function loadDashboard() {
  const l = _getLocataireConnecte();
  if (!l) return;

  const im   = DATA.immeubles.find(i => i.id === l.iid) || {};
  const pays = DATA.paiements.filter(p => p.locId === l.id)
                              .sort((a,b) => b.date.localeCompare(a.date));
  const MNOMS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                 'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  // ── Header ──
  const nameEl = document.getElementById('tenant-name');
  if (nameEl) nameEl.textContent = l.nom;
  const subEl = document.getElementById('tenant-sub');
  if (subEl) subEl.textContent = (l.appt ? 'Local ' + l.appt + ' · ' : '') + (im.nom || '');

  // ── KPI Loyer ──
  const rentEl = document.getElementById('dashboard-rent');
  if (rentEl) rentEl.textContent = Number(l.loyer||0).toLocaleString('fr-FR') + ' FCFA';
  const rentTrend = document.getElementById('dashboard-rent-trend');
  if (rentTrend) {
    const solde = l.reste || 0;
    if (solde > 0) {
      const m = Math.ceil(solde / l.loyer);
      rentTrend.innerHTML = '⚠️ ' + m + ' mois de retard';
      rentTrend.style.color = 'var(--red)';
    } else if (solde < 0) {
      rentTrend.innerHTML = '✅ ' + Math.floor(Math.abs(solde)/l.loyer) + " mois d'avance";
      rentTrend.style.color = 'var(--green)';
    } else {
      rentTrend.innerHTML = '✅ À jour';
      rentTrend.style.color = 'var(--green)';
    }
  }

  // ── KPI Solde ──
  const solde = l.reste || 0;
  const balEl = document.getElementById('dashboard-balance');
  if (balEl) {
    balEl.textContent = (solde > 0 ? '' : '') + Number(Math.abs(solde)).toLocaleString('fr-FR') + ' FCFA';
    balEl.style.color = solde > 0 ? 'var(--red)' : 'var(--green)';
  }
  const balTrend = document.getElementById('dashboard-balance-trend');
  if (balTrend) {
    balTrend.textContent = solde > 0 ? '⚠️ Arriéré à régulariser' : '✅ Compte soldé';
    balTrend.style.color  = solde > 0 ? 'var(--red)' : 'var(--green)';
  }

  // ── KPI Bail ──
  const leaseEl = document.getElementById('dashboard-lease');
  const leaseTrend = document.getElementById('dashboard-lease-trend');
  if (leaseEl) {
    if (l.entree) {
      const fin = new Date(l.entree);
      fin.setFullYear(fin.getFullYear() + 1);
      const moisLeft = Math.max(0, Math.ceil((fin - new Date()) / (1000*60*60*24*30)));
      leaseEl.textContent = moisLeft;
      if (leaseTrend) leaseTrend.textContent = '📋 Entrée le ' + new Date(l.entree).toLocaleDateString('fr-FR');
    } else {
      leaseEl.textContent = '–';
      if (leaseTrend) leaseTrend.textContent = "📋 Date d'entrée non renseignée";
    }
  }

  // ── KPI Demandes ──
  const reqEl = document.getElementById('dashboard-requests');
  if (reqEl) reqEl.textContent = '–';

  // ── Historique paiements ──
  const hist = document.getElementById('payment-history');
  if (hist) {
    if (!pays.length) {
      hist.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">Aucun paiement enregistré</div>';
    } else {
      hist.innerHTML = pays.slice(0,12).map(p => {
        const label = (p.type==='caution'?'Caution':'Loyer') + ' — ' + MNOMS[p.moisC] + ' ' + p.anneeC;
        const modeIcon = {mtn:'📱',orange:'🟠',wave:'🌊',especes:'💵',virement:'🏦',cheque:'📝'}[p.mode]||'💰';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:8px;background:var(--green-bg);display:flex;align-items:center;justify-content:center;">${modeIcon}</div>
            <div>
              <div style="font-weight:500;">${label}</div>
              <div style="font-size:11px;color:var(--text3);">${new Date(p.date).toLocaleDateString('fr-FR')}${p.note?' · '+p.note:''}</div>
            </div>
          </div>
          <div style="font-weight:600;color:var(--green);font-family:var(--mono);">${Number(p.montant).toLocaleString('fr-FR')} FCFA</div>
        </div>`;
      }).join('');
    }
  }

  // ── Pré-remplir paiement ──
  const payAmt = document.getElementById('pay-amount');
  if (payAmt) payAmt.value = solde > 0 ? Math.min(solde, l.loyer) : (l.loyer || 0);
  const payPhone = document.getElementById('pay-phone');
  if (payPhone && l.tel && !payPhone.value) payPhone.value = l.tel;

  // ── Documents générés depuis paiements réels ──
  const docList = document.getElementById('doc-list');
  if (docList) {
    const quittances = pays.filter(p => p.type === 'loyer').slice(0, 6);
    const cautionPay = pays.find(p => p.type === 'caution');
    let docsHtml = '';
    quittances.forEach(p => {
      const label = 'Quittance ' + MNOMS[p.moisC] + ' ' + p.anneeC;
      docsHtml += `<div class="doc-item" onclick="ouvrirFicheSuivi(${l.id})">
        <div class="icon">🧾</div>
        <div class="info">
          <div class="name">${label}</div>
          <div class="date">${new Date(p.date).toLocaleDateString('fr-FR')} · ${Number(p.montant).toLocaleString('fr-FR')} FCFA</div>
        </div>
        <div style="color:var(--accent);font-size:18px;">⬇</div>
      </div>`;
    });
    if (cautionPay) {
      docsHtml += `<div class="doc-item">
        <div class="icon">💰</div>
        <div class="info">
          <div class="name">Reçu caution</div>
          <div class="date">${new Date(cautionPay.date).toLocaleDateString('fr-FR')} · ${Number(cautionPay.montant).toLocaleString('fr-FR')} FCFA</div>
        </div>
        <div style="color:var(--accent);font-size:18px;">⬇</div>
      </div>`;
    }
    if (!docsHtml) docsHtml = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;">Aucun document disponible</div>';
    docList.innerHTML = docsHtml;
  }

  // ── Notifications depuis paiements récents ──
  const notifList = document.getElementById('notif-list');
  if (notifList) {
    const recents = pays.slice(0, 3);
    if (!recents.length) {
      notifList.innerHTML = '<div style="text-align:center;padding:24px;color:var(--text3);font-size:13px;">Aucune notification</div>';
    } else {
      notifList.innerHTML = recents.map(p => {
        const label = (p.type==='caution'?'Caution reçue':'Paiement confirmé') + ' — ' + Number(p.montant).toLocaleString('fr-FR') + ' FCFA';
        const ago = Math.round((Date.now() - new Date(p.date)) / (1000*60*60*24));
        return `<div class="notif-item">
          <div class="icon">💳</div>
          <div class="content">
            <div class="title">${label}</div>
            <div class="desc">${MNOMS[p.moisC]} ${p.anneeC}${p.note?' · '+p.note:''}</div>
            <div class="time">Il y a ${ago === 0 ? "aujourd\'hui" : ago + " jour(s)"}</div>
          </div>
        </div>`;
      }).join('');
    }
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  if (typeof SESSION !== 'undefined' && SESSION && SESSION.role === 'locataire') {
    loadDashboard();
  }
  if (typeof requestNotificationPermission === 'function') requestNotificationPermission();
  
  // Initialiser l'AI service
  if (window.ImmoAI) {
    window.ImmoAI.init();
  }
});


// Fonction d'ouverture du portail depuis le menu principal
function openPortailLocataire() {
  document.getElementById('modal-portail-locataire').classList.add('open');
  // Initialiser le portail
  if (typeof loadDashboard === 'function') loadDashboard();
  if (typeof requestNotificationPermission === 'function') requestNotificationPermission();
  if (window.ImmoAI) window.ImmoAI.init();
}

function closePortailLocataire() {
  document.getElementById('modal-portail-locataire').classList.remove('open');
}

// Ajouter le lien dans la sidebar pour les locataires
function addTenantPortalLink() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav && !document.getElementById('nav-portail-locataire')) {
    const link = document.createElement('div');
    link.className = 'nav-item';
    link.id = 'nav-portail-locataire';
    link.innerHTML = '<span class="nav-icon">🏠</span> Espace Locataire';
    link.onclick = openPortailLocataire;
    sidebarNav.appendChild(link);
  }
}

// Ajouter le lien uniquement pour les locataires connectés
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (typeof SESSION !== 'undefined' && SESSION && SESSION.role === 'locataire') addTenantPortalLink();
  }, 1000);
});



// ── Sidebar redimensionnable ──────────────────────────────────────────────────
(function() {
  var isResizing = false;
  var startX, startW;
  document.addEventListener('mousedown', function(e) {
    if (e.target && e.target.id === 'sidebar-resizer') {
      isResizing = true;
      startX = e.clientX;
      var sb = document.getElementById('sidebar-main');
      startW = sb ? sb.offsetWidth : 220;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }
  });
  document.addEventListener('mousemove', function(e) {
    if (!isResizing) return;
    var sb = document.getElementById('sidebar-main');
    if (!sb) return;
    var newW = Math.min(360, Math.max(160, startW + (e.clientX - startX)));
    sb.style.width = newW + 'px';
  });
  document.addEventListener('mouseup', function() {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Sauvegarder la largeur
      var sb = document.getElementById('sidebar-main');
      if (sb) try { localStorage.setItem('immogest_sidebar_w', sb.offsetWidth); } catch(e){}
    }
  });
  // Restaurer la largeur sauvegardée
  document.addEventListener('DOMContentLoaded', function() {
    var saved = parseInt(localStorage.getItem('immogest_sidebar_w'));
    if (saved && saved >= 160 && saved <= 360) {
      var sb = document.getElementById('sidebar-main');
      if (sb) sb.style.width = saved + 'px';
    }
  });
})();

