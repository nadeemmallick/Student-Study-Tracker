document.addEventListener('DOMContentLoaded', () => {
    
    window.auth.requireAuth();

    // DOM Elements
    const notesGrid = document.getElementById('notesGrid');
    const searchInput = document.getElementById('searchInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    
    const noteModal = document.getElementById('noteModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelNoteBtn = document.getElementById('cancelNoteBtn');
    const noteForm = document.getElementById('noteForm');
    
    const modalTitle = document.getElementById('modalTitle');
    const noteIdInput = document.getElementById('noteId');
    const titleInput = document.getElementById('title');
    const subjectIdInput = document.getElementById('subjectId');
    const contentInput = document.getElementById('content');

    let allNotes = [];
    let allSubjects = [];

    // Initialize
    const init = async () => {
        const sessionUser = window.auth.getSession();
        if (sessionUser) {
            document.getElementById('userNameDisplay').textContent = sessionUser.name;
            document.getElementById('headerAvatar').textContent = sessionUser.name.charAt(0).toUpperCase();
        }
        
        await loadSubjects();
        await loadNotes();
    };

    // Load Subjects for dropdown
    const loadSubjects = async () => {
        try {
            const res = await api.get('/subjects');
            if (res.ok) {
                allSubjects = await res.json();
                populateSubjectDropdown();
            }
        } catch (error) {
            console.error("Failed to load subjects", error);
        }
    };

    const populateSubjectDropdown = () => {
        subjectIdInput.innerHTML = '<option value="">No Subject</option>';
        allSubjects.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub.subjectId;
            option.textContent = sub.name;
            subjectIdInput.appendChild(option);
        });
    };

    // Load Notes
    const loadNotes = async () => {
        try {
            const res = await api.get('/notes');
            if (res.ok) {
                allNotes = await res.json();
                renderNotes(allNotes);
            }
        } catch (error) {
            console.error("Failed to load notes", error);
        }
    };

    // Render Notes
    const renderNotes = (notes) => {
        notesGrid.innerHTML = '';
        
        if (notes.length === 0) {
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fa-solid fa-note-sticky"></i></div>
                    <h3>No notes found</h3>
                    <p>${searchInput.value ? 'Try adjusting your search.' : 'Click "New Note" to get started!'}</p>
                </div>
            `;
            return;
        }

        notes.forEach(note => {
            const dateStr = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            let subjectHtml = '';
            if (note.subjectId) {
                const color = note.subjectColorCode || '#4f46e5';
                subjectHtml = `<span class="note-subject-tag" style="color: ${color}; border: 1px solid ${color}40">${note.subjectName}</span>`;
            }

            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <div class="note-actions">
                        <button class="action-btn edit" data-id="${note.noteId}" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete" data-id="${note.noteId}" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="note-content-preview">${note.content || '<em>Empty note...</em>'}</div>
                <div class="note-footer">
                    <span>${dateStr}</span>
                    ${subjectHtml}
                </div>
            `;
            
            // Edit listener (clicking the card or the edit button)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.delete')) {
                    openEditModal(note);
                }
            });

            // Delete listener
            const deleteBtn = card.querySelector('.delete');
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // prevent card click
                if (confirm('Are you sure you want to delete this note?')) {
                    await deleteNote(note.noteId);
                }
            });

            notesGrid.appendChild(card);
        });
    };

    // Search Logic
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        searchTimeout = setTimeout(async () => {
            if (query === '') {
                renderNotes(allNotes); // Use cached all notes if search is empty
            } else {
                try {
                    const res = await api.get(`/notes/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const searchResults = await res.json();
                        renderNotes(searchResults);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                }
            }
        }, 300); // 300ms debounce
    });

    // Delete Logic
    const deleteNote = async (id) => {
        try {
            const res = await api.delete(`/notes/${id}`);
            if (res.ok) {
                // Refresh list
                searchInput.value = ''; // clear search on delete
                await loadNotes();
            }
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    // Modal Logic
    const openNewModal = () => {
        modalTitle.textContent = 'New Note';
        noteIdInput.value = '';
        titleInput.value = '';
        subjectIdInput.value = '';
        contentInput.value = '';
        noteModal.classList.add('active');
    };

    const openEditModal = (note) => {
        modalTitle.textContent = 'Edit Note';
        noteIdInput.value = note.noteId;
        titleInput.value = note.title;
        subjectIdInput.value = note.subjectId || '';
        contentInput.value = note.content;
        noteModal.classList.add('active');
    };

    const closeModal = () => {
        noteModal.classList.remove('active');
    };

    addNoteBtn.addEventListener('click', openNewModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelNoteBtn.addEventListener('click', closeModal);

    // Close on outside click
    noteModal.addEventListener('click', (e) => {
        if (e.target === noteModal) closeModal();
    });

    // Save Logic
    noteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const payload = {
            title: titleInput.value.trim(),
            content: contentInput.value.trim(),
            subjectId: subjectIdInput.value ? parseInt(subjectIdInput.value) : null
        };
        
        const id = noteIdInput.value;
        
        try {
            let res;
            if (id) {
                res = await api.put(`/notes/${id}`, payload);
            } else {
                res = await api.post('/notes', payload);
            }
            
            if (res.ok) {
                closeModal();
                searchInput.value = ''; // clear search on save
                await loadNotes();
            } else {
                alert('Failed to save note.');
            }
        } catch (error) {
            console.error("Save failed", error);
        }
    });

    // Sidebar Mobile Toggle (Global)
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

    // Start
    init();
});
