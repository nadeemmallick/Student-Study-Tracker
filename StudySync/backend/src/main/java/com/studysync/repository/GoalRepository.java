package com.studysync.repository;

import com.studysync.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * GoalRepository – Data access layer for Goal entity.
 *
 * Day 7: Goal Management Module
 */
@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {

    /**
     * Find all goals for a given user, ordered by creation date descending.
     */
    List<Goal> findByUser_UserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find all goals for a user filtered by type (DAILY or WEEKLY).
     */
    List<Goal> findByUser_UserIdAndGoalTypeOrderByCreatedAtDesc(Long userId, Goal.GoalType goalType);
}
