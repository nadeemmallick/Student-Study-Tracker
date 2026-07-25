package com.studysync.dto;

import com.studysync.entity.StudySession;
import java.time.LocalDate;
import java.time.LocalTime;

public class StudySessionResponse {

    private Long sessionId;
    private Long subjectId;
    private String subjectName;
    private String subjectColorCode;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer durationMinutes;
    private String notes;

    public StudySessionResponse() {}

    private StudySessionResponse(Builder builder) {
        this.sessionId = builder.sessionId;
        this.subjectId = builder.subjectId;
        this.subjectName = builder.subjectName;
        this.subjectColorCode = builder.subjectColorCode;
        this.date = builder.date;
        this.startTime = builder.startTime;
        this.endTime = builder.endTime;
        this.durationMinutes = builder.durationMinutes;
        this.notes = builder.notes;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long sessionId;
        private Long subjectId;
        private String subjectName;
        private String subjectColorCode;
        private LocalDate date;
        private LocalTime startTime;
        private LocalTime endTime;
        private Integer durationMinutes;
        private String notes;

        public Builder sessionId(Long sessionId) { this.sessionId = sessionId; return this; }
        public Builder subjectId(Long subjectId) { this.subjectId = subjectId; return this; }
        public Builder subjectName(String subjectName) { this.subjectName = subjectName; return this; }
        public Builder subjectColorCode(String subjectColorCode) { this.subjectColorCode = subjectColorCode; return this; }
        public Builder date(LocalDate date) { this.date = date; return this; }
        public Builder startTime(LocalTime startTime) { this.startTime = startTime; return this; }
        public Builder endTime(LocalTime endTime) { this.endTime = endTime; return this; }
        public Builder durationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; return this; }
        public Builder notes(String notes) { this.notes = notes; return this; }
        
        public StudySessionResponse build() { return new StudySessionResponse(this); }
    }

    public static StudySessionResponse fromEntity(StudySession session) {
        if (session == null) return null;

        return StudySessionResponse.builder()
                .sessionId(session.getSessionId())
                .subjectId(session.getSubject().getSubjectId())
                .subjectName(session.getSubject().getName())
                .subjectColorCode(session.getSubject().getColorCode())
                .date(session.getDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .durationMinutes(session.getDurationMinutes())
                .notes(session.getNotes())
                .build();
    }

    public Long getSessionId() { return sessionId; }
    public Long getSubjectId() { return subjectId; }
    public String getSubjectName() { return subjectName; }
    public String getSubjectColorCode() { return subjectColorCode; }
    public LocalDate getDate() { return date; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public String getNotes() { return notes; }
}
