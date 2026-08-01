package com.studysync.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long noteId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = true)
    private Subject subject;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public Note() {}

    private Note(Builder builder) {
        this.user = builder.user;
        this.subject = builder.subject;
        this.title = builder.title;
        this.content = builder.content;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private User user;
        private Subject subject;
        private String title;
        private String content;

        public Builder user(User user) { this.user = user; return this; }
        public Builder subject(Subject subject) { this.subject = subject; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder content(String content) { this.content = content; return this; }
        public Note build() { return new Note(this); }
    }

    public Long getNoteId() { return noteId; }
    public User getUser() { return user; }
    public Subject getSubject() { return subject; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setSubject(Subject subject) { this.subject = subject; }
    public void setTitle(String title) { this.title = title; }
    public void setContent(String content) { this.content = content; }
}
