/* =========================================================
   subjects.js – Interactive Modern UI & Full API Integration
   StudySync – Student Study Tracker
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // ── Authentication Check ───────────────────────────────────
    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;

    // ── SVG Icon Registry ──────────────────────────────────────
    const ICONS = {
        book:  '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        calc:  '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
        code:  '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
        flask: '<path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.5V2"/><path d="M8.5 2h7"/>',
        db:    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
        globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
        pen:   '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
        cpu:   '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>'
    };

    const renderSvg = (key, className = 'i') => {
        const path = ICONS[key] || ICONS.book;
        return `<svg class="${className}" viewBox="0 0 24 24">${path}</svg>`;
    };

    // ── Color Swatches & Preset Templates ──────────────────────
    const SWATCH_COLORS = ['#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#6366F1'];

    const TEMPLATES = [
        ['Mathematics', 'Calculus & Algebra', '#7C3AED', 'calc'],
        ['Physics', 'Mechanics & Waves', '#3B82F6', 'flask'],
        ['Java', 'OOP & Collections', '#F59E0B', 'code'],
        ['SQL', 'Queries & Schema Design', '#10B981', 'db'],
        ['DSA', 'Algorithms & Complexity', '#EF4444', 'cpu'],
        ['English', 'Grammar & Literature', '#EC4899', 'pen']
    ];

    const WIZARD_STEPS = [
        ['Name your subject', 'Step 1 of 3'],
        ['Make it yours', 'Step 2 of 3'],
        ['Set a weekly goal', 'Step 3 of 3']
    ];

    // ── Component State ────────────────────────────────────────
    let subjects = [];
    const S = {
        v: 1,                 // Active Modal View (1=Colour studio, 2=Step by step, 3=Templates, 4=Big type)
        name: '',
        desc: '',
        color: '#7C3AED',
        icon: 'book',
        goal: 5,
        step: 1,
        tpl: null,
        editId: null          // null when adding, number when editing
    };

    // ── DOM References ─────────────────────────────────────────
    const subjectsGrid = document.getElementById('subjectsGrid');
    const searchInput = document.getElementById('searchInput');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    const modalOverlay = document.getElementById('subjectModal');
    const toastEl = document.getElementById('subjectToast');

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

    // ── Build Swatches, Icons & Templates ──────────────────────
    function initModalWidgets() {
        // Color Swatches
        document.querySelectorAll('.swatches').forEach(container => {
            container.innerHTML = '';
            SWATCH_COLORS.forEach(color => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'sw';
                btn.dataset.c = color;
                btn.style.setProperty('--sc', color);
                btn.setAttribute('aria-label', 'Color ' + color);
                btn.onclick = () => {
                    S.color = color;
                    paint();
                };
                container.appendChild(btn);
            });
        });

        // Icon Buttons
        document.querySelectorAll('.icons').forEach(container => {
            container.innerHTML = '';
            Object.keys(ICONS).forEach(key => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'ic';
                btn.dataset.k = key;
                btn.innerHTML = renderSvg(key);
                btn.setAttribute('aria-label', key);
                btn.onclick = () => {
                    S.icon = key;
                    paint();
                };
                container.appendChild(btn);
            });
        });

        // Gallery Templates
        const galContainer = document.getElementById('gal');
        if (galContainer) {
            galContainer.innerHTML = '';
            TEMPLATES.forEach(([name, desc, color, iconKey], idx) => {
                const card = document.createElement('button');
                card.type = 'button';
                card.className = 'gc';
                card.dataset.i = idx;
                card.style.setProperty('--gc', color);
                card.style.setProperty('--gs', color + '22');
                card.innerHTML = `<div class="bubble">${renderSvg(iconKey)}</div><b>${name}</b><span>${desc}</span>`;
                card.onclick = () => {
                    S.tpl = idx;
                    S.name = name;
                    S.desc = desc;
                    S.color = color;
                    S.icon = iconKey;
                    paint();
                };
                galContainer.appendChild(card);
            });

            // Custom Template Card
            const customCard = document.createElement('button');
            customCard.type = 'button';
            customCard.className = 'gc custom';
            customCard.dataset.i = 'custom';
            customCard.innerHTML = `<div class="bubble">${renderSvg('pen')}</div><b>Custom</b><span>Build your own</span>`;
            customCard.onclick = () => {
                S.tpl = 'custom';
                S.name = '';
                S.desc = '';
                paint();
                setTimeout(() => {
                    const customInput = document.querySelector('#m3 .in-name');
                    if (customInput) customInput.focus();
                }, 100);
            };
            galContainer.appendChild(customCard);
        }
    }

    // ── Live Paint / UI Reactive Sync ──────────────────────────
    function paint() {
        const root = document.documentElement.style;
        root.setProperty('--c', S.color);
        root.setProperty('--c-soft', S.color + '22');

        // Update inputs if not currently focused
        document.querySelectorAll('.in-name').forEach(input => {
            if (input !== document.activeElement) input.value = S.name;
        });
        document.querySelectorAll('.in-desc').forEach(input => {
            if (input !== document.activeElement) input.value = S.desc;
        });

        // Live preview elements
        document.querySelectorAll('.p-name').forEach(el => {
            const hasName = S.name.trim();
            el.textContent = hasName || el.dataset.ph || 'New Subject';
            el.classList.toggle('ph', !hasName);
        });

        document.querySelectorAll('.p-desc').forEach(el => {
            el.textContent = S.desc.trim() || el.dataset.ph || 'Add a short description';
        });

        document.querySelectorAll('.p-ico').forEach(el => {
            el.innerHTML = renderSvg(S.icon);
        });

        // Swatch & Icon highlights
        document.querySelectorAll('.sw').forEach(btn => {
            btn.classList.toggle('on', btn.dataset.c.toLowerCase() === S.color.toLowerCase());
        });

        document.querySelectorAll('.ic').forEach(btn => {
            btn.classList.toggle('on', btn.dataset.k === S.icon);
        });

        // Wizard & Goal values
        document.querySelectorAll('.gval').forEach(el => {
            el.textContent = S.goal;
        });

        // Gallery active states
        document.querySelectorAll('.gc').forEach(btn => {
            btn.classList.toggle('on', String(btn.dataset.i) === String(S.tpl) && btn.dataset.i !== 'custom');
        });

        const customPanel = document.getElementById('cp');
        if (customPanel) {
            customPanel.classList.toggle('show', S.tpl !== null);
        }

        // Enable / Disable Save Buttons
        const isValid = S.name.trim().length > 0;
        document.querySelectorAll('.save-subject-btn').forEach(btn => {
            btn.disabled = !isValid;
        });

        const nextBtn = document.querySelector('#m2 .next');
        if (nextBtn) nextBtn.disabled = !isValid;

        // Step by Step Wizard Navigation
        document.querySelectorAll('#m2 .pane').forEach(pane => {
            pane.classList.toggle('on', +pane.dataset.s === S.step);
        });

        document.querySelectorAll('#m2 .prog i').forEach((progItem, i) => {
            progItem.classList.toggle('done', i < S.step);
        });

        const wzTitle = document.getElementById('wzT');
        const wzSubtitle = document.getElementById('wzS');
        if (wzTitle && wzSubtitle && WIZARD_STEPS[S.step - 1]) {
            wzTitle.textContent = WIZARD_STEPS[S.step - 1][0];
            wzSubtitle.textContent = WIZARD_STEPS[S.step - 1][1];
        }

        const backBtn = document.querySelector('#m2 .back');
        if (backBtn) backBtn.classList.toggle('hidden', S.step === 1);
        if (nextBtn) nextBtn.classList.toggle('hidden', S.step === 3);

        const m2SaveBtn = document.querySelector('#m2 .save-subject-btn');
        if (m2SaveBtn) m2SaveBtn.classList.toggle('hidden', S.step !== 3);
    }

    // ── Input Listeners ────────────────────────────────────────
    document.querySelectorAll('.in-name').forEach(input => {
        input.addEventListener('input', (e) => {
            S.name = e.target.value;
            paint();
        });
    });

    document.querySelectorAll('.in-desc').forEach(input => {
        input.addEventListener('input', (e) => {
            S.desc = e.target.value;
            paint();
        });
    });

    // Wizard buttons
    document.querySelectorAll('.gm').forEach(b => b.addEventListener('click', () => {
        S.goal = Math.max(1, S.goal - 1);
        paint();
    }));

    document.querySelectorAll('.gp').forEach(b => b.addEventListener('click', () => {
        S.goal = Math.min(40, S.goal + 1);
        paint();
    }));

    const nextBtn = document.querySelector('#m2 .next');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            S.step = Math.min(3, S.step + 1);
            paint();
        });
    }

    const backBtn = document.querySelector('#m2 .back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            S.step = Math.max(1, S.step - 1);
            paint();
        });
    }

    // Modal view switcher tabs
    function setModalView(viewIndex) {
        S.v = viewIndex;
        document.querySelectorAll('#ideasTabs button').forEach(btn => {
            btn.classList.toggle('on', +btn.dataset.v === viewIndex);
        });
        [1, 2, 3, 4].forEach(n => {
            const modalView = document.getElementById('m' + n);
            if (modalView) {
                modalView.classList.toggle('hidden', n !== viewIndex);
                if (n === viewIndex) {
                    modalView.style.animation = 'none';
                    void modalView.offsetWidth;
                    modalView.style.animation = '';
                }
            }
        });
        paint();
    }

    document.querySelectorAll('#ideasTabs button').forEach(btn => {
        btn.addEventListener('click', () => setModalView(+btn.dataset.v));
    });

    // ── Modal Open / Close Logic ───────────────────────────────
    function openModal(editMode = false, subject = null) {
        if (editMode && subject) {
            S.editId = subject.subjectId || subject.id;
            S.name = subject.name || '';
            S.desc = subject.description || '';
            S.color = subject.colorCode || '#7C3AED';
            S.icon = inferIcon(subject.name);
            S.tpl = null;
            S.step = 1;
        } else {
            S.editId = null;
            S.name = '';
            S.desc = '';
            S.color = '#7C3AED';
            S.icon = 'book';
            S.goal = 5;
            S.step = 1;
            S.tpl = null;
        }

        setModalView(1);
        modalOverlay.classList.add('active');

        setTimeout(() => {
            const activeInput = document.querySelector('#m' + S.v + ' .in-name');
            if (activeInput) activeInput.focus();
        }, 150);
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        S.editId = null;
    }

    if (addSubjectBtn) addSubjectBtn.addEventListener('click', () => openModal(false));
    document.querySelectorAll('.close-modal-btn, .cancel-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // ── Infer Icon from Subject Name ───────────────────────────
    function inferIcon(name = '') {
        const lower = name.toLowerCase();
        if (lower.includes('math') || lower.includes('calc') || lower.includes('algebra')) return 'calc';
        if (lower.includes('code') || lower.includes('prog') || lower.includes('java') || lower.includes('python')) return 'code';
        if (lower.includes('physic') || lower.includes('chem') || lower.includes('bio') || lower.includes('science')) return 'flask';
        if (lower.includes('data') || lower.includes('sql') || lower.includes('db')) return 'db';
        if (lower.includes('dsa') || lower.includes('algo') || lower.includes('cpu') || lower.includes('hardware')) return 'cpu';
        if (lower.includes('eng') || lower.includes('writ') || lower.includes('lit')) return 'pen';
        if (lower.includes('geo') || lower.includes('hist') || lower.includes('world')) return 'globe';
        return 'book';
    }

    // ── API: Fetch All Subjects ────────────────────────────────
    async function fetchSubjects() {
        subjectsGrid.innerHTML = `
            <div class="empty-state">
                <p>Loading subjects...</p>
            </div>`;

        try {
            const res = await api.get('/subjects');
            if (res.ok) {
                subjects = await res.json();
                renderSubjects(subjects);
            } else {
                subjectsGrid.innerHTML = `<div class="empty-state" style="color:var(--danger)">Failed to load subjects.</div>`;
            }
        } catch (err) {
            console.error('Error fetching subjects:', err);
            subjectsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Connection issue</h3>
                    <p>Could not load subjects. Please check backend connection.</p>
                </div>`;
        }
    }

    // ── API: Save Subject (Create or Update) ────────────────────
    async function handleSaveSubject() {
        if (!S.name.trim()) return;

        const subjectPayload = {
            name: S.name.trim(),
            description: S.desc.trim(),
            colorCode: S.color
        };

        const saveBtns = document.querySelectorAll('.save-subject-btn');
        saveBtns.forEach(b => {
            b.disabled = true;
            b.textContent = 'Saving...';
        });

        try {
            let res;
            if (S.editId) {
                res = await api.put(`/subjects/${S.editId}`, subjectPayload);
            } else {
                res = await api.post('/subjects', subjectPayload);
            }

            if (res.ok) {
                closeModal();
                showToast(S.editId ? 'Subject updated successfully! ✓' : 'Subject created successfully! ✓');
                fetchSubjects();
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.message || 'Error saving subject.');
            }
        } catch (err) {
            console.error('Save error:', err);
            showToast('Network error while saving subject.');
        } finally {
            saveBtns.forEach(b => {
                b.disabled = false;
                b.textContent = 'Save Subject';
            });
        }
    }

    document.querySelectorAll('.save-subject-btn').forEach(btn => {
        btn.addEventListener('click', handleSaveSubject);
    });

    // ── API: Delete Subject ────────────────────────────────────
    window.deleteSubject = async (id) => {
        if (!confirm('Are you sure you want to delete this subject? All linked study sessions and assignments will also be deleted.')) {
            return;
        }

        try {
            const res = await api.delete(`/subjects/${id}`);
            if (res.ok) {
                showToast('Subject deleted ✓');
                fetchSubjects();
            } else {
                showToast('Failed to delete subject.');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Network error while deleting subject.');
        }
    };

    // ── Edit Subject Click Handler ─────────────────────────────
    window.editSubject = (id) => {
        const sub = subjects.find(s => (s.subjectId === id || s.id === id));
        if (sub) openModal(true, sub);
    };

    // ── Render Subjects Grid ───────────────────────────────────
    function renderSubjects(itemsToRender) {
        if (!itemsToRender || itemsToRender.length === 0) {
            subjectsGrid.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    <h3>No subjects found</h3>
                    <p>Click "Add New Subject" above to get started with your study tracker!</p>
                </div>`;
            return;
        }

        subjectsGrid.innerHTML = itemsToRender.map(subject => {
            const color = subject.colorCode || '#7C3AED';
            const iconKey = inferIcon(subject.name);
            const dateStr = subject.createdAt 
                ? new Date(subject.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Active';

            return `
            <div class="subject-card" style="--c: ${color}; --c-soft: ${color}20;">
                <div class="subject-card-head">
                    <div class="subject-card-bubble">
                        ${renderSvg(iconKey)}
                    </div>
                    <div class="subject-card-actions">
                        <button type="button" class="card-btn" onclick="editSubject(${subject.subjectId || subject.id})" title="Edit Subject">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="card-btn del" onclick="deleteSubject(${subject.subjectId || subject.id})" title="Delete Subject">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>

                <div class="subject-card-body">
                    <h3>${escapeHtml(subject.name)}</h3>
                    <p>${escapeHtml(subject.description || 'No description provided.')}</p>
                </div>

                <div class="subject-card-footer">
                    <span>${dateStr}</span>
                    <span class="subject-pill">${escapeHtml(subject.name.substring(0, 16))}</span>
                </div>
            </div>`;
        }).join('');
    }

    // ── Live Search Filter ─────────────────────────────────────
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            if (!query) {
                renderSubjects(subjects);
                return;
            }
            const filtered = subjects.filter(s => 
                (s.name && s.name.toLowerCase().includes(query)) ||
                (s.description && s.description.toLowerCase().includes(query))
            );
            renderSubjects(filtered);
        });
    }

    // ── Keyboard Shortcuts (Enter key in inputs) ───────────────
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
            return;
        }
        if (e.key === 'Enter' && e.target.classList.contains('in-name') && S.name.trim()) {
            e.preventDefault();
            if (S.v === 2 && S.step < 3) {
                S.step++;
                paint();
            } else {
                handleSaveSubject();
            }
        }
    });

    // ── XSS Sanitizer Helper ───────────────────────────────────
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    // ── Initial Boot ───────────────────────────────────────────
    initModalWidgets();
    fetchSubjects();
});
