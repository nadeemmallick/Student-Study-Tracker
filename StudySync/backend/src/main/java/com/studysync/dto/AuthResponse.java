package com.studysync.dto;

/**
 * AuthResponse DTO – returned on successful register or login.
 */
public class AuthResponse {

    private String message;
    private Long   userId;
    private String name;
    private String email;

    public AuthResponse() {}

    private AuthResponse(Builder builder) {
        this.message = builder.message;
        this.userId  = builder.userId;
        this.name    = builder.name;
        this.email   = builder.email;
    }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String message;
        private Long   userId;
        private String name;
        private String email;

        public Builder message(String message) { this.message = message; return this; }
        public Builder userId(Long userId)     { this.userId = userId;   return this; }
        public Builder name(String name)       { this.name = name;       return this; }
        public Builder email(String email)     { this.email = email;     return this; }
        public AuthResponse build()            { return new AuthResponse(this); }
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public String getMessage()              { return message; }
    public void setMessage(String message)  { this.message = message; }

    public Long getUserId()                 { return userId; }
    public void setUserId(Long userId)      { this.userId = userId; }

    public String getName()                 { return name; }
    public void setName(String name)        { this.name = name; }

    public String getEmail()                { return email; }
    public void setEmail(String email)      { this.email = email; }
}
