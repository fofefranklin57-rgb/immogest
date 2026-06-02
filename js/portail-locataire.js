// ==================== PORTAIL LOCATAIRE JS ====================

let currentTab = 'dashboard';
let selectedMomo = null;

// ═══════════════════════════════════════════════════════════
// SYSTÈME PUBLICITAIRE — PropellerAds / FAN-ready
// Config dans DATA.settings.ads (modifiable depuis Paramètres)
// Affiché uniquement pour locataire et propriétaire (gratuits)
// Jamais pour gestionnaire/admin/comptable (abonnés)
// ═══════════════════════════════════════════════════════════

function _adConfig() {
  const cfg = (typeof DATA !== 'undefined' && DATA.settings && DATA.settings.ads) ? DATA.settings.ads : {};
  return {
    enabled:    cfg.enabled !== false,          // actif par défaut
    network:    cfg.network    || 'propellerads',
    zoneNative: cfg.zoneNative || '',           // ID zone banner native PropellerAds
    zoneSticky: cfg.zoneSticky || '',           // ID zone sticky 320x50
    publisherId:cfg.publisherId|| '',           // Publisher ID PropellerAds
  };
}

function _adShouldShow() {
  if (typeof SESSION === 'undefined' || !SESSION) return false;
  const noAdRoles = ['admin','gestionnaire','comptable'];
  if (noAdRoles.includes(SESSION.role)) return false;
  return _adConfig().enabled;
}

