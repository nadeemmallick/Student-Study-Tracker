/* =========================================================
   goals.js – Goal Management API Integration & DOM Logic
   Day 7: Goal Management Module
   
   Features:
    - Fetch goals from backend, separated by DAILY / WEEKLY
    - Create, Update, Delete goals via modal form
    - Toggle goal completed status in-place
    - Stats panel (total, completed, daily count, weekly count)
    - Auth guard: redirects to login if not logged in
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Guard ────────────────────────────────────────────────────────────
    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;
    const userId = session.userId;

    // ── State ─────────────────────────────────────────────────────────────────
    let goals = [];
    let isEditMode = false;
    let todayStudyHours = 0;   // hours studied today (for DAILY goal progress)
    let weekStudyHours  = 0;   // hours studied this week (for WEEKLY goal progress)

    // ── DOM Elements ──────────────────────────────────────────────────────────
    const dailyList   = document.getElementById('dailyGoalsList');
    const weeklyList  = document.getElementById('weeklyGoalsList');
    const modal        = document.getElementById('goalModal');
    const modalTitle   = document.getElementById('modalTitle');
    const goalForm     = document.getElementById('goalForm');
    const goalIdInput  = document.getElementById('goalId');
    const titleInput   = document.getElementById('goalTitle');
    const typeSelect   = document.getElementById('goalType');
    const hoursInput   = document.getElementById('targetHours');
    const addGoalBtn   = document.getElementById('addGoalBtn');
    const closeModalBtn= document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const saveGoalBtn  = document.getElementById('saveGoalBtn');

    // ── Sidebar Logout ─────────────────────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                window.auth.clearSession();
                window.location.href = 'login.html';
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FETCH GOALS + ANALYTICS IN PARALLEL (Day 10: wire real progress)
    // ─────────────────────────────────────────────────────────────────────────
    async function fetchGoals() {
        try {
            // Fetch goals and analytics simultaneously for speed
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const [goalsRes, analyticsRes] = await Promise.all([
                api.get('/goals'),
                api.get(`/analytics?timezone=${encodeURIComponent(tz)}`)
            ]);

            if (goalsRes.ok) {
                const data = await goalsRes.json();
                goals = Array.isArray(data) ? data : (data.data || []);
            } else {
                throw new Error('Failed to fetch goals');
            }

            if (analyticsRes.ok) {
                const analytics = await analyticsRes.json();
                // weeklyTrend is a LinkedHashMap ordered oldest→newest, so the
                // last entry is always today's hours.
                const trendValues = Object.values(analytics.weeklyTrend || {});
                todayStudyHours = trendValues.length > 0
                    ? trendValues[trendValues.length - 1]
                    : 0;
                weekStudyHours = trendValues.reduce((sum, h) => sum + h, 0);
            }
        } catch (err) {
            console.warn('Backend offline, using mock data:', err.message);
            goals = getMockGoals();
            todayStudyHours = 2.5;
            weekStudyHours  = 14.0;
        }
        renderAll();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER ALL
    // ─────────────────────────────────────────────────────────────────────────
    function renderAll() {
        const daily  = goals.filter(g => g.goalType === 'DAILY');
        const weekly = goals.filter(g => g.goalType === 'WEEKLY');

        renderGoalList(dailyList, daily, 'daily');
        renderGoalList(weeklyList, weekly, 'weekly');
        updateStats(daily, weekly);
    }

    function renderGoalList(container, items, type) {
        document.getElementById(type === 'daily' ? 'dailyCount' : 'weeklyCount').textContent = items.length;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${type === 'daily' ? '📅' : '📆'}</div>
                    <h3>No ${type} goals yet</h3>
                    <p>Click "New Goal" to set your first ${type} target!</p>
                </div>`;
            return;
        }

        container.innerHTML = items.map(g => buildGoalCard(g)).join('');
        attachCardListeners(container);
    }

    function buildGoalCard(goal) {
        const isCompleted = goal.completed;
        const typeClass   = goal.goalType.toLowerCase();
        const completedClass = isCompleted ? 'completed' : '';
        const typeLabel   = goal.goalType === 'DAILY' ? 'Daily' : 'Weekly';

        // Real progress: compare actual study hours (from analytics) to target.
        // DAILY goals compare against today's study hours from the weekly trend.
        // WEEKLY goals compare against the sum of the last 7 days.
        const studiedHours = goal.goalType === 'DAILY' ? todayStudyHours : weekStudyHours;
        const rawProgress  = goal.targetHours > 0
            ? (studiedHours / parseFloat(goal.targetHours)) * 100
            : 0;
        const progress     = Math.min(100, Math.round(rawProgress)); // cap at 100%
        const progressLabel = `${studiedHours.toFixed(1)}h / ${goal.targetHours}h`;

        return `
        <div class="goal-card ${typeClass} ${completedClass}" data-id="${goal.goalId}">
            <div class="goal-card-header">
                <div class="goal-title">${escapeHtml(goal.title)}</div>
                <div class="goal-actions">
                    <button class="action-btn edit" data-id="${goal.goalId}" title="Edit">✏️</button>
                    <button class="action-btn delete" data-id="${goal.goalId}" title="Delete">🗑️</button>
                </div>
            </div>

            <div class="goal-progress-wrap">
                <span>Progress</span>
                <span class="goal-target">${progressLabel}</span>
            </div>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width: ${progress}%"></div>
            </div>

            <div class="goal-meta">
                <span class="goal-type-badge ${typeClass}">${typeLabel}</span>
                <button class="toggle-btn" data-id="${goal.goalId}">
                    ${isCompleted ? '✅ Completed' : '○ Mark Done'}
                </button>
            </div>
        </div>`;
    }

    function attachCardListeners(container) {
        // Edit buttons
        container.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                openEditModal(id);
            });
        });

        // Delete buttons
        container.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                handleDelete(id);
            });
        });

        // Toggle buttons
        container.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                handleToggle(id);
            });
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STATS
    // ─────────────────────────────────────────────────────────────────────────
    function updateStats(daily, weekly) {
        const total     = goals.length;
        const completed = goals.filter(g => g.completed).length;
        document.getElementById('statTotal').textContent     = total;
        document.getElementById('statCompleted').textContent = completed;
        document.getElementById('statDaily').textContent     = daily.length;
        document.getElementById('statWeekly').textContent    = weekly.length;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MODAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    function openCreateModal() {
        isEditMode = false;
        modalTitle.textContent = 'New Goal';
        goalForm.reset();
        goalIdInput.value = '';
        saveGoalBtn.textContent = 'Save Goal';
        modal.classList.add('open');
        titleInput.focus();
    }

    function openEditModal(id) {
        const goal = goals.find(g => String(g.goalId) === String(id));
        if (!goal) return;
        isEditMode = true;
        modalTitle.textContent = 'Edit Goal';
        goalIdInput.value    = goal.goalId;
        titleInput.value     = goal.title;
        typeSelect.value     = goal.goalType;
        hoursInput.value     = goal.targetHours;
        saveGoalBtn.textContent = 'Update Goal';
        modal.classList.add('open');
        titleInput.focus();
    }

    function closeModal() {
        modal.classList.remove('open');
        goalForm.reset();
    }

    addGoalBtn.addEventListener('click', openCreateModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE / UPDATE
    // ─────────────────────────────────────────────────────────────────────────
    goalForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title   = titleInput.value.trim();
        const type    = typeSelect.value;
        const hours   = parseFloat(hoursInput.value);

        if (!title || !type || isNaN(hours) || hours < 0.1) {
            if (window.toast) window.toast.warning('Please fill in all fields correctly.');
            return;
        }

        const payload = { title, goalType: type, targetHours: hours };
        saveGoalBtn.disabled = true;
        saveGoalBtn.textContent = 'Saving…';

        try {
            let res;
            if (isEditMode) {
                const id = goalIdInput.value;
                res = await api.put(`/goals/${id}`, payload);
            } else {
                res = await api.post('/goals', payload);
            }

            if (res.ok) {
                closeModal();
                await fetchGoals();
                if (window.toast) window.toast.success(isEditMode ? 'Goal updated!' : 'Goal created!');
            } else {
                const err = await res.json();
                if (window.toast) window.toast.error(err.message || 'Failed to save goal');
            }
        } catch (err) {
            console.warn('Backend offline, updating locally');
            // Local mock update
            if (isEditMode) {
                const id = goalIdInput.value;
                const idx = goals.findIndex(g => String(g.goalId) === String(id));
                if (idx !== -1) {
                    goals[idx] = { ...goals[idx], title, goalType: type, targetHours: hours };
                }
            } else {
                goals.unshift({
                    goalId: Date.now(),
                    userId,
                    title,
                    goalType: type,
                    targetHours: hours,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            }
            closeModal();
            renderAll();
        } finally {
            saveGoalBtn.disabled = false;
            saveGoalBtn.textContent = isEditMode ? 'Update Goal' : 'Save Goal';
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TOGGLE COMPLETED
    // ─────────────────────────────────────────────────────────────────────────
    async function handleToggle(id) {
        try {
            const res = await api.patch(`/goals/${id}/toggle`);
            if (res.ok) {
                await fetchGoals();
            } else {
                throw new Error('Failed to toggle');
            }
        } catch (err) {
            console.warn('Backend offline, toggling locally');
            const goal = goals.find(g => String(g.goalId) === String(id));
            if (goal) {
                goal.completed = !goal.completed;
                renderAll();
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────────────
    async function handleDelete(id) {
        if (!confirm('Delete this goal?')) return;
        try {
            const res = await api.delete(`/goals/${id}`);
            if (res.ok) {
                await fetchGoals();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (err) {
            console.warn('Backend offline, deleting locally');
            goals = goals.filter(g => String(g.goalId) !== String(id));
            renderAll();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MOCK DATA (fallback when backend is offline)
    // ─────────────────────────────────────────────────────────────────────────
    function getMockGoals() {
        return [
            { goalId: 1, userId, title: 'Study Physics for 3 hours', goalType: 'DAILY', targetHours: 3, completed: false },
            { goalId: 2, userId, title: 'Complete Math assignment', goalType: 'DAILY', targetHours: 1.5, completed: true },
            { goalId: 3, userId, title: 'Read 2 chapters of Chemistry', goalType: 'DAILY', targetHours: 2, completed: false },
            { goalId: 4, userId, title: 'Finish 20 hours of study', goalType: 'WEEKLY', targetHours: 20, completed: false },
            { goalId: 5, userId, title: 'Complete all assignments', goalType: 'WEEKLY', targetHours: 5, completed: true },
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILS
    // ─────────────────────────────────────────────────────────────────────────
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    fetchGoals();
});
