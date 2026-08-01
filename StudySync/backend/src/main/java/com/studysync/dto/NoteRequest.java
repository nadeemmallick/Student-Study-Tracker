package com.studysync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class NoteRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String content;

    private Long subjectId; // Optional link to a subject

    private Long userId;

    public NoteRequest() {}

    public String getTitle() { return title; }
    public String getContent() { return content; }
    public Long getSubjectId() { return subjectId; }
    public Long getUserId() { return userId; }

    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
    public void setSubjectId(Long subjectId) { this.subjectId = subjectId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
