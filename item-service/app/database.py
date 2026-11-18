"""
Configuration de la base de données avec SQLAlchemy.
Gère le moteur de connexion (Engine), la fabrique de sessions (SessionLocal)
et le générateur de session pour FastAPI (get_db).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# Création du moteur SQLAlchemy
# pool_pre_ping=True vérifie que la connexion est toujours active avant de l'utiliser
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

# Fabrique de sessions pour interagir avec la base
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Classe de base dont hériteront tous nos modèles SQLAlchemy
Base = declarative_base()


def get_db():
    """
    Générateur de session de base de données (Dependency Injection FastAPI).
    Ouvre une session par requête HTTP et la referme automatiquement à la fin.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
