/* =========================================================
   dashboard.js – Dashboard interaction logic
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // Require user to be logged in
    window.auth.requireAuth();

    // --- Pre-render heatmap immediately with demo data ---
    // This ensures the heatmap is ALWAYS visible, even before the API responds.
    // It will be updated with real data once loadAnalytics() completes.
    if (window.renderStudyHeatmap) {
        window.renderStudyHeatmap('dashboardHeatmap', {});
    }




    // --- Escape HTML helper (XSS prevention) ---
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str || ''));
        return d.innerHTML;
    }

    // --- Fetch Analytics (Stats Cards + Heatmap) ---
    const loadAnalytics = async () => {
        const sessionUser = window.auth.getSession();
        const userName = sessionUser ? sessionUser.name : 'Student';
        
        if (document.getElementById('userNameDisplay')) document.getElementById('userNameDisplay').textContent = userName;
        if (document.getElementById('welcomeName')) document.getElementById('welcomeName').textContent = userName;

        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await api.get(`/analytics?timezone=${encodeURIComponent(tz)}`);
            if (res.ok) {
                const data = await res.json();
                
                // hoursToday → from weeklyTrend last value (today)
                const trendValues = Object.values(data.weeklyTrend || {});
                const todayHours = trendValues.length > 0 ? trendValues[trendValues.length - 1] : 0;
                
                // pending assignments
                const pending = (data.totalAssignments || 0) - (data.completedAssignments || 0);
                
                // streak logic
                const currentStreak = data.currentStreak || 0;
                const bestStreak = data.bestStreak || 0;
                
                // goal progress → completed vs total goals
                const goalProgress = data.totalGoals > 0 
                    ? Math.round((data.completedGoals / data.totalGoals) * 100) 
                    : 0;

                // Inject into DOM safely
                const hoursEl = document.getElementById('hoursToday');
                if (hoursEl) hoursEl.textContent = todayHours.toFixed(1) + 'h';

                const hoursBadge = document.getElementById('hoursBadge');
                if (hoursBadge) hoursBadge.textContent = todayHours > 0 ? 'Keep it up! 🔥' : 'No session yet';

                const streakEl = document.getElementById('currentStreak');
                if (streakEl) streakEl.textContent = currentStreak + (currentStreak === 1 ? ' Day' : ' Days');

                const bestStreakBadge = document.getElementById('bestStreakBadge');
                if (bestStreakBadge) bestStreakBadge.textContent = 'Best: ' + bestStreak + (bestStreak === 1 ? ' day' : ' days');

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
                // Fallback: still render empty heatmap
                if (window.renderStudyHeatmap) {
                    window.renderStudyHeatmap('dashboardHeatmap', {});
                }
            }
        } catch(e) {
            console.warn("Dashboard analytics error:", e);
            if (window.renderStudyHeatmap) {
                window.renderStudyHeatmap('dashboardHeatmap', {});
            }
        }
    };

    // --- Load Upcoming Assignments Panel ---
    const loadUpcomingAssignments = async () => {
        const container = document.getElementById('upcomingAssignments');
        if (!container) return;

        // Show skeleton while loading
        container.innerHTML = `
            <div class="list-item" style="opacity:0.5;">
                <div class="item-details"><p>Loading assignments...</p></div>
            </div>`;

        try {
            const res = await api.get('/assignments');
            if (!res.ok) throw new Error('API error');
            const all = await res.json();

            // Filter non-completed, sort by due date ascending, take top 5
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const upcoming = all
                .filter(a => a.status !== 'COMPLETED')
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .slice(0, 5);

            // Update the "High Priority" badge
            const highPriorityCount = all.filter(a => a.priority === 'HIGH' && a.status !== 'COMPLETED').length;
            const highBadge = document.getElementById('highPriorityBadge');
            if (highBadge) {
                highBadge.textContent = highPriorityCount > 0
                    ? `${highPriorityCount} High Priority`
                    : 'All clear ✅';
                highBadge.className = `stat-badge ${highPriorityCount > 0 ? 'negative' : 'positive'}`;
            }

            if (upcoming.length === 0) {
                container.innerHTML = `
                    <div class="list-item">
                        <div class="item-icon" style="color:#34d399"><i class="fa-solid fa-circle-check"></i></div>
                        <div class="item-details">
                            <h4>All caught up!</h4>
                            <p>No pending assignments right now 🎉</p>
                        </div>
                    </div>`;
                return;
            }

            container.innerHTML = upcoming.map(a => {
                const due = new Date(a.dueDate);
                // Adjust for timezone offset to avoid off-by-one day
                due.setMinutes(due.getMinutes() + due.getTimezoneOffset());
                const isOverdue = due < today;
                const dateStr = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const color = isOverdue ? '#f87171' : a.priority === 'HIGH' ? '#fbbf24' : '#9ba3c4';
                const icon = isOverdue ? 'fa-circle-exclamation' : a.priority === 'HIGH' ? 'fa-circle-exclamation' : 'fa-regular fa-clock';
                const label = isOverdue ? `Overdue · ${dateStr}` : `Due ${dateStr}`;

                return `<div class="list-item">
                    <div class="item-icon" style="color:${color}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="item-details">
                        <h4>${escapeHtml(a.title)}</h4>
                        <p>${label} · ${escapeHtml(a.subjectName || 'No subject')}</p>
                    </div>
                </div>`;
            }).join('');

        } catch (e) {
            console.warn('Could not load upcoming assignments:', e);
            container.innerHTML = `
                <div class="list-item">
                    <div class="item-icon" style="color:#9ba3c4"><i class="fa-solid fa-wifi"></i></div>
                    <div class="item-details">
                        <h4>Couldn't load assignments</h4>
                        <p>Backend may be starting up. Refresh in a moment.</p>
                    </div>
                </div>`;
        }
    };

    // --- Load Recent Study Sessions Panel ---
    const loadRecentSessions = async () => {
        const container = document.getElementById('recentSessions');
        if (!container) return;

        // Show skeleton while loading
        container.innerHTML = `
            <div class="list-item" style="opacity:0.5;">
                <div class="item-details"><p>Loading sessions...</p></div>
            </div>`;

        try {
            const res = await api.get('/sessions');
            if (!res.ok) throw new Error('API error');
            const all = await res.json();

            // Take the 5 most recent (backend returns newest-first)
            const recent = all.slice(0, 5);

            if (recent.length === 0) {
                container.innerHTML = `
                    <div class="list-item">
                        <div class="item-icon" style="color:#a78bfa"><i class="fa-solid fa-book-open"></i></div>
                        <div class="item-details">
                            <h4>No sessions yet</h4>
                            <p>Start a study session to see it here!</p>
                        </div>
                    </div>`;
                return;
            }

            container.innerHTML = recent.map(s => {
                const color = s.subjectColorCode || '#a78bfa';
                // Adjust for timezone
                const dateObj = new Date(s.date);
                dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                const hrs = s.durationMinutes >= 60
                    ? `${(s.durationMinutes / 60).toFixed(1)}h`
                    : `${s.durationMinutes} min`;
                const startStr = s.startTime ? s.startTime.substring(0, 5) : '';

                return `<div class="list-item">
                    <div class="item-icon" style="color:${color}">
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <div class="item-details">
                        <h4>${escapeHtml(s.subjectName || 'Study Session')}</h4>
                        <p>${hrs} · ${dateStr}${startStr ? ' · ' + startStr : ''}</p>
                    </div>
                </div>`;
            }).join('');

        } catch (e) {
            console.warn('Could not load recent sessions:', e);
            container.innerHTML = `
                <div class="list-item">
                    <div class="item-icon" style="color:#9ba3c4"><i class="fa-solid fa-wifi"></i></div>
                    <div class="item-details">
                        <h4>Couldn't load sessions</h4>
                        <p>Backend may be starting up. Refresh in a moment.</p>
                    </div>
                </div>`;
        }
    };

    // --- Quick Action Buttons ---
    const startSessionBtn = document.getElementById('startSessionBtn');
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', () => {
            window.location.href = 'study-session.html';
        });
    }

    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    if (addAssignmentBtn) {
        addAssignmentBtn.addEventListener('click', () => {
            window.location.href = 'assignments.html';
        });
    }

    // --- Logout ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to log out?')) {
                window.auth.clearSession();
                window.location.href = 'login.html';
            }
        });
    }

    // --- Init: load everything in parallel ---
    loadAnalytics();
    loadUpcomingAssignments();
    loadRecentSessions();

});

