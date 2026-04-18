# Alpha gameplay rules

Ce document résume les règles Alpha actuellement implémentées pour la guerre, les frontières, la pression et l'expansion.

## Territoires et provinces

- une province est contrôlée par une seule faction à la fois
- une capture crée un état d'occupation via `withControllingFaction(...)`
- une province occupée peut rester contestée et voir sa logistique se dégrader avant stabilisation
- les voisinages doivent être réciproques pour qu'une frontière soit considérée comme valide

## Détection des fronts

`DetectFronts` et `detectFrontSegments` décrivent un front uniquement quand deux provinces adjacentes sont contrôlées par des factions différentes.

- les frontières internes à une même faction sont ignorées
- les voisins manquants sont ignorés
- chaque segment de frontière n'est compté qu'une seule fois
- un front regroupe les provinces, segments et provinces contestées pour une paire de factions donnée
- la pression agrégée initiale d'un front détecté correspond au nombre de provinces contestées qu'il contient

## Pression de frontière

`ResolveBorderPressure` compare deux provinces adjacentes ennemies.

Le support local est calculé comme suit:

- `loyalty`
- plus `strategicValue * 5`
- moins `15` si la province est occupée
- moins `10` si la province est contestée

Ensuite:

- la pression = `support(attacker) - support(defender)`
- la pression est bornée entre `-100` et `100`
- la province dominante dépend du signe de la pression
- une frontière reste `contested` si `abs(pressure) < 20`
- si les deux provinces ont la même faction de contrôle, la frontière est inactive

## Expansion et consolidation

`ExpandTerritory` et `expandFrontLine` couvrent deux niveaux d'expansion.

### Capture directe

`ExpandTerritory` autorise une capture si:

- la faction contrôle la province source
- la province cible existe
- la source et la cible sont adjacentes dans les deux sens
- la cible n'est pas déjà contrôlée par la faction attaquante

### Poussée de front

`expandFrontLine` modélise une poussée simple à travers un segment de front.

- il faut un `pressureDelta` entier strictement positif
- le segment doit bien correspondre à la province ciblée
- la province déjà contrôlée par l'attaquant n'est pas recapurée
- un succès crée une province capturée par la faction attaquante

### Stabilisation

`StabilizeCapturedProvince` et `consolidateProvinceControl` stabilisent une province occupée.

- seuls les territoires occupés peuvent être stabilisés
- la loyauté remonte sans dépasser `100`
- l'état `contested` est retiré pendant la consolidation
- la logistique peut remonter d'un cran: `collapsed -> disrupted -> strained -> stable`

## Événements de guerre

`WarEventBusPort` et `InMemoryWarEventBus` normalisent et enregistrent les changements de front.

- les événements de front ont une structure validée avant enregistrement
- l'adaptateur mémoire garde l'ordre d'insertion
- l'adaptateur peut être initialisé avec un historique d'événements déjà normalisés

## Rendu UI Alpha

Les helpers UI actuels restent déterministes et pilotés par le domaine.

### Frontières contestées

`buildContestedBorderOverlay`:

- ne garde que les segments contestés
- trie les sorties par identifiant de segment
- expose le segment, les provinces, la pression, la province dominante, le terrain et le style
- applique des overrides de style par type de terrain avec un fallback par défaut

### Indicateurs de pression

`buildFrontPressureIndicators`:

- ne garde que les segments dont la pression est non nulle
- calcule `pressureValue = abs(pressure)`
- classe l'intensité en `low`, `medium`, `high`
- utilise par défaut `mediumThreshold = 25` et `highThreshold = 60`
- expose un point d'ancrage simple avec `position` et `length`
- permet des overrides d'apparence par intensité

## Références de code

- `src/application/war/DetectFronts.js`
- `src/application/war/ExpandTerritory.js`
- `src/application/war/ResolveBorderPressure.js`
- `src/application/war/StabilizeCapturedProvince.js`
- `src/application/war/WarEventBusPort.js`
- `src/adapters/war/InMemoryWarEventBus.js`
- `src/domain/war/detectFrontSegments.js`
- `src/domain/war/expandFrontLine.js`
- `src/domain/war/consolidateProvinceControl.js`
- `src/domain/war/buildContestedBorderOverlay.js`
- `src/domain/war/buildFrontPressureIndicators.js`
