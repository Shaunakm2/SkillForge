/* Skillforge LMS — users and accounts. */
SkillforgeApp.prototype.amUsers = function (c) {
  const { chipsOf, isSuper, role, s, segs } = c;
  // users
  const ROLE_C = { 'Learner':['#F5EEE3', '#4A3B2F'], 'Trainer':['#CCFBF1', '#115E59'], 'Admin':['#EDE9FE', '#5B21B6'], 'Super admin':['#2B2118', '#FFF8EE'] };
  const ST = { Active:['#DCFCE7', '#166534'], Deactivated:['#F5EEE3', '#75655A'], Invited:['#DBEAFE', '#1E40AF'] };
  const uq = s.userQuery.trim().toLowerCase();
  // Status filter: Active (active + invited) or Inactive (deactivated), then role and search.
  const stOk = u => s.userStatus === 'All' || (s.userStatus === 'Inactive' ? u.status === 'Deactivated' : u.status !== 'Deactivated');
  const userAll = s.users.filter(u => stOk(u) && (s.userRole === 'All' || u.role === s.userRole) && (!uq || (u.name + ' ' + u.email + ' ' + (u.empId || '') + ' ' + (u.phone || '') + ' ' + (u.dept || '')).toLowerCase().includes(uq)));
  // Only the visible page of users is decorated and rendered.
  const UPG = Pager(this, s, 'users', userAll, 50);
  const userRows = UPG.rows.map(u => ({ ...u, roleName: (Access.roleFor(s, u) || {}).name || u.role })).map(u => { const prot = u.role === 'Super admin' && !isSuper; const active = u.status !== 'Deactivated'; return { ...u, initials: ini(u.name), av: AV[u.id % 5], roleBg: ROLE_C[u.role][0], roleFg: ROLE_C[u.role][1], stBg: ST[u.status][0], stFg: ST[u.status][1], op: active ? 1 : 0.55, canEdit: !prot, locked: prot, toggleLabel: active ? 'Deactivate' : 'Reactivate', toggleFg: active ? '#B91C1C' : '#166534', edit: () => this.setState({ userModal:true, ud:{ ...u } }), toggle: () => { if (Backend.on) { Backend.adminUsers(active ? 'ban' : 'unban', { email: u.email }).then(() => { this.setState(st => ({ users: st.users.map(x => x.id === u.id ? { ...x, status: active ? 'Deactivated' : 'Active' } : x) })); this.toastMsg(u.name + (active ? ' deactivated' : ' reactivated')); }).catch(e => this.toastMsg('Nothing changed: ' + e.message)); return; } this.setState(st => ({ users: st.users.map(x => x.id === u.id ? { ...x, status: active ? 'Deactivated' : 'Active' } : x) })); this.toastMsg(u.name + (active ? ' deactivated · sign-in disabled' : ' reactivated')); } }; });
  const uProt = u => false;
  const userRows2 = userRows.map(u => { const on = !!s.uSel[u.id]; return { ...u, phoneLabel: u.phone || '—', termsLabel: u.terms ? 'Yes' : 'No', termsBg: u.terms ? '#DCFCE7' : '#FCE6E0', termsFg: u.terms ? '#166534' : '#9C3F2A', attempts: () => this.setState({ attModal: u.name }), resetPw: () => this.setState({ pwReset: u.id }), tick: on ? '✓' : '', bg: on ? '#2B2118' : '#FFFFFF', bd: on ? '#2B2118' : '#D9CBB6', rowBg: on ? '#FBF7F0' : 'transparent', pick: () => this.setState(st => ({ uSel: { ...st.uSel, [u.id]: !st.uSel[u.id] } })), viewL: () => this.toastMsg('Opening learning history for ' + u.name), assignL: () => this.setState({ enrModal: { user: u.name } }) }; });
  const uSelIds = userRows2.filter(u => s.uSel[u.id]).map(u => u.id), uAllOn = userRows2.length > 0 && uSelIds.length === userRows2.length;
  const ud = s.ud || { id:null, roleId:'r_learner', name:'', email:'', role:'Learner', dept:'Customer Success', manager:'Priya Raman', status:'Invited', lastLogin:'Never', empId:'', phone:'', gender:'Prefer not to say', terms:false, designation:'', joined:TODAY_KEY };
  const setUd = k => e => this.setState(st => ({ ud: { ...(st.ud || ud), [k]: e.target.value } }));
  return {
    attModal: !!s.attModal,
    attUser: s.attModal || '',
    closeAtt: () => this.setState({ attModal:null }),
    attRows: s.attModal ? s.quizzes.map(z => { const u = s.attModal; const info = Assessment.attemptsInfo(z, (s.attemptsUsed[u] || {})[z.id], (s.extraAttempts[u] || {})[z.id]); const setX = n => { this.setState(st => ({ extraAttempts: { ...st.extraAttempts, [u]: { ...(st.extraAttempts[u] || {}), [z.id]: n } } })); }; return { name: z.name, course: z.course || 'Not attached yet', unlimited: info.unlimited, limited: !info.unlimited, allowedLabel: info.unlimited ? 'Unlimited' : info.base + (info.extra ? ' + ' + info.extra + ' extra' : ''), used: info.used, leftLabel: info.unlimited ? '—' : String(info.left), leftFg: !info.unlimited && info.left === 0 ? '#9C3F2A' : '#2B2118', extra: info.extra, canRemove: info.extra > 0, add: () => { setX(info.extra + 1); this.toastMsg('1 extra attempt granted to ' + u.split(' ')[0] + ' · ' + z.name); }, remove: () => { if (info.extra > 0) setX(info.extra - 1); } }; }) : [],
    userRows: userRows2, userPager: UPG.pager, userCountLabel: userAll.length.toLocaleString('en-US') + ' people',
    userEmpty: userRows2.length === 0,
    uSelCount: uSelIds.length,
    uAll: { tick: uAllOn ? '✓' : '', bg: uAllOn ? '#2B2118' : '#FFFFFF', bd: uAllOn ? '#2B2118' : '#D9CBB6' },
    toggleAllUsers: () => this.setState({ uSel: uAllOn ? {} : Object.fromEntries(userRows2.map(u => [u.id, true])) }),
    bulkAssign: () => this.setState({ assignOpen:true }),
    bulkRemind: () => { this.toastMsg('Reminder sent to ' + uSelIds.length + ' users'); this.setState({ uSel:{} }); },
    bulkClear: () => this.setState({ uSel:{} }),
    bulkDeactivate: () => { const ids = userRows2.filter(u => s.uSel[u.id] && !uProt(u)).map(u => u.id); this.setState({ users: s.users.map(u => ids.includes(u.id) ? { ...u, status:'Deactivated' } : u), uSel:{} }); this.toastMsg(ids.length + ' users deactivated'); },
    userQuery: s.userQuery,
    setUserQuery: e => this.setState({ userQuery: e.target.value }),
    userRoleChips: chipsOf(s.userRole, ['All', 'Learner', 'Trainer', 'Admin'], v => this.setState({ userRole:v, pages:{ ...s.pages, users:1 } })),
    userStatusChips: (() => { let a = 0, i = 0; s.users.forEach(u => { if (u.status === 'Deactivated') i++; else a++; });
      return [['Active', 'Active · ' + a.toLocaleString('en-US')], ['Inactive', 'Inactive · ' + i.toLocaleString('en-US')], ['All', 'All · ' + s.users.length.toLocaleString('en-US')]].map(([v, l]) => UI.chip(s.userStatus, v, l, () => this.setState({ userStatus: v, pages:{ ...s.pages, users:1 } }))); })(),
    exportUsers: () => { csvDownload('teammates-' + s.userStatus.toLowerCase() + '-' + TODAY_KEY + '.csv', [['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Manager', 'Role', 'User type', 'Status', 'Date of joining', 'Last sign-in', 'Terms accepted', 'Source']]
        .concat(userAll.map(u => [u.empId, u.name, u.email, u.phone, u.dept, u.designation, u.manager, (Access.roleFor(s, u) || {}).name || u.role, u.role, u.status === 'Deactivated' ? 'Inactive' : 'Active' + (u.status === 'Invited' ? ' (invited)' : ''), u.joined, u.lastLogin, u.terms ? 'Yes' : 'No', u.source || 'Skillforge'])));
      this.toastMsg(userAll.length.toLocaleString('en-US') + ' teammates exported'); },
    userStats: (() => { const n = { Active:0, Invited:0, Deactivated:0, Admin:0 }; s.users.forEach(u => { n[u.status] = (n[u.status] || 0) + 1; if (u.role === 'Admin') n.Admin++; }); return [['Active', n.Active, '#166534'], ['Invited', n.Invited, '#1E40AF'], ['Deactivated', n.Deactivated, '#75655A'], ['Admins', n.Admin, '#5B21B6']].map(([l, v, fg]) => ({ l, v: v.toLocaleString('en-US'), fg })); })(),
    newUser: () => this.setState({ userModal:true, ud:null }),
    importUsers: () => { const base = Math.max(...s.users.map(u => u.id)); const add = [['Owen Hart', 'Sales'], ['Priya Nair', 'Engineering'], ['Lucas Moreau', 'Customer Success']].map(([n, dp], i) => ({ id: base + i + 1, name:n, email: n.toLowerCase().split(' ').join('.') + '@northwind.com', role:'Learner', dept:dp, manager:'Priya Raman', status:'Invited', lastLogin:'Never' })); this.setState({ users: s.users.concat(add) }); this.toastMsg('3 accounts imported from new_hires_oct.csv · invites sent'); },
    userModal: s.userModal,
    closeUserModal: () => this.setState({ userModal:false }),
    ud,
    setUdName: setUd('name'),
    setUdEmail: setUd('email'),
    setUdDept: setUd('dept'),
    setUdManager: setUd('manager'),
    udRoleOpts: s.roles.map(r => ({ v: r.id, l: r.name + ' · ' + r.base })), setUdRole: e => { const r = s.roles.find(x => x.id === e.target.value); this.setState(st => ({ ud: { ...(st.ud || ud), roleId: r.id, role: r.base } })); },
    udRoleHint: ((s.roles.find(r => r.id === ud.roleId) || {}).desc || ''),
    udTitle: ud.id ? 'Edit account' : 'Create account',
    udBtn: ud.id ? 'Save changes' : 'Create & send invite',
    deptOptions: DEPTS,
    managerOptions: s.userModal ? ['None'].concat(s.users.filter(u => u.status !== 'Deactivated' && u.name !== ud.name && (u.role !== 'Learner' || /Manager/.test(u.designation || ''))).map(u => u.name).sort()) : [],
    setUdEmp: setUd('empId'),
    setUdPhone: setUd('phone'),
    setUdDesig: setUd('designation'),
    setUdJoined: setUd('joined'),
    udGenders: segs(ud.gender, GENDERS, v => this.setState(st => ({ ud: { ...(st.ud || ud), gender:v } }))),
    udTerms: segs(ud.terms ? 'Yes' : 'No', ['Yes', 'No'], v => this.setState(st => ({ ud: { ...(st.ud || ud), terms: v === 'Yes' } }))),
    saveUser: () => {
      const n = ud.name.trim(), em = ud.email.trim().toLowerCase(), emp = (ud.empId || '').trim(), ph = (ud.phone || '').trim();
      if (!n) return this.toastMsg('Add a full name');
      if (n.length < 2 || n.length > 80 || !/^[\p{L}][\p{L} .'’-]*$/u.test(n)) return this.toastMsg('Full name can use letters, spaces, apostrophes, dots and hyphens (2–80 characters)');
      if (ud.joined && !/^\d{4}-\d{2}-\d{2}$/.test(ud.joined)) return this.toastMsg('Date of joining is not a valid date');
      if (ud.joined && ud.joined > Progress.plus(TODAY_KEY, 180)) return this.toastMsg('Date of joining can’t be more than 6 months ahead');
      if ((ud.designation || '').length > 60) return this.toastMsg('Designation is too long (60 characters max)');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return this.toastMsg('Add a valid work email');
      if (!emp) return this.toastMsg('Add an employee ID');
      if (!/^[A-Za-z0-9][A-Za-z0-9_\-\/]{1,29}$/.test(emp)) return this.toastMsg('Employee ID can use letters, numbers, - _ / (2–30 characters)');
      if (ph && (!/^[0-9+ ()-]+$/.test(ph) || ph.replace(/\D/g, '').length < 7 || ph.replace(/\D/g, '').length > 15)) return this.toastMsg('Phone number needs 7 to 15 digits (+, spaces, brackets and dashes allowed)');
      if (s.users.some(u => u.id !== ud.id && u.email.toLowerCase() === em)) return this.toastMsg('Another account already uses this email');
      if (s.users.some(u => u.id !== ud.id && (u.empId || '').toLowerCase() === emp.toLowerCase())) return this.toastMsg('Employee ID ' + emp + ' is already in use');
      const prevU = s.users.find(x => x.id === ud.id);
      // The employee ID links the login and every learning record: it can't change once the account is connected.
      if (Backend.on && prevU && prevU.empId && prevU.empId.toLowerCase() !== emp.toLowerCase()) return this.toastMsg('The employee ID links this person’s login and history, so it can’t be changed. Create a new account instead.');
      // Names must be unique (the app refers to people by name): a clash gets the employee ID added.
      const nu = Identity.uniqueName(s.users, n, emp, ud.id);
      const rec = { ...ud, name:nu, email:em, empId:emp, phone:ph, designation:(ud.designation || '').trim() };
      const rRole = s.roles.find(r => r.id === ud.roleId) || null;
      if (rRole) rec.role = rRole.base;
      if (Backend.on && s.uBusy) return;
      if (ud.id) {
        const apply = () => { const st = this.state, renamed = prevU && prevU.name !== rec.name ? Identity.rename(st, prevU.name, rec.name) : {};
          const users0 = renamed.users || st.users, enroll0 = renamed.enroll || st.enroll;
          const rc = prevU && prevU.roleId !== rec.roleId ? Access.applyCourses(enroll0, rRole, rec.name, Progress.plus(TODAY_KEY, 30)) : { enroll: enroll0, added:0 };
          this.setState({ ...renamed, users: users0.map(u => u.id === ud.id ? rec : u), userModal:false, uBusy:false, enroll: rc.enroll });
          this.toastMsg('Account updated' + (nu !== n ? ' · saved as “' + nu + '” because the name is already used' : '') + (rc.added ? ' · ' + rc.added + ' role courses assigned' : '')); };
        if (!Backend.on) return apply();
        // Connected: change the login first; only if that works is the record updated (no half-done changes).
        this.setState({ uBusy:true });
        const jobs = []; if (prevU.role !== rec.role || prevU.roleId !== rec.roleId) jobs.push(() => Backend.adminUsers('setRole', { email: rec.email, role: rec.role, roleId: rec.roleId }));
        if (prevU.name !== rec.name) jobs.push(() => Backend.adminUsers('rename', { email: rec.email, name: rec.name }));
        jobs.reduce((p, j) => p.then(j), Promise.resolve()).then(apply).catch(e => { this.setState({ uBusy:false }); this.toastMsg('Not saved: ' + e.message); });
        return; }
      else {
        const id = Math.max(...s.users.map(u => u.id)) + 1;
        // Courses set to auto-assign new joiners (everyone, or the person's department) are assigned straight away.
        const auto = s.adminCourses.filter(c => c.autoNew && c.status === 'Published' && (c.aud === 'Everyone' || (c.aud === 'Departments' && (c.depts || {})[rec.dept])));
        const enroll = auto.length ? { ...s.enroll, [n]: Object.fromEntries(auto.map(c => [c.id, c.due])) } : s.enroll;
        const rcs = Access.applyCourses(enroll, rRole, n, Progress.plus(TODAY_KEY, 30));
        const ess = Essentials.apply(rcs.enroll, s.adminCourses, [{ ...rec, id }], s.holidays, s.assignedOn);
        const extras = (rcs.added ? ' · ' + rcs.added + ' role ' + (rcs.added === 1 ? 'course' : 'courses') : '') + (ess.added ? ' · ' + ess.added + ' essential ' + (ess.added === 1 ? 'training' : 'trainings') + ' assigned' : '');
        if (Backend.on) {   // create the login first (random temporary password, must be changed at first sign-in)
          this.setState({ uBusy:true });
          Backend.adminUsers('create', { email: rec.email, empId: rec.empId, name: rec.name, role: rec.role, roleId: rec.roleId, userKey: String(id) }).then(r => {
            this.setState(st => ({ users: st.users.concat([{ ...rec, id }]), userModal:false, uBusy:false, enroll: ess.enroll, assignedOn: ess.assignedOn, tempPw: { name: rec.name, email: rec.email, pw: r.tempPassword, why:'new' } }));
            this.toastMsg('Account created' + extras); }).catch(e => { this.setState({ uBusy:false }); this.toastMsg('Not created: ' + e.message); });
          return; }
        this.setState({ users: s.users.concat([{ ...rec, id }]), userModal:false, enroll: ess.enroll, assignedOn: ess.assignedOn, passwords: { ...s.passwords, [rec.email]: DEFAULT_PASSWORD } });
        this.toastMsg('Invite sent to ' + em + ' · first password ' + DEFAULT_PASSWORD + (rcs.added ? ' · ' + rcs.added + ' role ' + (rcs.added === 1 ? 'course' : 'courses') : '') + (ess.added ? ' · ' + ess.added + ' essential ' + (ess.added === 1 ? 'training' : 'trainings') + ' assigned' : '') + (auto.length ? ' · auto-assigned ' + auto.length + (auto.length === 1 ? ' course' : ' courses') : ''));
      }
    },
    // Temporary password, shown once to the admin (connected mode).
    tempPwOpen: !!s.tempPw, tempPw: s.tempPw || {}, tempPwTitle: s.tempPw && s.tempPw.why === 'reset' ? 'Password reset' : 'Account created',
    closeTempPw: () => this.setState({ tempPw:null }), copyTempPw: () => { try { navigator.clipboard.writeText(s.tempPw.pw); this.toastMsg('Copied'); } catch (e) { this.toastMsg(s.tempPw.pw); } },
    uSaving: !!s.uBusy,
    pwResetOpen: !!s.pwReset, pwResetName: (s.users.find(u => u.id === s.pwReset) || {}).name || '', defaultPw: DEFAULT_PASSWORD,
    closePwReset: () => this.setState({ pwReset:null }),
    confirmPwReset: () => { const u = s.users.find(x => x.id === s.pwReset); if (!u) return;
      if (Backend.on) { Backend.adminUsers('resetPassword', { email: u.email }).then(r => this.setState({ pwReset:null, tempPw: { name: u.name, email: u.email, pw: r.tempPassword, why:'reset' } })).catch(e => this.toastMsg('Password not reset: ' + e.message)); return; }
      this.setState(st => ({ passwords: { ...st.passwords, [u.email]: DEFAULT_PASSWORD }, pwReset:null }));
      this.toastMsg(u.name + '’s password was reset to ' + DEFAULT_PASSWORD); },
  };
};
