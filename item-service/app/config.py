"""
Module de configuration centralisée de l'application.
Utilise Pydantic Settings pour charger les variables d'environnement depuis le fichier .env.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Smart Lost & Found - Item Service"
    APP_VERSION: str = "1.0.0"

    # Base de données (MySQL via XAMPP)
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/item_db"

    # Bus d'événements RabbitMQ (CloudAMQP)
    RABBITMQ_URL: str = ""
    RABBITMQ_EXCHANGE: str = "smartlostfound.exchange"
    RABBITMQ_ITEM_ROUTING_KEY: str = "item.created"

    # Charge automatiquement les variables depuis .env
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
