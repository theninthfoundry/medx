# MEDX — Hospital Records & Clinical Portal

> **🌐 Live Web Application Deployment:**  
> 👉 **[https://theninthfoundry.github.io/medx/](https://theninthfoundry.github.io/medx/)**

A modern hospital records management system featuring both a **Live Interactive Web Application** and a **Java Desktop Application (Swing + SQLite)**.

---

## 🚀 Live Web Deployment
The web portal is deployed live via GitHub Pages:
- **Live URL:** [https://theninthfoundry.github.io/medx/](https://theninthfoundry.github.io/medx/)
- Features real-time patient admissions, medical staff directory, visit scheduling, and clinical diagnostic histories with local persistence.

---

## 💻 Desktop Application (.jar)

### Requirements
- JDK 17+
- Maven 3.8+

### Run Locally
From the project folder:
```bash
mvn clean compile exec:java
```
Or build the standalone executable JAR:
```bash
mvn clean package
java -jar target/MEDX.jar
```
The local database `blackwell.db` is created automatically in the project folder. All records persist after closing the app.

---

## 🩺 System Features
- **Control Centre / Dashboard**: Real-time patient, doctor, and appointment metrics with quick-action shortcuts.
- **Patient Records**: Register, search, update, and manage admissions with blood groups and contact info.
- **Medical Staff Directory**: Physician specialties, clinic rooms, and contact details.
- **Appointment Scheduling**: Book consultations, link doctors and patients, track scheduled/completed statuses.
- **Clinical Records**: Permanent diagnosis notes, treatment plans, prescriptions, and clinical history.
- **Validation & Persistence**: Data integrity checks and automatic persistent storage.

---

## ⚙️ GitHub Actions CI/CD
On every push to `main`, GitHub Actions automatically:
1. **Compiles & Packages** the standalone executable `MEDX.jar`.
2. **Publishes GitHub Releases** tagged `latest` with downloadable `.jar` binaries.
3. **Deploys Live Web App** directly to GitHub Pages at [https://theninthfoundry.github.io/medx/](https://theninthfoundry.github.io/medx/).
