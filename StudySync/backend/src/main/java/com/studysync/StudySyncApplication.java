package com.studysync;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * StudySync – Student Study Tracker
 * Main Spring Boot Application Entry Point
 */
@SpringBootApplication
public class StudySyncApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudySyncApplication.class, args);
        System.out.println("========================================");
        System.out.println("  StudySync Backend is Running!");
        System.out.println("  URL: http://localhost:8080");
        System.out.println("========================================");
    }
}
