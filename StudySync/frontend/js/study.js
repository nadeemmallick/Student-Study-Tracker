/* =========================================================
   study.js – Step-by-Step Interactive Session Logger & API Integration
   StudySync – Student Study Tracker
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // ── Authentication Check ───────────────────────────────────
    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;

    // ── Constants & Lookup Arrays ──────────────────────────────
    const QUICK_DURATIONS = [15, 25, 30, 45, 60, 90, 120];
    const FOCUS_RATINGS = ['Distracted', 'Low focus', 'Moderate', 'Good focus', 'Deep focus 🔥'];
    const STEP_TITLES = ['What are you studying?', 'How long did you study?', 'Review & save'];

    // ── Component State ────────────────────────────────────────
    let subjects = [];
    let sessions = [];
    const S = {
        subjectId: null,
        subjectName: null,
        color: '#85A7D8',
        dur: 30,              // in minutes
        dayOff: 0,            // 0=Today, 1=Yesterday, 2=2 days ago
        focus: 0,             // 0=None, 1-5
        notes: '',
        step: 1
    };

    // ── DOM References ─────────────────────────────────────────
    const sessionsList = document.getElementById('sessionsList');
    const searchInput = document.getElementById('searchInput');
    const openModalBtn = document.getElementById('logSessionBtn');
    const modalOverlay = document.getElementById('sessionModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const toastEl = document.getElementById('sessionToast');

    // ── Date Formatting Helpers ────────────────────────────────
    const fmtDuration = (m) => {
        const h = Math.floor(m / 60);
        const r = m % 60;
        if (h && r) return `${h} hr ${r} min`;
        if (h) return `${h} hr`;
        return `${r} min`;
    };

    const dayLabel = (o) => (o === 0 ? 'Today' : o === 1 ? 'Yesterday' : '2 days ago');

    const isoDate = (o) => {
        const d = new Date();
        d.setDate(d.getDate() - o);
        const z = d.getTimezoneOffset() * 60000;
        return new Date(d - z).toISOString().slice(0, 10);
    };

    // ── Toast Notification Helper ──────────────────────────────
    function showToast(message) {
        if (window.toast) {
            window.toast.success(message);
        } else if (toastEl) {
            toastEl.textContent = message;
            toastEl.classList.add('show');
            setTimeout(() => toastEl.classList.remove('show'), 2200);
        }
    }

    // ── Build Modal Interactive Chips ──────────────────────────
    function initModalChips() {
        // Quick Duration Chips
        const dursContainer = document.getElementById('durs');
        if (dursContainer) {
            dursContainer.innerHTML = '';
            QUICK_DURATIONS.forEach(m => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chip';
                btn.dataset.m = m;
                btn.textContent = fmtDuration(m);
                btn.onclick = () => {
                    S.dur = m;
                    paint();
                };
                dursContainer.appendChild(btn);
            });
        }

        // Date Chips
        const datesContainer = document.getElementById('dates');
        if (datesContainer) {
            datesContainer.innerHTML = '';
            [0, 1, 2].forEach(offset => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'chip';
                btn.dataset.o = offset;
                btn.textContent = dayLabel(offset);
                btn.onclick = () => {
                    S.dayOff = offset;
                    paint();
                };
                datesContainer.appendChild(btn);
            });
        }

        // Focus Rating Buttons
        const rateContainer = document.getElementById('rate');
        if (rateContainer) {
            rateContainer.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.r = i;
                btn.textContent = i;
                btn.onclick = () => {
                    S.focus = S.focus === i ? 0 : i;
                    paint();
                };
                rateContainer.appendChild(btn);
            }
            const labelSpan = document.createElement('span');
            labelSpan.id = 'rateLabel';
            rateContainer.appendChild(labelSpan);
        }
    }

    // ── Render Subjects Grid inside Step 1 ─────────────────────
    function buildSubjectCards() {
        const container = document.getElementById('subjectsGridInModal');
        const emptyAlert = document.getElementById('nosub');
        if (!container) return;

        container.innerHTML = '';
        if (!subjects || subjects.length === 0) {
            if (emptyAlert) emptyAlert.classList.remove('hidden');
            return;
        }

        if (emptyAlert) emptyAlert.classList.add('hidden');

        subjects.forEach(sub => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'sc';
            btn.dataset.id = sub.subjectId || sub.id;
            const col = sub.colorCode || '#85A7D8';
            btn.style.setProperty('--sc', col);
            btn.style.setProperty('--sc-soft', col + '22');
            btn.innerHTML = `<i></i><span>${escapeHtml(sub.name)}</span>`;
            btn.onclick = () => {
                S.subjectId = sub.subjectId || sub.id;
                S.subjectName = sub.name;
                S.color = col;
                paint();
            };
            container.appendChild(btn);
        });
    }

    // ── Live Paint / UI Reactive Synchronization ───────────────
    function paint() {
        document.documentElement.style.setProperty('--c', S.color);

        // Subject selection cards
        document.querySelectorAll('.sc').forEach(b => {
            b.classList.toggle('on', String(b.dataset.id) === String(S.subjectId));
        });

        // Duration chips
        document.querySelectorAll('#durs .chip').forEach(b => {
            b.classList.toggle('on', +b.dataset.m === S.dur);
        });

        // Date chips
        document.querySelectorAll('#dates .chip').forEach(b => {
            b.classList.toggle('on', +b.dataset.o === S.dayOff);
        });

        // Focus rating buttons
        document.querySelectorAll('#rate button').forEach(b => {
            b.classList.toggle('on', +b.dataset.r === S.focus);
        });
        const rateLabel = document.getElementById('rateLabel');
        if (rateLabel) {
            rateLabel.textContent = S.focus ? FOCUS_RATINGS[S.focus - 1] : '';
        }

        // Stepper number
        const dvalEl = document.getElementById('dval');
        if (dvalEl) dvalEl.textContent = S.dur;

        // Step panes visibility
        document.querySelectorAll('.pane').forEach(p => {
            p.classList.toggle('on', +p.dataset.s === S.step);
        });

        // Progress bar indicator
        document.querySelectorAll('.prog i').forEach((p, i) => {
            p.classList.toggle('done', i < S.step);
        });

        // Headers
        const titleEl = document.getElementById('stepTitle');
        const subEl = document.getElementById('stepSubtitle');
        if (titleEl) titleEl.textContent = STEP_TITLES[S.step - 1];
        if (subEl) subEl.textContent = `Step ${S.step} of 3`;

        // Step 3 Review banner
        const rvSub = document.getElementById('rvSub');
        const rvMeta = document.getElementById('rvMeta');
        if (rvSub) rvSub.textContent = S.subjectName || 'Select a subject';
        if (rvMeta) rvMeta.textContent = `${fmtDuration(S.dur)} · ${dayLabel(S.dayOff)}`;

        // Navigation button states
        const backBtn = document.getElementById('stepBack');
        const nextBtn = document.getElementById('stepNext');
        const saveBtn = document.getElementById('stepSave');

        if (backBtn) backBtn.classList.toggle('hidden', S.step === 1);
        if (nextBtn) {
            nextBtn.classList.toggle('hidden', S.step === 3);
            nextBtn.disabled = S.step === 1 && !S.subjectId;
        }
        if (saveBtn) {
            saveBtn.classList.toggle('hidden', S.step !== 3);
            saveBtn.disabled = !(S.subjectId && S.dur > 0);
        }
    }

    // ── Duration Stepper Controls ──────────────────────────────
    const dmBtn = document.getElementById('dm');
    const dpBtn = document.getElementById('dp');
    if (dmBtn) dmBtn.onclick = () => { S.dur = Math.max(5, S.dur - 5); paint(); };
    if (dpBtn) dpBtn.onclick = () => { S.dur = Math.min(600, S.dur + 5); paint(); };

    // Wizard navigation controls
    const nextBtn = document.getElementById('stepNext');
    const backBtn = document.getElementById('stepBack');
    if (nextBtn) nextBtn.onclick = () => { S.step = Math.min(3, S.step + 1); paint(); };
    if (backBtn) backBtn.onclick = () => { S.step = Math.max(1, S.step - 1); paint(); };

    const notesInput = document.getElementById('notes');
    if (notesInput) {
        notesInput.oninput = (e) => { S.notes = e.target.value; };
    }

    // ── Modal Reset & Visibility ───────────────────────────────
    function resetModalState() {
        Object.assign(S, {
            subjectId: null,
            subjectName: null,
            color: '#85A7D8',
            dur: 30,
            dayOff: 0,
            focus: 0,
            notes: '',
            step: 1
        });
        if (notesInput) notesInput.value = '';
        paint();
    }

    function openModal() {
        resetModalState();
        buildSubjectCards();
        modalOverlay.classList.add('show');
    }

    function closeModal() {
        modalOverlay.classList.remove('show');
    }

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (!modalOverlay.classList.contains('show')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
            if (S.step < 3 && nextBtn && !nextBtn.disabled) nextBtn.click();
            else if (S.step === 3 && saveBtn && !saveBtn.disabled) saveBtn.click();
        }
    });

    // ── API: Fetch Subjects ────────────────────────────────────
    async function fetchSubjects() {
        try {
            const res = await api.get('/subjects');
            if (res.ok) {
                subjects = await res.json();
                buildSubjectCards();
            }
        } catch (error) {
            console.warn('Could not load subjects for session modal:', error);
        }
    }

    // ── API: Fetch Sessions History ────────────────────────────
    async function fetchSessions() {
        sessionsList.innerHTML = '<div class="loading-state">Loading study history...</div>';
        try {
            const res = await api.get('/sessions');
            if (res.ok) {
                sessions = await res.json();
                renderSessions(sessions);
            } else {
                sessionsList.innerHTML = `<div class="empty-state" style="color:var(--danger)">Failed to load study sessions.</div>`;
            }
        } catch (error) {
            console.warn('Backend connection issue:', error);
            sessionsList.innerHTML = `
                <div class="empty-state">
                    <h3>Connection issue</h3>
                    <p>Could not load sessions. Please verify backend status.</p>
                </div>`;
        }
    }

    // ── API: Save Study Session ────────────────────────────────
    const saveBtn = document.getElementById('stepSave');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!S.subjectId || S.dur <= 0) return;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            // Calculate realistic timestamps matching S.dur minutes
            const now = new Date();
            const endH = String(now.getHours()).padStart(2, '0');
            const endM = String(now.getMinutes()).padStart(2, '0');
            const endTimeStr = `${endH}:${endM}:00`;

            const startMs = now.getTime() - S.dur * 60000;
            const startDate = new Date(startMs);
            const startH = String(startDate.getHours()).padStart(2, '0');
            const startM = String(startDate.getMinutes()).padStart(2, '0');
            const startTimeStr = `${startH}:${startM}:00`;

            // Format notes with focus rating tag
            let formattedNotes = S.notes.trim();
            if (S.focus > 0) {
                const focusTag = `[${FOCUS_RATINGS[S.focus - 1]}]`;
                formattedNotes = formattedNotes ? `${focusTag} ${formattedNotes}` : focusTag;
            }

            const sessionPayload = {
                subjectId: S.subjectId,
                date: isoDate(S.dayOff),
                startTime: startTimeStr,
                endTime: endTimeStr,
                notes: formattedNotes
            };

            try {
                const res = await api.post('/sessions', sessionPayload);
                if (res.ok) {
                    closeModal();
                    showToast('Study session logged successfully! ✓');
                    fetchSessions();
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(err.message || 'Error saving session.');
                }
            } catch (err) {
                console.error('Error logging session:', err);
                showToast('Network error while saving session.');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Session';
            }
        });
    }

    // ── API: Delete Study Session ──────────────────────────────
    window.deleteSession = async (id) => {
        if (!confirm('Are you sure you want to delete this study session?')) return;

        try {
            const res = await api.delete(`/sessions/${id}`);
            if (res.ok) {
                showToast('Study session deleted ✓');
                fetchSessions();
            } else {
                showToast('Failed to delete session.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Network error while deleting session.');
        }
    };

    // ── Render Sessions History List ───────────────────────────
    function renderSessions(itemsToRender) {
        const statsEl = document.getElementById('historyStats');
        if (statsEl) {
            const totalMins = itemsToRender.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
            statsEl.textContent = `${itemsToRender.length} session${itemsToRender.length === 1 ? '' : 's'} · ${fmtDuration(totalMins)} total`;
        }

        if (!itemsToRender || itemsToRender.length === 0) {
            sessionsList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <h3>No sessions logged yet</h3>
                    <p>Click "+ Log Session" above to record your focused study hours!</p>
                </div>`;
            return;
        }

        sessionsList.innerHTML = itemsToRender.map(s => {
            const color = s.subjectColorCode || '#85A7D8';
            const dateObj = new Date(s.date);
            const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const startStr = s.startTime ? s.startTime.substring(0, 5) : '';
            const endStr = s.endTime ? s.endTime.substring(0, 5) : '';
            const timeRange = (startStr && endStr) ? `${startStr} – ${endStr}` : '';

            return `
            <div class="session-item" style="--c: ${color};">
                <div class="session-info">
                    <div class="session-subject-title">
                        <span>${escapeHtml(s.subjectName || 'Study Session')}</span>
                        <span class="subject-badge" style="--sc: ${color}; --sc-soft: ${color}20;">
                            ${escapeHtml(s.subjectName || 'Subject')}
                        </span>
                    </div>
                    <div class="session-notes">
                        ${escapeHtml(s.notes || 'No notes added for this session.')}
                    </div>
                </div>

                <div class="session-time-block">
                    <span class="session-duration">${fmtDuration(s.durationMinutes || 0)}</span>
                    <span class="session-date-range">${dateStr}${timeRange ? ' · ' + timeRange : ''}</span>
                </div>

                <div class="session-actions">
                    <button type="button" class="action-btn delete" onclick="deleteSession(${s.sessionId || s.id})" title="Delete Session">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    }

    // ── Live Search Filter ─────────────────────────────────────
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderSessions(sessions);
                return;
            }
            const filtered = sessions.filter(s =>
                (s.subjectName && s.subjectName.toLowerCase().includes(query)) ||
                (s.notes && s.notes.toLowerCase().includes(query))
            );
            renderSessions(filtered);
        });
    }

    // ── XSS Sanitizer Helper ───────────────────────────────────
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    // ── Initial Setup ──────────────────────────────────────────
    initModalChips();
    fetchSubjects();
    fetchSessions();
    paint();
});
