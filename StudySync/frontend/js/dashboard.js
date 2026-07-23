/* =========================================================
   dashboard.js – Dashboard interaction logic
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Mobile Sidebar Toggle ---
    const sidebar = document.getElementById('sidebar');
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebarClose = document.getElementById('sidebarClose');

    if (sidebarOpen && sidebar) {
        sidebarOpen.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (sidebarClose && sidebar) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    // --- Mock Data Rendering ---
    
    // Simulate fetching user data from local storage or API
    const loadUserData = () => {
        // Mock user from auth.js if exists, else fallback
        const mockUser = {
            name: 'Nadeem',
            hoursToday: '2h 45m',
            currentStreak: 5,
            pendingAssignments: 3,
            weeklyGoalProgress: 65 // percentage
        };

        // Inject into DOM
        document.getElementById('userNameDisplay').textContent = mockUser.name;
        document.getElementById('welcomeName').textContent = mockUser.name;
        
        document.getElementById('hoursToday').textContent = mockUser.hoursToday;
        document.getElementById('currentStreak').textContent = mockUser.currentStreak + ' Days';
        document.getElementById('pendingAssignments').textContent = mockUser.pendingAssignments;
        
        const goalEl = document.getElementById('weeklyGoal');
        const progressEl = document.getElementById('weeklyGoalProgress');
        
        if (goalEl && progressEl) {
            goalEl.textContent = mockUser.weeklyGoalProgress + '%';
            // Animate progress bar fill after a small delay
            setTimeout(() => {
                progressEl.style.width = mockUser.weeklyGoalProgress + '%';
            }, 300);
        }
    };

    loadUserData();

    // --- Logout functionality placeholder ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to log out?')) {
                // Clear token/session here in the future
                window.location.href = 'login.html';
            }
        });
    }

});
