package com.studysync.controller;

import com.studysync.dto.ApiResponse;
import com.studysync.dto.AuthResponse;
import com.studysync.dto.LoginRequest;
import com.studysync.dto.RegisterRequest;
import com.studysync.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController – REST endpoints for register and login.
 *
 * Public endpoints (no auth required):
 *   POST /api/auth/register
 *   POST /api/auth/login
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/register
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Request body:
     * { "name": "Nadeem", "email": "nadeem@example.com", "password": "mypassword" }
     *
     * Response 201:
     * { "success": true, "message": "Registration successful",
     *   "data": { "userId": 1, "name": "Nadeem", "email": "nadeem@example.com" } }
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {

        log.info("Registration attempt for email: {}", request.getEmail());
        AuthResponse authResponse = userService.registerUser(request);
        log.info("Registration successful for userId: {}", authResponse.getUserId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.<AuthResponse>builder()
                        .success(true)
                        .message("Registration successful")
                        .data(authResponse)
                        .build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/auth/login
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Request body:
     * { "email": "nadeem@example.com", "password": "mypassword" }
     *
     * Response 200:
     * { "success": true, "message": "Login successful",
     *   "data": { "userId": 1, "name": "Nadeem", "email": "nadeem@example.com" } }
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {

        log.info("Login attempt for email: {}", request.getEmail());
        AuthResponse authResponse = userService.loginUser(request);
        log.info("Login successful for userId: {}", authResponse.getUserId());

        return ResponseEntity.ok(ApiResponse.<AuthResponse>builder()
                .success(true)
                .message("Login successful")
                .data(authResponse)
                .build());
    }
}
