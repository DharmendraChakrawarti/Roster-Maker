# Build Stage 1: Build Angular Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY smartroster-frontend/package*.json ./
RUN npm ci
COPY smartroster-frontend/ ./
RUN npm run build -- --configuration production

# Build Stage 2: Build Spring Boot Backend
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-build
WORKDIR /app/backend
COPY smartroster-backend/pom.xml ./
RUN mvn dependency:go-offline -B
COPY smartroster-backend/src ./src
# Copy Angular dist to Spring Boot static resources for unified single-service hosting
COPY --from=frontend-build /app/frontend/dist/smartroster-frontend/browser ./src/main/resources/static/
RUN mvn clean package -DskipTests

# Run Stage: Lean JRE runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
VOLUME /app/data
COPY --from=backend-build /app/backend/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dserver.port=${PORT}", "/app/app.jar"]
