// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Proxy Supabase via Cloudflare Worker
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.db = (function() {

  var _sbAuthFailed = false;
  var _sbFailTimer  = null;

  function _workerUrl() {
    return (window.IG.config && window.IG.config.workerUrl) ||
      'https://immogest1.fofefranklin57.workers.dev';
  }

  function _session() {
    return window.IG.auth ? window.IG.auth.getSession() : null;
  }

  function _markAuthFailed() {
    _sbAuthFailed = true;
    if (_sbFailTimer) clearTimeout(_sbFailTimer);
    _sbFailTimer = setTimeout(function() { _sbAuthFailed = false; }, 15000);
  }

  function resetAuth() { _sbAuthFailed = false; }

  async function workerCall(path, method, body) {
    var opts = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    try {
      var res = await fetch(_workerUrl() + path, opts);
      return res.json();
    } catch(e) {
      return { error: e.message };
    }
  }

  async function _db(action, table, data, filters) {
    if (_sbAuthFailed) throw new Error('Non authentifié');
    var s = _session();
    if (!s || !s.tenantId) throw new Error('Session invalide');

    var res;
    try {
      res = await fetch(_workerUrl() + '/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table, tenantId: s.tenantId, userId: s.userId || null, sessionToken: s.sessionToken || null, data: data || null, filters: filters || null })
      });
    } catch(e) {
      throw e;
    }

    var json = await res.json();
    if (!res.ok) {
      if (res.status === 401 && json.error === 'Session invalide') {
        _markAuthFailed();
      }
      throw new Error(json.error || 'Erreur DB');
    }
    return json.data || [];
  }

  async function select(table, filters)     { return _db('select', table, null, filters); }
  async function upsert(table, data)        { return _db('upsert', table, data); }
  async function insert(table, data)        { return _db('insert', table, data); }
  async function update(table, id, data)    { return _db('update', table, data, { id }); }
  async function remove(table, id)          { return _db('delete', table, null, { id }); }

  // Sync bulk — max 3 requêtes parallèles (règle CDC)
  async function syncAll(immeubles, locataires, paiements) {
    var tasks = [];
    if (immeubles  && immeubles.length)  tasks.push(upsert('immeubles',  immeubles));
    if (locataires && locataires.length) tasks.push(upsert('locataires', locataires));
    if (paiements  && paiements.length)  tasks.push(upsert('paiements',  paiements));
    return tasks.length ? Promise.all(tasks) : Promise.resolve();
  }

  async function loadAll() {
    var [im, lo, pa] = await Promise.all([
      select('immeubles').catch(function() { return []; }),
      select('locataires').catch(function() { return []; }),
      select('paiements').catch(function() { return []; })
    ]);
    return { immeubles: im, locataires: lo, paiements: pa };
  }

  // ── Upload photo via Worker (clé Supabase gérée côté serveur) ─
  async function uploadPhoto(file, folder) {
    var s = _session();
    if (!s) throw new Error('Non authentifié');
    var ext  = file.name.split('.').pop().toLowerCase() || 'jpg';
    var name = (folder || 'annonces') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
    var fd = new FormData();
    fd.append('file', file);
    fd.append('path', name);
    fd.append('tenantId', s.tenantId);
    var res = await fetch(_workerUrl() + '/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.error || 'Erreur upload photo');
    }
    var d = await res.json();
    return d.url;
  }

  return { select, upsert, insert, update, remove, syncAll, loadAll, workerCall, resetAuth, _db, uploadPhoto };

})();

// Compat v1
var WORKER_URL = (window.IG.config && window.IG.config.workerUrl) || 'https://immogest1.fofefranklin57.workers.dev';
