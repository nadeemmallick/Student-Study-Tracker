package com.studysync.controller;

import com.studysync.dto.AssignmentRequest;
import com.studysync.dto.AssignmentResponse;
import com.studysync.service.AssignmentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AssignmentController – REST endpoints for Assignment management.
 *
 * Day 10: Removed @CrossOrigin(*) — CORS handled globally in SecurityConfig.
 *         userId is now extracted from the JWT token via authentication.getDetails().
 *         For create/update, the authenticated userId is injected into the request
 *         so the service always uses the token-verified identity.
 *
 * Endpoints:
 *   GET    /api/assignments          – list assignments for authenticated user
 *   POST   /api/assignments          – create assignment
 *   PUT    /api/assignments/{id}     – update assignment
 *   DELETE /api/assignments/{id}     – delete assignment
 */
@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private static final Logger log = LoggerFactory.getLogger(AssignmentController.class);

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ResponseEntity<AssignmentResponse> createAssignment(
            Authentication authentication,
            @Valid @RequestBody AssignmentRequest request) {
        Long userId = (Long) authentication.getDetails();
        log.info("POST /api/assignments — userId={}", userId);
        request.setUserId(userId); // enforce JWT identity; ignore any userId in body
        AssignmentResponse response = assignmentService.createAssignment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAssignmentsByUser(Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        log.info("GET /api/assignments — userId={}", userId);
        List<AssignmentResponse> responses = assignmentService.getAssignmentsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{assignmentId}")
    public ResponseEntity<AssignmentResponse> updateAssignment(
            @PathVariable Long assignmentId,
            Authentication authentication,
            @Valid @RequestBody AssignmentRequest request) {
        Long userId = (Long) authentication.getDetails();
        log.info("PUT /api/assignments/{} — userId={}", assignmentId, userId);
        request.setUserId(userId); // enforce JWT identity; ignore any userId in body
        AssignmentResponse response = assignmentService.updateAssignment(assignmentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        Long userId = (Long) authentication.getDetails();
        log.info("DELETE /api/assignments/{} — userId={}", assignmentId, userId);
        assignmentService.deleteAssignment(assignmentId, userId);
        return ResponseEntity.noContent().build();
    }
}
