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
              <td>${badge(m.status, m.status === 'Active' ? 'success' : 'danger')}</td>
              <td>${m.joined}</td>
              <td>${actionBtns(
    `openFormModal('member','${m.id}')`,
    `confirmAction('Delete Member','Delete member [${m.username}]? This action cannot be undone.',()=>{window.stateDelete('members','${m.id}');window.go('global-member-list');toast('Member deleted','success')},'Delete','danger')`,
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

pages['tier-history'] = () => {
  return `
    ${pageHeader('Tier/Group History', '<span>Main</span><span class="sep">›</span><span>Tier History</span>')}
    <div class="card"><div class="card-body" style="text-align:center;padding:4rem;color:var(--text3)"><i class="fa-solid fa-clock-rotate-left" style="font-size:3rem;margin-bottom:1rem;opacity:.5"></i><p>Tier history tracking will be available soon.</p></div></div>
  `;
};
