/* Skillforge LMS — calendar and discussions. */
SkillforgeApp.prototype.vmCommunity = function (c) {
  const { role, s } = c;
  // calendar
  const first = new Date(s.calY, s.calM, 1), startDow = (first.getDay() + 6) % 7, dim = new Date(s.calY, s.calM + 1, 0).getDate();
  const rows = Math.ceil((startDow + dim) / 7), cells = [];
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(s.calY, s.calM, i - startDow + 1);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const inM = d.getMonth() === s.calM, today = key === TODAY_KEY, sel = key === s.calSel;
    cells.push({ day:d.getDate(), op: inM ? 1 : 0.4, border: sel ? '#F2A93B' : 'transparent', bg: sel ? '#FFF7EA' : '#FBF7F0', numBg: today ? '#2B2118' : 'transparent', numFg: today ? '#FFF8EE' : '#2B2118', events:(EVENTS[key] || []).map(e => ({ t:e.t, bg:KIND[e.kind].bg, fg:KIND[e.kind].fg })), pick: () => this.setState({ calSel:key }) });
  }
  const selD = new Date(s.calSel + 'T12:00:00');
  const selEvents = (EVENTS[s.calSel] || []).map(e => ({ full:e.t, time:e.time, kindLabel:KIND[e.kind].label, bg:KIND[e.kind].bg, fg:KIND[e.kind].fg }));
  const upcoming = Object.keys(EVENTS).filter(k => k >= TODAY_KEY).sort().slice(0, 5).map(k => { const e = EVENTS[k][0]; const d = new Date(k + 'T12:00:00'); return { mon: MONTHS[d.getMonth()].slice(0, 3).toUpperCase(), d: d.getDate(), t:e.t, dot:KIND[e.kind].dot }; });
  const shiftM = n => { const d = new Date(s.calY, s.calM + n, 1); this.setState({ calY:d.getFullYear(), calM:d.getMonth() }); };
  // discussions
  const thread0 = s.threads.find(t => t.id === s.threadId);
  const thread = { ...thread0, votes: thread0.votes + (s.voted[thread0.id] ? 1 : 0), initials: ini(thread0.author), replyCount: thread0.replies.length, replies: thread0.replies.map((r, i) => ({ ...r, initials: ini(r.author), av: AV[(i + 1) % 5], isInstructor: !!r.instructor })) };
  const threadList = s.threads.map(t => ({ ...t, votes: t.votes + (s.voted[t.id] ? 1 : 0), replyCount: t.replies.length, border: t.id === s.threadId ? '#F2A93B' : '#EDE4D6', pick: () => this.setState({ threadId:t.id, reply:'' }) }));
  return {
    calTitle: MONTHS[s.calM] + ' ' + s.calY,
    dow: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    calCells: cells,
    calPrev: () => shiftM(-1),
    calNext: () => shiftM(1),
    calToday: () => this.setState({ calY:TODAY.getFullYear(), calM:TODAY.getMonth(), calSel:TODAY_KEY }),
    calSelLabel: selD.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }),
    selEvents,
    selHasEvents: selEvents.length > 0,
    selNoEvents: selEvents.length === 0,
    upcoming,
    threadList,
    thread,
    voteBorder: s.voted[s.threadId] ? '#F2A93B' : '#EDE4D6',
    voteBg: s.voted[s.threadId] ? '#FDF0DA' : '#FFFFFF',
    upvote: () => this.setState({ voted: { ...s.voted, [s.threadId]: !s.voted[s.threadId] } }),
    reply: s.reply,
    setReply: e => this.setState({ reply: e.target.value }),
    replyBtnBg: s.reply.trim() ? '#F2A93B' : '#EDE4D6',
    postReply: () => { if (!s.reply.trim()) return;
      if (Backend.on) { Backend.call('post', { threadId: s.threadId, body: s.reply.trim() }).then(() => { this.setState({ reply:'' }); this.toastMsg('Reply posted'); }).catch(e => this.toastMsg(e.message)); return; } const firstReply = !s.quests.discuss && s.role === 'learner'; this.setState({ threads: s.threads.map(t => t.id !== s.threadId ? t : { ...t, replies: [...t.replies, { author: role.name, instructor: s.role === 'instructor', time:'Just now', body: s.reply.trim() }] }), reply:'', quests: { discuss:true }, xp: s.xp + (s.role === 'learner' ? 20 : 0) }); this.toastMsg(s.role === 'learner' ? 'Reply posted · +20 XP' : 'Reply posted'); },
  };
};
