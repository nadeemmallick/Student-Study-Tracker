package com.studysync.controller;

import com.studysync.dto.StudySessionRequest;
import com.studysync.dto.StudySessionResponse;
import com.studysync.service.StudySessionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * StudySessionController – REST endpoints for Study Session management.
 *
 * Day 10: Removed @CrossOrigin(*) — CORS handled globally in SecurityConfig.
 *         userId is now extracted from the JWT token via authentication.getDetails().
 *
 * Endpoints:
 *   GET    /api/sessions       – list sessions for authenticated user
 *   POST   /api/sessions       – log a new session
 *   DELETE /api/sessions/{id}  – delete a session
 */
@RestController
@RequestMapping("/api/sessions")
public class StudySessionController {

    private static final Logger log = LoggerFactory.getLogger(StudySessionController.class);

    private final StudySessionService studySessionService;

    public StudySessionController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    @PostMapping
    public ResponseEntity<StudySessionResponse> createSession(
            Authentication authentication,
            @Valid @RequestBody StudySessionRequest request) {
        Long userId = (Long) authentication.getDetails();
        log.info("POST /api/sessions — userId={}", userId);
        request.setUserId(userId); // enforce JWT identity; ignore any userId in body
        StudySessionResponse response = studySessionService.createSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<StudySessionResponse>> getSessionsByUser(Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        log.info("GET /api/sessions — userId={}", userId);
        List<StudySessionResponse> responses = studySessionService.getSessionsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        log.info("DELETE /api/sessions/{} — userId={}", sessionId, userId);
        studySessionService.deleteSession(sessionId, userId);
        return ResponseEntity.noContent().build();
    }
}
