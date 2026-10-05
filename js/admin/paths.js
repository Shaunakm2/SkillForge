/* Skillforge LMS — learning paths editor. */
SkillforgeApp.prototype.amPaths = function (c) {
  const { INK, all, s, segs, tg } = c;
  // paths
  const pSel = s.paths.find(p => p.id === s.pathSel) || s.paths[0];
  const setP = patch => this.setState(st => ({ paths: st.paths.map(p => p.id === pSel.id ? { ...p, ...patch } : p) }));
  const pathCards = s.paths.map((p, i) => ({ name:p.name, audience:p.audience, count: p.courses.length + ' courses', enrolled: p.enrolled + ' enrolled', border: p.id === pSel.id ? INK : '#EDE4D6', dots: p.courses.map(cid => ({ color: all.find(c => c.id === cid).color })), pick: () => this.setState({ pathSel:p.id }) }));
  const peSteps = pSel.courses.map((cid, i) => { const c = all.find(x => x.id === cid); return { n:i + 1, title:c.title, hours:c.hours, cat:c.cat, color:c.color, tint:c.tint, notLast: i < pSel.courses.length - 1, remove: () => setP({ courses: pSel.courses.filter((_, j) => j !== i) }) }; });
  return {
    pathCards,
    pe: { name:pSel.name, audience:pSel.audience },
    peSteps,
    peEmpty: pSel.courses.length === 0,
    setPeName: e => setP({ name: e.target.value }),
    setPeAudience: e => setP({ audience: e.target.value }),
    peAddOptions: [{ id:'', title:'+ Add a course…' }].concat(all.filter(c => !pSel.courses.includes(c.id)).map(c => ({ id:c.id, title:c.title }))),
    peAdd: e => { if (e.target.value) setP({ courses: pSel.courses.concat([e.target.value]) }); },
    peAuto: segs(pSel.auto, ['Manual', 'Department', 'Role', 'New hires'], v => setP({ auto:v })),
    peOrder: tg(pSel.ordered, () => setP({ ordered: !pSel.ordered })),
    newPath: () => { const id = Math.max(...s.paths.map(p => p.id)) + 1; this.setState({ paths: s.paths.concat([{ id, name:'Untitled path', audience:'', courses:[], auto:'Manual', ordered:true, enrolled:0 }]), pathSel:id }); },
    savePath: () => this.toastMsg(pSel.name + ' saved · ' + pSel.courses.length + ' courses'),
  };
};
