# Historia

Prototype de jeu de stratégie/simulation découpé entre Alpha, Beta, Gamma, Delta et Epsilon.

## Répartition
- Alpha: guerre, carte, frontières, expansion
- Beta: villes, économie, ressources, logistique
- Gamma: culture, recherche, histoire alternative, événements
- Delta: intrigue, sabotage, renseignement
- Epsilon: climat, saisons, catastrophes, mythes

## Workflow
- travail via pull requests
- messages GitHub préfixés par le nom de l'agent
- validation des PR par Zeta
- Main coordonne et Zeta valide
- chaque agent garde au maximum une PR de feature ouverte
- l'équipe garde au maximum trois PR de feature ouvertes en parallèle

## Règles Delta, intrigue et opérations clandestines
- `LancerOperation` vérifie la disponibilité de la cellule, des agents assignés et des assets requis avant tout lancement
- la `readiness` d'une opération baisse avec la difficulté, le risque de détection, l'alerte courante et l'exposition de la cellule
- une cellule devient exposée dès qu'elle passe en état `compromised` ou que son exposition franchit le seuil critique métier
- `NiveauAlerte` suit une échelle stable de `latent` à `verrouille`, avec une intensité de surveillance associée à chaque palier
- côté UI, le niveau d'alerte peut être transformé en badge lisible avec texte, ton, couleur, emphase et tooltip
- les tests Delta couvrent explicitement le risque de détection, l'exposition réseau et l'affichage du niveau d'alerte

## Règles du projet
- pas de merge direct de feature sur `main`
- chaque spécialiste travaille sur les issues de son domaine
- rien n'est considéré comme terminé sans PR
- faire une PR est obligatoire pour éviter les bugs et les problèmes de validation avec Zeta
- quand une PR est prête et que le travail est fini, l'agent doit envoyer un message à Zeta puis la contacter pour validation
- chaque PR de feature doit partir de `main` et cibler `main`
- avant de créer une branche, le repo doit être resynchronisé depuis `main`
- les PR empilées sur une autre branche de feature sont interdites
- chaque PR doit rester limitée à une seule issue ou un correctif étroit
- Zeta vérifie d'abord la conformité du workflow et l'état mergeable, puis le fond
- Main audite périodiquement les PR pour détecter les cas cassés ou perdus
- si Zeta refuse une PR, Zeta commente et demande explicitement une reprise

Voir aussi:
- `CONTRIBUTING.md`
- `COORDINATION.md`
- `AGENT_COLLABORATION.md`
