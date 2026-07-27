-- ================================================
-- StudySync – Database Schema
-- MySQL 8.x
-- ================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS studysync_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE studysync_db;

-- ================================================
-- TABLE: users
-- Stores student account information
-- ================================================
CREATE TABLE IF NOT EXISTS users (
    user_id     BIGINT          NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(150)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,               -- BCrypt hashed
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id)
);

-- ================================================
-- TABLE: subjects
-- Subjects a student is studying
-- Column names match Subject.java entity exactly.
-- ================================================
CREATE TABLE IF NOT EXISTS subjects (
    subject_id      BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    name            VARCHAR(100)    NOT NULL,                      -- maps to Subject.name
    description     VARCHAR(500)    DEFAULT NULL,                  -- maps to Subject.description
    color_code      VARCHAR(7)      DEFAULT '#2563EB',             -- maps to Subject.colorCode (@Column name="color_code")
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (subject_id),
    CONSTRAINT fk_subjects_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- ================================================
-- TABLE: study_sessions
-- Each logged study session for a student
-- Column names + types match StudySession.java entity exactly.
-- ================================================
CREATE TABLE IF NOT EXISTS study_sessions (
    session_id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL,
    subject_id          BIGINT          NOT NULL,
    date                DATE            NOT NULL,                  -- maps to StudySession.date (LocalDate)
    start_time          TIME            NOT NULL,                  -- maps to StudySession.startTime (LocalTime)
    end_time            TIME            NOT NULL,                  -- maps to StudySession.endTime (LocalTime)
    duration_minutes    INT             NOT NULL,                  -- maps to StudySession.durationMinutes (@Column name="duration_minutes")
    notes               VARCHAR(1000)   DEFAULT NULL,              -- maps to StudySession.notes
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (session_id),
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sessions_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
        ON DELETE CASCADE
);

-- ================================================
-- TABLE: assignments
-- Assignments with due dates and priority
-- ================================================
CREATE TABLE IF NOT EXISTS assignments (
    assignment_id   BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    subject_id      BIGINT          NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    description     VARCHAR(2000)   DEFAULT NULL,              -- maps to Assignment.description
    due_date        DATE            NOT NULL,
    priority        ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL DEFAULT 'MEDIUM',
    status          ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (assignment_id),
    CONSTRAINT fk_assignments_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_assignments_subject
        FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
        ON DELETE CASCADE
);

-- ================================================
-- TABLE: goals
-- Daily and weekly study goals
-- ================================================
CREATE TABLE IF NOT EXISTS goals (
    goal_id         BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    goal_type       ENUM('DAILY', 'WEEKLY') NOT NULL DEFAULT 'DAILY',
    target_hours    DECIMAL(5,2)    NOT NULL DEFAULT 0.00,  -- Target study hours
    completed       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (goal_id),
    CONSTRAINT fk_goals_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- ================================================
-- Verify all tables created
-- ================================================
SHOW TABLES;
