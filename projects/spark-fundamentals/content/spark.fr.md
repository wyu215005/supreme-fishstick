# Spark - Premiere lecon : de Hadoop a l execution distribuee

## 1. Le rôle de Spark
HDFS stocke les données, YARN gère les ressources, et MapReduce et Spark assurent le calcul. Spark peut utiliser HDFS et YARN ; il faut comparer Spark au moteur MapReduce plutôt qu’à tout l’écosystème Hadoop. Spark Core fournit les fonctions d’exécution, Spark SQL traite les données structurées, Structured Streaming les flux, MLlib l’apprentissage automatique et GraphX les graphes.

## 2. Architecture et ordonnancement
Le Driver exécute la logique et planifie les tâches ; le gestionnaire de cluster attribue les ressources ; les Executors exécutent les tâches, mettent des données en cache et transmettent leur état. Une partition est une unité de parallélisme.
```mermaid
flowchart LR
 D[Driver] -->|demande de ressources| M[Gestionnaire de cluster]
 M --> E1[Executor 1]
 M --> E2[Executor 2]
 D -->|ordonnance les tâches| E1
 D -->|ordonnance les tâches| E2
```
Une application peut contenir plusieurs jobs. Un job est découpé en stages selon les dépendances ; chaque stage comprend des tasks, généralement une par partition. Une tâche échouée peut être relancée. Les transformations telles que `filter` construisent généralement un plan paresseux ; les actions comme `show`, `count` ou l’écriture déclenchent le calcul, sans garantir exactement un job par action. Les dépendances de shuffle délimitent souvent les stages ; leur nombre dépend du plan.
```mermaid
flowchart TD
 A[Application] --> B[Job]
 B --> C[Stage : lecture et agrégation partielle]
 C -->|Shuffle| D[Stage : agrégation finale]
 C --> T1[Task 1]
 C --> T2[Task 2]
```

## 3. Comprendre le shuffle avec AVG
```sql
SELECT branch_id, AVG(amount)
FROM orders WHERE status = 'PAID'
GROUP BY branch_id;
```
Chaque partition filtre ses lignes et calcule une somme et un nombre partiels par établissement. Spark redistribue ces états par clé, les fusionne puis divise. Un résultat local n’est pas le résultat global.

| Partition | Montants | Somme | Nombre | Moyenne locale |
|---|---|---:|---:|---:|
| P1 | 10, 20, 30 | 60 | 3 | 20 |
| P2 | 100 | 100 | 1 | 100 |

La moyenne des moyennes locales donne 60, ce qui est faux. La bonne réponse est (60+100)/(3+1)=40. AVG ignore les valeurs NULL et renvoie NULL si toutes les valeurs du groupe sont NULL. Les flottants peuvent présenter des écarts d’arrondi ; pour les montants, envisager un type décimal.

## 4. Spark et MapReduce
Des jobs MapReduce enchaînés écrivent souvent leur sortie sur HDFS avant la lecture par le job suivant. Spark peut enchaîner les opérations à dépendance étroite sans écrire chaque étape sur HDFS ; les regroupements entre partitions nécessitent toujours un shuffle, qui écrit souvent des fichiers locaux et peut déborder sur disque. Un combiner MapReduce peut aussi agréger localement quand c’est applicable et son exécution n’est pas garantie. Le cache doit être demandé explicitement ; les données non mises en cache peuvent être recalculées. Les performances dépendent des données, des ressources et du plan.

## 5. Catalyst et DAG
Catalyst analyse les plans logiques SQL/DataFrame, applique des règles d’optimisation et peut utiliser des statistiques pour choisir un plan physique. AQE peut modifier une partie du plan à partir des statistiques d’exécution. Les dépendances forment un DAG ; l’ordonnanceur découpe les stages selon ces dépendances et les shuffles. Ce processus utilise des règles et des algorithmes, sans nécessiter d’IA. Les RDD ne suivent pas le même chemin d’optimisation SQL Catalyst.
```mermaid
flowchart LR
 A[SQL ou DataFrame] --> B[Plan logique]
 B --> C[Plan optimisé]
 C --> D[Plan physique et AQE]
 D --> E[DAG d’exécution]
 E --> F[Stages et tasks]
```

