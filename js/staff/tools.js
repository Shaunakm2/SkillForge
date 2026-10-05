/* Skillforge LMS — trainer and admin tools shown inside the main app: course builder, per-person
 * course assignment pop-up, gradebook, written-answer reviews, team view, analytics and report filters. */
SkillforgeApp.prototype.vmStaffTools = function (c) {
  const { all, role, s } = c;
  // builder
  const [bmi, bli] = s.bSel.split('-').map(Number);
  const bl = (s.bMods[bmi] && s.bMods[bmi].lessons[bli]) || s.bMods[0].lessons[0];
  const TG = { Video:['▶', '#FDF0DA', '#7A4A06'], Reading:['≡', '#E3F1EE', '#245E52'], Quiz:['?', '#F1E7F4', '#6E4380'], Activity:['✎', '#FCE6E0', '#9C3F2A'] };
  const bModules = s.bMods.map((m, mi) => ({ n: mi + 1, title: m.title, count: m.lessons.length,
    lessons: m.lessons.map((l, li) => { const sel = s.bSel === mi + '-' + li; return { ...l, glyph:TG[l.type][0], typeBg:TG[l.type][1], typeFg:TG[l.type][2], border: sel ? '#F2A93B' : 'transparent', bg: sel ? '#FFF7EA' : '#FBF7F0', pick: () => this.setState({ bSel: mi + '-' + li }) }; }),
    add: () => this.setState(st => ({ bMods: st.bMods.map((x, i) => i !== mi ? x : { ...x, lessons:[...x.lessons, { title:'Untitled lesson', type:'Video', dur:5, xp:50, desc:'' }] }), bSel: mi + '-' + st.bMods[mi].lessons.length })) }));
  // course assignments (trainer, admin, super admin)
  const canAssign = ['instructor', 'admin', 'super'].includes(s.role) || role.admin;
  const trainees = s.enrModal ? s.users.filter(u => u.status !== 'Deactivated') : [];
  const enrUser = s.enrModal ? (s.enrModal.user || '') : '';
  const enrMine = s.enroll[enrUser] || {};
  const plus30 = (() => { const d = new Date(TODAY_KEY + 'T12:00:00'); d.setDate(d.getDate() + 30); return dateKey(d); })();
  const setEnr = (cid, due) => this.setState(st => { const cur = { ...(st.enroll[enrUser] || {}) }; if (due === null) delete cur[cid]; else cur[cid] = due; return { enroll: { ...st.enroll, [enrUser]: cur } }; });
  // Person's course list: assigned courses first (with due date + Unassign), then a search to add more.
  // Never lists all 1,000 courses or a 3,500-name dropdown.
  const eq = ((s.enrModal || {}).q || '').trim().toLowerCase(), eu = s.users.find(u => u.name === enrUser) || {};
  const rowOf = (c, on) => { const av = availability(c), d = on ? Progress.detail(s, enrUser, c) : null; return { title: c.title, code: c.code, color: c.color, hasIcon: !!(c.icon && c.icon.src), noIcon: !(c.icon && c.icon.src), iconSrc: c.icon ? c.icon.src : '',
    sub: c.code + ' · ' + (d ? d.status + ' · ' + d.pct + '%' : c.cat) + (av !== 'Active' ? ' · ' + av : ''), on, off: !on, due: enrMine[c.id] || '', rowBg: on ? '#F3FBF8' : '#FFFFFF', rowBd: on ? '#BFE3D8' : '#EDE4D6',
    setDue: e => { if (e.target.value) setEnr(c.id, e.target.value); }, assign: () => { setEnr(c.id, c.due && c.due >= TODAY_KEY ? c.due : plus30); this.setState(st => ({ assignedOn: { ...st.assignedOn, [enrUser + '|' + c.id]: TODAY_KEY } })); this.toastMsg(c.title + ' assigned to ' + enrUser.split(' ')[0]); },
    unassign: () => { setEnr(c.id, null); this.toastMsg(c.title + ' unassigned from ' + enrUser.split(' ')[0] + (d && d.pct ? '. Progress is kept if assigned again.' : '')); } }; };
  const enrAssigned = s.enrModal ? Object.keys(enrMine).map(id => Progress.courseOf(s, id)).filter(Boolean).filter(c => !eq || (c.title + ' ' + c.code).toLowerCase().includes(eq)).sort((a, b) => (enrMine[a.id] || '').localeCompare(enrMine[b.id] || '')) : [];
  const enrFind = s.enrModal && eq ? s.adminCourses.filter(c => c.status === 'Published' && !enrMine[c.id] && (c.title + ' ' + c.code).toLowerCase().includes(eq)).slice(0, 20) : [];
  const EPG = Pager(this, s, 'enr-' + enrUser, enrAssigned, 25);
  const enrRows = EPG.rows.map(c => rowOf(c, true)).concat(enrFind.map(c => rowOf(c, false)));
  const ep = { ...(s.enrModal || {}), param:'empId' }, eUp = s.enrModal ? pickUser(this, { ...s, enrPick: s.enrPick || { param:'empId', q:'', sel:null } }, 'enrPick', trainees) : null;
  const enrVals = { enrModal: !!s.enrModal, enrUser, enrUserSub: eu.empId ? eu.empId + ' · ' + eu.dept : '', enrRows, enrPager: EPG.pager, enrQ: (s.enrModal || {}).q || '',
    setEnrQ: e => { const v = e.target.value; this.setState(st => ({ enrModal: { ...st.enrModal, q: v } })); },
    enrHint: eq ? (enrFind.length ? 'Courses matching “' + eq + '” that aren’t assigned yet are listed after the assigned ones.' : 'No unassigned courses match “' + eq + '”.') : 'Search to filter assigned courses or find new ones to assign.',
    enrPickUp: eUp, enrChangeUser: () => this.setState({ enrPick: { param:'empId', q:'', sel:null }, enrModal: { ...s.enrModal, picking:true } }), enrPicking: !!(s.enrModal || {}).picking || !enrUser,
    enrUsePick: () => { const u = eUp && eUp.chosen; if (!u) return this.toastMsg('Pick a person from the list'); this.setState({ enrModal: { user: u.name, q:'' }, enrPick:null }); },
    enrCount: Object.keys(enrMine).length + (Object.keys(enrMine).length === 1 ? ' course assigned' : ' courses assigned'),
    closeEnr: () => this.setState({ enrModal:null, enrPick:null }), openEnr: () => this.setState({ enrModal: { user:'', picking:true } }), canAssign };
  // gradebook
  const gq = s.gbQuery.trim().toLowerCase();
  const cell = v => v === null ? { v:'—', bg:'#F5EEE3', fg:'#75655A' } : { v, bg: v >= 85 ? '#E3F1EE' : v >= 70 ? '#FDF0DA' : '#FCE6E0', fg: v >= 85 ? '#245E52' : v >= 70 ? '#7A4A06' : '#9C3F2A' };
  const gbAll = GB.map(([name, dept, sc], i) => { const got = sc.filter(x => x !== null); const avg = Math.round(got.reduce((a, b) => a + b, 0) / got.length); const st = got.length === 4 ? ['Completed', '#E3F1EE', '#245E52'] : avg < 70 ? ['Needs support', '#FCE6E0', '#9C3F2A'] : ['In progress', '#FDF0DA', '#7A4A06']; return { name, dept, initials: ini(name), av: AV[i % 5], cells: sc.map(cell), avg, avgN:avg, status: st[0], stBg: st[1], stFg: st[2] }; });
  const gbRows = gbAll.filter(r => !gq || r.name.toLowerCase().includes(gq));
  // written answers — trainer rates each one from 0 to the question's points
  const setRv = (id, patch) => this.setState(st => ({ rvDraft: { ...st.rvDraft, [id]: { ...(st.rvDraft[id] || {}), ...patch } } }));
  const rvAll = s.reviews.map((r, i) => {
    // Connected, raters don't read the question bank (answer keys): the review row carries the question and points.
    const q = r.qText ? { text: r.qText, points: r.points || 0, guide: r.guide || '' } : s.qs.find(x => x.id === r.qid) || { text:'(question removed)', points:5, guide:'' };
    const dr = { rating: r.rating, feedback: r.feedback, ...(s.rvDraft[r.id] || {}) };
    const pending = r.rating === null, editing = pending || s.rvEdit === r.id;
    const scale = Array.from({ length: q.points + 1 }, (_, v) => { const on = dr.rating === v; return { label: String(v), bg: on ? '#2B2118' : '#FFFFFF', fg: on ? '#FFF8EE' : '#2B2118', border: on ? '#2B2118' : '#E2D6C4', pick: () => setRv(r.id, { rating:v }) }; });
    const save = () => {
      if (dr.rating === null || dr.rating === undefined) return this.toastMsg('Pick a rating first');
      // Connected: the server records the rating and re-scores the attempt (the step passes if the score is high enough).
      if (Backend.on) { Backend.call('rescore', { reviewId: r.id, rating: dr.rating }).then(() => { this.setState(st => ({ rvEdit:null, rvDraft: { ...st.rvDraft, [r.id]: undefined } })); this.toastMsg('Rating saved · ' + r.learner.split(' ')[0] + ' ' + dr.rating + '/' + q.points); }).catch(e => this.toastMsg(e.message)); return; }
      this.setState(st => ({ reviews: st.reviews.map(x => x.id === r.id ? { ...x, rating: dr.rating, feedback: (dr.feedback || '').trim() } : x), rvEdit:null, rvDraft: { ...st.rvDraft, [r.id]: undefined } }));
      this.toastMsg('Rating saved · ' + r.learner.split(' ')[0] + ' ' + dr.rating + '/' + q.points);
    };
    const tone = !pending ? (r.rating / q.points >= 0.8 ? ['#E3F1EE', '#245E52'] : r.rating / q.points >= 0.5 ? ['#FDF0DA', '#7A4A06'] : ['#FCE6E0', '#9C3F2A']) : ['#FDF0DA', '#7A4A06'];
    return { ...r, initials: ini(r.learner), av: AV[i % 5], question: q.text, guide: q.guide, hasGuide: !!q.guide, maxLabel: 'Rate 0–' + q.points, pending, editing, viewing: !editing, scale, fbValue: dr.feedback || '', setFb: e => setRv(r.id, { feedback: e.target.value }), save, cancel: () => this.setState({ rvEdit:null, rvDraft: { ...s.rvDraft, [r.id]: undefined } }), canCancel: !pending && editing, edit: () => this.setState({ rvEdit: r.id }), statusLabel: pending ? 'To review' : 'Rated ' + r.rating + '/' + q.points, stBg: tone[0], stFg: tone[1], hasFeedback: !pending && !!r.feedback };
  });
  const rvPending = rvAll.filter(r => r.pending).length, rvRated = rvAll.length - rvPending;
  const rvList = rvAll.filter(r => s.rvTab === 'pending' ? r.pending : !r.pending);
  const rvTabs = [['pending', 'To review · ' + rvPending], ['rated', 'Rated · ' + rvRated]].map(([id, label]) => { const on = s.rvTab === id; return { label, bg: on ? '#2B2118' : '#FFFFFF', fg: on ? '#FFF8EE' : '#2B2118', border: on ? '#2B2118' : '#E2D6C4', pick: () => this.setState({ rvTab:id }) }; });
  // team
  const assignPeople = TEAM.map((m, i) => { const on = !!s.assignSel[m.name]; return { first: m.name.split(' ')[0], initials: ini(m.name), av: AV[i % 5], border: on ? '#F2A93B' : '#EDE4D6', bg: on ? '#FFF7EA' : '#FFFFFF', toggle: () => this.setState(st => ({ assignSel: { ...st.assignSel, [m.name]: !st.assignSel[m.name] } })) }; });
  const nSel = Object.values(s.assignSel).filter(Boolean).length;
  const teamList = TEAM.map((m, i) => ({ ...m, initials: ini(m.name), av: AV[i % 5], pctStr: m.pct + '%', barColor: m.pct >= 70 ? '#3E8E7E' : m.pct >= 45 ? '#F2A93B' : '#E8664A', xpFmt: fmt(m.you ? s.xp : m.xp), overdueLabel: m.overdue ? m.overdue + ' overdue' : 'On track', odBg: m.overdue ? '#FCE6E0' : '#E3F1EE', odFg: m.overdue ? '#9C3F2A' : '#245E52', nudge: () => this.toastMsg('Reminder sent to ' + m.name.split(' ')[0]) }));
  const TCS = ['Leading Through Change','Giving Feedback That Lands','Presenting with Confidence','Negotiation Essentials','Running Effective 1:1s','Emotional Intelligence at Work'], TDUE = ['Oct 8','Oct 15','Oct 30','Nov 14'];
  const STT = { overdue:['! Overdue','#FCE6E0','#9C3F2A'], soon:['! Due soon','#FDF0DA','#7A4A06'], notstarted:['○ Not started','#F5EEE3','#75655A'], progress:['● In progress','#DCE5F3','#2F4A7A'], done:['✓ Completed','#D6EBE6','#245E52'] };
  const tmAll = [];
  TEAM.forEach((m, i) => [0, 1].forEach(k => {
    let pct = k === 0 ? m.pct : (m.pct * 7) % 101; if (k === 1 && i === 5) pct = 0; if (k === 1 && i === 2) pct = 100;
    const od = k === 0 ? m.overdue > 0 : m.overdue > 1, due = od ? 'Sep 30' : TDUE[(i + k * 2) % 4];
    const key = pct === 100 ? 'done' : od ? 'overdue' : pct === 0 ? 'notstarted' : due === 'Oct 8' ? 'soon' : 'progress';
    tmAll.push({ key, name:m.name, title:m.title, initials:ini(m.name), av:AV[i % 5], course:TCS[(i + k * 2) % 6], pctStr:pct + '%', barColor: pct === 100 ? '#3E8E7E' : pct >= 45 ? '#F2A93B' : '#E8664A', due: pct === 100 ? '–' : due, label:STT[key][0], bg:STT[key][1], fg:STT[key][2], remind: () => this.toastMsg('Reminder sent to ' + m.name.split(' ')[0]) });
  }));
  const tmRows = tmAll.filter(r => s.tf === 'all' || r.key === s.tf);
  const tmChips = [['all','All'],['overdue','Overdue'],['soon','Due soon'],['notstarted','Not started'],['progress','In progress'],['done','Completed']].map(([id, label]) => { const on = s.tf === id; return { label, n: id === 'all' ? tmAll.length : tmAll.filter(r => r.key === id).length, bg: on ? '#2B2118' : '#FFFFFF', fg: on ? '#FFF8EE' : '#4A3B2F', bd: on ? '#2B2118' : '#E2D6C4', pick: () => this.setState({ tf:id }) }; });
  const attn = [[12,'Overdue assignments','#9C3F2A','reports'],[8,'Certificates expiring','#7A4A06','reports'],[2,'Integration errors','#9C3F2A','admin'],[5,'Pending user actions','#4A3B2F','users']].map(([n, l, fg, scr]) => ({ n, l, fg, go: () => this.go(scr, { adminView:true }) }));
  // analytics
  const R = { '30d':{ n:10, base:1180, kpis:['1,284', '+6%', '68%', '+3 pts', '3.4h', '+0.4h', '212', '+18%'], labels:['Sep 4', 'Sep 10', 'Sep 16', 'Sep 22', 'Sep 28', 'Oct 3'], cap:'Daily, last 30 days' },
    '90d':{ n:13, base:980, kpis:['1,412', '+14%', '64%', '+5 pts', '9.8h', '+1.2h', '587', '+22%'], labels:['Jul 6', 'Jul 27', 'Aug 17', 'Sep 7', 'Sep 21', 'Oct 3'], cap:'Weekly, last 90 days' },
    '12m':{ n:12, base:620, kpis:['1,690', '+41%', '59%', '+11 pts', '31h', '+7h', '2,140', '+63%'], labels:['Nov', 'Jan', 'Mar', 'May', 'Jul', 'Sep'], cap:'Monthly, last 12 months' } }[s.range];
  const pts = Array.from({ length:R.n }, (_, i) => R.base + i * (520 / R.n) + Math.sin(i * 1.7) * 70 + Math.cos(i * 0.9) * 40);
  const mn = Math.min(...pts) - 60, mx = Math.max(...pts) + 40;
  const xy = pts.map((v, i) => [i / (R.n - 1) * 640, 210 - (v - mn) / (mx - mn) * 190]);
  const lineD = xy.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const k = R.kpis;
  return {
    ...enrVals,
    repMgr: s.repMgr,
    repCourse: s.repCourse,
    repStatus: s.repStatus,
    repUser: s.repUser,
    repMgrOptions: [{ v:'All', l:'All managers' }, { v:'Priya Raman', l:'Priya Raman' }, { v:'None', l:'No manager' }],
    repCourseOptions: [{ v:'All', l:'All courses' }].concat(COURSES.map(c => ({ v:c.title, l:c.title }))),
    repStatusOptions: (s.repType === 'kpfeedback' ? ['All', 'Scheduled', 'Due', 'Sent', 'Responded'] : ['All', 'Completed', 'In progress', 'Not started', 'Overdue']).map(v => ({ v, l: v === 'All' ? 'All statuses' : v })),
    setRepMgr: e => this.setState({ repMgr: e.target.value }),
    setRepCourse: e => this.setState({ repCourse: e.target.value }),
    setRepStatus: e => this.setState({ repStatus: e.target.value }),
    setRepUser: e => this.setState({ repUser: e.target.value }),
    saveRep: () => this.toastMsg('Report saved to My reports with the current filters'),
    bTitle: s.bTitle,
    setBTitle: e => this.setState({ bTitle: e.target.value }),
    bModules,
    bl,
    addModule: () => this.setState(st => ({ bMods: [...st.bMods, { title:'New module', lessons:[{ title:'Untitled lesson', type:'Video', dur:5, xp:50, desc:'' }] }], bSel: st.bMods.length + '-0' })),
    deleteLesson: () => { const m = s.bMods[bmi]; if (m.lessons.length <= 1) { this.toastMsg('A module needs at least one lesson'); return; } this.setState({ bMods: s.bMods.map((x, i) => i !== bmi ? x : { ...x, lessons: x.lessons.filter((_, j) => j !== bli) }), bSel: bmi + '-0' }); },
    setBlTitle: e => this.updBl({ title: e.target.value }),
    setBlDur: e => this.updBl({ dur: Number(e.target.value) || 0 }),
    setBlDesc: e => this.updBl({ desc: e.target.value }),
    typeOpts: ['Video', 'Reading', 'Quiz', 'Activity'].map(t => ({ label:t, border: bl.type === t ? '#F2A93B' : '#EDE4D6', bg: bl.type === t ? '#FFF7EA' : '#FFFFFF', pick: () => this.updBl({ type:t }) })),
    xpOpts: [20, 30, 50, 100].map(v => ({ v, border: bl.xp === v ? '#F2A93B' : '#EDE4D6', bg: bl.xp === v ? '#FFF7EA' : '#FFFFFF', pick: () => this.updBl({ xp:v }) })),
    mediaLabel: { Video:'Video file', Reading:'Reading material', Quiz:'Question set', Activity:'Activity brief' }[bl.type],
    mediaHint: { Video:'MP4 or MOV, up to 2 GB. Captions generate automatically.', Reading:'PDF, DOCX, or paste text', Quiz:'Import a CSV of questions or build them here', Activity:'PDF or DOCX template for learners to complete' }[bl.type],
    pubLabel: s.published ? 'PUBLISHED' : 'DRAFT',
    pubBg: s.published ? '#E3F1EE' : '#F5EEE3',
    pubFg: s.published ? '#245E52' : '#75655A',
    publishLabel: s.published ? 'Update course' : 'Publish course',
    publish: () => { this.setState({ published:true }); this.toastMsg(s.published ? 'Changes published' : 'Course published to 760 enrolled learners'); },
    previewCourse: () => { const c = COURSES.find(x => x.title.trim().toLowerCase() === s.bTitle.trim().toLowerCase()); if (c) this.openCourse(c.id); else this.toastMsg('Publish the course to preview it as a learner'); },
    gbQuery: s.gbQuery,
    setGbQuery: e => this.setState({ gbQuery: e.target.value }),
    gbRows,
    rvList,
    rvTabs,
    rvEmpty: rvList.length === 0,
    rvEmptyLabel: s.rvTab === 'pending' ? 'All written answers are rated.' : 'No rated answers yet.',
    rvSummary: rvPending ? rvPending + (rvPending === 1 ? ' answer needs' : ' answers need') + ' your rating' : 'Nothing waiting for a rating',
    exportCsv: () => this.toastMsg('Gradebook exported'),
    gbStats: [{ l:'Cohort average', v: Math.round(gbAll.reduce((a, r) => a + r.avgN, 0) / gbAll.length) + '%' }, { l:'Completed final', v: gbAll.filter(r => r.status === 'Completed').length + ' of ' + gbAll.length }, { l:'Need support', v: gbAll.filter(r => r.status === 'Needs support').length }],
    teamStats: [{ l:'Team members', v:TEAM.length, fg:'#2B2118' }, { l:'On track', v:TEAM.filter(m => !m.overdue).length, fg:'#245E52' }, { l:'Needs attention', v:TEAM.filter(m => m.overdue === 1).length, fg:'#7A4A06' }, { l:'Overdue', v:TEAM.filter(m => m.overdue > 1).length, fg:'#9C3F2A' }],
    teamRows: teamList,
    tmRows,
    tmChips,
    tmEmpty: tmRows.length === 0,
    tmSummary: TEAM.filter(m => m.overdue > 0).length + ' need attention',
    attn,
    openAssign: () => this.setState({ assignOpen:true }),
    closeAssign: () => this.setState({ assignOpen:false }),
    stop: e => e.stopPropagation(),
    assignOpen: s.assignOpen,
    assignPeople,
    assignDue: s.assignDue,
    setAssignDue: e => this.setState({ assignDue: e.target.value }),
    assignCourses: all.filter(c => c.pct < 100).slice(0, 6).map(c => ({ title:c.title, color:c.color, border: s.assignCourse === c.id ? '#F2A93B' : '#EDE4D6', bg: s.assignCourse === c.id ? '#FFF7EA' : '#FFFFFF', pick: () => this.setState({ assignCourse:c.id }) })),
    selectAll: () => this.setState({ assignSel: Object.fromEntries(TEAM.map(m => [m.name, true])) }),
    assignBtnLabel: nSel ? 'Assign to ' + nSel + (nSel === 1 ? ' person' : ' people') : 'Select people',
    assignBtnBg: nSel ? '#2B2118' : '#EDE4D6',
    assignBtnFg: nSel ? '#FFF8EE' : '#75655A',
    confirmAssign: () => { if (!nSel) return; const c = all.find(x => x.id === s.assignCourse); const enroll = { ...s.enroll }; Object.keys(s.assignSel).filter(n => s.assignSel[n]).forEach(n => { enroll[n] = { ...(enroll[n] || {}), [c.id]: s.assignDue }; }); this.setState({ assignOpen:false, assignSel:{}, enroll }); this.toastMsg(c.title + ' assigned to ' + nSel + (nSel === 1 ? ' person' : ' people')); },
    rangeTabs: [['30d', '30 days'], ['90d', '90 days'], ['12m', '12 months']].map(([id, label]) => ({ label, bg: s.range === id ? '#FFFFFF' : 'transparent', fg: s.range === id ? '#2B2118' : '#75655A', shadow: s.range === id ? '0 1px 3px rgba(43,33,24,.15)' : 'none', pick: () => this.setState({ range:id }) })),
    kpis: [{ l:'Active learners', v:k[0], d:k[1] }, { l:'Completion rate', v:k[2], d:k[3] }, { l:'Learning time per person', v:k[4], d:k[5] }, { l:'Certificates issued', v:k[6], d:k[7] }],
    lineD,
    areaD: lineD + ' L640 220 L0 220 Z',
    chartLabels: R.labels,
    chartCaption: R.cap,
    depts: [['Customer Success', 82, '#F2A93B'], ['Marketing', 77, '#F2A93B'], ['Sales', 74, '#3E8E7E'], ['Operations', 69, '#3E8E7E'], ['Engineering', 61, '#8C5A9E'], ['Finance', 55, '#E8664A']].map(([name, v, color]) => ({ name, pct: v + '%', color })),
    topCourses: all.slice(0, 6).sort((a, b) => b.learners - a.learners).slice(0, 5).map(c => ({ title:c.title, color:c.color, enrolled: fmt(c.learners), comp: (60 + (c.learners % 31)) + '%', rating:c.rating })),
  };
};
