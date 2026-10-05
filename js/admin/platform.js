/* Skillforge LMS — notifications, automations, integrations, audit log, user types and branding. */
SkillforgeApp.prototype.amPlatform = function (c) {
  const { INK, W, s, tg } = c;
  // notifications + learner extras
  const NK = { due:'#E8664A', reply:'#3E8E7E', cert:'#F2A93B', assign:'#8C5A9E' };
  return {
    autoRows: s.autos.map(a => ({ ...a, ...tg(a.on, () => this.setState(st => ({ autos: st.autos.map(x => x.id === a.id ? { ...x, on: !x.on } : x) }))) })),
    integRows: s.integ.map((x, i) => { const c = VIVIDS[i % 7]; return { ...x, initials: x.name.slice(0, 2).toUpperCase(), color:c, colorFg:VIVID_FG[c], status: x.on ? 'Connected' : 'Not connected', stBg: x.on ? '#DCFCE7' : '#F5EEE3', stFg: x.on ? '#166534' : '#75655A', btnLabel: x.on ? 'Disconnect' : 'Connect', btnBg: x.on ? W : INK, btnFg: x.on ? INK : '#FFF8EE', toggle: () => { this.setState(st => ({ integ: st.integ.map(y => y.id === x.id ? { ...y, on: !y.on } : y) })); this.toastMsg(x.name + (x.on ? ' disconnected' : ' connected')); } }; }),
    auditQuery: s.auditQuery,
    setAuditQuery: e => this.setState({ auditQuery: e.target.value }),
    exportAudit: () => this.toastMsg('Audit log exported as CSV'),
    auditRows: AUDIT.filter(a => !s.auditQuery.trim() || (a.who + a.action + a.target).toLowerCase().includes(s.auditQuery.trim().toLowerCase())).map((a, i) => ({ ...a, initials: ini(a.who), av: AV[i % 5] })),
    permRoles: ['Learner', 'Trainer', 'Admin'],
    permRows: s.perms.map(([label, vals]) => ({ label, cells: vals.map(v => ({ on: !!v, bg: v ? '#22C55E' : W, border: v ? '#22C55E' : '#D9CBB6', op: 1, toggle: () => {} })) })),
    brandName: s.brandName,
    setBrandName: e => this.setState({ brandName: e.target.value }),
    brandMsg: s.brandMsg,
    setBrandMsg: e => this.setState({ brandMsg: e.target.value }),
    brandAccent: s.brandAccent,
    brandSwatches: ['#F2A93B', '#7C5CFF', '#14B8A6', '#2563EB', '#DB2777', '#22C55E'].map(c => ({ c, ring: s.brandAccent === c ? INK : 'transparent', pick: () => this.setState({ brandAccent:c }) })),
    saveBrand: () => this.toastMsg('Branding saved for all users'),
    uploadLogo: () => this.toastMsg('Logo uploaded'),
    notifOpen: s.notifOpen,
    toggleNotif: () => this.setState({ notifOpen: !s.notifOpen, roleMenu:false }),
    // Approvers (admins, and the requester's manager) see pending access requests in the bell.
    ...(() => { const me = c.role.name, adm = c.isAdm, mine = s.accessReqs.filter(r => r.status === 'Pending' && (adm || r.manager === me));
      const extra = mine.slice(0, 5).map(r => ({ t: r.user + ' requested ' + r.course, time: Fmt.dt(r.at), kind:'assign', go: () => this.go('assignments', { adminView:true, reqFilter:'Pending', notifOpen:false }) }));
      const list = extra.concat(NOTIFS); return { notifCount: s.notifRead ? extra.length : list.length, notifs: list.map(n => ({ ...n, dot: NK[n.kind], bg: s.notifRead ? W : '#FFFBF3' })) }; })(),
    _unusedNotifCount: s.notifRead ? 0 : NOTIFS.length,
    hasUnread: !s.notifRead,
    markRead: () => this.setState({ notifRead:true }),
  };
};
