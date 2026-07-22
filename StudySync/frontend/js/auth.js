/* =========================================================
   auth.js – Register & Login form handlers
   Wires the HTML forms to the backend REST API via api.js
========================================================= */

import { registerUser, loginUser, saveSession, isLoggedIn } from "./api.js";

// ── Redirect already logged-in users straight to dashboard ──────────────────
if (isLoggedIn()) {
    window.location.href = "dashboard.html";
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
            const response = await registerUser(name, email, password);

            // Save session and redirect to dashboard
            saveSession(response.data);
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
            const response = await loginUser(email, password);

            // Save session and redirect to dashboard
            saveSession(response.data);
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
