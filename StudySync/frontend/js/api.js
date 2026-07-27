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
    
    // Some endpoints might return 204 No Content
    if (response.status === 204) {
        return { ok: true };
    }

    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = {}; // If response is not JSON
    }

    // Wrap the response so we can check res.ok and await res.json() like native fetch,
    // which is what subjects.js and study.js expect.
    return {
        ok: response.ok,
        json: async () => data,
        status: response.status
    };
}

// ── Global API Object ────────────────────────────────────────────────────────
window.api = {
    get:    (endpoint)        => apiFetch(endpoint, "GET"),
    post:   (endpoint, body)  => apiFetch(endpoint, "POST",   body),
    put:    (endpoint, body)  => apiFetch(endpoint, "PUT",    body),
    patch:  (endpoint, body)  => apiFetch(endpoint, "PATCH",  body),
    delete: (endpoint)        => apiFetch(endpoint, "DELETE")
};

// ── Auth & Session Helpers ──────────────────────────────────────────────────
window.auth = {
    registerUser: (name, email, password) => api.post("/auth/register", { name, email, password }),
    loginUser: (email, password) => api.post("/auth/login", { email, password }),
    saveSession: (userData) => sessionStorage.setItem("studysync_user", JSON.stringify(userData)),
    getSession: () => {
        const stored = sessionStorage.getItem("studysync_user");
        return stored ? JSON.parse(stored) : null;
    },
    clearSession: () => sessionStorage.removeItem("studysync_user"),
    isLoggedIn: () => window.auth.getSession() !== null,
    requireAuth: () => {
        if (!window.auth.isLoggedIn()) {
            window.location.href = "/login.html";
        }
    }
};

