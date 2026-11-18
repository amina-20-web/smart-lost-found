# ════════════════════════════════════════════════════════════════
# Dockerfile — Item Service (FastAPI)
# Microservice de gestion des objets perdus et trouvés
# ════════════════════════════════════════════════════════════════

FROM python:3.13-slim

WORKDIR /app

# Empêche Python d'écrire des fichiers .pyc et assure des logs en direct
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copie de l'application
COPY app/ ./app/

# Exposition du port HTTP
EXPOSE 8000

# Lancement d'Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
