"""
Smart Lost & Found - Item Service
Point d'entrée principal de l'API FastAPI.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers.items import router as items_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestionnaire de cycle de vie de l'application FastAPI.
    Crée automatiquement les tables dans MySQL au démarrage si elles n'existent pas.
    """
    Base.metadata.create_all(bind=engine)
    yield


# Initialisation de l'application FastAPI avec métadonnées pour Swagger UI
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Microservice responsable de la gestion des objets perdus et trouvés.\n\n"
        "Fonctionnalités :\n"
        "- Enregistrer des objets perdus (LOST) et trouvés (FOUND)\n"
        "- Consulter la liste et le détail des objets\n"
        "- Mettre à jour les informations et le statut (PENDING, MATCHED, CLAIMED, ARCHIVED)\n"
        "- Supprimer une déclaration d'objet"
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Configuration CORS pour autoriser les requêtes du Frontend (React / Vite sur port 5173)
# et de l'API Gateway (port 8085)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production ou développement, autorise les requêtes de l'équipe
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion du routeur CRUD des objets
app.include_router(items_router)


@app.get("/", tags=["Général"])
def read_root():
    """
    Point d'entrée racine : permet de vérifier que le microservice répond.
    """
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": settings.APP_VERSION,
        "docs_url": "/docs"
    }


@app.get("/health", tags=["Monitoring"])
def health_check():
    """
    Endpoint de santé (Health Check) : utilisé pour surveiller l'état du service
    dans les architectures distribuées.
    """
    return {
        "status": "healthy",
        "database": "connected"
    }
