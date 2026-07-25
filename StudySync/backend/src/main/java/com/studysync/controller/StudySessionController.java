package com.studysync.controller;

import com.studysync.dto.StudySessionRequest;
import com.studysync.dto.StudySessionResponse;
import com.studysync.service.StudySessionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@CrossOrigin(origins = "*") // Allows requests from the frontend running on a different port/host
public class StudySessionController {

    private final StudySessionService studySessionService;

    public StudySessionController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    @PostMapping
    public ResponseEntity<StudySessionResponse> createSession(@Valid @RequestBody StudySessionRequest request) {
        StudySessionResponse response = studySessionService.createSession(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<StudySessionResponse>> getSessionsByUser(@RequestParam Long userId) {
        List<StudySessionResponse> responses = studySessionService.getSessionsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteSession(
            @PathVariable Long sessionId,
            @RequestParam Long userId) {
        studySessionService.deleteSession(sessionId, userId);
        return ResponseEntity.noContent().build();
    }
}
