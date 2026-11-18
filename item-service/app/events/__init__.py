"""
Module de publication d'événements vers RabbitMQ.
"""

from app.events.publisher import publish_item_created

__all__ = ["publish_item_created"]
