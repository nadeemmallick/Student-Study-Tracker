/* =========================================================
   profile.js – Profile page logic
   Handles: load profile, update profile, change password
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;

    // ── DOM Refs ────────────────────────────────────────────
    const bigAvatar        = document.getElementById('bigAvatar');
    const displayName      = document.getElementById('displayName');
    const displayEmail     = document.getElementById('displayEmail');
    const headerAvatar     = document.getElementById('headerAvatar');
    const headerName       = document.getElementById('headerName');
    const alertBanner      = document.getElementById('alertBanner');

    const profileForm      = document.getElementById('profileForm');
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput= document.getElementById('profileEmail');
    const saveProfileBtn   = document.getElementById('saveProfileBtn');

    const passwordForm     = document.getElementById('passwordForm');
    const currentPwInput   = document.getElementById('currentPassword');
    const newPwInput       = document.getElementById('newPassword');
    const confirmPwInput   = document.getElementById('confirmPassword');
    const savePasswordBtn  = document.getElementById('savePasswordBtn');

    const logoutBtn        = document.getElementById('logoutBtn');
    const logoutBtnCard    = document.getElementById('logoutBtnCard');

    // ── Helpers ─────────────────────────────────────────────

    function showAlert(message, type = 'success') {
        alertBanner.textContent = message;
        alertBanner.className = 'alert-banner ' + type;
        alertBanner.style.display = 'flex';
        setTimeout(() => { alertBanner.style.display = 'none'; }, 4000);
    }

    function setAvatarText(name) {
        const initial = (name || '?').charAt(0).toUpperCase();
        if (bigAvatar)    bigAvatar.textContent    = initial;
        if (headerAvatar) headerAvatar.textContent = initial;
    }

    function setLoading(btn, loading, defaultText) {
        btn.disabled = loading;
        btn.innerHTML = loading
            ? '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'
            : defaultText;
    }

    // ── Load Profile ─────────────────────────────────────────

    async function loadProfile() {
        try {
            const res = await api.get('/profile');
            if (res.ok) {
                const data = await res.json();
                profileNameInput.value   = data.name;
                profileEmailInput.value  = data.email;
                displayName.textContent  = data.name;
                displayEmail.textContent = data.email;
                headerName.textContent   = data.name;
                setAvatarText(data.name);
            }
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    }

    // ── Update Profile ───────────────────────────────────────

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(saveProfileBtn, true, '<i class="fa-solid fa-check"></i> Save Changes');

        const payload = {
            name:  profileNameInput.value.trim(),
            email: profileEmailInput.value.trim()
        };

        try {
            const res = await api.put('/profile', payload);
            if (res.ok) {
                const data = await res.json();
                displayName.textContent  = data.name;
                displayEmail.textContent = data.email;
                headerName.textContent   = data.name;
                setAvatarText(data.name);

                // Update local session storage so sidebar/header stay fresh
                const stored = window.auth.getSession();
                if (stored) {
                    stored.name  = data.name;
                    stored.email = data.email;
                    window.auth.saveSession(stored);
                }

                showAlert('✅ Profile updated successfully!', 'success');
            } else {
                const err = await res.json();
                showAlert(err.message || 'Failed to update profile.', 'error');
            }
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        } finally {
            setLoading(saveProfileBtn, false, '<i class="fa-solid fa-check"></i> Save Changes');
        }
    });

    // ── Change Password ──────────────────────────────────────

    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const currentPw = currentPwInput.value;
        const newPw     = newPwInput.value;
        const confirmPw = confirmPwInput.value;

        if (newPw.length < 6) {
            showAlert('New password must be at least 6 characters.', 'error');
            return;
        }
        if (newPw !== confirmPw) {
            showAlert('New passwords do not match.', 'error');
            return;
        }

        setLoading(savePasswordBtn, true, '<i class="fa-solid fa-key"></i> Change Password');

        try {
            const res = await api.put('/profile/password', {
                currentPassword: currentPw,
                newPassword:     newPw
            });

            if (res.ok) {
                passwordForm.reset();
                showAlert('🔑 Password changed successfully!', 'success');
            } else {
                const err = await res.json();
                showAlert(err.message || 'Failed to change password.', 'error');
            }
        } catch (err) {
            showAlert('Network error. Please try again.', 'error');
        } finally {
            setLoading(savePasswordBtn, false, '<i class="fa-solid fa-key"></i> Change Password');
        }
    });

    // ── Password Toggle (show/hide) ──────────────────────────

    document.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon  = btn.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fa-solid fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fa-solid fa-eye';
            }
        });
    });

    // ── Sidebar Mobile Toggle ────────────────────────────────

    const sidebar     = document.getElementById('sidebar');
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebarClose= document.getElementById('sidebarClose');

    if (sidebarOpen)  sidebarOpen.addEventListener('click',  () => sidebar.classList.add('open'));
    if (sidebarClose) sidebarClose.addEventListener('click', () => sidebar.classList.remove('open'));

    // ── Logout ───────────────────────────────────────────────

    function handleLogout() {
        if (confirm('Are you sure you want to log out?')) {
            window.auth.clearSession();
            window.location.href = 'login.html';
        }
    }

    if (logoutBtn)     logoutBtn.addEventListener('click',     (e) => { e.preventDefault(); handleLogout(); });
    if (logoutBtnCard) logoutBtnCard.addEventListener('click', handleLogout);

    // ── Init ─────────────────────────────────────────────────

    loadProfile();
});
