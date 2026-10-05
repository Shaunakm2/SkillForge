/* Skillforge LMS — Analytics dashboards (Power BI–style, customisable) and the MIS dashboard.
 *
 *  Two data sources:
 *    Learning   course assignments and completions (≈125k assignments)
 *    Training   the training MIS: one row per trainee per batch (Mis.records), batches and their live status
 *  Visuals: KPI, bar, column, line, donut, stacked bar, heat map, table, handover-TAT matrix, batch tracker.
 *  Each visual picks a source, measure and dimension; learning visuals can carry their own course drop-down.
 *  Page filters (division, sub division, course, training, location, date range) apply to every visual.
 *  Dashboards are saved by name; "MIS dashboard" is a ready-made board on the training source.
 */
const DB_SRC = { learn:'Learning (courses)', train:'Training (batches / MIS)' };
const DB_MEASURES = {
  learn: { assignments:['Assignments', 'n'], completed:['Completed', 'n'], inProgress:['In progress', 'n'], overdue:['Overdue', 'n'], notStarted:['Not started', 'n'], completionRate:['Completion rate', 'pct'], overdueRate:['Overdue rate', 'pct'], learners:['Learners', 'n'], avgScore:['Average assessment score', 'pct'], modules:['Modules completed', 'n'] },
  train: { joined:['Joined', 'n'], classDone:['Completed classroom', 'n'], volShare:['Voluntary share of attrition', 'pct'], earlyLeft:['Left before OJT', 'n'], daysToLeave:['Average days before leaving', 'dec'], participants:['Participants', 'n'], unique:['Unique trainees', 'n'], handover:['Handed over', 'n'], earlyAbsorb:['Early absorbed', 'n'], inTraining:['In training', 'n'], attrited:['Attrited', 'n'], throughput:['Throughput', 'pct'], attritionRate:['Attrition rate', 'pct'], avgTat:['Avg handover TAT (weeks)', 'dec'], batches:['Batches', 'n'] },
};
const DB_DIMS = {
  learn: { division:'Division', subDivision:'Sub division', dept:'Department', category:'Course category', site:'Location', status:'Assignment status', month:'Completion month', course:'Course (top 10)', role:'User type' },
  train: { segment:'Training segment', training:'Training name', month:'Month', attrMonth:'Attrition month (DOL)', reason:'Attrition reason', attrCat:'Voluntary / involuntary', attrResp:'Attrition responsibility', attrStage:'Stage at attrition', location:'Location', brand:'Brand', traineeType:'Type of trainee', status:'Current status', group:'Status group', subDivision:'Sub division', division:'Division', trainer:'Trainer', batch:'Batch' },
};
const DB_TYPES = {
  kpi:['KPI card', 'One number', false], funnel:['Pipeline funnel', 'Mapped → joined → classroom → handed over', false], rank:['Ranked list', 'Top items with share of total', true], bar:['Bar chart', 'Compare across a dimension', true], column:['Column chart', 'Compare across a dimension', true], line:['Line chart', 'Trend over months', true], donut:['Donut', 'Share of a whole', true],
  stack:['Stacked bar', 'Status split per group', true], heat:['Heat map', 'Two dimensions at once', false], table:['Table', 'Rows with several measures', true], matrix:['Handover TAT matrix', 'Weeks from joining to handover, by group', true], batches:['Batch tracker', 'Where each batch is right now', false],
};
const DB_COLORS = ['#3E8E7E', '#F2A93B', '#E8664A', '#5B7DB8', '#8C5A9E', '#14B8A6', '#CA8A04', '#DB2777', '#0891B2', '#65A30D'];
const TAT_BUCKETS = [['≤3', 0, 3], ['4-5', 4, 5], ['6-7', 6, 7], ['8-9', 8, 9], ['10+', 10, 999]];
const DB_DEFAULT = [
  { id:'v1', src:'learn', type:'kpi', measure:'learners', w:3 }, { id:'v2', src:'learn', type:'kpi', measure:'assignments', w:3 }, { id:'v3', src:'learn', type:'kpi', measure:'completionRate', w:3 }, { id:'v4', src:'learn', type:'kpi', measure:'overdue', w:3 },
  { id:'v7', src:'learn', type:'line', measure:'completed', dim:'month', w:8, title:'Courses completed each month', pick:true },
  { id:'v11', src:'learn', type:'donut', measure:'assignments', dim:'status', w:4, title:'Course-wise completion', pick:true },
  { id:'v5', src:'learn', type:'rank', measure:'completionRate', dim:'division', w:6, title:'Completion rate by division', pick:true },
  { id:'v8', src:'learn', type:'rank', measure:'overdue', dim:'category', w:6, title:'Where overdue learning sits' },
  { id:'v10', src:'learn', type:'rank', dim:'course', measure:'assignments', w:12, title:'Most assigned courses' },
];
/* Training overview: original layout (pipeline, live batches, outcomes, mix) — no location or brand breakdowns. */
const DB_MIS = [
  { id:'m30', src:'train', type:'funnel', w:5, title:'Training pipeline' },
  { id:'m31', src:'train', type:'line', measure:'participants', measure2:'handover', dim:'month', w:7, title:'Participants vs handed over, by batch start month' },
  { id:'m32', src:'train', type:'donut', measure:'participants', dim:'group', w:4, title:'Where everyone is now' },
  { id:'m33', src:'train', type:'rank', measure:'participants', dim:'segment', w:4, title:'Training mix' },
  { id:'m34', src:'train', type:'stack', measure:'participants', dim:'traineeType', w:4, title:'New hires vs existing' },
  { id:'m35', src:'train', type:'rank', measure:'participants', dim:'training', w:6, title:'Busiest programmes' },
  { id:'m36', src:'train', type:'rank', measure:'inTraining', dim:'trainer', w:6, title:'Trainer load · people in training now' },
  { id:'m7', src:'train', type:'batches', w:12, title:'Batches in progress', active:true },
];
/* Attrition: its own dashboard. */
const DB_ATTR = [
  { id:'a3', src:'train', type:'kpi', measure:'volShare', w:6 }, { id:'a4', src:'train', type:'kpi', measure:'daysToLeave', w:6 },
  { id:'a5', src:'train', type:'line', measure:'attrited', dim:'attrMonth', w:8, title:'Attrition trend · by month of leaving' },
  { id:'a6', src:'train', type:'donut', measure:'attrited', dim:'attrStage', w:4, title:'When people leave' },
  { id:'a7', src:'train', type:'column', measure:'attritionRate', dim:'month', w:8, title:'Attrition rate by batch start month' },
  { id:'a8', src:'train', type:'donut', measure:'attrited', dim:'attrCat', w:4, title:'Voluntary vs involuntary' },
  { id:'a9', src:'train', type:'rank', measure:'attrited', dim:'reason', w:6, title:'Why people leave' },
  { id:'a10', src:'train', type:'rank', measure:'attrited', dim:'attrResp', w:6, title:'Attributed to' },
  { id:'a11', src:'train', type:'rank', measure:'attritionRate', dim:'segment', w:6, title:'Attrition rate by training segment' },
  { id:'a12', src:'train', type:'stack', measure:'participants', dim:'traineeType', w:6, title:'Outcomes · new hires vs existing' },
];
const DB0 = { boards:[{ id:'mis', name:'Training overview', visuals: DB_MIS }, { id:'attr', name:'Attrition', visuals: DB_ATTR }, { id:'b1', name:'Learning overview', visuals: DB_DEFAULT },
  { id:'b2', name:'Compliance watch', visuals:[{ id:'c1', src:'learn', type:'kpi', measure:'overdueRate', w:4 }, { id:'c2', src:'learn', type:'kpi', measure:'overdue', w:4 }, { id:'c3', src:'learn', type:'kpi', measure:'notStarted', w:4 }, { id:'c4', src:'learn', type:'stack', dim:'subDivision', measure:'assignments', w:12, title:'Status by sub division', pick:true }, { id:'c5', src:'learn', type:'rank', measure:'overdue', dim:'site', w:6 }, { id:'c6', src:'learn', type:'rank', measure:'overdue', dim:'course', w:6 }] }],
  cur:'b1', slicers:{ division:'All', sub:'All', course:'All', training:'All', location:'All', from:'', to:'' }, edit:false };

