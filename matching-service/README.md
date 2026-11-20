# Smart Lost & Found — Matching Service (Étudiante 2)

Microservice Spring Boot responsable de la détection automatique des correspondances entre les annonces d'objets perdus (**LOST**) et d'objets trouvés (**FOUND**).

---

## 1. Informations Générales & Rôle Académique

- **Projet** : Smart Lost & Found
- **Rôle** : Étudiante 2 — Matching Service
- **Microservice** : `matching-service`
- **Port HTTP** : `8082`
- **Base de données** : MySQL (`matching_db`) via XAMPP (Port 3306)
- **Message Broker** : RabbitMQ via CloudAMQP
- **Technologies** : Java 17, Spring Boot 4.1.2, Spring Data JPA, Hibernate ORM, Maven Wrapper

---

## 2. Architecture & Organisation des Paquetages

Le code source est organisé selon une architecture en couches propre et découplée :

```text
com.smartlostfound.Matching/
├── config/
│   ├── MatchingProperties.java      # Configuration dynamique (poids des critères, seuil, tolérances)
│   └── RabbitMQConfig.java          # Configuration AMQP (DirectExchange, queues, bindings, JSON converter)
├── controller/
│   └── MatchingController.java      # Endpoints REST (consultation, test manuel d'annonces et évaluation)
├── dto/
│   ├── ItemCreatedEvent.java        # Contrat DTO pour l'événement entrant ItemCreated
│   ├── ItemDto.java                 # DTO de transfert pour les annonces
│   ├── MatchDto.java                # DTO de transfert pour les correspondances
│   └── MatchFoundEvent.java         # Contrat JSON strict pour l'événement sortant MatchFound
├── entity/
│   ├── Item.java                    # Entité JPA Item (copie locale répliquée dans matching_db)
│   ├── ItemStatus.java              # Enum (ACTIVE, RECOVERED)
│   ├── ItemType.java                # Enum (LOST, FOUND)
│   ├── Match.java                   # Entité JPA Match (table matches avec contrainte unique)
│   └── MatchStatus.java             # Enum (PROPOSED, NOTIFIED, CONFIRMED, REJECTED)
├── exception/
│   ├── DuplicateMatchException.java # Exception levée lors d'un doublon de matching
│   ├── GlobalExceptionHandler.java  # Gestionnaire global des exceptions REST (@RestControllerAdvice)
│   ├── InvalidEventException.java   # Exception levée lors d'un message RabbitMQ non conforme
│   └── ResourceNotFoundException.java# Exception 404
├── messaging/
│   ├── ItemCreatedConsumer.java     # Consommateur RabbitMQ pour matching.item.queue
│   └── MatchFoundPublisher.java     # Producteur RabbitMQ pour smartlostfound.exchange (match.found)
├── repository/
│   ├── ItemRepository.java          # Spring Data JPA Repository pour Item
│   └── MatchRepository.java         # Spring Data JPA Repository pour Match
├── service/
│   ├── MatchingAlgorithm.java       # Algorithme pur de calcul de score (indépendant de JPA et AMQP)
│   └── MatchingService.java         # Orchestration métier (sauvegarde, matching, publication)
└── MatchingServiceApplication.java  # Classe principale Spring Boot
```

---

## 3. Schéma de la Base de Données (`matching_db`)

Le microservice maintient son propre schéma isolé sans clé étrangère externe vers les autres services :

### Table `items`
| Colonne | Type | Description |
|---|---|---|
| `id` | `BIGINT PRIMARY KEY` | Identifiant de l'annonce (transmis par l'Item Service) |
| `user_id` | `BIGINT NOT NULL` | Propriétaire ou déclarant de l'objet |
| `title` | `VARCHAR(255) NOT NULL` | Titre de l'annonce |
| `type` | `ENUM('LOST','FOUND') NOT NULL` | Type de l'objet |
| `category` | `VARCHAR(100)` | Catégorie de l'objet (ex: Bagagerie, Électronique) |
| `color` | `VARCHAR(100)` | Couleur de l'objet |
| `location` | `VARCHAR(255)` | Lieu de l'événement |
| `event_date` | `DATE` | Date de la perte ou découverte |
| `description` | `TEXT` | Description détaillée |
| `status` | `ENUM('ACTIVE','RECOVERED') NOT NULL`| Statut de l'annonce |
| `created_at` | `DATETIME(6)` | Horodatage de réplication |

