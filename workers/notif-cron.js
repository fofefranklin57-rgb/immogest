// ═══════════════════════════════════════════════════════════════
// IMMOGEST — Cloudflare Worker
// - Cron  : rappels loyers via OneSignal + rapport WhatsApp gestionnaire
// - POST /pay              : initier collecte Campay (MTN/Orange)
// - GET  /check-pay?ref=xx : vérifier statut transaction Campay
// - POST /campay-webhook   : webhook Campay → activer abonnement Supabase
// - POST /ai               : proxy Anthropic API
// - GET  /wa-impayés       : page HTML liens WhatsApp impayés (gestionnaire)
// - GET  /test-notifs, /health
// Secrets requis : CAMPAY_TOKEN (permanent access token), CAMPAY_WEBHOOK_KEY,
//                  CAMPAY_ENV (demo|prod),
//                  SUPABASE_URL, SUPABASE_KEY,
//                  ONESIGNAL_APP_ID, ONESIGNAL_REST_KEY,
//                  ANTHROPIC_API_KEY,
//                  MANAGER_WHATSAPP (ex: 237690409929),
//                  MANAGER_ONESIGNAL_ID (external_id OneSignal du gestionnaire)
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGIN = 'https://immogest-34w.pages.dev';

export default {

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runCron(event.cron, env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    if (url.pathname === '/pay' && request.method === 'POST') {
      return handleCampayCollect(request, env);
    }

    if (url.pathname === '/check-pay' && request.method === 'GET') {
      return handleCampayCheck(request, env);
    }

    if (url.pathname === '/campay-webhook' && request.method === 'POST') {
      return handleCampayWebhook(request, env);
    }

    if (url.pathname === '/ai' && request.method === 'POST') {
      return handleAI(request, env);
    }

    if (url.pathname === '/wa-impay%C3%A9s' || url.pathname === '/wa-impayes') {
      return handleWaImpayesPage(request, env);
    }

    if (url.pathname === '/test-notifs') {
      const result = await runCron('manual', env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('ImmoGest Worker', { status: 200 });
  }
};

// ══════════════════════════════════════════════════════════════
// CAMPAY — Initier une collecte (MTN MoMo / Orange Money)
// POST /pay  { phone, amount, plan, duree, userId }
// ══════════════════════════════════════════════════════════════
async function handleCampayCollect(request, env) {
  try {
    const body = await request.json();
    const { phone, amount, plan, duree, userId } = body;

    if (!phone || !amount || !plan) {
      return jsonResponse({ ok: false, error: 'Paramètres manquants (phone, amount, plan)' }, 400, request);
    }

    if (!env.CAMPAY_TOKEN) {
      return jsonResponse({ ok: false, error: 'CAMPAY_TOKEN non configuré' }, 500, request);
    }

    const isProd   = (env.CAMPAY_ENV === 'prod');
    const base     = isProd ? 'https://campay.net' : 'https://demo.campay.net';
    const safeUser = String(userId || 'user').replace(/[|]/g, '').slice(0, 30);
    const extRef   = `IG|${plan}|${duree || 1}|${safeUser}`;

    // Sandbox : limiter à 25 XAF (limite Campay demo)
    const finalAmount = isProd ? String(amount) : '25';

    const resp = await fetch(`${base}/api/collect/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${env.CAMPAY_TOKEN}`
      },
      body: JSON.stringify({
        amount:             finalAmount,
        currency:           'XAF',
        from:               String(phone),
        description:        isProd
          ? `ImmoGest ${plan} – ${duree || 1} mois`
          : `[TEST] ImmoGest ${plan} – ${duree || 1} mois`,
        external_reference: extRef,
        webhook_url:        'https://immogest1.fofefranklin57.workers.dev/campay-webhook'
      })
    });

    const data = await resp.json();
    console.log('[Campay] collect →', JSON.stringify(data));

    if (data.reference) {
      return jsonResponse({ ok: true, reference: data.reference, status: data.status, sandbox: !isProd }, 200, request);
    }

    console.error('[Campay] Erreur collect:', JSON.stringify(data));
    return jsonResponse({ ok: false, error: data.message || data.detail || 'Campay collect échoué', details: data }, 502, request);

  } catch (e) {
    console.error('[Campay] /pay exception:', e.message);
    return jsonResponse({ ok: false, error: e.message }, 500, request);
  }
}

