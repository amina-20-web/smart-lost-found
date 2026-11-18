# 📦 Item Service – Smart Lost & Found

Microservice de gestion des objets perdus et trouvés, développé avec **FastAPI**, **SQLAlchemy**, **MySQL** et **RabbitMQ (CloudAMQP)**.

Ce service fait partie de l'architecture distribuée **Smart Lost & Found** (Projet Master Génie Logiciel - Systèmes Répartis et Distribués).

---

## 🎯 Responsabilités du Service

1. **Enregistrer** les déclarations d'objets perdus (`LOST`) et trouvés (`FOUND`).
2. **Consulter** la liste des objets avec filtres avancés (par type, statut, utilisateur) et pagination.
3. **Consulter** le détail d'un objet par son identifiant unique.
4. **Mettre à jour** les caractéristiques d'un objet.
5. **Gérer le cycle de vie** de l'objet via son statut (`PENDING` ➔ `MATCHED` ➔ `CLAIMED` ➔ `ARCHIVED`).
6. **Supprimer** une déclaration.
7. **Publier des événements asynchrones** vers RabbitMQ (`item.created`) lorsqu'un objet est créé, afin de déclencher le calcul de similarité dans le *Matching Service*.

---

## 🏗️ Architecture & Technologies

* **Langage :** Python 3.13
* **Framework Web :** FastAPI & Uvicorn
* **Base de données :** MySQL (via XAMPP)
* **ORM & Pilote :** SQLAlchemy 2.0 & PyMySQL
* **Validation des données :** Pydantic v2
* **Message Broker :** RabbitMQ hébergé sur CloudAMQP (AMQPS / TLS)
* **Client RabbitMQ :** Pika

---

## 📡 Endpoints de l'API REST (Port 8000)

Toutes les routes sont préfixées par `/api/items` pour une intégration directe avec l'API Gateway (port 8085).

| Méthode | Endpoint | Description | Code HTTP |
|---|---|---|---|
| `GET` | `/` | Informations et état du microservice | `200 OK` |
| `GET` | `/health` | Health Check (Monitoring système distribué) | `200 OK` |
| `POST` | `/api/items` | Déclarer un nouvel objet (publie l'événement RabbitMQ) | `201 Created` |
| `GET` | `/api/items` | Récupérer les objets (filtres : `type`, `status`, `user_id`) | `200 OK` |
| `GET` | `/api/items/{id}` | Consulter un objet par son ID | `200 OK` / `404` |
| `PUT` | `/api/items/{id}` | Modifier les informations d'un objet | `200 OK` / `404` |
| `PATCH` | `/api/items/{id}/status` | Modifier le statut d'un objet | `200 OK` / `404` |
| `DELETE` | `/api/items/{id}` | Supprimer une déclaration | `200 OK` / `404` |

Documentation interactive Swagger : **`http://localhost:8000/docs`**

---

## 📬 Événement RabbitMQ publié

* **Exchange partagé :** `smartlostfound.exchange` (type `direct`, durable)
* **Routing Key :** `item.created`
* **Format du payload JSON :**

```json
{
  "eventType": "ItemCreated",
  "itemId": 15,
  "userId": 1,
  "type": "LOST",
  "category": "BAG",
  "color": "BLACK",
  "location": "Bibliothèque universitaire",
  "description": "Sac à dos noir contenant des cahiers",
  "date": "2026-11-15",
  "status": "PENDING",
  "createdAt": "2026-11-18T21:00:00"
}
```

---

## 🚀 Démarrage local (Windows CMD)

1. **Lancer MySQL** dans le panneau de contrôle XAMPP.
2. Ouvrir l'invite de commande (CMD) :
   ```cmd
   cd C:\Users\Admin\Documents\smart-lost-found\item-service
   .venv\Scripts\activate.bat
   uvicorn app.main:app --reload --port 8000
   ```
3. Accéder à l'API :
   * Documentation Swagger : `http://127.0.0.1:8000/docs`
   * phpMyAdmin : `http://localhost/phpmyadmin` (base `item_db`)
