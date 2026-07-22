package com.studysync.dto;

/**
 * ApiResponse – Generic Response Envelope
 *
 * Every REST endpoint wraps its payload in this so the frontend
 * always receives a consistent JSON structure:
 * {
 *   "success": true,
 *   "message": "...",
 *   "data": { ... }
 * }
 *
 * @param <T> The type of the response payload.
 */
public class ApiResponse<T> {

    private boolean success;
    private String  message;
    private T       data;

    public ApiResponse() {}

    private ApiResponse(Builder<T> builder) {
        this.success = builder.success;
        this.message = builder.message;
        this.data    = builder.data;
    }

    // ── Builder ──────────────────────────────────────────────────────────────

    public static <T> Builder<T> builder() { return new Builder<>(); }

    public static class Builder<T> {
        private boolean success;
        private String  message;
        private T       data;

        public Builder<T> success(boolean success) { this.success = success; return this; }
        public Builder<T> message(String message)  { this.message = message; return this; }
        public Builder<T> data(T data)             { this.data = data;       return this; }
        public ApiResponse<T> build()              { return new ApiResponse<>(this); }
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

    public boolean isSuccess()              { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage()              { return message; }
    public void setMessage(String message)  { this.message = message; }

    public T getData()                      { return data; }
    public void setData(T data)             { this.data = data; }
}
