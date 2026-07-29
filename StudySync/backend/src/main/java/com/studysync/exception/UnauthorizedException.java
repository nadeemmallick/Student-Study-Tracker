package com.studysync.exception;

/**
 * UnauthorizedException – thrown when an authenticated user attempts to
 * access or modify a resource that belongs to another user.
 *
 * Day 10: Audit Fix #3 — proper HTTP 403 responses.
 * Handled by GlobalExceptionHandler → returns HTTP 403.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
