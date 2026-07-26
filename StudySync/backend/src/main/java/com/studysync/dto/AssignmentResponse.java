package com.studysync.dto;

import com.studysync.entity.Assignment;
import java.time.LocalDate;

public class AssignmentResponse {

    private Long assignmentId;
    private Long subjectId;
    private String subjectName;
    private String subjectColorCode;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String priority;
    private String status;

    public AssignmentResponse() {}

    private AssignmentResponse(Builder builder) {
        this.assignmentId = builder.assignmentId;
        this.subjectId = builder.subjectId;
        this.subjectName = builder.subjectName;
        this.subjectColorCode = builder.subjectColorCode;
        this.title = builder.title;
        this.description = builder.description;
        this.dueDate = builder.dueDate;
        this.priority = builder.priority;
        this.status = builder.status;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long assignmentId;
        private Long subjectId;
        private String subjectName;
        private String subjectColorCode;
        private String title;
        private String description;
        private LocalDate dueDate;
        private String priority;
        private String status;

        public Builder assignmentId(Long assignmentId) { this.assignmentId = assignmentId; return this; }
        public Builder subjectId(Long subjectId) { this.subjectId = subjectId; return this; }
        public Builder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public Builder subjectColorCode(String subjectColorCode) { this.subjectColorCode = subjectColorCode; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder dueDate(LocalDate dueDate) { this.dueDate = dueDate; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder status(String status) { this.status = status; return this; }
        
        public AssignmentResponse build() { return new AssignmentResponse(this); }
    }

    public static AssignmentResponse fromEntity(Assignment assignment) {
        if (assignment == null) return null;

        return AssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .subjectId(assignment.getSubject().getSubjectId())
                .subjectName(assignment.getSubject().getName())
                .subjectColorCode(assignment.getSubject().getColorCode())
                .title(assignment.getTitle())
                .description(assignment.getDescription())
                .dueDate(assignment.getDueDate())
                .priority(assignment.getPriority().name())
                .status(assignment.getStatus().name())
                .build();
    }

    // Getters
    public Long getAssignmentId() { return assignmentId; }
    public Long getSubjectId() { return subjectId; }
    public String getSubjectName() { return subjectName; }
    public String getSubjectColorCode() { return subjectColorCode; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public LocalDate getDueDate() { return dueDate; }
    public String getPriority() { return priority; }
    public String getStatus() { return status; }
}
