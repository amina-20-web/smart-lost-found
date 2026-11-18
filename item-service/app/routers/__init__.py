"""
Module des routeurs FastAPI pour les différents endpoints.
"""

from app.routers.items import router as items_router

__all__ = ["items_router"]
