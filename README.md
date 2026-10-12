# MEDX — Hospital Records

A modern Java desktop hospital records management application built with Java Swing and SQLite.

## Requirements
- JDK 17+
- Maven 3.8+

## Run Locally
From this folder:
```bash
mvn clean compile exec:java
```
Or build the standalone executable JAR:
```bash
mvn clean package
java -jar target/MEDX.jar
```
The local database `medx.db` / `blackwell.db` is created automatically in the project folder. Your records persist after closing the app.

## Features
- Dashboard with patient, doctor and appointment counts
- Patient records: add, search, update, delete
- Doctor directory: add, search, update, delete
- Appointments: create, search, update status, delete
- Patient medical records: add, view, delete
- Input validation and confirmation before destructive actions
- SQLite database with foreign keys and persistent storage

## GitHub Actions CI/CD
On every push to `main`, GitHub Actions automatically:
1. Compiles the Java code with JDK 17
2. Packages a self-contained executable `MEDX.jar`
3. Publishes it under GitHub **Releases** & **Artifacts** for 1-click download.
