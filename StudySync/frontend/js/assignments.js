/* =========================================================
   assignments.js – API Integration and DOM Manipulation
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;

    // --- State ---
    const userId = session.userId;
    let assignments = [];
    let subjects = [];
    let isEditMode = false;
    
    // --- DOM Elements ---
    const pendingList = document.getElementById('pendingList');
    const inProgressList = document.getElementById('inProgressList');
    const completedList = document.getElementById('completedList');
    
    const modal = document.getElementById('assignmentModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    
    const assignmentForm = document.getElementById('assignmentForm');
    const modalTitle = document.getElementById('modalTitle');
    
    const idInput = document.getElementById('assignmentIdInput');
    const titleInput = document.getElementById('assignmentTitleInput');
    const subjectSelect = document.getElementById('assignmentSubjectInput');
    const dueDateInput = document.getElementById('assignmentDueDateInput');
    const prioritySelect = document.getElementById('assignmentPriorityInput');
    const statusSelect = document.getElementById('assignmentStatusInput');
    const descInput = document.getElementById('assignmentDescInput');

    // --- Initialization ---
    init();

    async function init() {
        await fetchSubjects();
        await fetchAssignments();
    }

    // --- Modal Logic ---
    function openModal(editMode = false, assignment = null) {
        isEditMode = editMode;
        if (editMode && assignment) {
            modalTitle.textContent = 'Edit Assignment';
            idInput.value = assignment.assignmentId;
            titleInput.value = assignment.title;
            subjectSelect.value = assignment.subjectId;
            dueDateInput.value = assignment.dueDate;
            prioritySelect.value = assignment.priority;
            statusSelect.value = assignment.status;
            descInput.value = assignment.description || '';
        } else {
            modalTitle.textContent = 'Add Assignment';
            assignmentForm.reset();
            idInput.value = '';
            // Default date to today
            dueDateInput.value = new Date().toISOString().split('T')[0];
            prioritySelect.value = 'MEDIUM';
            statusSelect.value = 'PENDING';
        }
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    addAssignmentBtn.addEventListener('click', () => openModal(false));
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // --- API Calls ---

    async function fetchSubjects() {
        try {
            const res = await api.get(`/subjects?userId=${userId}`);
            if (res.ok) {
                subjects = await res.json();
                populateSubjectDropdown();
            } else {
                throw new Error("Backend offline - non 200 response");
            }
        } catch (error) {
            console.error("Failed to load subjects", error);
            subjects = [
                { subjectId: 1, name: "Mathematics", colorCode: "#7c3aed" },
                { subjectId: 2, name: "Physics", colorCode: "#f59e0b" },
                { subjectId: 3, name: "History", colorCode: "#10b981" }
            ];
            populateSubjectDropdown();
        }
    }

    function populateSubjectDropdown() {
        if (subjects.length === 0) {
            subjectSelect.innerHTML = '<option value="" disabled selected>No subjects found.</option>';
            return;
        }
        subjectSelect.innerHTML = '<option value="" disabled selected>Select a subject...</option>' + 
            subjects.map(sub => `<option value="${sub.subjectId}">${escapeHtml(sub.name)}</option>`).join('');
    }

    async function fetchAssignments() {
        showLoadingState();
        try {
            const res = await api.get(`/assignments?userId=${userId}`);
            if (res.ok) {
                assignments = await res.json();
                renderAssignments();
            } else {
                throw new Error("Backend offline - non 200 response");
            }
        } catch (error) {
            console.log("Backend offline: loading mock assignments for UI preview.");
            assignments = [
                { assignmentId: 1, subjectId: 1, subjectName: "Mathematics", subjectColorCode: "#7c3aed", title: "Calculus Worksheet 4", description: "Complete all odd problems.", dueDate: "2026-07-28", priority: "HIGH", status: "PENDING" },
                { assignmentId: 2, subjectId: 2, subjectName: "Physics", subjectColorCode: "#f59e0b", title: "Lab Report: Kinematics", description: "Write up the results from Tuesday's lab.", dueDate: "2026-07-30", priority: "MEDIUM", status: "IN_PROGRESS" },
                { assignmentId: 3, subjectId: 3, subjectName: "History", subjectColorCode: "#10b981", title: "Read Chapter 12", description: "Read about the Industrial Revolution.", dueDate: "2026-07-20", priority: "LOW", status: "COMPLETED" }
            ];
            renderAssignments();
        }
    }

    async function saveAssignment(e) {
        e.preventDefault();
        
        const assignmentData = {
            userId: userId,
            subjectId: parseInt(subjectSelect.value),
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            dueDate: dueDateInput.value,
            priority: prioritySelect.value,
            status: statusSelect.value
        };

        try {
            let res;
            if (isEditMode) {
                const id = idInput.value;
                res = await api.put(`/assignments/${id}`, assignmentData);
            } else {
                res = await api.post('/assignments', assignmentData);
            }

            if (res.ok) {
                closeModal();
                fetchAssignments();
            } else {
                alert('Error saving assignment');
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    }

    assignmentForm.addEventListener('submit', saveAssignment);

    window.deleteAssignment = async (id) => {
        if (!confirm('Are you sure you want to delete this assignment?')) return;
        
        try {
            const res = await api.delete(`/assignments/${id}?userId=${userId}`);
            if (res.ok) {
                fetchAssignments();
            } else {
                alert('Failed to delete assignment');
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    };

    window.editAssignment = (id) => {
        const assignment = assignments.find(a => a.assignmentId === id);
        if (assignment) openModal(true, assignment);
    };

    window.moveAssignment = async (id, newStatus) => {
        const assignment = assignments.find(a => a.assignmentId === id);
        if (!assignment) return;
        
        const updateData = {
            userId: userId,
            subjectId: assignment.subjectId,
            title: assignment.title,
            description: assignment.description,
            dueDate: assignment.dueDate,
            priority: assignment.priority,
            status: newStatus
        };

        try {
            const res = await api.put(`/assignments/${id}`, updateData);
            if (res.ok) {
                fetchAssignments();
            } else {
                throw new Error("Backend offline");
            }
        } catch (error) {
            console.log("Backend offline: mocking status update");
            assignment.status = newStatus;
            renderAssignments();
        }
    };

    // --- Rendering ---
    
    function showLoadingState() {
        const loader = '<div class="loading-state">Loading...</div>';
        pendingList.innerHTML = loader;
        inProgressList.innerHTML = loader;
        completedList.innerHTML = loader;
    }

    function renderAssignments() {
        const pending = assignments.filter(a => a.status === 'PENDING');
        const inProgress = assignments.filter(a => a.status === 'IN_PROGRESS');
        const completed = assignments.filter(a => a.status === 'COMPLETED');
        
        renderList(pendingList, pending, 'PENDING');
        renderList(inProgressList, inProgress, 'IN_PROGRESS');
        renderList(completedList, completed, 'COMPLETED');
    }

    function renderList(container, list, statusType) {
        if (list.length === 0) {
            container.innerHTML = `<div class="empty-state">No tasks here</div>`;
            return;
        }

        container.innerHTML = list.map(assignment => {
            const isCompleted = assignment.status === 'COMPLETED';
            const dateObj = new Date(assignment.dueDate);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            
            // Check if overdue (only if not completed)
            const today = new Date();
            today.setHours(0,0,0,0);
            const isOverdue = !isCompleted && dateObj < today;
            
            // Status Move buttons logic
            let moveActionHTML = '';
            if (statusType === 'PENDING') {
                moveActionHTML = `<button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'IN_PROGRESS')" title="Move to In Progress"><i class="fa-solid fa-arrow-right"></i></button>`;
            } else if (statusType === 'IN_PROGRESS') {
                moveActionHTML = `
                    <button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'PENDING')" title="Move to To Do"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'COMPLETED')" title="Move to Completed"><i class="fa-solid fa-arrow-right"></i></button>
                `;
            } else if (statusType === 'COMPLETED') {
                moveActionHTML = `<button class="action-btn move" onclick="moveAssignment(${assignment.assignmentId}, 'IN_PROGRESS')" title="Move to In Progress"><i class="fa-solid fa-arrow-left"></i></button>`;
            }

            return `
            <div class="task-card ${isCompleted ? 'completed' : ''}">
                <div class="task-card-header">
                    <h4 class="task-title" title="${escapeHtml(assignment.title)}">${escapeHtml(assignment.title)}</h4>
                    <span class="priority-badge priority-${assignment.priority.toLowerCase()}">${assignment.priority}</span>
                </div>
                
                <span class="task-subject" style="background: ${assignment.subjectColorCode}20; color: ${assignment.subjectColorCode}">
                    ${escapeHtml(assignment.subjectName)}
                </span>
                
                ${assignment.description ? `<p class="task-desc">${escapeHtml(assignment.description)}</p>` : ''}
                
                <div class="task-card-footer">
                    <div class="task-due ${isOverdue ? 'overdue' : ''}">
                        <i class="fa-regular fa-calendar"></i> ${dateStr} ${isOverdue ? '(Overdue)' : ''}
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
        `}).join('');
    }

    function showError(msg) {
        const errorHtml = `<div class="empty-state" style="color: var(--error);">${msg}</div>`;
        pendingList.innerHTML = errorHtml;
        inProgressList.innerHTML = errorHtml;
        completedList.innerHTML = errorHtml;
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
