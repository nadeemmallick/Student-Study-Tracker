package com.studysync.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * ProfileUpdateRequest – payload for PUT /api/profile
 */
public class ProfileUpdateRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    public ProfileUpdateRequest() {}

    public String getName()  { return name; }
    public String getEmail() { return email; }

    public void setName(String name)   { this.name = name; }
    public void setEmail(String email) { this.email = email; }
}
