// ═══════════════════════════════════════════════════════════════
// IMMOGEST v2 — Cloudflare Worker complet
// Routes : /health /register /login-tenant /login-user
//          /generate-invite /join /db /ai /translate
//          /fapshi-init /fapshi-check /wa-impayes /owner
// Secrets : SUPABASE_SERVICE_KEY, SUPABASE_URL, SUPABASE_PAT,
//            ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY,
//            ANTHROPIC_API_KEY, MANAGER_WHATSAPP, OWNER_TOKEN
// ═══════════════════════════════════════════════════════════════

const SUPABASE_URL_DEFAULT = 'https://uggxfmwpttfsfcirmeqx.supabase.co';

async function _sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function _telFilter(telephone) {
  const raw = String(telephone || '').replace(/[\s\-\(\)]/g, '');
  const variants = [raw];
  if (raw.startsWith('+')) {
    for (let len = 1; len <= 3; len++) {
      const stripped = raw.slice(1 + len);
      if (stripped.length >= 7) variants.push(stripped);
    }
  } else if (/^\d{10,}$/.test(raw)) {
    for (let len = 1; len <= 3; len++) {
      const stripped = raw.slice(len);
      if (stripped.length >= 7 && stripped.length < raw.length) variants.push(stripped);
    }
  }
  const unique = [...new Set(variants.filter(Boolean))];
  if (unique.length === 1) return 'telephone=eq.' + encodeURIComponent(unique[0]);
  return 'or=(' + unique.map(v => 'telephone.eq.' + encodeURIComponent(v)).join(',') + ')';
}

