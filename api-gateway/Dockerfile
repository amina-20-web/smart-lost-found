# ════════════════════════════════════════════════════════════════
#  Dockerfile — api-gateway
#  Multi-stage : Maven 3.9 (build) → Eclipse Temurin 21 JRE (run)
# ════════════════════════════════════════════════════════════════

# ── Stage 1 : Build Maven ──────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# ── Stage 2 : Image d'exécution JRE slim ──────────────────────
FROM eclipse-temurin:21-jre-jammy AS runtime

LABEL maintainer="smart-lost-found"
LABEL service="api-gateway"

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar
RUN chown appuser:appgroup app.jar

USER appuser

EXPOSE 8080

ENV SPRING_PROFILES_ACTIVE=docker
ENV JAVA_OPTS="-Xms128m -Xmx256m -XX:+UseContainerSupport"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
