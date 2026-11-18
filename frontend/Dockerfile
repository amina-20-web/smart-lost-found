# ════════════════════════════════════════════════════════════════
#  Dockerfile — frontend (React + Vite)
#  Multi-stage : Node 20 (build) → Nginx alpine (serve)
# ════════════════════════════════════════════════════════════════

# ── Stage 1 : Build Vite ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier package.json et lock file en premier (cache npm install)
COPY package.json package-lock.json* ./

# Installer les dépendances (ci est plus rapide et strict en CI/CD)
RUN npm ci

# Copier le reste du code source
COPY . .

# Build de production Vite
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

# ── Stage 2 : Nginx alpine ─────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

LABEL maintainer="smart-lost-found"
LABEL service="frontend"

# Remplacer la config nginx par la nôtre
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Vite (dossier dist/) dans le répertoire nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Port exposé par nginx
EXPOSE 80

# Nginx en mode non-daemon (compatible Docker)
CMD ["nginx", "-g", "daemon off;"]
