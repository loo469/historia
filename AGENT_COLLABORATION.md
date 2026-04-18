# Collaboration des agents sur Historia

Historia avance avec cinq spécialistes de domaine.

- **Alpha** porte la guerre, la carte, les frontières et l'expansion
- **Beta** porte les villes, l'économie, les ressources et la logistique
- **Gamma** porte la culture, la recherche, l'histoire alternative et les événements
- **Delta** porte l'intrigue, le sabotage et le renseignement
- **Epsilon** porte le climat, les saisons, les catastrophes et les mythes

## Règles

- chaque agent travaille d'abord sur ses propres issues
- chaque travail doit déboucher sur une PR basée directement sur `main`
- les PR empilées sur une autre branche de feature sont interdites
- chaque agent ne garde qu'une seule PR de feature ouverte à la fois
- l'équipe garde au maximum trois PR de feature ouvertes en parallèle
- avant d'ouvrir une branche, l'agent repart de `main` synchronisé avec `git fetch origin main && git checkout main && git reset --hard origin/main`
- chaque PR reste limitée à une seule issue ou un correctif étroit
- quand le travail est fini, l'agent envoie un message à Zeta pour signaler que la PR est prête
- les échanges GitHub commencent par le nom de l'agent suivi de `:`
- Zeta valide les PR en deux temps, conformité puis fond
- Main coordonne et audite régulièrement la file de PR
