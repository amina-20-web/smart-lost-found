"""
Service métier pour la gestion des objets (Items).
Isole la logique métier et les requêtes SQLAlchemy des contrôleurs HTTP.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.item import Item, ItemType, ItemStatus
from app.schemas.item import ItemCreate, ItemUpdate, ItemStatusUpdate


class ItemService:
    @staticmethod
    def create_item(db: Session, item_in: ItemCreate) -> Item:
        """
        Crée et enregistre un nouvel objet perdu ou trouvé dans la base de données.
        """
        db_item = Item(
            user_id=item_in.user_id,
            title=item_in.title,
            type=item_in.type,
            category=item_in.category.upper(),
            color=item_in.color.upper(),
            location=item_in.location,
            description=item_in.description,
            date=item_in.date,
            status=ItemStatus.PENDING  # Statut initial par défaut
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def get_items(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        item_type: Optional[ItemType] = None,
        status: Optional[ItemStatus] = None,
        user_id: Optional[int] = None
    ) -> List[Item]:
        """
        Récupère la liste des objets avec pagination et filtres optionnels.
        """
        query = db.query(Item)

        if item_type:
            query = query.filter(Item.type == item_type)
        if status:
            query = query.filter(Item.status == status)
        if user_id:
            query = query.filter(Item.user_id == user_id)

        return query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_item_by_id(db: Session, item_id: int) -> Optional[Item]:
        """
        Recherche un objet par son identifiant unique.
        """
        return db.query(Item).filter(Item.id == item_id).first()

    @staticmethod
    def update_item(db: Session, item_id: int, item_in: ItemUpdate) -> Optional[Item]:
        """
        Met à jour les informations modifiables d'un objet.
        """
        db_item = db.query(Item).filter(Item.id == item_id).first()
        if not db_item:
            return None

        update_data = item_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key in ["category", "color"] and isinstance(value, str):
                value = value.upper()
            setattr(db_item, key, value)

        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def update_item_status(db: Session, item_id: int, status_in: ItemStatusUpdate) -> Optional[Item]:
        """
        Met à jour uniquement le statut d'un objet (ex: PENDING -> MATCHED -> CLAIMED).
        """
        db_item = db.query(Item).filter(Item.id == item_id).first()
        if not db_item:
            return None

        db_item.status = status_in.status
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def delete_item(db: Session, item_id: int) -> bool:
        """
        Supprime un objet de la base de données.
        Retourne True si supprimé, False si introuvable.
        """
        db_item = db.query(Item).filter(Item.id == item_id).first()
        if not db_item:
            return False

        db.delete(db_item)
        db.commit()
        return True
