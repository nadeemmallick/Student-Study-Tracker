/* =========================================================
   dashboard.js – Dashboard interaction logic
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // Require user to be logged in
    window.auth.requireAuth();

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

    // --- Fetch Real Data from API ---
    
    const loadUserData = async () => {
        const sessionUser = window.auth.getSession();
        const userName = sessionUser ? sessionUser.name : 'Student';
        
        // Basic user info
        if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').textContent = userName;
        if (document.getElementById('welcomeName')) document.getElementById('welcomeName').textContent = userName;

        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await api.get(`/analytics?timezone=${encodeURIComponent(tz)}`);
            if (res.ok) {
                const data = await res.json();
                
                // hoursToday -> from weeklyTrend last value (today)
                const trendValues = Object.values(data.weeklyTrend || {});
                const todayHours = trendValues.length > 0 ? trendValues[trendValues.length - 1] : 0;
                
                // pending assignments
                const pending = (data.totalAssignments || 0) - (data.completedAssignments || 0);
                
                // streak logic
                const currentStreak = data.currentStreak || 0;
                const bestStreak = data.bestStreak || 0;
                
                // goal progress -> completed vs total goals
                const goalProgress = data.totalGoals > 0 
                    ? Math.round((data.completedGoals / data.totalGoals) * 100) 
                    : 0;

                // Inject into DOM safely
                const hoursEl = document.getElementById('hoursToday');
                if (hoursEl) hoursEl.textContent = todayHours.toFixed(1) + 'h';

                const streakEl = document.getElementById('currentStreak');
                if (streakEl) streakEl.textContent = currentStreak + (currentStreak === 1 ? ' Day' : ' Days');

                const bestStreakBadge = document.getElementById('bestStreakBadge');
                if (bestStreakBadge) {
                    bestStreakBadge.textContent = 'Current best: ' + bestStreak;
                }

                const pendingEl = document.getElementById('pendingAssignments');
                if (pendingEl) pendingEl.textContent = pending;
                
                const goalEl = document.getElementById('weeklyGoal');
                const progressEl = document.getElementById('weeklyGoalProgress');
                
                if (goalEl && progressEl) {
                    goalEl.textContent = goalProgress + '%';
                    setTimeout(() => {
                        progressEl.style.width = goalProgress + '%';
                    }, 300);
                }

                // Render Study Activity Heatmap
                if (window.renderStudyHeatmap) {
                    window.renderStudyHeatmap('dashboardHeatmap', data.weeklyTrend || {});
                }
            } else {
                console.warn("Failed to fetch analytics for dashboard");
            }
        } catch(e) {
            console.error("Dashboard error:", e);
        }
    };

    loadUserData();

    // --- Logout functionality placeholder ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Are you sure you want to log out?')) {
                window.auth.clearSession();
                window.location.href = 'login.html';
            }
        });
    }

});
