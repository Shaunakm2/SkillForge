/* Skillforge LMS — learner values computed with admin data: my learning path, calendar sign-ups, certificates. */
SkillforgeApp.prototype.amLearnerExtras = function (c) {
  const { INK, all, s, role } = c;
  const pathIds = ['oneonones', 'feedback', 'eq'];
  const myPathSteps = pathIds.map((cid, i) => { const c = all.find(x => x.id === cid); const prevDone = i === 0 || all.find(x => x.id === pathIds[i - 1]).pct === 100; const st = c.pct === 100 ? ['Completed', '#DCFCE7', '#166534'] : c.pct > 0 ? ['In progress', '#FEF3C7', '#92400E'] : prevDone ? ['Next', '#DBEAFE', '#1E40AF'] : ['Locked', '#F5EEE3', '#75655A']; return { n:i + 1, title:c.title, color:c.color, tint:c.tint, pctStr:c.pctStr, status:st[0], stBg:st[1], stFg:st[2], icon:({ Completed:'✓', 'In progress':'●', Next:'○', Locked:'🔒' })[st[0]], nodeBg:({ Completed:'#3E8E7E', 'In progress':'#F2A93B', Next:'#FFFFFF', Locked:'#F5EEE3' })[st[0]], nodeFg:({ Completed:'#FFFFFF', 'In progress':'#2B2118', Next:'#2B2118', Locked:'#75655A' })[st[0]], nodeBd:({ Completed:'#3E8E7E', 'In progress':'#F2A93B', Next:'#2B2118', Locked:'#E2D6C4' })[st[0]], notEnd:true, locked: st[0] === 'Locked', notLast: i < 2, open: () => st[0] === 'Locked' ? this.toastMsg('Finish the previous course to unlock this one') : this.openCourse(cid) }; });
  ['Final assessment', 'Certificate'].forEach((t, i) => myPathSteps.push({ title:t, status:'Locked', stBg:'#F5EEE3', stFg:'#75655A', icon:'🔒', nodeBg:'#F5EEE3', nodeFg:'#75655A', nodeBd:'#E2D6C4', notEnd: i === 0, open: () => this.toastMsg('Finish the courses above to unlock this') }));
  const selEvents = (EVENTS[s.calSel] || []).map((e, i) => { const key = s.calSel + i; const reg = !!s.registered[key]; return { full:e.t, time:e.time, kindLabel:KIND[e.kind].label, bg:KIND[e.kind].bg, fg:KIND[e.kind].fg, isLive: e.kind !== 'due', regLabel: reg ? 'Registered ✓ · Join link sent' : 'Register', regBg: reg ? '#FFFFFF' : INK, regFg: reg ? '#245E52' : '#FFF8EE', register: () => { this.setState(st => ({ registered: { ...st.registered, [key]: !reg } })); if (!reg) this.toastMsg('Registered · calendar invite sent'); } }; });
  return {
    myPathSteps,
    selEvents,
    // Certificates use the current template (Settings › Certificates): name, course, date and score fill in.
    certs: all.filter(c => c.pct === 100 && (s.adminCourses.find(a => a.id === c.id) || { features:{} }).features.cert !== false).map(c => {
      const a = s.adminCourses.find(x => x.id === c.id), d = a ? Progress.detail(s, role.name, a) : null, best = d ? Math.max(-1, ...d.mods.map(m => m.best === '' ? -1 : +m.best)) : -1, on = (d && d.completedOn) || TODAY_KEY;
      return { title: c.title, date: new Date(on + 'T12:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }), id:'SF-' + String(Math.abs(c.id.split('').reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7)) % 90000 + 10000), tint: c.tint, color: c.color, exp: a && a.recert !== 'Never' ? 'Valid ' + a.recert : 'No expiry', expBg:'#DCFCE7', expFg:'#166534',
        download: () => { Certificate.download(s.certTpl, Certificate.values(role.name, c.title, on, best < 0 ? '' : best), 'certificate-' + c.id + '.png'); this.toastMsg('Certificate downloaded'); } }; }),
  };
};
