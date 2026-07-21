# StudySync – Student Study Tracker

A web-based productivity platform that helps students manage their study routine, track daily study sessions, monitor academic progress, organize assignments, and achieve study goals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Java 17, Spring Boot 3.2.5 |
| ORM | Spring Data JPA + Hibernate |
| Database | MySQL 8.x |
| Authentication | Spring Security + BCrypt |
| Build Tool | Maven |
| Deployment | Render / Railway (Backend) · Netlify / Vercel (Frontend) |

---

## Features

- **Dashboard** – Today's hours, streak, pending assignments, subject progress
- **Study Sessions** – Log, edit, delete study sessions with duration tracking
- **Subject Management** – Add and manage subjects with color labels
- **Assignment Tracker** – Track assignments with due dates, priority, and status
- **Goal Management** – Set daily and weekly study goals
- **Analytics** – Weekly/monthly reports and subject-wise charts
- **Study Streak** – Track current streak and best streak

---

## Project Structure

```
StudySync/
├── frontend/
│   ├── login.html / register.html / dashboard.html
│   ├── study-session.html / subjects.html / goals.html
│   ├── assignments.html / analytics.html
│   ├── css/  (style.css, dashboard.css, forms.css, analytics.css)
│   ├── js/   (auth.js, dashboard.js, study.js, api.js, ...)
│   └── assets/ (images/, icons/, logo/)
│
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/studysync/
│       ├── StudySyncApplication.java
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── entity/
│       ├── dto/
│       ├── config/       ← SecurityConfig.java
│       ├── security/
│       └── exception/
│
└── database/
    └── schema.sql
```

---

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8.x
- VS Code + Live Server extension

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/studysync.git
cd studysync
```

### 2. Setup MySQL Database

Open MySQL Workbench and run:

```bash
mysql -u root -p < database/schema.sql
```

### 3. Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/studysync_db
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

### 4. Run Spring Boot Backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at: `http://localhost:8080`

### 5. Run Frontend

Open `frontend/login.html` with **VS Code Live Server** on port `5500`.

---

## Git Branches

| Branch | Purpose |
|---|---|
| `main` | Stable production-ready code |
| `dev-ui` | Frontend development |
| `dev-backend` | Backend / API development |
| `dev-db` | Database schema changes |

---

## API Endpoints (Planned)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET/POST/PUT/DELETE | `/api/subjects` | Subject CRUD |
| GET/POST/PUT/DELETE | `/api/sessions` | Study session CRUD |
| GET/POST/PUT/DELETE | `/api/assignments` | Assignment CRUD |
| GET/POST/PUT/DELETE | `/api/goals` | Goal CRUD |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/analytics` | Analytics data |

---

## Developer

**Nadeem Mallick**  
Solo Developer · 14-Day Build
