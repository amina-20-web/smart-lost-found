"""
Contrôleur REST (Router) pour les opérations CRUD sur les objets (Items).
Préfixe : /api/items
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.events.publisher import publish_item_created
from app.models.item import ItemType, ItemStatus
from app.schemas.item import (
    ItemCreate,
    ItemUpdate,
    ItemStatusUpdate,
    ItemResponse
)
from app.services.item_service import ItemService

router = APIRouter(
    prefix="/api/items",
    tags=["Objets (Lost & Found)"]
)


@router.post(
    "",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Déclarer un nouvel objet perdu ou trouvé"
)
def create_item(
    item_in: ItemCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Crée une déclaration d'objet perdu (LOST) ou trouvé (FOUND).
    Le statut initial est automatiquement positionné à PENDING.
    Déclenche en tâche de fond la publication de l'événement ItemCreated vers RabbitMQ.
    """
    new_item = ItemService.create_item(db=db, item_in=item_in)
    
    # Envoi asynchrone de l'événement pour ne pas ralentir la réponse HTTP
    background_tasks.add_task(publish_item_created, new_item)
    
    return new_item


@router.get(
    "",
    response_model=List[ItemResponse],
    summary="Récupérer la liste des objets déclarés"
)
def get_items(
    type: Optional[ItemType] = Query(None, description="Filtrer par type (LOST ou FOUND)"),
    status: Optional[ItemStatus] = Query(None, description="Filtrer par statut (PENDING, MATCHED, CLAIMED, ARCHIVED)"),
    user_id: Optional[int] = Query(None, description="Filtrer les objets déclarés par un utilisateur spécifique"),
    skip: int = Query(0, ge=0, description="Nombre d'éléments à sauter (pagination)"),
    limit: int = Query(100, ge=1, le=100, description="Nombre maximum d'éléments à retourner"),
    db: Session = Depends(get_db)
):
    """
    Renvoie tous les objets enregistrés, avec possibilité de filtrer par type, statut et utilisateur.
    """
    return ItemService.get_items(
        db=db,
        skip=skip,
        limit=limit,
        item_type=type,
        status=status,
        user_id=user_id
    )


@router.get(
    "/{id}",
    response_model=ItemResponse,
    summary="Consulter les détails d'un objet spécifique"
)
def get_item(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Retourne les informations détaillées d'un objet par son ID.
    Renvoie une erreur 404 si l'objet n'existe pas.
    """
    item = ItemService.get_item_by_id(db=db, item_id=id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"L'objet avec l'identifiant {id} n'a pas été trouvé."
        )
    return item


@router.put(
    "/{id}",
    response_model=ItemResponse,
    summary="Modifier les informations d'un objet"
)
def update_item(
    id: int,
    item_in: ItemUpdate,
    db: Session = Depends(get_db)
):
    """
    Modifie les informations d'un objet existant.
    Renvoie une erreur 404 si l'objet n'existe pas.
    """
    updated_item = ItemService.update_item(db=db, item_id=id, item_in=item_in)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Impossible de modifier : l'objet avec l'identifiant {id} n'existe pas."
        )
    return updated_item


@router.patch(
    "/{id}/status",
    response_model=ItemResponse,
    summary="Modifier le statut d'un objet"
)
def update_item_status(
    id: int,
    status_in: ItemStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Permet de faire évoluer le cycle de vie d'un objet (ex: de PENDING vers MATCHED ou CLAIMED).
    """
    updated_item = ItemService.update_item_status(db=db, item_id=id, status_in=status_in)
    if not updated_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Impossible de changer le statut : l'objet avec l'identifiant {id} n'existe pas."
        )
    return updated_item


@router.delete(
    "/{id}",
    status_code=status.HTTP_200_OK,
    summary="Supprimer une déclaration d'objet"
)
def delete_item(
    id: int,
    db: Session = Depends(get_db)
):
    """
    Supprime définitivement une déclaration de la base de données.
    """
    success = ItemService.delete_item(db=db, item_id=id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Impossible de supprimer : l'objet avec l'identifiant {id} n'existe pas."
        )
    return {"message": f"L'objet avec l'identifiant {id} a été supprimé avec succès."}
