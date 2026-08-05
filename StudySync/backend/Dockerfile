# =========================================================
# StudySync Backend – Multi-Stage Dockerfile (Day 13)
# =========================================================

# ── Stage 1: Build Stage ──────────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package executable JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: Runtime Stage ────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy executable JAR from builder stage
COPY --from=builder /app/target/studysync-backend-*.jar app.jar

# Expose server port
EXPOSE 8080

# Configure healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Environment variables defaults
ENV SPRING_PROFILES_ACTIVE=prod

# Run executable JAR
ENTRYPOINT ["java", "-jar", "app.jar"]