function _b64url(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new TextEncoder().encode(String(buf));
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function _fromB64url(str) {
  str = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function _signToken(payload, secret) {
  const enc = new TextEncoder();
  const header = _b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = _b64url(JSON.stringify(payload));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(header + '.' + body));
  return header + '.' + body + '.' + _b64url(sig);
}

async function _verifyToken(token, secret) {
  if (!token || !secret) return null;
  const parts = String(token).split('.');
  if (parts.length !== 3) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(parts[0] + '.' + parts[1]));
  if (_b64url(sig) !== parts[2]) return null;
  const payload = JSON.parse(_fromB64url(parts[1]));
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

// ── Rate limiting (mémoire Worker, reset à chaque cold start) ──
const _rl = new Map();
function _rateLimit(ip, route, max = 10, windowMs = 900000) {
  const key = ip + ':' + route;
  const now = Date.now();
  let e = _rl.get(key);
  if (!e || now > e.r) { e = { c: 0, r: now + windowMs }; }
  e.c++;
  _rl.set(key, e);
  return e.c > max; // true = bloqué
}

// ── CORS restrictif ────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://immogest-34w.pages.dev',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
];
function _corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PATCH,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,apikey',
    'Vary': 'Origin',
  };
}

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

    const cors = _corsHeaders(request);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || 'unknown';

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    const sbBase = env.SUPABASE_URL || SUPABASE_URL_DEFAULT;
    const SESSION_SECRET = env.SESSION_SECRET || env.JWT_SECRET;
    const makeToken = (tenantId, userId, role, extra = {}) => {
      if (!SESSION_SECRET) throw new Error('SESSION_SECRET non configuré');
      return _signToken({
        tenantId,
        userId,
        role: role || 'admin',
        ...extra,
        iat: Date.now(),
        exp: Date.now() + 24 * 3600 * 1000
      }, SESSION_SECRET);
    };

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
        if (_rateLimit(clientIp, 'register', 5, 3600000))
          return json({ error: 'Trop de tentatives. Réessayez dans 1 heure.' }, 429);
        const { nom, telephone, passwordHash, nomCabinet } = await request.json();
        if (!nom || !telephone || !passwordHash) return json({ error: 'Champs manquants' }, 400);

        const trialExpire = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        const res = await sbFetch('tenants', '', 'POST', {
          nom, telephone, password_hash: passwordHash,
          nom_cabinet: nomCabinet || '', mode: 'entreprise',
          plan: 'starter', plan_expire: trialExpire
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

        const sessionToken = await makeToken(tenant.id, adminId, 'admin');
        await logEvent(tenant.id, 'info', 'tenant.register', 'Nouveau tenant', { nom, telephone });
        return json({ success: true, tenantId: tenant.id, userId: adminId, plan: 'starter', plan_expire: trialExpire, sessionToken });
      }

      // ── /login-tenant ─────────────────────────────────────────
      if (path === '/login-tenant' && request.method === 'POST') {
        if (_rateLimit(clientIp, 'login', 8, 900000))
          return json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, 429);
        const { telephone, passwordHash } = await request.json();
        if (!telephone || !passwordHash) return json({ error: 'Champs manquants' }, 400);
        const res = await sbFetch('tenants', '?telephone=eq.' + encodeURIComponent(telephone) + '&select=*');
        const tenants = res.ok ? await res.json() : [];
        if (!tenants.length) return json({ error: 'Compte introuvable' }, 404);
        const tenant = tenants[0];
        if (tenant.password_hash !== passwordHash) return json({ error: 'Mot de passe incorrect' }, 401);

        // Charger user admin
        const uRes = await sbFetch('users_app', '?tenant_id=eq.' + tenant.id + '&role=eq.admin&select=*&limit=1');
        const users = uRes.ok ? await uRes.json() : [];
        const adminUser = users[0] || { id: 'admin_' + tenant.id, role: 'admin', nom: tenant.nom };

        // Trial automatique 30j pour comptes sans plan payant
        let planFinal = tenant.plan || 'gratuit';
        let planExpireFinal = tenant.plan_expire || null;
        if (planFinal === 'gratuit') {
          const createdAt = new Date(tenant.created_at || Date.now());
          const ageDays = (Date.now() - createdAt.getTime()) / 86400000;
          if (ageDays <= 30) {
            planFinal = 'starter';
            planExpireFinal = new Date(createdAt.getTime() + 30 * 86400000).toISOString();
            // Persister en DB si pas encore fait
            if (!tenant.plan || tenant.plan === 'gratuit') {
              await sbFetch('tenants', '?id=eq.' + tenant.id, 'PATCH',
                { plan: 'starter', plan_expire: planExpireFinal });
            }
          }
        }
        const sessionToken = await makeToken(tenant.id, adminUser.id, adminUser.role || 'admin');
        await logEvent(tenant.id, 'info', 'tenant.login', 'Connexion', { telephone });
        return json({
          success: true,
          tenant: { ...tenant, plan: planFinal, plan_expire: planExpireFinal },
          userId: adminUser.id,
          role: adminUser.role,
          user: adminUser,
          sessionToken
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
        const sessionToken = await makeToken(tenantId, user.id, user.role, {
          immeubles: user.immeubles_assignes || user.immeubles || [],
          locataireId: user.locataire_id || null,
          immeubleId: user.immeuble_id || null
        });
        return json({ success: true, user, sessionToken });
      }

      // ── /login-portal — connexion locataire / bailleur ────────
      if (path === '/login-portal' && request.method === 'POST') {
        if (_rateLimit(clientIp, 'login-portal', 8, 900000))
          return json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, 429);
        const { telephone, passwordHash } = await request.json();
        if (!telephone || !passwordHash) return json({ error: 'Téléphone et mot de passe requis' }, 400);

        const telFilter = _telFilter(telephone);
        const uRes = await sbFetch('users_app', '?' + telFilter + '&actif=eq.true&select=*');
        const users = uRes.ok ? await uRes.json() : [];
        const portal = users.find(u => u.role === 'locataire' || u.role === 'bailleur');
        if (!portal) return json({ error: 'Aucun compte locataire ou bailleur trouvé pour ce numéro' }, 404);
        if (portal.actif === false) return json({ error: 'Compte désactivé' }, 403);

        const storedPwd = portal.password || '';
        const fallback = storedPwd.length === 6 ? await _sha256(storedPwd) : null;
        if (storedPwd !== passwordHash && fallback !== passwordHash) return json({ error: 'Mot de passe incorrect' }, 401);
        if (storedPwd.length === 6) await sbFetch('users_app', '?id=eq.' + portal.id, 'PATCH', { password: fallback });

        const tRes = await sbFetch('tenants', '?id=eq.' + portal.tenant_id + '&select=*');
        const tenant = (tRes.ok ? await tRes.json() : [])[0] || { id: portal.tenant_id };
        let locataireId = portal.locataire_id || null;
        let immeubleId = portal.immeuble_id || null;
        if (portal.role === 'locataire' && !locataireId) {
          const lRes = await sbFetch('locataires', '?tenant_id=eq.' + portal.tenant_id + '&' + telFilter + '&select=id,immeuble_id');
          const locs = lRes.ok ? await lRes.json() : [];
          if (locs.length) { locataireId = locs[0].id; immeubleId = locs[0].immeuble_id; }
        }

        const extra = portal.role === 'locataire'
          ? { locataireId, locId: locataireId, immeubleId, immId: immeubleId }
          : { immeubles: portal.immeubles_assignes || portal.immeubles || (portal.immeuble_id ? [portal.immeuble_id] : []) };
        const sessionToken = await makeToken(portal.tenant_id, portal.id, portal.role, extra);
        return json({
          success: true, userId: portal.id, role: portal.role, nom: portal.nom, tenant, locataireId, sessionToken,
          user: {
            id: portal.id, role: portal.role, nom: portal.nom, telephone: portal.telephone || '',
            immeubles: portal.immeubles_assignes || portal.immeubles || (portal.immeuble_id ? [portal.immeuble_id] : []),
            permissions: portal.permissions || {}, locataire_id: locataireId, immeuble_id: immeubleId
          }
        });
      }

      // ── /login — connexion unifiée (admin + utilisateurs) ─────
      if (path === '/login' && request.method === 'POST') {
        if (_rateLimit(clientIp, 'login', 8, 900000))
          return json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, 429);
        const { telephone, passwordHash } = await request.json();
        if (!telephone || !passwordHash) return json({ error: 'Téléphone et mot de passe requis' }, 400);
        const telFilter = _telFilter(telephone);

        const tRes = await sbFetch('tenants', '?' + telFilter + '&select=*');
        const tenants = tRes.ok ? await tRes.json() : [];
        if (tenants.length) {
          const tenant = tenants[0];
          if (tenant.password_hash !== passwordHash) return json({ error: 'Mot de passe incorrect' }, 401);
          const uRes = await sbFetch('users_app', '?tenant_id=eq.' + tenant.id + '&role=eq.admin&select=*&limit=1');
          const adminUser = (uRes.ok ? await uRes.json() : [])[0] || { id: 'admin_' + tenant.id, role: 'admin', nom: tenant.nom };
          const sessionToken = await makeToken(tenant.id, adminUser.id, 'admin');
          await logEvent(tenant.id, 'info', 'tenant.login', 'Connexion', { telephone });
          return json({ success: true, userId: adminUser.id, role: 'admin', nom: adminUser.nom, tenant, locataireId: null, sessionToken });
        }

        const uRes = await sbFetch('users_app', '?' + telFilter + '&actif=eq.true&select=*');
        const users = uRes.ok ? await uRes.json() : [];
        if (!users.length) return json({ error: 'Aucun compte trouvé pour ce numéro' }, 404);
        const user = users[0];
        if (user.actif === false) return json({ error: 'Compte désactivé' }, 403);
        const storedPwd = user.password || user.password_hash || '';
        const fallback = storedPwd.length === 6 ? await _sha256(storedPwd) : null;
        if (storedPwd !== passwordHash && fallback !== passwordHash) return json({ error: 'Mot de passe incorrect' }, 401);
        if (storedPwd.length === 6) await sbFetch('users_app', '?id=eq.' + user.id, 'PATCH', { password: fallback });

        const ttRes = await sbFetch('tenants', '?id=eq.' + user.tenant_id + '&select=*');
        const tenant = (ttRes.ok ? await ttRes.json() : [])[0] || { id: user.tenant_id };
        let locataireId = user.locataire_id || null;
        let immeubleId = user.immeuble_id || null;
        if (user.role === 'locataire' && !locataireId) {
          const lRes = await sbFetch('locataires', '?tenant_id=eq.' + user.tenant_id + '&' + telFilter + '&select=id,immeuble_id');
          const locs = lRes.ok ? await lRes.json() : [];
          if (locs.length) { locataireId = locs[0].id; immeubleId = locs[0].immeuble_id; }
        }

        const extra = user.role === 'locataire'
          ? { locataireId, locId: locataireId, immeubleId, immId: immeubleId }
          : ['bailleur','agent','gestionnaire'].includes(user.role)
            ? { immeubles: user.immeubles_assignes || user.immeubles || (user.immeuble_id ? [user.immeuble_id] : []) }
            : {};
        const sessionToken = await makeToken(user.tenant_id, user.id, user.role, extra);
        return json({
          success: true, userId: user.id, role: user.role, nom: user.nom, tenant, locataireId, sessionToken,
          user: {
            id: user.id, role: user.role, nom: user.nom, telephone: user.telephone || '',
            immeubles: user.immeubles_assignes || user.immeubles || (user.immeuble_id ? [user.immeuble_id] : []),
            permissions: user.permissions || {}, locataire_id: locataireId, immeuble_id: immeubleId
          }
        });
      }

      // ── /generate-invite ──────────────────────────────────────
      if (path === '/generate-invite' && request.method === 'POST') {
        const { tenantId, role, immeubles, nom, telephone, locataire_id, immeuble_id, sessionToken } = await request.json();
        if (!tenantId) return json({ error: 'tenantId requis' }, 400);
        const payload = await _verifyToken(sessionToken, SESSION_SECRET);
        if (!payload || payload.tenantId !== tenantId || !['admin','coordinateur','gestionnaire'].includes(payload.role)) {
          return json({ error: 'Action non autorisée' }, 403);
        }
        const finalRole = role || 'gestionnaire';
        const isPortal = finalRole === 'locataire' || finalRole === 'bailleur';
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const code = Array.from({ length: isPortal ? 6 : 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        if (isPortal) {
          const codeHash = await _sha256(code);
          const existingRes = telephone
            ? await sbFetch('users_app', '?tenant_id=eq.' + tenantId + '&telephone=eq.' + encodeURIComponent(telephone) + '&role=eq.' + finalRole + '&select=id')
            : null;
          const existing = existingRes && existingRes.ok ? await existingRes.json() : [];
          const patch = {
            password: codeHash,
            actif: true,
            date_blocage_auto: null,
            motif_blocage: null,
            locataire_id: locataire_id || null,
            immeuble_id: immeuble_id || null,
            immeubles_assignes: immeuble_id ? [immeuble_id] : (immeubles || [])
          };
          if (existing.length) {
            await sbFetch('users_app', '?id=eq.' + existing[0].id, 'PATCH', patch);
          } else {
            await sbFetch('users_app', '', 'POST', {
              id: 'u_' + crypto.randomUUID().replace(/-/g,'').substring(0,10),
              tenant_id: tenantId, role: finalRole,
              nom: nom || '', telephone: telephone || '',
              permissions: {}, ...patch
            });
          }
          return json({ success: true, code });
        }
        await sbFetch('invite_codes', '', 'POST', {
          code, tenant_id: tenantId, role: finalRole,
          immeubles: immeubles || []
        });
        return json({ success: true, code });
      }

      // ── /join ─────────────────────────────────────────────────
      if (path === '/join' && request.method === 'POST') {
        const { code, nom, password, passwordHash, pin } = await request.json();
        const res = await sbFetch('invite_codes', '?code=eq.' + code + '&used=eq.false&select=*');
        const codes = res.ok ? await res.json() : [];
        if (!codes.length) return json({ error: 'Code invalide ou déjà utilisé' }, 404);
        const inv = codes[0];
        if (new Date(inv.expire_at) < new Date()) return json({ error: 'Code expiré' }, 410);
        const tenantRes = await sbFetch('tenants', '?id=eq.' + inv.tenant_id + '&select=*');
        const tenants = tenantRes.ok ? await tenantRes.json() : [];
        if (!tenants.length) return json({ error: 'Espace introuvable' }, 404);
        const tenant = tenants[0];

        const userId = 'u_' + crypto.randomUUID().replace(/-/g,'').substring(0,10);
        await sbFetch('users_app', '', 'POST', {
          id: userId, tenant_id: inv.tenant_id, role: inv.role,
          nom, password: passwordHash || password || null, pin: pin || null,
          immeubles: inv.immeubles || [], actif: true
        });
        await fetch(sbBase + '/rest/v1/invite_codes?id=eq.' + inv.id, {
          method: 'PATCH', headers: sbHdrs(), body: JSON.stringify({ used: true })
        });
        const sessionToken = await makeToken(inv.tenant_id, userId, inv.role, { immeubles: inv.immeubles || [] });
        return json({ success: true, userId, tenantId: inv.tenant_id, tenant, role: inv.role, sessionToken });
      }

      // ── /change-password — chaque utilisateur change son mot de passe ──
      if (path === '/change-password' && request.method === 'POST') {
        const { tenantId, sessionToken, currentPasswordHash, newPasswordHash } = await request.json();
        if (!tenantId || !sessionToken || !currentPasswordHash || !newPasswordHash)
          return json({ error: 'Champs manquants' }, 400);
        if (!SESSION_SECRET) return json({ error: 'SESSION_SECRET non configuré' }, 500);
        if (currentPasswordHash === newPasswordHash)
          return json({ error: 'Le nouveau mot de passe doit être différent' }, 400);

        const payload = await _verifyToken(sessionToken, SESSION_SECRET);
        if (!payload || String(payload.tenantId) !== String(tenantId))
          return json({ error: 'Session invalide' }, 401);

        const userId = payload.userId;
        const isAdmin = (payload.role || '') === 'admin';
        let pwdOk = false;
        let user = null;

        if (userId) {
          const uRes = await sbFetch('users_app', '?id=eq.' + encodeURIComponent(userId) + '&tenant_id=eq.' + encodeURIComponent(tenantId) + '&select=id,tenant_id,role,password,password_hash&limit=1');
          const users = uRes.ok ? await uRes.json() : [];
          user = users[0] || null;
          const storedUserPwd = user ? (user.password || user.password_hash || '') : '';
          if (storedUserPwd === currentPasswordHash) pwdOk = true;
        }

        if (isAdmin) {
          const tRes = await sbFetch('tenants', '?id=eq.' + encodeURIComponent(tenantId) + '&select=id,password_hash&limit=1');
          const tenants = tRes.ok ? await tRes.json() : [];
          const tenant = tenants[0] || null;
          if (tenant && tenant.password_hash === currentPasswordHash) pwdOk = true;
          if (!pwdOk) return json({ error: 'Mot de passe actuel incorrect' }, 401);
          await sbFetch('tenants', '?id=eq.' + encodeURIComponent(tenantId), 'PATCH', { password_hash: newPasswordHash });
          if (user) await sbFetch('users_app', '?id=eq.' + encodeURIComponent(user.id), 'PATCH', { password: newPasswordHash });
        } else {
          if (!user) return json({ error: 'Utilisateur introuvable' }, 404);
          if (!pwdOk) return json({ error: 'Mot de passe actuel incorrect' }, 401);
          await sbFetch('users_app', '?id=eq.' + encodeURIComponent(user.id), 'PATCH', { password: newPasswordHash });
        }

        await logEvent(tenantId, 'info', 'auth.password_change', 'Mot de passe modifié', { userId, role: payload.role });
        const freshToken = await makeToken(tenantId, userId, payload.role, {
          immeubles: payload.immeubles || [],
          locataireId: payload.locataireId || payload.locId || null
        });
        return json({ success: true, sessionToken: freshToken });
      }

      // ── /db — CRUD proxy ──────────────────────────────────────
      if (path === '/db' && request.method === 'POST') {
        const body = await request.json();
        const action = body.action || body.op;  // v2: action, v1 legacy: op
        const { table, data, tenantId, sessionToken } = body;
        const filters = body.filters || body.filter;

        if (!tenantId) return json({ error: 'Session invalide' }, 401);
        if (!ALLOWED_TABLES.includes(table)) return json({ error: 'Table non autorisée: ' + table }, 403);
        if (!sessionToken) return json({ error: 'Session invalide' }, 401);
        if (!SESSION_SECRET) return json({ error: 'SESSION_SECRET non configuré' }, 500);

        const payload = await _verifyToken(sessionToken, SESSION_SECRET);
        if (!payload || payload.tenantId !== tenantId) return json({ error: 'Session invalide' }, 401);

        const SAFE_KEY = /^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/;
        const FULL_ACCESS_ROLES = ['admin','proprietaire','coordinateur'];
        const WRITE_ALLOWED = {
          gestionnaire: ['locataires','marketplace_annonces','messages_internes','declarations'],
          comptable: ['paiements','messages_internes'],
          agent: ['locataires','paiements','marketplace_annonces','messages_internes','declarations'],
          bailleur: ['messages_internes'],
          locataire: ['declarations','messages_internes']
        };
        async function locIdsForImmeubles(immeubleIds) {
          const ids = (immeubleIds || []).filter(Boolean).map(String);
          if (!ids.length) return [];
          const r = await sbFetch('locataires', '?tenant_id=eq.' + tenantId + '&immeuble_id=in.(' + ids.map(encodeURIComponent).join(',') + ')&select=id');
          const rows = r.ok ? await r.json() : [];
          return rows.map(x => String(x.id));
        }
        async function inAssignedScope(tableName, rows) {
          if (FULL_ACCESS_ROLES.includes(payload.role)) return true;
          if (payload.role === 'comptable') return ['paiements','messages_internes'].includes(tableName);
          const assigned = (payload.immeubles || []).map(String);
          if (payload.role === 'locataire') {
            const locId = String(payload.locataireId || payload.locId || payload.userId || '');
            if (tableName === 'declarations') return rows.every(r => String(r.locataire_id) === locId);
            if (tableName === 'messages_internes') return true;
            return false;
          }
          if (payload.role === 'bailleur') return tableName === 'messages_internes';
          if (payload.role === 'agent' || payload.role === 'gestionnaire') {
            if (tableName === 'messages_internes') return true;
            if (!assigned.length) return false;
            if (tableName === 'locataires' || tableName === 'marketplace_annonces') {
              return rows.every(r => assigned.includes(String(r.immeuble_id)));
            }
            if (tableName === 'paiements' || tableName === 'declarations') {
              const locIds = await locIdsForImmeubles(assigned);
              return rows.every(r => locIds.includes(String(r.locataire_id)));
            }
          }
          return false;
        }
        async function existingRowsForFilters(tableName, rowFilters) {
          if (!rowFilters || !rowFilters.id) return [];
          const r = await sbFetch(tableName, '?tenant_id=eq.' + tenantId + '&id=eq.' + encodeURIComponent(rowFilters.id) + '&select=*');
          return r.ok ? await r.json() : [];
        }

        let endpoint = sbBase + '/rest/v1/' + table;
        let method = 'GET';
        let sbBody = null;
        let hdrs = { ...sbHdrs() };

        if (action === 'select') {
          let qs = '?tenant_id=eq.' + tenantId;
          if (payload.role === 'locataire') {
            const locId = payload.locataireId || payload.locId || payload.userId;
            if (table === 'locataires') qs += '&id=eq.' + encodeURIComponent(locId);
            else if (table === 'paiements' || table === 'declarations') qs += '&locataire_id=eq.' + encodeURIComponent(locId);
            else if (table === 'messages_internes') qs += '&or=(pour_user_id.eq.' + encodeURIComponent(payload.userId) + ',de_user_id.eq.' + encodeURIComponent(payload.userId) + ')';
            else if (table !== 'parametres') return json({ success: true, data: [], ok: true });
          } else if (!FULL_ACCESS_ROLES.includes(payload.role)) {
            const assigned = payload.immeubles || [];
            if (payload.role === 'comptable') {
              if (!['immeubles','locataires','paiements','messages_internes','parametres'].includes(table)) return json({ success: true, data: [], ok: true });
            } else if (payload.role === 'agent' || payload.role === 'bailleur' || payload.role === 'gestionnaire') {
              if (assigned.length && table === 'immeubles') {
                qs += '&id=in.(' + assigned.map(encodeURIComponent).join(',') + ')';
              } else if (assigned.length && (table === 'locataires' || table === 'marketplace_annonces')) {
                qs += '&immeuble_id=in.(' + assigned.map(encodeURIComponent).join(',') + ')';
              } else if (assigned.length && (table === 'paiements' || table === 'declarations')) {
                const locIds = await locIdsForImmeubles(assigned);
                if (!locIds.length) return json({ success: true, data: [], ok: true });
                qs += '&locataire_id=in.(' + locIds.map(encodeURIComponent).join(',') + ')';
              } else if (table === 'messages_internes') {
                qs += '&or=(pour_user_id.eq.' + encodeURIComponent(payload.userId) + ',de_user_id.eq.' + encodeURIComponent(payload.userId) + ')';
              } else if (table !== 'parametres') {
                return json({ success: true, data: [], ok: true });
              }
            } else if (table === 'messages_internes') {
              qs += '&or=(pour_user_id.eq.' + encodeURIComponent(payload.userId) + ',de_user_id.eq.' + encodeURIComponent(payload.userId) + ')';
            } else if (table !== 'parametres') {
              return json({ success: true, data: [], ok: true });
            }
          }
          if (filters) Object.entries(filters).forEach(([k,v]) => {
            if (SAFE_KEY.test(k)) qs += '&' + k + '=eq.' + encodeURIComponent(v);
          });
          // Colonne de tri par table : ne jamais trier par created_at sur
          // les tables qui ne l'ont pas (sinon PostgREST 42703 → "Erreur base de données").
          const ORDER_COL = {
            declarations: 'id', corbeille: 'id',
            feature_flags: 'id', scores_locataires: 'id',
            locale_profiles: 'tenant_id'
          };
          const orderCol = ORDER_COL[table] || 'created_at';
          const selectFields = table === 'users_app'
            ? 'id,tenant_id,role,nom,telephone,email,actif,immeubles,immeubles_assignes,permissions,locataire_id,immeuble_id,created_at'
            : '*';
          qs += '&select=' + selectFields + '&order=' + orderCol + '.asc';
          endpoint += qs;

        } else if (action === 'upsert') {
          if (WRITE_ALLOWED[payload.role] && !WRITE_ALLOWED[payload.role].includes(table)) return json({ error: 'Action non autorisée' }, 403);
          const rows = Array.isArray(data) ? data : [data];
          if (!(await inAssignedScope(table, rows))) return json({ error: 'Action hors périmètre' }, 403);
          const withTenant = rows.map(r => ({ ...r, tenant_id: tenantId }));
          endpoint += '?on_conflict=id';
          method = 'POST';
          sbBody = JSON.stringify(withTenant);
          hdrs['Prefer'] = 'resolution=merge-duplicates,return=representation';

        } else if (action === 'insert') {
          if (WRITE_ALLOWED[payload.role] && !WRITE_ALLOWED[payload.role].includes(table)) return json({ error: 'Action non autorisée' }, 403);
          const rows = Array.isArray(data) ? data : [data];
          if (!(await inAssignedScope(table, rows))) return json({ error: 'Action hors périmètre' }, 403);
          method = 'POST';
          sbBody = JSON.stringify(rows.map(r => ({ ...r, tenant_id: tenantId })));

        } else if (action === 'delete') {
          if (WRITE_ALLOWED[payload.role] && !WRITE_ALLOWED[payload.role].includes(table)) return json({ error: 'Action non autorisée' }, 403);
          if (!FULL_ACCESS_ROLES.includes(payload.role)) {
            const existing = await existingRowsForFilters(table, filters);
            if (!existing.length || !(await inAssignedScope(table, existing))) return json({ error: 'Action hors périmètre' }, 403);
          }
          const delId = filters?.id;
          endpoint += '?tenant_id=eq.' + tenantId + '&id=eq.' + delId;
          method = 'DELETE';

        } else if (action === 'update' || action === 'patch') {
          if (WRITE_ALLOWED[payload.role] && !WRITE_ALLOWED[payload.role].includes(table)) return json({ error: 'Action non autorisée' }, 403);
          if (!FULL_ACCESS_ROLES.includes(payload.role)) {
            const existing = await existingRowsForFilters(table, filters);
            if (!existing.length || !(await inAssignedScope(table, existing))) return json({ error: 'Action hors périmètre' }, 403);
          }
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

      // ── /upload — proxy Supabase Storage (clé jamais côté client) ─
      if (path === '/upload' && request.method === 'POST') {
        const fd = await request.formData();
        const file = fd.get('file');
        const filePath = fd.get('path');
        const tenantId = fd.get('tenantId');
        const sessionToken = fd.get('sessionToken');
        if (!tenantId || !file || !filePath) return json({ error: 'Paramètres manquants' }, 400);
        if (!SESSION_SECRET) return json({ error: 'SESSION_SECRET non configuré' }, 500);
        const payload = await _verifyToken(sessionToken, SESSION_SECRET);
        if (!payload || payload.tenantId !== tenantId) return json({ error: 'Session invalide' }, 401);
        if (!/^[a-zA-Z0-9_./-]+$/.test(String(filePath)) || String(filePath).includes('..')) {
          return json({ error: 'Chemin fichier invalide' }, 400);
        }
        const sbUrl = env.SUPABASE_URL || SUPABASE_URL_DEFAULT;
        const upRes = await fetch(sbUrl + '/storage/v1/object/marketplace/' + filePath, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_KEY, 'Content-Type': file.type || 'image/jpeg' },
          body: file
        });
        if (!upRes.ok) return json({ error: 'Erreur upload' }, 500);
        return json({ url: sbUrl + '/storage/v1/object/public/marketplace/' + filePath });
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

      // ── Anciennes routes paiement désactivées : Fapshi uniquement ──
      if (path === '/payment-init' && request.method === 'POST') {
        return json({ error: 'Route désactivée. Utilisez /fapshi-init.' }, 410);
      }

      if (path === '/payment-check' && request.method === 'GET') {
        return json({ error: 'Route désactivée. Utilisez /fapshi-check.' }, 410);
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
        const OWNER_TOKEN = env.OWNER_TOKEN;
        if (!OWNER_TOKEN) return json({ error: 'OWNER_TOKEN non configuré' }, 500);
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

      // ── /fapshi-init — proxy Fapshi initiate-pay ─────────────
      if (path === '/fapshi-init' && request.method === 'POST') {
        const { amount, email, tenantId, planId, duree, ref } = await request.json();
        const FAPSHI_KEY  = env.FAPSHI_APIKEY;
        const FAPSHI_USER = env.FAPSHI_APIUSER;
        if (!FAPSHI_KEY || !FAPSHI_USER) return json({ error: 'Fapshi non configuré' }, 500);
        const FAPSHI_BASE = 'https://live.fapshi.com';
        const dureeLabel  = duree === 1 ? '1 mois' : duree === 12 ? '1 an' : duree + ' mois';
        const body = {
          amount,
          email:       email || 'client@immogest.cm',
          redirectUrl: 'https://immogest-34w.pages.dev',
          userId:      tenantId || ref,
          externalId:  ref,
          message:     'ImmoGest ' + (planId||'').toUpperCase() + ' — ' + dureeLabel
        };
        const res = await fetch(FAPSHI_BASE + '/initiate-pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apiuser: FAPSHI_USER, apikey: FAPSHI_KEY },
          body: JSON.stringify(body)
        });
        const d = await res.json();
        if (!res.ok) return json({ error: d.message || d.error || JSON.stringify(d), fapshiStatus: res.status }, 400);
        return json({ link: d.link, transId: d.transId });
      }

      // ── /fapshi-check — proxy Fapshi payment-status ───────────
      if (path === '/fapshi-check' && request.method === 'GET') {
        const transId     = url.searchParams.get('transId');
        if (!transId) return json({ error: 'transId requis' }, 400);
        const FAPSHI_KEY  = env.FAPSHI_APIKEY;
        const FAPSHI_USER = env.FAPSHI_APIUSER;
        if (!FAPSHI_KEY || !FAPSHI_USER) return json({ error: 'Fapshi non configuré' }, 500);
        const res = await fetch('https://live.fapshi.com/payment-status/' + transId, {
          headers: { apiuser: FAPSHI_USER, apikey: FAPSHI_KEY }
        });
        const d = await res.json();
        return json({ status: d.status, transId });
      }

      // ── /activate-plan — activer plan après paiement Fapshi ───
      if (path === '/activate-plan' && request.method === 'POST') {
        const { planId, ref, duree, tenantId, transId, sessionToken } = await request.json();
        if (!planId || !tenantId || !transId) return json({ error: 'planId + tenantId + transId requis' }, 400);
        if (!SESSION_SECRET) return json({ error: 'SESSION_SECRET non configuré' }, 500);
        const payload = sessionToken ? await _verifyToken(sessionToken, SESSION_SECRET) : null;
        if (!payload || payload.tenantId !== tenantId) return json({ error: 'Session invalide' }, 401);
        const FAPSHI_KEY  = env.FAPSHI_APIKEY;
        const FAPSHI_USER = env.FAPSHI_APIUSER;
        if (!FAPSHI_KEY || !FAPSHI_USER) return json({ error: 'Fapshi non configuré' }, 500);
        const chk = await fetch('https://live.fapshi.com/payment-status/' + encodeURIComponent(transId), {
          headers: { apiuser: FAPSHI_USER, apikey: FAPSHI_KEY }
        });
        const pay = await chk.json().catch(() => ({}));
        if (!chk.ok) return json({ error: pay.message || pay.error || 'Vérification Fapshi échouée' }, 400);
        if (String(pay.status || '').toUpperCase() !== 'SUCCESSFUL') return json({ error: 'Paiement non confirmé', status: pay.status || 'PENDING' }, 402);
        const dureeJours  = (duree || 1) === 12 ? 365 : (duree || 1) * 31;
        const planExpire  = new Date(Date.now() + dureeJours * 86400000).toISOString();
        const r = await fetch(sbBase + '/rest/v1/tenants?id=eq.' + tenantId, {
          method: 'PATCH',
          headers: { ...sbHdrs(), 'Prefer': 'return=minimal' },
          body: JSON.stringify({ plan: planId, plan_expire: planExpire })
        });
        if (!r.ok) return json({ error: 'Mise à jour plan échouée' }, 500);
        await logEvent(tenantId, 'info', 'plan.activated', 'Plan activé: ' + planId, { ref, duree, transId });
        return json({ success: true, plan: planId, plan_expire: planExpire });
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
        const OWNER_TOKEN = env.OWNER_TOKEN;
        if (!OWNER_TOKEN) return json({ error: 'OWNER_TOKEN non configuré' }, 500);
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

        if (action === 'owner_messages') {
          const r = await sbFetch('messages_internes', '?select=*&or=(pour_user_id.eq.__OWNER__,destinataire_id.eq.__OWNER__,pour_user_id.is.null)&order=created_at.desc&limit=200');
          return json({ success: true, messages: r.ok ? await r.json() : [] });
        }

        if (action === 'owner_mark_read') {
          const { msgId } = body;
          if (!msgId) return json({ error: 'msgId requis' }, 400);
          const r0 = await sbFetch('messages_internes', '?id=eq.' + encodeURIComponent(msgId) + '&select=lu_par&limit=1');
          const rows = r0.ok ? await r0.json() : [];
          const luPar = Array.isArray(rows[0]?.lu_par) ? rows[0].lu_par : [];
          if (!luPar.includes('__OWNER__')) luPar.push('__OWNER__');
          const r = await sbFetch('messages_internes', '?id=eq.' + encodeURIComponent(msgId), 'PATCH', { lu: true, lu_par: luPar });
          if (!r.ok) return json({ error: 'Marquage lecture échoué' }, 500);
          return json({ success: true });
        }

        if (action === 'owner_reply') {
          const { tenant_id, pour_user_id, pour_nom, sujet, contenu } = body;
          if (!tenant_id || !pour_user_id || !contenu) return json({ error: 'tenant_id + pour_user_id + contenu requis' }, 400);
          const msg = {
            tenant_id,
            sujet: sujet && String(sujet).startsWith('Re:') ? sujet : 'Re: ' + (sujet || 'Message'),
            contenu,
            de_user_id: '__OWNER__',
            de_nom: 'ImmoGest Support',
            pour_user_id,
            pour_nom: pour_nom || pour_user_id,
            expediteur_id: '__OWNER__',
            destinataire_id: pour_user_id,
            lu: false,
            lu_par: []
          };
          const r = await sbFetch('messages_internes', '', 'POST', msg);
          if (!r.ok) return json({ error: 'Réponse owner échouée' }, 500);
          return json({ success: true });
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
        const { tenantId, title, body: notifBody, url: notifUrl, ownerToken, sessionToken, externalUserId, data } = await request.json();
        const OWNER_TOKEN = env.OWNER_TOKEN;
        let actorTenant = tenantId || '';
        if (ownerToken) {
          if (!OWNER_TOKEN || ownerToken !== OWNER_TOKEN) return json({ error: 'Accès refusé' }, 403);
        } else {
          if (!SESSION_SECRET) return json({ error: 'SESSION_SECRET non configuré' }, 500);
          const payload = await _verifyToken(sessionToken, SESSION_SECRET);
          if (!payload || !payload.tenantId) return json({ error: 'Session invalide' }, 401);
          actorTenant = payload.tenantId;
          if (tenantId && tenantId !== payload.tenantId) return json({ error: 'Tenant non autorisé' }, 403);
        }

        const appId = env.ONESIGNAL_APP_ID;
        const restKey = env.ONESIGNAL_REST_KEY;
        if (!appId || !restKey) return json({ error: 'OneSignal non configuré' }, 500);
        if (!externalUserId && !actorTenant) return json({ error: 'Cible notification requise' }, 400);

        const payload = {
          app_id: appId,
          headings: { fr: title || 'ImmoGest', en: title || 'ImmoGest' },
          contents: { fr: notifBody || 'Nouvelle notification', en: notifBody || 'New notification' },
          url: notifUrl || 'https://immogest-34w.pages.dev/',
          data: data || {},
          include_aliases: externalUserId ? { external_id: [String(externalUserId)] } : undefined,
          target_channel: externalUserId ? 'push' : undefined,
          filters: externalUserId ? undefined : [{ field: 'tag', key: 'tenant_id', relation: '=', value: actorTenant }]
        };

        const osRes = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + restKey },
          body: JSON.stringify(payload)
        });
        const osData = await osRes.json();
        if (osData.errors && osData.errors.length) return json({ error: osData.errors[0] }, 500);
        await logEvent(actorTenant || 'owner', 'info', 'push.sent', title || 'Notification', { recipients: osData.recipients });
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
      if (path === '/leads-gestionnaire' && request.method === 'GET') {
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
      if (path === '/lead' && request.method === 'POST') {
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

        // Incrémenter vues si type = information/whatsapp/visite
        if (type === 'information' || type === 'whatsapp' || type === 'visite') {
          await fetch(sbBase + '/rest/v1/rpc/increment_vues', {
            method: 'POST',
            headers: { ...sbHdrs(), 'Prefer': 'return=minimal' },
            body: JSON.stringify({ annonce_id: parseInt(annonce_id) })
          }).catch(() => {});
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

      // ── POST /annonce-auto — crée pré-annonce depuis départ locataire ───
      if (path === '/annonce-auto' && request.method === 'POST') {
        let body = {};
        try { body = await request.json(); } catch(_) {}
        const { locataire_id, tenant_id } = body;
        if (!locataire_id || !tenant_id) return json({ error: 'locataire_id et tenant_id requis' }, 400);

        // Récupérer locataire + immeuble
        const lr = await sbFetch('locataires', '?id=eq.' + locataire_id + '&select=*,immeubles(*)&limit=1');
        const locs = lr.ok ? await lr.json() : [];
        const loc = locs[0];
        if (!loc) return json({ error: 'Locataire introuvable' }, 404);

        const imm = loc.immeubles || {};

        // Vérifier si annonce existe déjà pour ce local (non archivée)
        const ea = await sbFetch('marketplace_annonces',
          `?tenant_id=eq.${tenant_id}&immeuble_id=eq.${loc.immeuble_id}&appt=eq.${encodeURIComponent(loc.appt||'')}&statut=neq.archivée&limit=1`);
        const existing = ea.ok ? await ea.json() : [];
        if (existing.length > 0) return json({ exists: true, annonce_id: existing[0].id });

        // Lire mode_publication depuis parametres
        const pr = await sbFetch('parametres', `?tenant_id=eq.${tenant_id}&limit=1`);
        const params = pr.ok ? await pr.json() : [];
        const settings = params[0]?.settings || {};
        const mode = settings.mode_publication || 'manuel';

        const statut = mode === 'auto' ? 'active' : 'brouillon';

        // Construire pré-annonce
        const annonce = {
          tenant_id,
          immeuble_id: loc.immeuble_id,
          appt: loc.appt || null,
          contact_telephone: loc.telephone || imm.tel_proprio || null,
          type_local: loc.type_local || 'appartement',
          loyer: loc.loyer || 0,
          caution: loc.caution || 0,
          ville: imm.ville || '',
          quartier: imm.quartier || '',
          pays: imm.pays || '',
          titre: `${loc.type_local || 'Local'} à louer — ${imm.quartier || imm.ville || ''}`.trim(),
          description: imm.description_marketing || '',
          photos: imm.photos || [],
          visite_3d_url: imm.visite_3d_url || null,
          commodites: imm.commodites || [],
          mode_auto: mode === 'auto',
          statut,
          score_qualite: 0,
          tags: []
        };

        const ins = await sbFetch('marketplace_annonces', '', 'POST', annonce);
        const result = ins.ok ? await ins.json() : null;
        const annonce_id = result?.[0]?.id || null;

        // Calculer score qualité
        if (annonce_id) {
          let score = 0;
          if ((annonce.photos||[]).length > 0) score += 30;
          if ((annonce.description||'').length > 50) score += 20;
          if (annonce.loyer > 0) score += 20;
          if (annonce.ville) score += 15;
          if (annonce.visite_3d_url) score += 15;
          await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id, 'PATCH', { score_qualite: score });

          // Log workflow
          await sbFetch('marketplace_workflow', '', 'POST', {
            tenant_id, annonce_id, locataire_id, immeuble_id: loc.immeuble_id, appt: loc.appt || null,
            evenement: 'pre_annonce.creee', details: { mode, statut, score }
          });

          if (mode === 'auto') {
            await sbFetch('marketplace_workflow', '', 'POST', {
              tenant_id, annonce_id, locataire_id, immeuble_id: loc.immeuble_id, appt: loc.appt || null,
              evenement: 'annonce.publiee', details: { mode: 'auto' }
            });
          }
        }

        return json({ success: true, annonce_id, statut, mode });
      }

      // ── POST /annonce-publier/:id — publier un brouillon ──────────
      if (path.startsWith('/annonce-publier/') && request.method === 'POST') {
        const annonce_id = parseInt(path.split('/')[2]);
        if (!annonce_id) return json({ error: 'id invalide' }, 400);

        let pubBody = {};
        try { pubBody = await request.json(); } catch(_) {}
        const { tenant_id: pubTenantId } = pubBody;
        if (!pubTenantId) return json({ error: 'tenant_id requis' }, 400);

        const r = await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id + '&tenant_id=eq.' + pubTenantId + '&select=*&limit=1');
        const anns = r.ok ? await r.json() : [];
        if (!anns.length) return json({ error: 'Annonce introuvable' }, 404);

        await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id, 'PATCH', {
          statut: 'active', updated_at: new Date().toISOString()
        });

        await sbFetch('marketplace_workflow', '', 'POST', {
          tenant_id: anns[0].tenant_id, annonce_id, immeuble_id: anns[0].immeuble_id,
          appt: anns[0].appt || null, evenement: 'annonce.publiee', details: { par: 'gestionnaire' }
        });

        return json({ success: true, annonce_id });
      }

      // ── PUT /annonce-score/:id — recalcul score qualité ───────────
      if (path.startsWith('/annonce-score/') && request.method === 'PUT') {
        const annonce_id = parseInt(path.split('/')[2]);
        if (!annonce_id) return json({ error: 'id invalide' }, 400);

        const r = await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id + '&select=*&limit=1');
        const anns = r.ok ? await r.json() : [];
        if (!anns.length) return json({ error: 'Annonce introuvable' }, 404);
        const a = anns[0];

        let score = 0;
        if ((a.photos||[]).length > 0) score += 30;
        if ((a.description||'').length > 50) score += 20;
        if (a.loyer > 0) score += 20;
        if (a.ville) score += 15;
        if (a.visite_3d_url) score += 15;

        await sbFetch('marketplace_annonces', '?id=eq.' + annonce_id, 'PATCH', { score_qualite: score });
        return json({ success: true, score });
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
