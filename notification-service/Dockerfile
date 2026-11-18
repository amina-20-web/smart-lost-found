# ════════════════════════════════════════════════════════════════
#  Dockerfile — notification-service
#  Multi-stage : Maven 3.9 (build) → Eclipse Temurin 21 JRE (run)
# ════════════════════════════════════════════════════════════════

# ── Stage 1 : Build Maven ──────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copier le POM en premier pour profiter du cache de couches Maven
COPY pom.xml .

# Télécharger toutes les dépendances (mise en cache si pom.xml inchangé)
RUN mvn dependency:go-offline -B

# Copier le code source
COPY src ./src

# Compiler et packager (sans les tests pour accélérer le build Docker)
RUN mvn package -DskipTests -B

# ── Stage 2 : Image d'exécution JRE slim ──────────────────────
FROM eclipse-temurin:21-jre-jammy AS runtime

# Métadonnées
LABEL maintainer="smart-lost-found"
LABEL service="notification-service"

# Utilisateur non-root pour la sécurité
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copier uniquement le JAR compilé depuis le stage builder
COPY --from=builder /app/target/*.jar app.jar

# Changer le propriétaire du fichier
RUN chown appuser:appgroup app.jar

USER appuser

# Port exposé par notification-service
EXPOSE 8083

# Variables d'environnement surchargeables via docker-compose ou -e
ENV SPRING_PROFILES_ACTIVE=docker
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseContainerSupport"

# Commande de démarrage avec JVM tuning pour conteneurs
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
