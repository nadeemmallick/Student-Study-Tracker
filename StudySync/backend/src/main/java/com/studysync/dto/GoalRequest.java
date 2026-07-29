package com.studysync.dto;

import com.studysync.entity.Goal;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * GoalRequest – DTO for creating and updating a Goal.
 *
 * Day 7: Goal Management Module
 */
public class GoalRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    @NotNull(message = "Goal type is required")
    private Goal.GoalType goalType;

    @NotNull(message = "Target hours is required")
    @DecimalMin(value = "0.1", message = "Target hours must be at least 0.1")
    @DecimalMax(value = "168.0", message = "Target hours cannot exceed 168 (1 week)")
    private BigDecimal targetHours;

    private Boolean completed;

    // ── Getters & Setters ─────────────────────────────────────────────────────
    public String getTitle()                       { return title; }
    public void setTitle(String title)             { this.title = title; }
    public Goal.GoalType getGoalType()             { return goalType; }
    public void setGoalType(Goal.GoalType g)       { this.goalType = g; }
    public BigDecimal getTargetHours()             { return targetHours; }
    public void setTargetHours(BigDecimal h)       { this.targetHours = h; }
    public Boolean getCompleted()                  { return completed; }
    public void setCompleted(Boolean completed)    { this.completed = completed; }
}
