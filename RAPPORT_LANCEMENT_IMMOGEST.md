# Rapport lancement ImmoGest

Date : 2 juillet 2026

## Avis direct

ImmoGest est assez avancée pour commencer une commercialisation contrôlée : beta payante, premiers cabinets, propriétaires multi-biens, agences locales. Le produit a déjà des points forts différenciants : offline, rôles multiples, rapports, fiche de suivi, marketplace, WhatsApp, portail locataire/bailleur et paiements locaux.

Pour une mise sur le marché large, il faut surtout renforcer la confiance commerciale : onboarding plus simple, démo guidée, preuves terrain, support clair, screenshots Play Store réels, offre tarifaire très lisible et promesse marketing moins large que le produit réel.

## Corrections faites maintenant

- Page marché : suppression de l'appel paiement direct depuis le navigateur. Les paiements passent désormais par le Worker Cloudflare via `/fapshi-init` et `/fapshi-check`.
- Pages publiques : `privacy.html`, `terms.html`, `marche.html` et `marketplace.html` sont présentes dans `www` et publiées.
- Routes production corrigées : `/privacy`, `/cgu`, `/marche`, `/marketplace`.
- Politique de confidentialité alignée avec le prestataire de paiement actif : Fapshi.
- Ajout d'une page conditions d'utilisation.
- Manifest PWA nettoyé : retrait des screenshots déclarés mais absents, pour éviter des références cassées.
- Service worker mis à jour en cache `immogest-v2-cache-v33`, avec les pages publiques importantes incluses.

## Vérifications production

- Accueil : OK.
- Manifest : OK, plus de screenshots inexistants.
- Service worker : OK, cache v33 publié.
- Worker Cloudflare : OK.
- `/privacy` : OK.
- `/cgu` : OK.
- `/marche` : OK, paiement via Worker Fapshi, pas d'appel direct à une API de paiement depuis le navigateur.
- `/marketplace` : OK.
- Scripts principaux de l'app : contrôle de syntaxe OK.

## Ce qu'il manque pour être compétitif

1. Démo simple sans risque
   Créer un compte démo avec des immeubles, locataires, paiements, rapports et fiche de suivi déjà remplis. Un client doit comprendre la valeur en 3 minutes.

2. Onboarding ultra court
   Premier écran : créer espace, ajouter immeuble, ajouter locataire, enregistrer paiement. Tout le reste doit venir après.

3. Screenshots et vidéo Play Store réels
   Il manque les screenshots déclarés dans la fiche store. Il faut 5 visuels propres : dashboard, locataire, paiement/reçu, rapport, fiche de suivi.

4. Offre tarifaire claire
   Trois plans maximum au lancement : Gratuit, Starter, Pro/Cabinet. Éviter trop d'options au départ.

5. Message commercial plus précis
   Positionnement recommandé : "Le logiciel de gestion locative pensé pour les gestionnaires africains : offline, WhatsApp, Mobile Money, rapports bailleurs."

6. Support visible
   Bouton WhatsApp support, FAQ courte, vidéo de démarrage, procédure de récupération d'accès.

7. Preuves terrain
   Avant publicité massive : obtenir 5 à 10 témoignages de gestionnaires, même simples, avec chiffres : nombre de biens, temps gagné, impayés suivis.

## Stratégie de lancement recommandée

- Semaine 1 : beta payante avec 10 à 20 utilisateurs proches.
- Semaine 2 : corriger uniquement les blocages qui empêchent encaissement, rapports, relances, accès utilisateurs.
- Semaine 3 : publier Play Store avec screenshots propres + landing simple.
- Semaine 4 : prospection directe WhatsApp/Facebook auprès des agences, syndics, gestionnaires de mini-cités, propriétaires diaspora.

## Priorité produit

La priorité n'est pas d'ajouter beaucoup de fonctions. La priorité est de rendre les fonctions critiques impossibles à rater :

- enregistrer un immeuble ;
- enregistrer un locataire ;
- enregistrer un paiement ;
- générer un reçu ;
- voir la fiche de suivi ;
- envoyer une relance WhatsApp ;
- produire un rapport bailleur ;
- restaurer une archive/corbeille ;
- vérifier que chaque rôle voit uniquement ce qu'il doit voir.
