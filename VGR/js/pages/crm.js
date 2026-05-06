/* ─── CRM MODULE ─── */
import { STATE, fmt, fmtCur, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, renderPagerHTML, toast, openModal, closeModalBtn } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, COMPANIES } from '../utils/helpers.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureCrm() {
  if (!STATE.crm) STATE.crm = {};
  if (!Array.isArray(STATE.crm.segments)) STATE.crm.segments = [];
  if (!Array.isArray(STATE.crm.missions)) STATE.crm.missions = [];
  if (!Array.isArray(STATE.crm.tournaments)) STATE.crm.tournaments = [];
  if (!Array.isArray(STATE.crm.automationRules)) STATE.crm.automationRules = [];
  if (!Array.isArray(STATE.crm.pushCampaigns)) STATE.crm.pushCampaigns = [];
  if (!Array.isArray(STATE.crm.tournamentEntries)) STATE.crm.tournamentEntries = [];
}

const TRIGGER_EVENTS = ['register', 'deposit', 'withdrawal', 'login', 'inactivity', 'tier_change', 'bet_win', 'bet_lose', 'referral'];
const MISSION_TYPES = ['Deposit', 'Bet', 'Login', 'Referral', 'Turnover', 'Custom'];
const REWARD_TYPES = ['Bonus', 'Points', 'Freebet', 'Cash'];
const GAME_TYPES = ['All', 'Slot', 'Casino Live', 'Sportsbook', 'Togel', 'Poker', 'Crash'];
const SCORING = ['Turnover', 'WinAmount', 'BetCount'];

const STATUS_COLORS = {
  Active: 'success', Draft: 'secondary', Paused: 'warning',
  Ended: 'danger', Scheduled: 'indigo', Sent: 'success',
  Archived: 'secondary', Settled: 'success',
};

function segmentOptions(withAll = true) {
  ensureCrm();
  const segs = STATE.crm.segments || [];
  const opts = withAll ? ['<option value="">All Segments</option>'] : ['<option value="">— None —</option>'];
  segs.forEach(s => opts.push(`<option value="${s.id}">${s.name}</option>`));
  return opts.join('');
}

function segmentName(id) {
  if (!id) return '—';
  const s = (STATE.crm?.segments || []).find(x => x.id === id);
  return s ? s.name : id;
}

