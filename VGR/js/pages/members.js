/* ─── MEMBER LIST PAGES ─── */
import { STATE, fmt, fmtCur } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsDateFilter, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, exportBtn } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, COMPANIES, STATUSES, BANKS } from '../utils/helpers.js';

pages['global-member-list'] = () => {
  const PG = 'global-member-list';
  const curAdmin = STATE.currentAdmin;

  // Authorization Logic: Filter members based on admin level
  let rawData = STATE.members;
  if (curAdmin.role === 'Company') {
    rawData = STATE.members.filter(m => m.company === curAdmin.company);
  } else if (curAdmin.role === 'Shop') {
    rawData = STATE.members.filter(m => m.company === curAdmin.company && m.shopId === curAdmin.shop);
  }

  const filtered = filterData(rawData, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Global Member List', '<span>Main</span><span class="sep">›</span><span>Member List</span>', `
      ${exportBtn('members.csv', 'Export CSV')}
      <button class="btn btn-primary" onclick="window.openFormModal('member')"><i class="fa-solid fa-plus"></i> Add Member</button>
    `)}
    
    ${filterCard(`
      ${fsInput(PG, 'username', 'Username', 'Search user...')}
      ${fsInput(PG, 'name', 'Full Name', 'Search name...')}
      ${fsSelect(PG, 'company', 'Company', ['All', ...COMPANIES])}
      ${fsDateFilter(PG, 'startDate', 'endDate', 'Joined Date')}
      ${fsActions(PG)}
    `)}

    ${tableWrap(`
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Company</th>
            <th>Phone</th>
            <th>Bank Info</th>
            <th>Balance</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(m => `
            <tr>
              <td>
                <div style="font-weight:600;color:var(--acc);cursor:pointer" onclick="window.showMember('${m.username}')" title="View Detail">
                  ${m.username} <i class="fa-solid fa-circle-info" style="font-size:.65rem;opacity:.5"></i>
                </div>
                <div style="font-size:.7rem;color:var(--text3)">${m.id}</div>
              </td>
              <td>${m.name}</td>
              <td>${m.company}</td>
              <td>${m.phone}</td>
              <td><div style="font-weight:500">${m.bank}</div><div style="font-size:.7rem;color:var(--text3)">${m.bankAccount}</div></td>
              <td style="font-weight:600">${fmtCur(m.balance)}</td>
              <td>
                <button onclick="window.toggleMemberStatus('${m.id}','${m.status === 'Active' ? 'Suspended' : 'Active'}','${m.username}')"
                  class="btn btn-sm" title="${m.status === 'Active' ? 'Suspend' : 'Activate'}"
                  style="background:${m.status === 'Active' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)'};color:${m.status === 'Active' ? 'var(--green)' : 'var(--red)'};border:1px solid ${m.status === 'Active' ? 'var(--green)' : 'var(--red)'}44;font-size:.72rem;padding:.2rem .6rem;border-radius:20px;font-weight:700">
                  ${m.status === 'Active' ? '✓ Active' : '✗ ' + m.status}
                </button>
              </td>
              <td>${m.joined}</td>
              <td>${actionBtns(
    `openFormModal('member','${m.id}')`,
    `confirmAction('Delete Member','Delete member [${m.username}]? This action cannot be undone.',()=>window.deleteMember('${m.id}','${m.username}'),'Delete','danger')`,
    `<button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" title="View Detail" onclick="window.showMember('${m.username}')"><i class="fa-solid fa-eye"></i></button>`
  )}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
  `;
};

// ── Member status toggle (Active ↔ Suspended) ──────────────────────
import { saveState } from '../core/state.js';
import { toast } from '../ui/components.js';
window.toggleMemberStatus = async (id, newStatus, username) => {
  const label = newStatus === 'Active' ? 'activate' : 'suspend';
  if (!confirm(`Are you sure you want to ${label} member [${username}]?`)) return;
  const member = STATE.members.find(m => m.id === id);
  if (!member) return;
  if (window.db?.dbUpdateMember) {
    const { error } = await window.db.dbUpdateMember(id, { status: newStatus });
    if (error) { toast('Update failed: ' + error.message, 'error'); return; }
    if (window.db?.dbWriteLog) window.db.dbWriteLog(
      newStatus === 'Active' ? 'Activate Member' : 'Suspend Member',
      username, `Member ${username} status → ${newStatus}`
    );
  } else {
    member.status = newStatus;
    saveState();
  }
  toast(`Member [${username}] ${newStatus === 'Active' ? 'activated ✓' : 'suspended ✗'}`, 'success');
  window.go('global-member-list');
};

pages['tier-history'] = () => {
  const PG = 'tier-history';
  const tiers = STATE.vipTiers || [];
  const members = STATE.members;

  // Build synthetic tier history from member data (or use STATE.tierHistory if it exists)
  if (!STATE.tierHistory || STATE.tierHistory.length === 0) {
    const tierNames = tiers.map(t => t.name);
    const changes = ['Auto-Upgrade', 'Auto-Downgrade', 'Manual Override', 'Reset', 'Manual Override'];
    const actors = ['System', 'System', 'superadmin', 'System', 'owner_hokibet'];
    const sample = [];
    members.forEach((m, idx) => {
      const currentTierIdx = Math.min(Math.floor(m.balance / 2000000), tierNames.length - 1);
      const prevTierIdx = Math.max(0, currentTierIdx - 1);
      const daysAgo = (idx % 30) + 1;
      const d = new Date(); d.setDate(d.getDate() - daysAgo);
      sample.push({
        id: 'TH' + (10000 + idx),
        member: m.username,
        company: m.company,
        prevTier: tierNames[prevTierIdx],
        newTier: tierNames[currentTierIdx],
        change: changes[idx % changes.length],
        actor: actors[idx % actors.length],
        turnoverReq: fmt(tiers[currentTierIdx]?.turnover || 0),
        turnoverAchieved: fmt(m.balance * 2),
        date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      });
    });
    STATE.tierHistory = sample;
  }

  const filterUser = (STATE._filters?.[PG]?.username || '').toLowerCase();
  const filterTier = STATE._filters?.[PG]?.tier || '';
  const filterChange = STATE._filters?.[PG]?.change || '';

  let rows = STATE.tierHistory;
  if (filterUser) rows = rows.filter(r => r.member.toLowerCase().includes(filterUser));
  if (filterTier && filterTier !== 'All') rows = rows.filter(r => r.newTier === filterTier || r.prevTier === filterTier);
  if (filterChange && filterChange !== 'All') rows = rows.filter(r => r.change === filterChange);

  const total = rows.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const paged = paginate(rows, cp, pp);

  const TIER_COLORS = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#ffd700', Platinum: '#e5e4e2', Diamond: '#b9f2ff' };
  const tierBadge = (t) => `<span style="background:${TIER_COLORS[t] || 'var(--acc)'}22;color:${TIER_COLORS[t] || 'var(--acc)'};border:1px solid ${TIER_COLORS[t] || 'var(--acc)'}55;border-radius:20px;padding:.15rem .6rem;font-size:.72rem;font-weight:700">${t}</span>`;

  return `
    ${pageHeader('Tier / Group History', '<span>Main</span><span class="sep">›</span><span>Tier History</span>', `
      ${exportBtn('tier-history.csv', 'Export CSV')}
    `)}

    ${filterCard(`
      ${fsInput(PG, 'username', 'Member', 'Search username...')}
      ${fsSelect(PG, 'tier', 'Tier', ['All', ...(tiers.map(t => t.name))])}
      ${fsSelect(PG, 'change', 'Change Type', ['All', 'Auto-Upgrade', 'Auto-Downgrade', 'Manual Override', 'Reset'])}
      ${fsActions(PG)}
    `)}

    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:1rem;margin-bottom:1.5rem">
      ${tiers.map(t => {
        const count = members.filter(m => {
          const idx = Math.min(Math.floor(m.balance / 2000000), tiers.length - 1);
          return tiers[idx]?.name === t.name;
        }).length;
        return `
        <div class="card" style="border:1px solid ${TIER_COLORS[t.name] || 'var(--border)'}44">
          <div class="card-body" style="padding:1rem;display:flex;align-items:center;gap:.75rem">
            <div style="width:36px;height:36px;border-radius:50%;background:${TIER_COLORS[t.name] || 'var(--acc)'}22;display:flex;align-items:center;justify-content:center;color:${TIER_COLORS[t.name] || 'var(--acc)'}">
              <i class="fa-solid fa-crown" style="font-size:.9rem"></i>
            </div>
            <div>
              <div style="font-weight:700;color:${TIER_COLORS[t.name] || 'var(--acc)'}">${t.name}</div>
              <div style="font-size:1.2rem;font-weight:800">${count}</div>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

    ${tableWrap(`
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Company</th>
            <th>Previous Tier</th>
            <th>New Tier</th>
            <th>Change Type</th>
            <th>Turnover Required</th>
            <th>Turnover Achieved</th>
            <th>Changed By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${paged.map(r => `
            <tr>
              <td style="font-weight:700;color:var(--acc)">${r.member}</td>
              <td style="font-size:.78rem;color:var(--text3)">${r.company}</td>
              <td>${tierBadge(r.prevTier)}</td>
              <td>
                ${tierBadge(r.newTier)}
                ${r.newTier !== r.prevTier ? (tiers.findIndex(t=>t.name===r.newTier) > tiers.findIndex(t=>t.name===r.prevTier)
                  ? '<i class="fa-solid fa-arrow-up" style="color:var(--green);margin-left:.3rem;font-size:.7rem"></i>'
                  : '<i class="fa-solid fa-arrow-down" style="color:var(--red);margin-left:.3rem;font-size:.7rem"></i>') : ''}
              </td>
              <td>${badge(r.change, r.change.includes('Upgrade') ? 'success' : r.change.includes('Down') ? 'warning' : r.change === 'Reset' ? 'danger' : 'secondary')}</td>
              <td style="font-size:.78rem">${r.turnoverReq}</td>
              <td style="font-size:.78rem;color:var(--green)">${r.turnoverAchieved}</td>
              <td style="font-size:.78rem">${r.actor === 'System' ? '<span style="color:var(--text3)"><i class="fa-solid fa-robot"></i> System</span>' : `<span style="color:var(--acc)">${r.actor}</span>`}</td>
              <td style="font-size:.72rem;color:var(--text3)">${r.date}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
  `;
};