const Dash = (() => {
  const caches = new Map();
  const blank = () => ({ assignments:0, completed:0, inProgress:0, overdue:0, notStarted:0, modules:0, scoreSum:0, scoreN:0, learners:new Set() });
  /* Learning: one pass over assignments (only the course's assignees when a course is chosen). */
  function learn(s, sl, course) {
    const ck = 'L|' + [sl.division, sl.sub, sl.location, sl.from, sl.to, course].join('|'), deps = [s.enroll, s.itemDone, s.users, s.adminCourses];
    const hit = caches.get(ck); if (hit && hit.deps.every((x, i) => x === deps[i])) return hit.v;
    const T = {}, tot = blank(), heat = new Map();
    const add = (dim, k) => { const d = T[dim] || (T[dim] = new Map()); let r = d.get(k); if (!r) d.set(k, r = blank()); return r; };
    const uOk = u => u && u.status !== 'Deactivated' && (sl.division === 'All' || u.division === sl.division) && (sl.sub === 'All' || u.subDivision === sl.sub) && (sl.location === 'All' || u.site === sl.location);
    const visit = (u, cid, due) => { const a = Progress.courseOf(s, cid); if (!a) return; const r = (s.itemDone[u.name] || {})[cid], n = a.items.length; let dn = 0, last = '', sc = 0, scn = 0;
      if (r) for (const i in r) { dn++; const v = r[i], at = typeof v === 'string' ? v : v.at; if (at > last) last = at; if (v && typeof v === 'object' && v.score != null) { sc += v.score; scn++; } }
      const done = n && dn >= n;
      if (sl.from || sl.to) { const on = Progress.assignedOn(s, u.name, cid) || due, inR = d => d && (!sl.from || d >= sl.from) && (!sl.to || d <= sl.to); if (!inR(on) && !(done && inR(last))) return; }
      const st = done ? 'Completed' : due < TODAY_KEY ? 'Overdue' : dn ? 'In progress' : 'Not started', fk = { Completed:'completed', Overdue:'overdue', 'In progress':'inProgress', 'Not started':'notStarted' }[st];
      const dims = { division: u.division || 'Unassigned', subDivision: u.subDivision || 'Unassigned', dept: u.dept || 'Unassigned', category: a.cat || 'Other', site: u.site || '—', status: st, role: u.role, course: a.code + ' · ' + a.title };
      for (const d in dims) { const row = add(d, dims[d]); row.assignments++; row[fk]++; row.modules += dn; row.scoreSum += sc; row.scoreN += scn; row.learners.add(u.name); }
      if (done && last) { const row = add('month', last.slice(0, 7)); row.completed++; row.assignments++; row.learners.add(u.name); }
      tot.assignments++; tot[fk]++; tot.modules += dn; tot.scoreSum += sc; tot.scoreN += scn; tot.learners.add(u.name);
      const hk = dims.division + '|' + dims.category, h = heat.get(hk) || { n:0, c:0 }; h.n++; if (done) h.c++; heat.set(hk, h); };
    const ub = Feedback.userIndex(s.users);
    if (course && course !== 'All') Feedback.assignees(s.enroll, course).forEach(n => { const u = ub.get(n); if (uOk(u)) visit(u, course, s.enroll[n][course]); });
    else s.users.forEach(u => { if (!uOk(u)) return; const en = s.enroll[u.name]; if (en) for (const cid in en) visit(u, cid, en[cid]); });
    const v = { T, tot, heat, rows: null }; caches.set(ck, { deps, v }); return v;
  }
  const tBlank = () => ({ dlSum:0, dlN:0, joined:0, classDone:0, vol:0, earlyLeft:0, participants:0, unique:new Set(), handover:0, earlyAbsorb:0, inTraining:0, attrited:0, noshow:0, tatSum:0, tatN:0, batches:new Set() });
  const weeks = (a, b) => Math.max(0, Math.ceil((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 6048e5));
  /* Training: one pass over the MIS rows. */
  function train(s, sl) {
    const ck = 'T|' + [sl.division, sl.sub, sl.training, sl.location, sl.from, sl.to].join('|'), recs = Mis.records(s), deps = [recs];
    const hit = caches.get(ck); if (hit && hit.deps.every((x, i) => x === deps[i])) return hit.v;
    const T = {}, tot = tBlank(), tat = new Map(), heat = new Map(), list = [];
    const add = (dim, k) => { const d = T[dim] || (T[dim] = new Map()); let r = d.get(k); if (!r) d.set(k, r = tBlank()); return r; };
    recs.forEach(x => { if ((sl.division !== 'All' && x.division !== sl.division) || (sl.sub !== 'All' && x.subDivision !== sl.sub) || (sl.training !== 'All' && x.training !== sl.training) || (sl.location !== 'All' && x.location !== sl.location) || (sl.from && x.cs < sl.from) || (sl.to && x.cs > sl.to)) return;
      list.push(x);
      const ho = x.group === 'handover', w = ho && x.doj && x.handover ? weeks(x.doj, x.handover) : null;
      const att = x.group === 'attrited', stageA = !att ? null : x.statusType === 'noshow' ? 'Did not join' : x.dol && x.dol <= x.ce ? 'During classroom' : 'During OJT';
      const dims = { attrMonth: att && x.dol ? x.dol.slice(0, 7) : null, reason: att ? (x.reason || 'Not recorded') : null, attrCat: att ? (x.attrCat || 'Not recorded') : null, attrResp: att ? (x.attrResp || 'Not recorded') : null, attrStage: stageA,
        segment: x.segment, training: x.training, month: x.monthKey, location: x.location || '—', brand: x.brand || '—', traineeType: x.traineeType, status: x.status, group: STATUS_GROUPS[x.group].label, subDivision: x.subDivision || '—', division: x.division || '—', trainer: x.trainer, batch: x.batch };
      const passed = ho || ['ojt', 'failed'].includes(x.statusType) || (x.group !== 'attrited' && !['noshow', 'moved'].includes(x.statusType) && x.ce < TODAY_KEY);
      const early = x.group === 'attrited' && (x.statusType === 'noshow' || (x.dol && x.dol <= x.ce));
      const dl = x.group === 'attrited' && x.dol && x.cs ? Math.max(0, Math.round((new Date(x.dol + 'T12:00:00') - new Date(x.cs + 'T12:00:00')) / 864e5)) : null;
      const bump = r => { if (dl != null) { r.dlSum += dl; r.dlN++; } if (x.statusType !== 'noshow') r.joined++; if (passed) r.classDone++; if (early) r.earlyLeft++; if (x.group === 'attrited' && x.attrCat === 'Voluntary') r.vol++; r.participants++; r.unique.add(x.empId || x.name); r.batches.add(x.batch); if (ho) r.handover++; if (x.statusType === 'absorbed' && x.earlyAbsorb) r.earlyAbsorb++; if (x.group === 'training') r.inTraining++; if (x.group === 'attrited') r.attrited++; if (x.statusType === 'noshow') r.noshow++; if (w != null) { r.tatSum += w; r.tatN++; } };
      for (const d in dims) if (dims[d] != null) bump(add(d, dims[d])); bump(tot);
      if (w != null) { const bk = TAT_BUCKETS.find(b => w >= b[1] && w <= b[2])[0], rk = x.subDivision || '—'; const m = tat.get(rk) || {}; m[bk] = (m[bk] || 0) + 1; tat.set(rk, m); }
      const hk = (x.subDivision || '—') + '|' + x.segment, h = heat.get(hk) || { n:0, c:0 }; h.n++; if (ho) h.c++; heat.set(hk, h); });
    const v = { T, tot, tat, heat, list }; caches.set(ck, { deps, v }); return v;
  }
  const measure = (src, row, m) => { if (!row) return 0;
    if (src === 'train') return m === 'unique' ? row.unique.size : m === 'batches' ? row.batches.size : m === 'throughput' ? (row.participants - row.noshow ? Math.round(row.handover / (row.participants - row.noshow) * 1000) / 10 : 0)
      : m === 'daysToLeave' ? (row.dlN ? Math.round(row.dlSum / row.dlN * 10) / 10 : 0) : m === 'volShare' ? (row.attrited ? Math.round(row.vol / row.attrited * 1000) / 10 : 0) : m === 'attritionRate' ? (row.participants - row.noshow ? Math.round(row.attrited / (row.participants - row.noshow) * 1000) / 10 : 0) : m === 'avgTat' ? (row.tatN ? Math.round(row.tatSum / row.tatN * 10) / 10 : 0) : row[m] || 0;
    return m === 'completionRate' ? (row.assignments ? Math.round(row.completed / row.assignments * 1000) / 10 : 0) : m === 'overdueRate' ? (row.assignments ? Math.round(row.overdue / row.assignments * 1000) / 10 : 0)
      : m === 'learners' ? row.learners.size : m === 'avgScore' ? (row.scoreN ? Math.round(row.scoreSum / row.scoreN * 10) / 10 : 0) : row[m] || 0; };
  return { learn, train, measure, weeks };
})();

SkillforgeApp.prototype.amDashboard = function (c) {
  const { s, INK, W } = c;
  const scr = this._scrV;
  if (scr !== 'dashboard' && scr !== 'training') return { isDash:false };
  // Training overview & MIS uses the two training boards; Analytics dashboards shows everything else.
  const isTr = scr === 'training', TRB = ['mis', 'attr'], trTab = s.trTab || 'overview';
  const D = s.dash, SL = D.slicers, myBoards = D.boards.filter(b => isTr ? TRB.includes(b.id) : !TRB.includes(b.id));
  const curId = isTr ? (trTab === 'attrition' ? 'attr' : 'mis') : (myBoards.some(b => b.id === s.dbBoard) ? s.dbBoard : (myBoards[0] || D.boards[0]).id);
  const B = D.boards.find(b => b.id === curId) || D.boards[0];
  const setD = fn => this.setState(st => { const d = JSON.parse(JSON.stringify(st.dash)); fn(d, d.boards.find(b => b.id === (st.dbBoard || d.cur)) || d.boards[0]); return { dash: d }; });
  const t0 = performance.now();
  const fmtV = (src, m, v) => { const k = DB_MEASURES[src][m][1]; return k === 'pct' ? v.toFixed(1).replace(/\.0$/, '') + '%' : k === 'dec' ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'); };
  const monthLabel = k => /^\d{4}-\d{2}$/.test(k) ? new Date(k + '-15T12:00:00').toLocaleDateString('en-US', { month:'short', year:'2-digit' }).replace(' ', " '") : k;
  const statusColor = name => { const st = s.statuses.find(x => x.name === name); return st ? STATUS_TYPES[st.type].bar : { Completed:'#3E8E7E', 'In progress':'#5B7DB8', 'Not started':'#C9BBA8', Overdue:'#E8664A' }[name] || '#1F4E79'; };
  const pubCourses = s.adminCourses.filter(a => a.status === 'Published');
  const courseOpts = [{ v:'All', l:'All courses' }].concat(pubCourses.slice().sort((a, b) => a.code.localeCompare(b.code)).map(a => ({ v: a.id, l: a.code + ' · ' + a.title })));
  const cubeOf = v => v.src === 'train' ? Dash.train(s, SL) : Dash.learn(s, SL, v.course && v.course !== 'All' ? v.course : SL.course);
  const rowsOf = (v, C, dim, m) => { const map = C.T[dim]; if (!map) return []; let r = [...map.entries()].map(([k, row]) => ({ k, v: Dash.measure(v.src, row, m), row }));
    if (dim === 'month' || dim === 'attrMonth') r = r.sort((a, b) => a.k.localeCompare(b.k)).slice(-12); else if (dim === 'status' && v.src === 'learn') { const O = ['Completed', 'In progress', 'Not started', 'Overdue']; r.sort((a, b) => O.indexOf(a.k) - O.indexOf(b.k)); }
    else if (dim === 'status') { const O = s.statuses.map(x => x.name); r.sort((a, b) => O.indexOf(a.k) - O.indexOf(b.k)); } else r.sort((a, b) => b.v - a.v);
    return dim === 'course' ? r.slice(0, 10) : v.type === 'table' ? r.slice(0, 60) : r.slice(0, 16); };
  const lab = (dim, k) => dim === 'month' || dim === 'attrMonth' ? monthLabel(k) : k;
  const visual = (v, idx) => {
    v = { src:'learn', ...v };
    const T = DB_TYPES[v.type], MS = DB_MEASURES[v.src], DS = DB_DIMS[v.src], m = MS[v.measure] ? v.measure : Object.keys(MS)[0], dim = DS[v.dim] ? v.dim : Object.keys(DS)[0];
    const autoTitle = v.type === 'kpi' ? MS[m][0] : v.type === 'matrix' ? 'Handover TAT by ' + DS[dim].toLowerCase() : v.type === 'batches' ? 'Batch tracker' : v.type === 'heat' ? (v.src === 'train' ? 'Throughput % · sub division × segment' : 'Completion % · division × category') : MS[m][0] + ' by ' + DS[dim].toLowerCase();
    const C = cubeOf(v), selCourse = v.course || 'All';
    const base = { id: v.id, title: v.title || autoTitle, span: 'span ' + v.w, srcLabel: v.src === 'train' ? 'Training' : 'Learning', editing: D.edit, open: s.dbEdit === v.id, hasDim: T[2], isLearn: v.src === 'learn',
      isKpi:false, isFunnel:false, isRank:false, isBar:false, isCol:false, isLine:false, isDonut:false, isStack:false, isHeat:false, isTable:false, isMatrix:false, isBatches:false,
      showPick: v.src === 'learn' && !!v.pick && v.type !== 'heat', courseOpts, courseVal: selCourse, setCourse: e => { const x = e.target.value; setD((d, b) => { b.visuals[idx].course = x; }); },
      courseLabel: selCourse !== 'All' ? ((pubCourses.find(a => a.id === selCourse) || {}).title || '') : '',
      srcOpts: Object.keys(DB_SRC).map(k => ({ v:k, l: DB_SRC[k] })), srcVal: v.src, setSrc: e => { const x = e.target.value; setD((d, b) => { const vv = b.visuals[idx]; vv.src = x; vv.measure = Object.keys(DB_MEASURES[x])[0]; vv.dim = Object.keys(DB_DIMS[x])[0]; delete vv.title; }); },
      measureOpts: Object.keys(MS).map(k => ({ v:k, l: MS[k][0] })), dimOpts: Object.keys(DS).map(k => ({ v:k, l: DS[k] })), m, dim, pickTog: UI.toggle(!!v.pick, () => setD((d, b) => { b.visuals[idx].pick = !b.visuals[idx].pick; })),
      setM: e => { const x = e.target.value; setD((d, b) => { b.visuals[idx].measure = x; delete b.visuals[idx].title; }); }, setDim: e => { const x = e.target.value; setD((d, b) => { b.visuals[idx].dim = x; delete b.visuals[idx].title; }); },
      sizes: [[2, '⅙'], [3, '¼'], [4, '⅓'], [6, '½'], [8, '⅔'], [12, 'Full']].map(([w, l]) => UI.chip(v.w, w, l, () => setD((d, b) => { b.visuals[idx].w = w; }))),
      types: Object.keys(DB_TYPES).filter(k => v.src === 'train' || !['matrix', 'batches', 'funnel'].includes(k)).map(k => UI.chip(v.type, k, DB_TYPES[k][0], () => setD((d, b) => { b.visuals[idx].type = k; delete b.visuals[idx].title; if (k === 'line') b.visuals[idx].dim = 'month'; }))),
      gear: () => this.setState({ dbEdit: s.dbEdit === v.id ? null : v.id }), remove: () => { setD((d, b) => { b.visuals.splice(idx, 1); }); this.setState({ dbEdit:null }); },
      left: () => setD((d, b) => { if (idx > 0) { const x = b.visuals.splice(idx, 1)[0]; b.visuals.splice(idx - 1, 0, x); } }), right: () => setD((d, b) => { if (idx < b.visuals.length - 1) { const x = b.visuals.splice(idx, 1)[0]; b.visuals.splice(idx + 1, 0, x); } }),
      setTitle: e => { const x = e.target.value; setD((d, b) => { b.visuals[idx].title = x; }); }, titleVal: v.title || '' };
    if (v.type === 'kpi') { const val = Dash.measure(v.src, C.tot, m), t = C.tot;
      const sub = v.src === 'train' ? (m === 'daysToLeave' ? 'from batch start to last day' : m === 'volShare' ? t.vol + ' of ' + t.attrited + ' chose to leave' : m === 'earlyLeft' ? 'did not join or left during classroom' : m === 'attrited' ? (t.participants - t.noshow ? (t.attrited / (t.participants - t.noshow) * 100).toFixed(1) + '% of people who joined' : '') : m === 'throughput' ? t.handover.toLocaleString('en-US') + ' handed over of ' + (t.participants - t.noshow).toLocaleString('en-US') + ' who joined' : m === 'attritionRate' ? t.attrited + ' left during training' : m === 'participants' ? t.batches.size + ' batches' : m === 'inTraining' ? 'classroom or on-the-job now' : m === 'unique' ? 'people across all trainings' : '')
        : m === 'completionRate' ? t.completed.toLocaleString('en-US') + ' of ' + t.assignments.toLocaleString('en-US') + ' assignments' : m === 'overdue' ? (t.assignments ? (t.overdue / t.assignments * 100).toFixed(1) + '% of assignments' : '') : m === 'learners' ? 'with at least one assignment' : '';
      // Trend vs the previous month (training KPIs: by batch start month; attrition: by leaving month).
      // Change vs the previous month, using the last two complete months.
      let delta = '', dGood = true;
      if (v.src === 'train' && !['inTraining', 'unique'].includes(m)) { const dm = ['attrited', 'daysToLeave'].includes(m) && C.T.attrMonth ? C.T.attrMonth : C.T.month;
        const mk = dm ? [...dm.keys()].filter(k => k < TODAY_KEY.slice(0, 7)).sort() : [], cur = mk[mk.length - 1], prv = mk[mk.length - 2];
        if (cur && prv) { const a = Dash.measure('train', dm.get(cur), m), b0 = Dash.measure('train', dm.get(prv), m), d = a - b0;
          dGood = ['attrited', 'attritionRate', 'daysToLeave'].includes(m) ? (m === 'daysToLeave' ? d >= 0 : d <= 0) : d >= 0;
          if (m === 'volShare') dGood = null;
          delta = (d > 0 ? '▲ ' : d < 0 ? '▼ ' : '● ') + fmtV('train', m, Math.abs(d)) + '  ' + monthLabel(cur) + ' vs ' + monthLabel(prv); } }
      const KI = { participants:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', inTraining:'M22 10 12 5 2 10l10 5 10-5zM6 12v5c3 3 9 3 12 0v-5', handover:'M5 12l5 5 9-10', throughput:'M3 17l6-6 4 4 8-8M14 7h7v7', attrited:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM18 8l5 5M23 8l-5 5', attritionRate:'M3 7l6 6 4-4 8 8M14 17h7v-7', volShare:'M12 2a10 10 0 1 0 10 10H12z', earlyLeft:'M12 8v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z' };
      const KC = ['#F2A93B', '#3E8E7E', '#5B7DB8', '#8C5A9E', '#E8664A', '#14B8A6'][idx % 6];
      return { ...base, isKpi:true, kIcon: KI[m] || 'M3 3v18h18M7 14l4-4 3 3 5-6', kTint: KC + '1F', kv: fmtV(v.src, m, val), ksub: sub, kc: KC, kDelta: delta, kHasDelta: !!delta, kDc: dGood === null ? '#75655A' : dGood ? '#166534' : '#B91C1C' }; }
    if (v.type === 'heat') { const rowsK = [...new Set([...C.heat.keys()].map(k => k.split('|')[0]))].sort(), colsK = [...new Set([...C.heat.keys()].map(k => k.split('|')[1]))].sort();
      return { ...base, isHeat:true, hCols: 'minmax(140px,1.2fr) repeat(' + colsK.length + ', minmax(70px,1fr))', hHead: colsK.map(x => ({ t: x })), hRows: rowsK.map(rk => ({ t: rk, cells: colsK.map(ck => { const h = C.heat.get(rk + '|' + ck); if (!h) return { t:'—', bg:'#FBF7F0', fg:'#A89A8B', tip:'' }; const p = h.c / h.n * 100;
        return { t: p.toFixed(0) + '%', bg: 'rgba(31,78,121,' + (0.08 + p / 100 * 0.8).toFixed(2) + ')', fg: p > 55 ? '#FFFFFF' : '#2B2118', tip: rk + ' · ' + ck + ': ' + h.c + ' of ' + h.n }; }) })) }; }
    if (v.type === 'matrix') { const rowsK = [...C.tat.keys()].sort(), cols = TAT_BUCKETS.filter(b => rowsK.some(r => (C.tat.get(r) || {})[b[0]])), tot = {};
      const mRows = rowsK.map(r => { const m0 = C.tat.get(r); let t = 0; const cells = cols.map(b => { const n = m0[b[0]] || 0; t += n; tot[b[0]] = (tot[b[0]] || 0) + n; return { t: n || '' }; }); return { t: r, cells, total: t }; });
      return { ...base, isMatrix:true, mxHead: cols.map(b => ({ t: b[0] })), mxRows: mRows, mxTot: cols.map(b => ({ t: tot[b[0]] || '' })), mxGrand: mRows.reduce((a, r) => a + r.total, 0), mxCols: 'minmax(150px,1.6fr) repeat(' + (cols.length + 1) + ', minmax(52px,.6fr))' }; }
    if (v.type === 'batches') {
      const by = new Map(); C.list.forEach(x => { let g = by.get(x.batchId); if (!g) by.set(x.batchId, g = { n:0, tr:0, ho:0, at:0, oth:0, ns:0 }); g.n++; if (x.group === 'training') g.tr++; else if (x.group === 'handover') g.ho++; else if (x.group === 'attrited') g.at++; else g.oth++; if (x.statusType === 'noshow') g.ns++; });
      const stageOf = b => { const st = batchStatus(b); if (st === 'Ongoing') { const tt = s.ttypes.find(t => t.id === b.type), dts = tt ? trainDays(b.start, tt.days.length, holSetFor(s.holidays, b)) : []; return ['Classroom · day ' + Math.max(1, dts.filter(d => d <= TODAY_KEY).length) + ' of ' + dts.length, 1]; }
        if (st === 'Upcoming') return ['Starts ' + Fmt.short(b.start), 4]; if (st === 'Completed') return ['Completed', 5]; return TODAY_KEY < (b.handover || b.end) ? ['On the job training', 2] : ['Awaiting closure', 3]; };
      const STC = { 1:['#DBEAFE', '#1E40AF'], 2:['#EDE9FE', '#5B21B6'], 3:['#FEF3C7', '#92400E'], 4:['#F5EEE3', '#75655A'], 5:['#DCFCE7', '#166534'] };
      let rows = s.batches.filter(b => by.has(b.id) || (batchStatus(b) === 'Upcoming' && (SL.training === 'All' || b.trainingName === SL.training))).map(b => { const g = by.get(b.id) || { n: b.trainees.length, tr: b.trainees.length, ho:0, at:0, oth:0, ns:0 }, [stage, ord] = stageOf(b), tt = s.ttypes.find(t => t.id === b.type) || {};
        const grad = b.handover || (b.end ? (() => { let d = b.end, k = 0; while (k < (tt.ojtDays || 5) + 1) { d = Progress.plus(d, 1); const w = new Date(d + 'T12:00:00').getDay(); if (w && w !== 6) k++; } return d; })() : '');
        return { ord, code: b.code, training: b.trainingName || tt.name || '', trainer: b.trainer, stage, sBg: STC[ord][0], sFg: STC[ord][1], n: g.n, tr: g.tr, ho: g.ho, at: g.at, oth: g.oth, grad: grad ? Fmt.medium(grad) : '—', gradKey: grad,
          thr: g.n - g.ns ? Math.round(g.ho / (g.n - g.ns) * 100) + '%' : '—', bar: [['#5B7DB8', g.tr], ['#3E8E7E', g.ho], ['#E8664A', g.at], ['#C9BBA8', g.oth]].map(([c2, k]) => ({ c: c2, w: g.n ? (k / g.n * 100).toFixed(1) + '%' : '0%' })), open: () => this.go('batch', { batchId: b.id, bTab:'summary', adminView:true }) }; });
      const act = v.active !== false, allN = rows.length; if (act) rows = rows.filter(r => r.ord <= 4);
      rows.sort((a, b) => a.ord - b.ord || (a.gradKey || '').localeCompare(b.gradKey || ''));
      const sum = k => rows.reduce((t, r) => t + r[k], 0);
      const allOn = (s.dbAll || {})[v.id], lim = allOn ? 60 : 8;
      return { ...base, isBatches:true, btRows: rows.slice(0, lim), btMoreN: rows.length > lim, btMoreL: allOn ? 'Showing the first 60 · narrow with the filters' : 'Show all ' + rows.length + ' batches', btLess: !!allOn, btToggleAll: () => this.setState(st => ({ dbAll: { ...(st.dbAll || {}), [v.id]: !allOn } })), btMore:'', btEmpty: !rows.length,
        btTot: { n: sum('n'), tr: sum('tr'), ho: sum('ho'), at: sum('at') }, btActive: UI.toggle(act, () => setD((d, b) => { b.visuals[idx].active = !act; })), btActLabel: act ? 'Active and upcoming batches (' + rows.length + ')' : 'All batches (' + allN + ')' }; }
    const R = rowsOf(v, C, dim, m), mx = Math.max(1, ...R.map(x => x.v));
    const colorOf = (x, i) => dim === 'status' ? statusColor(x.k) : v.src === 'train' && ['brand', 'traineeType', 'location'].includes(dim) ? DB_COLORS[i % DB_COLORS.length] : DB_COLORS[idx % DB_COLORS.length];
    if (v.type === 'funnel') { const t = C.tot, st = [['Mapped to a batch', t.participants, '#C9BBA8'], ['Joined', t.joined, '#F2A93B'], ['Completed classroom', t.classDone, '#5B7DB8'], ['Handed over', t.handover, '#3E8E7E']];
      return { ...base, isFunnel:true, fun: st.map(([l, n, c2], i) => ({ l, n: n.toLocaleString('en-US'), w: (t.participants ? Math.max(4, n / t.participants * 100) : 0).toFixed(1) + '%', c: c2,
        conv: i ? (st[i - 1][1] ? Math.round(n / st[i - 1][1] * 100) + '% of previous step' : '—') : 'Starting point', drop: i && st[i - 1][1] - n > 0 ? '−' + (st[i - 1][1] - n).toLocaleString('en-US') : '' })) }; }
    if (v.type === 'rank') { const R2 = rowsOf({ ...v, type:'bar' }, C, dim, m).slice(0, 8), tot = R2.reduce((a, x) => a + x.v, 0) || 1, mx2 = Math.max(1, ...R2.map(x => x.v)), pct = MS[m][1] !== 'n';
      return { ...base, isRank:true, ranks: R2.map((x, i) => ({ n: i + 1, l: lab(dim, x.k), v: fmtV(v.src, m, x.v), w: (x.v / mx2 * 100).toFixed(1) + '%', share: pct ? '' : (x.v / tot * 100).toFixed(0) + '%', c: i === 0 ? '#F2A93B' : i < 3 ? '#E8B24F' : '#E8D3A8' })) }; }
    if (v.type === 'bar') return { ...base, isBar:true, bars: R.map((x, i) => ({ l: lab(dim, x.k), v: fmtV(v.src, m, x.v), w: (x.v / mx * 100).toFixed(1) + '%', c: colorOf(x, i) })) };
    if (v.type === 'column') return { ...base, isCol:true, cols: R.map((x, i) => ({ l: lab(dim, x.k), v: fmtV(v.src, m, x.v), h: Math.max(2, x.v / mx * 100).toFixed(1) + '%', c: colorOf(x, i) })) };
    if (v.type === 'line') { const m2 = v.measure2 && MS[v.measure2] ? v.measure2 : null, R2b = m2 ? R.map(x => ({ k: x.k, v: Dash.measure(v.src, x.row, m2) })) : [], mxL = Math.max(mx, ...R2b.map(x => x.v), 1);
      const W0 = 600, H0 = 180, n = R.length, X = i => n < 2 ? W0 / 2 : 30 + i * (W0 - 60) / (n - 1), Y = val => H0 - 12 - (val / mxL) * (H0 - 30), pts = R.map((x, i) => [X(i), Y(x.v)]);
      const pts2 = R2b.map((x, i) => [X(i), Y(x.v)]), path2 = pts2.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      return { ...base, isLine:true, lPath: pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), lArea: n ? pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ') + ' L' + pts[n - 1][0].toFixed(1) + ' ' + H0 + ' L' + pts[0][0].toFixed(1) + ' ' + H0 + ' Z' : '',
        lPts: pts.map((p, i) => ({ x: p[0].toFixed(1), y: p[1].toFixed(1), pct: (p[0] / 600 * 100).toFixed(2) + '%', l: lab(dim, R[i].k), v: fmtV(v.src, m, R[i].v) + (m2 ? ' / ' + fmtV(v.src, m2, R2b[i].v) : '') })), lc:'#F2A93B',
        has2: !!m2, l2Path: path2, l2c:'#3E8E7E', lLeg: m2 ? [{ c:'#F2A93B', t: MS[m][0] }, { c:'#3E8E7E', t: MS[m2][0] }] : [] }; }
    if (v.type === 'donut') { const total = R.reduce((t, x) => t + x.v, 0) || 1, Cc = 2 * Math.PI * 54; let acc = 0;
      return { ...base, isDonut:true, dTotal: fmtV(v.src, m, MS[m][1] === 'n' ? total : Dash.measure(v.src, C.tot, m)), slices: R.slice(0, 8).map((x, i) => { const f = x.v / total, seg = { c: dim === 'status' ? statusColor(x.k) : DB_COLORS[i % DB_COLORS.length], dash: (f * Cc).toFixed(2) + ' ' + Cc.toFixed(2), off: (-acc * Cc).toFixed(2), l: lab(dim, x.k), v: fmtV(v.src, m, x.v), p: (f * 100).toFixed(1) + '%' }; acc += f; return seg; }) }; }
    if (v.type === 'stack') { const R2 = rowsOf({ ...v, type:'bar' }, C, dim, v.src === 'train' ? 'participants' : 'assignments');
      const parts = v.src === 'train' ? [['In training', 'inTraining', '#5B7DB8'], ['Handed over', 'handover', '#3E8E7E'], ['Attrited', 'attrited', '#E8664A']] : [['Completed', 'completed', '#3E8E7E'], ['In progress', 'inProgress', '#5B7DB8'], ['Not started', 'notStarted', '#C9BBA8'], ['Overdue', 'overdue', '#E8664A']];
      return { ...base, isStack:true, stacks: R2.map(x => { const r = x.row, t = (v.src === 'train' ? r.participants : r.assignments) || 1; return { l: lab(dim, x.k), n: t.toLocaleString('en-US'), parts: parts.map(([k, f, c2]) => ({ w: (r[f] / t * 100).toFixed(2) + '%', c: c2, t: k + ': ' + r[f].toLocaleString('en-US') })) }; }), legend: parts.map(([k, , c2]) => ({ k, c: c2 })) }; }
    if (v.type === 'table') { const R2 = rowsOf(v, C, dim, m);
      const head = v.src === 'train' ? (dim === 'month' ? ['Month', 'Total participants', 'Unique trainees'] : [DS[dim], 'Total participants', 'Handed over', 'Throughput']) : [DS[dim], 'Assignments', 'Completed', 'Completion', 'Overdue', 'Learners'];
      const cell = x => v.src === 'train' ? (dim === 'month' ? [lab(dim, x.k), x.row.participants, x.row.unique.size] : [x.k, x.row.participants, x.row.handover, fmtV('train', 'throughput', Dash.measure('train', x.row, 'throughput'))])
        : [lab(dim, x.k), x.row.assignments, x.row.completed, fmtV('learn', 'completionRate', Dash.measure('learn', x.row, 'completionRate')), x.row.overdue, x.row.learners.size];
      const t = C.tot, totRow = v.src === 'train' ? (dim === 'month' ? ['Total', t.participants, t.unique.size] : ['Total', t.participants, t.handover, fmtV('train', 'throughput', Dash.measure('train', t, 'throughput'))]) : ['Total', t.assignments, t.completed, fmtV('learn', 'completionRate', Dash.measure('learn', t, 'completionRate')), t.overdue, t.learners.size];
      const f = x => typeof x === 'number' ? x.toLocaleString('en-US') : x;
      return { ...base, isTable:true, tHead: head, tCols: 'minmax(140px,2fr) ' + 'minmax(70px,1fr) '.repeat(head.length - 1), tRows: R2.map(x => ({ c: cell(x).map((y, i) => ({ t: f(y), a: i ? 'right' : 'left' })) })), tTot: totRow.map((y, i) => ({ t: f(y), a: i ? 'right' : 'left' })), tHeadC: head.map((y, i) => ({ t: y, a: i ? 'right' : 'left' })) }; }
    return base;
  };
  const opts = (all, list) => [{ v:'All', l: all }].concat(list.map(x => ({ v:x, l:x })));
  const setSl = k => e => this.setState({ dash: { ...D, slicers: { ...SL, [k]: e.target.value } } });
  const vis = B.visuals.map(visual), ms = Math.round(performance.now() - t0);
  const hasL = B.visuals.some(v => (v.src || 'learn') === 'learn'), hasT = B.visuals.some(v => v.src === 'train');
  return {
    ...(isTr ? this.trainingMis(c, Dash.train(s, SL), SL) : { isTraining:false }), isTr, notTr: !isTr, trShowBoard: !isTr || trTab === 'overview' || trTab === 'attrition',
    trTabs: [['overview', 'Overview'], ['mis', 'MIS'], ['attrition', 'Attrition'], ['trainees', 'Batches & trainees']].map(([k, l]) => ({ on: trTab === k, label: l, pick: () => { if (D.edit) return this.toastMsg('Save or Cancel your changes first'); this.setState({ trTab: k, dbEdit:null }); } })),
    isDash:true, dbBoards: myBoards.map(b => ({ on: b.id === B.id, ...UI.chip(B.id, b.id, b.name, () => { if (D.edit) return this.toastMsg('Save or Cancel your changes first'); this.setState({ dbBoard: b.id, dbEdit:null }); }) })),
    dbVisuals: vis, dbEmpty: !B.visuals.length, dbEditing: D.edit, dbNotEditing: !D.edit, dbCalc: 'Updated in ' + ms + ' ms', dbTitle: isTr ? 'Training overview & MIS' : B.name,
    // Customise works on a draft: Save keeps it, Cancel restores exactly what was there before (including removing a
    // dashboard that was just created).
    dbToggleEdit: () => this.setState({ dash: { ...D, edit: true }, dbEdit:null, dbSnap: { dash: JSON.stringify({ ...D, edit:false }), board: B.id } }),
    dbSave: () => { const nm = (B.name || '').trim(); if (!nm) return this.toastMsg('Give the dashboard a name');
      if (D.boards.some(b => b.id !== B.id && b.name.trim().toLowerCase() === nm.toLowerCase())) return this.toastMsg('Another dashboard is already called “' + nm + '”');
      if (!B.visuals.length) return this.toastMsg('Add at least one visual, or Cancel');
      this.setState({ dash: { ...D, edit:false }, dbEdit:null, dbSnap:null }); this.toastMsg('“' + nm + '” saved'); },
    dbCancel: () => { const sn = s.dbSnap; this.setState({ dash: sn ? JSON.parse(sn.dash) : { ...D, edit:false }, dbBoard: sn ? sn.board : B.id, dbEdit:null, dbSnap:null }); this.toastMsg('Changes discarded'); },
    dbDirty: !!s.dbSnap && JSON.stringify({ ...D, edit:false }) !== s.dbSnap.dash,
    dbSl: SL, setDbDiv: setSl('division'), setDbSub: setSl('sub'), setDbCourse: setSl('course'), setDbTraining: setSl('training'), setDbLoc: setSl('location'), setDbFrom: setSl('from'), setDbTo: setSl('to'),
    dbDivOpts: opts('All divisions', s.masters.divisions), dbSubOpts: opts('All sub divisions', SL.division === 'All' ? s.masters.subDivisions : s.masters.subDivisions.filter(x => SUBDIV_OF[x] === SL.division || !SUBDIV_OF[x])),
    dbHasTnotTr: !isTr && hasT, dbCourseOpts: courseOpts, dbTrOpts: opts('All trainings', s.masters.trainingNames), dbLocOpts: opts('All locations', s.masters.locations), dbHasL: hasL, dbHasT: hasT,
    dbPresets: [['This month', TODAY_KEY.slice(0, 8) + '01', TODAY_KEY], ['Last 90 days', Progress.plus(TODAY_KEY, -90), TODAY_KEY], ['This year', TODAY_KEY.slice(0, 4) + '-01-01', TODAY_KEY], ['All time', '', '']].map(([l, f, t]) => ({ l, pick: () => this.setState({ dash: { ...D, slicers: { ...SL, from: f, to: t } } }) })),
    dbBadRange: !!(SL.from && SL.to && SL.from > SL.to),
    dbClearSl: () => this.setState({ dash: { ...D, slicers: { division:'All', sub:'All', course:'All', training:'All', location:'All', from:'', to:'' } } }), dbHasSl: Object.entries(SL).some(([k, x]) => x && x !== 'All'),
    dbGallery: [].concat(...Object.keys(DB_SRC).map(src => Object.keys(DB_TYPES).filter(k => src === 'train' || !['matrix', 'batches', 'funnel'].includes(k)).map(k => ({ k, src, srcL: src === 'train' ? 'Training' : 'Learning', l: DB_TYPES[k][0], d: DB_TYPES[k][1],
      add: () => { const id = 'v' + Date.now(); setD((d, b) => { b.visuals.push({ id, src, type: k, measure: k === 'kpi' ? (src === 'train' ? 'throughput' : 'completionRate') : Object.keys(DB_MEASURES[src])[0], dim: k === 'line' ? 'month' : src === 'train' ? 'training' : 'subDivision', w: k === 'kpi' ? 3 : ['heat', 'table', 'batches'].includes(k) ? 12 : 6, pick: src === 'learn' && k !== 'heat' }); }); this.setState({ dbEdit: id }); this.toastMsg(DB_TYPES[k][0] + ' added'); } })))),
    dbDelAsk: !!s.dbDelAsk, dbDelNo: () => this.setState({ dbDelAsk:false }),
    dbName: B.name, setDbName: e => { const x = e.target.value; setD((d, b) => { b.name = x; }); },
    // + New opens a small pop-up (name + start from blank / MIS / copy of this one) with Cancel.
    dbNewBoard: () => this.setState({ dbNew: { name:'', from:'blank', err:'' } }),
    dbNewOpen: !!s.dbNew, dbN: s.dbNew || {}, dbNErr: !!(s.dbNew && s.dbNew.err),
    setDbNName: e => { const x = e.target.value; this.setState(st => ({ dbNew: { ...st.dbNew, name: x, err:'' } })); },
    dbNFrom: [['blank', 'Blank'], ['mis', 'Training overview template'], ['attr', 'Attrition template'], ['learn', 'Learning overview template'], ['copy', 'Copy of “' + B.name + '”']].map(([k, l]) => UI.chip((s.dbNew || {}).from, k, l, () => this.setState(st => ({ dbNew: { ...st.dbNew, from: k } })))),
    dbNCancel: () => this.setState({ dbNew:null }),
    dbNCreate: () => { const N = s.dbNew, nm = (N.name || '').trim();
      if (!nm) return this.setState({ dbNew: { ...N, err:'Give the dashboard a name.' } }); if (nm.length > 40) return this.setState({ dbNew: { ...N, err:'Keep the name under 40 characters.' } });
      if (D.boards.some(b => b.name.trim().toLowerCase() === nm.toLowerCase())) return this.setState({ dbNew: { ...N, err:'A dashboard called “' + nm + '” already exists.' } });
      const id = 'b' + Date.now(), uid = x => x.map((v, i) => ({ ...v, id: id + '_' + i }));
      const vis = N.from === 'mis' ? uid(DB_MIS) : N.from === 'attr' ? uid(DB_ATTR) : N.from === 'learn' ? uid(DB_DEFAULT) : N.from === 'copy' ? uid(B.visuals) : [{ id: id + '_0', src:'learn', type:'kpi', measure:'completionRate', w:4 }];
      const snap = { dash: JSON.stringify({ ...D, edit:false }), board: B.id };
      this.setState({ dbNew:null, dbBoard: id, dbSnap: snap, dash: { ...D, boards: D.boards.concat([{ id, name: nm, visuals: JSON.parse(JSON.stringify(vis)) }]), edit:true } });
      this.toastMsg('“' + nm + '” created. Add visuals, then Save (or Cancel to discard it).'); },
    dbDupBoard: () => { const id = 'b' + Date.now(); let nm = B.name + ' (copy)', k = 2; while (D.boards.some(b => b.name === nm)) nm = B.name + ' (copy ' + (k++) + ')'; this.setState({ dbBoard: id, dash: { ...D, boards: D.boards.concat([{ ...JSON.parse(JSON.stringify(B)), id, name: nm, visuals: B.visuals.map((v, i) => ({ ...v, id: id + '_' + i })) }]) } }); this.toastMsg('Dashboard duplicated'); },
    dbDelBoard: () => { if (D.boards.length === 1) return this.toastMsg('Keep at least one dashboard'); if (!s.dbDelAsk) return this.setState({ dbDelAsk: true }); const nx = D.boards.find(b => b.id !== B.id); this.setState({ dbBoard: nx.id, dbDelAsk:false, dbSnap:null, dash: { ...D, edit:false, boards: D.boards.filter(b => b.id !== B.id) } }); this.toastMsg('“' + B.name + '” deleted'); },
    dbReset: () => { const orig = DB0.boards.find(x => x.id === B.id); setD((d, b) => { b.visuals = JSON.parse(JSON.stringify(orig ? orig.visuals : DB_DEFAULT)); }); this.toastMsg('Layout reset'); },
    dbExport: () => { const rows = [['Visual', 'Source', 'Dimension', 'Value', 'Measure', 'Result']];
      B.visuals.forEach(v0 => { const v = { src:'learn', ...v0 }, C = cubeOf(v), MS = DB_MEASURES[v.src], m = MS[v.measure] ? v.measure : Object.keys(MS)[0], dim = DB_DIMS[v.src][v.dim] ? v.dim : Object.keys(DB_DIMS[v.src])[0], t = v.title || MS[m][0];
        if (v.type === 'kpi') rows.push([t, DB_SRC[v.src], '', 'Total', MS[m][0], fmtV(v.src, m, Dash.measure(v.src, C.tot, m))]);
        else if (v.type === 'matrix') C.tat.forEach((mm, k) => Object.entries(mm).forEach(([bk, n]) => rows.push([t, DB_SRC[v.src], 'Sub division × TAT weeks', k + ' · ' + bk, 'Handed over', n])));
        else if (!['heat', 'batches'].includes(v.type)) rowsOf(v, C, dim, m).forEach(x => rows.push([t, DB_SRC[v.src], DB_DIMS[v.src][dim], lab(dim, x.k), MS[m][0], fmtV(v.src, m, x.v)])); });
      csvDownload('dashboard-' + B.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + TODAY_KEY + '.csv', rows); this.toastMsg('Dashboard data exported'); },
  };
};
