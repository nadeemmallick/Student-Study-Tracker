/* =========================================================
   subjects.js – API Integration and DOM Manipulation for Subjects
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;

    // --- State ---
    const userId = session.userId;
    let subjects = [];
    let isEditMode = false;
    
    // --- DOM Elements ---
    const subjectsGrid = document.getElementById('subjectsGrid');
    const modal = document.getElementById('subjectModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addSubjectBtn = document.getElementById('addSubjectBtn');
    
    const subjectForm = document.getElementById('subjectForm');
    const modalTitle = document.getElementById('modalTitle');
    
    // Form Inputs
    const subjectIdInput = document.getElementById('subjectIdInput');
    const subjectNameInput = document.getElementById('subjectNameInput');
    const subjectDescInput = document.getElementById('subjectDescInput');
    const subjectColorInput = document.getElementById('subjectColorInput');
    const colorOptions = document.querySelectorAll('.color-option');

    // --- Initialization ---
    fetchSubjects();

    // --- Modal Logic ---
    function openModal(editMode = false, subject = null) {
        isEditMode = editMode;
        if (editMode && subject) {
            modalTitle.textContent = 'Edit Subject';
            subjectIdInput.value = subject.subjectId;
            subjectNameInput.value = subject.name;
            subjectDescInput.value = subject.description || '';
            
            // Set Color
            subjectColorInput.value = subject.colorCode;
            colorOptions.forEach(opt => {
                opt.classList.toggle('selected', opt.dataset.color === subject.colorCode);
            });
        } else {
            modalTitle.textContent = 'Add New Subject';
            subjectForm.reset();
            subjectIdInput.value = '';
            
            // Default color
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            if(colorOptions.length > 0) {
                colorOptions[0].classList.add('selected');
                subjectColorInput.value = colorOptions[0].dataset.color;
            }
        }
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    addSubjectBtn.addEventListener('click', () => openModal(false));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // Color Picker Logic
    colorOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
            subjectColorInput.value = e.target.dataset.color;
        });
    });

    // --- API Calls ---

    async function fetchSubjects() {
        subjectsGrid.innerHTML = '<div class="loading-state">Loading subjects...</div>';
        try {
            const res = await api.get(`/subjects?userId=${userId}`);
            if (res.ok) {
                subjects = await res.json();
                renderSubjects();
            } else {
                showError("Failed to fetch subjects");
            }
        } catch (error) {
            console.error(error);
            showError("Network error while fetching subjects");
        }
    }

    async function saveSubject(e) {
        e.preventDefault();
        
        const subjectData = {
            name: subjectNameInput.value.trim(),
            description: subjectDescInput.value.trim(),
            colorCode: subjectColorInput.value,
            userId: userId
        };

        try {
            let res;
            if (isEditMode) {
                const id = subjectIdInput.value;
                res = await api.put(`/subjects/${id}`, subjectData);
            } else {
                res = await api.post('/subjects', subjectData);
            }

            if (res.ok) {
                closeModal();
                fetchSubjects(); // Refresh list
            } else {
                alert('Error saving subject');
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    }

    subjectForm.addEventListener('submit', saveSubject);

    window.deleteSubject = async (id) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;
        
        try {
            const res = await api.delete(`/subjects/${id}?userId=${userId}`);
            if (res.ok) {
                fetchSubjects();
            } else {
                alert('Failed to delete subject');
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    };

    window.editSubject = (id) => {
        const subject = subjects.find(s => s.subjectId === id);
        if (subject) openModal(true, subject);
    };

    // --- Rendering ---
    function renderSubjects() {
        if (!subjects || subjects.length === 0) {
            subjectsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--border);"></i>
                    <p>No subjects found. Add a subject to get started!</p>
                </div>`;
            return;
        }

        subjectsGrid.innerHTML = subjects.map(subject => `
            <div class="subject-card glass-panel" style="border-top-color: ${subject.colorCode}">
                <div class="subject-header">
                    <div class="subject-icon" style="background: ${subject.colorCode}20; color: ${subject.colorCode}">
                        <i class="fa-solid fa-book"></i>
                    </div>
                    <div class="subject-actions">
                        <button class="action-btn" onclick="editSubject(${subject.subjectId})" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteSubject(${subject.subjectId})" title="Delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="subject-info">
                    <h3>${escapeHtml(subject.name)}</h3>
                    <p>${escapeHtml(subject.description || 'No description')}</p>
                </div>
                <div class="subject-meta">
                    <span>Added ${new Date(subject.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    }

    function showError(msg) {
        subjectsGrid.innerHTML = `<div class="empty-state" style="color: var(--error);">${msg}</div>`;
    }

    // Utility to prevent XSS
    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
