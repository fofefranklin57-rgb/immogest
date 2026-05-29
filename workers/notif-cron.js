// ═══════════════════════════════════════════════════════════════
// IMMOGEST — Cloudflare Worker Cron
// Rappels automatiques loyers impayés via OneSignal
// ═══════════════════════════════════════════════════════════════
// Déploiement : wrangler deploy
// Crons configurés dans wrangler.toml
// ═══════════════════════════════════════════════════════════════

export default {

  // ── Cron trigger (planifié) ──────────────────────────────────
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runCron(event.cron, env));
  },

  // ── Requête HTTP (pour tester manuellement) ──────────────────
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // GET /test-notifs → déclenche manuellement
    if (url.pathname === '/test-notifs') {
      const result = await runCron('manual', env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // GET /health → vérification
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('ImmoGest Notif Worker', { status: 200 });
  }
};

// ══════════════════════════════════════════════════════════════
// LOGIQUE PRINCIPALE
// ══════════════════════════════════════════════════════════════
async function runCron(cronExpr, env) {
  const log = [];
  const now = new Date();
  const jourDuMois = now.getUTCDate();
  const mois = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'Africa/Douala' });

  log.push(`[${now.toISOString()}] Cron déclenché : ${cronExpr}`);

  // 1. Rappel mensuel — 1er du mois : notifier TOUS les locataires actifs
  if (jourDuMois === 1 || cronExpr === 'monthly') {
    log.push('→ 1er du mois : rappel loyer mensuel');
    const result = await notifRappelMensuel(env, mois);
    log.push(`   ${result.sent}/${result.total} notifications envoyées`);
  }

  // 2. Rappel quotidien — locataires en retard (reste > 0)
  const result = await notifImpayes(env);
  log.push(`→ Impayés : ${result.sent}/${result.total} notifications envoyées`);

  console.log(log.join('\n'));
  return { ok: true, log };
}

// ══════════════════════════════════════════════════════════════
// RAPPEL 1er DU MOIS — tous les locataires actifs
// ══════════════════════════════════════════════════════════════
async function notifRappelMensuel(env, moisLabel) {
  // Récupérer tous les locataires actifs (pas libres)
  const locataires = await querySupabase(env,
    `locataires?statut=neq.libre&actif=eq.true&select=id,nom,loyer,immeuble_id`
  );

  if (!locataires || locataires.length === 0) return { sent: 0, total: 0 };

  // Récupérer les immeubles pour les noms
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
    await sleep(100); // éviter le rate limiting
  }

  return { sent, total: locataires.length };
}

// ══════════════════════════════════════════════════════════════
// RAPPEL QUOTIDIEN — locataires en retard
// ══════════════════════════════════════════════════════════════
async function notifImpayes(env) {
  // Locataires avec reste > 0 et statut impayé
  const locataires = await querySupabase(env,
    `locataires?statut=eq.impay%C3%A9&reste=gt.0&actif=eq.true&select=id,nom,loyer,reste,immeuble_id`
  );

  if (!locataires || locataires.length === 0) return { sent: 0, total: 0 };

  // Récupérer les immeubles
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

// Requête Supabase REST API
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
  } catch(e) {
    console.error('querySupabase error:', e.message);
    return null;
  }
}

// Envoyer une notification OneSignal
async function sendOneSignalNotif(env, externalId, title, message) {
  try {
    const resp = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${env.ONESIGNAL_REST_KEY}`
      },
      body: JSON.stringify({
        app_id:           env.ONESIGNAL_APP_ID,
        include_aliases:  { external_id: [externalId] },
        target_channel:   'push',
        headings:         { fr: title, en: title },
        contents:         { fr: message, en: message },
        url:              'https://immogest-34w.pages.dev/'
      })
    });
    const json = await resp.json();
    if (json.errors && json.errors.length > 0) {
      // "No subscribers" n'est pas une vraie erreur
      if (json.errors[0]?.includes('No subscribers')) return true;
      console.error('OneSignal error for', externalId, ':', json.errors);
      return false;
    }
    return true;
  } catch(e) {
    console.error('sendOneSignalNotif error:', e.message);
    return false;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