/* ══════════════════════════════════════════════════════════════════════════════
   1. CRM DASHBOARD
══════════════════════════════════════════════════════════════════════════════ */
pages['crm-dashboard'] = () => {
  ensureCrm();
  const segs = STATE.crm.segments;
  const missions = STATE.crm.missions;
  const tours = STATE.crm.tournaments;
  const rules = STATE.crm.automationRules;
  const pushes = STATE.crm.pushCampaigns;

  const activeSegs = segs.filter(s => s.status === 'Active').length;
  const activeMissions = missions.filter(m => m.status === 'Active').length;
  const activeTours = tours.filter(t => t.status === 'Active').length;
  const firedToday = rules.reduce((s, r) => s + (r.firedCount || 0), 0);
  const totalMembers = (STATE.members || []).length;

  const recentActivity = [
    ...missions.slice(0, 3).map(m => ({ icon: 'fa-flag-checkered', color: 'var(--acc)', text: `Mission <strong>${m.name}</strong> — ${m.completions || 0} completions`, date: m.createdAt })),
    ...tours.slice(0, 3).map(t => ({ icon: 'fa-trophy', color: 'var(--yellow)', text: `Tournament <strong>${t.name}</strong> — ${fmtCur(t.prizePool || 0)} prize pool`, date: t.createdAt })),
    ...pushes.slice(0, 2).map(p => ({ icon: 'fa-bell', color: '#6366f1', text: `Push <strong>${p.title}</strong> — ${p.sentCount || 0} sent`, date: p.createdAt })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return `
  ${pageHeader('CRM Overview', '<span>CRM</span><span class="sep">›</span><span>Overview</span>', `
    <div style="display:flex;gap:.5rem">
      <button class="btn btn-secondary btn-sm" onclick="window.go('crm-segments')"><i class="fa-solid fa-layer-group"></i> Segments</button>
      <button class="btn btn-primary" onclick="window.go('crm-missions')"><i class="fa-solid fa-flag-checkered"></i> Missions</button>
    </div>`)}

  <div class="stat-grid" style="grid-template-columns:repeat(5,1fr)">
    ${[
      ['Members', fmt(totalMembers), 'fa-users', 'rgba(14,165,233,.1)', 'var(--acc)', 'crm-segments'],
      ['Segments', fmt(activeSegs), 'fa-layer-group', 'rgba(99,102,241,.12)', '#6366f1', 'crm-segments'],
      ['Active Missions', fmt(activeMissions), 'fa-flag-checkered', 'rgba(16,185,129,.1)', 'var(--green)', 'crm-missions'],
      ['Tournaments', fmt(activeTours), 'fa-trophy', 'rgba(245,158,11,.1)', 'var(--yellow)', 'crm-tournaments'],
      ['Rules Fired', fmt(firedToday), 'fa-robot', 'rgba(239,68,68,.1)', 'var(--red)', 'crm-automation'],
    ].map(([label, val, icon, bg, color, page]) => `
      <div class="stat-card" style="cursor:pointer" onclick="window.go('${page}')">
        <div class="stat-icon" style="background:${bg};color:${color}"><i class="fa-solid ${icon}"></i></div>
        <div class="stat-info"><div class="stat-label">${label}</div><div class="stat-value">${val}</div></div>
      </div>`).join('')}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
    <!-- Segment distribution -->
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-layer-group" style="color:var(--acc)"></i> Top Segments</span>
        <button class="btn btn-xs btn-secondary" onclick="window.go('crm-segments')">View All</button>
      </div>
      <div class="card-body" style="padding:0">
        ${segs.slice(0, 6).length ? segs.slice(0, 6).map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:.7rem 1rem;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-weight:600;font-size:.84rem">${s.name}</div>
              <div style="font-size:.7rem;color:var(--text3)">${Object.entries(s.criteria || {}).filter(([, v]) => v).map(([k]) => k).join(', ') || 'No criteria'}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;color:var(--acc)">${fmt(s.memberCount || 0)}</div>
              <div style="font-size:.7rem">${badge(s.status, STATUS_COLORS[s.status] || 'secondary')}</div>
            </div>
          </div>`).join('') : `<div style="text-align:center;padding:2rem;color:var(--text3)">No segments yet<br><button class="btn btn-primary btn-sm" style="margin-top:.75rem" onclick="window.openCrmSegmentModal()">Create First</button></div>`}
      </div>
    </div>

    <!-- Active Missions -->
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-flag-checkered" style="color:var(--green)"></i> Active Missions</span>
        <button class="btn btn-xs btn-secondary" onclick="window.go('crm-missions')">View All</button>
      </div>
      <div class="card-body" style="padding:0">
        ${missions.filter(m => m.status === 'Active').slice(0, 5).length
      ? missions.filter(m => m.status === 'Active').slice(0, 5).map(m => {
        const pct = m.targetValue > 0 ? Math.min(100, Math.round((m.completions / Math.max(m.participants, 1)) * 100)) : 0;
        return `
            <div style="padding:.75rem 1rem;border-bottom:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;margin-bottom:.35rem">
                <div style="font-weight:600;font-size:.83rem">${m.name}</div>
                <div style="font-size:.7rem;color:var(--text3)">${m.completions || 0}/${m.participants || 0}</div>
              </div>
              <div style="background:var(--border);border-radius:4px;height:5px">
                <div style="width:${pct}%;height:100%;background:var(--green);border-radius:4px"></div>
              </div>
              <div style="font-size:.68rem;color:var(--text3);margin-top:.25rem">${badge(m.type, 'indigo')} Reward: ${fmtCur(m.rewardAmount || 0)}</div>
            </div>`;
      }).join('')
      : `<div style="text-align:center;padding:2rem;color:var(--text3)">No active missions<br><button class="btn btn-primary btn-sm" style="margin-top:.75rem" onclick="window.openCrmMissionModal()">Create Mission</button></div>`}
      </div>
    </div>

    <!-- Recent Automation Fires -->
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-robot" style="color:var(--red)"></i> Automation Rules</span>
        <button class="btn btn-xs btn-secondary" onclick="window.go('crm-automation')">View All</button>
      </div>
      <div class="card-body" style="padding:0">
        ${rules.slice(0, 6).length ? rules.slice(0, 6).map(r => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:.65rem 1rem;border-bottom:1px solid var(--border)">
            <div>
              <div style="font-weight:600;font-size:.83rem">${r.name}</div>
              <div style="font-size:.7rem;color:var(--text3)">on <code style="background:var(--bg2);padding:.05rem .3rem;border-radius:4px">${r.triggerEvent}</code></div>
            </div>
            <div style="text-align:right">
              ${badge(r.status, STATUS_COLORS[r.status] || 'secondary')}
              <div style="font-size:.68rem;color:var(--text3);margin-top:.2rem">fired ${r.firedCount || 0}×</div>
            </div>
          </div>`).join('') : `<div style="text-align:center;padding:2rem;color:var(--text3)">No rules yet<br><button class="btn btn-primary btn-sm" style="margin-top:.75rem" onclick="window.openCrmAutomationModal()">Create Rule</button></div>`}
      </div>
    </div>
  </div>

  <!-- Recent Activity Feed -->
  <div class="card">
    <div class="card-header"><span class="card-title"><i class="fa-solid fa-clock-rotate-left" style="color:var(--acc)"></i> Recent CRM Activity</span></div>
    <div class="card-body" style="padding:.5rem 0">
      ${recentActivity.length ? recentActivity.map(a => `
        <div style="display:flex;align-items:center;gap:.75rem;padding:.6rem 1.25rem;border-bottom:1px solid var(--border)">
          <div style="width:30px;height:30px;border-radius:50%;background:${a.color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fa-solid ${a.icon}" style="font-size:.75rem;color:${a.color}"></i>
          </div>
          <div style="flex:1;font-size:.83rem">${a.text}</div>
          <div style="font-size:.7rem;color:var(--text3);white-space:nowrap">${a.date ? new Date(a.date).toLocaleDateString('id-ID') : '—'}</div>
        </div>`).join('') : `<div style="text-align:center;padding:3rem;color:var(--text3)">No CRM activity yet. Start by creating a segment.</div>`}
    </div>
  </div>`;
};


/* ══════════════════════════════════════════════════════════════════════════════
   2. SEGMENTS
══════════════════════════════════════════════════════════════════════════════ */
pages['crm-segments'] = () => {
  ensureCrm();
  const PG = 'crm-segments';
  const all = STATE.crm.segments;
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
  ${pageHeader('Player Segments', '<span>CRM</span><span class="sep">›</span><span>Segments</span>', `
    <button class="btn btn-primary" onclick="window.openCrmSegmentModal()"><i class="fa-solid fa-plus"></i> New Segment</button>`)}

  ${filterCard(`
    ${fsInput(PG, 'name', 'Name', 'Search segment...')}
    ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Archived'])}
    ${fsActions(PG)}
  `)}

  ${tableWrap(`
    <table>
      <thead>
        <tr><th>#</th><th>Segment Name</th><th>Criteria</th><th>Members</th><th>Company</th><th>Status</th><th>Created</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((s, i) => {
    const criteriaText = Object.entries(s.criteria || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `<span style="background:var(--bg2);border:1px solid var(--border);border-radius:4px;padding:.05rem .35rem;font-size:.68rem;margin:.1rem">${k}: ${v}</span>`).join('') || '<span style="color:var(--text3);font-size:.75rem">All members</span>';
    return `
          <tr>
            <td>${(cp - 1) * pp + i + 1}</td>
            <td>
              <div style="font-weight:700;color:var(--acc)">${s.name}</div>
              <div style="font-size:.72rem;color:var(--text3)">${s.id}</div>
            </td>
            <td><div style="display:flex;flex-wrap:wrap;gap:.2rem;max-width:280px">${criteriaText}</div></td>
            <td>
              <div style="font-weight:700;font-size:1.1rem">${fmt(s.memberCount || 0)}</div>
              <button class="btn btn-xs btn-secondary" style="font-size:.65rem;padding:.1rem .4rem;margin-top:.2rem" onclick="window.refreshSegmentCount('${s.id}')">
                <i class="fa-solid fa-rotate"></i> Refresh
              </button>
            </td>
            <td style="font-size:.78rem">${s.company || '<span style="color:var(--text3)">Global</span>'}</td>
            <td>${badge(s.status, STATUS_COLORS[s.status] || 'secondary')}</td>
            <td style="font-size:.72rem;color:var(--text3)">${s.createdAt ? new Date(s.createdAt).toLocaleDateString('id-ID') : '—'}</td>
            <td>
              <div style="display:flex;gap:.3rem">
                <button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" title="Edit" onclick="window.openCrmSegmentModal('${s.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-icon" style="background:var(--bg2)" title="Create Mission for this segment" onclick="window.openCrmMissionModal(null,'${s.id}')"><i class="fa-solid fa-flag-checkered"></i></button>
                <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="window.deleteCrmSegment('${s.id}','${s.name}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
  }).join('') : `<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text3)">No segments yet — <button class="btn btn-primary btn-sm" onclick="window.openCrmSegmentModal()">Create First Segment</button></td></tr>`}
      </tbody>
    </table>
  `)}
  ${renderPagerHTML(PG, total, pp, cp)}`;
};


/* ══════════════════════════════════════════════════════════════════════════════
   3. MISSIONS
══════════════════════════════════════════════════════════════════════════════ */
pages['crm-missions'] = () => {
  ensureCrm();
  const PG = 'crm-missions';
  const all = STATE.crm.missions;
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
  ${pageHeader('Missions', '<span>CRM</span><span class="sep">›</span><span>Missions</span>', `
    <button class="btn btn-primary" onclick="window.openCrmMissionModal()"><i class="fa-solid fa-plus"></i> New Mission</button>`)}

  ${filterCard(`
    ${fsInput(PG, 'name', 'Name', 'Search mission...')}
    ${fsSelect(PG, 'type', 'Type', ['All', ...MISSION_TYPES])}
    ${fsSelect(PG, 'status', 'Status', ['All', 'Draft', 'Active', 'Paused', 'Ended'])}
    ${fsActions(PG)}
  `)}

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.25rem">
    ${[
      ['Active', all.filter(m => m.status === 'Active').length, 'var(--green)'],
      ['Draft', all.filter(m => m.status === 'Draft').length, 'var(--text3)'],
      ['Total Participants', all.reduce((s, m) => s + (m.participants || 0), 0), 'var(--acc)'],
      ['Total Completions', all.reduce((s, m) => s + (m.completions || 0), 0), 'var(--yellow)'],
    ].map(([label, val, color]) => `
      <div class="card"><div class="card-body" style="padding:.9rem 1.1rem">
        <div style="font-size:.78rem;color:var(--text3)">${label}</div>
        <div style="font-size:1.5rem;font-weight:800;color:${color}">${fmt(val)}</div>
      </div></div>`).join('')}
  </div>

  ${tableWrap(`
    <table>
      <thead>
        <tr><th>#</th><th>Mission</th><th>Type</th><th>Target</th><th>Reward</th><th>Segment</th><th>Progress</th><th>Period</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((m, i) => {
      const pct = m.participants > 0 ? Math.min(100, Math.round((m.completions / m.participants) * 100)) : 0;
      return `
          <tr>
            <td>${(cp - 1) * pp + i + 1}</td>
            <td>
              <div style="font-weight:700">${m.name}</div>
              <div style="font-size:.7rem;color:var(--text3)">${m.description || ''}</div>
            </td>
            <td>${badge(m.type, 'indigo')}</td>
            <td style="font-size:.82rem">${fmt(m.targetValue || 0)}</td>
            <td>
              <div style="font-weight:600;color:var(--green)">${fmtCur(m.rewardAmount || 0)}</div>
              <div style="font-size:.7rem;color:var(--text3)">${m.rewardType}</div>
            </td>
            <td style="font-size:.78rem">${segmentName(m.segmentId)}</td>
            <td>
              <div style="display:flex;align-items:center;gap:.4rem">
                <div style="flex:1;height:5px;background:var(--border);border-radius:3px;min-width:60px">
                  <div style="width:${pct}%;height:100%;background:var(--green);border-radius:3px"></div>
                </div>
                <span style="font-size:.7rem;white-space:nowrap">${m.completions || 0}/${m.participants || 0}</span>
              </div>
            </td>
            <td style="font-size:.72rem;color:var(--text3)">${m.startDate || '—'}<br>${m.endDate || '—'}</td>
            <td>${badge(m.status, STATUS_COLORS[m.status] || 'secondary')}</td>
            <td>
              <div style="display:flex;gap:.3rem">
                <button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" onclick="window.openCrmMissionModal('${m.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-icon" style="background:${m.status === 'Active' ? 'rgba(245,158,11,.15)' : 'rgba(16,185,129,.15)'};color:${m.status === 'Active' ? 'var(--yellow)' : 'var(--green)'}" onclick="window.toggleCrmMissionStatus('${m.id}','${m.status}')" title="${m.status === 'Active' ? 'Pause' : 'Activate'}">
                  <i class="fa-solid ${m.status === 'Active' ? 'fa-pause' : 'fa-play'}"></i>
                </button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="window.deleteCrmMission('${m.id}','${m.name}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
    }).join('') : `<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--text3)">No missions yet — <button class="btn btn-primary btn-sm" onclick="window.openCrmMissionModal()">Create First Mission</button></td></tr>`}
      </tbody>
    </table>
  `)}
  ${renderPagerHTML(PG, total, pp, cp)}`;
};


/* ══════════════════════════════════════════════════════════════════════════════
   4. TOURNAMENTS
══════════════════════════════════════════════════════════════════════════════ */
pages['crm-tournaments'] = () => {
  ensureCrm();
  const PG = 'crm-tournaments';
  const all = STATE.crm.tournaments;
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  // Compute leaderboard from real bet data per tournament
  function getLeaderboard(tour, limit = 5) {
    const txs = STATE.seamless?.transactions || [];
    const bets = STATE.lotteryBets || [];
    const memberMap = {};
    const metric = tour.scoringMetric || 'Turnover';
    const start = tour.startDate ? new Date(tour.startDate) : null;
    const end = tour.endDate ? new Date(tour.endDate) : null;
    const inRange = (t) => {
      const d = new Date(t);
      return (!start || d >= start) && (!end || d <= end);
    };
    // From seamless txs
    txs.filter(t => inRange(t.createTime)).forEach(t => {
      const v = metric === 'WinAmount' ? (t.winAmount || 0) : metric === 'BetCount' ? 1 : (t.betAmount || 0);
      if (!memberMap[t.player]) memberMap[t.player] = { member: t.player, score: 0 };
      memberMap[t.player].score += v;
    });
    // From lottery bets
    bets.filter(b => inRange(b.date)).forEach(b => {
      const v = metric === 'WinAmount' ? (b.winAmount || 0) : metric === 'BetCount' ? 1 : (b.betAmount || 0);
      if (!memberMap[b.member]) memberMap[b.member] = { member: b.member, score: 0 };
      memberMap[b.member].score += v;
    });
    return Object.values(memberMap).sort((a, b) => b.score - a.score).slice(0, limit);
  }

  return `
  ${pageHeader('Tournaments', '<span>CRM</span><span class="sep">›</span><span>Tournaments</span>', `
    <button class="btn btn-primary" onclick="window.openCrmTournamentModal()"><i class="fa-solid fa-plus"></i> New Tournament</button>`)}

  ${filterCard(`
    ${fsInput(PG, 'name', 'Name', 'Search tournament...')}
    ${fsSelect(PG, 'status', 'Status', ['All', 'Draft', 'Active', 'Ended', 'Settled'])}
    ${fsSelect(PG, 'gameType', 'Game Type', ['All', ...GAME_TYPES.slice(1)])}
    ${fsActions(PG)}
  `)}

  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem">
    ${rows.length ? rows.map(t => {
    const leaderboard = getLeaderboard(t, 3);
    const prizeStructure = t.prizeStructure || [{ rank: 1, amount: t.prizePool || 0 }];
    return `
      <div class="card" style="border-top:3px solid ${t.status === 'Active' ? 'var(--green)' : t.status === 'Ended' ? 'var(--red)' : 'var(--border)'}">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem">
            <div>
              <div style="font-weight:700;font-size:.95rem">${t.name}</div>
              <div style="font-size:.72rem;color:var(--text3)">${t.gameType || 'All'} · ${t.scoringMetric || 'Turnover'}</div>
            </div>
            ${badge(t.status, STATUS_COLORS[t.status] || 'secondary')}
          </div>

          <div style="display:flex;justify-content:space-between;margin-bottom:.75rem;padding:.6rem;background:var(--bg2);border-radius:8px">
            <div style="text-align:center">
              <div style="font-size:.7rem;color:var(--text3)">Prize Pool</div>
              <div style="font-weight:800;color:var(--yellow);font-size:.9rem">${fmtCur(t.prizePool || 0)}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:.7rem;color:var(--text3)">Start</div>
              <div style="font-size:.78rem;font-weight:600">${t.startDate ? new Date(t.startDate).toLocaleDateString('id-ID') : '—'}</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:.7rem;color:var(--text3)">End</div>
              <div style="font-size:.78rem;font-weight:600">${t.endDate ? new Date(t.endDate).toLocaleDateString('id-ID') : '—'}</div>
            </div>
          </div>

          ${leaderboard.length ? `
          <div style="margin-bottom:.75rem">
            <div style="font-size:.72rem;color:var(--text3);margin-bottom:.4rem;font-weight:700">LIVE LEADERBOARD</div>
            ${leaderboard.map((e, idx) => `
              <div style="display:flex;align-items:center;gap:.5rem;padding:.3rem 0;border-bottom:1px solid var(--border)">
                <div style="width:22px;height:22px;border-radius:50%;background:${idx === 0 ? 'var(--yellow)' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--bg2)'};display:flex;align-items:center;justify-content:center;font-size:.68rem;font-weight:800;color:${idx < 3 ? '#000' : 'var(--text)'}">${idx + 1}</div>
                <div style="flex:1;font-size:.8rem;font-weight:600">${e.member}</div>
                <div style="font-size:.78rem;color:var(--acc);font-weight:700">${fmt(e.score)}</div>
                ${prizeStructure[idx] ? `<div style="font-size:.68rem;color:var(--green)">${fmtCur(prizeStructure[idx].amount || 0)}</div>` : ''}
              </div>`).join('')}
          </div>` : `<div style="text-align:center;font-size:.78rem;color:var(--text3);padding:.5rem 0">No entries yet</div>`}

          <div style="display:flex;gap:.4rem;margin-top:.5rem">
            <button class="btn btn-sm btn-primary" style="flex:1" onclick="window.openCrmTournamentModal('${t.id}')"><i class="fa-solid fa-pen"></i> Edit</button>
            ${t.status === 'Active' ? `<button class="btn btn-sm btn-warning" onclick="window.endTournament('${t.id}')"><i class="fa-solid fa-stop"></i> End</button>` : ''}
            ${t.status === 'Draft' ? `<button class="btn btn-sm btn-success" onclick="window.startTournament('${t.id}')"><i class="fa-solid fa-play"></i> Start</button>` : ''}
            <button class="btn btn-sm btn-danger btn-icon" onclick="window.deleteCrmTournament('${t.id}','${t.name}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>`;
  }).join('') : `
    <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem;color:var(--text3)">
      <i class="fa-solid fa-trophy" style="font-size:2.5rem;opacity:.3;margin-bottom:1rem"></i>
      <div>No tournaments yet</div>
      <button class="btn btn-primary" style="margin-top:1rem" onclick="window.openCrmTournamentModal()">Create First Tournament</button>
    </div>`}
  </div>`;
};


/* ══════════════════════════════════════════════════════════════════════════════
   5. AUTOMATION RULES
══════════════════════════════════════════════════════════════════════════════ */
pages['crm-automation'] = () => {
  ensureCrm();
  const PG = 'crm-automation';
  const all = STATE.crm.automationRules;
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  const ACTION_TYPE_LABELS = {
    send_bonus: '🎁 Send Bonus', send_memo: '✉️ Send Memo', add_points: '⭐ Add Points',
    send_push: '🔔 Push Notif', change_tier: '🏆 Change Tier', tag_segment: '🏷️ Tag Segment',
    block_member: '🚫 Block', flag_review: '⚠️ Flag Review',
  };

  return `
  ${pageHeader('Automation Rules', '<span>CRM</span><span class="sep">›</span><span>Automation</span>', `
    <button class="btn btn-primary" onclick="window.openCrmAutomationModal()"><i class="fa-solid fa-plus"></i> New Rule</button>`)}

  ${filterCard(`
    ${fsInput(PG, 'name', 'Name', 'Search rule...')}
    ${fsSelect(PG, 'triggerEvent', 'Trigger', ['All', ...TRIGGER_EVENTS])}
    ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Paused'])}
    ${fsActions(PG)}
  `)}

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
    ${[
      ['Total Rules', all.length, 'fa-list', 'var(--acc)'],
      ['Active', all.filter(r => r.status === 'Active').length, 'fa-circle-check', 'var(--green)'],
      ['Total Fired', all.reduce((s, r) => s + (r.firedCount || 0), 0), 'fa-bolt', 'var(--yellow)'],
      ['Paused', all.filter(r => r.status === 'Paused').length, 'fa-pause', 'var(--text3)'],
    ].map(([label, val, icon, color]) => `
      <div class="card"><div class="card-body" style="display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem">
        <i class="fa-solid ${icon}" style="color:${color};font-size:1.2rem;width:24px"></i>
        <div><div style="font-size:.75rem;color:var(--text3)">${label}</div><div style="font-size:1.3rem;font-weight:800">${fmt(val)}</div></div>
      </div></div>`).join('')}
  </div>

  ${tableWrap(`
    <table>
      <thead>
        <tr><th>#</th><th>Rule Name</th><th>Trigger</th><th>Conditions</th><th>Actions</th><th>Fired</th><th>Last Fired</th><th>Status</th><th>Edit</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((r, i) => {
      const condText = (r.conditions || []).map(c => `${c.field} ${c.op} ${c.value}`).join(' AND ') || '—';
      const actionText = (r.actions || []).map(a => ACTION_TYPE_LABELS[a.type] || a.type).join(', ') || '—';
      return `
          <tr>
            <td>${(cp - 1) * pp + i + 1}</td>
            <td>
              <div style="font-weight:700">${r.name}</div>
              <div style="font-size:.7rem;color:var(--text3)">${r.description || ''}</div>
            </td>
            <td><code style="background:var(--bg2);padding:.15rem .4rem;border-radius:5px;font-size:.78rem">${r.triggerEvent}</code></td>
            <td style="font-size:.76rem;max-width:180px">${condText}</td>
            <td style="font-size:.76rem;max-width:180px">${actionText}</td>
            <td style="font-weight:700;color:var(--acc)">${fmt(r.firedCount || 0)}×</td>
            <td style="font-size:.72rem;color:var(--text3)">${r.lastFiredAt ? new Date(r.lastFiredAt).toLocaleString('id-ID') : '—'}</td>
            <td>
              <label class="toggle">
                <input type="checkbox" ${r.status === 'Active' ? 'checked' : ''} onchange="window.toggleCrmAutomation('${r.id}',this.checked)"/>
                <div class="toggle-slider"></div>
              </label>
            </td>
            <td>
              <div style="display:flex;gap:.3rem">
                <button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" onclick="window.openCrmAutomationModal('${r.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-danger btn-icon" onclick="window.deleteCrmAutomation('${r.id}','${r.name}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
    }).join('') : `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text3)">No automation rules yet — <button class="btn btn-primary btn-sm" onclick="window.openCrmAutomationModal()">Create First Rule</button></td></tr>`}
      </tbody>
    </table>
  `)}
  ${renderPagerHTML(PG, total, pp, cp)}`;
};


