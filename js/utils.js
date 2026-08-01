// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Utilitaires
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.utils = (function() {

  // ── Formatage monnaie ────────────────────────────────────────
  function formatMontant(n, devise) {
    if (n === null || n === undefined || n === '') return '—';
    var d = devise || (window.IG._locale && window.IG._locale.devise) || 'XAF';
    var num = parseFloat(n) || 0;
    var DEVISE_CONFIG = {
      XAF: { suffix: ' FCFA', locale: 'fr-FR' },
      XOF: { suffix: ' FCFA', locale: 'fr-FR' },
      CFA: { suffix: ' FCFA', locale: 'fr-FR' },
      EUR: { suffix: ' €',    locale: 'fr-FR' },
      USD: { suffix: ' $',    locale: 'en-US' },
      GBP: { suffix: ' £',    locale: 'en-GB' },
      NGN: { suffix: ' ₦',    locale: 'en-NG' },
      GHS: { suffix: ' ₵',    locale: 'en-GH' },
      KES: { suffix: ' KSh',  locale: 'sw-KE' },
      MAD: { suffix: ' DH',   locale: 'fr-MA' },
      TND: { suffix: ' TND',  locale: 'fr-TN' },
      EGP: { suffix: ' ج.م',  locale: 'ar-EG' },
    };
    var cfg = DEVISE_CONFIG[d] || { suffix: ' ' + d, locale: 'fr-FR' };
    return num.toLocaleString(cfg.locale) + cfg.suffix;
  }

  // ── Formatage date ───────────────────────────────────────────
  function formatDate(d) {
    if (!d) return '—';
    try {
      var dt = new Date(d);
      if (isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch(e) { return d; }
  }

  function formatDateLong(d) {
    if (!d) return '—';
    try {
      var dt = new Date(d);
      return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch(e) { return d; }
  }

  // ── Nom du mois ──────────────────────────────────────────────
  var MOIS_FR = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  function nomMois(m) { return MOIS_FR[parseInt(m)] || ''; }

  function formatPeriode(mois, annee) {
    return nomMois(mois) + ' ' + annee;
  }

  // ── Hash SHA-256 ─────────────────────────────────────────────
  async function sha256(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  // ── Toast notifications ──────────────────────────────────────
  var _toastTimer = null;

  function showToast(msg, type) {
    var t = document.getElementById('ig-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ig-toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);padding:12px 22px;' +
        'border-radius:10px;font-size:13px;font-weight:600;z-index:99999;max-width:90%;text-align:center;' +
        'box-shadow:0 4px 20px rgba(0,0,0,.18);transition:opacity .3s;pointer-events:none;';
      document.body.appendChild(t);
    }
    var colors = {
      green: { bg:'#0E7A45', color:'#fff' },
      red:   { bg:'#B93020', color:'#fff' },
      orange:{ bg:'#8B4A00', color:'#fff' },
      blue:  { bg:'#0E6AAF', color:'#fff' },
      info:  { bg:'#0E6AAF', color:'#fff' }
    };
    var c = colors[type] || colors.blue;
    t.style.background = c.bg;
    t.style.color = c.color;
    t.textContent = msg;
    t.style.opacity = '1';
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() { t.style.opacity = '0'; }, 3200);
  }

  // ── Modal simple ─────────────────────────────────────────────
  function showModal(html, opts) {
    opts = opts || {};
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;' +
      'display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px);';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg2,#fff);border-radius:14px;padding:24px;max-width:' +
      (opts.width || '480px') + ';width:100%;max-height:90dvh;overflow-y:auto;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.25);position:relative;';
    box.innerHTML = html;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    function close() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    box.querySelectorAll('[data-modal-close]').forEach(function(btn) {
      btn.addEventListener('click', close);
    });
    return { close, overlay, box };
  }

  // ── Confirmation ─────────────────────────────────────────────
  function confirm(msg, onOk, onCancel) {
    var t = window.IG.i18n ? window.IG.i18n.t : function(k){return k;};
    var modal = showModal(
      '<div style="text-align:center">' +
      '<div style="font-size:32px;margin-bottom:12px">⚠️</div>' +
      '<p style="font-size:15px;margin-bottom:20px;color:var(--text)">' + msg + '</p>' +
      '<div style="display:flex;gap:10px;justify-content:center">' +
      '<button data-modal-close class="btn-secondary" style="padding:10px 20px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);cursor:pointer;font-size:13px">' + t('Annuler') + '</button>' +
      '<button id="ig-confirm-ok" class="btn-danger" style="padding:10px 20px;border-radius:8px;border:none;background:#B93020;color:#fff;cursor:pointer;font-size:13px;font-weight:600">' + t('Confirmer') + '</button>' +
      '</div></div>'
    );
    var okBtn = modal.box.querySelector('#ig-confirm-ok');
    if (okBtn) okBtn.addEventListener('click', function() {
      modal.close();
      if (onOk) onOk();
    });
  }

  // ── ID unique ─────────────────────────────────────────────────
  function uid() {
    return Date.now() + Math.floor(Math.random() * 10000);
  }

  // ── Escape HTML ───────────────────────────────────────────────
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ── Mois depuis entrée ────────────────────────────────────────
  function getMoisDepuisEntree(entree) {
    if (!entree) return [];
    var debut = new Date(entree);
    if (isNaN(debut.getTime())) return [];
    var now = new Date();
    var mois = [];
    var d = new Date(debut.getFullYear(), debut.getMonth(), 1);
    var limit = new Date(now.getFullYear(), now.getMonth(), 1);
    while (d < limit) {
      mois.push({ mois: d.getMonth() + 1, annee: d.getFullYear() });
      d.setMonth(d.getMonth() + 1);
    }
    return mois;
  }

  // ── Debounce ──────────────────────────────────────────────────
  function debounce(fn, delay) {
    var timer;
    return function() {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(this, args); }, delay);
    };
  }

  // ── Sélecteur indicatif téléphonique ─────────────────────────
  var PAYS_TEL = [
    { code: '+1',   pays: 'USA / Canada',        flag: '🇺🇸', ex: '201 555 0123' },
    { code: '+7',   pays: 'Russie / Kazakhstan',  flag: '🇷🇺', ex: '912 345 67 89' },
    { code: '+20',  pays: 'Egypte',               flag: '🇪🇬', ex: '100 123 4567' },
    { code: '+27',  pays: 'Afrique du Sud',        flag: '🇿🇦', ex: '71 234 5678' },
    { code: '+30',  pays: 'Grèce',                flag: '🇬🇷', ex: '691 234 5678' },
    { code: '+31',  pays: 'Pays-Bas',             flag: '🇳🇱', ex: '6 12345678' },
    { code: '+32',  pays: 'Belgique',             flag: '🇧🇪', ex: '470 12 34 56' },
    { code: '+33',  pays: 'France',               flag: '🇫🇷', ex: '6 12 34 56 78' },
    { code: '+34',  pays: 'Espagne',              flag: '🇪🇸', ex: '612 34 56 78' },
    { code: '+39',  pays: 'Italie',               flag: '🇮🇹', ex: '312 345 6789' },
    { code: '+41',  pays: 'Suisse',               flag: '🇨🇭', ex: '78 123 45 67' },
    { code: '+44',  pays: 'Royaume-Uni',          flag: '🇬🇧', ex: '7911 123456' },
    { code: '+49',  pays: 'Allemagne',            flag: '🇩🇪', ex: '151 23456789' },
    { code: '+55',  pays: 'Brésil',               flag: '🇧🇷', ex: '11 91234 5678' },
    { code: '+57',  pays: 'Colombie',             flag: '🇨🇴', ex: '321 234 5678' },
    { code: '+58',  pays: 'Venezuela',            flag: '🇻🇪', ex: '412 123 4567' },
    { code: '+60',  pays: 'Malaisie',             flag: '🇲🇾', ex: '12 345 6789' },
    { code: '+62',  pays: 'Indonésie',            flag: '🇮🇩', ex: '812 345 678' },
    { code: '+63',  pays: 'Philippines',          flag: '🇵🇭', ex: '917 123 4567' },
    { code: '+66',  pays: 'Thaïlande',            flag: '🇹🇭', ex: '81 234 5678' },
    { code: '+81',  pays: 'Japon',                flag: '🇯🇵', ex: '90 1234 5678' },
    { code: '+82',  pays: 'Corée du Sud',         flag: '🇰🇷', ex: '10 1234 5678' },
    { code: '+84',  pays: 'Vietnam',              flag: '🇻🇳', ex: '91 234 56 78' },
    { code: '+86',  pays: 'Chine',                flag: '🇨🇳', ex: '138 0013 8000' },
    { code: '+90',  pays: 'Turquie',              flag: '🇹🇷', ex: '532 123 45 67' },
    { code: '+91',  pays: 'Inde',                 flag: '🇮🇳', ex: '98765 43210' },
    { code: '+92',  pays: 'Pakistan',             flag: '🇵🇰', ex: '300 1234567' },
    { code: '+212', pays: 'Maroc',                flag: '🇲🇦', ex: '612 345678' },
    { code: '+213', pays: 'Algérie',              flag: '🇩🇿', ex: '551 23 45 67' },
    { code: '+216', pays: 'Tunisie',              flag: '🇹🇳', ex: '20 123 456' },
    { code: '+221', pays: 'Sénégal',              flag: '🇸🇳', ex: '77 123 45 67' },
    { code: '+225', pays: "Côte d'Ivoire",        flag: '🇨🇮', ex: '07 12 34 56 78' },
    { code: '+226', pays: 'Burkina Faso',         flag: '🇧🇫', ex: '70 12 34 56' },
    { code: '+227', pays: 'Niger',                flag: '🇳🇪', ex: '90 12 34 56' },
    { code: '+228', pays: 'Togo',                 flag: '🇹🇬', ex: '90 12 34 56' },
    { code: '+229', pays: 'Bénin',                flag: '🇧🇯', ex: '90 12 34 56' },
    { code: '+233', pays: 'Ghana',                flag: '🇬🇭', ex: '23 123 4567' },
    { code: '+234', pays: 'Nigeria',              flag: '🇳🇬', ex: '802 123 4567' },
    { code: '+235', pays: 'Tchad',                flag: '🇹🇩', ex: '63 12 34 56' },
    { code: '+236', pays: 'Centrafrique',         flag: '🇨🇫', ex: '70 12 34 56' },
    { code: '+237', pays: 'Cameroun',             flag: '🇨🇲', ex: '6XX XX XX XX' },
    { code: '+241', pays: 'Gabon',                flag: '🇬🇦', ex: '06 12 34 56' },
    { code: '+242', pays: 'Congo',                flag: '🇨🇬', ex: '06 123 4567' },
    { code: '+243', pays: 'RD Congo',             flag: '🇨🇩', ex: '81 234 5678' },
    { code: '+244', pays: 'Angola',               flag: '🇦🇴', ex: '923 123 456' },
    { code: '+245', pays: 'Guinée-Bissau',        flag: '🇬🇼', ex: '955 123 456' },
    { code: '+248', pays: 'Seychelles',           flag: '🇸🇨', ex: '2 510 123' },
    { code: '+249', pays: 'Soudan',               flag: '🇸🇩', ex: '91 123 4567' },
    { code: '+251', pays: 'Éthiopie',             flag: '🇪🇹', ex: '91 123 4567' },
    { code: '+254', pays: 'Kenya',                flag: '🇰🇪', ex: '712 345678' },
    { code: '+255', pays: 'Tanzanie',             flag: '🇹🇿', ex: '621 234 567' },
    { code: '+256', pays: 'Ouganda',              flag: '🇺🇬', ex: '712 345678' },
    { code: '+257', pays: 'Burundi',              flag: '🇧🇮', ex: '79 12 34 56' },
    { code: '+258', pays: 'Mozambique',           flag: '🇲🇿', ex: '82 123 4567' },
    { code: '+260', pays: 'Zambie',               flag: '🇿🇲', ex: '95 1234567' },
    { code: '+261', pays: 'Madagascar',           flag: '🇲🇬', ex: '32 12 345 67' },
    { code: '+263', pays: 'Zimbabwe',             flag: '🇿🇼', ex: '71 234 5678' },
    { code: '+264', pays: 'Namibie',              flag: '🇳🇦', ex: '81 123 4567' },
    { code: '+265', pays: 'Malawi',               flag: '🇲🇼', ex: '99 123 4567' },
    { code: '+266', pays: 'Lesotho',              flag: '🇱🇸', ex: '5812 3456' },
    { code: '+267', pays: 'Botswana',             flag: '🇧🇼', ex: '71 123 456' },
    { code: '+269', pays: 'Comores',              flag: '🇰🇲', ex: '321 23 45' },
    { code: '+350', pays: 'Gibraltar',            flag: '🇬🇮', ex: '200 12345' },
    { code: '+351', pays: 'Portugal',             flag: '🇵🇹', ex: '912 345 678' },
    { code: '+352', pays: 'Luxembourg',           flag: '🇱🇺', ex: '621 123 456' },
    { code: '+353', pays: 'Irlande',              flag: '🇮🇪', ex: '85 123 4567' },
    { code: '+356', pays: 'Malte',                flag: '🇲🇹', ex: '9912 3456' },
    { code: '+358', pays: 'Finlande',             flag: '🇫🇮', ex: '41 234 5678' },
    { code: '+420', pays: 'Tchéquie',             flag: '🇨🇿', ex: '601 123 456' },
    { code: '+966', pays: 'Arabie Saoudite',      flag: '🇸🇦', ex: '50 123 4567' },
    { code: '+971', pays: 'Émirats Arabes Unis',  flag: '🇦🇪', ex: '50 123 4567' },
    { code: '+972', pays: 'Israël',               flag: '🇮🇱', ex: '50 123 4567' },
  ];

  // Retourne le HTML d'un champ téléphone avec sélecteur d'indicatif
  // id: identifiant de base (génère id + '_code' et id + '_num')
  function phoneField(id, label, value, required) {
    // Séparer l'indicatif du numéro si value contient déjà +xxx
    var selCode = '+237', numVal = value || '';
    if (value && value.startsWith('+')) {
      var m = value.match(/^(\+\d{1,4})\s*(.*)$/);
      if (m) { selCode = m[1]; numVal = m[2]; }
    }
    var exByCode = {};
    var opts = PAYS_TEL.slice().sort(function(a, b) { return a.pays.localeCompare(b.pays, 'fr'); }).map(function(p) {
      exByCode[p.code] = p.ex || '6XX XX XX XX';
      return '<option value="' + p.code + '"' + (p.code === selCode ? ' selected' : '') + '>' +
        p.flag + ' ' + p.code + ' — ' + p.pays + '</option>';
    }).join('');
    var exInit = exByCode[selCode] || '6XX XX XX XX';
    return '<div style="margin-bottom:12px">' +
      (label ? '<label style="font-size:12px;color:var(--text2);font-weight:600;display:block;margin-bottom:4px">' + label + (required ? ' *' : '') + '</label>' : '') +
      '<div style="display:flex;gap:6px">' +
        '<select id="' + id + '_code" style="flex-shrink:0;width:auto;max-width:160px;padding:9px 8px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:12px;color:var(--text);font-family:var(--font)">' +
          opts +
        '</select>' +
        '<input type="tel" id="' + id + '_num" value="' + esc(numVal) + '"' +
        (required ? ' required' : '') +
        ' placeholder="' + esc(exInit) + '" style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--border2);background:var(--bg4);font-size:13px;color:var(--text)">' +
      '</div>' +
      '<input type="hidden" id="' + id + '" name="' + id + '">' +
    '</div>' +
    '<script>void function(){' +
      'var EX_' + id + '=' + JSON.stringify(exByCode) + ';' +
      'function _sync_' + id + '(){' +
        'var c=document.getElementById("' + id + '_code");' +
        'var n=document.getElementById("' + id + '_num");' +
        'var h=document.getElementById("' + id + '");' +
        'if(n&&c)n.placeholder=EX_' + id + '[c.value]||"6XX XX XX XX";' +
        'if(c&&n&&h)h.value=(c.value+" "+n.value.replace(/^0+/,"")).trim();}' +
      'var c=document.getElementById("' + id + '_code");' +
      'var n=document.getElementById("' + id + '_num");' +
      'if(c)c.addEventListener("change",_sync_' + id + ');' +
      'if(n)n.addEventListener("input",_sync_' + id + ');' +
      '_sync_' + id + '();' +
    '}()<\/script>';
  }

  // Lire la valeur complète d'un phoneField (indicatif + numéro)
  function phoneFieldValue(id) {
    var codeEl = document.getElementById(id + '_code');
    var numEl  = document.getElementById(id + '_num');
    if (!codeEl || !numEl) return document.getElementById(id) ? document.getElementById(id).value : '';
    var num = numEl.value.trim().replace(/^0+/, '');
    return num ? (codeEl.value + ' ' + num) : '';
  }

  return {
    formatMontant, formatDate, formatDateLong, nomMois, formatPeriode,
    sha256, showToast, showModal, confirm, uid, esc, getMoisDepuisEntree, debounce,
    phoneField, phoneFieldValue, PAYS_TEL
  };

})();

// Alias globaux pour compatibilité v1
var showToast = window.IG.utils.showToast.bind(window.IG.utils);
var formatMontant = window.IG.utils.formatMontant.bind(window.IG.utils);
var showModal = window.IG.utils.showModal.bind(window.IG.utils);
var esc = window.IG.utils.esc.bind(window.IG.utils);
