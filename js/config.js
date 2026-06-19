// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Configuration globale
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.config = {
  appName:     'ImmoGest',
  appTagline:  'Gestion immobilière intelligente',
  version:     '2.0.0',
  workerUrl:   'https://immogest1.fofefranklin57.workers.dev',
  oneSignalAppId: '8a3857ab-64cc-4a62-9916-ce46b4768dac',
  monetagMeta: 'd9b7d2935fbcb3e568288a4ff0852e32',
  fapshi: {
    apikey:   'FAK_cbc4bca6ea0ddf6e23d57ab438b93a4a',
    apiuser:  'fofefranklin57@gmail.com',
    baseUrl:  'https://live.fapshi.com'
  },

  primaryColor:'#0E6AAF',
  modules: {
    locatif:     true,
    juridique:   true,
    marketplace: true,
    cabinet:     false,
    ia:          true
  },
  plans: {
    gratuit:  { immeubles: 1,  locataires: 10,  utilisateurs: 1,  label: 'Gratuit', prix: 0 },
    trial:    { immeubles: -1, locataires: -1,  utilisateurs: -1, label: 'Essai',   prix: 0 },
    starter:  { immeubles: 10, locataires: 300, utilisateurs: 5,  label: 'Starter', prix: 10000 },
    pro:      { immeubles: 50, locataires: -1,  utilisateurs: 15, label: 'Pro',     prix: 15000 },
    cabinet:  { immeubles: -1, locataires: -1,  utilisateurs: -1, label: 'Cabinet', prix: 30000 }
  }
};

// Configuration centrale — toutes les URLs passent par ici
// Migration future : changer ces 3 valeurs suffit pour basculer sur domaine custom
window.APP_CONFIG = {
  APP_URL:         'https://immogest-34w.pages.dev',
  API_URL:         'https://immogest1.fofefranklin57.workers.dev',
  MARKETPLACE_URL: 'https://immogest1.fofefranklin57.workers.dev'
};

// Alias global pour compatibilité v1
var WORKER_URL = window.APP_CONFIG.API_URL;
window.IG.config.workerUrl = window.APP_CONFIG.API_URL;
