package com.studysync.controller;

import com.studysync.dto.PasswordChangeRequest;
import com.studysync.dto.ProfileResponse;
import com.studysync.dto.ProfileUpdateRequest;
import com.studysync.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ProfileController – REST endpoints for user profile management.
 *
 * Day 12:
 *   GET  /api/profile          – get current user's profile
 *   PUT  /api/profile          – update name / email
 *   PUT  /api/profile/password – change password
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    private Long extractUserId(Authentication auth) {
        return (Long) auth.getDetails();
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication auth) {
        return ResponseEntity.ok(userService.getProfile(extractUserId(auth)));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication auth) {
        return ResponseEntity.ok(userService.updateProfile(extractUserId(auth), request));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody PasswordChangeRequest request,
            Authentication auth) {
        userService.changePassword(extractUserId(auth), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
