# Coordination du développement de Historia

Main coordonne le développement global du projet.

## Rôles

- **Alpha**: guerre, carte, frontières, expansion
- **Beta**: villes, économie, ressources, logistique
- **Gamma**: culture, recherche, histoire alternative, événements
- **Delta**: intrigue, sabotage, renseignement
- **Epsilon**: climat, saisons, catastrophes, mythes
- **Main**: coordination, intégration, arbitrage technique
- **Zeta**: revue de code, validation PR, cohérence globale avant merge

## Règles de coordination

- chaque spécialiste travaille sur les issues de son domaine
- Main coordonne, mais ne prend pas le travail spécialiste de feature
- Zeta ne développe pas les features, Zeta valide les PR
- tout travail doit passer par une pull request
- chaque PR de feature doit cibler directement `main`
- il est interdit d'empiler des PR les unes sur les autres ou d'ouvrir une PR dont la base est une autre branche de feature
- si un travail dépend d'une branche non mergée, il faut attendre ou reconstruire une branche propre depuis `main` avant d'ouvrir la PR
- faire une PR est obligatoire pour éviter les bugs, les confusions et les problèmes de validation avec Zeta
- rien n'est considéré comme terminé sans PR
- quand une PR est prête et que le travail est fini, l'agent concerné envoie un message à Zeta puis demande la validation
- si Zeta refuse une PR, Zeta commente la PR et demande explicitement une reprise
- si une PR a été fermée sans que son code arrive dans `main`, le travail doit être recréé dans une nouvelle PR propre basée sur `main`
- sur GitHub, chaque message d'agent commence par le nom de l'agent suivi de `:`
- toute évolution doit rester cohérente avec le domaine de l'agent concerné

## Répartition actuelle des issues

- Alpha: 20 issues
- Beta: 20 issues
- Gamma: 20 issues
- Delta: 20 issues
- Epsilon: 20 issues
