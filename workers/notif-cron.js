// ═══════════════════════════════════════════════════════════════
// IMMOGEST v2 — Cloudflare Worker complet
// Routes : /health /register /login-tenant /login-user
//          /generate-invite /join /db /ai /translate
//          /payment-init /payment-check /wa-impayes /owner
// Secrets : SUPABASE_SERVICE_KEY, SUPABASE_URL, SUPABASE_PAT,
//            NOTCHPAY_PK, ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY,
//            ANTHROPIC_API_KEY, MANAGER_WHATSAPP, OWNER_TOKEN
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL_DEFAULT = 'https://uggxfmwpttfsfcirmeqx.supabase.co';

const ALLOWED_TABLES = [
  'immeubles','locataires','paiements','users_app','parametres',
  'locale_profiles','archives','corbeille','declarations','abonnements',
  'messages_internes','marketplace_annonces','invite_codes',
  'dossiers_juridiques','timeline_juridique','templates_docs',
  'workflow_recouvrement','feature_flags','events_log','scores_locataires',
  'user_organisations','promo_codes','owner_logs','prestataires','signatures'
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PATCH,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,apikey',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    const sbBase = env.SUPABASE_URL || SUPABASE_URL_DEFAULT;

    function sbHdrs() {
      return {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
    }

    async function sbFetch(table, qs, method, body) {
      return fetch(sbBase + '/rest/v1/' + table + (qs || ''), {
        method: method || 'GET',
        headers: sbHdrs(),
        body: body ? JSON.stringify(body) : undefined
      });
    }

    async function logEvent(tenantId, level, event, message, payload) {
      try {
        await fetch(sbBase + '/rest/v1/owner_logs', {
          method: 'POST',
          headers: { ...sbHdrs(), 'Prefer': 'return=minimal' },
          body: JSON.stringify({ tenant_id: tenantId, level, event, message, payload: payload || {} })
        });
      } catch(_) {}
    }

    const BASE_URL  = 'https://immogest1.fofefranklin57.workers.dev';
    const MKT_URL   = 'https://immogest-34w.pages.dev/marketplace.html';
    const APP_URL   = 'https://immogest-34w.pages.dev/';
    const OG_IMG_DEFAULT = 'https://immogest-34w.pages.dev/og-marketplace.jpg';
    const DEVISES_MAP = { XAF:'FCFA', XOF:'FCFA', MAD:'MAD', TND:'TND', EUR:'€', USD:'$' };
    const PAYS_LABELS = { CM:'Cameroun',SN:'Sénégal',CI:"Côte d'Ivoire",GA:'Gabon',MR:'Maroc',TN:'Tunisie',FR:'France',BE:'Belgique' };
    const CAT_LABELS = {
      location_residentielle:'Location résidentielle', location_commerciale:'Local commercial',
      bureau:'Bureau', colocation:'Colocation', location_saisonniere:'Location saisonnière',
      vente:'Vente', luxe:'Prestige & Luxe', professionnel:'Professionnel'
    };

    function _esc(s) {
      return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function _slug(s) {
      return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    }

    function _prix(loyer, devise) {
      if (!loyer) return 'Prix sur demande';
      return Number(loyer).toLocaleString('fr-FR') + ' ' + (DEVISES_MAP[devise]||'FCFA');
    }

    function _css() {
      return `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0a1628;color:#e8f0fe;min-height:100vh;line-height:1.5}
a{color:#60a5fa;text-decoration:none}a:hover{text-decoration:underline}
header{background:#050f1e;border-bottom:1px solid rgba(255,255,255,.08);padding:0 5%;position:sticky;top:0;z-index:10}
.hdr{max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:60px;gap:16px}
.logo{font-size:17px;font-weight:800;color:#e8f0fe;text-decoration:none}.logo em{color:#3b82f6;font-style:normal}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap}
.btn-primary{background:#1d4ed8;color:#fff}.btn-outline{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.15);color:#e8f0fe}
.wrap{max-width:1100px;margin:0 auto;padding:36px 5% 64px}
.badge{display:inline-block;background:rgba(37,99,235,.15);border:1px solid rgba(37,99,235,.3);border-radius:99px;padding:3px 12px;font-size:12px;color:#60a5fa}
.section-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#3b82f6;margin-bottom:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.card{display:block;background:#0f1f3d;border:1px solid rgba(255,255,255,.08);border-radius:12px;overflow:hidden;text-decoration:none;color:#e8f0fe;transition:box-shadow .18s}
.card:hover{box-shadow:0 6px 24px rgba(37,99,235,.2);text-decoration:none}
.card-img{height:140px;background:linear-gradient(135deg,#152342,#1a2a4a);position:relative;overflow:hidden}
.card-img img{width:100%;height:100%;object-fit:cover;display:block}
.card-img-ico{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px;opacity:.25}
.card-tag{position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,.6);color:#fff;font-size:11px;padding:3px 10px;border-radius:99px;backdrop-filter:blur(4px)}
.card-prem{position:absolute;top:8px;right:8px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:10px;font-weight:700;padding:2px 9px;border-radius:99px}
.card-body{padding:14px}
.card-title{font-weight:700;font-size:13px;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-loc{font-size:12px;color:rgba(232,240,254,.4);margin-bottom:10px}
.card-foot{display:flex;justify-content:space-between;align-items:center}
.card-price{font-size:16px;font-weight:800;color:#3b82f6}
.card-views{font-size:11px;color:rgba(232,240,254,.3)}
.share-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.share-btn{padding:8px 14px;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;color:#fff;white-space:nowrap}
.sep{border:none;border-top:1px solid rgba(255,255,255,.07);margin:28px 0}
.meta{font-size:12px;color:rgba(232,240,254,.3)}
footer{border-top:1px solid rgba(255,255,255,.07);padding:22px 5%;text-align:center;font-size:12px;color:rgba(232,240,254,.3)}
footer a{color:#3b82f6}
@media(max-width:640px){.wrap{padding:24px 4% 48px}.hdr{height:52px}}`;
    }

    function _header(backLabel, backHref) {
      return `<header><div class="hdr">
  <a href="${MKT_URL}" class="logo">🏢 Immo<em>Gest</em> <span style="font-size:11px;font-weight:500;color:rgba(232,240,254,.4);margin-left:4px">Marketplace</span></a>
  <div style="display:flex;gap:8px">
    ${backLabel ? `<a href="${_esc(backHref||MKT_URL)}" class="btn btn-outline" style="padding:6px 14px">${_esc(backLabel)}</a>` : ''}
    <a href="${APP_URL}" class="btn btn-primary">+ Publier</a>
  </div>
</div></header>`;
    }

    function _footer() {
      return `<footer><p>© 2026 <a href="${APP_URL}">ImmoGest</a> — Plateforme de gestion immobilière mondiale · <a href="${BASE_URL}/sitemap.xml">Sitemap</a></p></footer>`;
    }

    function _cardHtml(a) {
      const cat = CAT_LABELS[a.categorie] || a.categorie || 'Annonce';
      const photo = a.photos && a.photos[0];
      const annonceHref = `${BASE_URL}/annonce/${_slug(a.pays||'cm')}/${_slug(a.ville||'ville')}/${_slug(a.titre||'annonce')}-${a.id}`;
      return `<a href="${_esc(annonceHref)}" class="card">
  <div class="card-img">
    ${photo ? `<img src="${_esc(photo)}" alt="${_esc(a.titre||'')}" loading="lazy">` : `<div class="card-img-ico">🏠</div>`}
    ${a.premium || a.premium_niveau > 0 ? `<span class="card-prem">⭐ PREMIUM</span>` : ''}
    <span class="card-tag">${_esc(cat)}</span>
  </div>
  <div class="card-body">
    <div class="card-title">${_esc(a.titre||'Annonce')}</div>
    <div class="card-loc">📍 ${_esc(a.ville||'')}${a.quartier?' — '+_esc(a.quartier):''} · ${_esc(PAYS_LABELS[a.pays]||a.pays||'')}</div>
    <div class="card-foot">
      <span class="card-price">${_esc(_prix(a.loyer,a.devise))}</span>
      <span class="card-views">${a.vues||0} vues</span>
    </div>
  </div>
</a>`;
    }

    function _htmlErreur(titre, message) {
      return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${_esc(titre)} — ImmoGest Marketplace</title><meta name="robots" content="noindex">
<style>${_css()}</style></head><body>
${_header('← Marketplace',MKT_URL)}
<div class="wrap" style="display:flex;align-items:center;justify-content:center;min-height:60vh">
  <div style="text-align:center;max-width:400px">
    <div style="font-size:56px;margin-bottom:16px">🏠</div>
    <h1 style="font-size:20px;font-weight:800;margin-bottom:8px">${_esc(titre)}</h1>
    <p style="font-size:14px;color:rgba(232,240,254,.5);margin-bottom:24px">${_esc(message)}</p>
    <a href="${MKT_URL}" class="btn btn-primary">← Retour à la marketplace</a>
  </div>
</div>
${_footer()}</body></html>`;
    }

    try {

      // ── /health ──────────────────────────────────────────────
      if (path === '/health') {
        return json({ ok: true, version: '2.0', ts: Date.now() });
      }

      // ── /marketplace-public — endpoint public sans auth ───────
      if (path === '/marketplace-public' && request.method === 'GET') {
        const categorie = url.searchParams.get('categorie');
        const pays = url.searchParams.get('pays');
        const q = url.searchParams.get('q');
        let qs = '?statut=eq.active&order=created_at.desc&limit=100';
        if (categorie && categorie !== 'tous') qs += '&categorie=eq.' + encodeURIComponent(categorie);
        if (pays) qs += '&pays=eq.' + encodeURIComponent(pays);
        const r = await sbFetch('marketplace_annonces', qs);
        let annonces = await r.json();
        if (q) {
          const lq = q.toLowerCase();
          annonces = annonces.filter(function(a) {
            return (a.titre||'').toLowerCase().includes(lq) ||
                   (a.ville||'').toLowerCase().includes(lq) ||
                   (a.quartier||'').toLowerCase().includes(lq) ||
                   (a.description||'').toLowerCase().includes(lq);
          });
        }
        return json(annonces);
      }

      // ── /register ────────────────────────────────────────────
      if (path === '/register' && request.method === 'POST') {
        const { nom, telephone, passwordHash, nomCabinet } = await request.json();
        if (!nom || !telephone || !passwordHash) return json({ error: 'Champs manquants' }, 400);

        const res = await sbFetch('tenants', '', 'POST', {
          nom, telephone, password_hash: passwordHash,
          nom_cabinet: nomCabinet || '', mode: 'entreprise'
        });
        if (!res.ok) {
          const err = await res.json();
          const code = Array.isArray(err) ? err[0]?.code : err?.code;
          if (code === '23505') return json({ error: 'Numéro déjà utilisé' }, 409);
          return json({ error: 'Erreur création compte', detail: err }, 500);
        }
        const tenant = (await res.json())[0];

        // Créer compte admin
        const adminId = 'u_' + crypto.randomUUID().replace(/-/g,'').substring(0,10);
        await sbFetch('users_app', '', 'POST', {
          id: adminId, tenant_id: tenant.id, role: 'admin',
          nom, password: passwordHash, immeubles: [], actif: true
        });

        // Tenter locale_profiles (table optionnelle)
        try { await sbFetch('locale_profiles', '', 'POST', { tenant_id: tenant.id }); } catch(_) {}

        await logEvent(tenant.id, 'info', 'tenant.register', 'Nouveau tenant', { nom, telephone });
        return json({ success: true, tenantId: tenant.id, userId: adminId });
      }

      // ── /login-tenant ─────────────────────────────────────────
      if (path === '/login-tenant' && request.method === 'POST') {
        const { telephone, passwordHash } = await request.json();
        const res = await sbFetch('tenants', '?telephone=eq.' + encodeURIComponent(telephone) + '&select=*');
        const tenants = res.ok ? await res.json() : [];
        if (!tenants.length) return json({ error: 'Compte introuvable' }, 404);
        const tenant = tenants[0];
        if (tenant.password_hash !== passwordHash) return json({ error: 'Mot de passe incorrect' }, 401);

        // Charger user admin
        const uRes = await sbFetch('users_app', '?tenant_id=eq.' + tenant.id + '&role=eq.admin&select=*&limit=1');
        const users = uRes.ok ? await uRes.json() : [];
        const adminUser = users[0] || { id: 'admin_' + tenant.id, role: 'admin', nom: tenant.nom };

        await logEvent(tenant.id, 'info', 'tenant.login', 'Connexion', { telephone });
        return json({
          success: true,
          tenant: { ...tenant, plan: tenant.plan || 'gratuit' },
          userId: adminUser.id,
          role: adminUser.role,
          user: adminUser
        });
      }

      // ── /login-user ───────────────────────────────────────────
      if (path === '/login-user' && request.method === 'POST') {
        const { userId, passwordHash, tenantId } = await request.json();
        if (!userId || !tenantId) return json({ error: 'Champs manquants' }, 400);

        const res = await sbFetch('users_app', '?id=eq.' + encodeURIComponent(userId) + '&tenant_id=eq.' + tenantId + '&select=*');
        const users = res.ok ? await res.json() : [];
        if (!users.length) return json({ error: 'Utilisateur introuvable' }, 404);
        const user = users[0];
        if (user.actif === false) return json({ error: 'Compte désactivé' }, 403);
        const storedPwd = user.password || user.password_hash || '';
        if (storedPwd !== passwordHash) return json({ error: 'Mot de passe incorrect' }, 401);
        return json({ success: true, user });
      }

      // ── /generate-invite ──────────────────────────────────────
      if (path === '/generate-invite' && request.method === 'POST') {
        const { tenantId, role, immeubles } = await request.json();
        if (!tenantId) return json({ error: 'tenantId requis' }, 400);
        const code = crypto.randomUUID().replace(/-/g,'').substring(0,12).toUpperCase();
        await sbFetch('invite_codes', '', 'POST', {
          code, tenant_id: tenantId, role: role || 'gestionnaire',
          immeubles: immeubles || []
        });
        return json({ success: true, code });
      }

      // ── /join ─────────────────────────────────────────────────
      if (path === '/join' && request.method === 'POST') {
        const { code, nom, password, pin } = await request.json();
        const res = await sbFetch('invite_codes', '?code=eq.' + code + '&used=eq.false&select=*');
        const codes = res.ok ? await res.json() : [];
        if (!codes.length) return json({ error: 'Code invalide ou déjà utilisé' }, 404);
        const inv = codes[0];
        if (new Date(inv.expire_at) < new Date()) return json({ error: 'Code expiré' }, 410);

        const userId = 'u_' + crypto.randomUUID().replace(/-/g,'').substring(0,10);
        await sbFetch('users_app', '', 'POST', {
          id: userId, tenant_id: inv.tenant_id, role: inv.role,
          nom, password: password || null, pin: pin || null,
          immeubles: inv.immeubles || [], actif: true
        });
        await fetch(sbBase + '/rest/v1/invite_codes?id=eq.' + inv.id, {
          method: 'PATCH', headers: sbHdrs(), body: JSON.stringify({ used: true })
        });
        return json({ success: true, userId, tenantId: inv.tenant_id, role: inv.role });
      }

      // ── /db — CRUD proxy ──────────────────────────────────────
      if (path === '/db' && request.method === 'POST') {
        const body = await request.json();
        const action = body.action || body.op;  // v2: action, v1 legacy: op
        const { table, data, tenantId } = body;
        const filters = body.filters || body.filter;

        if (!tenantId) return json({ error: 'Session invalide' }, 401);
        if (!ALLOWED_TABLES.includes(table)) return json({ error: 'Table non autorisée: ' + table }, 403);

        // Vérifier tenant
        const tRes = await sbFetch('tenants', '?id=eq.' + tenantId + '&select=id');
        const tData = tRes.ok ? await tRes.json() : [];
        if (!tData.length) return json({ error: 'Session invalide' }, 401);

        let endpoint = sbBase + '/rest/v1/' + table;
        let method = 'GET';
        let sbBody = null;
        let hdrs = { ...sbHdrs() };

        if (action === 'select') {
          let qs = '?tenant_id=eq.' + tenantId;
          if (filters) Object.entries(filters).forEach(([k,v]) => { qs += '&' + k + '=eq.' + encodeURIComponent(v); });
          qs += '&select=*&order=created_at.asc';
          endpoint += qs;

        } else if (action === 'upsert') {
          const rows = Array.isArray(data) ? data : [data];
          const withTenant = rows.map(r => ({ ...r, tenant_id: tenantId }));
          endpoint += '?on_conflict=id';
          method = 'POST';
          sbBody = JSON.stringify(withTenant);
          hdrs['Prefer'] = 'resolution=merge-duplicates,return=representation';

        } else if (action === 'insert') {
          const rows = Array.isArray(data) ? data : [data];
          method = 'POST';
          sbBody = JSON.stringify(rows.map(r => ({ ...r, tenant_id: tenantId })));

        } else if (action === 'delete') {
          const delId = filters?.id;
          endpoint += '?tenant_id=eq.' + tenantId + '&id=eq.' + delId;
          method = 'DELETE';

        } else if (action === 'update' || action === 'patch') {
          endpoint += '?tenant_id=eq.' + tenantId + '&id=eq.' + filters.id;
          method = 'PATCH';
          sbBody = JSON.stringify(data);
          hdrs['Prefer'] = 'return=representation';

        } else {
          return json({ error: 'Action non reconnue: ' + action }, 400);
        }

        const res = await fetch(endpoint, { method, headers: hdrs, body: sbBody });
        if (method === 'DELETE') return json({ success: true, data: [], ok: true });
        const result = await res.json();
        if (!res.ok) return json({ error: 'Erreur base de données', detail: result }, 500);
        return json({ success: true, data: result, ok: true });
      }

      // ── /ai ───────────────────────────────────────────────────
      if (path === '/ai' && request.method === 'POST') {
        const { messages, system, tenantId, user_key } = await request.json();
        const apiKey = user_key || env.ANTHROPIC_API_KEY;
        if (!apiKey) return json({ error: 'Clé API manquante' }, 400);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2048,
            system: system || 'Tu es un assistant de gestion immobilière spécialisé dans le droit local et les pratiques immobilières mondiales.',
            messages: messages || []
          })
        });
        const d = await res.json();
        return json({ ok: true, success: true, content: d.content || [], text: d.content?.[0]?.text || '' });
      }

      // ── /translate ────────────────────────────────────────────
      if (path === '/translate' && request.method === 'POST') {
        const { keys, targetLang } = await request.json();
        if (!env.ANTHROPIC_API_KEY) return json({ error: 'Clé API manquante' }, 400);
        const prompt = 'Traduis ces clés en ' + targetLang + '. JSON uniquement.\n' + JSON.stringify(keys);
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
        });
        const d = await res.json();
        try {
          const text = (d.content?.[0]?.text || '{}').replace(/```json\n?/g,'').replace(/```\n?/g,'');
          return json({ success: true, translations: JSON.parse(text) });
        } catch {
          return json({ error: 'Erreur traduction' }, 500);
        }
      }

      // ── /payment-init ─────────────────────────────────────────
      if (path === '/payment-init' && request.method === 'POST') {
        const { amount, email, phone, description, reference, tenantId } = await request.json();
        const pk = env.NOTCHPAY_PK;
        if (!pk) return json({ error: 'NotchPay non configuré' }, 500);
        const res = await fetch('https://api.notchpay.co/payments/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': pk },
          body: JSON.stringify({ amount, currency: 'XAF', email, phone, description, reference,
            callback: 'https://immogest-34w.pages.dev/?notchpay_ref=' + reference })
        });
        const d = await res.json();
        return json({ success: true, authorization_url: d.transaction?.authorization_url, reference });
      }

      // ── /payment-check ────────────────────────────────────────
      if (path === '/payment-check' && request.method === 'GET') {
        const ref = url.searchParams.get('ref');
        const pk = env.NOTCHPAY_PK;
        if (!pk) return json({ error: 'NotchPay non configuré' }, 500);
        const res = await fetch('https://api.notchpay.co/payments/' + ref, { headers: { 'Authorization': pk } });
        const d = await res.json();
        return json({ success: true, status: d.transaction?.status, transaction: d.transaction });
      }

      // ── /wa-impayes ───────────────────────────────────────────
      if (path === '/wa-impayes') {
        const tenantId = url.searchParams.get('t') || '';
        const html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<title>ImmoGest — Relances</title><style>body{font-family:Arial,sans-serif;padding:20px;background:#D8E8F7}' +
          'h1{color:#0E6AAF}p{margin:8px 0;color:#333}</style></head><body>' +
          '<h1>ImmoGest — Relances impayés</h1>' +
          '<p>Ouvrez ImmoGest pour générer les liens WhatsApp de relance.</p></body></html>';
        return new Response(html, { headers: { ...cors, 'Content-Type': 'text/html' } });
      }

      // ── /migrate — DDL via Supabase Management API ────────────
      if (path === '/migrate' && request.method === 'POST') {
        const { ownerToken, sql } = await request.json();
        const OWNER_TOKEN = env.OWNER_TOKEN || '8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058';
        if (ownerToken !== OWNER_TOKEN) return json({ error: 'Accès refusé' }, 403);
        const pat = env.SUPABASE_PAT;
        if (!pat) return json({ error: 'SUPABASE_PAT non configuré' }, 500);
        const sbRef = (env.SUPABASE_URL || SUPABASE_URL_DEFAULT).match(/\/\/([^.]+)/)?.[1];
        const res = await fetch('https://api.supabase.com/v1/projects/' + sbRef + '/database/query', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + pat, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: sql })
        });
        const d = await res.json();
        if (!res.ok || d.message) return json({ error: d.message || 'Erreur migration' }, 500);
        await logEvent(null, 'info', 'migrate.run', 'Migration DDL exécutée', { sql: sql.substring(0, 100) });
        return json({ success: true, result: d });
      }

      // ── /apply-promo ──────────────────────────────────────────
      if (path === '/apply-promo' && request.method === 'POST') {
        const { code, tenantId } = await request.json();
        if (!code || !tenantId) return json({ error: 'code + tenantId requis' }, 400);

        const pRes = await sbFetch('promo_codes', '?code=eq.' + encodeURIComponent(code.toUpperCase()) + '&actif=eq.true&select=*');
        const promos = pRes.ok ? await pRes.json() : [];
        if (!promos.length) return json({ error: 'Code invalide ou expiré' }, 404);
        const promo = promos[0];

        if (promo.expire_at && new Date(promo.expire_at) < new Date()) return json({ error: 'Code expiré' }, 410);
        if (promo.uses >= promo.max_uses) return json({ error: 'Code déjà utilisé au maximum' }, 409);

        const planExpire = new Date(Date.now() + promo.duree_jours * 86400000).toISOString();
        await Promise.all([
          fetch(sbBase + '/rest/v1/tenants?id=eq.' + tenantId, {
            method: 'PATCH',
            headers: { ...sbHdrs(), 'Prefer': 'return=minimal' },
            body: JSON.stringify({ plan: promo.plan, plan_expire: planExpire, promo_code: code.toUpperCase() })
          }),
          fetch(sbBase + '/rest/v1/promo_codes?id=eq.' + promo.id, {
            method: 'PATCH',
            headers: { ...sbHdrs(), 'Prefer': 'return=minimal' },
            body: JSON.stringify({ uses: promo.uses + 1 })
          })
        ]);
        await logEvent(tenantId, 'info', 'promo.applied', 'Code promo appliqué: ' + code, { plan: promo.plan });
        return json({ success: true, plan: promo.plan, plan_expire: planExpire, duree_jours: promo.duree_jours });
      }

      // ── /owner ────────────────────────────────────────────────
      if (path.startsWith('/owner') && request.method === 'POST') {
        const { ownerToken, action } = await request.json();
        const OWNER_TOKEN = env.OWNER_TOKEN || '8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058';
        if (ownerToken !== OWNER_TOKEN) return json({ error: 'Accès refusé' }, 403);

        if (action === 'stats') {
          const [tRes, uRes, logRes] = await Promise.all([
            sbFetch('tenants', '?select=id,nom,nom_cabinet,telephone,created_at,mode,plan,plan_expire'),
            sbFetch('users_app', '?select=id,tenant_id,role,actif&limit=500'),
            sbFetch('owner_logs', '?select=*&order=created_at.desc&limit=20'),
          ]);
          const tenants = tRes.ok ? await tRes.json() : [];
          // Comptage par plan
          const plans = { gratuit: 0, starter: 0, pro: 0, cabinet: 0 };
          tenants.forEach(t => { const p = t.plan || 'gratuit'; if (plans[p] !== undefined) plans[p]++; });
          return json({
            tenants,
            users: uRes.ok ? await uRes.json() : [],
            logs: logRes.ok ? await logRes.json() : [],
            plans,
          });
        }

        if (action === 'upgrade_plan') {
          const { tenantId: targetTenantId, plan, plan_expire } = body;
          if (!targetTenantId || !plan) return json({ error: 'tenantId + plan requis' }, 400);
          const r = await fetch(sbBase + '/rest/v1/tenants?id=eq.' + targetTenantId, {
            method: 'PATCH',
            headers: { ...sbHdrs(), 'Prefer': 'return=representation' },
            body: JSON.stringify({ plan, plan_expire: plan_expire || null })
          });
          if (!r.ok) return json({ error: 'Mise à jour plan échouée' }, 500);
          await logEvent(targetTenantId, 'info', 'plan.upgrade', 'Plan changé: ' + plan, { plan });
          return json({ success: true, plan });
        }

        if (action === 'disable_tenant') {
          const targetId = body.tenantId;
          if (!targetId) return json({ error: 'tenantId requis' }, 400);
          await fetch(sbBase + '/rest/v1/users_app?tenant_id=eq.' + targetId, {
            method: 'PATCH',
            headers: { ...sbHdrs(), 'Prefer': 'return=minimal' },
            body: JSON.stringify({ actif: false })
          });
          await logEvent(targetId, 'warn', 'tenant.disabled', 'Tenant désactivé', {});
          return json({ success: true });
        }

        if (action === 'create_promo') {
          const { code, plan, duree_jours, max_uses } = body;
          if (!code || !plan) return json({ error: 'code + plan requis' }, 400);
          const r = await fetch(sbBase + '/rest/v1/promo_codes', {
            method: 'POST',
            headers: { ...sbHdrs(), 'Prefer': 'return=representation' },
            body: JSON.stringify({
              code: code.toUpperCase(),
              plan: plan,
              duree_jours: duree_jours || 30,
              max_uses: max_uses || 1,
              expire_at: new Date(Date.now() + 90 * 86400000).toISOString()
            })
          });
          if (!r.ok) return json({ error: 'Erreur création code promo' }, 500);
          const promo = (await r.json())[0];
          await logEvent(null, 'info', 'promo.created', 'Code promo créé: ' + code, { code, plan });
          return json({ success: true, promo });
        }

        if (action === 'list_promos') {
          const r = await sbFetch('promo_codes', '?select=*&order=created_at.desc&limit=50');
          return json({ success: true, promos: r.ok ? await r.json() : [] });
        }

        return json({ error: 'Action inconnue' }, 400);
      }

      // ── /push-subscribe ───────────────────────────────────────
      if (path === '/push-subscribe' && request.method === 'POST') {
        const { subscription, tenantId, userId } = await request.json();
        if (!subscription || !tenantId) return json({ error: 'subscription + tenantId requis' }, 400);
        // Stocker la subscription dans events_log pour usage par le cron
        await sbFetch('events_log', '', 'POST', {
          tenant_id: tenantId,
          event: 'push.subscribe',
          level: 'info',
          message: 'Push subscription enregistrée',
          payload: { subscription, userId: userId || null }
        });
        return json({ success: true });
      }

      // ── /push-notify ──────────────────────────────────────────
      if (path === '/push-notify' && request.method === 'POST') {
        const { tenantId, title, body: notifBody, url: notifUrl, ownerToken } = await request.json();
        const OWNER_TOKEN = env.OWNER_TOKEN || '8237a8d86b7038877840cd600b135f4edc8966be05cf3ba12727535f2670c058';
        // Peut être appelé par l'owner ou par un tenant authentifié
        if (ownerToken && ownerToken !== OWNER_TOKEN) return json({ error: 'Accès refusé' }, 403);

        const appId = env.ONESIGNAL_APP_ID;
        const restKey = env.ONESIGNAL_REST_KEY;
        if (!appId || !restKey) return json({ error: 'OneSignal non configuré' }, 500);

        const payload = {
          app_id: appId,
          headings: { fr: title || 'ImmoGest', en: title || 'ImmoGest' },
          contents: { fr: notifBody || 'Nouvelle notification', en: notifBody || 'New notification' },
          url: notifUrl || 'https://immogest-34w.pages.dev/',
          filters: tenantId ? [{ field: 'tag', key: 'tenant_id', relation: '=', value: tenantId }] : undefined,
          included_segments: tenantId ? undefined : ['All']
        };

        const osRes = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + restKey },
          body: JSON.stringify(payload)
        });
        const osData = await osRes.json();
        if (osData.errors && osData.errors.length) return json({ error: osData.errors[0] }, 500);
        await logEvent(tenantId || 'owner', 'info', 'push.sent', title || 'Notification', { recipients: osData.recipients });
        return json({ success: true, id: osData.id, recipients: osData.recipients });
      }

      // ── /invite-info ──────────────────────────────────────────
      if (path === '/invite-info' && request.method === 'GET') {
        const code = url.searchParams.get('code');
        if (!code) return json({ error: 'code requis' }, 400);
        const res = await sbFetch('invite_codes', '?code=eq.' + code + '&select=*');
        const codes = res.ok ? await res.json() : [];
        if (!codes.length) return json({ error: 'Code introuvable' }, 404);
        const inv = codes[0];
        // Charger nom du tenant
        const tRes = await sbFetch('tenants', '?id=eq.' + inv.tenant_id + '&select=nom,nom_cabinet');
        const tenants = tRes.ok ? await tRes.json() : [];
        const tenant = tenants[0] || {};
        return json({ success: true, code: inv, tenantNom: tenant.nom_cabinet || tenant.nom || '' });
      }

      // ── GET /leads-gestionnaire — leads du tenant authentifié ────
      if (path === '/leads-gestionnaire' && method === 'GET') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (!token) return json({ error: 'Non autorisé' }, 401);
        // Vérifier le token et récupérer le tenant_id
        const sessionR = await sbFetch('users_app', '?pin=eq.' + token + '&select=tenant_id&limit=1');
        const sessions = sessionR.ok ? await sessionR.json() : [];
        // Fallback : chercher par token dans sessions si table existe
        let tenantId = sessions[0]?.tenant_id;
        if (!tenantId) return json({ error: 'Session invalide' }, 401);
        const lr = await fetch(`${env.SUPABASE_URL || SUPABASE_URL_DEFAULT}/rest/v1/marketplace_leads?tenant_id=eq.${tenantId}&order=created_at.desc&limit=200&select=*,marketplace_annonces(titre)`, {
          headers: { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY }
        });
        const leads = lr.ok ? await lr.json() : [];
        const flat = leads.map(l => ({ ...l, annonce_titre: l.marketplace_annonces?.titre || null, marketplace_annonces: undefined }));
        return json(flat);
      }

      // ── POST /lead — enregistrement lead public (no auth) ─────────
      if (path === '/lead' && method === 'POST') {
        let body = {};
        try { body = await request.json(); } catch(_) {}
        const { annonce_id, type, nom, telephone, email, message, source } = body;
        if (!annonce_id || !type) return json({ error: 'annonce_id et type requis' }, 400);
        const TYPES = ['whatsapp','telephone','visite','information','message','partage'];
        if (!TYPES.includes(type)) return json({ error: 'type invalide' }, 400);

        // Récupérer le tenant_id de l'annonce
        const ar = await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id + '&select=tenant_id&limit=1');
        const ann = ar.ok ? await ar.json() : [];
        const tenant_id = ann[0]?.tenant_id || null;

        // Incrémenter vues si type = whatsapp ou visite
        if (type === 'whatsapp' || type === 'visite') {
          await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id, 'PATCH',
            { vues: null }, // géré via RPC ci-dessous
            false
          );
        }

        const leadBody = JSON.stringify({ annonce_id, tenant_id, type, statut: 'nouveau', nom: nom||null, telephone: telephone||null, email: email||null, message: message||null, source: source||null, ip: request.headers.get('CF-Connecting-IP')||null, user_agent: request.headers.get('User-Agent')||null });
        const ins = await fetch(`${env.SUPABASE_URL || SUPABASE_URL_DEFAULT}/rest/v1/marketplace_leads`, {
          method: 'POST',
          headers: { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
          body: leadBody
        });
        const lead = ins.ok ? await ins.json() : [];
        return json({ success: true, lead_id: lead[0]?.id || null });
      }

      // ── /robots.txt ───────────────────────────────────────────────
      if (path === '/robots.txt') {
        const txt = `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
        return new Response(txt, { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });
      }

      // ── /sitemap.xml ─────────────────────────────────────────────
      if (path === '/sitemap.xml') {
        const [aRes, tRes] = await Promise.all([
          sbFetch('marketplace_annonces', '?statut=eq.active&select=id,titre,ville,pays,updated_at&order=updated_at.desc&limit=5000'),
          sbFetch('tenants', '?select=id,nom,nom_cabinet&limit=1000')
        ]);
        const annonces = aRes.ok ? await aRes.json() : [];
        const tenants  = tRes.ok ? await tRes.json() : [];

        const today = new Date().toISOString().split('T')[0];

        // Annonces
        const urlsAnnonces = annonces.map(a => {
          const loc = `${BASE_URL}/annonce/${_slug(a.pays||'cm')}/${_slug(a.ville||'ville')}/${_slug(a.titre||'annonce')}-${a.id}`;
          return `  <url><loc>${loc}</loc><lastmod>${(a.updated_at||today).split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
        });

        // Agences (tenants actifs = ceux ayant au moins 1 annonce)
        const tenantsActifs = new Set(annonces.map(a => a.tenant_id).filter(Boolean));
        const urlsAgences = tenants
          .filter(t => tenantsActifs.has(t.id))
          .map(t => `  <url><loc>${BASE_URL}/agence/${_slug(t.nom_cabinet||t.nom)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`);

        // Villes distinctes
        const villes = [...new Set(annonces.map(a => a.ville).filter(Boolean))];
        const urlsVilles = villes.map(v =>
          `  <url><loc>${BASE_URL}/ville/${_slug(v)}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority></url>`
        );

        // Pays distincts
        const pays = [...new Set(annonces.map(a => a.pays).filter(Boolean))];
        const urlsPays = pays.map(p =>
          `  <url><loc>${BASE_URL}/pays/${_slug(PAYS_LABELS[p]||p)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          `  <url><loc>${BASE_URL}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
          ...urlsPays,
          ...urlsVilles,
          ...urlsAgences,
          ...urlsAnnonces,
          '</urlset>'
        ].join('\n');
        return new Response(xml, { headers: { ...cors, 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
      }

      // ── /annonce/:pays/:ville/:slug-{id} — SEO 100% HTML, zéro JS ──
      if (path.startsWith('/annonce/')) {
        const lastPart = path.split('/').pop();
        const id = lastPart.split('-').pop();
        if (!id || isNaN(id)) return new Response(_htmlErreur('Annonce introuvable','Identifiant invalide.'),{status:404,headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
        const r = await sbFetch('marketplace_annonces','?id=eq.'+id+'&limit=1');
        const rows = r.ok ? await r.json() : [];
        if (!rows.length) return new Response(_htmlErreur('Annonce introuvable','Cette annonce n\'existe plus ou a été supprimée.'),{status:404,headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
        const a = rows[0];
        const prix      = _prix(a.loyer, a.devise);
        const photo     = (a.photos && a.photos[0]) || OG_IMG_DEFAULT;
        const canonical = `${BASE_URL}${path}`;
        const cat       = CAT_LABELS[a.categorie] || 'Annonce';
        const paysLabel = PAYS_LABELS[a.pays] || a.pays || '';
        const titre     = `${a.titre||'Annonce'} — ${a.ville||''}, ${paysLabel} | ImmoGest Marketplace`;
        const desc      = (a.description || `${cat} disponible à ${a.ville||''}, ${paysLabel}. ${prix}/mois.`).slice(0,200);
        const waMsg     = encodeURIComponent(`${a.titre||''} — ${prix}/mois\n${canonical}`);
        const fbUrl     = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonical)}`;
        const tgUrl     = `https://t.me/share/url?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(a.titre||'')}`;
        const villeHref = `${BASE_URL}/ville/${_slug(a.ville||'ville')}`;
        const paysHref  = `${BASE_URL}/pays/${_slug(a.pays||'cm')}`;
        const schema    = JSON.stringify({
          "@context":"https://schema.org","@type":"RealEstateListing",
          "name":a.titre,"description":a.description||desc,"url":canonical,"image":photo,
          "offers":{"@type":"Offer","price":a.loyer||0,"priceCurrency":a.devise||'XAF',"availability":"https://schema.org/InStock"},
          "address":{"@type":"PostalAddress","addressLocality":a.ville||'','addressCountry':a.pays||'CM'}
        });
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${_esc(titre)}</title>
<meta name="description" content="${_esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${_esc(canonical)}">
<!-- Open Graph -->
<meta property="og:type" content="product">
<meta property="og:title" content="${_esc(titre)}">
<meta property="og:description" content="${_esc(desc)}">
<meta property="og:image" content="${_esc(photo)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${_esc(canonical)}">
<meta property="og:site_name" content="ImmoGest Marketplace">
<meta property="og:locale" content="fr_FR">
<!-- Twitter / X -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${_esc(titre)}">
<meta name="twitter:description" content="${_esc(desc)}">
<meta name="twitter:image" content="${_esc(photo)}">
<!-- Schema.org -->
<script type="application/ld+json">${schema}</script>
<style>${_css()}
.hero-wrap{max-width:800px;margin:0 auto}
.hero-img{width:100%;height:340px;object-fit:cover;border-radius:0 0 16px 16px;display:block}
.hero-ph{height:200px;display:flex;align-items:center;justify-content:center;font-size:72px;opacity:.2}
.annonce-wrap{max-width:800px;margin:0 auto;padding:28px 5% 60px}
h1{font-size:clamp(19px,3vw,27px);font-weight:900;letter-spacing:-.5px;margin-bottom:10px;line-height:1.3}
.price{font-size:34px;font-weight:900;color:#3b82f6;margin:16px 0 20px}
.price small{font-size:15px;font-weight:400;color:rgba(232,240,254,.4)}
.desc{font-size:14px;color:rgba(232,240,254,.7);line-height:1.8;white-space:pre-wrap;margin-bottom:24px}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:28px}
.btn-wa{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:10px;background:#25D366;color:#fff;font-weight:700;font-size:14px;text-decoration:none}
.btn-back{display:inline-flex;align-items:center;gap:8px;padding:13px 18px;border-radius:10px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.15);color:#e8f0fe;font-size:13px;font-weight:600;text-decoration:none}
.share-title{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(232,240,254,.35);margin-bottom:10px}
.breadcrumb{font-size:12px;color:rgba(232,240,254,.35);margin-bottom:8px}
.breadcrumb a{color:#60a5fa;text-decoration:none}.breadcrumb a:hover{text-decoration:underline}
</style>
</head>
<body>
${_header('← Toutes les annonces', MKT_URL)}
<div class="hero-wrap">
  ${photo !== OG_IMG_DEFAULT ? `<img src="${_esc(photo)}" class="hero-img" alt="${_esc(a.titre||'')}">` : `<div class="hero-ph">🏠</div>`}
</div>
<div class="annonce-wrap">
  <div class="breadcrumb">
    <a href="${MKT_URL}">Marketplace</a> ›
    <a href="${_esc(paysHref)}">${_esc(paysLabel)}</a> ›
    <a href="${_esc(villeHref)}">${_esc(a.ville||'')}</a>
  </div>
  <span class="badge">${_esc(cat)}</span>
  <h1>${_esc(a.titre||'Annonce immobilière')}</h1>
  <div style="font-size:13px;color:rgba(232,240,254,.45);margin-bottom:4px">📍 ${_esc(a.ville||'')}${a.quartier?' — '+_esc(a.quartier):''} · ${_esc(paysLabel)}</div>
  <div class="price">${_esc(prix)}<small>/mois</small></div>
  ${a.description ? `<div class="desc">${_esc(a.description)}</div>` : ''}
  <div class="actions">
    <a href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener" class="btn-wa">📱 Contacter sur WhatsApp</a>
    <a href="${MKT_URL}" class="btn-back">← Toutes les annonces</a>
  </div>
  <hr class="sep">
  <div class="share-title">Partager cette annonce</div>
  <div class="share-row">
    <a href="${fbUrl}" target="_blank" rel="noopener" class="share-btn" style="background:#1877f2">f&nbsp;Facebook</a>
    <a href="https://wa.me/?text=${waMsg}" target="_blank" rel="noopener" class="share-btn" style="background:#25D366">WhatsApp</a>
    <a href="${tgUrl}" target="_blank" rel="noopener" class="share-btn" style="background:#2CA5E0">Telegram</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}" target="_blank" rel="noopener" class="share-btn" style="background:#0077b5">LinkedIn</a>
    <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(a.titre||'')}" target="_blank" rel="noopener" class="share-btn" style="background:#000">𝕏 Twitter</a>
  </div>
  <hr class="sep">
  <div class="meta">Annonce #${a.id} · ${a.vues||0} vues · Publié via ImmoGest</div>
</div>
${_footer()}
<script>
(function(){
  var API='${BASE_URL}',ID=${a.id};
  function lead(type){fetch(API+'/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({annonce_id:ID,type:type,source:document.referrer||'direct'})}).catch(function(){});}
  document.querySelectorAll('a[href*="wa.me"]').forEach(function(el){el.addEventListener('click',function(){lead('whatsapp');});});
  document.querySelectorAll('a[href*="facebook"]').forEach(function(el){el.addEventListener('click',function(){lead('partage');});});
  document.querySelectorAll('a[href*="t.me"]').forEach(function(el){el.addEventListener('click',function(){lead('partage');});});
  lead('information');
})();
</script>
</body></html>`;
        return new Response(html, {headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
      }

      // ── /agence/:slug — mini-site public cabinet ──────────────────
      if (path.startsWith('/agence/')) {
        const agSlug = path.replace('/agence/','').split('/')[0];
        if (!agSlug) return new Response(_htmlErreur('Cabinet introuvable','Slug manquant.'),{status:404,headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
        const r = await sbFetch('tenants','?select=id,nom,nom_cabinet,created_at&limit=500');
        const tenants = r.ok ? await r.json() : [];
        const tenant = tenants.find(t => _slug(t.nom_cabinet||t.nom) === agSlug);
        if (!tenant) return new Response(_htmlErreur('Cabinet introuvable','Cette page n\'existe pas ou a été supprimée.'),{status:404,headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
        const ar = await sbFetch('marketplace_annonces','?tenant_id=eq.'+tenant.id+'&statut=eq.active&order=created_at.desc&limit=60');
        const annonces = ar.ok ? await ar.json() : [];
        const nomCab   = tenant.nom_cabinet || tenant.nom;
        const canonical = `${BASE_URL}/agence/${agSlug}`;
        const titre    = `${nomCab} — Annonces immobilières | ImmoGest Marketplace`;
        const desc     = `Découvrez les ${annonces.length} annonce${annonces.length!==1?'s':''} de ${nomCab} sur ImmoGest Marketplace.`;
        const schema   = JSON.stringify({"@context":"https://schema.org","@type":"RealEstateAgent","name":nomCab,"url":canonical,"numberOfEmployees":{"@type":"QuantitativeValue","value":1}});
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${_esc(titre)}</title>
<meta name="description" content="${_esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${_esc(canonical)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${_esc(titre)}">
<meta property="og:description" content="${_esc(desc)}">
<meta property="og:image" content="${OG_IMG_DEFAULT}">
<meta property="og:url" content="${_esc(canonical)}">
<meta property="og:site_name" content="ImmoGest Marketplace">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${_esc(titre)}">
<meta name="twitter:description" content="${_esc(desc)}">
<script type="application/ld+json">${schema}</script>
<style>${_css()}
.ag-hero{background:linear-gradient(135deg,#050f1e,#0d1f3c);padding:48px 5% 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,.08)}
.ag-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:34px;margin:0 auto 16px}
.verified{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.25);border-radius:99px;padding:4px 12px;font-size:12px;color:#34d399;margin-top:8px}
</style>
</head>
<body>
${_header('← Marketplace', MKT_URL)}
<div class="ag-hero">
  <div class="ag-avatar">🏢</div>
  <h1 style="font-size:24px;font-weight:900;margin-bottom:6px">${_esc(nomCab)}</h1>
  <div class="verified">✅ Gestionnaire certifié ImmoGest</div>
</div>
<div class="wrap">
  <div class="section-label">Annonces publiées <span style="font-weight:400;color:rgba(232,240,254,.35);font-size:11px">${annonces.length} active${annonces.length!==1?'s':''}</span></div>
  ${annonces.length
    ? `<div class="grid">${annonces.map(_cardHtml).join('')}</div>`
    : `<p style="color:rgba(232,240,254,.35);font-size:14px;padding:20px 0">Aucune annonce active pour le moment.</p>`}
  <hr class="sep" style="margin-top:40px">
  <div style="text-align:center;padding:32px;background:#0f1f3d;border-radius:14px;border:1px solid rgba(255,255,255,.07)">
    <p style="font-size:16px;font-weight:700;margin-bottom:8px">Vous gérez des biens immobiliers ?</p>
    <p style="font-size:13px;color:rgba(232,240,254,.45);margin-bottom:20px">Rejoignez ImmoGest et obtenez votre page publique gratuitement.</p>
    <a href="${APP_URL}" class="btn btn-primary" style="font-size:14px;padding:12px 28px">🚀 Créer mon espace</a>
  </div>
</div>
${_footer()}
</body></html>`;
        return new Response(html,{headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
      }

      // ── /ville/:slug — annonces par ville ─────────────────────────
      if (path.startsWith('/ville/')) {
        const villeSlug = path.replace('/ville/','').split('/')[0];
        if (!villeSlug) return new Response(_htmlErreur('Ville introuvable','Slug manquant.'),{status:404,headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
        const r = await sbFetch('marketplace_annonces','?statut=eq.active&order=created_at.desc&limit=200');
        const all = r.ok ? await r.json() : [];
        const annonces = all.filter(a => _slug(a.ville||'') === villeSlug);
        const villeNom = annonces.length ? annonces[0].ville : villeSlug.replace(/-/g,' ');
        const canonical = `${BASE_URL}/ville/${villeSlug}`;
        const titre    = `Annonces immobilières à ${villeNom} | ImmoGest Marketplace`;
        const desc     = `${annonces.length} annonce${annonces.length!==1?'s':''} immobilière${annonces.length!==1?'s':''} à ${villeNom} — location, vente, bureaux. Trouvez votre bien sur ImmoGest.`;
        const schema   = JSON.stringify({"@context":"https://schema.org","@type":"ItemList","name":titre,"description":desc,"url":canonical,"numberOfItems":annonces.length});
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${_esc(titre)}</title>
<meta name="description" content="${_esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${_esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${_esc(titre)}">
<meta property="og:description" content="${_esc(desc)}">
<meta property="og:image" content="${OG_IMG_DEFAULT}">
<meta property="og:url" content="${_esc(canonical)}">
<meta property="og:site_name" content="ImmoGest Marketplace">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${_esc(titre)}">
<meta name="twitter:description" content="${_esc(desc)}">
<meta name="twitter:image" content="${OG_IMG_DEFAULT}">
<script type="application/ld+json">${schema}</script>
<style>${_css()}</style>
</head>
<body>
${_header('← Marketplace', MKT_URL)}
<div style="background:linear-gradient(135deg,#050f1e,#0d1f3c);padding:40px 5% 32px;border-bottom:1px solid rgba(255,255,255,.08)">
  <div style="max-width:1100px;margin:0 auto">
    <div style="font-size:12px;color:rgba(232,240,254,.35);margin-bottom:8px"><a href="${MKT_URL}" style="color:#60a5fa;text-decoration:none">Marketplace</a> › ${_esc(villeNom)}</div>
    <h1 style="font-size:clamp(20px,3vw,30px);font-weight:900;letter-spacing:-.5px">🏙️ Immobilier à ${_esc(villeNom)}</h1>
    <p style="font-size:14px;color:rgba(232,240,254,.5);margin-top:8px">${annonces.length} annonce${annonces.length!==1?'s':''} disponible${annonces.length!==1?'s':''}</p>
  </div>
</div>
<div class="wrap">
  ${annonces.length
    ? `<div class="grid">${annonces.map(_cardHtml).join('')}</div>`
    : `<div style="text-align:center;padding:60px 20px;color:rgba(232,240,254,.3)"><div style="font-size:48px;margin-bottom:12px">🏙️</div><p style="font-size:15px">Aucune annonce disponible à ${_esc(villeNom)} pour le moment.</p><a href="${MKT_URL}" class="btn btn-primary" style="margin-top:20px;display:inline-flex">← Toutes les villes</a></div>`}
</div>
${_footer()}
</body></html>`;
        return new Response(html,{headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
      }

      // ── /pays/:slug — annonces par pays ───────────────────────────
      if (path.startsWith('/pays/')) {
        const paysSlug = path.replace('/pays/','').split('/')[0];
        if (!paysSlug) return new Response(_htmlErreur('Pays introuvable','Slug manquant.'),{status:404,headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
        // Trouver le code pays depuis le slug
        const paysCode = Object.entries(PAYS_LABELS).find(([k,v]) => _slug(v) === paysSlug || k.toLowerCase() === paysSlug)?.[0] || paysSlug.toUpperCase();
        const paysNom  = PAYS_LABELS[paysCode] || paysSlug.replace(/-/g,' ');
        const r = await sbFetch('marketplace_annonces','?statut=eq.active&pays=eq.'+paysCode+'&order=created_at.desc&limit=200');
        const annonces = r.ok ? await r.json() : [];
        const canonical = `${BASE_URL}/pays/${paysSlug}`;
        const titre    = `Annonces immobilières en ${paysNom} | ImmoGest Marketplace`;
        const desc     = `${annonces.length} bien${annonces.length!==1?'s':''} immobilier${annonces.length!==1?'s':''} en ${paysNom} — location, vente, bureaux, colocation. Trouvez votre bien sur ImmoGest.`;
        // Grouper par ville pour affichage structuré
        const parVille = {};
        annonces.forEach(a => { const v = a.ville||'Autre'; if (!parVille[v]) parVille[v]=[]; parVille[v].push(a); });
        const schema   = JSON.stringify({"@context":"https://schema.org","@type":"ItemList","name":titre,"url":canonical,"numberOfItems":annonces.length});
        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${_esc(titre)}</title>
<meta name="description" content="${_esc(desc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${_esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${_esc(titre)}">
<meta property="og:description" content="${_esc(desc)}">
<meta property="og:image" content="${OG_IMG_DEFAULT}">
<meta property="og:url" content="${_esc(canonical)}">
<meta property="og:site_name" content="ImmoGest Marketplace">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${_esc(titre)}">
<meta name="twitter:description" content="${_esc(desc)}">
<meta name="twitter:image" content="${OG_IMG_DEFAULT}">
<script type="application/ld+json">${schema}</script>
<style>${_css()}</style>
</head>
<body>
${_header('← Marketplace', MKT_URL)}
<div style="background:linear-gradient(135deg,#050f1e,#0d1f3c);padding:40px 5% 32px;border-bottom:1px solid rgba(255,255,255,.08)">
  <div style="max-width:1100px;margin:0 auto">
    <div style="font-size:12px;color:rgba(232,240,254,.35);margin-bottom:8px"><a href="${MKT_URL}" style="color:#60a5fa;text-decoration:none">Marketplace</a> › ${_esc(paysNom)}</div>
    <h1 style="font-size:clamp(20px,3vw,30px);font-weight:900;letter-spacing:-.5px">🌍 Immobilier en ${_esc(paysNom)}</h1>
    <p style="font-size:14px;color:rgba(232,240,254,.5);margin-top:8px">${annonces.length} annonce${annonces.length!==1?'s':''} · ${Object.keys(parVille).length} ville${Object.keys(parVille).length!==1?'s':''}</p>
    ${Object.keys(parVille).length > 1 ? `<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px">${Object.entries(parVille).map(([v,arr])=>`<a href="${BASE_URL}/ville/${_slug(v)}" style="padding:5px 14px;border-radius:99px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#e8f0fe;font-size:12px;text-decoration:none">${_esc(v)} <span style="color:#3b82f6;font-weight:700">${arr.length}</span></a>`).join('')}</div>` : ''}
  </div>
</div>
<div class="wrap">
  ${Object.entries(parVille).map(([ville, list]) => `
    <div style="margin-bottom:36px">
      <div class="section-label"><a href="${BASE_URL}/ville/${_slug(ville)}" style="color:#3b82f6;text-decoration:none">🏙️ ${_esc(ville)}</a> <span style="font-weight:400;color:rgba(232,240,254,.3);font-size:11px">${list.length} annonce${list.length!==1?'s':''}</span></div>
      <div class="grid">${list.slice(0,6).map(_cardHtml).join('')}</div>
      ${list.length > 6 ? `<div style="text-align:center;margin-top:12px"><a href="${BASE_URL}/ville/${_slug(ville)}" style="color:#3b82f6;font-size:13px;text-decoration:none">Voir les ${list.length} annonces à ${_esc(ville)} →</a></div>` : ''}
    </div>`).join('') || `<div style="text-align:center;padding:60px 20px;color:rgba(232,240,254,.3)"><div style="font-size:48px;margin-bottom:12px">🌍</div><p>Aucune annonce disponible en ${_esc(paysNom)} pour le moment.</p></div>`}
</div>
${_footer()}
</body></html>`;
        return new Response(html,{headers:{...cors,'Content-Type':'text/html;charset=utf-8'}});
      }

      return json({ error: 'Route introuvable' }, 404);

    } catch (err) {
      console.error('Worker error:', err.message);
      return json({ error: 'Erreur serveur', message: err.message }, 500);
    }
  },

  async scheduled(event, env) {
    console.log('Cron:', event.cron);
    const sbBase = env.SUPABASE_URL || SUPABASE_URL_DEFAULT;

    function sbHdrs() {
      return {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      };
    }

    const appId = env.ONESIGNAL_APP_ID;
    const restKey = env.ONESIGNAL_REST_KEY;

    // ── Cron quotidien (0 7 * * *) : relances impayés ──────────
    if (event.cron === '0 7 * * *' && appId && restKey) {
      // Charger tous les tenants actifs
      const tRes = await fetch(sbBase + '/rest/v1/tenants?select=id,nom,plan', { headers: sbHdrs() });
      const tenants = tRes.ok ? await tRes.json() : [];

      for (const tenant of tenants) {
        // Compter locataires en retard (données via DB)
        const lRes = await fetch(sbBase + '/rest/v1/locataires?tenant_id=eq.' + tenant.id + '&select=id,nom,statut', { headers: sbHdrs() });
        const locs = lRes.ok ? await lRes.json() : [];
        const actifs = locs.filter(l => l.statut !== 'libre');

        if (!actifs.length) continue;

        const now = new Date();
        const moisCourant = now.getMonth() + 1;
        const anneeCourante = now.getFullYear();

        // Compter paiements manquants ce mois
        const pRes = await fetch(sbBase + '/rest/v1/paiements?tenant_id=eq.' + tenant.id + '&mois=eq.' + moisCourant + '&annee=eq.' + anneeCourante + '&select=locataire_id', { headers: sbHdrs() });
        const payes = pRes.ok ? await pRes.json() : [];
        const payesIds = new Set(payes.map(p => p.locataire_id));
        const nbImpayes = actifs.filter(l => !payesIds.has(l.id)).length;

        if (nbImpayes > 0) {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + restKey },
            body: JSON.stringify({
              app_id: appId,
              headings: { fr: '⚠️ Relances impayés' },
              contents: { fr: nbImpayes + ' locataire(s) n\'ont pas encore payé ce mois-ci.' },
              url: 'https://immogest-34w.pages.dev/',
              filters: [{ field: 'tag', key: 'tenant_id', relation: '=', value: tenant.id }]
            })
          }).catch(() => {});
        }
      }
    }

    // ── Cron mensuel (0 7 1 * *) : rappel loyer ────────────────
    if (event.cron === '0 7 1 * *' && appId && restKey) {
      await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + restKey },
        body: JSON.stringify({
          app_id: appId,
          headings: { fr: '📅 Rappel loyers' },
          contents: { fr: 'C\'est le 1er du mois — pensez à encaisser les loyers dans ImmoGest.' },
          url: 'https://immogest-34w.pages.dev/',
          included_segments: ['All']
        })
      }).catch(() => {});
    }
  }
};
