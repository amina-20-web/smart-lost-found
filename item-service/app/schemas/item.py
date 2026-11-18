"""
Schémas Pydantic pour la validation et la sérialisation des objets (Items).
"""

from datetime import datetime, date as DateType
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.item import ItemType, ItemStatus


class ItemBase(BaseModel):
    """Champs communs partagés par tous les schémas d'un objet."""
    user_id: int = Field(..., description="ID de l'utilisateur qui déclare l'objet", examples=[1])
    title: str = Field(..., min_length=2, max_length=150, description="Titre descriptif de l'objet", examples=["Sac à dos noir"])
    type: ItemType = Field(..., description="Type de déclaration : LOST ou FOUND", examples=[ItemType.LOST])
    category: str = Field(..., min_length=2, max_length=50, description="Catégorie (BAG, ELECTRONICS, KEYS...)", examples=["BAG"])
    color: str = Field(..., min_length=2, max_length=50, description="Couleur principale", examples=["BLACK"])
    location: str = Field(..., min_length=2, max_length=150, description="Lieu de perte ou de découverte", examples=["Bibliothèque universitaire"])
    description: str = Field(..., min_length=2, description="Description détaillée de l'objet", examples=["Sac à dos noir contenant des cahiers et une trousse."])
    date: DateType = Field(..., description="Date à laquelle l'objet a été perdu ou trouvé", examples=["2026-11-15"])


class ItemCreate(ItemBase):
    """
    Schéma utilisé pour la création d'un objet (POST /api/items).
    Le statut initial est toujours PENDING par défaut.
    """
    pass


class ItemUpdate(BaseModel):
    """
    Schéma utilisé pour la modification complète d'un objet (PUT /api/items/{id}).
    """
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    category: Optional[str] = Field(None, min_length=2, max_length=50)
    color: Optional[str] = Field(None, min_length=2, max_length=50)
    location: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = Field(None, min_length=2)
    date: Optional[DateType] = None


class ItemStatusUpdate(BaseModel):
    """
    Schéma utilisé pour modifier spécifiquement le statut (PATCH /api/items/{id}/status).
    """
    status: ItemStatus = Field(..., description="Nouveau statut de l'objet", examples=[ItemStatus.MATCHED])


class ItemResponse(ItemBase):
    """
    Schéma de sortie retourné par l'API (avec l'identifiant et les dates générées).
    from_attributes=True permet à Pydantic de convertir directement un objet SQLAlchemy en JSON.
    """
    id: int
    status: ItemStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
