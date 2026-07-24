package com.studysync.controller;

import com.studysync.dto.SubjectRequest;
import com.studysync.dto.SubjectResponse;
import com.studysync.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin(origins = "*") // Allows requests from the frontend running on a different port/host
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> createSubject(@Valid @RequestBody SubjectRequest request) {
        SubjectResponse response = subjectService.createSubject(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getSubjectsByUser(@RequestParam Long userId) {
        List<SubjectResponse> responses = subjectService.getSubjectsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{subjectId}")
    public ResponseEntity<SubjectResponse> updateSubject(
            @PathVariable Long subjectId, 
            @Valid @RequestBody SubjectRequest request) {
        SubjectResponse response = subjectService.updateSubject(subjectId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{subjectId}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long subjectId,
            @RequestParam Long userId) {
        subjectService.deleteSubject(subjectId, userId);
        return ResponseEntity.noContent().build();
    }
}
