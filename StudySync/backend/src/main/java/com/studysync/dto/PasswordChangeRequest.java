package com.studysync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * PasswordChangeRequest – payload for PUT /api/profile/password
 */
public class PasswordChangeRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "New password must be at least 6 characters")
    private String newPassword;

    public PasswordChangeRequest() {}

    public String getCurrentPassword() { return currentPassword; }
    public String getNewPassword()     { return newPassword; }

    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    public void setNewPassword(String newPassword)         { this.newPassword = newPassword; }
}