## 6. Modes de déploiement
Local utilise des threads locaux ; Standalone utilise le gestionnaire de Spark ; YARN et Kubernetes gèrent leurs propres ressources. Client et cluster décrivent l’emplacement du Driver : sur la machine de soumission en mode client, dans le cluster en mode cluster. Avec YARN en mode cluster, le Driver s’exécute dans le processus ApplicationMaster ; en mode client il reste sur la machine de soumission.
```bash
spark-submit --master yarn --deploy-mode cluster app.py
```

## 7. Petits fichiers et déséquilibre
De nombreux petits fichiers augmentent les coûts de métadonnées, de listage et d’ouverture, et peuvent créer trop de petites tâches ; Spark peut regrouper des fichiers dans une partition de lecture. Le déséquilibre apparaît lorsque certaines clés ou partitions sont très volumineuses et ralentissent quelques tâches ; les petits fichiers ne provoquent pas nécessairement un déséquilibre des clés. Comparer durées, entrées, shuffle et débordements dans Spark UI. Compacter les fichiers ou ajuster les partitions : `coalesce` réduit généralement les partitions sans shuffle complet, tandis que `repartition` effectue un shuffle. Pour le déséquilibre, envisager une préagrégation, une jointure par diffusion appropriée ou un salage des clés chaudes suivi d’une seconde agrégation ; AQE ne résout que certains cas.

## 8. Travaux pratiques
Exécuter dans un environnement PySpark configuré :
```python
from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.master('local[2]').appName('SparkLesson').getOrCreate()
spark.conf.set('spark.sql.shuffle.partitions', '2')
rows = [('A', 10.0, 'PAID'), ('A', 20.0, 'PAID'), ('A', 30.0, 'PAID'), ('A', 100.0, 'PAID'), ('B', 50.0, 'PAID'), ('B', None, 'PAID'), ('B', 999.0, 'CANCELLED')]
df = spark.createDataFrame(rows, ['branch_id', 'amount', 'status']).repartition(2)
result = df.filter(F.col('status') == 'PAID').groupBy('branch_id').agg(F.avg('amount').alias('avg_amount'))
result.explain('formatted')
result.orderBy('branch_id').show()  # A = 40, B = 50
input('Consultez Spark UI (souvent http://localhost:4040), puis Entrée : ')
spark.stop()
```
Repérer le filtre, l’agrégation partielle, Exchange et l’agrégation finale dans le plan ; examiner les jobs, stages et shuffles dans l’interface. `repartition` entraîne lui-même un shuffle. Un petit jeu de données ne permet pas de conclure sur les performances en production.

## 9. Questions et réponses
- **Comment traiter des données distribuées à l’avance ?** Chaque partition calcule un état fusionnable, puis les états sont réunis.
- **Tout reste-t-il en mémoire ?** Non ; le shuffle et les débordements peuvent utiliser le disque.
- **Plus de partitions corrigent-elles toujours le déséquilibre ?** Non ; une clé très fréquente peut rester concentrée.
- **Un DAG nécessite-t-il de l’IA ?** Non ; Spark utilise les dépendances et des règles de planification.

## Complément A de la première leçon : les composants

Les composants fonctionnels indiquent ce que Spark peut faire ; Driver, Executor et gestionnaire de cluster indiquent qui exécute le travail.

| Niveau | Composant | Rôle |
|---|---|---|
| Exécution | Spark Core | Ordonnancement, mémoire et récupération ; le RDD est une abstraction fondamentale |
| Données structurées | Spark SQL | SQL, DataFrames, optimisation et sources structurées |
| Flux | Structured Streaming | Traitement continu avec des API structurées ; garanties selon source et configuration |
| Apprentissage | MLlib | Préparation des caractéristiques, algorithmes et pipelines |
| Graphes | GraphX | Calcul parallèle sur graphes, principalement avec les API Scala |
| Ressources | Standalone / YARN / Kubernetes | Attribution des ressources ; pas de logique métier |