### Table `matches`
| Colonne | Type | Description |
|---|---|---|
| `id` | `BIGINT PRIMARY KEY AUTO_INCREMENT` | Identifiant unique de la correspondance |
| `lost_item_id` | `BIGINT NOT NULL` | Référence de l'objet PERDU (LOST) |
| `found_item_id` | `BIGINT NOT NULL` | Référence de l'objet TROUVÉ (FOUND) |
| `score` | `DOUBLE NOT NULL` | Score de similarité calculé (en %) |
| `status` | `ENUM('PROPOSED','NOTIFIED','CONFIRMED','REJECTED')` | Statut du matching |
| `created_at` | `DATETIME(6) NOT NULL` | Date de détection de la correspondance |

**Contrainte d'unicité anti-doublon** :
```sql
UNIQUE KEY uk_matches_lost_found (lost_item_id, found_item_id)
```

---

## 4. Algorithme de Matching

L'algorithme compare uniquement une annonce **LOST** avec une annonce **FOUND**, en ignorant les annonces ayant le statut **RECOVERED**.

### Pondération par défaut (configurable dans `application.properties`) :
- **Catégorie** : 30 %
  - Correspondance exacte normalisée : `1.0`
  - Inclusion (ex: "Sac à dos" vs "Sac") : `0.85`
  - Différent ou absent : `0.0`
- **Couleur** : 20 %
  - Couleur absente ou renseignée comme "inconnu" : note neutre de `0.5` (50 %) afin de ne pas pénaliser indûment une annonce où la couleur n'a pas été précisée.
  - Correspondance exacte : `1.0`
  - Inclusion : `0.85`
- **Lieu** : 25 %
  - Correspondance exacte : `1.0`
  - Inclusion : `0.85`
  - Similitude de Jaccard sur les mots-clés normalisés : `[0.0, 0.8]`
- **Date de l'événement** : 15 %
  - Même jour : `1.0`
  - Écart $\le$ 1 jour : `0.95`
  - Écart $\le$ 3 jours : `0.85`
  - Écart $\le$ 7 jours : `0.70`
  - Écart $\le$ 14 jours : `0.50`
  - Écart $\le$ 30 jours : `0.25`
  - Écart > 30 jours : `0.0`
  - Date absente : `0.5`
- **Description** : 10 %
  - Suppression des mots vides (stop words français/anglais).
  - Indice de similarité de Jaccard sur les ensembles de tokens restants.

**Seuil de matching par défaut** : **70.0 %**.

---

## 5. Contrats d'Événements RabbitMQ

### Échange RabbitMQ
- **Exchange** : `smartlostfound.exchange`
- **Type** : `DirectExchange`

### Événement sortant : `MatchFound`
- **Routing Key** : `match.found`
- **File cible** : `notification.match.queue`
- **Payload JSON strict** :
```json
{
  "userId": 1,
  "lostItemId": 12,
  "foundItemId": 34,
  "matchScore": 92.5,
  "message": "Correspondance trouvée (92.5%) : Sac noir à la bibliothèque"
}
```

### Événement entrant : `ItemCreated`
- **File déclarée** : `matching.item.queue`
- **Exchange** : `smartlostfound.exchange`
- **Routing key** : configurable via `${matching.item.routing-key:item.created}`

---

## 6. Endpoints REST (Tests et Démonstration)

| Méthode | URI | Description |
|---|---|---|
| `POST` | `/api/matching/items` | Enregistre une annonce dans `matching_db` et déclenche le matching |
| `GET` | `/api/matching/items` | Liste toutes les annonces répliquées |
| `GET` | `/api/matching/items/{id}` | Détail d'une annonce par ID |
| `GET` | `/api/matching/matches` | Liste toutes les correspondances détectées |
| `GET` | `/api/matching/matches/{id}` | Détail d'une correspondance par ID |
| `GET` | `/api/matching/matches/lost/{id}` | Correspondances pour un objet perdu |
| `GET` | `/api/matching/matches/found/{id}` | Correspondances pour un objet trouvé |
| `POST` | `/api/matching/evaluate` | Évalue directement le score entre 2 annonces sans les enregistrer |

---

## 7. Commandes d'Exécution

### Prérequis
1. Démarrer le serveur MySQL via le panneau de contrôle XAMPP.
2. Définir la variable d'environnement `CLOUDAMQP_URL` si vous souhaitez connecter l'instance CloudAMQP partagée.

### Exécuter les tests unitaires et d'intégration
Depuis le dossier `Matching-Service/Matching-Service` :
```bash
./mvnw.cmd test
```

### Lancer le microservice
```bash
./mvnw.cmd spring-boot:run
```
Le service démarre sur le port `8082`.