// ══════════════════════════════════════════════════════════════
// CAMPAY — Vérifier le statut d'une transaction
// GET /check-pay?ref=<reference>
// ══════════════════════════════════════════════════════════════
async function handleCampayCheck(request, env) {
  try {
    const url  = new URL(request.url);
    const ref  = url.searchParams.get('ref');

    if (!ref) {
      return jsonResponse({ ok: false, error: 'Paramètre ref manquant' }, 400, request);
    }

    const base = (env.CAMPAY_ENV === 'prod') ? 'https://campay.net' : 'https://demo.campay.net';
    const resp = await fetch(`${base}/api/transaction/${ref}/`, {
      headers: { 'Authorization': `Token ${env.CAMPAY_TOKEN}` }
    });

    const data = await resp.json();
    return jsonResponse({ ok: true, status: data.status, data }, 200, request);

  } catch (e) {
    return jsonResponse({ ok: false, error: e.message }, 500, request);
  }
}

// ══════════════════════════════════════════════════════════════
// CAMPAY — Webhook : paiement confirmé → activer abonnement Supabase
// POST /campay-webhook
// ══════════════════════════════════════════════════════════════
async function handleCampayWebhook(request, env) {
  try {
    // Vérifier l'authenticité du webhook via la Webhook Key
    const webhookKey = request.headers.get('webhook-key') || request.headers.get('x-webhook-key') || '';
    if (env.CAMPAY_WEBHOOK_KEY && webhookKey !== env.CAMPAY_WEBHOOK_KEY) {
      console.warn('[Campay] Webhook key invalide — requête ignorée');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    console.log('[Campay] Webhook reçu:', JSON.stringify(body));

    const { reference, external_reference, status, amount } = body;

    // Toujours répondre 200 à Campay pour éviter les retries inutiles
    if (status !== 'SUCCESSFUL') {
      console.log('[Campay] Statut non réussi:', status);
      return new Response('OK', { status: 200 });
    }

    // Parser external_reference : IG|plan|duree|userId
    const parts  = (external_reference || '').split('|');
    const plan   = parts[1] || 'starter';
    const duree  = parseInt(parts[2]) || 1;
    const userId = parts[3] || '';

    if (!userId) {
      console.error('[Campay] userId absent dans external_reference:', external_reference);
      return new Response('OK', { status: 200 });
    }

    const expiry = new Date(Date.now() + duree * 30 * 86400000).toISOString();

    // Upsert dans Supabase table abonnements (un enregistrement par cabinet)
    const sbResp = await fetch(`${env.SUPABASE_URL}/rest/v1/abonnements`, {
      method:  'POST',
      headers: {
        'apikey':        env.SUPABASE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        user_id:       userId,
        plan:          plan,
        statut:        'actif',
        date_fin:      expiry,
        reference:     reference,
        montant:       Math.round(parseFloat(amount) || 0),
        date_paiement: new Date().toISOString()
      })
    });

    if (!sbResp.ok) {
      console.error('[Campay] Supabase error:', sbResp.status, await sbResp.text());
    } else {
      console.log(`[Campay] ✅ Abonnement ${plan} activé pour ${userId} jusqu'au ${expiry}`);
    }

    return new Response('OK', { status: 200 });

  } catch (e) {
    console.error('[Campay] Webhook exception:', e.message);
    return new Response('OK', { status: 200 }); // toujours 200 pour Campay
  }
}

// ══════════════════════════════════════════════════════════════
// ANTHROPIC AI — Proxy sécurisé
// ══════════════════════════════════════════════════════════════
async function handleAI(request, env) {
  try {
    // Vérification origine
    const origin = request.headers.get('Origin');
    if (origin && origin !== ALLOWED_ORIGIN) {
      return jsonResponse({ ok: false, error: 'Origine non autorisée' }, 403, request);
    }

    if (!env.ANTHROPIC_API_KEY) {
      console.error('[AI] ANTHROPIC_API_KEY manquante');
      return jsonResponse({ ok: false, error: 'Clé API IA non configurée' }, 500, request);
    }

    const body = await request.json();
    const { system, messages, max_tokens } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return jsonResponse({ ok: false, error: 'Paramètres invalides' }, 400, request);
    }

    // Appel Anthropic — modèle Haiku (rapide + économique)
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5',
        max_tokens: max_tokens || 600,
        system:     system || '',
        messages:   messages.slice(-10)   // limiter l'historique à 10 tours
      })
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error('[AI] Erreur Anthropic:', JSON.stringify(data));
      return jsonResponse({ ok: false, error: data.error?.message || 'Erreur API Anthropic' }, resp.status, request);
    }

    return jsonResponse({ ok: true, content: data.content }, 200, request);

  } catch (e) {
    console.error('[AI] Exception:', e.message);
    return jsonResponse({ ok: false, error: e.message }, 500, request);
  }
}

