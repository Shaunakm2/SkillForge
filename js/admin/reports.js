/* Skillforge LMS — reports. */
SkillforgeApp.prototype.amReports = function (c) {
  const { INK, W, s, segs, perms } = c;
  // People with only the course-completion permission (trainers) see just that report.
  // Trainers (reportsCompletion permission) get the course completion and course progress reports.
  const allowed = Object.keys(RDEF).filter(k => perms.has('reports') || ['usercourses', 'allcompletion', 'progress'].includes(k));
  // reports
  const fr = { '7d':0.3, '30d':1, '90d':2.7 }[s.repRange];
  const people = s.users.filter(u => u.status === 'Active' && (s.repDept === 'All' || u.dept === s.repDept) && (s.repMgr === 'All' || u.manager === s.repMgr));
  const rnd = (i, k) => ((i * 53 + k * 29 + 7) % 97) / 97;
  const Tx = (v, w, fg) => ({ isText:true, isBar:false, isChip:false, v, w: w || 500, fg: fg || INK });
  const Bx = (p, color) => ({ isText:false, isBar:true, isChip:false, v: p + '%', pct: p + '%', color });
  const Cx = (v, bg, fg) => ({ isText:false, isBar:false, isChip:true, v, bg, fg });
  const sc = s.repDept === 'All' ? 1 : 0.16;
  let rows = [], kp = [];
  const rt = allowed.includes(s.repType) ? s.repType : allowed[0];
  if (rt === 'learning') { rows = people.map((u, i) => [Tx(u.name, 600), Tx(u.dept), Tx(3 + Math.round(rnd(i, 1) * 4)), Tx(Math.round(rnd(i, 2) * 3)), Tx((rnd(i, 3) * 10 * fr + 0.5).toFixed(1) + 'h'), Bx(60 + Math.round(rnd(i, 4) * 38), '#7C5CFF'), Tx(u.lastLogin, 500, '#75655A')]); kp = [['Active learners', people.length], ['Hours learned', Math.round(people.length * 5.6 * fr) + 'h'], ['Average score', '81%']]; }
  if (rt === 'completion') { rows = COURSES.map((c, i) => { const en = Math.round(c.learners * sc); const p = 40 + Math.round(rnd(i, 5) * 55); return [Tx(c.title, 600), Tx(fmt(en)), Tx(fmt(Math.round(en * p / 100))), Bx(p, '#14B8A6'), Tx(Math.round(3 + rnd(i, 6) * 20) + ' days'), Tx(fmt(Math.round(en * p / 100 * 0.9)))]; }); kp = [['Courses', COURSES.length], ['Avg completion', '64%'], ['Certificates issued', fmt(Math.round(587 * fr / 2.7 * sc))]]; }
  if (rt === 'login') { let tot = 0; rows = people.map((u, i) => { const n = Math.max(1, Math.round(rnd(i, 8) * 22 * fr)); tot += n; return [Tx(u.name, 600), Tx(u.dept), Tx(u.lastLogin), Tx(n), Tx(Math.round(8 + rnd(i, 9) * 30) + ' min'), Tx(['Web · SSO', 'Web · SSO', 'Mobile', 'Web · SSO'][i % 4])]; }); kp = [['Total logins', tot], ['Avg session', '21 min'], ['Never signed in', s.users.filter(u => u.status === 'Invited').length]]; }
  if (rt === 'coursewise') { let te = 0, td = 0; rows = COURSES.map((c, i) => { const en = Math.round(c.learners * sc); const dn = Math.round(en * (0.3 + rnd(i, 10) * 0.5)); const pr = Math.round((en - dn) * 0.6); te += en; td += dn; return [Tx(c.title, 600), Tx(fmt(en)), Tx(fmt(en - dn - pr)), Tx(fmt(pr)), Tx(fmt(dn)), Bx(70 + Math.round(rnd(i, 11) * 25), '#DB2777'), Tx('★ ' + c.rating)]; }); kp = [['Enrollments', fmt(te)], ['Completed', fmt(td)], ['Avg rating', '4.7']]; }
  if (rt === 'quiz') { rows = s.quizzes.map((z, i) => { const pr = 55 + Math.round(rnd(i, 12) * 40); const hq = s.qs.find(q => q.id === z.ids[z.ids.length - 1]); return [Tx(z.name, 600), Tx(fmt(Math.round((120 + rnd(i, 13) * 400) * fr * sc + 1))), Bx(pr, '#22C55E'), Tx(Math.round(pr * 0.95) + '%'), Tx(hq ? hq.text : '—', 500, '#75655A')]; }); kp = [['Quizzes', s.quizzes.length], ['Avg pass rate', '78%'], ['Questions in use', s.qs.filter(q => q.used).length]]; }
  if (rt === 'compliance') { rows = people.map((u, i) => { const c = ['Code of Conduct 2026', 'Data Privacy Essentials', 'Giving Feedback That Lands'][i % 3]; const r = rnd(i, 14); const st = r < 0.15 ? ['Expired', '#FEE2E2', '#991B1B'] : r < 0.35 ? ['Expiring soon', '#FEF3C7', '#92400E'] : ['Valid', '#DCFCE7', '#166534']; return [Tx(u.name, 600), Tx(c), Tx(['Jan 12, 2026', 'Mar 3, 2026', 'Nov 20, 2025', 'Jun 8, 2026'][i % 4]), Tx(r < 0.15 ? 'Sep 30, 2026' : r < 0.35 ? 'Oct 28, 2026' : 'Mar 3, 2027'), Cx(st[0], st[1], st[2])]; }); kp = [['Valid', rows.filter(r => r[4].v === 'Valid').length], ['Expiring in 30 days', rows.filter(r => r[4].v === 'Expiring soon').length], ['Expired · re-enrolled', rows.filter(r => r[4].v === 'Expired').length]]; }
  const fmtR = k => k ? Fmt.short(k) : '—';
  let acPage = null;
  const ST_C = { Completed:['#DCFCE7', '#166534'], 'In progress':['#DBEAFE', '#1E40AF'], Overdue:['#FEE2E2', '#991B1B'], 'Not started':['#F5EEE3', '#4A3B2F'] };
  // Course progress: every open (not completed) assignment, from the learning records. Paged like the completion report.
  if (rt === 'progress') { const items = []; let inprog = 0, over = 0, notst = 0;
    people.forEach(u => { const en = s.enroll[u.name]; if (!en) return; const recs = s.itemDone[u.name] || {};
      for (const cid in en) { const a = Progress.courseOf(s, cid); if (!a) continue; const r = recs[cid], n = a.items.length; let dn = 0; if (r) for (const k in r) dn++;
        if ((n && dn >= n) || Progress.migrated(s, u.name, cid)) continue;
        const st = en[cid] < TODAY_KEY ? 'Overdue' : dn ? 'In progress' : 'Not started';
        if ((s.repStatus === 'All' || s.repStatus === st) && (s.repCourse === 'All' || a.title === s.repCourse) && (!s.repUser || u.name.toLowerCase().includes(s.repUser.toLowerCase()))) {
          items.push([u.name, cid, en[cid]]); if (st === 'Overdue') over++; else if (st === 'In progress') inprog++; else notst++; } } });
    items.sort((x, y) => x[2].localeCompare(y[2]));
    const PGP = Pager(this, s, 'rep-' + rt, items, 50);
    rows = PGP.rows.map(([name, cid]) => { const a = Progress.courseOf(s, cid), d = Progress.detail(s, name, a);
      return [Tx(name, 600), Tx(a.code + ' · ' + a.title), Bx(d.pct, '#FFB020'), Tx(d.doneN + ' / ' + d.total), Cx(d.status, ...ST_C[d.status]), Tx(fmtR(d.due))]; });
    acPage = { total: items.length, pager: PGP.pager };
    kp = [['Open assignments', fmt(items.length)], ['In progress', fmt(inprog)], ['Not started', fmt(notst)], ['Overdue', fmt(over)]]; }
  const peopleSet = new Set(people.map(p => p.id)), inPeople = u => peopleSet.has(u.id);
  // All course completion at scale (250k+ assignments): one light pass counts status per assignment from the raw
  // records; full detail rows are built only for the page on screen. The CSV builds module-level rows on download.
  if (rt === 'allcompletion') {
    const items = [], byU = new Map(s.users.map(u => [u.name, u])); let comp = 0, inprog = 0, over = 0;
    people.forEach(u => { const en = s.enroll[u.name]; if (!en) return; const recs = s.itemDone[u.name] || {};
      for (const cid in en) { const a = Progress.courseOf(s, cid); if (!a) continue; const r = recs[cid], n = a.items.length; let dn = 0; if (r) for (const k in r) dn++;
        const mig = !!Progress.migrated(s, u.name, cid), st = mig || (n && dn >= n) ? 'Completed' : en[cid] < TODAY_KEY ? 'Overdue' : dn ? 'In progress' : 'Not started';
        if ((s.repStatus === 'All' || s.repStatus === st) && (s.repCourse === 'All' || a.title === s.repCourse) && (!s.repUser || u.name.toLowerCase().includes(s.repUser.toLowerCase()))) {
          items.push([u.name, cid]); if (st === 'Completed') comp++; else if (st === 'Overdue') over++; else if (st === 'In progress') inprog++; } } });
    const PGA = Pager(this, s, 'rep-' + rt, items, 50);
    rows = PGA.rows.map(([name, cid]) => { const a = Progress.courseOf(s, cid), d = Progress.detail(s, name, a), tries = d.mods.reduce((t, m) => t + (+m.attempts || 0), 0), best = Math.max(-1, ...d.mods.map(m => m.best === '' ? -1 : +m.best));
      return [Tx(name, 600), Tx(a.code + ' · ' + a.title), Tx(fmtR(d.assignedOn), 500, '#75655A'), Tx(fmtR(d.due), 500, '#75655A'), Tx(fmtR(d.startedOn)), Tx(fmtR(d.completedOn)), Bx(d.pct, '#0369A1'), Tx(tries || '—'), Tx(best < 0 ? '—' : best + '%'), Cx(d.status, ...ST_C[d.status])]; });
    acPage = { total: items.length, pager: PGA.pager };
    kp = [['Assignments', fmt(items.length)], ['Completed', items.length ? Math.round(comp / items.length * 100) + '%' : '—'], ['In progress', fmt(inprog)], ['Overdue', fmt(over)], ['Teammates', fmt(new Set(items.map(x => x[0])).size)]]; }
  // ---- Kirkpatrick feedback responses ----
  if (rt === 'kpfeedback') { const FS = { Scheduled:['#F5EEE3', '#75655A'], Due:['#FEF3C7', '#92400E'], Sent:['#DBEAFE', '#1E40AF'], Responded:['#DCFCE7', '#166534'] };
    const avgOf = x => { if (!x.response) return '—'; const v = x.form.qs.map((q, i) => q.kind === 'rating' ? +x.response.answers[i] : 0).filter(n => n > 0); return v.length ? (v.reduce((t, n) => t + n, 0) / v.length).toFixed(1) + ' / 5' : '—'; };
    const fl = Feedback.list(s).filter(x => (s.repStatus === 'All' || x.status === s.repStatus) && (!s.repUser || x.learner.toLowerCase().includes(s.repUser.toLowerCase())));
    rows = fl.map(x => [Tx(x.course.title, 600), Tx(x.form.title), Tx(x.lv), Tx(x.learner), Tx(x.to + (x.as === 'Manager' ? ' (manager)' : '')), Tx(fmtR(x.due), 500, '#75655A'), Cx(x.status, ...(FS[x.status] || FS.Scheduled)), Tx(avgOf(x))]);
    const resp = fl.filter(x => x.response).length;
    kp = [['Requests', fmt(fl.length)], ['Responded', fmt(resp)], ['Response rate', fl.filter(x => x.status !== 'Scheduled').length ? Math.round(resp / fl.filter(x => x.status !== 'Scheduled').length * 100) + '%' : '—'], ['Due to send', fmt(fl.filter(x => x.status === 'Due').length)]]; }
  // ---- user course completion: completed courses per person with evaluation % ----
  if (rt === 'usercourses') { const items = []; let withEval = 0, evalSum = 0;
    people.forEach(u => { const en = s.enroll[u.name] || {}, recs = s.itemDone[u.name] || {}; const ids = new Set(Object.keys(en));
      (s.extHistory || []).forEach(r => { if (r.user === u.name && r.courseId && r.status === 'Completed') ids.add(r.courseId); });
      ids.forEach(cid => { const a = Progress.courseOf(s, cid); if (!a) return; const r = recs[cid], n = a.items.length; let dn = 0; if (r) for (const k in r) dn++;
        if (!((n && dn >= n) || Progress.migrated(s, u.name, cid))) return;
        if ((s.repCourse === 'All' || a.title === s.repCourse) && (!s.repUser || u.name.toLowerCase().includes(s.repUser.toLowerCase()))) items.push([u, cid]); }); });
    items.sort((x, y) => x[0].name.localeCompare(y[0].name));
    const evalOf = (u, a) => { const d = Progress.detail(s, u.name, a), sc = d.mods.map(m => m.best).filter(v => v !== '' && v != null).map(Number), tries = d.mods.reduce((t, m) => t + (+m.attempts || 0), 0), hasQ = a.items.some(i => i.kind === 'quiz');
      return { d, best: sc.length ? Math.max(...sc) : null, tries, hasQ }; };
    items.forEach(([u, cid]) => { const e = evalOf(u, Progress.courseOf(s, cid)); if (e.best != null) { withEval++; evalSum += e.best; } });
    const PGU = Pager(this, s, 'rep-' + rt, items, 50);
    rows = PGU.rows.map(([u, cid]) => { const a = Progress.courseOf(s, cid), e = evalOf(u, a);
      return [Tx(u.name, 600), Tx(u.empId || ''), Tx(a.code + ' · ' + a.title), Tx(fmtR(e.d.completedOn)), e.best == null ? Tx(e.hasQ ? 'Not recorded' : 'No evaluation', 500, '#75655A') : Bx(e.best, '#0F766E'), Tx(e.tries || '—'), Cx(e.d.source !== 'Skillforge' ? 'Imported' : 'Completed', ...(e.d.source !== 'Skillforge' ? ['#DBEAFE', '#1E40AF'] : ['#DCFCE7', '#166534']))]; });
    acPage = { total: items.length, pager: PGU.pager, all: items, evalOf };
    kp = [['Completed courses', fmt(items.length)], ['People', fmt(new Set(items.map(x => x[0].name)).size)], ['With an evaluation', fmt(withEval)], ['Average evaluation', withEval ? Math.round(evalSum / withEval) + '%' : '—']]; }
  // ---- user report ----
  const US_C = { Active:['#DCFCE7', '#166534'], Invited:['#DBEAFE', '#1E40AF'], Deactivated:['#F5EEE3', '#75655A'] };
  const usPeople = s.users.filter(u => (s.repDept === 'All' || u.dept === s.repDept) && (s.repUStatus === 'All' || u.status === s.repUStatus));
  if (rt === 'users') { rows = usPeople.map(u => [Tx(u.name, 600), Tx(u.empId), Tx(u.dept), Tx((Access.roleFor(s, u) || {}).name || u.role), Cx(u.status, ...US_C[u.status]), Tx(fmtR(u.joined), 500, '#75655A'), Tx(u.lastLogin, 500, '#75655A')]);
    kp = [['Users', usPeople.length], ['Active', usPeople.filter(u => u.status === 'Active').length], ['Deactivated', usPeople.filter(u => u.status === 'Deactivated').length], ['Invited', usPeople.filter(u => u.status === 'Invited').length]]; }
  // ---- assessment reports: date-time window ----
  const AR = s.ar, inWin = t => (!AR.from || t >= AR.from) && (!AR.to || t <= AR.to + (AR.to.length === 16 ? ':59' : ''));
  const fmtDT = t => t ? Fmt.dt(t) : '—';
  const arQuiz = s.quizzes.find(z => String(z.id) === String(AR.quiz)) || s.quizzes[0];
  const arUser = s.users.find(u => u.name === AR.user) || s.users.find(u => s.attemptRecs.some(r => r.user === u.name)) || s.users[0];
  const recsQ = s.attemptRecs.filter(r => r.quizId === arQuiz.id && inWin(r.submittedAt));
  // keyAccess: the person could read the answer keys (Question bank / Assessments permission) when they took it
  const RES_C = r => { const k = r.keyAccess ? ' · had answer-key access' : ''; return r.pass ? Cx('Passed' + k, '#DCFCE7', '#166534') : Cx('Not passed' + k, '#FCE6E0', '#9C3F2A'); };
  if (rt === 'asmSheet') { rows = recsQ.map(r => [Tx(r.user, 600), Tx(r.courseCode + ' · ' + r.courseTitle), Tx('#' + r.attemptNo), Tx(fmtDT(r.startedAt)), Tx(fmtDT(r.submittedAt)), Tx(r.mins + ' min'), Tx(r.correct + ' / ' + r.total), Bx(r.score, '#7C3AED'), RES_C(r)]);
    const avg = recsQ.length ? Math.round(recsQ.reduce((t, r) => t + r.score, 0) / recsQ.length) : 0;
    kp = [['Attempts', recsQ.length], ['Learners', new Set(recsQ.map(r => r.user)).size], ['Pass rate', recsQ.length ? Math.round(recsQ.filter(r => r.pass).length / recsQ.length * 100) + '%' : '—'], ['Average score', recsQ.length ? avg + '%' : '—']]; }
  const userItems = () => { const out = [];
    Progress.myCourses(s, arUser.name).forEach(({ a, d }) => {
      if (d.completedOn && inWin(d.completedOn + 'T12:00')) { const best = Math.max(-1, ...d.mods.map(m => m.best === '' ? -1 : +m.best)); out.push({ type:'Course', name: a.title, course: a.code, at: d.completedOn + 'T12:00', attempt:'', score: best < 0 ? null : best, result:'Completed' }); } });
    s.attemptRecs.filter(r => r.user === arUser.name && inWin(r.submittedAt)).forEach(r => out.push({ type:'Assessment', name: r.quizName, course: r.courseCode, at: r.submittedAt, attempt: '#' + r.attemptNo, score: r.score, result: r.pass ? 'Passed' : 'Not passed', rec: r }));
    return out.sort((x, y) => y.at.localeCompare(x.at)); };
  if (rt === 'userAsm') { const it = userItems();
    rows = it.map(x => [Cx(x.type, x.type === 'Course' ? '#E3F1EE' : '#EDE9FE', x.type === 'Course' ? '#245E52' : '#5B21B6'), Tx(x.name, 600), Tx(x.course), Tx(fmtDT(x.at)), Tx(x.attempt || '—'), x.score == null ? Tx('—') : Bx(x.score, '#0D9488'), x.result === 'Not passed' ? Cx(x.result, '#FCE6E0', '#9C3F2A') : Cx(x.result, '#DCFCE7', '#166534')]);
    kp = [['Courses completed', it.filter(x => x.type === 'Course').length], ['Assessment attempts', it.filter(x => x.type === 'Assessment').length], ['Passed', it.filter(x => x.result === 'Passed').length], ['Best score', it.some(x => x.score != null) ? Math.max(...it.filter(x => x.score != null).map(x => x.score)) + '%' : '—']]; }
  const RD = RDEF[rt];
  // Admin-chosen columns per report (order and visibility). Stored in s.repCols[rt] as column indexes.
  const splitGrid = g => { const out = []; let depth = 0, cur = ''; for (const ch of g) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ' ' && !depth) { if (cur) out.push(cur); cur = ''; } else cur += ch; } if (cur) out.push(cur); return out; };
  const gridParts = splitGrid(RD.grid), saved = (s.repCols || {})[rt], visIdx = (Array.isArray(saved) ? saved : RD.cols.map((_, i) => i)).filter(i => i < RD.cols.length);
  const setVis = fn => this.setState(st => ({ repCols: { ...(st.repCols || {}), [rt]: fn(visIdx.slice()) } }));
  const fRows = acPage ? rows : rows.filter(cells => { const t = cells.map(c => c.v).join(' ').toLowerCase(); return (s.repCourse === 'All' || t.includes(s.repCourse.toLowerCase())) && (s.repStatus === 'All' || t.includes(s.repStatus.toLowerCase())) && (!s.repUser || t.includes(s.repUser.toLowerCase())); });
  // Only the current page of rows is rendered; KPIs and the CSV use every row.
  const PG = acPage ? { rows: fRows, pager: acPage.pager } : Pager(this, s, 'rep-' + rt, fRows, 50), rowTotal = acPage ? acPage.total : fRows.length;
  const rep = { name:RD.name, desc:RD.desc, grid: visIdx.map(i => gridParts[i] || 'minmax(100px,1fr)').join(' '), cols: visIdx.map(i => RD.cols[i]), rows: PG.rows.map(cells => ({ cells: visIdx.map(i => cells[i]).filter(Boolean) })), rowCount: rowTotal, rowCountLabel: rowTotal.toLocaleString('en-US') + ' rows', kpis: kp.map(([l, v]) => ({ l, v })) };
  const repTypes = allowed.map(k => { const on = k === rt; return { label:RDEF[k].name, short:RDEF[k].short, dot:RDEF[k].dot, bg: on ? INK : W, fg: on ? '#FFF8EE' : INK, sub: on ? '#D8CBBB' : '#75655A', pick: () => this.setState({ repType:k }) }; });
  return {
    repTypes,
    rep, repPager: PG.pager,
    repColOpen: !!s.repColOpen, repColToggle: () => this.setState({ repColOpen: !s.repColOpen }),
    repColRows: visIdx.map((ci, i) => ({ l: RD.cols[ci], up: () => setVis(a => { if (i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a; }), down: () => setVis(a => { if (i < a.length - 1) [a[i + 1], a[i]] = [a[i], a[i + 1]]; return a; }), isFirst: i === 0, isLast: i === visIdx.length - 1,
      remove: () => { if (visIdx.length === 1) return this.toastMsg('Keep at least one column'); setVis(a => a.filter(x => x !== ci)); } })),
    repColAdd: RD.cols.map((l, ci) => ({ l, ci })).filter(x => !visIdx.includes(x.ci)).map(x => ({ l: x.l, add: () => setVis(a => a.concat([x.ci])) })),
    repColHasAdd: RD.cols.length > visIdx.length, repColReset: () => this.setState(st => { const r = { ...(st.repCols || {}) }; delete r[rt]; return { repCols: r }; }),
    repColNote: RD.cols.length - visIdx.length ? (RD.cols.length - visIdx.length) + ' hidden' : 'All columns shown',
    repEmpty: rep.rowCount === 0,
    repRangeOpts: segs(s.repRange, ['7d', '30d', '90d'], v => this.setState({ repRange:v }), v => ({ '7d':'7 days', '30d':'30 days', '90d':'90 days' })[v]),
    repDept: s.repDept,
    repDeptOptions: [{ v:'All', l:'All departments' }].concat(DEPTS.map(x => ({ v:x, l:x }))),
    setRepDept: e => this.setState({ repDept: e.target.value }),
    // CSV: the all-course completion report is module level; the others export the rows on screen.
    repIsUsers: rt === 'users', repIsAsm: rt === 'asmSheet' || rt === 'userAsm', repIsSheet: rt === 'asmSheet', repIsUserAsm: rt === 'userAsm', repGeneric: !['users', 'asmSheet', 'userAsm'].includes(rt),
    repUStatusChips: ['All', 'Active', 'Deactivated', 'Invited'].map(v => UI.chip(s.repUStatus, v, v === 'All' ? 'All users' : v, () => this.setState({ repUStatus: v }))),
    ar: AR, arQuizOpts: s.quizzes.map(z => ({ v: String(z.id), l: z.name + (z.course ? ' · ' + z.course : '') })), arQuizVal: String(arQuiz.id),
    arUserOpts: s.users.map(u => ({ v: u.name, l: u.name + ' · ' + u.empId })), arUserVal: arUser.name,
    setArQuiz: e => this.setState({ ar: { ...AR, quiz: e.target.value } }), setArUser: e => this.setState({ ar: { ...AR, user: e.target.value } }),
    setArFrom: e => this.setState({ ar: { ...AR, from: e.target.value } }), setArTo: e => this.setState({ ar: { ...AR, to: e.target.value } }),
    arAnyTime: () => this.setState({ ar: { ...AR, from:'', to:'' } }), arWindow: !AR.from && !AR.to ? 'Any time' : (AR.from ? fmtDT(AR.from) : 'Start') + ' – ' + (AR.to ? fmtDT(AR.to) : 'now'),
    arBad: !!(AR.from && AR.to && AR.from > AR.to),
    exportRepCsv: () => {
      if (rt === 'usercourses') { const all = acPage.all, vis = visIdx;
        const full = all.map(([u, cid]) => { const a = Progress.courseOf(s, cid), e = acPage.evalOf(u, a); return [u.name, u.empId || '', a.code + ' · ' + a.title, e.d.completedOn, e.best == null ? (e.hasQ ? 'Not recorded' : 'No evaluation') : e.best, e.tries || '', e.d.source !== 'Skillforge' ? 'Imported' : 'Completed']; });
        csvDownload('user-course-completion-' + TODAY_KEY + '.csv', [vis.map(i => RD.cols[i])].concat(full.map(r => vis.map(i => r[i])))); return this.toastMsg(full.length + ' completed courses exported'); }
      if (rt === 'users') { csvDownload('skillforge-user-report-' + TODAY_KEY + '.csv', [['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Manager', 'Role', 'User type', 'Status', 'Date of joining', 'Last sign-in']]
          .concat(usPeople.map(u => [u.empId, u.name, u.email, u.phone, u.dept, u.designation, u.manager, (Access.roleFor(s, u) || {}).name || u.role, u.role, u.status, u.joined, u.lastLogin]))); return this.toastMsg('User report exported · ' + usPeople.length + ' users'); }
      if (rt === 'asmSheet') { if (AR.from && AR.to && AR.from > AR.to) return this.toastMsg('Fix the dates first'); const qs = arQuiz.ids.map(id => s.qs.find(q => q.id === id)).filter(Boolean);
        csvDownload('assessment-result-sheet-' + arQuiz.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + TODAY_KEY + '.csv', [['Assessment', 'Employee ID', 'Learner', 'Course ID', 'Course', 'Attempt', 'Started', 'Submitted', 'Minutes', 'Correct', 'Questions', 'Score %', 'Pass mark %', 'Result'].concat(qs.map((q, i) => 'Q' + (i + 1) + ': ' + q.text))]
          .concat(recsQ.map(r => [arQuiz.name, r.empId, r.user, r.courseCode, r.courseTitle, r.attemptNo, r.startedAt.replace('T', ' '), r.submittedAt.replace('T', ' '), r.mins, r.correct, r.total, r.score, arQuiz.pass, r.pass ? 'Passed' : 'Not passed'].concat(qs.map(q => { const x = r.res.find(y => y.qid === q.id); return !x ? 'Not shown' : x.ok ? 'Correct' : 'Incorrect'; })))));
        return this.toastMsg('Result sheet exported · ' + recsQ.length + ' attempts'); }
      if (rt === 'userAsm') { if (AR.from && AR.to && AR.from > AR.to) return this.toastMsg('Fix the dates first'); const it = userItems();
        csvDownload('user-assessment-results-' + arUser.empId + '-' + TODAY_KEY + '.csv', [['Employee ID', 'Name', 'Type', 'Course / assessment', 'Course ID', 'Date', 'Attempt', 'Correct', 'Questions', 'Score %', 'Result']]
          .concat(it.map(x => [arUser.empId, arUser.name, x.type, x.name, x.course, x.at.replace('T', ' '), x.attempt, x.rec ? x.rec.correct : '', x.rec ? x.rec.total : '', x.score == null ? '' : x.score, x.result])));
        return this.toastMsg('User assessment results exported · ' + it.length + ' rows'); }
      if (rt === 'allcompletion') {
        const f = r => (s.repCourse === 'All' || r[5] === s.repCourse) && (s.repStatus === 'All' || r[12] === s.repStatus) && (!s.repUser || r[1].toLowerCase().includes(s.repUser.toLowerCase()));
        // Very large exports (all teammates at 50–100 courses each = 1M+ module rows) are built on the server in production.
        // In the browser prototype, ask the admin to narrow it first so the page stays responsive.
        const est = people.reduce((t, u) => t + Object.keys(s.enroll[u.name] || {}).length, 0) * 5;
        if (est > 300000 && s.repStatus === 'All' && s.repCourse === 'All' && !s.repUser && s.repDept === 'All') return this.toastMsg('About ' + Math.round(est / 1000) + 'k module rows. Filter by department, course, status or person first (in production this file is prepared on the server and emailed).');
        const all = Progress.completionRows(s, u => inPeople(u)), out = [all[0]].concat(all.slice(1).filter(f));
        csvDownload('skillforge-all-course-completion-' + TODAY_KEY + '.csv', out); return this.toastMsg('All course completion exported · ' + (out.length - 1) + ' module rows');
      }
      csvDownload('skillforge-' + rt + '-report-' + TODAY_KEY + '.csv', [visIdx.map(i => RD.cols[i])].concat(fRows.map(cells => visIdx.map(i => (cells[i] || {}).v))));
      this.toastMsg(RD.name + ' exported as CSV · ' + fRows.length + ' rows');
    },
    exportRepPdf: () => this.toastMsg(RD.name + ' exported as PDF'),
    scheduleRep: () => { const on = !s.repScheduled[rt]; this.setState({ repScheduled: { ...s.repScheduled, [rt]: on } }); if (on) this.toastMsg('Emailed to you every Monday at 9:00'); },
    scheduleLabel: s.repScheduled[rt] ? 'Scheduled weekly ✓' : 'Schedule email',
  };
};
