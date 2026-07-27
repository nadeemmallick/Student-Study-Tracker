package com.studysync.controller;

import com.studysync.dto.GoalRequest;
import com.studysync.dto.GoalResponse;
import com.studysync.service.GoalService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GoalController – REST endpoints for Goal Management.
 *
 * Day 7: Goal Management Module
 *
 * Endpoints:
 *   GET    /api/goals?userId={id}           – get all goals for user
 *   POST   /api/goals?userId={id}           – create a new goal
 *   PUT    /api/goals/{id}?userId={uid}     – update a goal
 *   PATCH  /api/goals/{id}/toggle?userId    – toggle completed status
 *   DELETE /api/goals/{id}?userId={uid}     – delete a goal
 */
@RestController
@RequestMapping("/api/goals")
@CrossOrigin(origins = "*")
public class GoalController {

    private static final Logger log = LoggerFactory.getLogger(GoalController.class);

    private final GoalService goalService;

    public GoalController(GoalService goalService) {
        this.goalService = goalService;
    }

    // ── GET all goals ─────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<GoalResponse>> getGoals(@RequestParam Long userId) {
        log.info("GET /api/goals?userId={}", userId);
        return ResponseEntity.ok(goalService.getGoalsByUser(userId));
    }

    // ── POST create goal ──────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(
            @RequestParam Long userId,
            @Valid @RequestBody GoalRequest request) {
        log.info("POST /api/goals?userId={}", userId);
        GoalResponse created = goalService.createGoal(userId, request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // ── PUT update goal ───────────────────────────────────────────────────────
    @PutMapping("/{goalId}")
    public ResponseEntity<GoalResponse> updateGoal(
            @PathVariable Long goalId,
            @RequestParam Long userId,
            @Valid @RequestBody GoalRequest request) {
        log.info("PUT /api/goals/{}?userId={}", goalId, userId);
        return ResponseEntity.ok(goalService.updateGoal(userId, goalId, request));
    }

    // ── PATCH toggle completed ────────────────────────────────────────────────
    @PatchMapping("/{goalId}/toggle")
    public ResponseEntity<GoalResponse> toggleGoal(
            @PathVariable Long goalId,
            @RequestParam Long userId) {
        log.info("PATCH /api/goals/{}/toggle?userId={}", goalId, userId);
        return ResponseEntity.ok(goalService.toggleGoal(userId, goalId));
    }

    // ── DELETE goal ───────────────────────────────────────────────────────────
    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(
            @PathVariable Long goalId,
            @RequestParam Long userId) {
        log.info("DELETE /api/goals/{}?userId={}", goalId, userId);
        goalService.deleteGoal(userId, goalId);
        return ResponseEntity.noContent().build();
    }
}
