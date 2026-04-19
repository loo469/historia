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

## Règles Beta, villes, économie et logistique
- `City` garde un état canonique pour une ville avec population, workforce, prospérité, stabilité, stocks, routes commerciales et règles de production, avec normalisation stricte des identifiants et quantités
- `ResourceStock`, `ProductionRule` et `TradeRoute` servent de briques métier de base pour raisonner sur les stocks, les recettes de production et les routes à capacité limitée
- `ProduceResources` exécute une règle seulement si elle est activée, que la workforce est suffisante et que tous les intrants sont présents; sinon le résultat reste explicite avec une raison comme `rule-disabled`, `insufficient-workforce` ou `insufficient-inputs`
- `ConsumeNeeds` retire les besoins depuis le stock disponible, calcule un ratio de satisfaction, suit les pénuries par ressource et applique des pénalités bornées sur prospérité et stabilité
- `UpdateCityEconomy` compose la production puis la consommation dans cet ordre pour produire un prochain état de ville cohérent sur un tick d'économie
- `PlanLogisticsFlows` planifie des transferts depuis la première ville d'une route vers les arrêts suivants, en respectant les surplus, les besoins restants, les capacités par ressource et l'état actif ou non des routes
- `EconomyEventBusPort` publie des événements normalisés pour les pénuries et les surplus via `economy.shortage.detected` et `economy.surplus.detected`
- `EmitShortageEvents` et `EmitSurplusEvents` transforment des cartes de ressources en événements unitaires stables, triés et validés, sans bruit quand une carte est vide
- `CityRepositoryPort`, `RouteRepositoryPort` et `MarketRepository` fournissent une base hexagonale légère pour orchestrer villes, routes et prix, avec des adaptateurs mémoire déjà présents pour les villes et les routes
- côté UI, `buildCityStockPanel` construit une vue lisible du stock d'une ville avec lignes triées, objectifs désirés, états `shortage` ou `balanced` ou `surplus`, et métriques de synthèse réutilisables
- les tests Beta couvrent explicitement la production, la rareté, les transferts logistiques, l'émission d'événements économie, les adaptateurs mémoire et l'affichage UI du stock d'une ville

## Règles Gamma, culture, recherche et histoire alternative
- `Culture`, `ResearchState`, `HistoricalEvent` et `DivergencePoint` servent de modèles canoniques pour la progression culturelle, les découvertes, les bifurcations historiques et les événements associés, avec normalisation stricte des identifiants, listes et dates métier
- `advanceResearch` fait progresser une recherche, fusionne les découvertes de concepts, préserve les transitions explicites `active`, `blocked` et `completed`, et interdit les transitions impossibles
- `evaluateResearchUnlocks` débloque de nouveaux projets uniquement quand le seuil de `knowledgePoints` est atteint, sans redébloquer ce qui l’est déjà, et retourne séparément les déblocages nouveaux
- `evaluateCulturalDrift` combine pressions, contacts et résilience pour produire une dérive déterministe par axe et un impact borné sur la stabilité
- `evolveCulture` compose la dérive culturelle avec l’évolution des valeurs et traditions, tout en gardant des mises à jour immuables et des scores bornés dans le domaine
- `registerDivergence` relie proprement un `HistoricalEvent` à un `DivergencePoint`, conserve la date historique par défaut, agrège les découvertes utiles et refuse les liens incohérents
- `triggerHistoricalEvent`, `selectHistoricalEvent`, `RandomProviderPort` et `ClockPort` rendent le déclenchement d’événements testable, déterministe et injectable pour la sélection aléatoire comme pour l’horodatage
- `CultureRepositoryPort`, `ResearchRepositoryPort`, `InMemoryCultureRepository` et `InMemoryResearchRepository` fournissent une base hexagonale légère pour stocker cultures et recherches avec copies défensives et ordre stable
- `loadHistoricalEventsFromJson` et `loadResearchStatesFromJson` chargent des contenus JSON normalisés avec valeurs par défaut utiles et erreurs explicites sur les payloads invalides
- côté UI, `buildDiscoveriesPanel` expose les concepts découverts, recherches débloquées et événements liés dans une vue structurée réutilisable
- côté carte, `buildCultureMapOverlay` transforme cultures, recherches et événements historiques en marqueurs régionaux stables pour afficher découvertes et repères culturels sur la carte
- les tests Gamma couvrent explicitement les use cases de recherche, dérive culturelle, divergence, déclenchement d’événements, ports, adaptateurs mémoire, chargeurs JSON et UI des découvertes

## Règles Delta, intrigue et opérations clandestines
- `LancerOperation` vérifie la disponibilité de la cellule, des agents assignés et des assets requis avant tout lancement
- la `readiness` d'une opération baisse avec la difficulté, le risque de détection, l'alerte courante et l'exposition de la cellule
- un lancement d'opération produit des événements d'exposition structurés, avec un socle `intrigue.exposure.assessed` et des cas spécialisés comme `intrigue.exposure.risk-detected` ou `intrigue.exposure.cellule-blocked`
- `ResoudreSabotage` retourne un résultat structuré pour succès, échec ou absence de cible, et publie des événements dédiés comme `intrigue.sabotage.resolved`, `intrigue.sabotage.damage-inflicted`, `intrigue.sabotage.failed` et `intrigue.sabotage.no-target`
- une cellule devient exposée dès qu'elle passe en état `compromised` ou que son exposition franchit le seuil critique métier, et ce statut compromis reste explicite dans le modèle même si l'exposition redescend ensuite
- `NiveauAlerte` suit une échelle stable de `latent` à `verrouille`, avec une intensité de surveillance associée à chaque palier
- côté UI, le niveau d'alerte peut être transformé en badge lisible avec texte, ton, couleur, emphase, icône, progression et libellé accessible
- côté UI, `buildIntrigueMapOverlay` agrège par lieu la présence de cellules et la menace de sabotage active dans une vue stable avec métriques, styles et niveaux de risque réutilisables pour la carte
- côté UI, `buildIntrigueWebDemo` compose la couche intrigue pour la démo web avec badge d'alerte, hotspots triés, panneau simple des cellules et opérations actives, tout en réutilisant les composants intrigue existants
- l'adaptateur `InMemoryIntrigueRepository` permet de stocker cellules et opérations clandestines en mémoire avec copies défensives et ordre de listing stable pour les tests et assemblages locaux
- les tests Delta couvrent explicitement le risque de détection, l'exposition réseau, l'adaptateur mémoire intrigue et l'affichage du niveau d'alerte

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
- quand une PR est merge, l'issue associée doit être fermée immédiatement pour garder le backlog à jour
- Main audite périodiquement les PR pour détecter les cas cassés ou perdus
- si Zeta refuse une PR, Zeta commente et demande explicitement une reprise

Voir aussi:
- `CONTRIBUTING.md`
- `COORDINATION.md`
- `AGENT_COLLABORATION.md`
- `ALPHA_GAMEPLAY_RULES.md`
- `EPSILON_GAMEPLAY_RULES.md`
