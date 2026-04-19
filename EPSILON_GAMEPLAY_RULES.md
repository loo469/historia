# Epsilon gameplay rules

Ce document résume les règles Epsilon actuellement implémentées pour le climat, les saisons, les catastrophes et les mythes.

## Saisons et calendrier

`SeasonCycle` modélise un calendrier saisonnier simple et déterministe.

- l’ordre des saisons doit être non vide et sans doublon
- la saison courante doit appartenir à cet ordre
- `year`, `dayOfSeason` et `seasonLengthDays` sont bornés à des entiers positifs
- `dayOfSeason` ne peut pas dépasser `seasonLengthDays`
- `nextSeason` expose la prochaine saison selon l’ordre courant
- `progressRatio` représente la progression interne de la saison en cours
- `advanceDays(...)` fait avancer le temps de façon immuable, traverse correctement les changements de saison et incrémente l’année au retour au début du cycle
- `advanceSeason()` saute directement au premier jour de la saison suivante

## État climatique régional

`ClimateState` garde l’état canonique du climat pour une région.

- chaque état exige un `regionId` non vide, une `season`, une température finie et des niveaux bornés pour la précipitation et la sécheresse
- `precipitationLevel` et `droughtIndex` restent bornés entre `0` et `100`
- une anomalie climatique peut être absente ou stockée dans `anomaly`
- les catastrophes actives sont suivies via `activeCatastropheIds` avec déduplication automatique
- `withSeason(...)` et `withReadings(...)` produisent de nouveaux états immuables
- `activateCatastrophe(...)` et `resolveCatastrophe(...)` maintiennent la liste des catastrophes actives sans doublon
- `hasAnomaly()` détecte la présence d’une anomalie
- `isStable()` considère une région stable quand la sécheresse reste sous `60`, que la précipitation reste au moins à `20` et qu’aucune anomalie n’est active

## Mise à jour du climat

`UpdateRegionalClimate` applique les dérives saisonnières ou régionales sur une collection d’états.

- l’entrée `regionalStates` doit être un tableau
- les états peuvent être fournis comme objets simples ou comme instances de `ClimateState`
- un `defaultShift` commun peut être combiné avec des `shiftsByRegionId`
- les décalages supportés sont `temperatureDelta`, `precipitationDelta` et `droughtDelta`
- la prochaine saison peut être imposée avec `nextSeason`, sinon la saison courante est conservée
- les précipitations et la sécheresse sont re-bornées entre `0` et `100`
- les anomalies et catastrophes actives déjà présentes sur un état sont préservées pendant la mise à jour
- le résultat expose `updatedRegionalStates` et `appliedShiftCount`

## Profils climatiques des régions

`RegionClimateProfile` décrit un profil climatique structurel par région.

- chaque profil exige un `regionId`, un `biome` valide et une table `seasonalAverages` non vide
- les biomes autorisés sont `temperate`, `arid`, `tropical`, `continental`, `polar`, `coastal` et `highland`
- chaque moyenne saisonnière stocke `averageTemperatureC` et `averagePrecipitationLevel`
- les saisons reconnues par le profil sont `spring`, `summer`, `autumn` et `winter`
- les risques de catastrophe sont stockés par type avec des niveaux `low`, `moderate`, `high` ou `extreme`
- `riskLevelFor(...)` retourne `low` par défaut quand aucun risque spécifique n’est défini
- `averageForSeason(...)` retourne une copie défensive de la moyenne saisonnière demandée
- `withRisk(...)` et `addTag(...)` produisent de nouveaux profils immuables

## Catastrophes

`Catastrophe` représente un événement climatique majeur normalisé.

- une catastrophe exige un `id`, un `type`, une `severity`, une liste `regionIds`, une date `startedAt` et un objet `impact`
- les sévérités autorisées sont `minor`, `major` et `critical`
- les statuts autorisés sont `warning`, `active` et `resolved`
- les régions touchées sont normalisées, dédupliquées et triées
- `expectedEndAt` et `resolvedAt` sont optionnels mais doivent être des dates valides quand ils sont présents
- un statut `resolved` exige obligatoirement un `resolvedAt`
- `resolvedAt` ne peut pas être antérieur à `startedAt`
- `impact` reste une map libre mais toutes ses valeurs doivent être finies
- `activate()`, `resolve(...)` et `withImpact(...)` produisent de nouvelles instances immuables
- `affectsRegion(...)` permet de tester rapidement si une région donnée est touchée

## Événements dérivés du climat

`ClimateEventBusPort` sert de port de sortie pour normaliser les événements climatiques.

### Impacts sur les récoltes

`EmitHarvestClimateEvents` publie des événements unitaires d’impact agricole.

- l’event bus doit exposer `publishHarvestImpact(...)`
- chaque ressource affectée produit un événement `climate.harvest-impact.detected`
- les ressources sont triées de façon stable avant publication
- les impacts nuls sont ignorés pour éviter le bruit
- chaque événement embarque la région, la saison, le niveau d’impact, les indices de sécheresse et de précipitation, l’anomalie courante et la cause

### Impacts sur l’agitation

`EmitUnrestClimateEvents` publie un événement d’agitation sociale lié au climat.

- l’event bus doit exposer `publishUnrestImpact(...)`
- `unrestDelta` doit être un entier entre `-100` et `100`
- une variation nulle ne publie rien
- l’événement normalisé produit `climate.unrest-impact.detected`
- le payload inclut la région, la saison, l’agitation, les indicateurs climatiques, la sévérité et la cause

## Mythes climatiques

`Myth` et `RegisterMythFromEvent` transforment certains événements climatiques en récits structurés.

- un mythe exige un `id`, un `title`, une `category`, une liste `originEventIds`, un `summary` et une crédibilité entière entre `0` et `100`
- les catégories autorisées sont `origin`, `omen`, `catastrophe`, `seasonal` et `heroic`
- les statuts autorisés sont `emerging`, `canonized` et `forgotten`
- les régions et tags sont dédupliqués puis triés
- `canonize(...)`, `forget()`, `withCredibility(...)`, `rememberInRegion(...)` et `addTag(...)` restent immuables
- `referencesEvent(...)` permet de relier un mythe à un événement source
- `RegisterMythFromEvent` accepte une `Catastrophe` ou un objet compatible
- les sécheresses et inondations produisent des mythes de catégorie `catastrophe`
- les autres types, comme une vague de chaleur, produisent des mythes de catégorie `omen`
- le titre, le résumé, la crédibilité, les régions et les tags sont dérivés de la catastrophe source de façon déterministe

## Adaptateurs mémoire Epsilon

Les adaptateurs mémoire existants permettent d’orchestrer le domaine Epsilon sans infrastructure externe.

- `InMemoryClimateRepository` stocke les états climatiques par région avec copies défensives
- `InMemoryMythLedger` enregistre les mythes et permet de les retrouver par événement d’origine

## Références de code

- `src/domain/climate/SeasonCycle.js`
- `src/domain/climate/ClimateState.js`
- `src/domain/climate/RegionClimateProfile.js`
- `src/domain/climate/Catastrophe.js`
- `src/domain/climate/Myth.js`
- `src/application/climate/UpdateRegionalClimate.js`
- `src/application/climate/EmitHarvestClimateEvents.js`
- `src/application/climate/EmitUnrestClimateEvents.js`
- `src/application/climate/RegisterMythFromEvent.js`
- `src/application/climate/ClimateEventBusPort.js`
- `src/adapters/climate/InMemoryClimateRepository.js`
- `src/adapters/climate/InMemoryMythLedger.js`
