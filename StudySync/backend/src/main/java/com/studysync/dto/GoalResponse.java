package com.studysync.dto;

import com.studysync.entity.Goal;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * GoalResponse – DTO returned to the frontend for a Goal.
 *
 * Day 7: Goal Management Module
 */
public class GoalResponse {

    private Long goalId;
    private Long userId;
    private String title;
    private String goalType;
    private BigDecimal targetHours;
    private Boolean completed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GoalResponse() {}

    private GoalResponse(Builder builder) {
        this.goalId      = builder.goalId;
        this.userId      = builder.userId;
        this.title       = builder.title;
        this.goalType    = builder.goalType;
        this.targetHours = builder.targetHours;
        this.completed   = builder.completed;
        this.createdAt   = builder.createdAt;
        this.updatedAt   = builder.updatedAt;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long goalId;
        private Long userId;
        private String title;
        private String goalType;
        private BigDecimal targetHours;
        private Boolean completed;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder goalId(Long v)           { this.goalId = v; return this; }
        public Builder userId(Long v)           { this.userId = v; return this; }
        public Builder title(String v)          { this.title = v; return this; }
        public Builder goalType(String v)       { this.goalType = v; return this; }
        public Builder targetHours(BigDecimal v){ this.targetHours = v; return this; }
        public Builder completed(Boolean v)     { this.completed = v; return this; }
        public Builder createdAt(LocalDateTime v){ this.createdAt = v; return this; }
        public Builder updatedAt(LocalDateTime v){ this.updatedAt = v; return this; }
        public GoalResponse build()             { return new GoalResponse(this); }
    }

    /**
     * Static factory – converts Goal entity to GoalResponse DTO.
     */
    public static GoalResponse from(Goal goal) {
        return GoalResponse.builder()
                .goalId(goal.getGoalId())
                .userId(goal.getUser().getUserId())
                .title(goal.getTitle())
                .goalType(goal.getGoalType().name())
                .targetHours(goal.getTargetHours())
                .completed(goal.getCompleted())
                .createdAt(goal.getCreatedAt())
                .updatedAt(goal.getUpdatedAt())
                .build();
    }

    // ── Getters ───────────────────────────────────────────────────────────────
    public Long getGoalId()             { return goalId; }
    public Long getUserId()             { return userId; }
    public String getTitle()            { return title; }
    public String getGoalType()         { return goalType; }
    public BigDecimal getTargetHours()  { return targetHours; }
    public Boolean getCompleted()       { return completed; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