/* ══════════════════════════════════════════════════════════════════════════════
   6. PUSH CAMPAIGNS
══════════════════════════════════════════════════════════════════════════════ */
pages['crm-push'] = () => {
  ensureCrm();
  const PG = 'crm-push';
  const all = STATE.crm.pushCampaigns;
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  const totalSent = all.reduce((s, p) => s + (p.sentCount || 0), 0);
  const totalOpen = all.reduce((s, p) => s + (p.openCount || 0), 0);
  const openRate = totalSent > 0 ? ((totalOpen / totalSent) * 100).toFixed(1) : '0.0';

  return `
  ${pageHeader('Push Campaigns', '<span>CRM</span><span class="sep">›</span><span>Push</span>', `
    <button class="btn btn-primary" onclick="window.openCrmPushModal()"><i class="fa-solid fa-plus"></i> New Campaign</button>`)}

  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
    ${[
      ['Total Campaigns', all.length, 'fa-bell', 'var(--acc)'],
      ['Total Sent', fmt(totalSent), 'fa-paper-plane', 'var(--green)'],
      ['Open Rate', openRate + '%', 'fa-envelope-open', 'var(--yellow)'],
      ['Scheduled', all.filter(p => p.status === 'Scheduled').length, 'fa-clock', '#6366f1'],
    ].map(([label, val, icon, color]) => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${color}22;color:${color}"><i class="fa-solid ${icon}"></i></div>
        <div class="stat-info"><div class="stat-label">${label}</div><div class="stat-value">${val}</div></div>
      </div>`).join('')}
  </div>

  ${filterCard(`
    ${fsInput(PG, 'title', 'Title', 'Search campaign...')}
    ${fsSelect(PG, 'status', 'Status', ['All', 'Draft', 'Scheduled', 'Sent', 'Failed'])}
    ${fsActions(PG)}
  `)}

  ${tableWrap(`
    <table>
      <thead>
        <tr><th>#</th><th>Campaign</th><th>Segment</th><th>Scheduled</th><th>Sent</th><th>Opens</th><th>Clicks</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map((p, i) => {
      const openPct = p.sentCount > 0 ? ((p.openCount / p.sentCount) * 100).toFixed(0) : 0;
      return `
          <tr>
            <td>${(cp - 1) * pp + i + 1}</td>
            <td>
              <div style="font-weight:700">${p.title}</div>
              <div style="font-size:.72rem;color:var(--text3);max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.message}</div>
            </td>
            <td style="font-size:.78rem">${segmentName(p.segmentId)}</td>
            <td style="font-size:.72rem;color:var(--text3)">${p.scheduledAt ? new Date(p.scheduledAt).toLocaleString('id-ID') : '—'}</td>
            <td style="font-weight:600">${fmt(p.sentCount || 0)}</td>
            <td><span style="color:var(--green);font-weight:600">${fmt(p.openCount || 0)}</span> <span style="font-size:.7rem;color:var(--text3)">(${openPct}%)</span></td>
            <td style="color:var(--acc);font-weight:600">${fmt(p.clickCount || 0)}</td>
            <td>${badge(p.status, STATUS_COLORS[p.status] || 'secondary')}</td>
            <td>
              <div style="display:flex;gap:.3rem">
                <button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" onclick="window.openCrmPushModal('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                ${p.status === 'Draft' || p.status === 'Scheduled' ? `<button class="btn btn-sm btn-success btn-icon" onclick="window.sendCrmPush('${p.id}')" title="Send Now"><i class="fa-solid fa-paper-plane"></i></button>` : ''}
                <button class="btn btn-sm btn-danger btn-icon" onclick="window.deleteCrmPush('${p.id}','${p.title}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>`;
    }).join('') : `<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text3)">No push campaigns yet — <button class="btn btn-primary btn-sm" onclick="window.openCrmPushModal()">Create First Campaign</button></td></tr>`}
      </tbody>
    </table>
  `)}
  ${renderPagerHTML(PG, total, pp, cp)}`;
};


