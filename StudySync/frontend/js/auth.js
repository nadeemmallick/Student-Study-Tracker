/* =========================================================
   auth.js – Register & Login form handlers
   Wires the HTML forms to the backend REST API via api.js
========================================================= */

// ── Redirect already logged-in users straight to dashboard ──────────────────
if (window.auth.isLoggedIn()) {
    const path = window.location.pathname;
    if (path.endsWith('login.html') || path.endsWith('register.html') || path.endsWith('/') || path.endsWith('index.html')) {
        window.location.href = "dashboard.html";
    }
}

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

        // Clear previous error
        errorEl.textContent = "";
        errorEl.style.display = "none";

        // Loading state
        btnEl.disabled = true;
        btnEl.textContent = "Creating account…";

        try {
            const response = await window.auth.registerUser(name, email, password);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed");
            }

            // Save session and redirect to dashboard
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

        // Clear previous error
        errorEl.textContent = "";
        errorEl.style.display = "none";

        // Loading state
        btnEl.disabled = true;
        btnEl.textContent = "Signing in…";

        try {
            const response = await window.auth.loginUser(email, password);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed");
            }

            // Save session and redirect to dashboard
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
