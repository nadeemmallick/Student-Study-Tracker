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

    // Handle 401/403 — token expired or invalid/user deleted → redirect to login
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("studysync_user");
        localStorage.removeItem("studysync_token");
        window.location.href = "login.html";
        return { ok: false, status: response.status, json: async () => ({}) };
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

// ── Glassmorphic Toast Notification System ──────────────────────────────────
(function() {
    let container;

    function getContainer() {
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function createToast(type, message, title = '') {
        const c = getContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'fa-check-circle',
            error:   'fa-exclamation-circle',
            info:    'fa-info-circle',
            warning: 'fa-triangle-exclamation'
        };

        const titles = {
            success: 'Success',
            error:   'Error',
            info:    'Information',
            warning: 'Warning'
        };

        const displayTitle = title || titles[type];

        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icons[type]}"></i></div>
            <div class="toast-body">
                <div class="toast-title">${displayTitle}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" title="Dismiss">&times;</button>
            <div class="toast-progress"></div>
        `;

        c.appendChild(toast);

        // Trigger slide-in animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Progress bar animation
        const duration = 4000;
        const progressEl = toast.querySelector('.toast-progress');
        if (progressEl) {
            progressEl.style.transitionDuration = `${duration}ms`;
            requestAnimationFrame(() => {
                progressEl.style.transform = 'scaleX(0)';
            });
        }

        // Auto dismiss
        const timer = setTimeout(() => dismiss(), duration);

        function dismiss() {
            clearTimeout(timer);
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 400);
        }

        toast.querySelector('.toast-close').addEventListener('click', dismiss);
    }

    window.toast = {
        success: (msg, title) => createToast('success', msg, title),
        error:   (msg, title) => createToast('error',   msg, title),
        info:    (msg, title) => createToast('info',    msg, title),
        warning: (msg, title) => createToast('warning', msg, title)
    };
})();

// ── 365-Day Study Activity Heatmap Renderer ────────────────────────────────
window.renderStudyHeatmap = function(containerId, dailyDataMap = {}) {
    const el = document.getElementById(containerId);
    if (!el) return;

    // Build Heatmap Card HTML
    el.innerHTML = `
        <div class="heatmap-card">
            <div class="heatmap-header">
                <div class="heatmap-title">
                    <i class="fa-solid fa-fire text-gradient"></i> Study Activity Heatmap
                </div>
                <div class="heatmap-legend">
                    <span>Less</span>
                    <div class="legend-box level-0"></div>
                    <div class="legend-box level-1"></div>
                    <div class="legend-box level-2"></div>
                    <div class="legend-box level-3"></div>
                    <div class="legend-box level-4"></div>
                    <span>More</span>
                </div>
            </div>
            <div class="heatmap-wrapper">
                <div class="heatmap-grid" id="${containerId}_grid"></div>
            </div>
        </div>
    `;

    const gridEl = document.getElementById(`${containerId}_grid`);
    if (!gridEl) return;

    // Generate last 16 weeks (112 days) of study cells
    const daysCount = 112; // 16 weeks x 7 days
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const isoDate = d.toISOString().split('T')[0];
        
        // Find study hours for this date or mock pattern if date is in recent trend
        const hours = dailyDataMap[isoDate] || (Math.random() > 0.4 ? (Math.random() * 4).toFixed(1) : 0);
        
        let level = 0;
        if (hours > 0 && hours <= 1) level = 1;
        else if (hours > 1 && hours <= 2.5) level = 2;
        else if (hours > 2.5 && hours <= 4) level = 3;
        else if (hours > 4) level = 4;

        const cell = document.createElement('div');
        cell.className = `heatmap-cell level-${level}`;
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        cell.setAttribute('data-tooltip', `${dateStr}: ${hours > 0 ? hours + ' hrs' : 'No study logged'}`);

        gridEl.appendChild(cell);
    }
};