```mermaid
flowchart TD
 U[Applications] --> SQL[Spark SQL / DataFrame]
 U --> SS[Structured Streaming]
 U --> ML[MLlib]
 U --> GX[GraphX]
 SS --> SQL
 SQL --> CORE[Spark Core]
 ML --> CORE
 GX --> CORE
 CORE --> CM[Gestionnaire de cluster]
 CORE --> DATA[HDFS / stockage objet / autres sources]
```

Ce schéma est conceptuel et ne représente pas toutes les dépendances internes. Une application peut combiner les composants ; les sources influencent aussi son exécution.

## Complément B : comparer les parcours complets

Prenons la moyenne des commandes payées par établissement, puis le filtrage des moyennes supérieures à 50. Voici une implémentation MapReduce à plusieurs jobs et une implémentation Spark : ce ne sont ni les seules possibilités ni un benchmark.

```mermaid
flowchart LR
 I[(Commandes)] --> M[Job MR 1 : filtrage et état partiel]
 M --> SH[Shuffle par établissement]
 SH --> R[Reduce : fusion somme et nombre]
 R --> H[(Résultat intermédiaire HDFS)]
 H --> J[Job MR 2 : filtrage des moyennes]
 J --> O[(Résultat final)]
```
```mermaid
flowchart LR
 I[(Commandes)] --> F[Lecture et filtrage]
 F --> P[Somme et nombre partiels]
 P --> S[Shuffle par établissement]
 S --> A[Fusion et calcul de moyenne]
 A --> G[Filtre moyenne supérieure à 50]
 G --> O[(Résultat final)]
```

| Point | Exemple MapReduce à plusieurs jobs | Exemple Spark |
|---|---|---|
| Lecture | Chaque job lit son entrée, éventuellement la sortie précédente | Les tâches lisent les partitions |
| Regroupement | Shuffle vers les reducers ; combiner possible | Agrégation partielle puis shuffle et agrégation finale |
| Entre étapes | Le premier job écrit sur HDFS, le second relit | Les opérations à dépendance étroite peuvent être enchaînées sans écriture HDFS à chaque étape |
| Disque | Sortie map et shuffle utilisent le disque ; sortie possible sur HDFS | Shuffle souvent sur disque local, débordement possible ; sortie finale sur stockage |
| Réutilisation | Réutilisation de sorties matérialisées | Cache ou persist explicite ; recalcul ou éviction possibles |
| Récupération | Sorties persistées et nouvelles tentatives | Nouvelles tentatives et lignage, entre autres mécanismes |

Spark ne connaît pas la moyenne globale avant la fusion des données et n’évite pas toutes les écritures disque. Un seul job MapReduce peut aussi filtrer, agréger puis filtrer la moyenne dans son reducer. Le second job illustre seulement la matérialisation intermédiaire : il n’est pas obligatoire pour cette requête.

### Suivre les états partiels

P1 contient pour A les valeurs 10, 20, 30 et pour B la valeur 50 ; P2 contient 100 pour A. P1 émet A `(60,3)` et B `(50,1)` ; P2 émet A `(100,1)`. Après shuffle, la tâche A fusionne `(60,3)` et `(100,1)` en `(160,4)`, soit 40. Les valeurs transmises sont des états fusionnables, pas le résultat global. Si toutes les clés sont distinctes, l’agrégation locale peut peu réduire les échanges. `COUNT(amount)` ignore NULL, tandis que `COUNT(*)` compte les lignes ; type, dépassement et arrondi comptent aussi.

## Complément C : exécution, déploiement et ordonnancement

Il faut distinguer trois questions : (1) l’environnement ou gestionnaire de cluster détermine la provenance des ressources ; (2) le mode client ou cluster détermine l’emplacement du Driver, selon les possibilités du gestionnaire et du langage ; (3) FIFO ou FAIR répartit les ressources entre jobs concurrents dans un même SparkContext.