// ══════════════════════════════════════════════════════════════
// CRON — Rappels loyers
// ══════════════════════════════════════════════════════════════
async function runCron(cronExpr, env) {
  const log = [];
  const now = new Date();
  const jourDuMois = now.getUTCDate();
  const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Africa/Douala' });

  log.push(`[${now.toISOString()}] Cron déclenché : ${cronExpr}`);

  const missing = [];
  if (!env.SUPABASE_URL)       missing.push('SUPABASE_URL');
  if (!env.SUPABASE_KEY)       missing.push('SUPABASE_KEY');
  if (!env.ONESIGNAL_APP_ID)   missing.push('ONESIGNAL_APP_ID');
  if (!env.ONESIGNAL_REST_KEY) missing.push('ONESIGNAL_REST_KEY');
  if (missing.length > 0) {
    log.push(`⚠️ Variables manquantes : ${missing.join(', ')}`);
    return { ok: false, missing, log };
  }
  log.push(`✅ Variables OK (4/4 configurées)`);

  if (jourDuMois === 1 || cronExpr === 'monthly') {
    log.push('→ 1er du mois : rappel loyer mensuel');
    const result = await notifRappelMensuel(env, mois);
    log.push(`   ${result.sent}/${result.total} notifications envoyées`);
  }

  const result = await notifImpayes(env);
  log.push(`→ Impayés : ${result.sent}/${result.total} notifications envoyées`);

  console.log(log.join('\n'));
  return { ok: true, log };
}

async function notifRappelMensuel(env, moisLabel) {
  const locataires = await querySupabase(env,
    `locataires?statut=neq.libre&actif=eq.true&select=id,nom,loyer,immeuble_id`
  );
  if (!locataires || locataires.length === 0) return { sent: 0, total: 0 };

  const immeubles = await querySupabase(env, `immeubles?select=id,nom`);
  const immMap = {};
  (immeubles || []).forEach(i => { immMap[i.id] = i.nom; });

  let sent = 0;
  for (const loc of locataires) {
    const montant = (loc.loyer || 0).toLocaleString('fr-FR');
    const nomImm  = immMap[loc.immeuble_id] ? ` — ${immMap[loc.immeuble_id]}` : '';
    const ok = await sendOneSignalNotif(env,
      `loc_${loc.id}`,
      '🏠 Loyer du mois',
      `Votre loyer de ${montant} FCFA est dû pour ${moisLabel}${nomImm}.`
    );
    if (ok) sent++;
    await sleep(100);
  }
  return { sent, total: locataires.length };
}

async function notifImpayes(env) {
  const locataires = await querySupabase(env,
    `locataires?statut=eq.impay%C3%A9&reste=gt.0&actif=eq.true&select=id,nom,tel,whatsapp,loyer,reste,immeuble_id`
  );
  if (!locataires || locataires.length === 0) return { sent: 0, total: 0 };

  const immeubles = await querySupabase(env, `immeubles?select=id,nom`);
  const immMap = {};
  (immeubles || []).forEach(i => { immMap[i.id] = i.nom; });

  let sent = 0;
  for (const loc of locataires) {
    const montant = (loc.reste || 0).toLocaleString('fr-FR');
    const nomImm  = immMap[loc.immeuble_id] ? ` (${immMap[loc.immeuble_id]})` : '';
    const ok = await sendOneSignalNotif(env,
      `loc_${loc.id}`,
      '⚠️ Loyer en retard',
      `Vous avez ${montant} FCFA en retard${nomImm}. Veuillez régulariser.`
    );
    if (ok) sent++;
    await sleep(100);
  }

  // Notifier le gestionnaire avec résumé + lien vers la page WhatsApp
  if (locataires.length > 0 && env.MANAGER_ONESIGNAL_ID) {
    const totalDu = locataires.reduce((s, l) => s + (l.reste || 0), 0);
    await sendOneSignalNotif(env,
      env.MANAGER_ONESIGNAL_ID,
      `⚠️ ${locataires.length} impayé(s) ce matin`,
      `Total : ${totalDu.toLocaleString('fr-FR')} FCFA — Cliquez pour envoyer les relances WhatsApp`
    );
  }

  return { sent, total: locataires.length };
}

