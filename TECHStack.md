# StudySync – Tech Stack Specification

## Frontend

### HTML5

**Purpose:**

* Page Structure
* Forms
* Navigation
* Dashboard Layout

**Pages:**

* Login Page
* Register Page
* Dashboard
* Study Session Page
* Subjects Page
* Goals Page
* Assignments Page
* Analytics Page

---

### CSS3

**Purpose:**

* Styling
* Responsive Design
* Layout System
* Animations

**Features:**

* Flexbox
* CSS Grid
* Media Queries
* CSS Variables
* Card Components
* Smooth Transitions
* Light/Dark Theme (Future)

---

### JavaScript (Vanilla JS)

**Purpose:**

* Client-side Logic
* Form Validation
* API Calls
* Dynamic UI Updates
* Dashboard Interaction

**Responsibilities:**

* Login Validation
* Registration Validation
* Add/Edit/Delete Subjects
* Add/Edit/Delete Study Sessions
* Assignment Management
* Goal Management
* Dashboard Updates
* Charts Integration

---

# Backend

### Java Spring Boot

**Purpose:**

Backend REST API Development

**Responsibilities:**

* User Authentication APIs
* Subject CRUD APIs
* Study Session CRUD APIs
* Assignment CRUD APIs
* Goal CRUD APIs
* Dashboard APIs
* Analytics APIs
* Validation
* Exception Handling

---

### Spring MVC

**Purpose:**

* REST Controller Layer
* Request Mapping
* Response Handling

---

### Spring Data JPA

**Purpose:**

* Database Operations
* Repository Layer
* CRUD Operations

---

### Hibernate

**Purpose:**

* ORM (Object Relational Mapping)

**Responsibilities:**

* Entity Mapping
* Database Communication
* Query Generation

---

# Authentication

### Spring Security

**Authentication Method**

* Email & Password

**Features**

* User Registration
* Secure Login
* Logout
* Password Encryption
* JWT Authentication (Future)
* Route Protection

---

# Database

### MySQL

**Database Type**

* Relational Database

**Tables**

* users
* subjects
* study_sessions
* assignments
* goals

**Purpose**

* Store User Information
* Store Subjects
* Store Study Sessions
* Store Goals
* Store Assignments

---

# API Testing

### Postman

**Purpose**

* Test REST APIs
* Verify CRUD Operations
* Debug Backend APIs

---

# Build Tool

### Maven

**Purpose**

* Dependency Management
* Project Build
* Package Management

---

# Deployment

### Render / Railway

**Purpose**

* Deploy Spring Boot Backend

---

### Netlify / Vercel

**Purpose**

* Deploy Frontend

---

# Version Control

### Git

**Purpose**

* Source Code Management
* Branch Management
* Team Collaboration

---

### GitHub

**Purpose**

* Repository Hosting
* Pull Requests
* Code Reviews
* GitHub Issues
* Project Management
* Contribution Tracking

**Branches**

* main
* dev-ui
* dev-backend
* dev-db

---

# Development Tools

### IntelliJ IDEA

**Purpose**

* Spring Boot Development

---

### Visual Studio Code

**Purpose**

* Frontend Development

**Recommended Extensions**

* Live Server
* Prettier
* GitLens
* ESLint
* Spring Boot Extension Pack

---

### MySQL Workbench

**Purpose**

* Database Design
* Query Execution
* Database Management

---

# Project Architecture

Frontend

│

├── HTML

├── CSS

└── JavaScript

│

▼

Spring Boot REST API

│

▼

Service Layer

│

▼

Spring Data JPA

│

▼

Hibernate

│

▼

MySQL Database

---

# Folder Structure

```text
StudySync/

├── frontend/
│
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── study-session.html
│   ├── assignments.html
│   ├── goals.html
│   ├── analytics.html
│
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   ├── forms.css
│   │   └── analytics.css
│
│   ├── js/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── study.js
│   │   ├── assignment.js
│   │   ├── goal.js
│   │   └── api.js
│
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── logo/
│
├── backend/
│
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   ├── config/
│   ├── security/
│   └── exception/
│
├── database/
│
│   └── schema.sql
│
├── README.md
│
├── pom.xml
│
└── .gitignore
```

---

# Technical Requirements

* Responsive Design
* Mobile-First UI
* Secure Authentication
* RESTful APIs
* CRUD Operations
* Password Encryption
* Clean Code Architecture
* Modular JavaScript
* Layered Spring Boot Architecture
* Cross-Browser Compatibility
* Fast Loading Performance
* Error Handling
* Form Validation

---

# Final Stack Summary

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend

* Java
* Spring Boot
* Spring MVC
* Spring Data JPA
* Hibernate

### Database

* MySQL

### Authentication

* Spring Security

### API Testing

* Postman

### Build Tool

* Maven

### Deployment

* Render / Railway (Backend)
* Netlify / Vercel (Frontend)

### Version Control

* Git
* GitHub

### Design Style

* Modern Student Dashboard
* Minimal UI
* Mobile Responsive
* Clean Academic Theme
