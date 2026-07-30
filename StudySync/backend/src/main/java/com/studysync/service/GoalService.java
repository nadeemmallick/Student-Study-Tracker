package com.studysync.service;

import com.studysync.dto.GoalRequest;
import com.studysync.dto.GoalResponse;
import com.studysync.entity.Goal;
import com.studysync.entity.User;
import com.studysync.exception.ResourceNotFoundException;
import com.studysync.exception.UnauthorizedException;
import com.studysync.repository.GoalRepository;
import com.studysync.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * GoalService – Business logic for Goal Management.
 *
 * Day 7: Goal Management Module
 *
 * Handles:
 *  - Fetching all goals for a user
 *  - Creating a new goal
 *  - Updating a goal (title, type, hours, or completed status)
 *  - Toggling completed status
 *  - Deleting a goal
 */
@Service
@SuppressWarnings("null")
public class GoalService {

    private static final Logger log = LoggerFactory.getLogger(GoalService.class);

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public GoalService(GoalRepository goalRepository, UserRepository userRepository) {
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET all goals for a user
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Returns all goals for the given userId, ordered newest first.
     */
    @Transactional(readOnly = true)
    public List<GoalResponse> getGoalsByUser(Long userId) {
        log.info("Fetching all goals for userId: {}", userId);
        return goalRepository.findByUser_UserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(GoalResponse::from)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE a new goal
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Creates a new goal for a user.
     */
    @Transactional
    public GoalResponse createGoal(Long userId, GoalRequest request) {
        log.info("Creating goal for userId: {} — title: {}", userId, request.getTitle());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Goal goal = Goal.builder()
                .user(user)
                .title(request.getTitle())
                .goalType(request.getGoalType())
                .targetHours(request.getTargetHours())
                .completed(false)
                .build();

        Goal saved = goalRepository.save(goal);
        log.info("Goal created with id: {}", saved.getGoalId());
        return GoalResponse.from(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE a goal
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Updates title, goalType, targetHours, or completed status of a goal.
     */
    @Transactional
    public GoalResponse updateGoal(Long userId, Long goalId, GoalRequest request) {
        log.info("Updating goalId: {} for userId: {}", goalId, userId);

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        // Security: ensure the goal belongs to the requesting user
        if (!goal.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Goal does not belong to this user");
        }

        goal.setTitle(request.getTitle());
        goal.setGoalType(request.getGoalType());
        goal.setTargetHours(request.getTargetHours());
        if (request.getCompleted() != null) {
            goal.setCompleted(request.getCompleted());
        }

        Goal updated = goalRepository.save(goal);
        log.info("Goal updated: {}", updated.getGoalId());
        return GoalResponse.from(updated);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOGGLE completed status
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Flips the completed status of a goal (true → false, false → true).
     */
    @Transactional
    public GoalResponse toggleGoal(Long userId, Long goalId) {
        log.info("Toggling goalId: {} for userId: {}", goalId, userId);

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        if (!goal.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Goal does not belong to this user");
        }

        goal.setCompleted(!Boolean.TRUE.equals(goal.getCompleted()));
        Goal toggled = goalRepository.save(goal);
        log.info("Goal {} toggled to completed={}", goalId, toggled.getCompleted());
        return GoalResponse.from(toggled);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE a goal
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Deletes a goal by ID after verifying ownership.
     */
    @Transactional
    public void deleteGoal(Long userId, Long goalId) {
        log.info("Deleting goalId: {} for userId: {}", goalId, userId);

        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found with id: " + goalId));

        if (!goal.getUser().getUserId().equals(userId)) {
            throw new UnauthorizedException("Goal does not belong to this user");
        }

        goalRepository.delete(goal);
        log.info("Goal deleted: {}", goalId);
    }
}
