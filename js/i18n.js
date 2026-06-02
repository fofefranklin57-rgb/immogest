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

  // ── Entêtes tableaux locataires ──────────────────────────────
  'Immeuble': 'Building',
  'Local': 'Unit',
  'Nom': 'Name',
  'Tél': 'Phone',
  'Loyer': 'Rent',
  'Statut': 'Status',
  'Reste dû': 'Balance due',
  'Actions': 'Actions',
  'Aucun locataire': 'No tenants',
  'pour cet immeuble': 'for this building',

  // ── Entêtes tableaux encaissements ───────────────────────────
  'Date versement': 'Payment date',
  'Locataire': 'Tenant',
  'Mois concerné': 'Period',
  'Type': 'Type',
  'Mode': 'Method',
  'Montant': 'Amount',
  'Note': 'Note',
  'Encaissé (loyers)': 'Collected (rent)',
  'Cautions reçues': 'Deposits received',
  'Versements': 'Payments',
  'Aucun paiement enregistré pour': 'No payments recorded for',
  'Détail': 'Detail',

  // ── Types de paiement ────────────────────────────────────────
  'loyer': 'rent',
  'caution': 'deposit',
  'avance': 'advance',
  'espèces': 'cash',
  'virement': 'bank transfer',
  'chèque': 'cheque',
  'mobile money': 'mobile money',

  // ── Actions dans les menus ───────────────────────────────────
  'Paiement': 'Payment',
  'Modifier': 'Edit',
  'Fiche suivi': 'Tracking sheet',
  'Envoyer accès WhatsApp': 'Send WhatsApp access',
  'Supprimer': 'Delete',
  'Quittance': 'Receipt',
  'Voir fiche': 'View profile',
  'Déclarer': 'Declare',

  // ── Titres modales ───────────────────────────────────────────
  '＋ Nouveau locataire': '+ New tenant',
  'Modifier le locataire': 'Edit tenant',
  '＋ Nouveau paiement': '+ New payment',
  '＋ Nouvel immeuble': '+ New building',
  'Modifier l\'immeuble': 'Edit building',
  'Libérer le local': 'Release unit',

  // ── Labels formulaires locataire ─────────────────────────────
  'Immeuble concerné': 'Building',
  'N° Local / Appt': 'Unit No.',
  'Type de local': 'Unit type',
  'Appartement': 'Apartment',
  'Studio': 'Studio',
  'Chambre': 'Room',
  'Boutique': 'Shop',
  'Bureau': 'Office',
  'Loyer mensuel (FCFA)': 'Monthly rent (FCFA)',
  'Arriérés initiaux (FCFA)': 'Initial arrears (FCFA)',
  'Caution versée (FCFA)': 'Deposit paid (FCFA)',
  'Date d\'entrée': 'Move-in date',
  'Téléphone': 'Phone',
  'WhatsApp (si différent)': 'WhatsApp (if different)',
  'Observations': 'Notes',
  'Jour habituel de paiement': 'Usual payment day',
  'Enregistrer': 'Save',
  'Annuler': 'Cancel',

  // ── Labels formulaires paiement ──────────────────────────────
  'Période couverte': 'Period covered',
  'Mode de paiement': 'Payment method',
  'Montant versé (FCFA)': 'Amount paid (FCFA)',
  'Date du versement': 'Payment date',
  'Note / référence': 'Note / reference',
  'Remis au bailleur': 'Paid to landlord',

  // ── Toast / messages système ─────────────────────────────────
  'Chargement des données...': 'Loading data...',
  'Données locales (Supabase indisponible)': 'Local data (offline mode)',
  'Données synchronisées avec Supabase ✓': 'Data synced ✓',
  'Synchronisation en cours...': 'Syncing...',
  'Sauvegarde': 'Saved',
  'Accès refusé': 'Access denied',
  'Accès refusé – modification non autorisée': 'Access denied – not authorized',
  'Accès refusé – enregistrement non autorisé': 'Access denied – not authorized',
  'Locataire, date et montant obligatoires': 'Tenant, date and amount required',
  'Nom et loyer obligatoires': 'Name and rent required',
  'Le nom du locataire est obligatoire': 'Tenant name is required',
  'Le loyer mensuel est obligatoire': 'Monthly rent is required',
  'Paiement enregistré ✓': 'Payment recorded ✓',
  'Locataire modifié ✓': 'Tenant updated ✓',
  'Locataire enregistré ✓': 'Tenant saved ✓',
  'Local libéré et archivé ✓': 'Unit released and archived ✓',
  'Fiche téléchargée ✓': 'File downloaded ✓',
  'PDF généré ✓': 'PDF generated ✓',
  'Rapport téléchargé ✓': 'Report downloaded ✓',
  'Rapport annuel téléchargé ✓': 'Annual report downloaded ✓',
  'Lettre téléchargée ✓': 'Letter downloaded ✓',
  'Plainte téléchargée ✓': 'Complaint downloaded ✓',
  'Sauvegarde exportee !': 'Backup exported!',
  'Importee ! Rechargement...': 'Imported! Reloading...',
  'Fichier invalide': 'Invalid file',
  'Erreur importation': 'Import error',
  'PIN réinitialisé → 0000 ✓': 'PIN reset → 0000 ✓',
  'Infos cabinet enregistrées ✓': 'Agency info saved ✓',
  'Nom mis à jour': 'Name updated',

  // ── Confirmer / alertes ──────────────────────────────────────
  'Supprimer cet immeuble ?': 'Delete this building?',
  'Supprimer ce locataire ?': 'Delete this tenant?',
  'Supprimer cet utilisateur ?': 'Delete this user?',
  'Supprimer ce paiement ?': 'Delete this payment?',
  'Restaurer ce locataire ? Il sera remis dans son local.': 'Restore this tenant? They will be placed back in their unit.',
  'Importer ? Les donnees actuelles seront remplacees.': 'Import? Current data will be replaced.',

  // ── Statuts / badges ─────────────────────────────────────────
  'pending': 'pending',
  'validé': 'validated',
  'rejeté': 'rejected',
  'actif': 'active',
  'suspendu': 'suspended',
  'résolu': 'resolved',
  'en cours': 'in progress',
  'nouveau': 'new',

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

  // ── Modales — formulaire locataire ───────────────────────────
  'Nom complet *': 'Full name *',
  '(si différent du tél)': '(if different from phone)',
  'Immeuble *': 'Building *',
  'N° local (ex: A1, S2)': 'Unit no. (e.g. A1, S2)',
  'Commerce': 'Shop',
  'Loyer mensuel (FCFA) *': 'Monthly rent (FCFA) *',
  'Caution (FCFA)': 'Deposit (FCFA)',
  'Jour de paiement mensuel': 'Monthly payment day',
  'du mois': 'of month',
  'Arriérés (FCFA)': 'Arrears (FCFA)',
  'Mois dus (calcul auto)': 'Months due (auto)',

  // ── Modales — formulaire paiement ────────────────────────────
  '💳 Enregistrer un paiement': '💳 Record a payment',
  '(optionnel — automatique si vide)': '(optional — automatic if empty)',
  'Locataire *': 'Tenant *',
  'Montant versé (FCFA) *': 'Amount paid (FCFA) *',
  'Date du versement *': 'Payment date *',
  'Loyer': 'Rent',
  'Autre': 'Other',
  'Note optionnelle...': 'Optional note...',
  '💰 Remis au bailleur directement': '💰 Paid directly to landlord',

  // ── Modales — formulaire immeuble ────────────────────────────
  'Nom de l\'immeuble *': 'Building name *',
  'Nom du propriétaire *': 'Owner name *',
  'Téléphone propriétaire *': 'Owner phone *',
  'Couleur': 'Color',
  'Commission Cabinet': 'Agency commission',
  'Forfait (FCFA)': 'Fixed (FCFA)',
  'Pourcentage (%)': 'Percentage (%)',

  // ── Page Paramètres ──────────────────────────────────────────
  '🔒 Session expirée. Veuillez vous reconnecter.': '🔒 Session expired. Please reconnect.',
  '👤 Mon compte': '👤 My Account',
  'Mon nom affiché': 'My display name',
  '💾 Enregistrer mon nom': '💾 Save my name',
  '🏢 Identité du Cabinet': '🏢 Agency Identity',
  'Ces informations apparaissent sur tous les documents générés : reçus, contrats, mises en demeure, rapports.': 'This information appears on all generated documents: receipts, contracts, notices, reports.',
  'Nom du cabinet / société *': 'Agency / company name *',
  'Quartier / Adresse': 'District / Address',
  'Téléphone 1': 'Phone 1',
  'Téléphone 2': 'Phone 2',
  'RCCM / N° contribuable': 'Reg. No. / Tax ID',
  'Slogan / Mention (optionnel)': 'Tagline (optional)',
  'URL du logo (optionnel)': 'Logo URL (optional)',
  'Affiché dans l\'en-tête des rapports DOCX. Format PNG ou JPG recommandé.': 'Displayed in DOCX report headers. PNG or JPG recommended.',
  '💾 Enregistrer les infos cabinet': '💾 Save agency info',
  '📱 Numéros Mobile Money du Cabinet': '📱 Agency Mobile Money Numbers',
  'Ces numéros seront affichés aux locataires quand ils souhaitent payer par Mobile Money.': 'These numbers will be shown to tenants when they wish to pay by Mobile Money.',
  '💾 Enregistrer les numéros': '💾 Save numbers',

  // ── Page Utilisateurs ────────────────────────────────────────
  'Accès réservé à l\'administrateur': 'Restricted to administrator',
  'Rôle': 'Role',
  'Identifiant': 'Username',
  'Immeubles assignés': 'Assigned buildings',
  'Tous': 'All',
  'Aucun': 'None',
  '● Actif': '● Active',
  '● Bloqué': '● Blocked',
  'Aucun propriétaire': 'No owners',
  'Aucun locataire actif': 'No active tenants',
  'locataire(s)': 'tenant(s)',
  'PIN': 'PIN',
  '●●●● (modifié)': '●●●● (changed)',
  '0000 (défaut)': '0000 (default)',

  // ── Page Validation ──────────────────────────────────────────
  'paiement(s) en attente de validation': 'payment(s) pending validation',
  'Vérifiez et validez pour émettre les reçus PDF officiels': 'Check and validate to issue official PDF receipts',
  'En attente de validation': 'Pending validation',
  'Date décl.': 'Decl. date',
  'Source': 'Source',
  'Action': 'Action',
  '✅ Valider': '✅ Validate',
  '✓ Aucun paiement en attente': '✓ No pending payments',
  'Paiements déclarés par le propriétaire': 'Payments declared by owner',
  'Derniers validés': 'Recently validated',
  'Date valid.': 'Valid. date',
  'Réf. reçu': 'Receipt ref.',

  // ── Portail propriétaire ─────────────────────────────────────
  '🏢 Portail Propriétaire': '🏢 Owner Portal',
  'Loyers/mois': 'Rent/month',
  'Recouvrement': 'Recovery rate',
  'Derniers versements': 'Recent payments',
  'Télécharger les rapports': 'Download reports',
  'Fiches de suivi': 'Tracking sheets',
  'Informations personnelles': 'Personal info',
  'Résumé financier': 'Financial summary',
  'occupé(s)': 'occupied',
  'impayé(s)': 'unpaid',
  'Total loyers/mois': 'Total rent/month',
  '✅ Encaissé ce mois': '✅ Collected this month',
  '⚠️ Impayés cumulés': '⚠️ Outstanding balance',
  '📊 Taux recouvrement': '📊 Recovery rate',
  '👁 Fiche': '👁 Profile',
  '💳 Déclarer': '💳 Declare',
  '👁 Aperçu': '👁 Preview',
  '🔒 Lecture seule': '🔒 Read only',
  'Locataires actifs': 'Active tenants',
  'Mes immeubles (portail)': 'My buildings',

  // ── Portail locataire ────────────────────────────────────────
  'Aucune notification': 'No notifications',
  'Aucune demande pour l\'instant': 'No requests yet',
  'mois de retard': 'month(s) late',
  'mois d\'avance': 'month(s) ahead',
  '⚠️ Arriéré à régulariser': '⚠️ Arrears to settle',
  '✅ Compte soldé': '✅ Account settled',
  'Paiement confirmé': 'Payment confirmed',
  'Caution reçue': 'Deposit received',
  'Déclaré le': 'Declared on',
  'Reçu caution': 'Deposit receipt',
  'Aucun document disponible': 'No documents available',
  'paiement(s) au total': 'payment(s) total',
  'paiement(s) rejeté(s)': 'payment(s) rejected',
  'Motif :': 'Reason:',
  'Non connecté': 'Not connected',
  '✉️ Écrire au gestionnaire': '✉️ Write to manager',
  '✉️ Nouveau message': '✉️ New message',
  'Destinataire': 'Recipient',
  'Sujet': 'Subject',
  'Sujet…': 'Subject…',
  'Votre réponse…': 'Your reply…',
  '📋 Ma fiche locative': '📋 My Rental Profile',
  '💳 Historique des paiements': '💳 Payment History',
  'Période': 'Period',
  'Aucun message.': 'No messages.',
  'Remplissez tous les champs': 'Please fill all fields',
  'Réponse envoyée ✓': 'Reply sent ✓',
  'Message envoyé ✓': 'Message sent ✓',
  'Message vide': 'Empty message',
  'Il y a': 'ago',
  'aujourd\'hui': 'today',
  'jour(s)': 'day(s)',
  'Solde courant': 'Current balance',
  'Mois restants sur le bail': 'Months remaining on lease',
  'Demandes en cours': 'Active requests',
  'Paiements — 12 derniers mois': 'Payments — last 12 months',
  '📊 Tableau de bord': '📊 Dashboard',
  '💳 Paiement': '💳 Payment',
  '🔧 Maintenance': '🔧 Maintenance',
  '💬 Messages': '💬 Messages',
  '📄 Documents': '📄 Documents',
  '🔔 Notifications': '🔔 Notifications',
  '📋 Ma fiche': '📋 My Profile',
  '🏠 Espace Locataire': '🏠 Tenant Portal',
  '✕ Fermer': '✕ Close',

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
