// ═══════════════════════════════════════════════════════════════
// SIGNATURE ÉLECTRONIQUE — ImmoGest v2
// Canvas de signature + vérification par code unique
// ═══════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.signature = (function() {

  function esc(s) { return window.IG.utils ? window.IG.utils.esc(s) : String(s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  var _sigDrawing = false;
  var _sigHasContent = false;

  // ── Génération code unique SHA-256 ────────────────────────────
  async function _genCode(content) {
    var encoder = new TextEncoder();
    var data = encoder.encode(content + Date.now());
    var buf = await crypto.subtle.digest('SHA-256', data);
    var hex = Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
    return 'IG-' + new Date().getFullYear() + '-' + hex.substring(0,8).toUpperCase();
  }

  // ── Ouvrir modale de signature ────────────────────────────────
  function ouvrirModal(options) {
    // options: { locataireId, locataireNom, type, titre, onSigned }
    var existing = document.getElementById('sig-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'sig-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';

    overlay.innerHTML =
      '<div style="background:var(--bg2,#1a2535);border-radius:16px;padding:24px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
      '<h3 style="margin:0;font-size:16px;font-weight:800;color:var(--text,#e8f0fe)">✍️ Signature électronique</h3>' +
      '<button onclick="window.IG.signature.fermerModal()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3)">✕</button>' +
      '</div>' +
      '<div style="background:var(--bg3,#243040);border-radius:8px;padding:12px;margin-bottom:14px;font-size:13px;color:var(--text)">' +
      '<strong>' + esc(options.titre || 'Contrat de bail') + '</strong><br>' +
      '<span style="color:var(--text3)">Signataire : ' + esc(options.locataireNom || '') + '</span>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--text3);margin:0 0 10px;">Signez dans le cadre ci-dessous avec votre doigt ou la souris :</p>' +
      '<canvas id="sig-canvas" style="border:2px dashed var(--border2,#2e4060);border-radius:8px;width:100%;height:180px;cursor:crosshair;touch-action:none;display:block;background:#fff;"></canvas>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">' +
      '<button onclick="window.IG.signature.effacer()" style="font-size:12px;background:none;border:1px solid var(--border2);border-radius:6px;padding:5px 12px;cursor:pointer;color:var(--text3)">🗑 Effacer</button>' +
      '<span id="sig-status" style="font-size:11px;color:var(--text3)">Dessinez votre signature</span>' +
      '</div>' +
      '<div style="margin-top:14px;padding:10px 12px;background:rgba(255,184,0,0.1);border-radius:8px;font-size:11px;color:#E0A040;">' +
      '⚖️ Valeur légale — loi camerounaise n°2010/021 sur le commerce électronique (OHADA).' +
      '</div>' +
      '<div style="display:flex;gap:10px;margin-top:16px;">' +
      '<button onclick="window.IG.signature.fermerModal()" style="flex:1;padding:11px;border:1px solid var(--border2);background:none;border-radius:8px;cursor:pointer;font-size:13px;color:var(--text)">Annuler</button>' +
      '<button id="sig-valider-btn" onclick="window.IG.signature._valider(' + JSON.stringify(options).replace(/"/g,'&quot;') + ')" style="flex:2;padding:11px;background:var(--accent,#0E6AAF);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;">✅ Valider</button>' +
      '</div></div>';

    document.body.appendChild(overlay);
    _initCanvas();
    // Stocker options pour récupération dans _valider
    overlay._opts = options;
  }

  function fermerModal() {
    var el = document.getElementById('sig-modal-overlay');
    if (el) el.remove();
    _sigDrawing = false;
    _sigHasContent = false;
  }

  // ── Canvas drawing ────────────────────────────────────────────
  function _initCanvas() {
    var canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    _sigDrawing = false;
    _sigHasContent = false;

    function pos(e) {
      var r = canvas.getBoundingClientRect();
      var s = e.touches ? e.touches[0] : e;
      return { x: s.clientX - r.left, y: s.clientY - r.top };
    }
    function start(e) { e.preventDefault(); _sigDrawing = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
    function move(e)  { e.preventDefault(); if (!_sigDrawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); _sigHasContent = true; var st = document.getElementById('sig-status'); if (st) st.textContent = '✓ Signature en cours…'; }
    function end()    { _sigDrawing = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove',  move,  { passive: false });
    canvas.addEventListener('touchend',   end);
  }

  function effacer() {
    var canvas = document.getElementById('sig-canvas');
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    _sigHasContent = false;
    var st = document.getElementById('sig-status');
    if (st) st.textContent = 'Dessinez votre signature';
  }

  // ── Valider et enregistrer ────────────────────────────────────
  async function _valider(options) {
    if (!_sigHasContent) {
      if (window.IG.utils) window.IG.utils.showToast('Veuillez dessiner votre signature', 'red');
      return;
    }
    var btn = document.getElementById('sig-valider-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Enregistrement…'; }

    var canvas = document.getElementById('sig-canvas');
    var signatureDataUrl = canvas.toDataURL('image/png');
    var session = window.IG.auth ? window.IG.auth.getSession() : {};
    var content = (options.locataireId || '') + '|' + (options.type || '') + '|' + (options.titre || '') + '|' + Date.now();
    var code = await _genCode(content);

    var row = {
      locataire_id:   options.locataireId || null,
      locataire_nom:  options.locataireNom || '',
      type_document:  options.type || 'contrat_bail',
      titre_document: options.titre || 'Contrat de bail',
      code:           code,
      signature_data: signatureDataUrl,
      signed_at:      new Date().toISOString(),
      user_agent:     navigator.userAgent.substring(0, 200),
    };

    try {
      if (window.IG.db) await window.IG.db.insert('signatures', [row]);
    } catch(e) {
      console.warn('[Signature] Enregistrement DB échoué (mode offline):', e.message);
    }

    fermerModal();
    _afficherSucces(code, row, options.onSigned);
  }

  function _afficherSucces(code, data, onSigned) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';
    overlay.innerHTML =
      '<div style="background:var(--bg2,#1a2535);border-radius:16px;padding:28px;max-width:400px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
      '<div style="font-size:48px;margin-bottom:12px;">✅</div>' +
      '<h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:var(--green,#0E7A45)">Document signé !</h3>' +
      '<p style="font-size:13px;color:var(--text3);margin:0 0 20px">La signature électronique a été enregistrée.</p>' +
      '<div style="background:rgba(14,122,69,0.1);border:1px solid rgba(14,122,69,0.3);border-radius:10px;padding:16px;margin-bottom:20px;">' +
      '<div style="font-size:11px;color:var(--green);font-weight:600;margin-bottom:6px;">CODE DE VÉRIFICATION</div>' +
      '<div style="font-size:22px;font-weight:900;color:var(--green);letter-spacing:2px;">' + esc(code) + '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:6px;">Conservez ce code pour vérifier l\'authenticité du document</div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-bottom:20px">Signé le ' + new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) + '</div>' +
      '<div style="display:flex;gap:10px;">' +
      '<button onclick="this.closest(\'div[style]\').remove()" style="flex:1;padding:11px;border:1px solid var(--border2);background:none;border-radius:8px;cursor:pointer;color:var(--text);font-family:var(--font)">Fermer</button>' +
      '<button onclick="navigator.clipboard.writeText(\'' + esc(code) + '\').then(function(){this.textContent=\'✓ Copié!\'})" style="flex:1;padding:11px;background:var(--accent);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-family:var(--font)">📋 Copier</button>' +
      '</div>' +
      (data.signature_data ? '<img src="' + data.signature_data + '" style="width:100%;max-height:60px;object-fit:contain;margin-top:14px;border-top:1px solid var(--border2);padding-top:12px;" alt="Signature">' : '') +
      '</div>';
    document.body.appendChild(overlay);
    if (typeof onSigned === 'function') onSigned(code, data);
  }

  // ── Vérification publique ─────────────────────────────────────
  function renderVerification() {
    var content = document.getElementById('page-content');
    if (!content) return;
    content.innerHTML =
      '<div class="content"><div style="max-width:500px;margin:40px auto;padding:0 16px">' +
      '<div style="text-align:center;margin-bottom:28px"><div style="font-size:40px">🔍</div>' +
      '<h2 style="font-size:18px;font-weight:800;margin:8px 0 4px;color:var(--text)">Vérification de document</h2>' +
      '<p style="font-size:13px;color:var(--text3)">Entrez le code de vérification pour authentifier un document ImmoGest</p></div>' +
      '<div class="card">' +
      '<input id="verif-code-input" placeholder="Ex: IG-2026-AB3F1234" ' +
        'style="width:100%;padding:13px;border:2px solid var(--border2);border-radius:8px;font-size:15px;text-align:center;letter-spacing:2px;box-sizing:border-box;text-transform:uppercase;background:var(--bg4);color:var(--text)" ' +
        'oninput="this.value=this.value.toUpperCase()">' +
      '<button onclick="window.IG.signature.verifier()" style="width:100%;margin-top:10px;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🔍 Vérifier</button>' +
      '<div id="verif-result" style="margin-top:14px;"></div>' +
      '</div></div></div>';
  }

  async function verifier() {
    var input = document.getElementById('verif-code-input');
    var result = document.getElementById('verif-result');
    if (!input || !result) return;
    var code = input.value.trim().toUpperCase();
    if (!code) { result.innerHTML = '<div style="color:var(--red);font-size:13px;text-align:center">Veuillez saisir un code.</div>'; return; }
    result.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text3)">⏳ Vérification…</div>';

    try {
      var sigs = await window.IG.db.select('signatures', { code: code });
      var sig = sigs && sigs[0];
      if (!sig) {
        result.innerHTML = '<div style="background:var(--red-bg);border:1px solid var(--red);border-radius:10px;padding:16px;text-align:center">' +
          '<div style="font-size:28px;margin-bottom:8px">❌</div>' +
          '<div style="font-weight:700;color:var(--red)">Code invalide</div>' +
          '<div style="font-size:12px;color:var(--text3);margin-top:4px">Ce code ne correspond à aucun document ImmoGest.</div></div>';
        return;
      }
      result.innerHTML = '<div style="background:rgba(14,122,69,0.08);border:1px solid rgba(14,122,69,0.3);border-radius:10px;padding:16px">' +
        '<div style="text-align:center;margin-bottom:12px"><div style="font-size:32px">✅</div>' +
        '<div style="font-weight:800;color:var(--green);font-size:15px">Document authentique</div></div>' +
        '<div style="font-size:13px;line-height:2;color:var(--text)">' +
        '<b>Type :</b> ' + esc(sig.titre_document || sig.type_document) + '<br>' +
        '<b>Signataire :</b> ' + esc(sig.locataire_nom) + '<br>' +
        '<b>Signé le :</b> ' + (sig.signed_at ? new Date(sig.signed_at).toLocaleDateString('fr-FR') + ' à ' + new Date(sig.signed_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) : '–') + '<br>' +
        '<b>Code :</b> <span style="font-family:monospace;font-weight:700;letter-spacing:1px">' + esc(sig.code) + '</span>' +
        '</div>' +
        (sig.signature_data ? '<img src="' + sig.signature_data + '" style="width:100%;max-height:80px;object-fit:contain;margin-top:12px;border-top:1px solid rgba(14,122,69,0.2);padding-top:12px" alt="Signature">' : '') +
        '</div>';
    } catch(e) {
      result.innerHTML = '<div style="color:var(--red);font-size:13px;text-align:center">Erreur: ' + esc(e.message) + '</div>';
    }
  }

  // ── Bouton rapide depuis fiche locataire ──────────────────────
  function signerContratBail(locId, locNom) {
    ouvrirModal({
      locataireId:  locId,
      locataireNom: locNom,
      type:         'contrat_bail',
      titre:        'Contrat de bail — ' + locNom,
      onSigned: function(code) {
        if (window.IG.utils) window.IG.utils.showToast('Contrat signé ✓ Code : ' + code, 'green');
      }
    });
  }

  return {
    ouvrirModal, fermerModal, effacer, _valider,
    renderVerification, verifier, signerContratBail
  };

})();

// Alias globaux pour compatibilité avec les onclick HTML existants
function ouvrirModalSignature(opts)  { window.IG.signature.ouvrirModal(opts); }
function fermerModalSignature()       { window.IG.signature.fermerModal(); }
function effacerSignature()           { window.IG.signature.effacer(); }
function afficherBoutonSignature(id, nom) { window.IG.signature.signerContratBail(id, nom); }
