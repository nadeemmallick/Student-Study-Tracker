/* =========================================================
   goals.js – Goal Management & 3-Step Goal Modal
   StudySync API Integration and Dynamic UI
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Guard ────────────────────────────────────────────────────────────
    if (window.auth && typeof window.auth.requireAuth === 'function') {
        window.auth.requireAuth();
    }
    const session = window.auth ? window.auth.getSession() : null;
    if (!session) return;
    const userId = session.userId;

    // ── State ─────────────────────────────────────────────────────────────────
    let goals = [];
    let todayStudyHours = 0;   // hours studied today (for DAILY goal progress)
    let weekStudyHours = 0;    // hours studied this week (for WEEKLY goal progress)
    let searchQuery = '';

    // Step Modal Config & State
    const TYPES = {
        Daily: {
            color: '#7C83F0',
            def: 2,
            max: 24,
            chips: [1, 2, 3, 4, 6],
            sub: 'Resets every day',
            icon: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>'
        },
        Weekly: {
            color: '#4FAF8F',
            def: 10,
            max: 80,
            chips: [5, 10, 15, 20, 30],
            sub: 'Spread over the week',
            icon: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>'
        }
    };
    const STEP_TITLES = ['What kind of goal?', 'Set your target', 'Name your goal'];

    const S = {
        id: null,
        type: 'Daily',
        hours: 2,
        touched: false,
        title: '',
        step: 1
    };

    // ── DOM Elements ──────────────────────────────────────────────────────────
    const $ = id => document.getElementById(id);

    const dailyList = $('dailyGoalsList');
    const weeklyList = $('weeklyGoalsList');
    const addGoalBtn = $('addGoalBtn');
    const goalSearchInput = $('goalSearchInput');

    // Modal DOM Elements
    const ov = $('ov');
    const closeBtn = $('close');
    const modalTitle = $('modalStepTitle');
    const modalSub = $('modalStepSub');
    const typesContainer = $('types');
    const hval = $('hval');
    const hint = $('hint');
    const hchips = $('hchips');
    const dm = $('dm');
    const dp = $('dp');
    const inTitle = $('inTitle');
    const pvTag = $('pvTag');
    const pvTitle = $('pvTitle');
    const pvMeta = $('pvMeta');
    const backBtn = $('back');
    const nextBtn = $('next');
    const saveBtn = $('save');
    const toast = $('toast');

    // ── Formatters ────────────────────────────────────────────────────────────
    const fmtH = h => Number.isInteger(h) ? String(h) : Number(h).toFixed(1);
    const fmtMin = m => {
        m = Math.round(m);
        const h = Math.floor(m / 60), r = m % 60;
        return (h ? h + ' h ' : '') + (r ? r + ' min' : '') || '0 min';
    };
    const autoTitle = () => `Study ${fmtH(S.hours)} hours ${S.type === 'Daily' ? 'daily' : 'this week'}`;
    const hintText = () => S.type === 'Daily'
        ? `That's about ${Math.max(1, Math.round(S.hours * 2))} focus sessions of 30 min`
        : `About ${fmtMin(S.hours / 7 * 60)} of study per day`;

    // ── Initialization ────────────────────────────────────────────────────────
    init();

    async function init() {
        initModal();
        await fetchGoals();

        if (goalSearchInput) {
            goalSearchInput.addEventListener('input', e => {
                searchQuery = e.target.value.trim().toLowerCase();
                renderAll();
            });
        }
    }

    // ── API: Fetch Goals + Analytics ──────────────────────────────────────────
    async function fetchGoals() {
        try {
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
                const trendValues = Object.values(analytics.weeklyTrend || {});
                todayStudyHours = trendValues.length > 0
                    ? trendValues[trendValues.length - 1]
                    : 0;
                weekStudyHours = trendValues.reduce((sum, h) => sum + h, 0);
            }
        } catch (err) {
            console.warn('Backend offline, using fallback mock data:', err.message);
            goals = getMockGoals();
            todayStudyHours = 2.5;
            weekStudyHours = 14.0;
        }
        renderAll();
    }

    // ── Render Goals & Stats ──────────────────────────────────────────────────
    function renderAll() {
        let filtered = goals;
        if (searchQuery) {
            filtered = goals.filter(g =>
                (g.title || '').toLowerCase().includes(searchQuery) ||
                (g.goalType || '').toLowerCase().includes(searchQuery)
            );
        }

        const daily = filtered.filter(g => (g.goalType || '').toUpperCase() === 'DAILY');
        const weekly = filtered.filter(g => (g.goalType || '').toUpperCase() === 'WEEKLY');

        renderGoalList(dailyList, daily, 'daily');
        renderGoalList(weeklyList, weekly, 'weekly');
        updateStats();
    }

    function renderGoalList(container, items, type) {
        if (!container) return;
        const countBadge = $(type === 'daily' ? 'dailyCount' : 'weeklyCount');
        if (countBadge) countBadge.textContent = items.length;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">${type === 'daily' ? '📅' : '📆'}</div>
                    <h3>No ${type} goals yet</h3>
                    <p>Click "+ New Goal" to set your first ${type} target!</p>
                </div>`;
            return;
        }

        container.innerHTML = items.map(g => buildGoalCard(g)).join('');
    }

    function buildGoalCard(goal) {
        const isCompleted = !!goal.completed;
        const typeClass = (goal.goalType || 'DAILY').toLowerCase();
        const completedClass = isCompleted ? 'completed' : '';
        const typeLabel = (goal.goalType || 'DAILY').toUpperCase() === 'DAILY' ? 'Daily' : 'Weekly';

        const studiedHours = goal.goalType === 'DAILY' ? todayStudyHours : weekStudyHours;
        const targetHours = parseFloat(goal.targetHours) || 1;
        const rawProgress = targetHours > 0 ? (studiedHours / targetHours) * 100 : 0;
        const progress = Math.min(100, Math.round(rawProgress));
        const progressLabel = `${studiedHours.toFixed(1)}h / ${fmtH(targetHours)}h`;

        return `
        <div class="goal-card ${typeClass} ${completedClass}" data-id="${goal.goalId}">
            <div class="goal-card-header">
                <div class="goal-title">${escapeHtml(goal.title)}</div>
                <div class="goal-actions">
                    <button class="action-btn" onclick="editGoal(${goal.goalId})" title="Edit">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteGoal(${goal.goalId})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>

            <div class="goal-progress-wrap">
                <span>Progress</span>
                <span class="goal-target">${progressLabel} (${progress}%)</span>
            </div>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width: ${progress}%"></div>
            </div>

            <div class="goal-meta">
                <span class="goal-type-badge ${typeClass}">${typeLabel}</span>
                <button class="toggle-btn ${isCompleted ? 'done' : ''}" onclick="toggleGoal(${goal.goalId})">
                    ${isCompleted ? '✓ Completed' : '○ Mark Done'}
                </button>
            </div>
        </div>`;
    }

    function updateStats() {
        const total = goals.length;
        const completed = goals.filter(g => g.completed).length;
        const daily = goals.filter(g => (g.goalType || '').toUpperCase() === 'DAILY').length;
        const weekly = goals.filter(g => (g.goalType || '').toUpperCase() === 'WEEKLY').length;

        if ($('statTotal')) $('statTotal').textContent = total;
        if ($('statCompleted')) $('statCompleted').textContent = completed;
        if ($('statDaily')) $('statDaily').textContent = daily;
        if ($('statWeekly')) $('statWeekly').textContent = weekly;
    }

    // ── 3-Step Modal Setup ────────────────────────────────────────────────────
    function initModal() {
        // Build Goal Type Cards
        typesContainer.innerHTML = '';
        Object.entries(TYPES).forEach(([name, t]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'tp';
            b.dataset.t = name;
            b.style.setProperty('--k', t.color);
            b.style.setProperty('--k-soft', t.color + '22');
            b.innerHTML = `
                <div class="ti"><svg viewBox="0 0 24 24">${t.icon}</svg></div>
                <div><b>${name} Goal</b><span>${t.sub}</span></div>
            `;
            b.onclick = () => {
                S.type = name;
                if (!S.touched) S.hours = t.def;
                S.hours = Math.min(S.hours, t.max);
                paint();
            };
            typesContainer.appendChild(b);
        });

        // Stepper
        dm.onclick = () => {
            S.hours = Math.max(0.5, S.hours - 0.5);
            S.touched = true;
            paint();
        };

        dp.onclick = () => {
            S.hours = Math.min(TYPES[S.type].max, S.hours + 0.5);
            S.touched = true;
            paint();
        };

        inTitle.oninput = e => {
            S.title = e.target.value;
            paint();
        };

        nextBtn.onclick = () => {
            S.step = Math.min(3, S.step + 1);
            if (S.step === 3 && !S.title.trim()) {
                S.title = autoTitle();
                inTitle.value = S.title;
            }
            paint();
            if (S.step === 3) setTimeout(() => inTitle.focus(), 250);
        };

        backBtn.onclick = () => {
            S.step = Math.max(1, S.step - 1);
            paint();
        };

        if (addGoalBtn) addGoalBtn.onclick = () => openM();
        if (closeBtn) closeBtn.onclick = closeM;
        if (ov) {
            ov.onclick = e => {
                if (e.target === ov) closeM();
            };
        }

        document.addEventListener('keydown', e => {
            if (!ov.classList.contains('show')) return;
            if (e.key === 'Escape') closeM();
            if (e.key === 'Enter') {
                if (S.step < 3) {
                    nextBtn.click();
                } else if (!saveBtn.disabled) {
                    saveBtn.click();
                }
            }
        });

        saveBtn.onclick = handleSaveGoal;
    }

    function paint() {
        const t = TYPES[S.type] || TYPES.Daily;
        const root = document.documentElement.style;
        root.setProperty('--tc', t.color);
        root.setProperty('--tc-soft', t.color + '22');

        document.querySelectorAll('.tp').forEach(b => b.classList.toggle('on', b.dataset.t === S.type));
        hval.textContent = fmtH(S.hours);
        hint.textContent = hintText();

        hchips.innerHTML = '';
        t.chips.forEach(h => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip' + (h === S.hours ? ' on' : '');
            b.textContent = h + ' h';
            b.onclick = () => {
                S.hours = h;
                S.touched = true;
                paint();
            };
            hchips.appendChild(b);
        });

        // Step 3 preview card
        pvTag.textContent = S.type;
        pvTitle.textContent = S.title.trim() || 'Your goal title';
        pvTitle.classList.toggle('ph', !S.title.trim());
        pvMeta.textContent = `0 h of ${fmtH(S.hours)} h`;

        // Panes & Progress
        document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', +p.dataset.s === S.step));
        document.querySelectorAll('.prog i').forEach((p, i) => p.classList.toggle('done', i < S.step));

        if (S.id) {
            modalTitle.textContent = S.step === 1 ? 'Edit Goal' : STEP_TITLES[S.step - 1];
            saveBtn.textContent = 'Update Goal';
        } else {
            modalTitle.textContent = STEP_TITLES[S.step - 1];
            saveBtn.textContent = 'Save Goal';
        }
        modalSub.textContent = `Step ${S.step} of 3`;

        backBtn.classList.toggle('hidden', S.step === 1);
        nextBtn.classList.toggle('hidden', S.step === 3);
        saveBtn.classList.toggle('hidden', S.step !== 3);
        saveBtn.disabled = !S.title.trim();
    }

    function resetModal() {
        Object.assign(S, {
            id: null,
            type: 'Daily',
            hours: TYPES.Daily.def,
            touched: false,
            title: '',
            step: 1
        });
        inTitle.value = '';
        paint();
    }

    function openM(goalToEdit = null) {
        resetModal();

        if (goalToEdit) {
            S.id = goalToEdit.goalId;
            const isWeekly = (goalToEdit.goalType || '').toUpperCase() === 'WEEKLY';
            S.type = isWeekly ? 'Weekly' : 'Daily';
            S.hours = parseFloat(goalToEdit.targetHours) || (isWeekly ? TYPES.Weekly.def : TYPES.Daily.def);
            S.touched = true;
            S.title = goalToEdit.title || '';
            inTitle.value = S.title;
        }

        ov.classList.add('show');
        paint();
    }

    function closeM() {
        ov.classList.remove('show');
    }

    async function handleSaveGoal() {
        saveBtn.disabled = true;

        const payload = {
            title: S.title.trim(),
            goalType: S.type.toUpperCase(),
            targetHours: S.hours
        };

        try {
            let res;
            if (S.id) {
                res = await api.put(`/goals/${S.id}`, payload);
            } else {
                res = await api.post('/goals', payload);
            }

            if (res && res.ok) {
                closeM();
                showToast(S.id ? 'Goal updated ✓' : 'Goal added ✓');
                await fetchGoals();
            } else {
                throw new Error("Failed to save goal on server");
            }
        } catch (err) {
            console.warn("API save error, persisting locally for preview:", err);
            if (S.id) {
                const idx = goals.findIndex(g => g.goalId === S.id);
                if (idx !== -1) {
                    goals[idx] = { ...goals[idx], ...payload };
                }
            } else {
                goals.unshift({
                    goalId: Date.now(),
                    userId,
                    title: payload.title,
                    goalType: payload.goalType,
                    targetHours: payload.targetHours,
                    completed: false,
                    createdAt: new Date().toISOString()
                });
            }
            closeM();
            showToast(S.id ? 'Goal updated ✓' : 'Goal added ✓');
            renderAll();
        } finally {
            saveBtn.disabled = false;
        }
    }

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }

    // ── Global Window Actions ─────────────────────────────────────────────────
    window.editGoal = id => {
        const item = goals.find(g => g.goalId === id);
        if (item) openM(item);
    };

    window.deleteGoal = async id => {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        try {
            const res = await api.delete(`/goals/${id}`);
            if (res.ok) {
                showToast('Goal deleted');
                await fetchGoals();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            console.warn("Offline fallback for delete:", error);
            goals = goals.filter(g => g.goalId !== id);
            showToast('Goal deleted');
            renderAll();
        }
    };

    window.toggleGoal = async id => {
        try {
            const res = await api.patch(`/goals/${id}/toggle`);
            if (res.ok) {
                await fetchGoals();
            } else {
                throw new Error('Failed to toggle');
            }
        } catch (err) {
            console.warn('Offline fallback for toggle:', err);
            const goal = goals.find(g => g.goalId === id);
            if (goal) {
                goal.completed = !goal.completed;
                renderAll();
            }
        }
    };

    // ── Fallback Mock Data ────────────────────────────────────────────────────
    function getMockGoals() {
        return [
            { goalId: 1, userId, title: 'Study Physics 3 hours daily', goalType: 'DAILY', targetHours: 3, completed: false },
            { goalId: 2, userId, title: 'Complete Math practice set', goalType: 'DAILY', targetHours: 1.5, completed: true },
            { goalId: 3, userId, title: 'Review Organic Chemistry notes', goalType: 'DAILY', targetHours: 2, completed: false },
            { goalId: 4, userId, title: 'Finish 20 hours of focused study', goalType: 'WEEKLY', targetHours: 20, completed: false },
            { goalId: 5, userId, title: 'Complete weekly assignments', goalType: 'WEEKLY', targetHours: 5, completed: true }
        ];
    }

    function escapeHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str || ''));
        return d.innerHTML;
    }
});
