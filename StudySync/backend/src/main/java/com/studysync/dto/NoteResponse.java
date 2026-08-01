package com.studysync.dto;

import com.studysync.entity.Note;

import java.time.LocalDateTime;

public class NoteResponse {

    private Long noteId;
    private String title;
    private String content;
    private Long subjectId;
    private String subjectName;
    private String subjectColorCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NoteResponse() {}

    public static NoteResponse fromEntity(Note note) {
        NoteResponse response = new NoteResponse();
        response.noteId = note.getNoteId();
        response.title = note.getTitle();
        response.content = note.getContent();
        
        if (note.getSubject() != null) {
            response.subjectId = note.getSubject().getSubjectId();
            response.subjectName = note.getSubject().getName();
            response.subjectColorCode = note.getSubject().getColorCode();
        }
        
        response.createdAt = note.getCreatedAt();
        response.updatedAt = note.getUpdatedAt();
        return response;
    }

    public Long getNoteId() { return noteId; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public Long getSubjectId() { return subjectId; }
    public String getSubjectName() { return subjectName; }
    public String getSubjectColorCode() { return subjectColorCode; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
