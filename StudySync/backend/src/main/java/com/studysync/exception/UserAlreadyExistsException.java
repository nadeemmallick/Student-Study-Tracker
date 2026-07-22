package com.studysync.exception;

/**
 * Thrown when a registration attempt uses an email that already exists.
 * Results in HTTP 409 Conflict.
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }
}
