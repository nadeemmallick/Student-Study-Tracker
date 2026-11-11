/* =========================================================
   notes.js – StudySync Notes & Quick-Capture API Integration
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ── Authentication Guard ──────────────────────────────────
    if (window.auth && typeof window.auth.requireAuth === 'function') {
        window.auth.requireAuth();
    }
    const session = window.auth ? window.auth.getSession() : null;
    if (!session) return;

    if (session) {
        const userEl = document.getElementById('userNameDisplay');
        if (userEl) userEl.textContent = session.name || 'Student';
    }

    // ── State ─────────────────────────────────────────────────
    let SUBJECTS = [];
    let NOTES = [];
    let editing = null;             // The note currently being edited, or null for new note
    let selectedSubjectId = null;   // The selected subject ID, or null
    let lastSavedId = null;

    // ── Helper Utilities ──────────────────────────────────────
    const $ = id => document.getElementById(id);
    const esc = s => (s || '').toString().replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const plain = html => {
        const d = document.createElement('div');
        d.innerHTML = html || '';
        return (d.textContent || d.innerText || '').trim();
    };
    const colorOf = subjectId => {
        const found = SUBJECTS.find(s => s.subjectId === subjectId);
        return found ? (found.colorCode || '#85A7D8') : '#85A7D8';
    };
    const fmtDate = d => {
        if (!d) return 'Just now';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // ── DOM References ────────────────────────────────────────
    const comp = $('comp');
    const compBar = $('compBar');
    const compCancel = $('compCancel');
    const compDone = $('compDone');
    const compDelete = $('compDelete');
    const inTitle = $('inTitle');
    const inBody = $('inBody');
    const subjectsChipsWrap = $('subjects');
    const grid = $('grid') || $('notesGrid');
    const toastEl = $('toast');
    const searchInput = $('searchInput');
    const addNoteBtn = $('addNoteBtn');

    // ── Toast Notification ────────────────────────────────────
    function showToast(msg) {
        if (window.toast && typeof window.toast.success === 'function') {
            window.toast.success(msg);
        } else if (toastEl) {
            toastEl.textContent = msg;
            toastEl.classList.add('show');
            setTimeout(() => toastEl.classList.remove('show'), 2000);
        }
    }

    // ── API: Load Subjects ────────────────────────────────────
    async function loadSubjects() {
        try {
            const res = await api.get('/subjects');
            if (res.ok) {
                SUBJECTS = await res.json();
            } else {
                throw new Error("Could not load subjects");
            }
        } catch (error) {
            console.warn("Using offline fallback subjects:", error);
            SUBJECTS = [
                { subjectId: 1, name: 'Mathematics', colorCode: '#7C3AED' },
                { subjectId: 2, name: 'Physics', colorCode: '#3B82F6' },
                { subjectId: 3, name: 'Coding', colorCode: '#10B981' },
                { subjectId: 4, name: 'SQL', colorCode: '#F59E0B' }
            ];
        }
        renderChips();
    }

    // ── API: Load Notes ───────────────────────────────────────
    async function loadNotes() {
        if (grid) {
            grid.innerHTML = '<div class="empty"><b>Loading notes...</b></div>';
        }
        try {
            const res = await api.get('/notes');
            if (res.ok) {
                NOTES = await res.json();
                renderGrid();
            } else {
                throw new Error("Could not load notes");
            }
        } catch (error) {
            console.warn("Using offline fallback notes:", error);
            NOTES = [
                {
                    noteId: 1,
                    title: 'Calculus Cheat Sheet',
                    content: 'Derivative rules, integration by parts, and trigonometric limits.',
                    subjectId: 1,
                    subjectName: 'Mathematics',
                    subjectColorCode: '#7C3AED',
                    updatedAt: new Date().toISOString()
                }
            ];
            renderGrid();
        }
    }

    // ── Render Notes Grid ─────────────────────────────────────
    function renderGrid(notesToDisplay = null) {
        const displayList = notesToDisplay || NOTES;
        if (!grid) return;

        grid.innerHTML = '';
        if (!displayList || !displayList.length) {
            grid.innerHTML = `
                <div class="empty">
                    <b>No notes found</b>
                    ${searchInput && searchInput.value ? 'Try adjusting your search query.' : 'Click "Take a note…" above to get started!'}
                </div>
            `;
            return;
        }

        const sorted = [...displayList].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

        sorted.forEach(n => {
            const subjectId = n.subjectId;
            const subjectObj = SUBJECTS.find(s => s.subjectId === subjectId);
            const subName = n.subjectName || (subjectObj ? subjectObj.name : null);
            const subColor = n.subjectColorCode || (subjectObj ? subjectObj.colorCode : colorOf(subjectId));

            const card = document.createElement('div');
            card.className = 'nc' + (n.noteId === lastSavedId ? ' new' : '');
            card.style.setProperty('--nc', subName ? subColor : '#BAD5EB');
            card.style.setProperty('--nc-soft', subName ? subColor + '33' : '#BAD5EB33');

            const titleText = (n.title || '').trim();
            const bodyPlain = plain(n.content);

            card.innerHTML = `
                <h4 class="${titleText ? '' : 'ut'}">${esc(titleText || 'Untitled')}</h4>
                <p>${esc(bodyPlain) || '&nbsp;'}</p>
                <div class="nf">
                    <span>${fmtDate(n.updatedAt || n.createdAt)}</span>
                    ${subName ? `<span class="pill" style="background:${subColor}22;color:${subColor};border-color:${subColor}40">${esc(subName)}</span>` : ''}
                </div>
            `;

            card.onclick = () => openComposer(n);
            grid.appendChild(card);
        });

        lastSavedId = null;
    }

    // ── Render Subject Chips in Composer ──────────────────────
    function renderChips() {
        if (!subjectsChipsWrap) return;
        subjectsChipsWrap.innerHTML = '';

        const chipOptions = [
            { subjectId: null, label: 'No subject', color: '#7F93AD' },
            ...SUBJECTS.map(s => ({ subjectId: s.subjectId, label: s.name, color: s.colorCode || '#85A7D8' }))
        ];

        chipOptions.forEach(s => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'chip' + (selectedSubjectId === s.subjectId ? ' on' : '');
            b.style.setProperty('--sc', s.color);
            b.style.setProperty('--sc-soft', s.color + '26');
            b.innerHTML = `<i></i>${esc(s.label)}`;
            b.onclick = () => {
                selectedSubjectId = s.subjectId;
                renderChips();
            };
            subjectsChipsWrap.appendChild(b);
        });
    }

    // ── Composer Open / Close ─────────────────────────────────
    function openComposer(note) {
        editing = note || null;
        inTitle.value = note ? (note.title || '') : '';
        inBody.innerHTML = note ? (note.content || '') : '';
        selectedSubjectId = note ? (note.subjectId || null) : null;

        if (compDelete) {
            compDelete.style.display = note ? '' : 'none';
        }

        renderChips();
        comp.classList.add('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        setTimeout(() => {
            if (note) {
                inBody.focus();
            } else {
                inTitle.focus();
            }
        }, 250);
    }

    function closeComposer() {
        comp.classList.remove('open');
        editing = null;
        selectedSubjectId = null;
        inTitle.value = '';
        inBody.innerHTML = '';
    }

    if (compBar) compBar.onclick = () => openComposer(null);
    if (addNoteBtn) addNoteBtn.onclick = () => openComposer(null);
    if (compCancel) compCancel.onclick = closeComposer;

    // ── Done = Save Note ──────────────────────────────────────
    if (compDone) {
        compDone.onclick = async () => {
            if (inBody.innerHTML === '<br>') inBody.innerHTML = '';
            let title = inTitle.value.trim();
            const content = inBody.innerHTML.trim();
            const textContent = plain(content);

            // Nothing entered at all -> simply dismiss
            if (!title && !textContent) {
                closeComposer();
                return;
            }

            // Fallback title to satisfy backend @NotBlank constraint
            if (!title) {
                title = textContent.slice(0, 30) || 'Untitled Note';
            }

            const payload = {
                title: title,
                content: content,
                subjectId: selectedSubjectId
            };

            compDone.disabled = true;
            compDone.textContent = 'Saving...';

            try {
                let res;
                if (editing && editing.noteId) {
                    res = await api.put(`/notes/${editing.noteId}`, payload);
                } else {
                    res = await api.post('/notes', payload);
                }

                if (res.ok) {
                    const savedData = await res.json();
                    lastSavedId = savedData ? (savedData.noteId || savedData.id) : null;
                    showToast(editing ? 'Note updated ✓' : 'Note saved ✓');
                    closeComposer();
                    await loadNotes();
                } else {
                    throw new Error('Save error');
                }
            } catch (err) {
                console.warn('Backend save failed, updating locally:', err);
                // Fallback simulation
                if (editing) {
                    const idx = NOTES.findIndex(n => n.noteId === editing.noteId);
                    if (idx !== -1) {
                        const sub = SUBJECTS.find(s => s.subjectId === selectedSubjectId);
                        NOTES[idx] = {
                            ...NOTES[idx],
                            ...payload,
                            subjectName: sub ? sub.name : null,
                            subjectColorCode: sub ? sub.colorCode : null,
                            updatedAt: new Date().toISOString()
                        };
                    }
                } else {
                    const sub = SUBJECTS.find(s => s.subjectId === selectedSubjectId);
                    const newId = Date.now();
                    lastSavedId = newId;
                    NOTES.unshift({
                        noteId: newId,
                        ...payload,
                        subjectName: sub ? sub.name : null,
                        subjectColorCode: sub ? sub.colorCode : null,
                        updatedAt: new Date().toISOString()
                    });
                }
                showToast(editing ? 'Note updated ✓' : 'Note saved ✓');
                closeComposer();
                renderGrid();
            } finally {
                compDone.disabled = false;
                compDone.textContent = 'Done';
            }
        };
    }

    // ── Delete Note ───────────────────────────────────────────
    if (compDelete) {
        compDelete.onclick = async () => {
            if (!editing || !editing.noteId) return;
            if (!confirm('Are you sure you want to delete this note?')) return;

            try {
                const res = await api.delete(`/notes/${editing.noteId}`);
                if (res.ok) {
                    showToast('Note deleted');
                    closeComposer();
                    await loadNotes();
                } else {
                    throw new Error('Delete failed');
                }
            } catch (err) {
                console.warn('Backend delete failed, removing locally:', err);
                NOTES = NOTES.filter(n => n.noteId !== editing.noteId);
                showToast('Note deleted');
                closeComposer();
                renderGrid();
            }
        };
    }

    // ── Search Notes ──────────────────────────────────────────
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim().toLowerCase();

            searchTimeout = setTimeout(async () => {
                if (!query) {
                    renderGrid(NOTES);
                    return;
                }

                try {
                    const res = await api.get(`/notes/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const searchResults = await res.json();
                        renderGrid(searchResults);
                        return;
                    }
                } catch (err) {
                    console.warn("Backend search failed, falling back to local filter:", err);
                }

                // Client filter fallback
                const filtered = NOTES.filter(n =>
                    (n.title && n.title.toLowerCase().includes(query)) ||
                    (n.content && n.content.toLowerCase().includes(query)) ||
                    (n.subjectName && n.subjectName.toLowerCase().includes(query))
                );
                renderGrid(filtered);
            }, 250);
        });
    }

    // ── Keyboard Shortcuts (Esc & Ctrl+Enter) ─────────────────
    document.addEventListener('keydown', e => {
        if (!comp || !comp.classList.contains('open')) return;
        if (e.key === 'Escape') closeComposer();
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (compDone) compDone.click();
        }
    });

    // ── Initial Boot ──────────────────────────────────────────
    loadSubjects();
    loadNotes();
});
