/* =========================================================
   auth.js – Register, Login & Universal App Shell Listeners
========================================================= */

// ── Redirect already logged-in users straight to dashboard ──────────────────
if (window.auth.isLoggedIn()) {
    const path = window.location.pathname;
    if (path.endsWith('login.html') || path.endsWith('register.html') || path.endsWith('/') || path.endsWith('index.html')) {
        window.location.href = "dashboard.html";
    }
}

// ── Global Shell Initialization (Runs on all pages) ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // 1. Set User Profile Info
    const session = window.auth.getSession();
    if (session) {
        const userNameEl = document.getElementById('userNameDisplay');
        if (userNameEl) userNameEl.textContent = session.name || 'Student';
        
        const welcomeNameEl = document.getElementById('welcomeName');
        if (welcomeNameEl) welcomeNameEl.textContent = session.name || 'Student';

        const avatarEl = document.getElementById('headerAvatar');
        if (avatarEl && session.name) avatarEl.textContent = session.name.charAt(0).toUpperCase();
    }

    // 2. Sidebar Toggle Controls (Desktop Collapsible & Mobile Drawer)
    const sidebar = document.getElementById('sidebar');
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebarClose = document.getElementById('sidebarClose');

    if (sidebarOpen && sidebar) {
        sidebarOpen.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 1024) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('open');
            } else {
                sidebar.classList.add('collapsed');
            }
        });
    }

    // Close sidebar on click outside in mobile view
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && sidebarOpen && !sidebarOpen.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });

    // 3. Universal Logout Handler
    const logoutBtns = document.querySelectorAll('#logoutBtn, .logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                window.auth.clearSession();
                window.location.href = 'login.html';
            }
        });
    });
});

// ── REGISTER FORM ────────────────────────────────────────────────────────────
const registerForm = document.getElementById("register-form");
if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name     = document.getElementById("reg-name").value.trim();
        const email    = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;
        const errorEl  = document.getElementById("reg-error");
        const btnEl    = document.getElementById("reg-btn");

        errorEl.textContent = "";
        errorEl.style.display = "none";

        btnEl.disabled = true;
        btnEl.textContent = "Creating account…";

        try {
            const response = await window.auth.registerUser(name, email, password);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed");
            }

            window.auth.saveSession(result.data);
            window.location.href = "dashboard.html";

        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.style.display = "block";
        } finally {
            btnEl.disabled = false;
            btnEl.textContent = "Create Account";
        }
    });
}

// ── LOGIN FORM ───────────────────────────────────────────────────────────────
const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email    = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const errorEl  = document.getElementById("login-error");
        const btnEl    = document.getElementById("login-btn");

        errorEl.textContent = "";
        errorEl.style.display = "none";

        btnEl.disabled = true;
        btnEl.textContent = "Signing in…";

        try {
            const response = await window.auth.loginUser(email, password);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed");
            }

            window.auth.saveSession(result.data);
            window.location.href = "dashboard.html";

        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.style.display = "block";
        } finally {
            btnEl.disabled = false;
            btnEl.textContent = "Sign In";
        }
    });
}
