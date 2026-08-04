package com.studysync.dto;

/**
 * ProfileResponse – returned by GET /api/profile and PUT /api/profile
 */
public class ProfileResponse {

    private Long   userId;
    private String name;
    private String email;
    private String message;

    public ProfileResponse() {}

    public ProfileResponse(Long userId, String name, String email, String message) {
        this.userId  = userId;
        this.name    = name;
        this.email   = email;
        this.message = message;
    }

    public Long   getUserId() { return userId; }
    public String getName()   { return name; }
    public String getEmail()  { return email; }
    public String getMessage(){ return message; }

    public void setUserId(Long userId)   { this.userId = userId; }
    public void setName(String name)     { this.name = name; }
    public void setEmail(String email)   { this.email = email; }
    public void setMessage(String msg)   { this.message = msg; }
}
