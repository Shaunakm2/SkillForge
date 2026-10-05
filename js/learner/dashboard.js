/* Skillforge LMS — learner home dashboard, My learning (XP, badges, certificates) and leaderboards. */
SkillforgeApp.prototype.vmDashboard = function (c) {
  const { all, liveAll, myEnroll, qsc, role, s } = c;
  // Every number on Home comes from one summary of the person's learning records.
  const S = Progress.summary(s, role.name), live = new Set(liveAll.map(x => x.id)), byId = id => all.find(x => x.id === id);
  const level = Math.floor(s.xp / 1000) + 4, nextLevelXp = (Math.floor(s.xp / 1000) + 1) * 1000, levelFrac = (s.xp % 1000) / 1000;
  const C = 2 * Math.PI * 32;
  // leaderboard
  const teamSorted = TEAM.map(m => m.you ? { ...m, xp:s.xp } : m).sort((a, b) => b.xp - a.xp);
  const teamRank = teamSorted.findIndex(m => m.you) + 1;
  const medal = ['#F2C46B', '#DCD3C8', '#E8B48F'];
  const lbHidden = ((s.prefs || {})[role.name] || {}).leaderboard === false;
  const lbRow = (p, i, extra) => ({ name: p.you ? p.name + (lbHidden ? ' (you · hidden from teammates)' : ' (you)') : p.name, first:p.name.split(' ')[0], team:p.team, xpFmt: fmt(p.xp), rank: i + 1, initials: ini(p.name), av: AV[(i + 2) % 5], rowBg: p.you ? '#FDF0DA' : 'transparent', weight: p.you ? 700 : 500, rankBg: i < 3 ? medal[i] : '#F5EEE3', gap:false, ...(extra || {}) });
  const teamRows = teamSorted.map((p, i) => lbRow(p, i));
  const compRows = [...COMPANY.map((p, i) => lbRow(p, i)), lbRow({ ...TEAM[0], xp:s.xp }, 26, { gap:true })];
  const lbRows = s.lb === 'team' ? teamRows : compRows;
  const podiumSrc = lbRows.slice(0, 3);
  const podium = [podiumSrc[1], podiumSrc[0], podiumSrc[2]].map((p, i) => ({ ...p, medal: medal[[1, 0, 2][i]], h: ['64px', '88px', '48px'][i] }));
  const lbTabs = [['team', 'Team'], ['company', 'Company']].map(([id, label]) => ({ label, bg: s.lb === id ? '#FFFFFF' : 'transparent', fg: s.lb === id ? '#2B2118' : '#75655A', shadow: s.lb === id ? '0 1px 3px rgba(43,33,24,.15)' : 'none', pick: () => this.setState({ lb:id }) }));
  // homepage announcements
  const liveAnns = s.anns.filter(a => annStatus(a) === 'Live' && !s.annHidden[a.id]).map(a => ({ ...a, bg: a.tone === 'Important' ? '#2B2118' : '#FFFFFF', fg: a.tone === 'Important' ? '#FFF8EE' : '#2B2118', sub: a.tone === 'Important' ? '#E9DCC8' : '#75655A', bd: a.tone === 'Important' ? '#2B2118' : '#EDE4D6', dot: a.tone === 'Important' ? '#F2A93B' : '#3E8E7E', untilLabel: 'Until ' + fmtDateTime(a.until), hide: () => this.setState(st => ({ annHidden: { ...st.annHidden, [a.id]: true } })) }));
  const fmtDue = x => x.d.overdue ? 'Overdue · ' + shortDate(x.d.due) : 'Due ' + shortDate(x.d.due);
  const asCard = x => { const c0 = byId(x.a.id) || {}, days = daysUntil(x.d.due), soon = x.d.overdue || days <= 7;
    return { ...c0, pct: x.d.pct, pctStr: x.d.pct + '%', due: fmtDue(x), dueBg: soon ? '#FCE6E0' : '#F5EEE3', dueFg: soon ? '#9C3F2A' : '#4A3B2F', open: () => this.openCourse(x.a.id) }; };
  const assigned = S.list.filter(x => live.has(x.a.id)).sort((x, y) => (x.d.due || '9').localeCompare(y.d.due || '9')).map(asCard);
  const soonList = S.dueSoon.filter(x => live.has(x.a.id));
  const first = soonList[0];
  const dueLine = !S.total ? 'Nothing is assigned to you yet. Browse the catalog to start learning.'
    : !soonList.length ? 'You have no learning activities due in the next two weeks.'
    : 'You have ' + soonList.length + ' learning ' + (soonList.length === 1 ? 'activity' : 'activities') + ' due soon. ' + first.a.title + (first.d.overdue ? ' is overdue.' : daysUntil(first.d.due) === 0 ? ' is due today.' : ' is due in ' + daysUntil(first.d.due) + (daysUntil(first.d.due) === 1 ? ' day.' : ' days.'));
  const hour = new Date().getHours();
  const goAssigned = st => () => this.go('catalog', { catRel:'assigned', catSt:st, catCat:'All', catLvl:'All', catQuery:'' });
  const dashStats = [
    { label:'Assigned courses', v: S.total, hint: S.dueWeek ? S.dueWeek + ' due in the next 7 days' : 'Nothing due in the next 7 days', icon:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5', color:'#2B2118', tint:'#F5EEE3', go: goAssigned('All') },
    { label:'Not started', v: S.notStarted, hint:'Assigned, not opened yet', icon:'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', color:'#B7791F', tint:'#FDF0DA', go: goAssigned('Not started') },
    { label:'In progress', v: S.inProgress, hint:'Pick up where you left off', icon:'M5 12h14M13 6l6 6-6 6', color:'#2F4A7A', tint:'#E5ECF7', go: goAssigned('In progress') },
    { label:'Overdue', v: S.overdue, hint: S.overdue ? 'Past the due date, not finished' : 'Nothing overdue', icon:'M12 8v5M12 16.5h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z', color:'#9C3F2A', tint:'#FCE6E0', go: goAssigned('Overdue') },
    { label:'Completed', v: S.done, hint: S.total ? Math.round(S.done / S.total * 100) + '% of assigned' : '—', icon:'M5 12l5 5 9-10', color:'#3E8E7E', tint:'#E3F1EE', go: goAssigned('Completed') },
  ];
  // Due soon: not completed, due within 14 days or overdue, soonest first.
  const dueOpen = soonList.map(asCard);
  const dueCompact = dueOpen.slice(0, 4), dueMore = dueOpen.length > 4 ? '+' + (dueOpen.length - 4) + ' more' : '';
  // Continue learning: the person's own in-progress (or most urgent) course.
  const CW = S.continueWith && live.has(S.continueWith.a.id) ? S.continueWith : null;
  let cont = null;
  if (CW) { const a = CW.a, st = Progress.itemStates(s, a, role.name), ni = Math.max(0, st.findIndex(x => !x.done)), it = a.items[ni] || {};
    const z = it.kind === 'quiz' ? s.quizzes.find(q => q.id === it.quizId) : null, m = it.moduleId ? s.lcms.find(x => x.id === it.moduleId) : null;
    const legacy = COURSES.some(x => x.id === a.id), L = legacy ? FLAT[ni] : null;
    const leftMins = a.items.slice(ni).reduce((t, x, k) => t + (legacy ? (FLAT[ni + k] || {}).min || 5 : x.mins || 10), 0);
    const lastAt = st.map(x => x.at).filter(Boolean).sort().pop();
    cont = { id: a.id, legacy, idx: ni, title: a.title, pctStr: CW.d.pct + '%', next: z ? z.name : m ? m.title : L ? L.title : it.title || 'Next step', nextMin: legacy && L ? L.min : it.mins || 10,
      last: lastAt ? (lastAt === TODAY_KEY ? 'Today' : shortDate(lastAt)) : 'Not started', left: (leftMins >= 60 ? Math.floor(leftMins / 60) + 'h ' : '') + (leftMins % 60) + 'm', due: CW.d.due ? shortDate(CW.d.due) : 'No due date',
      label: CW.d.overdue ? 'OVERDUE · PICK THIS UP FIRST' : CW.d.status === 'In progress' ? 'Continue learning' : 'Start next', cta: CW.d.status === 'Not started' ? 'Start course' : 'Resume' }; }
  const sat = s.lessonsToday > 0;
  const week = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => { const d = i < 5 || (i === 5 && sat); const today = i === 5; return { l, mark: d ? '✓' : '', bg: d ? '#F2A93B' : '#FFFFFF', border: d ? '#F2A93B' : today ? '#F2A93B' : '#EDE4D6', fg: '#2B2118' }; });
  const questsRaw = [{ t:'Complete 1 lesson', xp:50, done: sat }, { t:'Reply in a discussion', xp:20, done: s.quests.discuss }, { t:'Score 80%+ on a quiz', xp:100, done: s.qDone && qsc.pct >= 80 }];
  const quests = questsRaw.map(x => ({ ...x, bg: x.done ? '#E3F1EE' : '#FBF7F0', box: x.done ? '#3E8E7E' : '#D9CBB6', boxFill: x.done ? '#3E8E7E' : '#FFFFFF', fg: x.done ? '#245E52' : '#2B2118' }));
  // Badges come from Settings › Master data › Badges; earned from this person's learning records.
  const BM = Badges.metrics(s, role.name);
  const badges = s.badges.filter(b => b.on).map(b => { const v = BM[b.metric] || 0, e = v >= b.n;
    return { glyph: b.glyph, name: b.name, desc: b.desc + (e ? '' : ' · ' + Math.min(v, b.n) + ' / ' + b.n), bg: e ? b.color + '22' : '#F5EEE3', ring: e ? b.color : '#E2D6C4', fg: e ? b.color : '#B3A595', nameFg: e ? '#2B2118' : '#75655A', cardBg: e ? '#FFFDF9' : 'transparent', e }; });
  return {
    liveAnns,
    hasAnns: liveAnns.length > 0 && ((s.platform || PLATFORM0).feat.anns !== false),
    isLearner: s.role === 'learner',
    streak: 14,
    xpFmt: fmt(s.xp),
    level,
    nextLevel: level + 1,
    xpToNext: fmt(nextLevelXp - s.xp),
    nextLevelXpFmt: fmt(nextLevelXp),
    levelPct: Math.round(levelFrac * 100) + '%',
    ringDash: (C * levelFrac).toFixed(1) + ' ' + C.toFixed(1),
    teamRank,
    cont: cont || {}, hasCont: !!cont, noCont: !cont,
    dashStats: Tiles.apply(s, 'home', dashStats.map(d => ({ ...d, key: d.label })), d => d.key, (d, l) => ({ ...d, label: l })),
    dueCompact,
    dueEmpty: dueOpen.length === 0, dueEmptyText: S.total ? 'Nothing due in the next two weeks.' : 'Nothing assigned yet.',
    dueMore,
    hasDueMore: !!dueMore,
    goDueAll: goAssigned('All'),
    dueLine,
    greeting: hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening',
    todayLabel: TODAY.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }),
    teamSizeLabel: TEAM.length + ' people',
    resumeCourse: () => { if (!cont) return; if (cont.legacy) this.setState({ courseId: cont.id }, () => this.openLesson(this.firstOpen(cont.id))); else this.go('item', { courseId: cont.id, itemIdx: cont.idx, scormOn:false, from:'home' }); },
    openContCourse: () => { if (cont) this.openCourse(cont.id); },
    assigned,
    recommended: liveAll.filter(c => ['coaching', 'eq', 'inclusive'].includes(c.id)),
    goCatalog: () => this.go('catalog'),
    goProgress: () => this.go('progress'),
    week,
    quests,
    teamTop5: teamRows.slice(0, 5),
    statCards: [{ v: S.done, l:'Courses completed', tint:'#E3F1EE', color:'#3E8E7E' }, { v:'26.5h', l:'Time learning', tint:'#F1E7F4', color:'#8C5A9E' }, { v:'2', l:'Certificates', tint:'#FCE6E0', color:'#E8664A' }],
    badges,
    badgesEarned: badges.filter(b => b.e).length, badgesTotal: badges.length,
    skills: [['Change leadership', 72, '#F2A93B'], ['Giving feedback', 58, '#3E8E7E'], ['Coaching', 40, '#8C5A9E'], ['Communication', 81, '#3E8E7E'], ['Self-management', 35, '#E8664A']].map(([name, v, color]) => ({ name, v, pct: v + '%', color })),
    certs: [{ title:'Running Effective 1:1s', date:'Sep 12, 2026', id:'SF-48213', tint:'#F1E7F4', color:'#8C5A9E' }, { title:'Foundations of Management', date:'Jun 3, 2026', id:'SF-30977', tint:'#FDF0DA', color:'#F2A93B' }].map(c => ({ ...c, download: () => this.toastMsg('Certificate downloaded') })),
    lbTabs,
    lbRows,
    podium,
  };
};
