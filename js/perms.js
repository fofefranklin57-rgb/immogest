// ═══ IMMOGEST v2 — Module Permissions ═══
window.IG = window.IG || {};

window.IG.perms = (function() {

  // ── Permissions par défaut par rôle ──────────────────────────────
  var DEFAULTS = {
    admin: {
      dashboard: true, immeubles: true, immeubles_edit: true,
      locataires: true, locataires_edit: true,
      paiements: true, paiements_edit: true,
      rapports: true, statistiques: true,
      juridique: true, signatures: true,
      marketplace: true, marketplace_publie: true, leads: true,
      messages: true, declarations: true,
      parametres: true, equipe: true,
      // docs bailleurs
      voir_fiche_suivi: true, voir_rapport_bailleur: true, voir_contrat: true, voir_paiements_bailleur: true,
      // docs locataires
      telecharger_contrat: true, voir_recus: true, declarer_paiement: true, maintenance: true
    },
    coordinateur: {
      dashboard: true, immeubles: true, immeubles_edit: true,
      locataires: true, locataires_edit: true,
      paiements: true, paiements_edit: false,
      rapports: true, statistiques: true,
      juridique: true, signatures: true,
      marketplace: true, marketplace_publie: true, leads: true,
      messages: true, declarations: true,
      parametres: false, equipe: true,
      voir_fiche_suivi: true, voir_rapport_bailleur: true, voir_contrat: true, voir_paiements_bailleur: true,
      telecharger_contrat: false, voir_recus: false, declarer_paiement: false, maintenance: false
    },
    gestionnaire: {
      dashboard: true, immeubles: true, immeubles_edit: false,
      locataires: true, locataires_edit: true,
      paiements: true, paiements_edit: false,
      rapports: true, statistiques: false,
      juridique: true, signatures: true,
      marketplace: true, marketplace_publie: true, leads: true,
      messages: true, declarations: true,
      parametres: false, equipe: false,
      voir_fiche_suivi: true, voir_rapport_bailleur: true, voir_contrat: true, voir_paiements_bailleur: true,
      telecharger_contrat: false, voir_recus: false, declarer_paiement: false, maintenance: false
    },
    comptable: {
      dashboard: true, immeubles: false, immeubles_edit: false,
      locataires: true, locataires_edit: false,
      paiements: true, paiements_edit: true,
      rapports: true, statistiques: true,
      juridique: true, signatures: true,
      marketplace: false, marketplace_publie: false, leads: false,
      messages: true, declarations: false,
      parametres: false, equipe: false,
      voir_fiche_suivi: false, voir_rapport_bailleur: false, voir_contrat: false, voir_paiements_bailleur: false,
      telecharger_contrat: false, voir_recus: false, declarer_paiement: false, maintenance: false
    },
    agent: {
      dashboard: true, immeubles: false, immeubles_edit: false,
      locataires: true, locataires_edit: false,
      paiements: true, paiements_edit: false,
      rapports: false, statistiques: false,
      juridique: false, signatures: false,
      marketplace: false, marketplace_publie: false, leads: false,
      messages: true, declarations: false,
      parametres: false, equipe: false,
      voir_fiche_suivi: false, voir_rapport_bailleur: false, voir_contrat: false, voir_paiements_bailleur: false,
      telecharger_contrat: false, voir_recus: false, declarer_paiement: false, maintenance: false
    },
    bailleur: {
      dashboard: true, immeubles: true, immeubles_edit: false,
      locataires: true, locataires_edit: false,
      paiements: true, paiements_edit: false,
      rapports: true, statistiques: false,
      juridique: false, signatures: false,
      marketplace: false, marketplace_publie: false, leads: false,
      messages: true, declarations: false,
      parametres: false, equipe: false,
      voir_fiche_suivi: true, voir_rapport_bailleur: true, voir_contrat: true, voir_paiements_bailleur: true,
      telecharger_contrat: false, voir_recus: false, declarer_paiement: false, maintenance: false
    },
    locataire: {
      dashboard: true, immeubles: false, immeubles_edit: false,
      locataires: false, locataires_edit: false,
      paiements: false, paiements_edit: false,
      rapports: false, statistiques: false,
      juridique: false, signatures: false,
      marketplace: true, marketplace_publie: false, leads: false,
      messages: true, declarations: true,
      parametres: false, equipe: false,
      voir_fiche_suivi: false, voir_rapport_bailleur: false, voir_contrat: false, voir_paiements_bailleur: false,
      telecharger_contrat: false, voir_fiche_locataire: true, voir_recus: true, declarer_paiement: true, maintenance: true
    }
  };

  // ── Labels lisibles pour l'UI ──────────────────────────────────
  var PERM_GROUPS = [
    {
      label: '🏢 Gestion immobilière',
      perms: [
        { key: 'dashboard',        label: 'Tableau de bord' },
        { key: 'immeubles',        label: 'Voir les immeubles' },
        { key: 'immeubles_edit',   label: 'Créer / modifier immeubles' },
        { key: 'locataires',       label: 'Voir les locataires' },
        { key: 'locataires_edit',  label: 'Créer / modifier locataires' },
        { key: 'declarations',     label: 'Déclarations locataires' },
      ]
    },
    {
      label: '💰 Finance',
      perms: [
        { key: 'paiements',        label: 'Voir les paiements' },
        { key: 'paiements_edit',   label: 'Modifier les paiements' },
        { key: 'rapports',         label: 'Rapports (mensuel / annuel)' },
        { key: 'statistiques',     label: 'Statistiques' },
      ]
    },
    {
      label: '📄 Documents & Juridique',
      perms: [
        { key: 'juridique',        label: 'Documents juridiques (bail, etc.)' },
        { key: 'signatures',       label: 'Signatures électroniques' },
      ]
    },
    {
      label: '🌍 Marketplace',
      perms: [
        { key: 'marketplace',      label: 'Voir la marketplace' },
        { key: 'marketplace_publie', label: 'Publier des annonces' },
        { key: 'leads',            label: 'Voir les leads' },
      ]
    },
    {
      label: '💬 Communication',
      perms: [
        { key: 'messages',         label: 'Messages internes' },
      ]
    },
    {
      label: '📋 Accès bailleur — documents',
      roles: ['bailleur'],
      perms: [
        { key: 'voir_fiche_suivi',       label: 'Fiche de suivi locataire' },
        { key: 'voir_rapport_bailleur',  label: 'Rapport au bailleur' },
        { key: 'voir_contrat',           label: 'Contrat de bail' },
        { key: 'voir_paiements_bailleur', label: 'Historique paiements' },
      ]
    },
    {
      label: '🔑 Accès locataire — fonctions',
      roles: ['locataire'],
      perms: [
        { key: 'voir_fiche_locataire', label: 'Voir sa fiche de suivi' },
        { key: 'telecharger_contrat',  label: 'Télécharger son contrat' },
        { key: 'voir_recus',           label: 'Voir ses reçus' },
        { key: 'declarer_paiement',    label: 'Déclarer un paiement' },
        { key: 'maintenance',          label: 'Demande de maintenance' },
      ]
    }
  ];

  // ── canDo — vérifie si la session courante a une permission ──────
  function canDo(perm) {
    var session = window.IG.auth.getSession();
    if (!session) return false;
    var role = session.role || 'locataire';
    // Admin a toujours tout
    if (role === 'admin') return true;
    // Défauts du rôle
    var defaults = DEFAULTS[role] || {};
    var base = defaults[perm] !== undefined ? defaults[perm] : false;
    // Override personnel (stocké dans session.permissions)
    var overrides = session.permissions || {};
    if (overrides[perm] !== undefined) return !!overrides[perm];
    return base;
  }

  // ── canDoUser — vérifie pour un autre utilisateur (objet user) ──
  function canDoUser(user, perm) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    var defaults = DEFAULTS[user.role] || {};
    var base = defaults[perm] !== undefined ? defaults[perm] : false;
    var overrides = user.permissions || {};
    if (overrides[perm] !== undefined) return !!overrides[perm];
    return base;
  }

  // ── getDefaults — retourne les defaults d'un rôle ───────────────
  function getDefaults(role) {
    return DEFAULTS[role] || {};
  }

  return { canDo, canDoUser, getDefaults, PERM_GROUPS, DEFAULTS };

})();
