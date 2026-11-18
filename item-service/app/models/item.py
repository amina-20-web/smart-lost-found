"""
Modèle SQLAlchemy représentant la table 'items' dans MySQL.
"""

from datetime import datetime, date
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    Enum as SQLEnum,
    func
)

from app.database import Base


class ItemType(str, enum.Enum):
    """Type de déclaration : Objet Perdu (LOST) ou Objet Trouvé (FOUND)."""
    LOST = "LOST"
    FOUND = "FOUND"


class ItemStatus(str, enum.Enum):
    """Cycle de vie d'un objet déclaré."""
    PENDING = "PENDING"      # En attente de correspondance
    MATCHED = "MATCHED"      # Correspondance détectée par le Matching Service
    CLAIMED = "CLAIMED"      # Réclamé et restitué à son propriétaire
    ARCHIVED = "ARCHIVED"    # Déclaration archivée / clôturée


class Item(Base):
    """
    Table 'items' stockant les objets perdus et trouvés.
    """
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Clé essentielle pour relier l'objet à l'utilisateur connecté (pour les notifications)
    user_id = Column(Integer, nullable=False, index=True)

    title = Column(String(150), nullable=False)
    type = Column(SQLEnum(ItemType), nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)
    color = Column(String(50), nullable=False)
    location = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    date = Column(Date, nullable=False)
    
    status = Column(
        SQLEnum(ItemStatus),
        nullable=False,
        default=ItemStatus.PENDING,
        index=True
    )

    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    def __repr__(self):
        return f"<Item id={self.id} title='{self.title}' type='{self.type}' status='{self.status}'>"
