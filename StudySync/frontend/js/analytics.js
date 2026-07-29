/* =========================================================
   analytics.js – API Integration & Chart Rendering for StudySync
   Day 8: Analytics & Data Visualization Module
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ── Auth Guard ────────────────────────────────────────────────────────────
    window.auth.requireAuth();
    const session = window.auth.getSession();
    if (!session) return;
    const userId = session.userId;

    // ── Logout ────────────────────────────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to log out?')) {
                window.auth.clearSession();
                window.location.href = 'login.html';
            }
        });
    }

    // ── Chart Instances & State ───────────────────────────────────────────────
    let trendChartInstance = null;
    let subjectChartInstance = null;
    let currentAnalyticsData = null;

    // ── Fetch Analytics Data ──────────────────────────────────────────────────
    async function fetchAnalytics() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await api.get(`/analytics?timezone=${encodeURIComponent(tz)}`);
            if (res.ok) {
                const data = await res.json();
                currentAnalyticsData = data;
                renderAnalytics(data);
            } else {
                throw new Error('Failed to fetch analytics');
            }
        } catch (err) {
            console.warn('Backend offline, using fallback mock analytics:', err.message);
            const mockData = getMockAnalytics();
            currentAnalyticsData = mockData;
            renderAnalytics(mockData);
        }
    }

    // ── UI Events ─────────────────────────────────────────────────────────────
    const trendRangeSelect = document.getElementById('trendRange');
    if (trendRangeSelect) {
        trendRangeSelect.addEventListener('change', (e) => {
            if (currentAnalyticsData) {
                if (e.target.value === '30') {
                    renderWeeklyTrendChart(currentAnalyticsData.monthlyTrend || {});
                } else {
                    renderWeeklyTrendChart(currentAnalyticsData.weeklyTrend || {});
                }
            }
        });
    }

    // ── Render Analytics Page ─────────────────────────────────────────────────
    function renderAnalytics(data) {
        // 1. Metric Cards
        document.getElementById('statTotalHours').textContent = `${data.totalStudyHours || 0}h`;
        document.getElementById('statTotalSessions').textContent = data.totalSessions || 0;

        const compAssign = data.completedAssignments || 0;
        const totalAssign = data.totalAssignments || 0;
        const assignPct = totalAssign > 0 ? Math.round((compAssign / totalAssign) * 100) : 0;
        document.getElementById('statAssignmentRatio').textContent = `${compAssign}/${totalAssign}`;
        document.getElementById('statAssignmentPct').textContent = `${assignPct}% completion`;

        const compGoals = data.completedGoals || 0;
        const totalGoals = data.totalGoals || 0;
        const goalsPct = totalGoals > 0 ? Math.round((compGoals / totalGoals) * 100) : 0;
        document.getElementById('statGoalRatio').textContent = `${compGoals}/${totalGoals}`;
        document.getElementById('statGoalPct').textContent = `${goalsPct}% success rate`;

        // 2. Render Charts
        renderWeeklyTrendChart(data.weeklyTrend || {});
        renderSubjectDistributionChart(data.subjectBreakdown || []);

        // 3. Render Subject Breakdown List
        renderSubjectBreakdownList(data.subjectBreakdown || [], data.totalStudyHours || 0);
    }

    // ── Chart 1: Study Trend (Bar Chart) ──────────────────────────────────────
    function renderWeeklyTrendChart(trendMap) {
        const ctx = document.getElementById('weeklyTrendChart').getContext('2d');
        const labels = Object.keys(trendMap);
        const values = Object.values(trendMap);

        if (trendChartInstance) trendChartInstance.destroy();

        trendChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Study Hours',
                    data: values,
                    backgroundColor: 'rgba(108, 99, 255, 0.65)',
                    borderColor: '#6c63ff',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                    hoverBackgroundColor: 'rgba(125, 117, 255, 0.9)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1a1e35',
                        titleColor: '#f0f2ff',
                        bodyColor: '#9ba3c4',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: (context) => ` ${context.raw} hours studied`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9ba3c4', font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#9ba3c4', font: { family: 'Inter', size: 11 } },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // ── Chart 2: Subject Distribution (Doughnut Chart) ────────────────────────
    function renderSubjectDistributionChart(breakdown) {
        const ctx = document.getElementById('subjectDistributionChart').getContext('2d');
        
        if (subjectChartInstance) subjectChartInstance.destroy();

        if (!breakdown || breakdown.length === 0 || breakdown.every(b => b.hours === 0)) {
            // Empty state chart
            subjectChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Study Data'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['rgba(255,255,255,0.05)'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    cutout: '72%'
                }
            });
            return;
        }

        const labels = breakdown.map(b => b.subjectName);
        const dataValues = breakdown.map(b => b.hours);
        const colors = breakdown.map(b => b.colorCode || '#2563EB');

        subjectChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#12152b',
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9ba3c4',
                            font: { family: 'Inter', size: 12 },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1a1e35',
                        titleColor: '#f0f2ff',
                        bodyColor: '#9ba3c4',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => ` ${context.label}: ${context.raw}h`
                        }
                    }
                },
                cutout: '68%'
            }
        });
    }

    // ── Subject Breakdown Cards List ──────────────────────────────────────────
    function renderSubjectBreakdownList(breakdown, totalHours) {
        const listEl = document.getElementById('subjectBreakdownList');

        if (!breakdown || breakdown.length === 0) {
            listEl.innerHTML = '<div class="empty-chart-state">No subjects found. Add a subject and log sessions to see stats!</div>';
            return;
        }

        listEl.innerHTML = breakdown.map(sub => {
            const pct = totalHours > 0 ? Math.round((sub.hours / totalHours) * 100) : 0;
            const color = sub.colorCode || '#2563EB';

            return `
            <div class="subject-stat-item">
                <div class="subject-stat-header">
                    <div class="subject-name-badge">
                        <div class="subject-dot" style="background: ${color};"></div>
                        <span>${escapeHtml(sub.subjectName)}</span>
                    </div>
                    <span class="subject-hours-val" style="color: ${color};">${sub.hours}h (${pct}%)</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${pct}%; background: ${color};"></div>
                </div>
            </div>`;
        }).join('');
    }

    // ── Mock Analytics Fallback ───────────────────────────────────────────────
    function getMockAnalytics() {
        const today = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyMap = {};

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const label = `${days[d.getDay()]} (${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')})`;
            const mockHrs = [2.5, 4.0, 1.5, 3.0, 5.0, 2.0, 3.5][i % 7];
            weeklyMap[label] = mockHrs;
        }

        return {
            totalStudyHours: 21.5,
            totalSessions: 12,
            totalSubjects: 4,
            completedAssignments: 8,
            totalAssignments: 10,
            completedGoals: 3,
            totalGoals: 4,
            subjectBreakdown: [
                { subjectId: 1, subjectName: 'Physics', colorCode: '#2563EB', hours: 7.5 },
                { subjectId: 2, subjectName: 'Mathematics', colorCode: '#7c3aed', hours: 6.0 },
                { subjectId: 3, subjectName: 'Chemistry', colorCode: '#059669', hours: 5.0 },
                { subjectId: 4, subjectName: 'English', colorCode: '#d97706', hours: 3.0 }
            ],
            weeklyTrend: weeklyMap,
            monthlyTrend: weeklyMap // mock just reuses weekly for simplicity
        };
    }

    // ── Utils ─────────────────────────────────────────────────────────────────
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    fetchAnalytics();
});
