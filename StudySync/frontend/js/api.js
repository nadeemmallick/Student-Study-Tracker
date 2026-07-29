/* =========================================================
   api.js – Base API layer for StudySync frontend

   Day 10: JWT Authentication added.
   - Every request now includes "Authorization: Bearer <token>"
     read from localStorage.
   - saveSession() extracts and stores the JWT token separately.
   - clearSession() also clears the token.

   Separation of concerns:
   - api.js    → HTTP transport layer + session/token storage helpers
   - auth.js   → Form UI handlers for login and register pages only
========================================================= */

const API_BASE = "http://localhost:8080/api";

/**
 * Core fetch wrapper.
 * Automatically attaches the JWT Authorization header on every request.
 * Returns a response-like object with { ok, status, json() }.
 */
async function apiFetch(endpoint, method = "GET", body = null) {
    const headers = {};
    
    // Only set Content-Type if we are actually sending JSON
    if (body) {
        headers["Content-Type"] = "application/json";
    }

    // Attach JWT token if one is stored (omit for public /auth/** routes)
    const token = localStorage.getItem("studysync_token");
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);

    // Handle 401 — token expired or invalid → redirect to login
    if (response.status === 401) {
        localStorage.removeItem("studysync_user");
        localStorage.removeItem("studysync_token");
        window.location.href = "login.html";
        return { ok: false, status: 401, json: async () => ({}) };
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
        return { ok: true, status: 204, json: async () => ({}) };
    }

    let data;
    try {
        data = await response.json();
    } catch (e) {
        data = {}; // Non-JSON response
    }

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

// ── Auth & Session Helpers ───────────────────────────────────────────────────
// These helpers manage the localStorage session and JWT token.
// auth.js handles the form UI for login/register; api.js handles storage.
window.auth = {
    registerUser: (name, email, password) => api.post("/auth/register", { name, email, password }),
    loginUser:    (email, password)       => api.post("/auth/login",    { email, password }),

    /**
     * Saves user info and JWT token to localStorage after a successful
     * login or register. The token is stored separately so apiFetch()
     * can easily read it without parsing the full session object.
     *
     * @param {Object} userData - { userId, name, email, token }
     */
    saveSession: (userData) => {
        // Store full user object (minus token for clean serialisation)
        const { token, ...userInfo } = userData;
        localStorage.setItem("studysync_user", JSON.stringify(userInfo));

        // Store token separately for easy header injection in apiFetch()
        if (token) {
            localStorage.setItem("studysync_token", token);
        }
    },

    getSession: () => {
        const stored = localStorage.getItem("studysync_user");
        return stored ? JSON.parse(stored) : null;
    },

    clearSession: () => {
        localStorage.removeItem("studysync_user");
        localStorage.removeItem("studysync_token");
    },

    isLoggedIn: () => window.auth.getSession() !== null,

    requireAuth: () => {
        if (!window.auth.isLoggedIn()) {
            window.location.href = "login.html";
        }
    }
};
