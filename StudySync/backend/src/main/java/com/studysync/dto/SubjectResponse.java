package com.studysync.dto;

import com.studysync.entity.Subject;
import java.time.LocalDateTime;

public class SubjectResponse {

    private Long subjectId;
    private String name;
    private String description;
    private String colorCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SubjectResponse() {}

    private SubjectResponse(Builder builder) {
        this.subjectId = builder.subjectId;
        this.name = builder.name;
        this.description = builder.description;
        this.colorCode = builder.colorCode;
        this.createdAt = builder.createdAt;
        this.updatedAt = builder.updatedAt;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long subjectId;
        private String name;
        private String description;
        private String colorCode;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Builder subjectId(Long subjectId) { this.subjectId = subjectId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder colorCode(String colorCode) { this.colorCode = colorCode; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public SubjectResponse build() { return new SubjectResponse(this); }
    }

    // Helper method to map Entity to DTO
    public static SubjectResponse fromEntity(Subject subject) {
        if (subject == null) return null;
        
        return SubjectResponse.builder()
                .subjectId(subject.getSubjectId())
                .name(subject.getName())
                .description(subject.getDescription())
                .colorCode(subject.getColorCode())
                .createdAt(subject.getCreatedAt())
                .updatedAt(subject.getUpdatedAt())
                .build();
    }

    public Long getSubjectId() { return subjectId; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public String getColorCode() { return colorCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
