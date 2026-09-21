# =========================================================
# StudySync Backend – Multi-Stage Dockerfile (Day 13)
# =========================================================

# ── Stage 1: Build Stage ──────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package executable JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2: Runtime Stage ────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy executable JAR from builder stage
COPY --from=builder /app/target/studysync-backend-*.jar app.jar

# Expose server port
EXPOSE 8080

# Environment variables defaults
ENV SPRING_PROFILES_ACTIVE=prod

# Run executable JAR
ENTRYPOINT ["java", "-jar", "app.jar"]
