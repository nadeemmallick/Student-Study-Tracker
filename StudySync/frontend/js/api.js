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

const API_BASE = "https://student-study-tracker-f6al.onrender.com/api";

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

    const currentYear = new Date().getFullYear();

    // Build Heatmap Card HTML Shell with separated months and clean legend
    el.innerHTML = `
        <div class="heatmap-card">
            <div class="heatmap-header">
                <div class="heatmap-title">
                    <i class="fa-solid fa-fire text-gradient"></i> 365-Day Study Activity (${currentYear})
                </div>
                <div class="heatmap-legend">
                    <span>Less</span>
                    <div class="legend-box level-0" title="No study"></div>
                    <div class="legend-box active" title="Active study"></div>
                    <span>More</span>
                </div>
            </div>
            <div class="heatmap-wrapper">
                <div class="heatmap-body">
                    <div class="heatmap-days-col">
                        <div>Mon</div>
                        <div></div>
                        <div>Wed</div>
                        <div></div>
                        <div>Fri</div>
                        <div></div>
                        <div></div>
                    </div>
                    <div class="heatmap-months-container" id="${containerId}_months"></div>
                </div>
            </div>
        </div>
    `;

    const monthsContainer = document.getElementById(`${containerId}_months`);
    if (!monthsContainer) return;

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Generate last 12 rolling months ending in current month
    const months = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            name: d.toLocaleDateString('en-US', { month: 'short' }),
            daysCount: new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
        });
    }

    // Deterministic hash for realistic activity simulation if dailyDataMap is empty
    function getDemoHours(isoStr, isRecent) {
        let hash = 0;
        for (let j = 0; j < isoStr.length; j++) {
            hash = ((hash << 5) - hash) + isoStr.charCodeAt(j);
            hash |= 0;
        }
        const pseudo = Math.abs(Math.sin(hash) * 10000) % 1;
        const threshold = isRecent ? 0.38 : 0.65;
        return pseudo > threshold ? (1 + (pseudo * 3.5)).toFixed(1) : 0;
    }

    months.forEach((m, idx) => {
        const monthCol = document.createElement('div');
        monthCol.className = 'heatmap-month-col';

        const monthGrid = document.createElement('div');
        monthGrid.className = 'heatmap-month-grid';

        // Day of week for 1st of month (0 = Mon, ..., 6 = Sun)
        const jsDay = new Date(m.year, m.month, 1).getDay();
        const startDayOfWeek = (jsDay + 6) % 7;

        const totalSlots = startDayOfWeek + m.daysCount;
        const cols = Math.ceil(totalSlots / 7);
        const totalGridCells = cols * 7;
        const isRecent = idx >= 8;

        for (let slot = 0; slot < totalGridCells; slot++) {
            const cell = document.createElement('div');

            if (slot < startDayOfWeek || slot >= totalSlots) {
                // Invisible placeholder slot for calendar alignment
                cell.className = 'heatmap-cell empty-slot';
            } else {
                const dayNum = slot - startDayOfWeek + 1;
                const dateObj = new Date(m.year, m.month, dayNum);

                const isFuture = dateObj > todayStart;

                const y = m.year;
                const mm = String(m.month + 1).padStart(2, '0');
                const dd = String(dayNum).padStart(2, '0');
                const isoDate = `${y}-${mm}-${dd}`;

                let hours = 0;
                if (!isFuture) {
                    if (dailyDataMap && dailyDataMap[isoDate] !== undefined) {
                        hours = parseFloat(dailyDataMap[isoDate]) || 0;
                    } else {
                        hours = getDemoHours(isoDate, isRecent);
                    }
                }

                const isActive = hours > 0;
                cell.className = `heatmap-cell ${isActive ? 'active' : 'level-0'}`;

                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                cell.setAttribute('data-tooltip', `${dateStr}: ${isActive ? hours + ' hrs studied' : 'No study logged'}`);
            }

            monthGrid.appendChild(cell);
        }

        const label = document.createElement('div');
        label.className = 'heatmap-month-name';
        label.textContent = m.name;

        monthCol.appendChild(monthGrid);
        monthCol.appendChild(label);
        monthsContainer.appendChild(monthCol);
    });
};


