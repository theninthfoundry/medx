# BLACKWELL — Hospital Records

A small, end-to-end Java desktop PBL built with Java Swing and SQLite. Black-and-white, bold-minimal UI; no logo or external images.

## Requirements
- JDK 17+
- Maven 3.8+

## Run
From this folder:
```bash
mvn clean compile exec:java
```
The local database `blackwell.db` is created automatically in the project folder. Your records persist after closing the app.

## Features
- Dashboard with patient, doctor and appointment counts
- Patient records: add, search, update, delete
- Doctor directory: add, search, update, delete
- Appointments: create, search, update status, delete
- Patient medical records: add, view, delete
- Input validation and confirmation before destructive actions
- SQLite database with foreign keys and persistent storage

## Notes
This is an educational demo. Use fictional data only. It is not designed or certified for real patient care or production use.
