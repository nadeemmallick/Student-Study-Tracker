package com.studysync.exception;

/**
 * ResourceNotFoundException – thrown when a requested entity does not exist.
 *
 * Day 10: Audit Fix #3 — proper HTTP 404 responses.
 * Handled by GlobalExceptionHandler → returns HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
