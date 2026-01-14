FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /app

# Copy parent pom and all module poms for dependency resolution
COPY pom.xml ./pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY telemetry-ingest/pom.xml ./telemetry-ingest/pom.xml
COPY hazard-analyzer/pom.xml ./hazard-analyzer/pom.xml
COPY mission-control/pom.xml ./mission-control/pom.xml

# Copy source code for this module
COPY hazard-analyzer/src ./hazard-analyzer/src

# Build the application
RUN apk add --no-cache maven && \
    mvn -f hazard-analyzer/pom.xml clean package -DskipTests

FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=build /app/hazard-analyzer/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
