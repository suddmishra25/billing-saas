# Build stage
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw
COPY src ./src
RUN ./mvnw -q -DskipTests clean package

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/Billingsoftware-0.0.1-SNAPSHOT.jar app.jar
ENV JAVA_OPTS="-Xmx512m"
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]