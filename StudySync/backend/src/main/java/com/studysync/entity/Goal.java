package com.studysync.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Goal Entity – Represents a study goal for a user.
 *
 * Day 7: Goal Management Module
 */
@Entity
@Table(name = "goals")
public class Goal {

    // ── Enums ─────────────────────────────────────────────────────────────────
    public enum GoalType {
        DAILY,
        WEEKLY
    }

    // ── Fields ────────────────────────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "goal_id")
    private Long goalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "goal_type", nullable = false)
    private GoalType goalType;

    @Column(name = "target_hours", nullable = false, precision = 5, scale = 2)
    private BigDecimal targetHours;

    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // ── Constructors ──────────────────────────────────────────────────────────
    public Goal() {}

    private Goal(Builder builder) {
        this.user        = builder.user;
        this.title       = builder.title;
        this.goalType    = builder.goalType;
        this.targetHours = builder.targetHours;
        this.completed   = builder.completed != null ? builder.completed : false;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private String title;
        private GoalType goalType;
        private BigDecimal targetHours;
        private Boolean completed;

        public Builder user(User user)                   { this.user = user; return this; }
        public Builder title(String title)               { this.title = title; return this; }
        public Builder goalType(GoalType goalType)       { this.goalType = goalType; return this; }
        public Builder targetHours(BigDecimal hours)     { this.targetHours = hours; return this; }
        public Builder completed(Boolean completed)      { this.completed = completed; return this; }
        public Goal build()                              { return new Goal(this); }
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────
    public Long getGoalId()                      { return goalId; }
    public User getUser()                        { return user; }
    public void setUser(User user)               { this.user = user; }
    public String getTitle()                     { return title; }
    public void setTitle(String title)           { this.title = title; }
    public GoalType getGoalType()                { return goalType; }
    public void setGoalType(GoalType goalType)   { this.goalType = goalType; }
    public BigDecimal getTargetHours()           { return targetHours; }
    public void setTargetHours(BigDecimal h)     { this.targetHours = h; }
    public Boolean getCompleted()                { return completed; }
    public void setCompleted(Boolean completed)  { this.completed = completed; }
    public LocalDateTime getCreatedAt()          { return createdAt; }
    public LocalDateTime getUpdatedAt()          { return updatedAt; }
}
