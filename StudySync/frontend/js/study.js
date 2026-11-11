/* =========================================================
   study.js – Live Focus Timer & Interactive Session Logger
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
    const RING_CIRCUMFERENCE = 753.98; // 2 * PI * 120

    // ── Component State (Manual Modal) ─────────────────────────
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

    // ── Live Focus Timer State (Hero Timer) ─────────────────────
    const T = {
        mode: 'countdown',          // 'countdown' | 'stopwatch'
        status: 'idle',             // 'idle' | 'running' | 'paused'
        presetMins: 25,
        totalSeconds: 25 * 60,
        remainingSeconds: 25 * 60,
        elapsedSeconds: 0,
        subjectId: null,
        subjectName: null,
        subjectColor: '#85A7D8',
        focusRating: 5,
        intervalId: null
    };

    // ── DOM References: Manual Logger & History ────────────────
    const sessionsList = document.getElementById('sessionsList');
    const searchInput = document.getElementById('searchInput');
    const openModalBtn = document.getElementById('logSessionBtn');
    const modalOverlay = document.getElementById('sessionModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const toastEl = document.getElementById('sessionToast');

    // ── DOM References: Live Focus Timer ───────────────────────
    const focusTimerCard = document.getElementById('focusTimerCard');
    const timerSelect = document.getElementById('timerSubjectSelect');
    const timerSubjectColorDot = document.getElementById('timerSubjectColorDot');
    const timerSubjectBadge = document.getElementById('timerSubjectBadge');
    const timerDigits = document.getElementById('timerDigits');
    const timerProgressRing = document.getElementById('timerProgressRing');
    const timerPresets = document.querySelectorAll('.preset-chip');
    const timerToggleBtn = document.getElementById('timerToggleBtn');
    const timerToggleIcon = document.getElementById('timerToggleIcon');
    const timerToggleText = document.getElementById('timerToggleText');
    const timerResetBtn = document.getElementById('timerResetBtn');
    const timerFinishBtn = document.getElementById('timerFinishBtn');
    const liveDot = document.getElementById('liveDot');
    const liveStatusText = document.getElementById('liveStatusText');
    const adjustMinus5 = document.getElementById('adjustMinus5');
    const adjustPlus5 = document.getElementById('adjustPlus5');

    // ── DOM References: Session Complete Modal ─────────────────
    const completeModal = document.getElementById('completeModal');
    const closeCompleteModalBtn = document.getElementById('closeCompleteModalBtn');
    const completeSubjectName = document.getElementById('completeSubjectName');
    const completeDurationMeta = document.getElementById('completeDurationMeta');
    const completeRate = document.getElementById('completeRate');
    const completeNotes = document.getElementById('completeNotes');
    const discardSessionBtn = document.getElementById('discardSessionBtn');
    const saveCompleteSessionBtn = document.getElementById('saveCompleteSessionBtn');

    // ── Date & Time Formatting Helpers ─────────────────────────
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

    function formatTimerDisplay(totalSec) {
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        const mStr = String(mins).padStart(2, '0');
        const sStr = String(secs).padStart(2, '0');
        if (hrs > 0) {
            return `${hrs}:${mStr}:${sStr}`;
        }
        return `${mStr}:${sStr}`;
    }

    // ── Toast Notification Helper ──────────────────────────────
    function showToast(message) {
        if (window.toast) {
            window.toast.success(message);
        } else if (toastEl) {
            toastEl.textContent = message;
            toastEl.classList.add('show');
            setTimeout(() => toastEl.classList.remove('show'), 2400);
        }
    }

    // ── Pleasant Audio Chime (Web Audio API) ───────────────────
    function playChime() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(880, now + 0.16); // A5

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start(now);
            osc1.stop(now + 0.2);
            osc2.start(now + 0.16);
            osc2.stop(now + 1.2);
        } catch (e) {
            // Audio context not allowed or not supported
        }
    }

    // =========================================================
    //  LIVE FOCUS TIMER LOGIC
    // =========================================================

    function syncTimerSubject(sub) {
        if (!sub) return;
        T.subjectId = sub.subjectId || sub.id;
        T.subjectName = sub.name;
        T.subjectColor = sub.colorCode || '#85A7D8';

        if (focusTimerCard) {
            focusTimerCard.style.setProperty('--c', T.subjectColor);
            focusTimerCard.style.setProperty('--c-soft', T.subjectColor + '20');
        }
        if (timerSubjectColorDot) {
            timerSubjectColorDot.style.background = T.subjectColor;
        }
        if (timerSubjectBadge) {
            timerSubjectBadge.textContent = T.subjectName;
            timerSubjectBadge.style.color = T.subjectColor;
            timerSubjectBadge.style.background = T.subjectColor + '18';
        }
        if (timerSelect && String(timerSelect.value) !== String(T.subjectId)) {
            timerSelect.value = String(T.subjectId);
        }
    }

    function renderTimerUI() {
        const timeStr = formatTimerDisplay(T.remainingSeconds);
        if (timerDigits) timerDigits.textContent = timeStr;

        // Circular Ring update
        if (timerProgressRing) {
            if (T.mode === 'countdown') {
                const fraction = T.totalSeconds > 0 ? (T.remainingSeconds / T.totalSeconds) : 0;
                const offset = RING_CIRCUMFERENCE * (1 - fraction);
                timerProgressRing.style.strokeDashoffset = Math.max(0, Math.min(RING_CIRCUMFERENCE, offset));
            } else {
                // Stopwatch: loops every 60 seconds
                const fraction = (T.remainingSeconds % 60) / 60;
                const offset = RING_CIRCUMFERENCE * (1 - fraction);
                timerProgressRing.style.strokeDashoffset = offset;
            }
        }

        // Browser Tab Title
        if (T.status === 'running') {
            const subLabel = T.subjectName || 'Study';
            document.title = `(${timeStr}) ${subLabel} | StudySync`;
        } else {
            document.title = 'Study Sessions | StudySync';
        }
    }

    function timerTick() {
        if (T.mode === 'countdown') {
            if (T.remainingSeconds > 0) {
                T.remainingSeconds--;
                T.elapsedSeconds++;
                renderTimerUI();

                if (T.remainingSeconds === 0) {
                    pauseTimer();
                    playChime();
                    openCompleteModal();
                }
            }
        } else {
            // Stopwatch
            T.remainingSeconds++;
            T.elapsedSeconds++;
            renderTimerUI();
        }
    }

    function startTimer() {
        if (!T.subjectId) {
            if (subjects.length > 0) {
                syncTimerSubject(subjects[0]);
            } else {
                showToast('Please create a subject first before starting a timer.');
                return;
            }
        }

        T.status = 'running';
        clearInterval(T.intervalId);
        T.intervalId = setInterval(timerTick, 1000);

        if (timerToggleIcon) timerToggleIcon.className = 'fa-solid fa-pause';
        if (timerToggleText) timerToggleText.textContent = 'Pause';
        if (liveDot) liveDot.className = 'live-dot running';
        if (liveStatusText) liveStatusText.textContent = 'Focusing now...';
        if (focusTimerCard) focusTimerCard.classList.add('running');
        if (timerFinishBtn) timerFinishBtn.disabled = false;

        renderTimerUI();
    }

    function pauseTimer() {
        T.status = 'paused';
        clearInterval(T.intervalId);
        T.intervalId = null;

        if (timerToggleIcon) timerToggleIcon.className = 'fa-solid fa-play';
        if (timerToggleText) timerToggleText.textContent = 'Resume';
        if (liveDot) liveDot.className = 'live-dot paused';
        if (liveStatusText) liveStatusText.textContent = 'Paused';
        if (focusTimerCard) focusTimerCard.classList.remove('running');

        renderTimerUI();
    }

    function resetTimer() {
        pauseTimer();
        T.status = 'idle';
        T.elapsedSeconds = 0;
        T.remainingSeconds = T.mode === 'countdown' ? T.totalSeconds : 0;

        if (timerToggleIcon) timerToggleIcon.className = 'fa-solid fa-play';
        if (timerToggleText) timerToggleText.textContent = 'Start Focus';
        if (liveDot) liveDot.className = 'live-dot';
        if (liveStatusText) liveStatusText.textContent = 'Ready to Focus';
        if (timerFinishBtn) timerFinishBtn.disabled = true;

        renderTimerUI();
    }

    // Toggle button handler
    if (timerToggleBtn) {
        timerToggleBtn.addEventListener('click', () => {
            if (T.status === 'running') {
                pauseTimer();
            } else {
                startTimer();
            }
        });
    }

    if (timerResetBtn) {
        timerResetBtn.addEventListener('click', resetTimer);
    }

    if (timerFinishBtn) {
        timerFinishBtn.addEventListener('click', () => {
            if (T.elapsedSeconds < 5) {
                showToast('Study session is too short to log (minimum 1 minute).');
                return;
            }
            pauseTimer();
            openCompleteModal();
        });
    }

    // Timer Preset Selection
    timerPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            timerPresets.forEach(b => b.classList.remove('on'));
            btn.classList.add('on');

            if (btn.dataset.mode === 'stopwatch') {
                T.mode = 'stopwatch';
                T.totalSeconds = 0;
                T.remainingSeconds = 0;
                T.elapsedSeconds = 0;
                if (adjustMinus5) adjustMinus5.style.display = 'none';
                if (adjustPlus5) adjustPlus5.style.display = 'none';
            } else {
                T.mode = 'countdown';
                const mins = parseInt(btn.dataset.mins, 10) || 25;
                T.presetMins = mins;
                T.totalSeconds = mins * 60;
                T.remainingSeconds = mins * 60;
                T.elapsedSeconds = 0;
                if (adjustMinus5) adjustMinus5.style.display = 'inline-block';
                if (adjustPlus5) adjustPlus5.style.display = 'inline-block';
            }
            resetTimer();
        });
    });

    // Time adjuster buttons (+5m / -5m)
    if (adjustMinus5) {
        adjustMinus5.addEventListener('click', () => {
            if (T.mode !== 'countdown' || T.status === 'running') return;
            const newMins = Math.max(5, Math.round(T.totalSeconds / 60) - 5);
            T.totalSeconds = newMins * 60;
            T.remainingSeconds = T.totalSeconds;
            renderTimerUI();
        });
    }

    if (adjustPlus5) {
        adjustPlus5.addEventListener('click', () => {
            if (T.mode !== 'countdown' || T.status === 'running') return;
            const newMins = Math.min(180, Math.round(T.totalSeconds / 60) + 5);
            T.totalSeconds = newMins * 60;
            T.remainingSeconds = T.totalSeconds;
            renderTimerUI();
        });
    }

    // Subject dropdown selection
    if (timerSelect) {
        timerSelect.addEventListener('change', (e) => {
            const selectedId = e.target.value;
            const matched = subjects.find(s => String(s.subjectId || s.id) === String(selectedId));
            if (matched) {
                syncTimerSubject(matched);
            }
        });
    }

    // =========================================================
    //  SESSION COMPLETE MODAL LOGIC
    // =========================================================

    function openCompleteModal() {
        if (!completeModal) return;
        const minutesStudied = Math.max(1, Math.round(T.elapsedSeconds / 60));

        if (completeSubjectName) {
            completeSubjectName.textContent = T.subjectName || 'Study Session';
        }
        if (completeDurationMeta) {
            completeDurationMeta.textContent = `${fmtDuration(minutesStudied)} focused · Today`;
        }

        // Build 1-5 rating buttons
        if (completeRate) {
            completeRate.innerHTML = '';
            for (let i = 1; i <= 5; i++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.r = i;
                btn.textContent = i;
                if (i === T.focusRating) btn.classList.add('on');
                btn.onclick = () => {
                    T.focusRating = i;
                    completeRate.querySelectorAll('button').forEach(b => {
                        b.classList.toggle('on', +b.dataset.r === i);
                    });
                };
                completeRate.appendChild(btn);
            }
        }

        if (completeNotes) completeNotes.value = '';
        completeModal.classList.add('show');
    }

    function closeCompleteModal() {
        if (completeModal) completeModal.classList.remove('show');
    }

    if (closeCompleteModalBtn) closeCompleteModalBtn.addEventListener('click', closeCompleteModal);
    if (discardSessionBtn) {
        discardSessionBtn.addEventListener('click', () => {
            closeCompleteModal();
            resetTimer();
        });
    }

    if (saveCompleteSessionBtn) {
        saveCompleteSessionBtn.addEventListener('click', async () => {
            const minutesStudied = Math.max(1, Math.round(T.elapsedSeconds / 60));
            const now = new Date();
            const endH = String(now.getHours()).padStart(2, '0');
            const endM = String(now.getMinutes()).padStart(2, '0');
            const endTimeStr = `${endH}:${endM}:00`;

            const startMs = now.getTime() - minutesStudied * 60000;
            const startDate = new Date(startMs);
            const startH = String(startDate.getHours()).padStart(2, '0');
            const startM = String(startDate.getMinutes()).padStart(2, '0');
            const startTimeStr = `${startH}:${startM}:00`;

            let formattedNotes = completeNotes ? completeNotes.value.trim() : '';
            if (T.focusRating > 0) {
                const focusTag = `[${FOCUS_RATINGS[T.focusRating - 1]}]`;
                formattedNotes = formattedNotes ? `${focusTag} ${formattedNotes}` : focusTag;
            }

            const payload = {
                subjectId: T.subjectId,
                date: isoDate(0),
                startTime: startTimeStr,
                endTime: endTimeStr,
                notes: formattedNotes
            };

            saveCompleteSessionBtn.disabled = true;
            saveCompleteSessionBtn.textContent = 'Saving...';

            try {
                const res = await api.post('/sessions', payload);
                if (res.ok) {
                    closeCompleteModal();
                    showToast('Focus session logged successfully! 🎉');
                    resetTimer();
                    fetchSessions();
                } else {
                    const err = await res.json().catch(() => ({}));
                    showToast(err.message || 'Error saving session.');
                }
            } catch (err) {
                console.error('Error saving complete session:', err);
                showToast('Network error while saving session.');
            } finally {
                saveCompleteSessionBtn.disabled = false;
                saveCompleteSessionBtn.textContent = 'Save to History';
            }
        });
    }

    // =========================================================
    //  MANUAL SESSION MODAL (PAST LOGS)
    // =========================================================

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

    function paint() {
        document.documentElement.style.setProperty('--c', S.color);

        document.querySelectorAll('.sc').forEach(b => {
            b.classList.toggle('on', String(b.dataset.id) === String(S.subjectId));
        });

        document.querySelectorAll('#durs .chip').forEach(b => {
            b.classList.toggle('on', +b.dataset.m === S.dur);
        });

        document.querySelectorAll('#dates .chip').forEach(b => {
            b.classList.toggle('on', +b.dataset.o === S.dayOff);
        });

        document.querySelectorAll('#rate button').forEach(b => {
            b.classList.toggle('on', +b.dataset.r === S.focus);
        });
        const rateLabel = document.getElementById('rateLabel');
        if (rateLabel) {
            rateLabel.textContent = S.focus ? FOCUS_RATINGS[S.focus - 1] : '';
        }

        const dvalEl = document.getElementById('dval');
        if (dvalEl) dvalEl.textContent = S.dur;

        document.querySelectorAll('.pane').forEach(p => {
            p.classList.toggle('on', +p.dataset.s === S.step);
        });

        document.querySelectorAll('.prog i').forEach((p, i) => {
            p.classList.toggle('done', i < S.step);
        });

        const titleEl = document.getElementById('stepTitle');
        const subEl = document.getElementById('stepSubtitle');
        if (titleEl) titleEl.textContent = STEP_TITLES[S.step - 1];
        if (subEl) subEl.textContent = `Step ${S.step} of 3`;

        const rvSub = document.getElementById('rvSub');
        const rvMeta = document.getElementById('rvMeta');
        if (rvSub) rvSub.textContent = S.subjectName || 'Select a subject';
        if (rvMeta) rvMeta.textContent = `${fmtDuration(S.dur)} · ${dayLabel(S.dayOff)}`;

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

    const dmBtn = document.getElementById('dm');
    const dpBtn = document.getElementById('dp');
    if (dmBtn) dmBtn.onclick = () => { S.dur = Math.max(5, S.dur - 5); paint(); };
    if (dpBtn) dpBtn.onclick = () => { S.dur = Math.min(600, S.dur + 5); paint(); };

    const nextBtn = document.getElementById('stepNext');
    const backBtn = document.getElementById('stepBack');
    if (nextBtn) nextBtn.onclick = () => { S.step = Math.min(3, S.step + 1); paint(); };
    if (backBtn) backBtn.onclick = () => { S.step = Math.max(1, S.step - 1); paint(); };

    const notesInput = document.getElementById('notes');
    if (notesInput) {
        notesInput.oninput = (e) => { S.notes = e.target.value; };
    }

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
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (modalOverlay && modalOverlay.classList.contains('show')) {
            if (e.key === 'Escape') closeModal();
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
                if (S.step < 3 && nextBtn && !nextBtn.disabled) nextBtn.click();
                else if (S.step === 3 && saveBtn && !saveBtn.disabled) saveBtn.click();
            }
        }
        if (completeModal && completeModal.classList.contains('show')) {
            if (e.key === 'Escape') closeCompleteModal();
        }
    });

    // =========================================================
    //  API INTEGRATION
    // =========================================================

    async function fetchSubjects() {
        try {
            const res = await api.get('/subjects');
            if (res.ok) {
                subjects = await res.json();
                buildSubjectCards();

                // Populate Live Timer Subject Dropdown
                if (timerSelect) {
                    timerSelect.innerHTML = '<option value="" disabled selected>Select a subject...</option>';
                    subjects.forEach(sub => {
                        const opt = document.createElement('option');
                        opt.value = sub.subjectId || sub.id;
                        opt.textContent = sub.name;
                        timerSelect.appendChild(opt);
                    });

                    if (subjects.length > 0 && !T.subjectId) {
                        syncTimerSubject(subjects[0]);
                    }
                }
            }
        } catch (error) {
            console.warn('Could not load subjects:', error);
        }
    }

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

    // Manual Save Button
    const saveBtn = document.getElementById('stepSave');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            if (!S.subjectId || S.dur <= 0) return;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            const now = new Date();
            const endH = String(now.getHours()).padStart(2, '0');
            const endM = String(now.getMinutes()).padStart(2, '0');
            const endTimeStr = `${endH}:${endM}:00`;

            const startMs = now.getTime() - S.dur * 60000;
            const startDate = new Date(startMs);
            const startH = String(startDate.getHours()).padStart(2, '0');
            const startM = String(startDate.getMinutes()).padStart(2, '0');
            const startTimeStr = `${startH}:${startM}:00`;

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
                    <p>Start the Live Focus Timer above or click "Log Past Session" to record your study hours!</p>
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
    renderTimerUI();
});
