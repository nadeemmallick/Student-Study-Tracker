/* =========================================================
   analytics.js – StudySync Analytics & Reports Integration
   Visual reports of study habits, trends, and productivity.
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

    // ── Helper Utilities ──────────────────────────────────────
    const $ = id => document.getElementById(id);
    const sum = a => (a || []).reduce((x, y) => x + y, 0);
    const fmtH = h => {
        h = Math.round((h || 0) * 10) / 10;
        return (Number.isInteger(h) ? h : h.toFixed(1)) + 'h';
    };
    const dshort = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const wdShort = d => d.toLocaleDateString('en-US', { weekday: 'short' });
    const iso = d => {
        const z = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - z).toISOString().slice(0, 10);
    };
    const daysAgo = n => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        const z = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - z).toISOString().slice(0, 10);
    };

    // ── Icons for Charts & Tiles ──────────────────────────────
    const ICON = {
        clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>',
        note:  '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
        check: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m8 12 3 3 5-6"/>',
        target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
        trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
        book:  '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        pie:   '<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'
    };
    const ic = (k, color) => `<svg viewBox="0 0 24 24" ${color ? `style="stroke:${color}"` : ''}>${ICON[k] || ''}</svg>`;
    const tile = (k, c) => `<div class="sic" style="background:${c}22">${ic(k, c)}</div>`;
    const niceStep = m => [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 50].find(s => m / s <= 5) || 100;
    const cu = (to, f) => `<span class="cu" data-to="${to}" data-f="${f}">0</span>`;

    // ── Global Model & Active Range ───────────────────────────
    let model = getMockData();
    let range = 7;

    // ── Compute Analytics Stats & Matrices ────────────────────
    function compute(data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Last 30 calendar days, oldest -> today
        const days = Array.from({ length: 30 }, (_, k) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (29 - k));
            return d;
        });

        const byDay = {};
        (data.sessions || []).forEach(s => {
            if (s && s.date) {
                byDay[s.date] = (byDay[s.date] || 0) + (Number(s.hours) || 0);
            }
        });

        const daily = days.map(d => byDay[iso(d)] || 0);

        // Aggregate by subjects
        const subj = (data.subjects || []).map(s => {
            const subjectSessions = (data.sessions || []).filter(x => (x.subject || '').toLowerCase() === (s.name || '').toLowerCase());
            const sessionHours = sum(subjectSessions.map(x => Number(x.hours) || 0));
            return {
                ...s,
                h: s.hours !== undefined ? s.hours : sessionHours
            };
        });

        const allH = data.totalHours !== undefined ? data.totalHours : sum(data.sessions ? data.sessions.map(s => Number(s.hours) || 0) : []);
        const sessionCount = data.totalSessions !== undefined ? data.totalSessions : (data.sessions ? data.sessions.length : 0);

        return {
            days,
            daily,
            subj,
            allH,
            sessions: sessionCount
        };
    }

    // ── SVG Charts: Bars ──────────────────────────────────────
    function bars(labels, values, tips, h = 260, w = 640) {
        const L = 44, R = 10, T = 12, B = 30, iw = w - L - R, ih = h - T - B;
        const mx = Math.max(...values, 0.5), st = niceStep(mx * 1.05), top = Math.ceil(mx * 1.05 / st) * st;
        let g = '';
        for (let v = 0; v <= top + 1e-9; v += st) {
            const y = T + ih - v / top * ih;
            g += `<line class="gl" x1="${L}" x2="${w - R}" y1="${y}" y2="${y}"/><text class="yl" x="${L - 8}" y="${y + 4}" text-anchor="end">${st < 1 ? v.toFixed(2) : v.toFixed(0)}</text>`;
        }
        const n = values.length, band = iw / n, bw = Math.min(46, band * 0.62), every = Math.ceil(n / 7);
        let b = '';
        values.forEach((v, i) => {
            const x = L + band * i + (band - bw) / 2, bh = v / top * ih;
            b += `<g class="bg"><rect class="hit" x="${L + band * i}" y="${T}" width="${band}" height="${ih}" data-tip="${tips[i]}"/>` +
                (bh > 0 ? `<rect class="bar" style="--d:${i * 45}ms" x="${x}" y="${T + ih - bh}" width="${bw}" height="${bh}" rx="6"/>` : '') + '</g>';
            if (i % every === 0 || n <= 7) {
                b += `<text class="xl" x="${L + band * i + band / 2}" y="${h - 8}" text-anchor="middle">${labels[i]}</text>`;
            }
        });
        return `<div class="chart"><svg viewBox="0 0 ${w} ${h}">${g}${b}</svg></div>`;
    }

    // ── SVG Charts: Donut ─────────────────────────────────────
    function donut(segs, center, sub) {
        const size = 240, r = 84, sw = 30, c = size / 2, circ = 2 * Math.PI * r;
        const tot = sum(segs.map(s => Number(s.v) || 0));
        const live = segs.filter(s => (Number(s.v) || 0) > 0);
        let off = 0, html = '';

        if (!tot) {
            html = `<circle class="track" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}"/>`;
        } else {
            live.forEach((s, i) => {
                const len = Math.max(0, s.v / tot * circ - (live.length > 1 ? 3 : 0));
                html += `<circle class="seg2" cx="${c}" cy="${c}" r="${r}" stroke="${s.c}" stroke-width="${sw}" style="--len:${len};--circ:${circ};--d:${i * 0.12}s" stroke-dashoffset="${-off}" transform="rotate(-90 ${c} ${c})" data-tip="${s.n}\n${fmtH(s.v)} (${Math.round(s.v / tot * 100)}%)"/>`;
                off += s.v / tot * circ;
            });
        }
        return `<div class="dwrap"><svg viewBox="0 0 ${size} ${size}">${html}</svg><div class="dc"><b>${center}</b><span>${sub}</span></div></div>`;
    }

    // ── SVG Charts: Sparklines ────────────────────────────────
    function spark(vals, color) {
        const w = 140, h = 34, mx = Math.max(...vals, 0.1);
        const p = vals.map((v, i) => `${i ? 'L' : 'M'}${i / (vals.length - 1) * w} ${h - 3 - v / mx * (h - 8)}`).join(' ');
        return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path class="ln" pathLength="1" d="${p}" stroke="${color}"/></svg>`;
    }

    // ── Progress Row & Stat Card Component ────────────────────
    const prow = (n, c, label, pct, i) => `
        <div class="pr">
            <div class="top"><span>${n}</span><em style="color:${c}">${label}</em></div>
            <div class="tr"><i style="--w:${Math.max(0, Math.min(100, pct))}%;--d:${i * 0.1}s;background:${c}"></i></div>
        </div>`;

    const statCard = (icon, c, val, label, sub, sp) => `
        <div class="card stat">
            ${tile(icon, c)}
            <b>${val}</b>
            <span class="l">${label}</span>
            ${sub ? `<small>${sub}</small>` : ''}
            ${sp || ''}
        </div>`;

    // ── Page View HTML Generation ─────────────────────────────
    function view() {
        const m = compute(model), d = model;
        const vals = m.daily.slice(-range), dts = m.days.slice(-range);
        const labels = dts.map(x => range <= 7 ? `${wdShort(x)} ${x.getDate()}` : dshort(x));
        const tips = dts.map((x, i) => `${wdShort(x)}, ${dshort(x)}\n${fmtH(vals[i])}`);
        const pa = d.assignments && d.assignments.total ? Math.round(d.assignments.done / d.assignments.total * 100) : 0;
        const pg = d.goals && d.goals.total ? Math.round(d.goals.done / d.goals.total * 100) : 0;
        const segs = m.subj.map(s => ({ n: s.name, c: s.color, v: s.h }));
        const chip = (l, v) => `<button class="chip ${v === range ? 'on' : ''}" data-range="${v}">${l}</button>`;

        return `
        <div class="grid g4">
            ${statCard('clock', '#7C3AED', cu(m.allH, 'h'), 'Total Study Time', '', spark(m.daily.slice(-14), '#7C3AED'))}
            ${statCard('note', '#3B82F6', cu(m.sessions, 'int'), 'Sessions Completed', '', spark(m.daily.slice(-14).map(v => v > 0 ? 1 : 0), '#3B82F6'))}
            ${statCard('check', '#10B981', `${cu(d.assignments.done, 'int')}/${d.assignments.total}`, 'Assignments Done', `${pa}% completion`)}
            ${statCard('target', '#F59E0B', `${cu(d.goals.done, 'int')}/${d.goals.total}`, 'Goals Reached', `${pg}% success rate`)}
        </div>

        <div class="grid g21">
            <div class="card">
                <div class="ch">
                    <div>
                        <h3>${ic('trend')}Study Trend</h3>
                        <p class="sub">Daily hours studied over time</p>
                    </div>
                    <div class="chips">
                        ${chip('7 days', 7)}
                        ${chip('14 days', 14)}
                        ${chip('30 days', 30)}
                    </div>
                </div>
                ${bars(labels, vals, tips)}
            </div>

            <div class="card">
                <h3>${ic('pie')}Subject Breakdown</h3>
                <p class="sub">Hours per subject</p>
                <div style="margin-top:10px">${donut(segs, fmtH(m.allH), 'total')}</div>
                <div class="legend">${m.subj.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>
            </div>
        </div>

        <div class="card">
            <h3>${ic('book')}Subject Progress</h3>
            <p class="sub" style="margin-bottom:18px">Share of your total study time</p>
            ${m.subj.length ? m.subj.map((s, i) => prow(s.name, s.color, `${fmtH(s.h)} (${m.allH ? Math.round(s.h / m.allH * 100) : 0}%)`, m.allH ? s.h / m.allH * 100 : 0, i)).join('') : '<div class="empty">Add a subject to see your progress here.</div>'}
        </div>`;
    }

    // ── Animated Count-Up Numbers ─────────────────────────────
    function countUp(el) {
        const to = +el.dataset.to, f = el.dataset.f, t0 = performance.now(), dur = 900;
        const fmt = v => f === 'h' ? fmtH(v) : String(Math.round(v));
        (function step(t) {
            const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
            el.textContent = fmt(to * e);
            if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
        })(t0);
    }

    // ── Main Render Function ──────────────────────────────────
    function render(data) {
        if (data) model = data;
        const st = $('stage');
        if (!st) return;
        st.className = '';
        st.innerHTML = `<div class="view">${view()}</div>`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            st.classList.add('go');
            st.querySelectorAll('.cu').forEach(countUp);
        }));
    }

    // ── Click Handlers for Range Chips ────────────────────────
    document.addEventListener('click', e => {
        const b = e.target.closest('[data-range]');
        if (b) {
            range = +b.dataset.range;
            render();
        }
    });

    // ── Tooltip Handling ──────────────────────────────────────
    const tip = $('tip');
    document.addEventListener('mousemove', e => {
        if (!tip) return;
        const t = e.target.closest && e.target.closest('[data-tip]');
        if (!t) {
            tip.style.opacity = '0';
            return;
        }
        tip.textContent = t.getAttribute('data-tip');
        tip.style.opacity = '1';
        tip.style.left = Math.min(e.clientX + 14, window.innerWidth - 170) + 'px';
        tip.style.top = e.clientY + 16 + 'px';
    });

    // ── Export Report (CSV) ────────────────────────────────────
    const exportBtn = $('export');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const m = compute(model), q = v => `"${String(v || '').replace(/"/g, '""')}"`;
            let csv = 'StudySync Report\n';
            csv += `Total study time (hours),${Math.round(m.allH * 100) / 100}\n`;
            csv += `Sessions completed,${m.sessions}\n`;
            csv += `Assignments done,${model.assignments.done}/${model.assignments.total}\n`;
            csv += `Goals reached,${model.goals.done}/${model.goals.total}\n\n`;
            csv += 'Subject,Hours\n' + m.subj.map(s => `${q(s.name)},${Math.round((s.h || 0) * 100) / 100}`).join('\n') + '\n\n';
            csv += 'Date,Subject,Hours\n' + [...(model.sessions || [])].sort((a, b) => a.date < b.date ? 1 : -1)
                .map(s => `${s.date},${q(s.subject)},${Math.round((s.hours || 0) * 100) / 100}`).join('\n') + '\n';

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'studysync-report-' + iso(new Date()) + '.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            const toast = $('toast');
            if (toast) {
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 1800);
            }
        };
    }

    // ── Fallback Mock Data ────────────────────────────────────
    function getMockData() {
        return {
            subjects: [
                { name: 'math',   color: '#7C3AED', hours: 5.0 },
                { name: 'coding', color: '#10B981', hours: 6.0 },
                { name: 'Java',   color: '#F59E0B', hours: 4.5 }
            ],
            sessions: [
                { date: daysAgo(0),  subject: 'coding', hours: 1.5 },
                { date: daysAgo(1),  subject: 'math',   hours: 1 },
                { date: daysAgo(2),  subject: 'Java',   hours: 2 },
                { date: daysAgo(2),  subject: 'coding', hours: 0.5 },
                { date: daysAgo(4),  subject: 'coding', hours: 1 },
                { date: daysAgo(5),  subject: 'math',   hours: 1.5 },
                { date: daysAgo(6),  subject: 'Java',   hours: 1 },
                { date: daysAgo(9),  subject: 'coding', hours: 2 },
                { date: daysAgo(11), subject: 'math',   hours: 0.5 },
                { date: daysAgo(13), subject: 'Java',   hours: 1.5 },
                { date: daysAgo(17), subject: 'coding', hours: 1 },
                { date: daysAgo(22), subject: 'math',   hours: 2 }
            ],
            assignments: { done: 3, total: 5 },
            goals:       { done: 1, total: 3 },
            totalHours: 15.5,
            totalSessions: 12
        };
    }

    // ── API: Load Real Data from Backend ──────────────────────
    async function loadAllAnalytics() {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            
            // Parallel API requests: /analytics, /sessions, /subjects
            const [analyticsRes, sessionsRes, subjectsRes] = await Promise.allSettled([
                api.get(`/analytics?timezone=${encodeURIComponent(tz)}`),
                api.get('/sessions'),
                api.get('/subjects')
            ]);

            let analyticsData = null;
            if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
                analyticsData = await analyticsRes.value.json();
            }

            let sessionsList = [];
            if (sessionsRes.status === 'fulfilled' && sessionsRes.value.ok) {
                sessionsList = await sessionsRes.value.json();
            }

            let subjectsList = [];
            if (subjectsRes.status === 'fulfilled' && subjectsRes.value.ok) {
                subjectsList = await subjectsRes.value.json();
            }

            if (!analyticsData && sessionsList.length === 0) {
                console.warn('Using offline mock analytics data');
                render(getMockData());
                return;
            }

            // Map subjects and colors
            const subjectMap = {};
            const subjectsFinal = [];

            if (subjectsList && subjectsList.length > 0) {
                subjectsList.forEach(s => {
                    subjectMap[s.name.toLowerCase()] = s.colorCode || '#85A7D8';
                    subjectsFinal.push({
                        name: s.name,
                        color: s.colorCode || '#85A7D8'
                    });
                });
            }

            // If analytics has subjectBreakdown, merge or ensure subjects exist
            if (analyticsData && analyticsData.subjectBreakdown) {
                analyticsData.subjectBreakdown.forEach(sb => {
                    const existing = subjectsFinal.find(s => s.name.toLowerCase() === sb.subjectName.toLowerCase());
                    if (existing) {
                        existing.hours = sb.hours || 0;
                        if (sb.colorCode) existing.color = sb.colorCode;
                    } else {
                        subjectsFinal.push({
                            name: sb.subjectName,
                            color: sb.colorCode || '#85A7D8',
                            hours: sb.hours || 0
                        });
                    }
                });
            }

            // Build sessions array
            let parsedSessions = [];
            if (sessionsList && sessionsList.length > 0) {
                parsedSessions = sessionsList.map(s => ({
                    date: s.date ? String(s.date) : iso(new Date()),
                    subject: s.subjectName || 'Study',
                    hours: s.durationMinutes ? s.durationMinutes / 60 : (s.hours || 1)
                }));
            } else if (analyticsData && analyticsData.weeklyTrend) {
                // Synthesize recent sessions from weeklyTrend if sessions endpoint is empty
                Object.entries(analyticsData.weeklyTrend).forEach(([dKey, hrs]) => {
                    if (hrs > 0) {
                        parsedSessions.push({
                            date: dKey,
                            subject: subjectsFinal.length ? subjectsFinal[0].name : 'Study',
                            hours: hrs
                        });
                    }
                });
            }

            const transformedData = {
                subjects: subjectsFinal.length ? subjectsFinal : [
                    { name: 'math', color: '#7C3AED' },
                    { name: 'coding', color: '#10B981' },
                    { name: 'Java', color: '#F59E0B' }
                ],
                sessions: parsedSessions,
                assignments: {
                    done: analyticsData ? (analyticsData.completedAssignments || 0) : 3,
                    total: analyticsData ? (analyticsData.totalAssignments || 0) : 5
                },
                goals: {
                    done: analyticsData ? (analyticsData.completedGoals || 0) : 1,
                    total: analyticsData ? (analyticsData.totalGoals || 0) : 3
                },
                totalHours: analyticsData ? analyticsData.totalStudyHours : undefined,
                totalSessions: analyticsData ? analyticsData.totalSessions : parsedSessions.length
            };

            render(transformedData);

        } catch (err) {
            console.warn('Error loading analytics, falling back to mock:', err);
            render(getMockData());
        }
    }

    // Expose for external calls if needed
    window.StudySyncOverview = { render, reload: loadAllAnalytics };

    // Initial load
    loadAllAnalytics();
});
