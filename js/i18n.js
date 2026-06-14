// ════════════════════════════════════════════════════════════════
//  ImmoGest v2 — i18n (PREMIER FICHIER)
//  window.IG.i18n — langues : fr (défaut), en, pt, es, ha, ar
// ════════════════════════════════════════════════════════════════

window.IG = window.IG || {};

window.IG.i18n = (function() {

  var lang = (function() {
    var s = localStorage.getItem('immogest_lang');
    if (s) return s;
    var b = (navigator.language || 'fr').split('-')[0].toLowerCase();
    return ['fr','en','pt','es','ha','ar'].includes(b) ? b : 'fr';
  })();

  var MOIS_FR = ['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  var T = {
    en: {
      // Navigation
      'Tableau de bord': 'Dashboard',
      'Immeubles': 'Buildings',
      'Locataires': 'Tenants',
      'Paiements': 'Payments',
      'Rapports': 'Reports',
      'Paramètres': 'Settings',
      'Principal': 'Main',
      'Gestion': 'Management',
      'Administration': 'Administration',

      // Auth
      'Connexion': 'Login',
      'Créer un compte': 'Create account',
      'Votre nom complet': 'Your full name',
      'Nom du cabinet (optionnel)': 'Agency name (optional)',
      'Téléphone': 'Phone',
      'Mot de passe': 'Password',
      'Min. 6 caractères': 'Min. 6 characters',
      'Se connecter': 'Sign in',
      'Créer mon compte': 'Create my account',
      'Se déconnecter': 'Sign out',

      // Dashboard
      'Bonjour': 'Hello',
      'Actions rapides': 'Quick actions',
      'Immeuble': 'Building',
      'Locataire': 'Tenant',
      'Paiement': 'Payment',
      'Rapport': 'Report',
      'Immeubles actifs': 'Active buildings',
      'Locataires actifs': 'Active tenants',
      'À jour': 'Up to date',
      'Impayés': 'Unpaid',
      'Recettes mois': 'Monthly income',
      'Impayés ce mois': 'Unpaid this month',
      'Voir tout': 'See all',
      'actifs': 'active',

      // Immeubles
      'Mes immeubles': 'My buildings',
      'Ajouter': 'Add',
      'Ajouter un immeuble': 'Add a building',
      'Modifier immeuble': 'Edit building',
      'Nom immeuble': 'Building name',
      'Propriétaire': 'Owner',
      'Tél propriétaire': 'Owner phone',
      'Ville': 'City',
      'Quartier': 'District',
      'Apparts': 'Apts',
      'Studios': 'Studios',
      'Chambres': 'Rooms',
      'Duplex': 'Duplex',
      'Couleur': 'Color',
      'Détails': 'Details',
      'Modifier': 'Edit',
      'Sauvegarder': 'Save',
      'Annuler': 'Cancel',
      'Aucun immeuble': 'No buildings',
      'Cliquez sur le bouton + pour ajouter votre premier immeuble': 'Click + to add your first building',
      'Occupés': 'Occupied',
      'Occupation': 'Occupancy',

      // Locataires
      'Ajouter un locataire': 'Add a tenant',
      'Modifier locataire': 'Edit tenant',
      'Nom complet': 'Full name',
      'WhatsApp': 'WhatsApp',
      'Sélectionner...': 'Select...',
      'Local / Appt': 'Unit',
      'Type': 'Type',
      'Loyer mensuel (FCFA)': 'Monthly rent (FCFA)',
      'Caution': 'Deposit',
      'Date entrée': 'Entry date',
      'Observations': 'Notes',
      'Libérer': 'Release',
      'Aucun locataire': 'No tenants',
      'Ajoutez votre premier locataire': 'Add your first tenant',
      'Rechercher...': 'Search...',
      'Local': 'Unit',
      'Loyer': 'Rent',
      'Statut': 'Status',
      'Actions': 'Actions',
      'Fiche': 'File',
      'Encaisser': 'Collect',
      'Libre': 'Vacant',
      'Libérer ce locataire ?': 'Release this tenant?',

      // Paiements
      'Enregistrer un paiement': 'Record a payment',
      'Montant (FCFA)': 'Amount (FCFA)',
      'Date paiement': 'Payment date',
      'Mois': 'Month',
      'Année': 'Year',
      'Mode paiement': 'Payment method',
      'Note (optionnel)': 'Note (optional)',
      'Enregistrer': 'Save',
      'Période': 'Period',
      'Versement(s)': 'Payment(s)',
      'Reste': 'Balance',
      'Payé': 'Paid',
      'Partiel': 'Partial',
      'Impayé': 'Unpaid',
      'Historique versements': 'Payment history',
      'Supprimer': 'Delete',
      'Paiement enregistré': 'Payment saved',
      'Paiement supprimé': 'Payment deleted',
      'Aucun paiement ce mois': 'No payments this month',
      'Mode': 'Method',
      'Date': 'Date',
      'espèces': 'cash',
      'virement': 'transfer',
      'mobile money': 'mobile money',

      // Rapports
      'Rapport mensuel': 'Monthly report',
      'Rapport annuel': 'Annual report',
      'Encaissements et impayés du mois en cours': 'Collections and unpaid for current month',
      'Générer': 'Generate',
      'Fermer': 'Close',

      // Commun
      'Erreur': 'Error',
      'Confirmer': 'Confirm',
      'Chargement...': 'Loading...',
      'Pas encore de données': 'No data yet',
      'Locataire sauvegardé': 'Tenant saved',
      'Immeuble sauvegardé': 'Building saved',
      'Locataire libéré et archivé': 'Tenant released and archived',
      'Locataire supprimé': 'Tenant deleted',
      'Locataire introuvable': 'Tenant not found',
      'Non authentifié — réessayez dans quelques secondes': 'Not authenticated — retry in a few seconds',

      // Paramètres
      'Mon compte': 'My account',
      'Nom': 'Name',
      'Cabinet': 'Agency',
      'Plan': 'Plan',
      'Langue': 'Language',
      'Actualiser': 'Refresh',
      'Déconnexion': 'Sign out',

      // Mois
      'Janvier': 'January', 'Février': 'February', 'Mars': 'March',
      'Avril': 'April', 'Mai': 'May', 'Juin': 'June',
      'Juillet': 'July', 'Août': 'August', 'Septembre': 'September',
      'Octobre': 'October', 'Novembre': 'November', 'Décembre': 'December',

      // Statut juridique
      'normal': 'normal', 'retard': 'late', 'misEnDemeure': 'formal notice',
    },

    pt: {
      'Tableau de bord': 'Painel',
      'Immeubles': 'Edifícios',
      'Locataires': 'Inquilinos',
      'Paiements': 'Pagamentos',
      'Rapports': 'Relatórios',
      'Paramètres': 'Configurações',
      'Connexion': 'Entrar',
      'Se connecter': 'Entrar',
      'Créer un compte': 'Criar conta',
      'Créer mon compte': 'Criar minha conta',
      'Se déconnecter': 'Sair',
      'Bonjour': 'Olá',
      'Actions rapides': 'Ações rápidas',
      'Ajouter': 'Adicionar',
      'Sauvegarder': 'Salvar',
      'Annuler': 'Cancelar',
      'Confirmer': 'Confirmar',
      'Modifier': 'Editar',
      'Supprimer': 'Excluir',
      'Fermer': 'Fechar',
      'Générer': 'Gerar',
    },

    es: {
      'Tableau de bord': 'Panel',
      'Immeubles': 'Edificios',
      'Locataires': 'Inquilinos',
      'Paiements': 'Pagos',
      'Rapports': 'Informes',
      'Paramètres': 'Configuración',
      'Connexion': 'Iniciar sesión',
      'Se connecter': 'Iniciar sesión',
      'Créer un compte': 'Crear cuenta',
      'Créer mon compte': 'Crear mi cuenta',
      'Se déconnecter': 'Cerrar sesión',
      'Bonjour': 'Hola',
      'Ajouter': 'Agregar',
      'Sauvegarder': 'Guardar',
      'Annuler': 'Cancelar',
      'Confirmar': 'Confirmar',
    },

    ha: {
      'Tableau de bord': 'Dashboard',
      'Immeubles': 'Gidaje',
      'Locataires': 'Masu haya',
      'Paiements': 'Biyan kuɗi',
      'Paramètres': 'Saituna',
      'Connexion': 'Shiga',
      'Se connecter': 'Shiga',
      'Se déconnecter': 'Fita',
      'Bonjour': 'Sannu',
      'Ajouter': 'Ƙara',
      'Annuler': 'Soke',
    },

    ar: {
      'Tableau de bord': 'لوحة القيادة',
      'Immeubles': 'المباني',
      'Locataires': 'المستأجرون',
      'Paiements': 'المدفوعات',
      'Rapports': 'التقارير',
      'Paramètres': 'الإعدادات',
      'Connexion': 'تسجيل الدخول',
      'Se connecter': 'دخول',
      'Créer un compte': 'إنشاء حساب',
      'Se déconnecter': 'تسجيل الخروج',
      'Bonjour': 'مرحباً',
      'Ajouter': 'إضافة',
      'Annuler': 'إلغاء',
      'Confirmer': 'تأكيد',
    }
  };

  function translate(key) {
    if (lang === 'fr') return key;
    return (T[lang] && T[lang][key]) || (T.en && T.en[key]) || key;
  }

  function setLang(newLang) {
    lang = newLang;
    localStorage.setItem('immogest_lang', newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = translate(el.dataset.i18n);
    });
  }

  function nomMois(idx) { return MOIS_FR[parseInt(idx)] || ''; }

  return {
    t: translate,
    setLang,
    nomMois,
    get lang() { return lang; }
  };

})();

// Alias globaux v1
var t = window.IG.i18n.t.bind(window.IG.i18n);
