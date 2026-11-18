"""
Module de publication des événements RabbitMQ vers CloudAMQP.
Permet d'informer les autres microservices (notamment le Matching Service)
qu'un nouvel objet perdu ou trouvé vient d'être déclaré.
"""

import json
import logging
import pika

from app.config import settings
from app.models.item import Item

logger = logging.getLogger(__name__)


def publish_item_created(item: Item) -> bool:
    """
    Publie l'événement 'ItemCreated' sur l'échange RabbitMQ commun.
    
    Format du message :
    {
        "eventType": "ItemCreated",
        "itemId": 15,
        "userId": 1,
        "type": "LOST",
        "category": "BAG",
        "color": "BLACK",
        "location": "Bibliothèque",
        "description": "Sac noir...",
        "date": "2026-11-15",
        "status": "PENDING",
        "createdAt": "2026-11-18T21:00:00"
    }
    """
    if not settings.RABBITMQ_URL:
        logger.warning("RABBITMQ_URL non configuré. Événement ignoré.")
        return False

    try:
        # Préparation du payload de l'événement
        payload = {
            "eventType": "ItemCreated",
            "itemId": item.id,
            "userId": item.user_id,
            "type": str(item.type.value if hasattr(item.type, "value") else item.type),
            "category": item.category,
            "color": item.color,
            "location": item.location,
            "description": item.description,
            "date": item.date.isoformat() if hasattr(item.date, "isoformat") else str(item.date),
            "status": str(item.status.value if hasattr(item.status, "value") else item.status),
            "createdAt": item.created_at.isoformat() if item.created_at else None
        }

        # Connexion à CloudAMQP
        params = pika.URLParameters(settings.RABBITMQ_URL)
        connection = pika.BlockingConnection(params)
        channel = connection.channel()

        # Vérification / Déclaration passive de l'échange partagé
        channel.exchange_declare(
            exchange=settings.RABBITMQ_EXCHANGE,
            exchange_type="direct",
            durable=True
        )

        # Publication du message persistant
        channel.basic_publish(
            exchange=settings.RABBITMQ_EXCHANGE,
            routing_key=settings.RABBITMQ_ITEM_ROUTING_KEY,
            body=json.dumps(payload).encode("utf-8"),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2  # Message persistant (sauvegardé sur disque par RabbitMQ)
            )
        )

        connection.close()
        logger.info(
            f"[RabbitMQ] Événement ItemCreated publié avec succès pour l'objet ID {item.id} "
            f"(Routing Key: {settings.RABBITMQ_ITEM_ROUTING_KEY})"
        )
        return True

    except Exception as exc:
        # En cas d'erreur réseau, on journalise l'erreur sans bloquer la création de l'objet
        logger.error(f"[RabbitMQ] Erreur lors de la publication de l'événement ItemCreated : {exc}")
        return False
