// ═══════════════════════════════════════════════════════════════
// IMMOGEST — Cloudflare Worker
// - Cron : rappels loyers via OneSignal
// - POST /ai     : proxy Anthropic API (clé sécurisée côté serveur)
// - POST /pay    : init paiement CinetPay (credentials sécurisés)
// - POST /notify : webhook CinetPay (confirmation paiement)
// - GET  /test-notifs, /health
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
      return handlePaymentInit(request, env);
    }

    if (url.pathname === '/notify' && request.method === 'POST') {
      return handlePaymentNotify(request, env);
    }

    if (url.pathname === '/ai' && request.method === 'POST') {
      return handleAI(request, env);
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
// CINETPAY — Initialisation paiement
// ══════════════════════════════════════════════════════════════
async function handlePaymentInit(request, env) {
  try {
    const body = await request.json();
    const { transactionId, amount, designation, firstName, lastName, email, phone } = body;

    if (!transactionId || !amount || !designation) {
      return jsonResponse({ ok: false, error: 'Paramètres manquants' }, 400, request);
    }

    // 1. Authentification CinetPay → access_token
    const authResp = await fetch('https://api.cinetpay.net/v1/oauth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key:      env.CINETPAY_API_KEY,
        api_password: env.CINETPAY_API_PASSWORD
      })
    });
    const authData = await authResp.json();
    if (authData.code !== 200 || !authData.access_token) {
      console.error('[CinetPay] Auth échouée:', JSON.stringify(authData));
      return jsonResponse({ ok: false, error: 'Authentification CinetPay échouée', details: authData }, 500, request);
    }

    // 2. Initialiser le paiement
    const payResp = await fetch('https://api.cinetpay.net/v1/payment', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${authData.access_token}`
      },
      body: JSON.stringify({
        currency:               'XAF',
        merchant_transaction_id: transactionId,
        amount:                 amount,
        lang:                   'fr',
        designation:            designation,
        client_email:           email || 'client@immogest.cm',
        client_first_name:      firstName || 'Client',
        client_last_name:       lastName  || 'ImmoGest',
        client_phone_number:    phone || '',
        success_url: 'https://immogest-34w.pages.dev/?payment=success',
        failed_url:  'https://immogest-34w.pages.dev/?payment=failed',
        notify_url:  'https://immogest1.fofefranklin57.workers.dev/notify'
      })
    });
    const payData = await payResp.json();

    if (payData.code === 200 && payData.payment_url) {
      return jsonResponse({
        ok:             true,
        payment_url:    payData.payment_url,
        transaction_id: payData.transaction_id
      }, 200, request);
    }

    console.error('[CinetPay] Init paiement échouée:', JSON.stringify(payData));
    return jsonResponse({ ok: false, error: 'Initialisation paiement échouée', details: payData }, 500, request);

  } catch (e) {
    console.error('[CinetPay] Exception /pay:', e.message);
    return jsonResponse({ ok: false, error: e.message }, 500, request);
  }
}

// ══════════════════════════════════════════════════════════════
// CINETPAY — Webhook notification paiement
// ══════════════════════════════════════════════════════════════
async function handlePaymentNotify(request, env) {
  try {
    const body = await request.json();
    console.log('[CinetPay] Notify reçu:', JSON.stringify(body));
    // Extensible : mise à jour Supabase ici si besoin
    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response('Error', { status: 400 });
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
    `locataires?statut=eq.impay%C3%A9&reste=gt.0&actif=eq.true&select=id,nom,loyer,reste,immeuble_id`
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
  return { sent, total: locataires.length };
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
