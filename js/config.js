// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — Configuration globale
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.config = {
  appName:     'ImmoGest',
  appTagline:  'Gestion immobilière intelligente',
  version:     '2.0.0',
  workerUrl:   'https://immogest1.fofefranklin57.workers.dev',
  supabaseUrl: 'https://uggxfmwpttfsfcirmeqx.supabase.co',
  supabaseAnon:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZ3hmbXdwdHRmc2ZjaXJtZXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNTA4MjIsImV4cCI6MjA5NDYyNjgyMn0.l8iYlJHOt6evNlBQ3zRskZasn_J2BjAUs1l2vKOZNvY',
  oneSignalAppId: '8a3857ab-64cc-4a62-9916-ce46b4768dac',
  monetagMeta: 'd9b7d2935fbcb3e568288a4ff0852e32',
  primaryColor:'#0E6AAF',
  modules: {
    locatif:     true,
    juridique:   true,
    marketplace: true,
    cabinet:     false,
    ia:          true
  },
  plans: {
    gratuit:      { immeubles: 2, locataires: 20, label: 'Gratuit' },
    starter:      { immeubles: 5, locataires: 100, label: 'Starter', prix: 3000 },
    pro:          { immeubles: 20, locataires: 500, label: 'Pro', prix: 10000 },
    cabinet:      { immeubles: -1, locataires: -1, label: 'Cabinet', prix: 25000 }
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
