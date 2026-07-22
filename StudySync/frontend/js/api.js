/* =========================================================
   api.js – Base API layer for StudySync frontend
   All backend calls go through this file.
   Base URL points to Spring Boot on port 8080.
========================================================= */

const API_BASE = "http://localhost:8080/api";

/**
 * Core fetch wrapper.
 * Always sends/receives JSON.
 * Returns parsed response body on success.
 * Throws an Error with the server's message on failure.
 */
async function apiFetch(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        // Throw the server's error message so the UI can display it
        throw new Error(data.message || "Something went wrong. Please try again.");
    }

    return data;
}

// ── Auth helpers ────────────────────────────────────────────────────────────

export async function registerUser(name, email, password) {
    return apiFetch("/auth/register", "POST", { name, email, password });
}

export async function loginUser(email, password) {
    return apiFetch("/auth/login", "POST", { email, password });
}

// ── Session helpers ──────────────────────────────────────────────────────────

/**
 * Save logged-in user to sessionStorage.
 * SessionStorage clears when the browser tab closes (good for security).
 */
export function saveSession(userData) {
    sessionStorage.setItem("studysync_user", JSON.stringify(userData));
}

export function getSession() {
    const stored = sessionStorage.getItem("studysync_user");
    return stored ? JSON.parse(stored) : null;
}

export function clearSession() {
    sessionStorage.removeItem("studysync_user");
}

export function isLoggedIn() {
    return getSession() !== null;
}

/**
 * Guard for protected pages.
 * Call at top of dashboard/any page that needs login.
 * Redirects to login if no session found.
 */
export function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "/login.html";
    }
}
