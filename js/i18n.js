// ════════════════════════════════════════════════════════════════
//  ImmoGest — Système de traduction (i18n)
//  t('texte français') → traduction selon la langue active
//  Fallback : texte français si traduction manquante
// ════════════════════════════════════════════════════════════════

var LANG = (function() {
  var saved = localStorage.getItem('immogest_lang');
  if (saved && ['fr', 'en'].includes(saved)) return saved;
  var browser = (navigator.language || navigator.userLanguage || 'fr').split('-')[0].toLowerCase();
  return ['fr', 'en'].includes(browser) ? browser : 'fr';
})();

var MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function tMois(idx) {
  if (LANG === 'fr') return MONTHS_FR[idx];
  return MONTHS_EN[idx];
}

var TR = { en: {

  // ── Sections navigation ──────────────────────────────────────
  'Principal': 'Main',
  'Immeubles': 'Buildings',
  'Gestion': 'Management',
  'Administration': 'Administration',
  'Comptabilité': 'Accounting',

  // ── Items navigation ─────────────────────────────────────────
  'Tableau de bord': 'Dashboard',
  'Encaissements': 'Payments',
  'Relances': 'Reminders',
  'Rapports': 'Reports',
  'Statistiques': 'Statistics',
  'Messagerie': 'Messaging',
  'Rapport annuel': 'Annual Report',
  'Bibliothèque juridique': 'Legal Library',
  'Locataires': 'Tenants',
  'Maintenance & EDL': 'Maintenance & Inspections',
  'Gérer les immeubles': 'Manage Buildings',
  'Paramètres': 'Settings',
  'Utilisateurs': 'Users',
  'Mon espace': 'My Space',
  'Signalements': 'Issues',
  'Valider paiements': 'Validate Payments',
  'Archives': 'Archives',
  'Corbeille': 'Trash',

  // ── Titres de pages ──────────────────────────────────────────
  'Relances & Alertes': 'Reminders & Alerts',
  'Rapport Annuel': 'Annual Report',
  'Gestion des utilisateurs': 'User Management',
  'Validation des paiements': 'Payment Validation',
  'Maintenance & État des lieux': 'Maintenance & Inspections',
  'Mes Statistiques': 'My Statistics',
  'Configuration des immeubles': 'Building Configuration',
  'Mon espace': 'My Space',

  // ── Sous-titres ──────────────────────────────────────────────
  'Sélectionnez un immeuble': 'Select a building',
  'Échanges internes': 'Internal Messages',
  'Dossiers permanents — locataires libérés, immeubles retirés, historiques': 'Permanent files — released tenants, removed buildings, history',
  'Textes de loi — droit immobilier camerounais': 'Legal texts — Cameroonian real estate law',
  'Locataires supprimés — restauration possible sous 30 jours': 'Deleted tenants — can be restored within 30 days',
  'Configuration Mobile Money': 'Mobile Money Configuration',
  'Analyses par immeuble': 'Analysis by building',
  'Revenus & occupation': 'Revenue & occupancy',
  'Chargement...': 'Loading...',
  'Paiements déclarés par les locataires et propriétaires': 'Payments declared by tenants and owners',
  "Documents générés automatiquement à partir de 2 mois d'arriérés": 'Documents generated automatically from 2+ months of arrears',
  'locataires actifs': 'active tenants',
  'immeubles': 'buildings',
  'renseignés': 'registered',
  'versement(s)': 'payment(s)',
  'à jour': 'up to date',
  'libre(s)': 'vacant',
  'signalement(s)': 'issue(s)',
  'nouveau(x)': 'new',

  // ── Boutons principaux ───────────────────────────────────────
  '＋ Paiement': '+ Payment',
  '＋ Locataire': '+ Tenant',
  '＋ Immeuble': '+ Building',
  '+ Locataire': '+ Tenant',
  '+ Paiement manuel': '+ Manual Payment',
  '📄 PDF Synthèse globale': '📄 Global Summary PDF',
  '📊 Télécharger DOCX': '📊 Download DOCX',
  '📅 Générer': '📅 Generate',
  '📄 Exporter': '📄 Export',
  '🌙 Mode sombre': '🌙 Dark mode',
  '☀️ Mode clair': '☀️ Light mode',

  // ── Métriques dashboard ──────────────────────────────────────
  'Locataires actifs': 'Active tenants',
  'Loyers / mois': 'Rent / month',
  'Impayés cumulés': 'Outstanding balance',
  'attendu total': 'total expected',

  // ── Statuts ──────────────────────────────────────────────────
  'payé': 'paid',
  'impayé': 'unpaid',
  'libre': 'vacant',
  'Payé': 'Paid',
  'Impayé': 'Unpaid',
  'Libre': 'Vacant',

  // ── Actions communes ─────────────────────────────────────────
  'Ajouter': 'Add',
  'Modifier': 'Edit',
  'Supprimer': 'Delete',
  'Enregistrer': 'Save',
  'Annuler': 'Cancel',
  'Fermer': 'Close',
  'Confirmer': 'Confirm',
  'Rechercher': 'Search',
  'Exporter': 'Export',
  'Importer': 'Import',

  // ── Champs de formulaire ─────────────────────────────────────
  'Nom': 'Name',
  'Prénom': 'First name',
  'Téléphone': 'Phone',
  'WhatsApp': 'WhatsApp',
  'Loyer': 'Rent',
  'Caution': 'Deposit',
  'Observations': 'Notes',
  'Montant': 'Amount',
  'Date': 'Date',
  'Mode de paiement': 'Payment method',
  'Espèces': 'Cash',
  'Virement': 'Bank transfer',
  'Mois': 'Month',
  'Année': 'Year',
  'Total': 'Total',
  'Actions': 'Actions',
  'Statut': 'Status',
  'Local': 'Unit',
  'Appartement': 'Apartment',
  'Studio': 'Studio',
  'Chambre': 'Room',
  'Entrée': 'Move-in',
  'Sortie': 'Move-out',
  'Solde': 'Balance',
  'Arriérés': 'Arrears',
  'Note': 'Note',
  'Référence': 'Reference',
  'Type': 'Type',
  'Ville': 'City',
  'Quartier': 'District',

  // ── Entêtes tableaux ─────────────────────────────────────────
  'Locataire': 'Tenant',
  'Propriétaire': 'Owner',
  'Immeuble': 'Building',
  'Local / Appt': 'Unit / Apt',
  'Loyer mensuel': 'Monthly rent',
  'Reste dû': 'Balance due',
  'Date d\'entrée': 'Move-in date',

  // ── Toast / messages système ─────────────────────────────────
  'Chargement des données...': 'Loading data...',
  'Données locales (Supabase indisponible)': 'Local data (offline mode)',
  'Données synchronisées avec Supabase ✓': 'Data synced ✓',
  'Synchronisation en cours...': 'Syncing...',
  'Sauvegarde': 'Saved',

  // ── Confirmer / alertes ──────────────────────────────────────
  'Supprimer cet immeuble ?': 'Delete this building?',
  'Supprimer ce locataire ?': 'Delete this tenant?',
  'Supprimer cet utilisateur ?': 'Delete this user?',

  // ── Portail locataire ────────────────────────────────────────
  'Mon tableau de bord': 'My Dashboard',
  'Mes paiements': 'My Payments',
  'Ma fiche': 'My Profile',
  'Mes demandes': 'My Requests',
  'Messages': 'Messages',
  'Déclarer un paiement': 'Declare a Payment',
  'Mes déclarations': 'My Declarations',
  'Historique complet': 'Full History',
  'Situation locative': 'Rental Status',
  'Loyer mensuel': 'Monthly rent',
  'Solde dû': 'Balance due',
  'À jour': 'Up to date',
  'En attente': 'Pending',
  'Validé': 'Validated',
  'Rejeté': 'Rejected',
  'Aucun paiement enregistré': 'No payments recorded',
  'Envoyer': 'Send',
  'Votre message...': 'Your message...',

  // ── Portail propriétaire ─────────────────────────────────────
  'Mes immeubles': 'My Buildings',
  'Mes locataires': 'My Tenants',
  'Résumé financier': 'Financial Summary',
  'Revenus attendus': 'Expected revenue',
  'Encaissé ce mois': 'Collected this month',
  'Impayés total': 'Total outstanding',
  'Taux d\'occupation': 'Occupancy rate',
  'Locaux occupés': 'Occupied units',
  'Locaux libres': 'Vacant units',

  // ── Abonnements ──────────────────────────────────────────────
  'Gratuit': 'Free',
  'Plan actuel': 'Current plan',
  'Choisir': 'Choose',
  'par mois': 'per month',
  'Souscrire': 'Subscribe',

} }; // fin TR.en


// ── Fonction principale ──────────────────────────────────────────
function t(key) {
  if (key === null || key === undefined) return '';
  var k = String(key);
  if (LANG === 'fr') return k;
  var val = TR.en[k];
  return (val !== undefined) ? val : k;
}

// ── Appliquer les traductions aux éléments data-i18n ────────────
function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
}

// ── Changer la langue ────────────────────────────────────────────
function setLang(lang) {
  if (!['fr', 'en'].includes(lang)) return;
  LANG = lang;
  localStorage.setItem('immogest_lang', lang);
  applyStaticI18n();
  // Mettre à jour le bouton langue
  var btn = document.getElementById('btn-lang-toggle');
  if (btn) btn.textContent = LANG === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR';
  // Mettre à jour le bouton thème
  var themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    var isDark = document.body.classList.contains('dark');
    themeBtn.textContent = isDark ? t('☀️ Mode clair') : t('🌙 Mode sombre');
  }
  // Re-render la page courante
  if (typeof renderCurrent === 'function') renderCurrent();
}
