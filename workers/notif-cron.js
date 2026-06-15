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
  'user_organisations','promo_codes','owner_logs','prestataires'
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

    try {

      // ── /health ──────────────────────────────────────────────
      if (path === '/health') {
        return json({ ok: true, version: '2.0', ts: Date.now() });
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
            system: system || 'Tu es un assistant de gestion immobilière pour l\'Afrique francophone.',
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
