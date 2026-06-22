# --- Stage 1: Build Stage ---
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy configuration and source code
COPY pom.xml .
COPY src ./src

# Build package (skip test to avoid database/external service connection requirements during build)
RUN mvn clean package -DskipTests

# --- Stage 2: Runtime Stage ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the generated JAR file from build stage
COPY --from=build /app/target/*.jar app.jar

# Default environment variables
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod

# Expose the application port
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
