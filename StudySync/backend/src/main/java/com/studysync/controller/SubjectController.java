package com.studysync.controller;

import com.studysync.dto.SubjectRequest;
import com.studysync.dto.SubjectResponse;
import com.studysync.service.SubjectService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SubjectController – REST endpoints for Subject management.
 *
 * Day 10: Removed @CrossOrigin(*) — CORS handled globally in SecurityConfig.
 *         userId is now extracted from the JWT token via authentication.getDetails().
 *         For create/update, the authenticated userId is injected into the request
 *         so the service always uses the token-verified identity.
 *
 * Endpoints:
 *   GET    /api/subjects         – list subjects for authenticated user
 *   POST   /api/subjects         – create subject
 *   PUT    /api/subjects/{id}    – update subject
 *   DELETE /api/subjects/{id}    – delete subject
 */
@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private static final Logger log = LoggerFactory.getLogger(SubjectController.class);

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> createSubject(
            Authentication authentication,
            @Valid @RequestBody SubjectRequest request) {
        Long userId = (Long) authentication.getDetails();
        log.info("POST /api/subjects — userId={}", userId);
        request.setUserId(userId); // enforce JWT identity; ignore any userId in body
        SubjectResponse response = subjectService.createSubject(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getSubjectsByUser(Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        log.info("GET /api/subjects — userId={}", userId);
        List<SubjectResponse> responses = subjectService.getSubjectsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{subjectId}")
    public ResponseEntity<SubjectResponse> updateSubject(
            @PathVariable Long subjectId,
            Authentication authentication,
            @Valid @RequestBody SubjectRequest request) {
        Long userId = (Long) authentication.getDetails();
        log.info("PUT /api/subjects/{} — userId={}", subjectId, userId);
        request.setUserId(userId); // enforce JWT identity; ignore any userId in body
        SubjectResponse response = subjectService.updateSubject(subjectId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long subjectId,
            Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        log.info("DELETE /api/subjects/{} — userId={}", subjectId, userId);
        subjectService.deleteSubject(subjectId, userId);
        return ResponseEntity.noContent().build();
    }
}
