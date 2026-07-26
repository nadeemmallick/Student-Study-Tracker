package com.studysync.controller;

import com.studysync.dto.AssignmentRequest;
import com.studysync.dto.AssignmentResponse;
import com.studysync.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@CrossOrigin(origins = "*")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ResponseEntity<AssignmentResponse> createAssignment(@Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse response = assignmentService.createAssignment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAssignmentsByUser(@RequestParam Long userId) {
        List<AssignmentResponse> responses = assignmentService.getAssignmentsByUserId(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{assignmentId}")
    public ResponseEntity<AssignmentResponse> updateAssignment(
            @PathVariable Long assignmentId,
            @Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse response = assignmentService.updateAssignment(assignmentId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<Void> deleteAssignment(
            @PathVariable Long assignmentId,
            @RequestParam Long userId) {
        assignmentService.deleteAssignment(assignmentId, userId);
        return ResponseEntity.noContent().build();
    }
}