| Mode ou politique | Utilisation et point clé |
|---|---|
| Local | Apprentissage sur une machine ; `local[2]` utilise deux threads locaux |
| Standalone | Gestionnaire de cluster intégré à Spark |
| YARN | Gestion des ressources Hadoop ; ApplicationMaster coordonne les ressources |
| Kubernetes | Driver et Executors s’exécutent sur Kubernetes avec une configuration adaptée |
| FIFO | Politique par défaut dans une application Spark : priorité aux jobs soumis en premier ; distincte des files YARN |
| FAIR | Partage plus équitable entre jobs ou pools concurrents, selon configuration et disponibilité |

Mode YARN cluster, schéma simplifié :
```mermaid
sequenceDiagram
 participant C as Client de soumission
 participant RM as YARN ResourceManager
 participant AM as ApplicationMaster et Driver
 participant E as Conteneur Executor
 C->>RM: Soumettre application
 RM->>AM: Démarrer ApplicationMaster et Driver
 AM->>RM: Demander ressources Executor
 RM->>E: Allouer et démarrer conteneur
 AM->>E: Driver ordonnance les tâches
 E-->>AM: Retourner état et résultats
```

Le NodeManager participe aussi au lancement du conteneur. En mode client, le Driver reste sur la machine de soumission et ApplicationMaster coordonne les ressources YARN ; la perte du client peut affecter l’application.

```python
# Définir avant la création du SparkContext
from pyspark.sql import SparkSession
spark = (SparkSession.builder.appName('FairSchedulingExample')
         .config('spark.scheduler.mode', 'FAIR').getOrCreate())
```

FAIR ne modifie pas automatiquement le nombre de tâches et ne remplace pas les files YARN. Les jobs concurrents supposent une soumission concurrente par l’application ; consulter la documentation des versions utilisées.

## Complément D : vérifiez votre compréhension

**Exercice 1 :** P1 contient 2 et 4 pour A ; P2 contient 9 pour A. Calculer les états partiels et la moyenne globale.  
**Réponse :** `(6,2)` et `(9,1)` donnent `(15,3)`, soit 5. La moyenne simple de 3 et 9 donne 6, ce qui est faux.

**Exercice 2 :** Deux stages impliquent-ils un seul job ?  
**Réponse :** Non. Les stages appartiennent à des jobs, mais une action peut déclencher plusieurs jobs ; consulter Spark UI.

**Exercice 3 :** De nombreux fichiers et une clé très fréquente apparaissent ensemble. Que vérifier ?  
**Réponse :** Mesurer séparément le coût des fichiers et tâches à la lecture, puis les tailles et durées des tâches après shuffle pour le déséquilibre de clé.

**Explorer :** Après le TP, comparer les onglets SQL et Stages, Exchange, les volumes de shuffle et les durées. Modifier la taille des données ou le nombre de partitions et noter les résultats ; un petit échantillon ne prédit pas la vitesse en production.

> Les prochaines leçons pourront approfondir RDD et DataFrame, shuffle, mémoire et cache, optimisation SQL et streaming. Cette première leçon en pose les bases.


## Références officielles
- [Architecture de cluster](https://spark.apache.org/docs/latest/cluster-overview.html)
- [RDD et shuffle](https://spark.apache.org/docs/latest/rdd-programming-guide.html)
- [Optimisation SQL et AQE](https://spark.apache.org/docs/latest/sql-performance-tuning.html)
- [Exécution sur YARN](https://spark.apache.org/docs/latest/running-on-yarn.html)
- [Interface Spark](https://spark.apache.org/docs/latest/web-ui.html)
- [Sémantique NULL](https://spark.apache.org/docs/latest/sql-ref-null-semantics.html)

- [Ordonnancement des jobs](https://spark.apache.org/docs/latest/job-scheduling.html)
- [Documentation Spark](https://spark.apache.org/docs/latest/)