function initPortailAds() {
  if (!_adShouldShow()) {
    // Cacher tous les slots
    ['ad-slot-portail-sticky','ad-slot-portail-native'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    return;
  }
  const cfg = _adConfig();

  // ── Bannière sticky bas ──────────────────────────────────
  const sticky = document.getElementById('ad-slot-portail-sticky');
  if (sticky) {
    if (cfg.publisherId && cfg.zoneSticky) {
      sticky.innerHTML =
        '<span class="ad-label">Publicité</span>' +
        '<div id="pa-zone-sticky"></div>';
      _adLoadPropellerads(cfg.publisherId, cfg.zoneSticky, 'pa-zone-sticky');
    } else {
      // Placeholder visuel (en attente config)
      sticky.innerHTML = _adPlaceholder('320x50');
    }
  }

  // ── Bannière native entre sections ──────────────────────
  const native = document.getElementById('ad-slot-portail-native');
  if (native) {
    if (cfg.publisherId && cfg.zoneNative) {
      native.innerHTML =
        '<span class="ad-label">Publicité</span>' +
        '<div id="pa-zone-native"></div>';
      _adLoadPropellerads(cfg.publisherId, cfg.zoneNative, 'pa-zone-native');
    } else {
      native.innerHTML = _adPlaceholder('320x100');
    }
  }
}

function _adLoadPropellerads(publisherId, zoneId, containerId) {
  // Injecter le script PropellerAds si pas déjà chargé
  const scriptId = 'pa-script-' + zoneId;
  if (document.getElementById(scriptId)) return;
  const s = document.createElement('script');
  s.id = scriptId;
  s.async = true;
  s.src = 'https://a.magsrv.com/ad-provider.js';
  s.onload = function() {
    if (window.AdProvider) {
      window.AdProvider.push({ serve: { id: zoneId } });
    }
  };
  const container = document.getElementById(containerId);
  if (container) {
    // Insérer un ins PropellerAds standard
    container.innerHTML = `<ins class="adsbymagsrv" data-ad-client="${publisherId}" data-ad-slot="${zoneId}" style="display:inline-block;"></ins>`;
  }
  document.head.appendChild(s);
}

// Placeholder en attente de configuration
function _adPlaceholder(size) {
  const [w, h] = size.split('x');
  return `<div style="width:${w}px;height:${h}px;background:linear-gradient(135deg,#f0f4f8,#e2e8f0);
    display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:6px;
    color:#a0aec0;font-size:11px;gap:4px;">
    <span style="font-size:18px;">📢</span>
    <span>Pub ${size}</span>
    <span style="font-size:9px;">Configurer dans Paramètres → Publicités</span>
  </div>`;
}

// Navigation
function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.getElementById('tab-' + tab).style.display = 'block';
  document.querySelectorAll('.tenant-nav button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  currentTab = tab;
  if (tab === 'maintenance') loadMaintHistory();
  if (tab === 'documents') loadDocumentsLocataire();
  if (tab === 'chat') locMsgCharger();
  if (tab === 'mafiche') loadMaFiche();
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
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerHTML = '⏳ Envoi...';
  btn.disabled = true;

  const loc = _getLocataireConnecte();
  const locId = loc ? loc.id : null;
  const immId = loc ? loc.iid : null;

  const row = {
    locataire_id: locId,
    immeuble_id: immId,
    type: document.getElementById('maint-type').value,
    description: document.getElementById('maint-desc').value,
    acces: document.getElementById('maint-access').value,
    statut: 'nouveau'
  };

  const result = await insertMaintenance(row);
  if (result) {
    e.target.reset();
    document.getElementById('file-preview').innerHTML = '';
    const pu = document.querySelector('.photo-upload');
    if (pu) pu.classList.remove('has-files');
    btn.innerHTML = '📤 Soumettre la demande';
    btn.disabled = false;
    // Afficher confirmation avec vrai numéro de ticket
    const ticketShort = result.id.slice(0,8).toUpperCase();
    document.getElementById('maint-history').insertAdjacentHTML('afterbegin',
      renderMaintCard(result, ticketShort));
    alert('✅ Demande soumise !\nN° ticket : MAINT-' + ticketShort);
  } else {
    alert('❌ Erreur lors de l\'envoi. Vérifiez votre connexion.');
    btn.innerHTML = '📤 Soumettre la demande';
    btn.disabled = false;
  }
}

function renderMaintCard(m, ticketShort) {
  const statutColors = { nouveau: '#e74c3c', en_cours: '#f39c12', resolu: '#27ae60' };
  const statutLabels = { nouveau: 'Nouveau', en_cours: 'En cours', resolu: 'Résolu' };
  const sc = statutColors[m.statut] || '#999';
  const dateStr = m.date_soumission ? new Date(m.date_soumission).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  return `<div style="border:1px solid var(--border,#ddd);border-left:4px solid ${sc};border-radius:10px;padding:12px;margin-bottom:10px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
      <div>
        <div style="font-weight:600;font-size:14px;">${m.type}</div>
        <div style="font-size:12px;color:#666;margin-top:2px;">📅 ${dateStr} · N° MAINT-${ticketShort || m.id.slice(0,8).toUpperCase()}</div>
        <div style="font-size:13px;margin-top:6px;">${m.description}</div>
        ${m.note_gestionnaire ? `<div style="font-size:12px;color:#0E6AAF;margin-top:6px;background:#EBF5FB;padding:6px 10px;border-radius:6px;">💬 ${m.note_gestionnaire}</div>` : ''}
      </div>
      <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${sc}22;color:${sc};">${statutLabels[m.statut] || m.statut}</span>
    </div>
  </div>`;
}

async function loadMaintHistory() {
  const loc = _getLocataireConnecte();
  const locId = loc ? loc.id : null;
  if (!locId) return;
  const histDiv = document.getElementById('maint-history');
  if (!histDiv) return;
  histDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">⏳ Chargement...</div>';
  const items = await loadMaintenancesByLocataire(locId);
  if (!items || items.length === 0) {
    histDiv.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">Aucune demande pour l\'instant</div>';
    return;
  }
  histDiv.innerHTML = items.map(m => renderMaintCard(m)).join('');
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
async function loadDocumentsLocataire() {
  const loc = _getLocataireConnecte();
  if (!loc) return;
  const container = document.getElementById('docs-contrat-section');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:16px;color:#999;">⏳ Chargement...</div>';
  const contrat = await loadContratByLocataire(loc.id);

  if (!contrat || !contrat.autorise_locataire) {
    container.innerHTML = `<div style="text-align:center;padding:24px;color:#999;">
      🔒 Votre contrat de bail n'est pas encore disponible.<br>
      <span style="font-size:12px;">Contactez votre gestionnaire pour en demander l'accès.</span>
    </div>`;
    return;
  }

  container.innerHTML = `<div style="padding:12px;background:#EBF5FB;border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div>
      <div style="font-weight:600;font-size:14px;">📜 Contrat de bail</div>
      <div style="font-size:12px;color:#555;">Signé le ${contrat.date_contrat ? new Date(contrat.date_contrat).toLocaleDateString('fr-FR') : '–'}</div>
    </div>
    <button onclick="telechargerMonContrat()" style="padding:8px 16px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px;">📥 Voir / Télécharger PDF</button>
  </div>`;
}

async function telechargerMonContrat() {
  const loc = _getLocataireConnecte();
  if (!loc) return;
  // Réutiliser la fonction de génération de app.js
  if (typeof genererContratPourLocataire === 'function') {
    await genererContratPourLocataire(loc.id);
  }
}

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
  // Push géré par OneSignal SDK — pas de souscription manuelle nécessaire
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

  // ── Graphique 12 mois ──
  const chartEl = document.getElementById('dashboard-chart');
  const chartLabels = document.getElementById('dashboard-chart-labels');
  const chartLegend = document.getElementById('dashboard-chart-legend');
  if (chartEl) {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ m: d.getMonth(), y: d.getFullYear(), label: MNOMS[d.getMonth()].slice(0,3) });
    }
    const totals = months.map(mo => {
      return pays.filter(p => p.moisC === mo.m && p.anneeC === mo.y)
                 .reduce((s, p) => s + (p.montant || 0), 0);
    });
    const maxVal = Math.max(...totals, l.loyer || 1);
    const loyer = l.loyer || 0;
    chartEl.innerHTML = totals.map((t, i) => {
      const pct = Math.round((t / maxVal) * 100);
      const color = t === 0 ? 'var(--red-bg)' : t >= loyer ? 'var(--green)' : 'var(--yellow)';
      const border = t === 0 ? '1px solid var(--red)' : 'none';
      return `<div title="${months[i].label} ${months[i].y} : ${t.toLocaleString('fr-FR')} FCFA" style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:100%;background:${color};border:${border};border-radius:4px 4px 0 0;height:${Math.max(pct,2)}%;min-height:${t>0?'4px':'2px'};transition:height .3s;"></div>
      </div>`;
    }).join('');
    chartLabels.innerHTML = months.map((mo, i) => {
      const isCurrent = mo.m === now.getMonth() && mo.y === now.getFullYear();
      return `<div style="flex:1;text-align:center;font-size:9px;color:${isCurrent?'var(--accent)':'var(--text3)'};font-weight:${isCurrent?'700':'400'};">${mo.label}</div>`;
    }).join('');
    const totalAnnee = totals.reduce((s,t)=>s+t,0);
    if (chartLegend) chartLegend.textContent = 'Total : ' + totalAnnee.toLocaleString('fr-FR') + ' FCFA';
  }

  // ── Historique paiements ──
  const histCount = document.getElementById('dashboard-hist-count');
  if (histCount) histCount.textContent = pays.length + ' paiement(s)';
  const hist = document.getElementById('payment-history');
  if (hist) {
    if (!pays.length) {
      hist.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px;">Aucun paiement enregistré</div>';
    } else {
      hist.innerHTML = pays.map(p => {
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

  // OneSignal: associer le locataire + demander permission
  if (typeof loginOneSignal === 'function' && l) {
    loginOneSignal('loc_' + l.id, {
      role:   'locataire',
      loc_id: String(l.id),
      imm_id: String(l.iid || '')
    });
    setTimeout(requestNotificationPermission, 2000);
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
  if (typeof loadDashboard === 'function') loadDashboard();
  if (typeof requestNotificationPermission === 'function') requestNotificationPermission();
  if (window.ImmoAI) window.ImmoAI.init();
  // Initialiser les pubs (locataire = gratuit → pub ok)
  setTimeout(initPortailAds, 300);
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

// ═══════════════════════════════════════════════════════════
// MESSAGERIE LOCATAIRE — v2
// Le locataire peut écrire au gestionnaire et à son proprio
// ═══════════════════════════════════════════════════════════

async function locMsgCharger() {
  const el = document.getElementById('loc-msg-liste');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);font-size:13px;">⏳ Chargement…</div>';
  if (typeof _sb === 'undefined' || !SESSION) { el.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text3);">Non connecté</div>'; return; }
  try {
    const [r1, r2] = await Promise.all([
      _sb.from('messages_internes').select('*').eq('pour_user_id', SESSION.userId).order('date_envoi',{ascending:false}),
      _sb.from('messages_internes').select('*').eq('de_user_id',   SESSION.userId).order('date_envoi',{ascending:false})
    ]);
    const tous = [];
    const ids = new Set();
    (r1.data||[]).concat(r2.data||[]).forEach(m => { if (!ids.has(m.id)){ ids.add(m.id); tous.push(m); } });
    tous.sort((a,b) => b.date_envoi > a.date_envoi ? 1 : -1);
    if (!tous.length) {
      el.innerHTML = '<div style="text-align:center;padding:40px 16px;color:var(--text3);font-size:13px;">💬<br><br>Aucun message.<br><button onclick="locMsgNouveauModal()" style="margin-top:12px;padding:8px 18px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:12px;">✉️ Écrire au gestionnaire</button></div>';
      return;
    }
    const MNOMS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    el.innerHTML = tous.map(m => {
      const isMine = m.de_user_id === SESSION.userId;
      const nonLu  = !m.lu && !isMine;
      const autre  = isMine ? (m.pour_nom||m.pour_user_id) : (m.de_nom||m.de_user_id);
      const d = new Date(m.date_envoi);
      const dt = d.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
      const preview = (m.corps||'').replace(/\n/g,' ').slice(0,80);
      return `<div onclick="locMsgOuvrir('${m.id}')" style="padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;${nonLu?'background:var(--bg3);':''}display:flex;align-items:center;gap:12px;">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${autre.slice(0,2).toUpperCase()}</div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-weight:${nonLu?'700':'500'};font-size:13px;">${nonLu?'● ':''}<b>${autre}</b></div>
            <div style="font-size:10px;color:var(--text3);">${dt}</div>
          </div>
          <div style="font-size:12px;color:var(--text2);font-weight:${nonLu?'600':'400'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.sujet||'(sans sujet)'}</div>
          <div style="font-size:11px;color:var(--text3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${preview}</div>
        </div>
      </div>`;
    }).join('');
  } catch(e) {
    el.innerHTML = '<div style="padding:20px;color:var(--text3);font-size:12px;">Erreur chargement : ' + e.message + '</div>';
  }
}

async function locMsgOuvrir(id) {
  if (typeof _sb === 'undefined') return;
  const { data: msgs } = await _sb.from('messages_internes').select('*').eq('id', id).limit(1);
  const msg = msgs && msgs[0];
  if (!msg) return;
  if (!msg.lu && msg.pour_user_id === SESSION.userId) {
    await _sb.from('messages_internes').update({ lu: true }).eq('id', id);
  }
  const dt = new Date(msg.date_envoi).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const sujetEsc = (msg.sujet||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
  const deIdEsc  = (msg.de_user_id||'').replace(/'/g,"\\'");
  const deNomEsc = (msg.de_nom||'').replace(/'/g,"\\'");
  if (typeof showModal === 'function') {
    showModal(`<div style="max-width:500px;">
      <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:10px;">${msg.sujet||'(sans sujet)'}</div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:4px;">De : <strong>${msg.de_nom||msg.de_user_id}</strong> → <strong>${msg.pour_nom||msg.pour_user_id}</strong></div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:14px;">${dt}</div>
      <hr style="border:none;border-top:1px solid var(--border);margin-bottom:14px;">
      <div style="font-size:14px;line-height:1.7;white-space:pre-wrap;color:var(--text);">${msg.corps||''}</div>
      <div style="margin-top:18px;">
        <div style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;margin-bottom:6px;">Réponse rapide</div>
        <textarea id="loc-reply-corps" rows="3" placeholder="Votre réponse…"
          style="width:100%;padding:9px;border:1.5px solid var(--border);border-radius:8px;font-size:13px;font-family:var(--font);resize:none;background:var(--bg);color:var(--text);box-sizing:border-box;"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button onclick="locMsgRepondre('${deIdEsc}','${deNomEsc}','${sujetEsc}')" class="btn btn-primary" style="flex:1;">↩ Répondre</button>
          <button onclick="closeModals()" class="btn btn-ghost">Fermer</button>
        </div>
      </div>
    </div>`);
  }
}

async function locMsgRepondre(destId, destNom, sujetOriginal) {
  const corps = ((document.getElementById('loc-reply-corps')||{}).value||'').trim();
  if (!corps) { if (typeof showToast === 'function') showToast('Message vide', 'red'); return; }
  const sujet = sujetOriginal.startsWith('Re:') ? sujetOriginal : 'Re: ' + sujetOriginal;
  try {
    const { error } = await _sb.from('messages_internes').insert([{
      de_user_id: SESSION.userId, de_nom: SESSION.nom,
      pour_user_id: destId, pour_nom: destNom,
      sujet, corps, lu: false
    }]);
    if (error) throw error;
    if (typeof closeModals === 'function') closeModals();
    if (typeof showToast === 'function') showToast('Réponse envoyée ✓', 'green');
    locMsgCharger();
  } catch(e) {
    if (typeof showToast === 'function') showToast('Erreur : ' + e.message, 'red');
  }
}

async function locMsgNouveauModal() {
  // Construire la liste des destinataires accessibles au locataire
  const dests = [];
  if (typeof USERS !== 'undefined' && Array.isArray(USERS)) {
    USERS.filter(u => u.version === 'entreprise' && ['admin','gestionnaire'].includes(u.role))
      .forEach(u => dests.push({ id: u.id, nom: u.nom, label: u.nom + ' — Gestionnaire' }));
    const loc = (typeof DATA !== 'undefined' && SESSION.locId) ? DATA.locataires.find(l => l.id === SESSION.locId) : null;
    const iid = loc ? loc.iid : null;
    if (iid) {
      USERS.filter(u => u.version === 'entreprise' && u.role === 'proprietaire' && (u.immeubles||[]).includes(iid))
        .forEach(u => dests.push({ id: u.id, nom: u.nom, label: u.nom + ' — Propriétaire' }));
    }
  }
  if (!dests.length) {
    if (typeof showToast === 'function') showToast('Aucun gestionnaire disponible', 'red'); return;
  }
  const opts = dests.map(d => `<option value="${d.id}|||${d.nom.replace(/"/g,'&quot;')}">${d.label}</option>`).join('');
  if (typeof showModal === 'function') {
    showModal(`<div style="max-width:480px;">
      <div style="font-weight:700;font-size:15px;margin-bottom:14px;">✉️ Nouveau message</div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;">Destinataire</label>
        <select id="loc-msg-dest" style="width:100%;margin-top:4px;padding:9px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--font);background:var(--bg);color:var(--text);">${opts}</select>
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;">Sujet</label>
        <input type="text" id="loc-msg-sujet" placeholder="Sujet…" style="width:100%;margin-top:4px;padding:9px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--font);background:var(--bg);color:var(--text);box-sizing:border-box;">
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:11px;font-weight:600;color:var(--text3);text-transform:uppercase;">Message</label>
        <textarea id="loc-msg-corps" rows="4" placeholder="Votre message…" style="width:100%;margin-top:4px;padding:9px;border:1.5px solid var(--border);border-radius:8px;font-family:var(--font);resize:vertical;background:var(--bg);color:var(--text);box-sizing:border-box;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button onclick="locMsgEnvoyer()" class="btn btn-primary" style="flex:1;">📤 Envoyer</button>
        <button onclick="closeModals()" class="btn btn-ghost">Annuler</button>
      </div>
    </div>`);
  }
}

async function locMsgEnvoyer() {
  const destVal = ((document.getElementById('loc-msg-dest')||{}).value||'');
  const [pourId, pourNom] = destVal.split('|||');
  const sujet = ((document.getElementById('loc-msg-sujet')||{}).value||'').trim();
  const corps = ((document.getElementById('loc-msg-corps')||{}).value||'').trim();
  if (!pourId || !corps) { if (typeof showToast === 'function') showToast('Remplissez tous les champs', 'red'); return; }
  try {
    const { error } = await _sb.from('messages_internes').insert([{
      de_user_id: SESSION.userId, de_nom: SESSION.nom,
      pour_user_id: pourId, pour_nom: pourNom,
      sujet: sujet||'(sans sujet)', corps, lu: false
    }]);
    if (error) throw error;
    if (typeof closeModals === 'function') closeModals();
    if (typeof showToast === 'function') showToast('Message envoyé ✓', 'green');
    locMsgCharger();
  } catch(e) {
    if (typeof showToast === 'function') showToast('Erreur : ' + e.message, 'red');
  }
}

// ── MA FICHE — lecture seule ──────────────────────────────────────
function loadMaFiche() {
  const el = document.getElementById('tab-mafiche');
  if (!el) return;
  const l = _getLocataireConnecte();
  if (!l) { el.innerHTML = '<div class="card"><p style="color:var(--text3);padding:20px;">Fiche introuvable.</p></div>'; return; }

  const im = DATA.immeubles.find(i => i.id === l.iid) || {};
  const MNOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const pays = DATA.paiements.filter(p => p.locId === l.id).sort((a,b) => b.date.localeCompare(a.date));

  const statutColors = { payé:'var(--green)', impayé:'var(--red)', partiel:'var(--yellow)', libre:'var(--text3)' };
  const statutColor  = statutColors[l.s] || 'var(--text3)';
  const solde = l.reste || 0;
  const soldeColor = solde > 0 ? 'var(--red)' : 'var(--green)';
  const soldeLabel = solde > 0 ? '⚠️ Arriéré de ' + Number(solde).toLocaleString('fr-FR') + ' FCFA'
                   : solde < 0 ? '✅ Avance de ' + Number(Math.abs(solde)).toLocaleString('fr-FR') + ' FCFA'
                   : '✅ À jour';

  const histo = pays.slice(0, 10).map(p => {
    const mLabel = (p.moisC !== undefined ? MNOMS[p.moisC] : (p.mois ? MNOMS[p.mois-1] : '—')) + ' ' + (p.anneeC || p.annee || '');
    return `<tr>
      <td style="font-size:12px;">${new Date(p.date).toLocaleDateString('fr-FR')}</td>
      <td style="font-size:12px;">${mLabel}</td>
      <td style="font-size:12px;font-weight:600;color:var(--green);">${Number(p.montant||0).toLocaleString('fr-FR')} FCFA</td>
      <td style="font-size:11px;color:var(--text3);">${p.mode||'—'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:16px;font-style:italic;">Aucun paiement enregistré</td></tr>';

  el.innerHTML = `
    <div class="card" style="margin-bottom:16px;">
      <div class="card-header">
        <div class="card-title">📋 Ma fiche locative</div>
        <span style="font-size:11px;color:var(--text3);font-style:italic;">🔒 Lecture seule</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:4px 0;">
        ${ficheRow('🏠 Immeuble', im.nom || '—')}
        ${ficheRow('📍 Ville', [im.ville, im.quartier].filter(Boolean).join(' · ') || '—')}
        ${ficheRow('🚪 Local / Appt', l.appt || '—')}
        ${ficheRow('📦 Type', l.type || '—')}
        ${ficheRow('📅 Date d\'entrée', l.entree ? new Date(l.entree).toLocaleDateString('fr-FR') : '—')}
        ${ficheRow('💰 Loyer mensuel', Number(l.loyer||0).toLocaleString('fr-FR') + ' FCFA')}
        ${ficheRow('🔐 Caution versée', Number(l.caution||0).toLocaleString('fr-FR') + ' FCFA')}
        ${ficheRow('📊 Statut', '<span style="color:'+statutColor+';font-weight:700;">'+(l.s||'—')+'</span>')}
        ${ficheRow('💳 Solde', '<span style="color:'+soldeColor+';font-weight:700;">'+soldeLabel+'</span>')}
        ${l.obs ? ficheRow('📝 Observations', l.obs) : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">💳 Historique des paiements</div>
        <span style="font-size:11px;color:var(--text3);">${pays.length} paiement(s) au total</span>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Période</th><th>Montant</th><th>Mode</th></tr></thead>
          <tbody>${histo}</tbody>
        </table>
      </div>
    </div>`;
}

function ficheRow(label, val) {
  return '<div style="padding:10px 14px;background:var(--bg4);border-radius:8px;">'
    + '<div style="font-size:11px;color:var(--text3);font-weight:600;margin-bottom:4px;">'+label+'</div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--text1);">'+val+'</div>'
    + '</div>';
}