/* ══════════════════════════════════════════════════════════════════════════════
   MODALS & ACTIONS
══════════════════════════════════════════════════════════════════════════════ */

// ── Segment Modal ─────────────────────────────────────────────────────────────
window.openCrmSegmentModal = (id) => {
  const s = id ? (STATE.crm?.segments || []).find(x => x.id === id) : null;
  const c = s?.criteria || {};
  openModal(id ? 'Edit Segment' : 'New Segment', `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1"><label>Segment Name *</label><input id="seg_name" value="${s?.name || ''}" placeholder="e.g. High Rollers" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Description</label><input id="seg_desc" value="${s?.description || ''}" placeholder="Brief description..." /></div>
    </div>
    <div style="margin:1rem 0;font-weight:700;font-size:.83rem;color:var(--text3);text-transform:uppercase;letter-spacing:.05em">Criteria (leave blank = match all)</div>
    <div class="form-grid">
      <div class="form-field"><label>Company</label>
        <select id="seg_company"><option value="">All Companies</option>${COMPANIES.map(c => `<option value="${c}" ${s?.company === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Member Status</label>
        <select id="seg_status"><option value="">Any</option><option value="Active" ${c.status === 'Active' ? 'selected' : ''}>Active</option><option value="Suspended" ${c.status === 'Suspended' ? 'selected' : ''}>Suspended</option></select>
      </div>
      <div class="form-field"><label>Min Balance (Rp)</label><input id="seg_min_bal" type="number" value="${c.minBalance || ''}" placeholder="0" /></div>
      <div class="form-field"><label>Max Balance (Rp)</label><input id="seg_max_bal" type="number" value="${c.maxBalance || ''}" placeholder="" /></div>
      <div class="form-field"><label>VIP Tier</label>
        <select id="seg_vip"><option value="">Any Tier</option>${(STATE.vipTiers || []).map(t => `<option value="${t.name}" ${c.vipTier === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Inactive Days (≥)</label><input id="seg_inactive" type="number" value="${c.inactiveDays || ''}" placeholder="e.g. 7" /></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveCrmSegment('${id || ''}')"><i class="fa-solid fa-check"></i> Save</button>
  `);
};

window.saveCrmSegment = async (id) => {
  const name = document.getElementById('seg_name')?.value.trim();
  if (!name) { toast('Segment name is required', 'error'); return; }
  const criteria = {};
  const company = document.getElementById('seg_company')?.value;
  const status = document.getElementById('seg_status')?.value;
  const minBal = document.getElementById('seg_min_bal')?.value;
  const maxBal = document.getElementById('seg_max_bal')?.value;
  const vipTier = document.getElementById('seg_vip')?.value;
  const inactive = document.getElementById('seg_inactive')?.value;
  if (company) criteria.company = company;
  if (status) criteria.status = status;
  if (minBal) criteria.minBalance = Number(minBal);
  if (maxBal) criteria.maxBalance = Number(maxBal);
  if (vipTier) criteria.vipTier = vipTier;
  if (inactive) criteria.inactiveDays = Number(inactive);
  if (Number.isFinite(criteria.minBalance) && criteria.minBalance < 0) { toast('Min balance cannot be negative', 'error'); return; }
  if (Number.isFinite(criteria.maxBalance) && criteria.maxBalance < 0) { toast('Max balance cannot be negative', 'error'); return; }
  if (Number.isFinite(criteria.minBalance) && Number.isFinite(criteria.maxBalance) && criteria.maxBalance < criteria.minBalance) { toast('Max balance must be >= min balance', 'error'); return; }
  const seg = { id: id || null, name, description: document.getElementById('seg_desc')?.value, criteria };
  const { error } = await window.db.dbSaveCrmSegment(seg);
  if (error) { toast('Save failed: ' + error.message, 'error'); return; }
  await window.db.dbRefreshSegmentCount(STATE.crm.segments[0]?.id || id);
  closeModalBtn();
  window.go('crm-segments');
  toast(`Segment "${name}" saved ✓`, 'success');
};

window.deleteCrmSegment = async (id, name) => {
  if (!confirm(`Delete segment "${name}"?`)) return;
  const { error } = await window.db.dbDeleteCrmSegment(id);
  if (error) { toast('Delete failed', 'error'); return; }
  window.go('crm-segments');
  toast(`Segment deleted`, 'success');
};

window.refreshSegmentCount = async (id) => {
  const count = await window.db.dbRefreshSegmentCount(id);
  window.go('crm-segments');
  toast(`Segment updated: ${count} members`, 'success');
};

// ── Mission Modal ─────────────────────────────────────────────────────────────
window.openCrmMissionModal = (id, presetSegmentId) => {
  const m = id ? (STATE.crm?.missions || []).find(x => x.id === id) : null;
  openModal(id ? 'Edit Mission' : 'New Mission', `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1"><label>Mission Name *</label><input id="msn_name" value="${m?.name || ''}" placeholder="e.g. Deposit 500k to unlock reward" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Description</label><input id="msn_desc" value="${m?.description || ''}" placeholder="What the player needs to do" /></div>
      <div class="form-field"><label>Type *</label>
        <select id="msn_type">${MISSION_TYPES.map(t => `<option value="${t}" ${m?.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Target Value</label><input id="msn_target" type="number" value="${m?.targetValue || ''}" placeholder="e.g. 500000" /></div>
      <div class="form-field"><label>Reward Type</label>
        <select id="msn_reward_type">${REWARD_TYPES.map(r => `<option value="${r}" ${m?.rewardType === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Reward Amount (Rp)</label><input id="msn_reward_amt" type="number" value="${m?.rewardAmount || ''}" placeholder="e.g. 50000" /></div>
      <div class="form-field"><label>Target Segment</label><select id="msn_segment">${segmentOptions(true)}</select></div>
      <div class="form-field"><label>Max Participants</label><input id="msn_max" type="number" value="${m?.maxParticipants || ''}" placeholder="Leave blank = unlimited" /></div>
      <div class="form-field"><label>Start Date</label><input id="msn_start" type="date" value="${m?.startDate || ''}" /></div>
      <div class="form-field"><label>End Date</label><input id="msn_end" type="date" value="${m?.endDate || ''}" /></div>
      <div class="form-field"><label>Status</label>
        <select id="msn_status"><option value="Draft">Draft</option><option value="Active" ${(!m || m.status === 'Active') ? 'selected' : ''}>Active</option><option value="Paused" ${m?.status === 'Paused' ? 'selected' : ''}>Paused</option></select>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveCrmMission('${id || ''}')"><i class="fa-solid fa-check"></i> Save</button>
  `);
  // Pre-select segment if passed
  if (presetSegmentId) requestAnimationFrame(() => {
    const sel = document.getElementById('msn_segment');
    if (sel) sel.value = presetSegmentId;
  });
};

window.saveCrmMission = async (id) => {
  const name = document.getElementById('msn_name')?.value.trim();
  if (!name) { toast('Mission name is required', 'error'); return; }
  const targetValue = Number(document.getElementById('msn_target')?.value) || 0;
  const rewardAmount = Number(document.getElementById('msn_reward_amt')?.value) || 0;
  const startDate = document.getElementById('msn_start')?.value || null;
  const endDate = document.getElementById('msn_end')?.value || null;
  if (targetValue < 0 || rewardAmount < 0) { toast('Target and reward cannot be negative', 'error'); return; }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) { toast('End date must be after start date', 'error'); return; }
  const mission = {
    id: id || null, name,
    description: document.getElementById('msn_desc')?.value,
    type: document.getElementById('msn_type')?.value,
    targetValue,
    rewardType: document.getElementById('msn_reward_type')?.value,
    rewardAmount,
    segmentId: document.getElementById('msn_segment')?.value || null,
    maxParticipants: Number(document.getElementById('msn_max')?.value) || null,
    startDate,
    endDate,
    status: document.getElementById('msn_status')?.value,
  };
  const { error } = await window.db.dbSaveCrmMission(mission);
  if (error) { toast('Save failed: ' + error.message, 'error'); return; }
  closeModalBtn();
  window.go('crm-missions');
  toast(`Mission "${name}" saved ✓`, 'success');
};

window.toggleCrmMissionStatus = async (id, currentStatus) => {
  const m = (STATE.crm?.missions || []).find(x => x.id === id);
  if (!m) return;
  const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
  const { error } = await window.db.dbSaveCrmMission({ ...m, status: newStatus });
  if (error) { toast('Update failed', 'error'); return; }
  window.go('crm-missions');
  toast(`Mission ${newStatus === 'Active' ? 'activated ✓' : 'paused ⏸'}`, 'success');
};

window.deleteCrmMission = async (id, name) => {
  if (!confirm(`Delete mission "${name}"?`)) return;
  await window.db.dbDeleteCrmMission(id);
  window.go('crm-missions');
  toast('Mission deleted', 'success');
};

// ── Tournament Modal ──────────────────────────────────────────────────────────
window.openCrmTournamentModal = (id) => {
  const t = id ? (STATE.crm?.tournaments || []).find(x => x.id === id) : null;
  const defaultPrizes = JSON.stringify(t?.prizeStructure || [
    { rank: 1, amount: 5000000 }, { rank: 2, amount: 3000000 }, { rank: 3, amount: 1500000 }
  ], null, 2);
  openModal(id ? 'Edit Tournament' : 'New Tournament', `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1"><label>Tournament Name *</label><input id="trn_name" value="${t?.name || ''}" placeholder="e.g. April Slot Mania" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Description</label><input id="trn_desc" value="${t?.description || ''}" /></div>
      <div class="form-field"><label>Total Prize Pool (Rp)</label><input id="trn_prize" type="number" value="${t?.prizePool || ''}" placeholder="10000000" /></div>
      <div class="form-field"><label>Game Type</label>
        <select id="trn_game">${GAME_TYPES.map(g => `<option value="${g}" ${t?.gameType === g ? 'selected' : ''}>${g}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Scoring Metric</label>
        <select id="trn_scoring">${SCORING.map(s => `<option value="${s}" ${t?.scoringMetric === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Target Segment</label><select id="trn_segment">${segmentOptions(true)}</select></div>
      <div class="form-field"><label>Start Date & Time</label><input id="trn_start" type="datetime-local" value="${t?.startDate?.slice(0, 16) || ''}" /></div>
      <div class="form-field"><label>End Date & Time</label><input id="trn_end" type="datetime-local" value="${t?.endDate?.slice(0, 16) || ''}" /></div>
      <div class="form-field"><label>Max Participants</label><input id="trn_max" type="number" value="${t?.maxParticipants || ''}" placeholder="Unlimited" /></div>
      <div class="form-field" style="grid-column:1/-1">
        <label>Prize Structure (JSON)</label>
        <textarea id="trn_prizes" rows="5" style="font-family:monospace;font-size:.8rem;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:.5rem;width:100%;color:var(--text)">${defaultPrizes}</textarea>
        <div style="font-size:.7rem;color:var(--text3)">Format: [{"rank": 1, "amount": 5000000}, ...]</div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveCrmTournament('${id || ''}')"><i class="fa-solid fa-check"></i> Save</button>
  `);
};

window.saveCrmTournament = async (id) => {
  const name = document.getElementById('trn_name')?.value.trim();
  if (!name) { toast('Tournament name is required', 'error'); return; }
  const prizePool = Number(document.getElementById('trn_prize')?.value) || 0;
  const startDate = document.getElementById('trn_start')?.value || null;
  const endDate = document.getElementById('trn_end')?.value || null;
  if (prizePool < 0) { toast('Prize pool cannot be negative', 'error'); return; }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) { toast('End date must be after start date', 'error'); return; }
  let prizeStructure = [];
  try { prizeStructure = JSON.parse(document.getElementById('trn_prizes')?.value || '[]'); } catch (e) { toast('Invalid JSON in prize structure', 'error'); return; }
  const t = {
    id: id || null, name,
    description: document.getElementById('trn_desc')?.value,
    prizePool,
    prizeStructure, gameType: document.getElementById('trn_game')?.value,
    scoringMetric: document.getElementById('trn_scoring')?.value,
    segmentId: document.getElementById('trn_segment')?.value || null,
    startDate,
    endDate,
    maxParticipants: Number(document.getElementById('trn_max')?.value) || null,
    status: id ? undefined : 'Draft',
  };
  const { error } = await window.db.dbSaveCrmTournament(t);
  if (error) { toast('Save failed: ' + error.message, 'error'); return; }
  closeModalBtn();
  window.go('crm-tournaments');
  toast(`Tournament "${name}" saved ✓`, 'success');
};

window.startTournament = async (id) => {
  const t = (STATE.crm?.tournaments || []).find(x => x.id === id);
  if (!t) return;
  await window.db.dbSaveCrmTournament({ ...t, status: 'Active' });
  window.go('crm-tournaments');
  toast('Tournament started ✓', 'success');
};

window.endTournament = async (id) => {
  if (!confirm('End this tournament? This cannot be undone.')) return;
  const t = (STATE.crm?.tournaments || []).find(x => x.id === id);
  if (!t) return;
  await window.db.dbSaveCrmTournament({ ...t, status: 'Ended' });
  window.go('crm-tournaments');
  toast('Tournament ended', 'success');
};

window.deleteCrmTournament = async (id, name) => {
  if (!confirm(`Delete tournament "${name}"?`)) return;
  await window.db.dbDeleteCrmTournament(id);
  window.go('crm-tournaments');
  toast('Tournament deleted', 'success');
};

// ── Automation Modal ──────────────────────────────────────────────────────────
window.openCrmAutomationModal = (id) => {
  const r = id ? (STATE.crm?.automationRules || []).find(x => x.id === id) : null;
  const defaultCond = JSON.stringify(r?.conditions || [{ field: 'amount', op: 'gte', value: 100000 }], null, 2);
  const defaultAct = JSON.stringify(r?.actions || [{ type: 'send_bonus', amount: 10000 }], null, 2);
  openModal(id ? 'Edit Automation Rule' : 'New Automation Rule', `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1"><label>Rule Name *</label><input id="aut_name" value="${r?.name || ''}" placeholder="e.g. Welcome Bonus on First Deposit" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Description</label><input id="aut_desc" value="${r?.description || ''}" /></div>
      <div class="form-field"><label>Trigger Event *</label>
        <select id="aut_trigger">${TRIGGER_EVENTS.map(e => `<option value="${e}" ${r?.triggerEvent === e ? 'selected' : ''}>${e}</option>`).join('')}</select>
      </div>
      <div class="form-field"><label>Status</label>
        <select id="aut_status"><option value="Active" ${(!r || r.status === 'Active') ? 'selected' : ''}>Active</option><option value="Paused" ${r?.status === 'Paused' ? 'selected' : ''}>Paused</option></select>
      </div>
      <div class="form-field" style="grid-column:1/-1">
        <label>Conditions (JSON)</label>
        <textarea id="aut_conditions" rows="4" style="font-family:monospace;font-size:.8rem;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:.5rem;width:100%;color:var(--text)">${defaultCond}</textarea>
        <div style="font-size:.7rem;color:var(--text3)">Fields: amount, company, vip_tier, member_age_days, bet_count. Ops: eq, neq, gte, lte, contains</div>
      </div>
      <div class="form-field" style="grid-column:1/-1">
        <label>Actions (JSON)</label>
        <textarea id="aut_actions" rows="4" style="font-family:monospace;font-size:.8rem;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:.5rem;width:100%;color:var(--text)">${defaultAct}</textarea>
        <div style="font-size:.7rem;color:var(--text3)">Types: send_bonus, send_memo, add_points, send_push, change_tier, tag_segment, block_member, flag_review</div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveCrmAutomation('${id || ''}')"><i class="fa-solid fa-check"></i> Save Rule</button>
  `);
};

window.saveCrmAutomation = async (id) => {
  const name = document.getElementById('aut_name')?.value.trim();
  if (!name) { toast('Rule name is required', 'error'); return; }
  let conditions = [], actions = [];
  try { conditions = JSON.parse(document.getElementById('aut_conditions')?.value || '[]'); } catch (e) { toast('Invalid JSON in conditions', 'error'); return; }
  try { actions = JSON.parse(document.getElementById('aut_actions')?.value || '[]'); } catch (e) { toast('Invalid JSON in actions', 'error'); return; }
  const rule = {
    id: id || null, name,
    description: document.getElementById('aut_desc')?.value,
    triggerEvent: document.getElementById('aut_trigger')?.value,
    conditions, actions,
    status: document.getElementById('aut_status')?.value,
  };
  const { error } = await window.db.dbSaveCrmAutomation(rule);
  if (error) { toast('Save failed: ' + error.message, 'error'); return; }
  closeModalBtn();
  window.go('crm-automation');
  toast(`Rule "${name}" saved ✓`, 'success');
};

window.toggleCrmAutomation = async (id, enabled) => {
  const r = (STATE.crm?.automationRules || []).find(x => x.id === id);
  if (!r) return;
  await window.db.dbSaveCrmAutomation({ ...r, status: enabled ? 'Active' : 'Paused' });
  window.go('crm-automation');
  toast(`Rule ${enabled ? 'activated ✓' : 'paused ⏸'}`, 'success');
};

window.deleteCrmAutomation = async (id, name) => {
  if (!confirm(`Delete rule "${name}"?`)) return;
  await window.db.dbDeleteCrmAutomation(id);
  window.go('crm-automation');
  toast('Rule deleted', 'success');
};

// ── Push Campaign Modal ───────────────────────────────────────────────────────
window.openCrmPushModal = (id) => {
  const p = id ? (STATE.crm?.pushCampaigns || []).find(x => x.id === id) : null;
  openModal(id ? 'Edit Push Campaign' : 'New Push Campaign', `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1"><label>Title *</label><input id="psh_title" value="${p?.title || ''}" placeholder="e.g. Exclusive Weekend Bonus 50%!" /></div>
      <div class="form-field" style="grid-column:1/-1"><label>Message *</label><textarea id="psh_msg" rows="3" placeholder="Message body...">${p?.message || ''}</textarea></div>
      <div class="form-field"><label>Target Segment</label><select id="psh_segment">${segmentOptions(true)}</select></div>
      <div class="form-field"><label>Schedule (optional)</label><input id="psh_schedule" type="datetime-local" value="${p?.scheduledAt?.slice(0, 16) || ''}" /></div>
      <div class="form-field"><label>Image URL</label><input id="psh_img" value="${p?.imageUrl || ''}" placeholder="https://..." /></div>
      <div class="form-field"><label>Action URL</label><input id="psh_url" value="${p?.actionUrl || ''}" placeholder="https://..." /></div>
    </div>
    <div style="margin-top:1rem;padding:.75rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
      <div style="font-size:.75rem;color:var(--text3);margin-bottom:.5rem">Preview</div>
      <div id="pushPreview" style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:.75rem;max-width:300px">
        <div style="font-weight:700;font-size:.88rem" id="pshPrevTitle">${p?.title || 'Push Title'}</div>
        <div style="font-size:.78rem;color:var(--text3);margin-top:.25rem" id="pshPrevMsg">${p?.message || 'Push message...'}</div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-warning" onclick="window.saveCrmPush('${id || ''}','Draft')">Save Draft</button>
    <button class="btn btn-primary" onclick="window.saveCrmPush('${id || ''}','Scheduled')"><i class="fa-solid fa-paper-plane"></i> Save & Schedule</button>
  `);
  // Live preview
  requestAnimationFrame(() => {
    const titleEl = document.getElementById('psh_title');
    const msgEl = document.getElementById('psh_msg');
    if (titleEl) titleEl.oninput = e => { const el = document.getElementById('pshPrevTitle'); if (el) el.textContent = e.target.value || 'Push Title'; };
    if (msgEl) msgEl.oninput = e => { const el = document.getElementById('pshPrevMsg'); if (el) el.textContent = e.target.value || 'Push message...'; };
  });
};

window.saveCrmPush = async (id, status) => {
  const title = document.getElementById('psh_title')?.value.trim();
  const message = document.getElementById('psh_msg')?.value.trim();
  if (!title || !message) { toast('Title and message are required', 'error'); return; }
  if (title.length > 120) { toast('Title is too long (max 120 chars)', 'error'); return; }
  const scheduledAt = document.getElementById('psh_schedule')?.value || null;
  if (status === 'Scheduled' && !scheduledAt) { toast('Schedule date/time is required', 'error'); return; }
  const push = {
    id: id || null, title, message, status,
    segmentId: document.getElementById('psh_segment')?.value || null,
    scheduledAt,
    imageUrl: document.getElementById('psh_img')?.value || null,
    actionUrl: document.getElementById('psh_url')?.value || null,
  };
  const { error } = await window.db.dbSaveCrmPush(push);
  if (error) { toast('Save failed: ' + error.message, 'error'); return; }
  closeModalBtn();
  window.go('crm-push');
  toast(`Campaign "${title}" saved ✓`, 'success');
};

window.sendCrmPush = async (id) => {
  const p = (STATE.crm?.pushCampaigns || []).find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Send push "${p.title}" to ${segmentName(p.segmentId)} segment now?`)) return;
  // Count segment members
  const segMembers = p.segmentId
    ? (STATE.crm?.segments || []).find(s => s.id === p.segmentId)?.memberCount || 0
    : (STATE.members || []).length;
  const { error } = await window.db.dbSaveCrmPush({ ...p, status: 'Sent', sentAt: new Date().toISOString(), sentCount: segMembers });
  if (error) { toast('Send failed: ' + error.message, 'error'); return; }
  window.go('crm-push');
  toast(`Push sent to ${fmt(segMembers)} members ✓`, 'success');
};

window.deleteCrmPush = async (id, title) => {
  if (!confirm(`Delete campaign "${title}"?`)) return;
  await window.db.dbDeleteCrmPush(id);
  window.go('crm-push');
  toast('Campaign deleted', 'success');
};

/* ══════════════════════════════════════════════════════════════════════════════
   LOTTERY BUSINESS CRM ENHANCEMENTS (Feature #1)
   Segment templates, mission templates, dormancy analysis, game-type insights
══════════════════════════════════════════════════════════════════════════════ */

// ── Lottery Segment Templates ──
const LOTTERY_SEGMENT_TEMPLATES = [
  {
    name: 'Togel Lovers', icon: 'fa-hashtag', color: '#6366f1',
    description: 'Members who primarily bet on lottery pools (Togel)',
    criteria: { gameType: 'togel', minBetCount: 5 },
  },
  {
    name: 'Slot High Rollers', icon: 'fa-slot-machine', color: '#f59e0b',
    description: 'High-value slot players with significant turnover',
    criteria: { gameType: 'slot', minTurnover: 5000000 },
  },
  {
    name: 'Deposit Streak (3+)', icon: 'fa-fire', color: '#ef4444',
    description: 'Members who have deposited on 3+ consecutive days',
    criteria: { depositStreakDays: 3 },
  },
  {
    name: 'Dormant 7 Days', icon: 'fa-moon', color: '#64748b',
    description: 'Members inactive for 7+ days — reactivation targets',
    criteria: { inactiveDays: 7 },
  },
  {
    name: 'Dormant 30 Days', icon: 'fa-bed', color: '#475569',
    description: 'Members inactive for 30+ days — at risk of churn',
    criteria: { inactiveDays: 30 },
  },
  {
    name: 'First Deposit Pending', icon: 'fa-user-clock', color: '#0ea5e9',
    description: 'Registered but haven\'t deposited yet',
    criteria: { neverDeposited: true },
  },
  {
    name: 'VIP Diamond', icon: 'fa-gem', color: '#b9f2ff',
    description: 'Highest VIP tier members — premium treatment',
    criteria: { vipTier: 'Diamond' },
  },
  {
    name: 'Referral Champions', icon: 'fa-user-group', color: '#22c55e',
    description: 'Members who have referred 3+ people',
    criteria: { minReferrals: 3 },
  },
];

// ── Lottery Mission Templates ──
const LOTTERY_MISSION_TEMPLATES = [
  { name: 'Pasang 10x Togel', type: 'Bet', targetValue: 10, rewardType: 'Bonus', rewardAmount: 50000, description: 'Bet on any togel pool 10 times' },
  { name: 'Deposit 3 Hari Berturut', type: 'Deposit', targetValue: 3, rewardType: 'Freebet', rewardAmount: 1, description: 'Deposit on 3 consecutive days' },
  { name: 'Login 7 Hari', type: 'Login', targetValue: 7, rewardType: 'Points', rewardAmount: 100, description: 'Login every day for 7 days' },
  { name: 'Ajak 3 Teman', type: 'Referral', targetValue: 3, rewardType: 'Cash', rewardAmount: 150000, description: 'Refer 3 new members who deposit' },
  { name: 'TO Rp 5 Juta', type: 'Turnover', targetValue: 5000000, rewardType: 'Bonus', rewardAmount: 100000, description: 'Achieve Rp 5M turnover' },
  { name: 'Slot 20 Round', type: 'Bet', targetValue: 20, rewardType: 'Freebet', rewardAmount: 5, description: 'Spin slots 20 times' },
];

// ── Dormancy Analysis ──
function computeDormancy() {
  const members = STATE.members || [];
  const now = Date.now();
  const DAY = 86400000;

  return members.map(m => {
    // Last activity: last bet or last deposit
    const lastBetDate = [...(STATE.lotteryBets || []).filter(b => b.member === m.username)]
      .map(b => new Date(b.date || b.drawDate || 0).getTime()).reduce((a, b) => Math.max(a, b), 0);
    const lastDepDate = [...(STATE.deposits || []).filter(d => d.member === m.username && d.status === 'Approved')]
      .map(d => new Date(d.date || 0).getTime()).reduce((a, b) => Math.max(a, b), 0);
    const lastActivity = Math.max(lastBetDate, lastDepDate, new Date(m.joinDate || m.joined || 0).getTime());
    const inactiveDays = lastActivity > 0 ? Math.floor((now - lastActivity) / DAY) : null;

    // Favorite game type from bets
    const bets = (STATE.lotteryBets || []).filter(b => b.member === m.username);
    const slotBets = (STATE.seamless?.transactions || []).filter(t => t.player === m.username).length;
    const favoriteGame = bets.length >= slotBets ? 'Togel' : 'Slot';

    // Deposit streak
    const depDates = [...new Set((STATE.deposits || [])
      .filter(d => d.member === m.username && d.status === 'Approved')
      .map(d => d.date?.slice(0, 10) || ''))].filter(Boolean).sort().reverse();
    let streak = 0;
    const todayISO = new Date().toISOString().slice(0, 10);
    depDates.forEach((d, i) => {
      const expectedDate = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      if (d === expectedDate) streak++;
    });

    return { ...m, inactiveDays, favoriteGame, depositStreak: streak };
  });
}

// ── Loyalty Points Calculator ──
function getMemberLoyaltyPoints(username) {
  const bets = (STATE.lotteryBets || []).filter(b => b.member === username);
  const txs = (STATE.seamless?.transactions || []).filter(t => t.player === username);
  const totalTO = bets.reduce((s, b) => s + (b.betAmount || 0), 0) + txs.reduce((s, t) => s + (t.betAmount || 0), 0);
  const dbPoints = (STATE.crm?.loyaltyPoints || []).filter(p => p.member === username).reduce((s, p) => s + (p.points || 0), 0);
  // 1 point per Rp 10,000 turnover + DB points
  return dbPoints + Math.floor(totalTO / 10000);
}

// ── Quick Actions: Lottery CRM ──
window.createLotterySegment = (templateIdx) => {
  const tpl = LOTTERY_SEGMENT_TEMPLATES[templateIdx];
  if (!tpl) return;
  ensureCrm();
  const existing = STATE.crm.segments.find(s => s.name === tpl.name);
  if (existing) { toast('Segment already exists: ' + tpl.name, 'warning'); return; }

  // Compute member count
  const members = computeDormancy();
  let count = 0;
  const crit = tpl.criteria;
  members.forEach(m => {
    if (crit.inactiveDays && m.inactiveDays >= crit.inactiveDays) { count++; return; }
    if (crit.neverDeposited) {
      const hasDep = (STATE.deposits || []).some(d => d.member === m.username && d.status === 'Approved');
      if (!hasDep) { count++; return; }
    }
    if (crit.depositStreakDays && m.depositStreak >= crit.depositStreakDays) { count++; return; }
    if (crit.vipTier && m.vipLevel === crit.vipTier) { count++; return; }
    if (crit.minReferrals) {
      const refs = (STATE.members || []).filter(x => x.referredBy === m.username).length;
      if (refs >= crit.minReferrals) { count++; return; }
    }
    if (crit.gameType === 'togel') {
      if ((STATE.lotteryBets || []).filter(b => b.member === m.username).length >= (crit.minBetCount || 1)) { count++; return; }
    }
    if (crit.gameType === 'slot') {
      const to = (STATE.seamless?.transactions || []).filter(t => t.player === m.username).reduce((s, t) => s + (t.betAmount || 0), 0);
      if (to >= (crit.minTurnover || 0)) { count++; return; }
    }
  });

  const seg = {
    id: 'SEG_LTR_' + Date.now().toString().slice(-6),
    name: tpl.name,
    description: tpl.description,
    criteria: crit,
    company: '',
    status: 'Active',
    memberCount: count,
    createdBy: STATE.profile.username,
    createdAt: new Date().toISOString(),
  };
  STATE.crm.segments.push(seg);
  if (window.db?.dbSaveCrmSegment) window.db.dbSaveCrmSegment(seg);
  saveState();
  go('crm-segments');
  toast(`Segment "${tpl.name}" created with ${count} members`, 'success');
};

window.createLotteryMission = (tplIdx) => {
  const tpl = LOTTERY_MISSION_TEMPLATES[tplIdx];
  if (!tpl) return;
  ensureCrm();
  const mission = {
    id: 'MSN_LTR_' + Date.now().toString().slice(-6),
    name: tpl.name,
    type: tpl.type,
    targetValue: tpl.targetValue,
    rewardType: tpl.rewardType,
    rewardAmount: tpl.rewardAmount,
    segmentId: '',
    company: STATE.currentAdmin.company || '',
    status: 'Active',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    participants: 0,
    completions: 0,
  };
  STATE.crm.missions.push(mission);
  if (window.db?.dbSaveCrmMission) window.db.dbSaveCrmMission(mission);
  saveState();
  go('crm-missions');
  toast(`Mission "${tpl.name}" created`, 'success');
};

// ── Dormancy Report Page ──
pages['crm-dormancy'] = () => {
  const members = computeDormancy().filter(m => m.inactiveDays !== null && m.inactiveDays >= 3)
    .sort((a, b) => b.inactiveDays - a.inactiveDays).slice(0, 50);

  return `
  ${pageHeader('Dormancy Report', '<span>CRM</span><span class="sep">›</span><span>Dormancy</span>', `
    <div style="display:flex;gap:.5rem">
      <button class="btn btn-primary btn-sm" onclick="window.createDormancyPush()"><i class="fa-solid fa-bell"></i> Push to Dormant</button>
      <button class="btn btn-secondary btn-sm" onclick="window.go('crm-segments')"><i class="fa-solid fa-layer-group"></i> Create Segment</button>
    </div>`)}

  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:1.25rem">
    ${[
      ['7+ Days Inactive', computeDormancy().filter(m => m.inactiveDays >= 7).length, '#64748b', 'fa-moon'],
      ['30+ Days Inactive', computeDormancy().filter(m => m.inactiveDays >= 30).length, '#ef4444', 'fa-bed'],
      ['Never Deposited', (STATE.members || []).filter(m => !(STATE.deposits || []).some(d => d.member === m.username && d.status === 'Approved')).length, '#f59e0b', 'fa-user-clock'],
      ['Active (Last 7d)', computeDormancy().filter(m => m.inactiveDays !== null && m.inactiveDays < 7).length, '#22c55e', 'fa-bolt'],
    ].map(([label, val, color, icon]) => `
      <div class="stat-card">
        <div class="stat-icon" style="background:${color}22;color:${color}"><i class="fa-solid ${icon}"></i></div>
        <div class="stat-info"><div class="stat-label">${label}</div><div class="stat-value">${fmt(val)}</div></div>
      </div>`).join('')}
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title"><i class="fa-solid fa-moon" style="color:var(--text3);margin-right:.5rem"></i>Dormant Members</span></div>
    <div class="card-body" style="padding:0">
      ${tableWrap(`
        <table>
          <thead><tr><th>Username</th><th>Company</th><th>Inactive (Days)</th><th>Favorite Game</th><th>Deposit Streak</th><th>Last TO</th><th>Action</th></tr></thead>
          <tbody>
            ${members.map(m => {
      const totalTO = (STATE.lotteryBets || []).filter(b => b.member === m.username).reduce((s, b) => s + (b.betAmount || 0), 0)
        + (STATE.seamless?.transactions || []).filter(t => t.player === m.username).reduce((s, t) => s + (t.betAmount || 0), 0);
      const risk = m.inactiveDays >= 30 ? 'danger' : m.inactiveDays >= 14 ? 'warning' : 'secondary';
      return `
                <tr>
                  <td><strong>${m.username}</strong></td>
                  <td style="font-size:.78rem">${m.company}</td>
                  <td>${badge(m.inactiveDays + 'd', risk)}</td>
                  <td><span class="badge badge-indigo">${m.favoriteGame}</span></td>
                  <td>${m.depositStreak > 0 ? `<span style="color:var(--green);font-weight:700">${m.depositStreak} days</span>` : '—'}</td>
                  <td>${fmtCur(totalTO)}</td>
                  <td>
                    <button class="btn btn-xs btn-primary" onclick="window.pushToDormantMember('${m.username}','${m.favoriteGame}')">
                      <i class="fa-solid fa-bell"></i> Push
                    </button>
                  </td>
                </tr>`;
    }).join('')}
          </tbody>
        </table>
      `)}
    </div>
  </div>`;
};

window.pushToDormantMember = (username, favoriteGame) => {
  openModal('Quick Push: ' + username, `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1"><label>Message (personalized)</label>
        <textarea id="dormant_push_msg" rows="3">Hai ${username}! Kami kangen kamu 😊 Yuk balik dan coba keberuntunganmu di ${favoriteGame}. Ada bonus spesial menunggumu! 🎰</textarea>
      </div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
     <button class="btn btn-primary" onclick="window.sendDormantPush('${username}')">Send Push</button>`);
};

window.sendDormantPush = (username) => {
  const msg = document.getElementById('dormant_push_msg')?.value?.trim();
  if (!msg) { toast('Message required', 'error'); return; }
  ensureCrm();
  const push = {
    id: 'PUSH_D_' + Date.now().toString().slice(-6),
    title: 'Kami Kangen Kamu! 🎰',
    message: msg,
    segmentId: null,
    targetMember: username,
    status: 'Sent',
    sentAt: new Date().toISOString(),
    sentCount: 1,
    openCount: 0,
    clickCount: 0,
    createdAt: new Date().toISOString(),
  };
  STATE.crm.pushCampaigns.unshift(push);
  if (window.db?.dbSaveCrmPush) window.db.dbSaveCrmPush(push);
  saveState();
  closeModalBtn();
  toast(`Push sent to ${username}`, 'success');
};

window.createDormancyPush = () => {
  ensureCrm();
  const dormant = computeDormancy().filter(m => m.inactiveDays >= 7);
  const push = {
    id: 'PUSH_DRMT_' + Date.now().toString().slice(-6),
    title: 'Kami Kangen Kamu! Yuk Kembali 🎰',
    message: 'Lama nggak main? Ada bonus comeback spesial buat kamu. Klaim sekarang sebelum kedaluwarsa!',
    segmentId: null,
    status: 'Sent',
    sentAt: new Date().toISOString(),
    sentCount: dormant.length,
    openCount: 0,
    clickCount: 0,
    createdAt: new Date().toISOString(),
  };
  STATE.crm.pushCampaigns.unshift(push);
  if (window.db?.dbSaveCrmPush) window.db.dbSaveCrmPush(push);
  saveState();
  go('crm-push');
  toast(`Dormancy push sent to ${dormant.length} members`, 'success');
};

// ── Loyalty Points Page ──
pages['crm-loyalty'] = () => {
  const members = (STATE.members || []).map(m => ({
    ...m,
    points: getMemberLoyaltyPoints(m.username),
    totalTO: (STATE.lotteryBets || []).filter(b => b.member === m.username).reduce((s, b) => s + (b.betAmount || 0), 0)
      + (STATE.seamless?.transactions || []).filter(t => t.player === m.username).reduce((s, t) => s + (t.betAmount || 0), 0),
  })).sort((a, b) => b.points - a.points).slice(0, 30);

  return `
  ${pageHeader('Loyalty Points', '<span>CRM</span><span class="sep">›</span><span>Loyalty</span>', `
    <button class="btn btn-primary btn-sm" onclick="window.awardBonusPoints()"><i class="fa-solid fa-plus"></i> Award Points</button>`)}

  <div class="card">
    <div class="card-header"><span class="card-title"><i class="fa-solid fa-star" style="color:var(--yellow)"></i> Member Points Leaderboard</span>
      <span style="font-size:.72rem;color:var(--text3);margin-left:auto">1 point = Rp 10,000 turnover</span>
    </div>
    <div class="card-body" style="padding:0">
      ${tableWrap(`
        <table>
          <thead><tr><th>Rank</th><th>Member</th><th>Company</th><th>Points</th><th>Turnover</th><th>DB Bonus Pts</th><th>Action</th></tr></thead>
          <tbody>
            ${members.map((m, i) => {
    const dbPts = (STATE.crm?.loyaltyPoints || []).filter(p => p.member === m.username).reduce((s, p) => s + (p.points || 0), 0);
    return `
                <tr>
                  <td><strong style="color:${i < 3 ? 'var(--yellow)' : 'var(--text)'}">#${i + 1}</strong></td>
                  <td><strong>${m.username}</strong></td>
                  <td style="font-size:.78rem">${m.company}</td>
                  <td><span style="font-size:1rem;font-weight:800;color:var(--yellow)">${fmt(m.points)}</span> pts</td>
                  <td>${fmtCur(m.totalTO)}</td>
                  <td style="color:var(--acc)">${fmt(dbPts)}</td>
                  <td>
                    <button class="btn btn-xs btn-primary" onclick="window.awardBonusPoints('${m.username}')">
                      <i class="fa-solid fa-gift"></i> Award
                    </button>
                  </td>
                </tr>`;
  }).join('')}
          </tbody>
        </table>
      `)}
    </div>
  </div>`;
};

window.awardBonusPoints = (username = '') => {
  openModal('Award Bonus Points', `
    <div class="form-grid">
      <div class="form-field"><label>Member</label><input id="ap_user" value="${username}" placeholder="username"/></div>
      <div class="form-field"><label>Points</label><input id="ap_pts" type="number" value="100" min="1"/></div>
      <div class="form-field" style="grid-column:1/-1"><label>Reason</label><input id="ap_reason" value="Bonus Points Award" placeholder="e.g. Birthday reward"/></div>
    </div>`,
    `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
     <button class="btn btn-primary" onclick="window.saveAwardPoints()">Award</button>`
  );
};

window.saveAwardPoints = async () => {
  const user = document.getElementById('ap_user')?.value?.trim();
  const pts = parseInt(document.getElementById('ap_pts')?.value || '0', 10);
  const reason = document.getElementById('ap_reason')?.value || 'Award';
  if (!user || !pts) { toast('Member and points required', 'error'); return; }
  if (pts < 1) { toast('Points must be at least 1', 'error'); return; }
  if (window.db?.dbAddLoyaltyPoints) {
    await window.db.dbAddLoyaltyPoints(user, pts, 'award', reason);
  } else {
    ensureCrm();
    STATE.crm.loyaltyPoints.push({ id: 'LP' + Date.now(), member: user, points: pts, event: 'award', note: reason, source: 'manual', createdAt: new Date().toISOString() });
    saveState();
  }
  closeModalBtn(); go('crm-loyalty'); toast(`${pts} points awarded to ${user}`, 'success');
};

// ── Expose lottery template data ──
window.openCrmPushModal = (id) => {
  const p = id ? (STATE.crm?.pushCampaigns || []).find(x => x.id === id) : null;
  openModal(id ? 'Edit Push Campaign' : 'New Push Campaign', `
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:2rem">
        <!-- Form Side -->
        <div class="form-grid" style="display:flex;flex-direction:column;gap:1.2rem">
            <div class="form-field"><label>Campaign Title *</label>
                <input id="push_title" value="${p?.title || ''}" placeholder="e.g. 🔥 Weekend Bonus 500k!" onkeyup="document.getElementById('mock_title').innerText=this.value || 'Campaign Title'" />
            </div>
            <div class="form-field"><label>Message Content *</label>
                <textarea id="push_message" rows="4" placeholder="Type your sweet message here..." onkeyup="document.getElementById('mock_body').innerText=this.value || 'Message content preview...'">${p?.message || ''}</textarea>
            </div>
            <div class="form-field"><label>Target Segment</label><select id="push_segment">${segmentOptions(true)}</select></div>
            <div class="form-field"><label>Call to Action Link</label>
                <input id="push_cta" value="${p?.cta || ''}" placeholder="e.g. https://vigor.com/promo" />
            </div>
            <div class="form-field"><label>Schedule Send (Leave blank for immediate)</label>
                <input id="push_schedule" type="datetime-local" value="${p?.scheduledAt?.slice(0, 16) || ''}" />
            </div>
        </div>
        
        <!-- Mobile Preview Side -->
        <div style="background:#0f172a;border-radius:24px;border:8px solid #1e293b;padding:1rem;height:380px;position:relative;box-shadow:0 10px 25px rgba(0,0,0,0.5)">
            <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:120px;height:20px;background:#1e293b;border-bottom-left-radius:12px;border-bottom-right-radius:12px"></div>
            <div style="background:url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop') center/cover;width:100%;height:100%;border-radius:12px;position:relative;padding:1rem;padding-top:3rem">
                <!-- Push Notification Bubble -->
                <div style="background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border-radius:12px;padding:1rem;box-shadow:0 4px 15px rgba(0,0,0,0.2);animation: slideDown 0.5s ease-out">
                    <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
                        <div style="width:20px;height:20px;background:var(--acc);border-radius:4px;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-bolt" style="color:#fff;font-size:.6rem"></i></div>
                        <div style="font-size:.7rem;font-weight:700;color:#333">VIGOR BERSAMA</div>
                        <div style="font-size:.65rem;color:#666;margin-left:auto">now</div>
                    </div>
                    <div id="mock_title" style="font-weight:800;font-size:.85rem;color:#111;margin-bottom:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p?.title || 'Campaign Title'}</div>
                    <div id="mock_body" style="font-size:.75rem;color:#444;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p?.message || 'Message content preview will appear here in real-time as you type.'}</div>
                </div>
            </div>
            <style>@keyframes slideDown { from { transform:translateY(-20px);opacity:0 } to { transform:translateY(0);opacity:1 } }</style>
        </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveCrmPush('${id || ''}')"><i class="fa-solid fa-paper-plane"></i> Save & Queue</button>
  `);
};

window.saveCrmPush = async (id) => {
  const title = document.getElementById('push_title')?.value.trim();
  const message = document.getElementById('push_message')?.value.trim();
  if (!title || !message) { toast('Title and message are required', 'error'); return; }
  const schedule = document.getElementById('push_schedule')?.value;
  const p = {
    id: id || 'PUSH_' + Date.now().toString().slice(-6),
    title, message,
    segmentId: document.getElementById('push_segment')?.value || null,
    cta: document.getElementById('push_cta')?.value || '',
    status: schedule ? 'Scheduled' : 'Draft',
    scheduledAt: schedule || null,
    sentCount: 0, openCount: 0, clickCount: 0,
    createdAt: new Date().toISOString()
  };
  ensureCrm();
  const existingIdx = STATE.crm.pushCampaigns.findIndex(x => x.id === p.id);
  if (existingIdx >= 0) STATE.crm.pushCampaigns[existingIdx] = Object.assign(STATE.crm.pushCampaigns[existingIdx], p);
  else STATE.crm.pushCampaigns.unshift(p);
  if (window.db?.dbSaveCrmPush) window.db.dbSaveCrmPush(p);
  saveState();
  closeModalBtn();
  window.go('crm-push');
  toast('Push campaign saved', 'success');
};

window.sendCrmPush = (id) => {
  if (!confirm('Are you sure you want to broadcast this Push Notification now?')) return;
  const p = STATE.crm.pushCampaigns.find(x => x.id === id);
  if (p) {
    p.status = 'Sent';
    p.sentAt = new Date().toISOString();
    p.sentCount = Math.floor(Math.random() * 500) + 50; // Mock delivery
    saveState();
    window.go('crm-push');
    toast('Broadcast Sent Successfully! 🚀', 'success');
  }
};

window.deleteCrmPush = (id) => {
  if (!confirm('Delete this push campaign?')) return;
  STATE.crm.pushCampaigns = STATE.crm.pushCampaigns.filter(x => x.id !== id);
  saveState();
  window.go('crm-push');
  toast('Push campaign deleted', 'success');
};

window.LOTTERY_SEGMENT_TEMPLATES = LOTTERY_SEGMENT_TEMPLATES;
window.LOTTERY_MISSION_TEMPLATES = LOTTERY_MISSION_TEMPLATES;
window.computeDormancy = computeDormancy;
window.getMemberLoyaltyPoints = getMemberLoyaltyPoints;