// ══════════════════════════════════════════════════════════════
// PAGE WHATSAPP IMPAYÉS — liens pré-remplis pour le gestionnaire
// GET /wa-impayes
// ══════════════════════════════════════════════════════════════
async function handleWaImpayesPage(request, env) {
  const locataires = await querySupabase(env,
    `locataires?statut=eq.impay%C3%A9&reste=gt.0&actif=eq.true&select=id,nom,tel,whatsapp,loyer,reste,immeuble_id`
  );
  const immeubles = await querySupabase(env, `immeubles?select=id,nom`);
  const immMap = {};
  (immeubles || []).forEach(i => { immMap[i.id] = i.nom; });

  const now = new Date().toLocaleDateString('fr-FR', { timeZone: 'Africa/Douala', day:'2-digit', month:'long', year:'numeric' });
  const locs = locataires || [];
  const totalDu = locs.reduce((s, l) => s + (l.reste || 0), 0);

  const lignes = locs.map(loc => {
    const montant = (loc.reste || 0).toLocaleString('fr-FR');
    const nomImm  = immMap[loc.immeuble_id] || 'Immeuble';
    // Priorité : numéro WhatsApp dédié, sinon téléphone
    const rawNum  = (loc.whatsapp || loc.tel || '').replace(/\D/g, '');
    const tel     = loc.tel ? loc.tel.replace(/\D/g, '') : '';
    const telWa   = rawNum ? (rawNum.startsWith('237') ? rawNum : '237' + rawNum) : '';
    const moisDus = loc.loyer > 0 ? Math.round(loc.reste / loc.loyer) : '?';
    const msg     = encodeURIComponent(
      `Bonjour ${loc.nom},\n\nNous vous rappelons que votre loyer est en souffrance.\n` +
      `Montant dû : *${montant} FCFA* (${moisDus} mois)\n` +
      `Immeuble : ${nomImm}\n\n` +
      `Merci de régulariser dans les meilleurs délais.\n\nCordialement,\nCabinet CRAA ImmoGest`
    );
    const hasPhone = telWa.length >= 12;
    const btnHtml = hasPhone
      ? `<a href="https://wa.me/${telWa}?text=${msg}" target="_blank"
           style="display:inline-block;background:#25D366;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
           💬 WhatsApp
         </a>`
      : `<span style="color:#999;font-size:12px;">Pas de numéro</span>`;

    return `
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-weight:700;font-size:15px;color:#1a202c;">${loc.nom}</div>
          <div style="font-size:13px;color:#718096;margin-top:2px;">${nomImm} · ${tel || 'pas de numéro'}</div>
          <div style="font-size:13px;color:#e53e3e;font-weight:600;margin-top:4px;">⚠️ ${montant} FCFA (${moisDus} mois)</div>
        </div>
        <div>${btnHtml}</div>
      </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ImmoGest — Relances WhatsApp</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f7fafc; margin: 0; padding: 20px; }
    .header { background: linear-gradient(135deg, #0E6AAF, #1a82d4); color: #fff; border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; }
    .stat { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 16px; margin-right: 8px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size:22px;font-weight:800;margin-bottom:4px;">📋 Relances WhatsApp</div>
    <div style="font-size:13px;opacity:.85;">ImmoGest · ${now}</div>
    <div style="margin-top:12px;">
      <span class="stat">⚠️ ${locs.length} locataire(s) impayé(s)</span>
      <span class="stat">💰 ${totalDu.toLocaleString('fr-FR')} FCFA dus</span>
    </div>
  </div>
  ${locs.length === 0
    ? '<div style="text-align:center;padding:40px;color:#718096;font-size:16px;">✅ Aucun impayé aujourd\'hui !</div>'
    : lignes
  }
  <div style="text-align:center;font-size:12px;color:#a0aec0;margin-top:20px;">ImmoGest — Cabinet CRAA</div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
async function querySupabase(env, path) {
  try {
    const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey':        env.SUPABASE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_KEY}`,
        'Content-Type':  'application/json'
      }
    });
    if (!resp.ok) {
      console.error('Supabase error:', resp.status, await resp.text());
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.error('querySupabase error:', e.message);
    return null;
  }
}

async function sendOneSignalNotif(env, externalId, title, message) {
  try {
    const resp = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${env.ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify({
        app_id:          env.ONESIGNAL_APP_ID,
        include_aliases: { external_id: [externalId] },
        target_channel:  'push',
        headings:        { fr: title, en: title },
        contents:        { fr: message, en: message },
        url:             'https://immogest-34w.pages.dev/'
      })
    });
    const json = await resp.json();
    if (json.errors && json.errors.length > 0) {
      if (json.errors[0]?.includes('No subscribers')) return true;
      console.error('OneSignal error for', externalId, ':', json.errors);
      return false;
    }
    return true;
  } catch (e) {
    console.error('sendOneSignalNotif error:', e.message);
    return false;
  }
}

function corsHeaders(request) {
  const origin = request ? request.headers.get('Origin') : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin':  origin || ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age':       '86400'
  };
}

function jsonResponse(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request)
    }
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
