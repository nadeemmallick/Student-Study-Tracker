package com.studysync.exception;

/**
 * Thrown when login credentials (email or password) are invalid.
 * Results in HTTP 401 Unauthorized.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
