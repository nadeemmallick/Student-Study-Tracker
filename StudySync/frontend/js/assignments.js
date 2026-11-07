/* =========================================================
   assignments.js – Assignment Tracker & Step-by-Step Modal
   StudySync API Integration and Dynamic UI
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Authentication guard
    if (window.auth && typeof window.auth.requireAuth === 'function') {
        window.auth.requireAuth();
    }
    const session = window.auth ? window.auth.getSession() : null;
    const userId = session ? session.userId : null;

    // --- State ---
    let assignments = [];
    let subjects = [];
    let searchQuery = '';

    // Step Modal State
    const PRIORITIES = ['Low', 'Medium', 'High'];
    const STATUSES = ['Pending', 'In Progress', 'Completed'];
    const DATE_CHIPS = [['Today', 0], ['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]];
    const STEP_TITLES = ["What's the assignment?", 'Deadline & priority', 'Review & save'];

    const S = {
        id: null,
        title: '',
        subject: null,
        subjectId: null,
        due: 0,
        customDate: null,
        priority: 'Medium',
        status: 'Pending',
        desc: '',
        step: 1
    };

    // --- DOM Elements ---
    const $ = id => document.getElementById(id);

    const pendingList = $('pendingList');
    const inProgressList = $('inProgressList');
    const completedList = $('completedList');
    const searchInput = $('searchInput');
    const addAssignmentBtn = $('addAssignmentBtn');

    // Modal Elements
    const ov = $('ov');
    const closeBtn = $('close');
    const stepTitle = $('modalStepTitle');
    const subText = $('modalStepSub');
    const inTitle = $('inTitle');
    const subjectsContainer = $('subjects');
    const noSubNotice = $('nosub');
    const datesContainer = $('dates');
    const pickBox = $('pickBox');
    const pickDate = $('pickDate');
    const prioContainer = $('prio');
    const statContainer = $('stat');
    const rvDot = $('rvDot');
    const rvTitle = $('rvTitle');
    const rvMeta = $('rvMeta');
    const inDesc = $('inDesc');
    const backBtn = $('back');
    const nextBtn = $('next');
    const saveBtn = $('save');
    const toast = $('toast');

    // --- Date Helpers ---
    const addDays = n => {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return d;
    };

    const isoDate = n => {
        if (typeof n === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n)) return n;
        const d = addDays(n);
        const z = d.getTimezoneOffset() * 60000;
        return new Date(d - z).toISOString().slice(0, 10);
    };

    const niceDate = n => {
        if (typeof n === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n)) {
            const parts = n.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        }
        return addDays(n).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const subjectColor = name => {
        const found = subjects.find(s => s.name === name || s.name.toLowerCase() === (name || '').toLowerCase());
        return found ? (found.colorCode || found.color || '#85A7D8') : '#85A7D8';
    };

    // --- Initialization ---
    init();

    async function init() {
        initModalControls();
        await fetchSubjects();
        await fetchAssignments();

        if (searchInput) {
            searchInput.addEventListener('input', e => {
                searchQuery = e.target.value.trim().toLowerCase();
                renderAssignments();
            });
        }
    }

    // --- API Calls ---

    async function fetchSubjects() {
        try {
            const res = await api.get('/subjects');
            if (res.ok) {
                subjects = await res.json();
            } else {
                throw new Error("Backend offline");
            }
        } catch (error) {
            console.warn("Using fallback mock subjects:", error);
            subjects = [
                { subjectId: 1, name: "Mathematics", colorCode: "#7C3AED" },
                { subjectId: 2, name: "Physics", colorCode: "#F59E0B" },
                { subjectId: 3, name: "History", colorCode: "#10B981" },
                { subjectId: 4, name: "Computer Science", colorCode: "#3B82F6" }
            ];
        }
        buildSubjectChips();
    }

    async function fetchAssignments() {
        showLoadingState();
        try {
            const res = await api.get('/assignments');
            if (res.ok) {
                assignments = await res.json();
                renderAssignments();
            } else {
                throw new Error("Backend offline");
            }
        } catch (error) {
            console.warn("Using fallback mock assignments:", error);
            assignments = [
                {
                    assignmentId: 1,
                    subjectId: 1,
                    subjectName: "Mathematics",
                    subjectColorCode: "#7C3AED",
                    title: "Calculus Problem Set 4",
                    description: "Complete all questions from Section 4.2 to 4.5.",
                    dueDate: isoDate(1),
                    priority: "HIGH",
                    status: "PENDING"
                },
                {
                    assignmentId: 2,
                    subjectId: 2,
                    subjectName: "Physics",
                    subjectColorCode: "#F59E0B",
                    title: "Kinematics Lab Report",
                    description: "Draft procedure, results analysis, and error propagation.",
                    dueDate: isoDate(3),
                    priority: "MEDIUM",
                    status: "IN_PROGRESS"
                },
                {
                    assignmentId: 3,
                    subjectId: 3,
                    subjectName: "History",
                    subjectColorCode: "#10B981",
                    title: "Read Chapter 12",
                    description: "Industrial Revolution impact on European urbanization.",
                    dueDate: isoDate(0),
                    priority: "LOW",
                    status: "COMPLETED"
                }
            ];
            renderAssignments();
        }
    }

    // --- Step Modal Setup & Logic ---

    function initModalControls() {
        // Date chips
        datesContainer.innerHTML = '';
        DATE_CHIPS.forEach(([label, n]) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip plain';
            b.dataset.o = n;
            b.textContent = label;
            b.onclick = () => {
                S.due = n;
                S.customDate = null;
                pickBox.classList.remove('show');
                paint();
            };
            datesContainer.appendChild(b);
        });

        // Pick date chip
        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'chip plain';
        pick.id = 'pickChip';
        pick.textContent = 'Pick date';
        pick.onclick = () => {
            pickBox.classList.toggle('show');
            if (pickBox.classList.contains('show')) {
                pickDate.focus();
            }
        };
        datesContainer.appendChild(pick);

        pickDate.onchange = e => {
            if (!e.target.value) return;
            const t = new Date();
            t.setHours(0, 0, 0, 0);
            const d = new Date(e.target.value + 'T00:00:00');
            S.due = Math.round((d - t) / 864e5);
            S.customDate = e.target.value;
            paint();
        };

        // Priority buttons
        prioContainer.innerHTML = '';
        PRIORITIES.forEach(p => {
            const b = document.createElement('button');
            b.type = 'button';
            b.dataset.v = p;
            b.textContent = p;
            b.onclick = () => {
                S.priority = p;
                paint();
            };
            prioContainer.appendChild(b);
        });

        // Status buttons
        statContainer.innerHTML = '';
        STATUSES.forEach(s => {
            const b = document.createElement('button');
            b.type = 'button';
            b.dataset.v = s;
            b.textContent = s;
            b.onclick = () => {
                S.status = s;
                paint();
            };
            statContainer.appendChild(b);
        });

        // Field inputs
        inTitle.oninput = e => {
            S.title = e.target.value;
            paint();
        };
        inDesc.oninput = e => {
            S.desc = e.target.value;
        };

        nextBtn.onclick = () => {
            S.step = Math.min(3, S.step + 1);
            paint();
        };
        backBtn.onclick = () => {
            S.step = Math.max(1, S.step - 1);
            paint();
        };

        if (addAssignmentBtn) {
            addAssignmentBtn.onclick = () => openM();
        }

        if (closeBtn) closeBtn.onclick = closeM;
        if (ov) {
            ov.onclick = e => {
                if (e.target === ov) closeM();
            };
        }

        document.addEventListener('keydown', e => {
            if (!ov.classList.contains('show')) return;
            if (e.key === 'Escape') closeM();
            if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') {
                if (S.step < 3 && !nextBtn.disabled) nextBtn.click();
            }
        });

        saveBtn.onclick = handleSaveAssignment;
    }

    function buildSubjectChips() {
        subjectsContainer.innerHTML = '';
        if (noSubNotice) {
            noSubNotice.classList.toggle('hidden', subjects.length > 0);
        }

        subjects.forEach(sub => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip subject';
            b.dataset.id = sub.subjectId;
            b.dataset.n = sub.name;
            const col = sub.colorCode || sub.color || '#85A7D8';
            b.style.setProperty('--sc', col);
            b.style.setProperty('--sc-soft', col + '26');
            b.innerHTML = `<i></i>${escapeHtml(sub.name)}`;
            b.onclick = () => {
                S.subjectId = sub.subjectId;
                S.subject = sub.name;
                paint();
            };
            subjectsContainer.appendChild(b);
        });
    }

    function paint() {
        // Toggle selected subject
        document.querySelectorAll('#subjects .chip').forEach(b => {
            b.classList.toggle('on', b.dataset.n === S.subject || (S.subjectId && +b.dataset.id === S.subjectId));
        });

        // Toggle selected date
        document.querySelectorAll('#dates .chip[data-o]').forEach(b => {
            b.classList.toggle('on', +b.dataset.o === S.due && !S.customDate);
        });
        const isCustom = !!S.customDate || ![0, 1, 3, 7].includes(S.due);
        $('pickChip').classList.toggle('on', isCustom);

        // Toggle priority & status
        document.querySelectorAll('#prio button').forEach(b => {
            b.classList.toggle('on', b.dataset.v === S.priority);
        });
        document.querySelectorAll('#stat button').forEach(b => {
            b.classList.toggle('on', b.dataset.v === S.status);
        });

        // Panes and Progress
        document.querySelectorAll('.pane').forEach(p => {
            p.classList.toggle('on', +p.dataset.s === S.step);
        });
        document.querySelectorAll('.prog i').forEach((p, i) => {
            p.classList.toggle('done', i < S.step);
        });

        // Header Titles
        if (S.id) {
            stepTitle.textContent = S.step === 1 ? 'Edit Assignment' : STEP_TITLES[S.step - 1];
        } else {
            stepTitle.textContent = STEP_TITLES[S.step - 1];
        }
        subText.textContent = `Step ${S.step} of 3`;

        // Review card updates
        rvTitle.textContent = S.title.trim() || 'Untitled Assignment';
        const displayDueDate = S.customDate ? niceDate(S.customDate) : niceDate(S.due);
        rvMeta.textContent = `${S.subject || 'No subject'} · Due ${displayDueDate} · ${S.priority} priority`;
        rvDot.style.setProperty('--rc', subjectColor(S.subject));

        // Navigation button states
        const ok = !!S.title.trim() && (!!S.subject || !!S.subjectId);
        backBtn.classList.toggle('hidden', S.step === 1);
        nextBtn.classList.toggle('hidden', S.step === 3);
        nextBtn.disabled = S.step === 1 && !ok;

        saveBtn.classList.toggle('hidden', S.step !== 3);
        saveBtn.disabled = !ok;
    }

    function resetModal() {
        Object.assign(S, {
            id: null,
            title: '',
            subject: null,
            subjectId: null,
            due: 0,
            customDate: null,
            priority: 'Medium',
            status: 'Pending',
            desc: '',
            step: 1
        });
        inTitle.value = '';
        inDesc.value = '';
        pickDate.value = '';
        pickBox.classList.remove('show');
        paint();
    }

    function openM(assignmentToEdit = null) {
        resetModal();
        buildSubjectChips();

        if (assignmentToEdit) {
            S.id = assignmentToEdit.assignmentId;
            S.title = assignmentToEdit.title || '';
            inTitle.value = S.title;

            const matchedSub = subjects.find(s => s.subjectId === assignmentToEdit.subjectId || s.name === assignmentToEdit.subjectName);
            if (matchedSub) {
                S.subjectId = matchedSub.subjectId;
                S.subject = matchedSub.name;
            } else {
                S.subjectId = assignmentToEdit.subjectId;
                S.subject = assignmentToEdit.subjectName;
            }

            if (assignmentToEdit.dueDate) {
                const t = new Date();
                t.setHours(0, 0, 0, 0);
                const d = new Date(assignmentToEdit.dueDate + 'T00:00:00');
                S.due = Math.round((d - t) / 864e5);
                S.customDate = assignmentToEdit.dueDate;
                pickDate.value = assignmentToEdit.dueDate;
            }

            const rawPrio = (assignmentToEdit.priority || 'MEDIUM').toUpperCase();
            S.priority = rawPrio === 'HIGH' ? 'High' : (rawPrio === 'LOW' ? 'Low' : 'Medium');

            const rawStat = (assignmentToEdit.status || 'PENDING').toUpperCase();
            S.status = rawStat === 'IN_PROGRESS' ? 'In Progress' : (rawStat === 'COMPLETED' ? 'Completed' : 'Pending');

            S.desc = assignmentToEdit.description || '';
            inDesc.value = S.desc;
        }

        ov.classList.add('show');
        paint();
        setTimeout(() => inTitle.focus(), 250);
    }

    function closeM() {
        ov.classList.remove('show');
    }

    async function handleSaveAssignment() {
        saveBtn.disabled = true;

        const resolvedDueDate = S.customDate ? S.customDate : isoDate(S.due);
        let selectedSubjectId = S.subjectId;
        if (!selectedSubjectId && S.subject) {
            const found = subjects.find(s => s.name === S.subject);
            if (found) selectedSubjectId = found.subjectId;
        }

        const payload = {
            subjectId: selectedSubjectId || (subjects[0] ? subjects[0].subjectId : 1),
            title: S.title.trim(),
            description: S.desc.trim(),
            dueDate: resolvedDueDate,
            priority: S.priority.toUpperCase(),
            status: S.status.toUpperCase().replace(/\s+/g, '_')
        };

        try {
            let res;
            if (S.id) {
                res = await api.put(`/assignments/${S.id}`, payload);
            } else {
                res = await api.post('/assignments', payload);
            }

            if (res && res.ok) {
                closeM();
                showToast(S.id ? 'Assignment updated ✓' : 'Assignment added ✓');
                await fetchAssignments();
            } else {
                throw new Error("Failed response from server");
            }
        } catch (err) {
            console.warn("API save error, persisting locally for preview:", err);
            // Local fallback simulation
            if (S.id) {
                const idx = assignments.findIndex(a => a.assignmentId === S.id);
                if (idx !== -1) {
                    const subObj = subjects.find(s => s.subjectId === payload.subjectId);
                    assignments[idx] = {
                        ...assignments[idx],
                        ...payload,
                        subjectName: subObj ? subObj.name : S.subject,
                        subjectColorCode: subObj ? subObj.colorCode : subjectColor(S.subject)
                    };
                }
            } else {
                const subObj = subjects.find(s => s.subjectId === payload.subjectId);
                const newAssign = {
                    assignmentId: Date.now(),
                    ...payload,
                    subjectName: subObj ? subObj.name : S.subject,
                    subjectColorCode: subObj ? subObj.colorCode : subjectColor(S.subject)
                };
                assignments.push(newAssign);
            }
            closeM();
            showToast(S.id ? 'Assignment updated ✓' : 'Assignment added ✓');
            renderAssignments();
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

    // --- Global Window Actions ---

    window.editAssignment = id => {
        const item = assignments.find(a => a.assignmentId === id);
        if (item) {
            openM(item);
        }
    };

    window.deleteAssignment = async id => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        try {
            const res = await api.delete(`/assignments/${id}`);
            if (res.ok) {
                showToast('Assignment deleted');
                await fetchAssignments();
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            console.warn("Offline fallback for delete:", error);
            assignments = assignments.filter(a => a.assignmentId !== id);
            showToast('Assignment deleted');
            renderAssignments();
        }
    };

    window.moveAssignment = async (id, newStatus) => {
        const assignment = assignments.find(a => a.assignmentId === id);
        if (!assignment) return;

        const updateData = {
            subjectId: assignment.subjectId,
            title: assignment.title,
            description: assignment.description || '',
            dueDate: assignment.dueDate,
            priority: assignment.priority,
            status: newStatus
        };

        try {
            const res = await api.put(`/assignments/${id}`, updateData);
            if (res.ok) {
                await fetchAssignments();
            } else {
                throw new Error("Failed to move assignment status");
            }
        } catch (error) {
            console.warn("Offline fallback for moveAssignment:", error);
            assignment.status = newStatus;
            renderAssignments();
        }
    };

    // --- Kanban Rendering ---

    function showLoadingState() {
        const loader = '<div class="loading-state">Loading assignments...</div>';
        pendingList.innerHTML = loader;
        inProgressList.innerHTML = loader;
        completedList.innerHTML = loader;
    }

    function renderAssignments() {
        let filtered = assignments;
        if (searchQuery) {
            filtered = assignments.filter(a =>
                (a.title || '').toLowerCase().includes(searchQuery) ||
                (a.description || '').toLowerCase().includes(searchQuery) ||
                (a.subjectName || '').toLowerCase().includes(searchQuery)
            );
        }

        const pending = filtered.filter(a => (a.status || '').toUpperCase() === 'PENDING');
        const inProgress = filtered.filter(a => (a.status || '').toUpperCase() === 'IN_PROGRESS');
        const completed = filtered.filter(a => (a.status || '').toUpperCase() === 'COMPLETED');

        // Update column header counter badges if present
        updateColumnCounter('pendingCount', pending.length);
        updateColumnCounter('inProgressCount', inProgress.length);
        updateColumnCounter('completedCount', completed.length);

        renderList(pendingList, pending, 'PENDING');
        renderList(inProgressList, inProgress, 'IN_PROGRESS');
        renderList(completedList, completed, 'COMPLETED');
    }

    function updateColumnCounter(id, count) {
        const el = $(id);
        if (el) el.textContent = count;
    }

    function renderList(container, list, statusType) {
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `<div class="empty-state">No assignments in this column</div>`;
            return;
        }

        container.innerHTML = list.map(assignment => {
            const isCompleted = assignment.status === 'COMPLETED';
            const dateObj = new Date(assignment.dueDate + 'T00:00:00');
            const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : assignment.dueDate;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = !isCompleted && !isNaN(dateObj) && dateObj < today;

            const prioClass = `priority-${(assignment.priority || 'medium').toLowerCase()}`;
            const prioLabel = (assignment.priority || 'Medium').toUpperCase();

            const subName = assignment.subjectName || 'General';
            const subColor = assignment.subjectColorCode || subjectColor(subName);

            let moveActionHTML = '';
            if (statusType === 'PENDING') {
                moveActionHTML = `
                    <button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'IN_PROGRESS')" title="Move to In Progress">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                `;
            } else if (statusType === 'IN_PROGRESS') {
                moveActionHTML = `
                    <button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'PENDING')" title="Move to Pending">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'COMPLETED')" title="Move to Completed">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                `;
            } else if (statusType === 'COMPLETED') {
                moveActionHTML = `
                    <button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'IN_PROGRESS')" title="Move to In Progress">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                `;
            }

            return `
                <div class="task-card ${isCompleted ? 'completed' : ''}">
                    <div class="task-card-header">
                        <h4 class="task-title" title="${escapeHtml(assignment.title)}">${escapeHtml(assignment.title)}</h4>
                        <span class="priority-badge ${prioClass}">${prioLabel}</span>
                    </div>

                    <span class="task-subject" style="background: ${subColor}22; color: ${subColor}">
                        <i style="background: ${subColor}"></i>
                        ${escapeHtml(subName)}
                    </span>

                    ${assignment.description ? `<p class="task-desc">${escapeHtml(assignment.description)}</p>` : ''}

                    <div class="task-card-footer">
                        <div class="task-due ${isOverdue ? 'overdue' : ''}">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${dateStr} ${isOverdue ? '(Overdue)' : ''}</span>
                        </div>

                        <div class="task-actions">
                            ${moveActionHTML}
                            <button class="action-btn" onclick="editAssignment(${assignment.assignmentId})" title="Edit">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteAssignment(${assignment.assignmentId})" title="Delete">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
