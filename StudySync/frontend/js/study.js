/* =========================================================
   study.js – API Integration and DOM Manipulation for Sessions
========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State ---
    const userId = 1; // Hardcoded per plan
    let sessions = [];
    let subjects = [];
    
    // --- DOM Elements ---
    const sessionsList = document.getElementById('sessionsList');
    const modal = document.getElementById('sessionModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const logSessionBtn = document.getElementById('logSessionBtn');
    
    const sessionForm = document.getElementById('sessionForm');
    const subjectSelect = document.getElementById('sessionSubjectInput');
    const dateInput = document.getElementById('sessionDateInput');
    const startInput = document.getElementById('sessionStartInput');
    const endInput = document.getElementById('sessionEndInput');
    const notesInput = document.getElementById('sessionNotesInput');
    
    const durationValue = document.getElementById('durationValue');

    // --- Initialization ---
    init();

    async function init() {
        // Set default date to today
        dateInput.value = new Date().toISOString().split('T')[0];
        
        await fetchSubjects();
        await fetchSessions();
    }

    // --- Modal Logic ---
    function openModal() {
        sessionForm.reset();
        dateInput.value = new Date().toISOString().split('T')[0];
        durationValue.textContent = '0';
        modal.classList.add('active');
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    logSessionBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);

    // --- Duration Calculation Preview ---
    function calculateDuration() {
        if (!startInput.value || !endInput.value) {
            durationValue.textContent = '0';
            return;
        }

        const start = new Date(`1970-01-01T${startInput.value}:00`);
        const end = new Date(`1970-01-01T${endInput.value}:00`);
        
        let diffMs = end - start;
        if (diffMs < 0) {
            diffMs += 24 * 60 * 60 * 1000; // Handle past midnight
        }
        
        const minutes = Math.floor(diffMs / 60000);
        durationValue.textContent = minutes;
    }

    startInput.addEventListener('input', calculateDuration);
    endInput.addEventListener('input', calculateDuration);

    // --- API Calls ---

    async function fetchSubjects() {
        try {
            const res = await api.get(`/subjects?userId=${userId}`);
            if (res.ok) {
                subjects = await res.json();
                populateSubjectDropdown();
            }
        } catch (error) {
            console.error("Failed to load subjects", error);
            subjectSelect.innerHTML = '<option value="" disabled selected>Error loading subjects. Is the backend running?</option>';
        }
    }

    function populateSubjectDropdown() {
        if (subjects.length === 0) {
            subjectSelect.innerHTML = '<option value="" disabled selected>No subjects found. Add one first.</option>';
            return;
        }
        
        subjectSelect.innerHTML = '<option value="" disabled selected>Select a subject...</option>' + 
            subjects.map(sub => `<option value="${sub.subjectId}">${escapeHtml(sub.name)}</option>`).join('');
    }

    async function fetchSessions() {
        sessionsList.innerHTML = '<div class="loading-state">Loading history...</div>';
        try {
            const res = await api.get(`/sessions?userId=${userId}`);
            if (res.ok) {
                sessions = await res.json();
                renderSessions();
            } else {
                showError("Failed to fetch sessions");
            }
        } catch (error) {
            console.error(error);
            showError("Network error while fetching sessions");
        }
    }

    async function saveSession(e) {
        e.preventDefault();
        
        const sessionData = {
            userId: userId,
            subjectId: parseInt(subjectSelect.value),
            date: dateInput.value,
            startTime: startInput.value + ':00',
            endTime: endInput.value + ':00',
            notes: notesInput.value.trim()
        };

        try {
            const res = await api.post('/sessions', sessionData);
            if (res.ok) {
                closeModal();
                fetchSessions();
            } else {
                alert('Error saving session');
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    }

    sessionForm.addEventListener('submit', saveSession);

    window.deleteSession = async (id) => {
        if (!confirm('Are you sure you want to delete this session?')) return;
        
        try {
            const res = await api.delete(`/sessions/${id}?userId=${userId}`);
            if (res.ok) {
                fetchSessions();
            } else {
                alert('Failed to delete session');
            }
        } catch (error) {
            console.error(error);
            alert('Network error');
        }
    };

    // --- Rendering ---
    function renderSessions() {
        if (!sessions || sessions.length === 0) {
            sessionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--border);"></i>
                    <p>No sessions logged yet. Time to study!</p>
                </div>`;
            return;
        }

        sessionsList.innerHTML = sessions.map(session => {
            const dateObj = new Date(session.date);
            const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            
            // Format time (HH:MM:SS from backend to HH:MM)
            const startStr = session.startTime.substring(0, 5);
            const endStr = session.endTime.substring(0, 5);
            
            return `
            <div class="session-item">
                <div class="session-indicator" style="background: ${session.subjectColorCode}"></div>
                <div class="session-details">
                    <h4>
                        ${escapeHtml(session.subjectName)}
                        <span class="subject-badge" style="background: ${session.subjectColorCode}20; color: ${session.subjectColorCode}">
                            Subject
                        </span>
                    </h4>
                    <p>${escapeHtml(session.notes || 'No notes provided.')}</p>
                </div>
                <div class="session-time">
                    <div class="duration-text">${session.durationMinutes} min</div>
                    <div class="time-range">${dateStr} • ${startStr} - ${endStr}</div>
                </div>
                <div class="session-actions">
                    <button class="action-btn delete" onclick="deleteSession(${session.sessionId})" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `}).join('');
    }

    function showError(msg) {
        sessionsList.innerHTML = `<div class="empty-state" style="color: var(--error);">${msg}</div>`;
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
