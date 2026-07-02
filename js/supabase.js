// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Proxy Supabase via Cloudflare Worker
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.db = (function() {

  var _sbAuthFailed = false;
  var _sbFailTimer  = null;
  var _syncing      = false;
  var OFFLINE_TABLES = ['immeubles', 'locataires', 'paiements'];

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

  function _readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch(_) {
      return fallback;
    }
  }

  function _writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch(_) {}
  }

  function _localKey(table, s) {
    return table + '_' + s.tenantId;
  }

  function _queueKey(s) {
    return 'pending_actions_' + s.tenantId;
  }

  function _readLocal(table, s) {
    if (OFFLINE_TABLES.indexOf(table) === -1) return [];
    return _readJSON(_localKey(table, s), []);
  }

  function _writeLocal(table, s, rows) {
    if (OFFLINE_TABLES.indexOf(table) === -1) return;
    _writeJSON(_localKey(table, s), rows || []);
  }

  function _matches(row, filters) {
    if (!filters) return true;
    return Object.keys(filters).every(function(k) {
      return String(row[k]) === String(filters[k]);
    });
  }

  function _applyFilters(rows, filters) {
    return (rows || []).filter(function(row) { return _matches(row, filters); });
  }

  function _normaliseRows(data) {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }

  function _applyLocal(action, table, data, filters, s) {
    if (OFFLINE_TABLES.indexOf(table) === -1) return _normaliseRows(data);
    var list = _readLocal(table, s).slice();
    var rows = _normaliseRows(data);

    if (action === 'insert' || action === 'upsert') {
      rows.forEach(function(row) {
        var idx = list.findIndex(function(x) { return String(x.id) === String(row.id); });
        if (idx >= 0) list[idx] = Object.assign({}, list[idx], row);
        else list.push(row);
      });
      _writeLocal(table, s, list);
      return rows;
    }

    if (action === 'update' || action === 'patch') {
      var updated = [];
      list = list.map(function(row) {
        if (filters && String(row.id) === String(filters.id)) {
          var next = Object.assign({}, row, data || {});
          updated.push(next);
          return next;
        }
        return row;
      });
      _writeLocal(table, s, list);
      return updated;
    }

    if (action === 'delete') {
      list = list.filter(function(row) {
        return !(filters && String(row.id) === String(filters.id));
      });
      _writeLocal(table, s, list);
      return [];
    }

    return _applyFilters(list, filters);
  }

  function _queueAction(action, table, data, filters, s) {
    var q = _readJSON(_queueKey(s), []);
    q.push({
      id: Date.now() + '_' + Math.random().toString(36).slice(2),
      ts: Date.now(),
      action: action,
      table: table,
      data: data || null,
      filters: filters || null
    });
    _writeJSON(_queueKey(s), q);
    _setOfflineIndicator('pending', q.length);
    _registerBackgroundSync();
  }

  function _pendingCount(s) {
    return _readJSON(_queueKey(s), []).length;
  }

  function _setOfflineIndicator(status, count) {
    var el = document.getElementById('sync-indicator');
    if (!el) return;
    if (status === 'pending') {
      el.textContent = '◌ Hors ligne · ' + count + ' attente' + (count > 1 ? 's' : '');
      el.style.color = '#D97706';
    } else if (status === 'syncing') {
      el.textContent = '↻ Sync offline...';
      el.style.color = '#0E6AAF';
    } else if (status === 'ok') {
      el.textContent = '● Synchronisé';
      el.style.color = '#2F855A';
    }
  }

  function _registerBackgroundSync() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then(function(reg) {
      if (reg.sync) reg.sync.register('immogest-sync').catch(function() {});
    }).catch(function() {});
  }

  function _offlineResult(action, table, data, filters, s) {
    var result = _applyLocal(action, table, data, filters, s);
    if (action !== 'select') _queueAction(action, table, data, filters, s);
    return result;
  }

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
    if (!s.sessionToken) throw new Error('Session expirée, reconnectez-vous');

    var res;
    try {
      res = await fetch(_workerUrl() + '/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, table, tenantId: s.tenantId, userId: s.userId || null, sessionToken: s.sessionToken || null, data: data || null, filters: filters || null })
      });
    } catch(e) {
      return action === 'select'
        ? _applyLocal('select', table, null, filters, s)
        : _offlineResult(action, table, data, filters, s);
    }

    var json = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      if (res.status === 503 && json.offline) {
        return action === 'select'
          ? _applyLocal('select', table, null, filters, s)
          : _offlineResult(action, table, data, filters, s);
      }
      if (res.status === 401 && json.error === 'Session invalide') {
        _markAuthFailed();
      }
      throw new Error(json.error || 'Erreur DB');
    }
    var result = json.data || [];
    if (action === 'select' && OFFLINE_TABLES.indexOf(table) !== -1 && !filters) {
      _writeLocal(table, s, result);
    } else if (action !== 'select') {
      _applyLocal(action, table, data, filters, s);
    }
    return result;
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

  async function syncFromLocalStorage() {
    var s = _session();
    if (!s || !s.tenantId || !s.sessionToken || _syncing) return { success: false, synced: 0 };
    var key = _queueKey(s);
    var queue = _readJSON(key, []);
    if (!queue.length) return { success: true, synced: 0 };

    _syncing = true;
    _setOfflineIndicator('syncing', queue.length);
    var remaining = [];
    var synced = 0;

    for (var i = 0; i < queue.length; i++) {
      var item = queue[i];
      try {
        var res = await fetch(_workerUrl() + '/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: item.action,
            table: item.table,
            tenantId: s.tenantId,
            userId: s.userId || null,
            sessionToken: s.sessionToken,
            data: item.data || null,
            filters: item.filters || null
          })
        });
        if (!res.ok) throw new Error('sync failed');
        synced++;
      } catch(e) {
        remaining.push(item);
      }
    }

    _writeJSON(key, remaining);
    if (!remaining.length) {
      try { await loadAll(); } catch(_) {}
      _setOfflineIndicator('ok', 0);
    } else {
      _setOfflineIndicator('pending', remaining.length);
    }
    _syncing = false;
    return { success: remaining.length === 0, synced: synced, pending: remaining.length };
  }

  // ── Upload photo via Worker (clé Supabase gérée côté serveur) ─
  async function uploadPhoto(file, folder) {
    var s = _session();
    if (!s) throw new Error('Non authentifié');
    if (!s.sessionToken) throw new Error('Session expirée, reconnectez-vous');
    var ext  = file.name.split('.').pop().toLowerCase() || 'jpg';
    var name = (folder || 'annonces') + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
    var fd = new FormData();
    fd.append('file', file);
    fd.append('path', name);
    fd.append('tenantId', s.tenantId);
    fd.append('sessionToken', s.sessionToken);
    var res = await fetch(_workerUrl() + '/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      throw new Error(err.error || 'Erreur upload photo');
    }
    var d = await res.json();
    return d.url;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', function() {
      setTimeout(function() { syncFromLocalStorage().catch(function() {}); }, 600);
    });
  }

  return {
    select, upsert, insert, update, remove, syncAll, loadAll, workerCall,
    resetAuth, syncFromLocalStorage, pendingCount: function() {
      var s = _session();
      return s ? _pendingCount(s) : 0;
    },
    _db, uploadPhoto
  };

})();

// Compat v1
var WORKER_URL = (window.IG.config && window.IG.config.workerUrl) || 'https://immogest1.fofefranklin57.workers.dev';
