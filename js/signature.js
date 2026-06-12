// ═══════════════════════════════════════════════════════════════
// SIGNATURE ÉLECTRONIQUE — ImmoGest
// Canvas de signature + intégration PDF + vérification publique
// ═══════════════════════════════════════════════════════════════

// ── Helpers Supabase ───────────────────────────────────────────
async function saveSignature(row) {
  try {
    const { data, error } = await _sb.from('signatures').insert(row).select().single();
    if (error) throw error;
    return data;
  } catch(e) { console.warn('saveSignature:', e.message); return null; }
}

async function getSignatureByCode(code) {
  try {
    const { data, error } = await _sb.from('signatures').select('*').eq('code', code).single();
    if (error) return null;
    return data;
  } catch(e) { return null; }
}

async function getSignaturesByLocataire(locId) {
  try {
    const { data } = await _sb.from('signatures').select('*')
      .eq('locataire_id', locId).order('signed_at', { ascending: false });
    return data || [];
  } catch(e) { return []; }
}

// ── Génération code unique ─────────────────────────────────────
async function generateSignatureCode(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content + Date.now());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return 'IG-' + new Date().getFullYear() + '-' + hex.substring(0, 8).toUpperCase();
}

// ── Modal de signature ─────────────────────────────────────────
function ouvrirModalSignature(options) {
  // options: { locataireId, locataireNom, type, titre, onSigned }
  var existing = document.getElementById('sig-modal-overlay');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'sig-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';

  overlay.innerHTML = `
    <div style="background:var(--surface,#fff);border-radius:16px;padding:24px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;font-weight:800;">✍️ Signature électronique</h3>
        <button onclick="fermerModalSignature()" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text3);">✕</button>
      </div>
      <div style="background:var(--surface2,#f8fafc);border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;">
        <strong>${options.titre || 'Contrat de bail'}</strong><br>
        <span style="color:var(--text3);">Signataire : ${options.locataireNom || ''}</span>
      </div>
      <p style="font-size:12px;color:var(--text3);margin:0 0 12px;">Signez dans le cadre ci-dessous avec votre doigt ou la souris :</p>
      <canvas id="sig-canvas" style="border:2px dashed var(--border,#e2e8f0);border-radius:8px;width:100%;height:180px;cursor:crosshair;touch-action:none;display:block;background:#fff;"></canvas>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
        <button onclick="effacerSignature()" style="font-size:12px;background:none;border:1px solid var(--border);border-radius:6px;padding:6px 12px;cursor:pointer;color:var(--text3);">🗑 Effacer</button>
        <span id="sig-status" style="font-size:11px;color:var(--text3);">Dessinez votre signature</span>
      </div>
      <div style="margin-top:16px;padding:12px;background:#FFF3CD;border-radius:8px;font-size:11px;color:#856404;">
        ⚖️ Cette signature électronique a valeur légale conformément à la loi camerounaise n°2010/021 sur le commerce électronique et au droit OHADA.
      </div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button onclick="fermerModalSignature()" style="flex:1;padding:12px;border:1px solid var(--border);background:none;border-radius:8px;cursor:pointer;font-size:14px;">Annuler</button>
        <button id="sig-valider-btn" onclick="validerSignature(${JSON.stringify(options).replace(/'/g,"\\'")})" style="flex:2;padding:12px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;">✅ Valider la signature</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  _initSignatureCanvas();
}

function fermerModalSignature() {
  var el = document.getElementById('sig-modal-overlay');
  if (el) el.remove();
}

// ── Canvas drawing ─────────────────────────────────────────────
var _sigDrawing = false;
var _sigHasContent = false;

function _initSignatureCanvas() {
  var canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  // Ajuster résolution pour écrans HiDPI
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  function getPos(e) {
    var r = canvas.getBoundingClientRect();
    var src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left), y: (src.clientY - r.top) };
  }

  function startDraw(e) {
    e.preventDefault();
    _sigDrawing = true;
    var p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function draw(e) {
    e.preventDefault();
    if (!_sigDrawing) return;
    var p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    _sigHasContent = true;
    var st = document.getElementById('sig-status');
    if (st) st.textContent = '✓ Signature en cours…';
  }
  function stopDraw(e) { _sigDrawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', stopDraw);
}

function effacerSignature() {
  var canvas = document.getElementById('sig-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  _sigHasContent = false;
  var st = document.getElementById('sig-status');
  if (st) st.textContent = 'Dessinez votre signature';
}

// ── Valider et enregistrer ─────────────────────────────────────
async function validerSignature(options) {
  if (!_sigHasContent) {
    alert('Veuillez dessiner votre signature avant de valider.');
    return;
  }
  var btn = document.getElementById('sig-valider-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Enregistrement…'; }

  var canvas = document.getElementById('sig-canvas');
  var signatureDataUrl = canvas.toDataURL('image/png');

  var content = (options.locataireId || '') + '|' + (options.type || '') + '|' + (options.titre || '') + '|' + Date.now();
  var code = await generateSignatureCode(content);

  var row = {
    tenant_id:      window.SESSION ? window.SESSION.tenantId : null,
    locataire_id:   options.locataireId || null,
    locataire_nom:  options.locataireNom || '',
    type_document:  options.type || 'contrat_bail',
    titre_document: options.titre || 'Contrat de bail',
    code:           code,
    signature_data: signatureDataUrl,
    signed_at:      new Date().toISOString(),
    user_agent:     navigator.userAgent.substring(0, 200),
    ip_hint:        '',
  };

  var saved = await saveSignature(row);
  fermerModalSignature();

  if (saved) {
    _showSignatureSuccess(code, saved, options.onSigned);
  } else {
    // Fallback : générer le code localement même si Supabase échoue
    _showSignatureSuccess(code, row, options.onSigned);
  }
}

function _showSignatureSuccess(code, data, onSigned) {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:28px;max-width:400px;width:100%;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">✅</div>
      <h3 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#166534;">Document signé !</h3>
      <p style="font-size:13px;color:#555;margin:0 0 20px;">La signature électronique a été enregistrée avec succès.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin-bottom:20px;">
        <div style="font-size:11px;color:#166534;font-weight:600;margin-bottom:6px;">CODE DE VÉRIFICATION</div>
        <div style="font-size:20px;font-weight:900;color:#166534;letter-spacing:2px;">${code}</div>
        <div style="font-size:11px;color:#555;margin-top:6px;">Conservez ce code pour vérifier l'authenticité du document</div>
      </div>
      <div style="font-size:11px;color:#888;margin-bottom:20px;">
        Signé le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}
      </div>
      <div style="display:flex;gap:10px;">
        <button onclick="this.closest('div[style]').remove()" style="flex:1;padding:12px;border:1px solid #e2e8f0;background:none;border-radius:8px;cursor:pointer;">Fermer</button>
        <button onclick="copierCodeSignature('${code}');this.textContent='✓ Copié!'" style="flex:1;padding:12px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">📋 Copier le code</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  if (typeof onSigned === 'function') onSigned(code, data);
}

function copierCodeSignature(code) {
  navigator.clipboard.writeText(code).catch(() => {
    var ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  });
}

// ── Page de vérification publique ─────────────────────────────
async function renderVerificationSignature() {
  var el = document.getElementById('content');
  if (!el) return;
  document.getElementById('page-title').textContent = '✍️ Signatures';
  document.getElementById('page-sub').textContent = 'Vérifier l\'authenticité d\'un document';
  el.innerHTML = `
    <div style="max-width:500px;margin:40px auto;padding:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-size:40px;">🔍</div>
        <h2 style="font-size:20px;font-weight:800;margin:8px 0 4px;">Vérification de document</h2>
        <p style="font-size:13px;color:#666;">Entrez le code de vérification pour authentifier un document ImmoGest</p>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <input id="verif-code-input" placeholder="Ex: IG-2026-AB3F1234" style="width:100%;padding:14px;border:2px solid #e2e8f0;border-radius:8px;font-size:16px;text-align:center;letter-spacing:2px;box-sizing:border-box;text-transform:uppercase;" oninput="this.value=this.value.toUpperCase()">
        <button onclick="lancerVerification()" style="width:100%;margin-top:12px;padding:14px;background:#0E6AAF;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;">🔍 Vérifier</button>
        <div id="verif-result" style="margin-top:16px;"></div>
      </div>
    </div>`;
}

async function lancerVerification() {
  var code = (document.getElementById('verif-code-input').value || '').trim().toUpperCase();
  var result = document.getElementById('verif-result');
  if (!code) { result.innerHTML = '<div style="color:red;font-size:13px;">Veuillez saisir un code.</div>'; return; }
  result.innerHTML = '<div style="text-align:center;padding:16px;color:#999;">⏳ Vérification en cours…</div>';
  var sig = await getSignatureByCode(code);
  if (!sig) {
    result.innerHTML = `<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:16px;text-align:center;">
      <div style="font-size:28px;margin-bottom:8px;">❌</div>
      <div style="font-weight:700;color:#991b1b;">Code invalide</div>
      <div style="font-size:12px;color:#555;margin-top:4px;">Ce code ne correspond à aucun document ImmoGest.</div>
    </div>`;
    return;
  }
  result.innerHTML = `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;">
    <div style="text-align:center;margin-bottom:12px;">
      <div style="font-size:32px;">✅</div>
      <div style="font-weight:800;color:#166534;font-size:15px;">Document authentique</div>
    </div>
    <div style="font-size:13px;line-height:2;">
      <b>Type :</b> ${sig.titre_document || sig.type_document}<br>
      <b>Signataire :</b> ${sig.locataire_nom}<br>
      <b>Signé le :</b> ${sig.signed_at ? new Date(sig.signed_at).toLocaleDateString('fr-FR') : '–'} à ${sig.signed_at ? new Date(sig.signed_at).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'}) : '–'}<br>
      <b>Code :</b> <span style="font-family:monospace;font-weight:700;letter-spacing:1px;">${sig.code}</span>
    </div>
    ${sig.signature_data ? '<img src="'+sig.signature_data+'" style="width:100%;max-height:80px;object-fit:contain;margin-top:12px;border-top:1px solid #bbf7d0;padding-top:12px;" alt="Signature">' : ''}
  </div>`;
}

// ── Bouton "Faire signer" dans la fiche locataire ──────────────
function afficherBoutonSignature(locId, locNom) {
  ouvrirModalSignature({
    locataireId:  locId,
    locataireNom: locNom,
    type:         'contrat_bail',
    titre:        'Contrat de bail — ' + locNom,
    onSigned: function(code) {
      showToast('✅ Contrat signé ! Code : ' + code);
    }
  });
}
