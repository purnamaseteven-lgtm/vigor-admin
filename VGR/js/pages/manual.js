/* ─── MANUAL BOOK / SYSTEM DOCUMENTATION ─── */
import { STATE } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, tableWrap } from '../ui/components.js';

// ── Section definitions ────────────────────────────────────────────────
const MANUAL_SECTIONS = [
  {
    id: 'overview', icon: 'fa-book-open', title: 'System Overview',
    subsections: [
      {
        title: 'What is VIGOR?',
        content: `VIGOR (VGR) is a full-featured whitelabel gambling administration platform. It supports multi-level role management (SuperAdmin → Master Agent → Company/Agent), complete member lifecycle management, finance workflows, CRM automation, and real-time reporting — all in a single-page application (SPA) built with Vite + Vanilla JS.`
      },
      {
        title: 'Architecture',
        content: `<ul>
          <li><strong>Frontend:</strong> Vite 5 + Vanilla JS ES Modules, no framework</li>
          <li><strong>Backend:</strong> Supabase (PostgreSQL + Realtime + Auth)</li>
          <li><strong>State:</strong> Centralized <code>STATE</code> object in <code>core/state.js</code>, persisted via <code>localStorage</code></li>
          <li><strong>Routing:</strong> Hash-based SPA router — <code>go('page-name')</code> renders pages from the <code>pages</code> registry</li>
          <li><strong>Demo Mode:</strong> When Supabase is not configured, all data runs from mock STATE (no server needed)</li>
        </ul>`
      },
      {
        title: 'Role Hierarchy',
        content: `<div style="overflow-x:auto"><table class="manual-table"><thead><tr><th>Role</th><th>Scope</th><th>Key Capabilities</th></tr></thead><tbody>
          <tr><td><strong>SuperAdmin</strong></td><td>Global</td><td>All features, all companies, system config</td></tr>
          <tr><td><strong>Master Agent</strong></td><td>Vigor Group</td><td>Multi-company oversight, invoice, reports</td></tr>
          <tr><td><strong>Company / Agent</strong></td><td>Single company</td><td>Members, deposits/WD, bonuses, results for their company</td></tr>
          <tr><td><strong>Shop</strong></td><td>Single shop</td><td>Limited to their shop's members and transactions</td></tr>
        </tbody></table></div>`
      }
    ]
  },
  {
    id: 'dashboard', icon: 'fa-gauge', title: 'Dashboard',
    subsections: [
      {
        title: 'KPI Widgets',
        content: `The dashboard displays real-time KPIs computed from live STATE data:
        <ul>
          <li><strong>Total Members / Today Registrations</strong> — Counts all members; today's joins use <code>m.joinDate</code> compared to today's ISO date</li>
          <li><strong>Registrations + Deposit</strong> — Members who have at least one approved deposit (conversion rate)</li>
          <li><strong>Pending Deposits / Withdrawals</strong> — Active queue sizes for the finance team</li>
          <li><strong>Jackpot Ticker</strong> — Auto-increments every second via <code>setInterval</code></li>
        </ul>`
      },
      {
        title: 'Smart Alerts',
        content: `Smart Alerts in the top-right panel surface actionable items:
        <ul>
          <li>Pending deposit and withdrawal counts with quick-links</li>
          <li>Registration conversion rate (registered → deposited)</li>
          <li>Today's new member count</li>
          <li>System broadcast notifications</li>
        </ul>`
      },
      {
        title: 'Auto Refresh',
        content: `Use the <strong>Auto Refresh</strong> dropdown in the Smart Alerts header to set a refresh interval (10s, 30s, 1m, 5m). The dashboard will re-render at the chosen rate. Setting to <em>Manual</em> disables automatic refresh. The interval persists in <code>STATE.refreshSettings.interval</code>.`
      }
    ]
  },
  {
    id: 'members', icon: 'fa-users', title: 'Member Management',
    subsections: [
      {
        title: 'Member List',
        content: `Navigate to <strong>Members → Global Member List</strong>. The table shows all members with:
        <ul>
          <li>Username (clickable for full profile modal), Member ID</li>
          <li>Bank info, Balance, Joined date</li>
          <li>Referral: who referred them, and how many they have referred</li>
          <li>Status toggle button (Active ↔ Suspended)</li>
          <li>Edit / Delete / View actions</li>
        </ul>
        Filter by username, name, company, or joined date range. Export to CSV using the top-right button.`
      },
      {
        title: 'Adding / Editing a Member',
        content: `Click <strong>Add Member</strong> (top right) or the <i class="fa-solid fa-pen-to-square"></i> edit icon on any row. The form modal collects: username, full name, phone, bank name + account number, company assignment, referral code, and initial balance.`
      },
      {
        title: 'Member Status',
        content: `Click the status badge button on any member row to toggle between <strong>Active</strong> and <strong>Suspended</strong>. A confirmation prompt appears before the change is saved. Suspended members cannot log into the player site.`
      },
      {
        title: 'Referral Tree',
        content: `Click the <i class="fa-solid fa-sitemap"></i> referral button on any member who has referred others. A popup tree shows up to 3 levels deep of downline members, with their company, referral earnings from approved Referral-type bonuses, and downline count per node.`
      },
      {
        title: 'VIP / Tier History',
        content: `Navigate to <strong>Members → Tier History</strong> to see all tier change events (upgrades, downgrades, manual overrides). Filter by member username, tier name, or change type. Tier summary cards at the top show current member counts per tier.`
      }
    ]
  },
  {
    id: 'finance', icon: 'fa-coins', title: 'Finance',
    subsections: [
      {
        title: 'Deposit Management',
        content: `Navigate to <strong>Finance → Deposit</strong>. Pending deposits appear in a queue. Each row shows member, amount, bank, method, and timestamp. Actions: <strong>Approve</strong> (credits member balance), <strong>Reject</strong> (with optional rejection reason).
        <br><br><strong>Sound Notifications:</strong> When a deposit is approved, a rising chime (C5→E5→G5) plays via the Web Audio API. Toggle sounds using the 🔔 / 🔕 button in the page header.`
      },
      {
        title: 'Withdrawal Management',
        content: `Navigate to <strong>Finance → Withdrawal</strong>. Similar queue to deposits. Approve deducts the member's balance; reject returns funds. On approval, a neutral double-beep plays.`
      },
      {
        title: 'Manual Adjustment',
        content: `Finance → Adjustment allows admins to manually add or subtract from member balances with a required reason note. All adjustments are logged in the Adjustment Logs.`
      },
      {
        title: 'Finance Reports & Summaries',
        content: `Finance Summary, Daily Summary, and Company Summary pages aggregate approved deposit/withdrawal totals by period or company. These are read-only reporting views.`
      }
    ]
  },
  {
    id: 'bonus', icon: 'fa-gift', title: 'Bonus & Promotions',
    subsections: [
      {
        title: 'Bonus Types',
        content: `<div style="overflow-x:auto"><table class="manual-table"><thead><tr><th>Type</th><th>Description</th></tr></thead><tbody>
          <tr><td>New Member</td><td>One-time bonus on first deposit</td></tr>
          <tr><td>Deposit Bonus</td><td>% match on any qualifying deposit</td></tr>
          <tr><td>Cashback</td><td>% of losses returned periodically</td></tr>
          <tr><td>Referral</td><td>Bonus for bringing in new depositing members</td></tr>
          <tr><td>Free Bet (Agent)</td><td>Vouchers issued by company agents</td></tr>
          <tr><td>Rolling</td><td>Bonus unlocked after meeting turnover requirements</td></tr>
          <tr><td>Manual</td><td>Admin-issued one-off bonus</td></tr>
        </tbody></table></div>`
      },
      {
        title: 'Agent Free Bet (Feature #8)',
        content: `Navigate to <strong>Bonus → Agent Free Bet</strong>. At the top you'll see a <strong>Company Summary</strong> table showing total free bet amount, active count, used amount, and utilization progress bar for each company — sorted by total amount. Below is the detailed free bet list with per-member filtering.`
      },
      {
        title: 'Rolling Bonus Adjustment (Feature #9)',
        content: `Navigate to <strong>Bonus → Rolling</strong>. Each member row shows:
        <ul>
          <li>Total bonus received and rolling multiplier requirement (default 5×)</li>
          <li>Turnover required vs achieved with a progress bar</li>
          <li>Manual adjustment field (%) — set a custom multiplier override per member</li>
        </ul>
        Click <strong>Apply</strong> to save the adjustment to <code>STATE.settings.rolling_adj_{username}</code>.`
      },
      {
        title: 'Approving Bonuses',
        content: `All bonus requests go through an approval flow. Pending bonuses appear in the relevant section. Use Approve / Reject actions. Approved bonuses credit the member's balance; rejected ones are logged with reason.`
      }
    ]
  },
  {
    id: 'crm', icon: 'fa-bullseye', title: 'CRM Module',
    subsections: [
      {
        title: 'Overview',
        content: `The CRM module provides player engagement tools tailored for the lottery/gambling business:
        <ul>
          <li><strong>Segments</strong> — Group members by behavior (dormancy, deposit streak, game preference)</li>
          <li><strong>Missions</strong> — Challenge players to achieve goals in exchange for rewards</li>
          <li><strong>Tournaments</strong> — Time-limited competitive events with prize pools</li>
          <li><strong>Automation Rules</strong> — Trigger bonuses or messages based on events</li>
          <li><strong>Push Campaigns</strong> — Broadcast messages to targeted segments</li>
          <li><strong>Dormancy Report</strong> — Identify and re-engage inactive players</li>
          <li><strong>Loyalty Points</strong> — Point accumulation with leaderboard and manual awards</li>
        </ul>`
      },
      {
        title: 'Creating a Segment',
        content: `Go to <strong>CRM → Segments</strong> and click <strong>+ New Segment</strong>. Define:
        <ul>
          <li><strong>Name</strong> — descriptive label (e.g. "Dormant 7 Days")</li>
          <li><strong>Criteria</strong> — JSON object defining rules (inactiveDays, minBalance, gameType, etc.)</li>
          <li><strong>Auto-sync</strong> — When enabled, segment membership updates automatically on page load</li>
        </ul>
        Use the <strong>Quick Templates</strong> button to create pre-built segments for common lottery patterns (Togel Lovers, First Deposit Pending, VIP Diamond, etc.).`
      },
      {
        title: 'Missions',
        content: `Go to <strong>CRM → Missions</strong>. Missions are challenges members complete for rewards:
        <ul>
          <li>Types: Bet, Deposit, Login, Referral, Custom</li>
          <li>Reward types: Bonus credit, Free Bet, Loyalty Points</li>
          <li>Each mission has a target value and date range</li>
        </ul>
        Use <strong>Quick Templates</strong> for pre-built lottery missions (e.g. "Pasang 10x Togel" → Rp 50,000 bonus).`
      },
      {
        title: 'Dormancy Report (Feature #1)',
        content: `Go to <strong>CRM → Dormancy</strong>. The page shows:
        <ul>
          <li><strong>KPI cards:</strong> Dormant 1–3d, 4–7d, 7–30d, 30d+</li>
          <li><strong>Member table</strong> with last activity date, inactive days, favorite game, deposit streak</li>
          <li><strong>Push action</strong> per member — opens personalized push message modal</li>
          <li><strong>Bulk Push</strong> — sends a campaign to all members dormant 7+ days at once</li>
        </ul>
        Dormancy is computed from: <code>max(lastBetDate, lastDepositDate, joinDate)</code>.`
      },
      {
        title: 'Loyalty Points (Feature #1)',
        content: `Go to <strong>CRM → Loyalty</strong>. Points are earned at 1 point per Rp 10,000 turnover. The page shows a ranked leaderboard with total points, earned from turnover, and manually awarded points. Use <strong>Award Points</strong> on any member to manually credit extra points with a reason note.`
      },
      {
        title: 'Automation Rules',
        content: `Go to <strong>CRM → Automation</strong>. Define trigger → condition → action rules:
        <ul>
          <li><strong>Triggers:</strong> on_deposit, on_withdrawal_approve, on_login, on_bet, on_dormant</li>
          <li><strong>Conditions:</strong> amount thresholds, member tier, segment membership</li>
          <li><strong>Actions:</strong> send_bonus, send_push, update_tier, send_memo</li>
        </ul>
        Rules run on the next matching event when Supabase realtime is active.`
      },
      {
        title: 'Push Campaigns',
        content: `Go to <strong>CRM → Push Campaigns</strong>. Create targeted broadcast messages with:
        <ul>
          <li>Target segment (All, or any named segment)</li>
          <li>Channel: In-App, Email, SMS, WhatsApp</li>
          <li>Schedule: Immediate or future date/time</li>
          <li>Status tracking: Draft → Scheduled → Sent</li>
        </ul>`
      }
    ]
  },
  {
    id: 'vip', icon: 'fa-crown', title: 'VIP Tier System',
    subsections: [
      {
        title: 'VIP Tiers Overview',
        content: `Navigate to <strong>Customization → VIP Tiers</strong>. VIP tiers define player status levels with associated benefits. Default tiers: Bronze, Silver, Gold, Platinum, Diamond.`
      },
      {
        title: 'Calculation Method (Feature #13)',
        content: `VIP tier progression can be based on either:
        <ul>
          <li><strong>Turnover (TO)</strong> — total bet/wagered amount (default)</li>
          <li><strong>Deposit</strong> — cumulative deposit amount</li>
        </ul>
        Switch the method using the toggle buttons at the top of the VIP Tiers page. The selected method is saved to <code>STATE.settings.vipCalcMethod</code> and affects tier assignment for all members.`
      },
      {
        title: 'CRM Sync',
        content: `Enable the <strong>Sync with CRM</strong> toggle to automatically create/update CRM segments when tier thresholds are changed. Each tier creates a segment named "<em>VIP: {TierName}</em>" that auto-populates with qualifying members.`
      },
      {
        title: 'Adding / Editing Tiers',
        content: `Click <strong>+ Add Tier</strong> to define a new tier with: name, minimum deposit threshold, minimum turnover threshold, cashback %, bonus %, and description. The <strong>Create CRM Segment</strong> button on each tier card instantly creates a matching CRM segment.`
      }
    ]
  },
  {
    id: 'customization', icon: 'fa-palette', title: 'Customization',
    subsections: [
      {
        title: 'Popup Banner Manager (Feature #10)',
        content: `Navigate to <strong>Customization → Global Banner</strong>. Manage popup banners displayed on the player-facing frontend:
        <ul>
          <li>Create banners with title, message, image URL, button label + link</li>
          <li>Set trigger: On Login, After Deposit, Timed (seconds), On Exit</li>
          <li>Target audience: All, New Members, VIP only, by Company</li>
          <li>Priority (1–10) — higher priority banners show first</li>
          <li>Active/Inactive toggle and per-banner preview</li>
        </ul>
        Banners are stored in <code>STATE.popupBanners</code>.`
      },
      {
        title: 'Theme & Branding',
        content: `Customization → Branding allows per-company logo, color theme, and favicon overrides. Theme switching (light/dark) is available globally via the moon/sun icon in the header.`
      },
      {
        title: 'Maintenance Mode',
        content: `Customization → Maintenance lets you enable a maintenance screen on the player site, with a custom message and estimated downtime. A system notification is broadcast to all admins when maintenance is toggled.`
      }
    ]
  },
  {
    id: 'notifications', icon: 'fa-bell', title: 'Notifications',
    subsections: [
      {
        title: 'Bell Notifications (Feature #15)',
        content: `The 🔔 bell icon in the top header shows a badge count of unread notifications + pending finance items. Click it to open the notification panel showing:
        <ul>
          <li>System broadcast messages (maintenance alerts, announcements)</li>
          <li>Pending deposit items</li>
          <li>Pending withdrawal items</li>
        </ul>
        Click any item to navigate to the relevant page. Use <strong>Mark All Read</strong> to clear the badge.`
      },
      {
        title: 'Broadcasting a Notification',
        content: `SuperAdmins and Masters can click <strong>Broadcast</strong> in the notification panel to send a system notification. Fields:
        <ul>
          <li><strong>Title</strong> — short headline</li>
          <li><strong>Message</strong> — body text</li>
          <li><strong>Type</strong> — info, success, warning, danger</li>
          <li><strong>Target Role</strong> — All, SuperAdmin, Master, Company</li>
        </ul>
        The notification is added to <code>STATE.systemNotifications</code> and plays an alert sound if enabled.`
      },
      {
        title: 'Sound Notifications (Feature #16)',
        content: `Finance sounds play via the <strong>Web Audio API</strong> (no external library). Sounds trigger on:
        <ul>
          <li><strong>Deposit Approved</strong> → Rising chime (C5 → E5 → G5)</li>
          <li><strong>Withdrawal Approved</strong> → Neutral double-beep</li>
          <li><strong>System Alert / Broadcast</strong> → Urgent triple beep</li>
        </ul>
        Toggle sounds with the speaker button on the Deposit page header. Sound preference is saved to <code>STATE.notifPreferences.sound</code>.`
      }
    ]
  },
  {
    id: 'reports', icon: 'fa-chart-column', title: 'Reports',
    subsections: [
      {
        title: 'Win/Loss Report',
        content: `Reports → WinLoss Report shows GGR (Gross Gaming Revenue = total bets − total winnings) per company or across all companies. Filter by date range and company.`
      },
      {
        title: 'Agent Statistics (Feature #12)',
        content: `Reports → Agent Daily / Company Summary shows per-company statistics:
        <ul>
          <li>Total members, active members</li>
          <li>Total deposits and withdrawals</li>
          <li>GGR and total bet volume</li>
        </ul>
        Whitelabel admins can click <strong>Detail</strong> on any company row to open a drill-down modal with top 10 members by deposit and all KPIs for that company.`
      },
      {
        title: 'Limit Credit Report',
        content: `Shows current credit limits vs usage per agent/company. Highlights overages in red.`
      },
      {
        title: 'Top Turnover',
        content: `Ranked list of members by cumulative turnover. Useful for identifying high-value players for VIP upgrade.`
      }
    ]
  },
  {
    id: 'referral', icon: 'fa-sitemap', title: 'Referral System (Feature #14)',
    subsections: [
      {
        title: 'How Referrals Work',
        content: `Each member has an optional <code>referredBy</code> field (username of who referred them). When a referred member makes a qualifying deposit, a Referral-type bonus is generated for the referrer.`
      },
      {
        title: 'Viewing Referral Data',
        content: `In the Member List, two columns show referral data:
        <ul>
          <li><strong>Referral By</strong> — who referred this member (clickable to view their profile)</li>
          <li><strong>Referred Users</strong> — count of members this user has referred + their referral earnings</li>
        </ul>
        Click the <i class="fa-solid fa-sitemap"></i> button to open the full referral tree modal (up to 3 levels deep).`
      },
      {
        title: 'Referral Earnings',
        content: `Referral earnings are computed from <code>STATE.bonuses</code> filtered by: <code>type === 'Referral'</code> AND <code>status === 'Approved'</code> AND <code>member === username</code>. The total appears next to the referral count in the member table and in the referral tree nodes.`
      }
    ]
  },
  {
    id: 'settings', icon: 'fa-gears', title: 'Settings',
    subsections: [
      {
        title: 'General Settings',
        content: `Settings → General covers: site name, default currency, timezone, language, maintenance mode toggle, and deposit/withdrawal limits. Changes save to <code>STATE.settings</code> and persist via <code>localStorage</code> (or Supabase when connected).`
      },
      {
        title: 'Rolling Multiplier',
        content: `In Settings, the Rolling Multiplier field sets the default turnover requirement for rolling bonuses (default: 5×). This means a Rp 100,000 bonus requires Rp 500,000 turnover before withdrawal. Can be overridden per-member in Bonus → Rolling.`
      },
      {
        title: 'Bank Management',
        content: `Settings → Bank Management or Bank Management section manages the list of approved payment banks/methods, their account details, and active status. Only active banks appear in deposit/withdrawal forms.`
      },
      {
        title: 'Admin Permissions (RBAC)',
        content: `Settings → Admins / Admin Management defines what each admin role can access. Each role has a permission tree with module → sub-feature granularity. Changes take effect on next login or page refresh.`
      }
    ]
  },
  {
    id: 'tools', icon: 'fa-screwdriver-wrench', title: 'Tools',
    subsections: [
      {
        title: 'IP Whitelist',
        content: `Tools → IP Whitelist restricts backend access to specific IP addresses. Add IPs individually or as CIDR ranges. Changes are applied server-side via Supabase RLS policies.`
      },
      {
        title: 'Maintenance Tools',
        content: `Tools → Maintenance schedules maintenance windows with start/end time and notification message. When active, all player-site requests receive the maintenance page.`
      },
      {
        title: 'Simulator',
        content: `The dev-mode role simulator bar (visible in Demo Mode only) lets developers switch between SuperAdmin, Master Agent, and Company roles without logging out. Uses the <code>switchSimulatedRole()</code> function.`
      }
    ]
  },
  {
    id: 'seamless', icon: 'fa-puzzle-piece', title: 'Seamless API Integration',
    subsections: [
      {
        title: 'Overview',
        content: `The Seamless API module handles integration with game providers (e.g. IDN Poker, Pragmatic Play). Each provider has a unique API key, secret, callback URL, and IP whitelist.`
      },
      {
        title: 'Endpoints',
        content: `Standard seamless endpoints provided:
        <ul>
          <li><code>GET /balance</code> — Get member balance</li>
          <li><code>POST /debit</code> — Deduct from balance (bet placed)</li>
          <li><code>POST /credit</code> — Add to balance (win/refund)</li>
          <li><code>POST /rollback</code> — Reverse a failed transaction</li>
        </ul>
        All requests are authenticated via HMAC-SHA256 signature validation.`
      }
    ]
  },
  {
    id: 'logs', icon: 'fa-scroll', title: 'System Logs',
    subsections: [
      {
        title: 'Log Types',
        content: `<div style="overflow-x:auto"><table class="manual-table"><thead><tr><th>Log</th><th>What it captures</th></tr></thead><tbody>
          <tr><td>Admin Logs</td><td>All admin login/logout, setting changes, role changes</td></tr>
          <tr><td>Company Logs</td><td>Company/agent creation, modification, status changes</td></tr>
          <tr><td>Whitelabel Logs</td><td>Whitelabel-level configuration changes</td></tr>
          <tr><td>Member Logs</td><td>Member registration, status changes, balance adjustments</td></tr>
          <tr><td>Master WL Logs</td><td>Master agent tier and credit limit changes</td></tr>
        </tbody></table></div>`
      },
      {
        title: 'Log Retention',
        content: `Logs are written to Supabase <code>admin_logs</code> table and are permanent (no auto-deletion). In Demo Mode, logs are held in <code>STATE.logs</code> memory and reset on refresh.`
      }
    ]
  },
  {
    id: 'faq', icon: 'fa-circle-question', title: 'FAQ & Troubleshooting',
    subsections: [
      {
        title: 'Page shows "No data available"',
        content: `In Demo Mode, mock data is generated from <code>STATE.members</code>, <code>STATE.bets</code>, etc. If data appears empty, check that <code>initState()</code> seeded the correct mock data. In Supabase Mode, verify your RLS policies allow the current admin's role to read the relevant tables.`
      },
      {
        title: 'Sound not playing on approve',
        content: `Browsers block <code>AudioContext</code> until a user gesture has occurred on the page. Make sure the admin has clicked somewhere on the page at least once. Also check that sound is not muted via the 🔔 toggle on the Deposit page.`
      },
      {
        title: 'Auto-refresh not working',
        content: `Auto-refresh uses <code>setInterval</code> on the dashboard. It only activates after you select a non-zero interval from the dropdown. If the browser tab is sleeping (background throttling), intervals may fire less frequently — this is a browser limitation.`
      },
      {
        title: '"Page not found" in sidebar',
        content: `If clicking a nav link results in a blank/error page, the page alias may be missing. Check that the page key is registered in <code>pages[...]</code> in the relevant <code>js/pages/*.js</code> file. Common aliases: <code>admins-list → admin-management</code>, <code>master-wl-list → master-whitelabel-list</code>.`
      },
      {
        title: 'Supabase connection failing',
        content: `Check <code>js/core/supabase.js</code> for your <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code>. In Demo Mode the app will still run without a connection. Run <code>npm run build</code> after any env changes and clear the browser cache.`
      },
      {
        title: 'How do I add a new page?',
        content: `1. Create or edit a file in <code>js/pages/</code><br>
        2. Register: <code>pages['my-page'] = () => \`...html...\`;</code><br>
        3. Import the file in <code>js/main.js</code><br>
        4. Add the nav link in <code>js/ui/components.js → renderSidebar()</code><br>
        5. Add RBAC entry in <code>js/core/auth.js → MODULE_MAP</code>`
      }
    ]
  }
];

// ── Page renderer ──────────────────────────────────────────────────────
pages['manual'] = () => {
  const activeSection = STATE._manualSection || MANUAL_SECTIONS[0].id;

  const sidebarLinks = MANUAL_SECTIONS.map(s => `
    <div class="manual-nav-item ${activeSection === s.id ? 'active' : ''}" onclick="window.setManualSection('${s.id}')">
      <i class="fa-solid ${s.icon}" style="width:16px;text-align:center;opacity:.7"></i>
      <span>${s.title}</span>
    </div>
  `).join('');

  const section = MANUAL_SECTIONS.find(s => s.id === activeSection) || MANUAL_SECTIONS[0];

  const sectionHTML = section.subsections.map((sub, i) => `
    <div class="manual-section-card" id="manual-sub-${i}">
      <h3 class="manual-sub-title">
        <span class="manual-sub-num">${i + 1}</span>
        ${sub.title}
      </h3>
      <div class="manual-sub-content">${sub.content}</div>
    </div>
  `).join('');

  return `
    ${pageHeader('System Manual', '<span>Help</span><span class="sep">›</span><span>Manual Book</span>', `
      <button class="btn btn-secondary" onclick="window.printManualSection()"><i class="fa-solid fa-print"></i> Print Section</button>
    `)}

    <style>
      .manual-layout { display:grid; grid-template-columns:220px 1fr; gap:1.5rem; align-items:start; }
      .manual-sidebar { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:.75rem; position:sticky; top:1rem; }
      .manual-sidebar-title { font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text3); padding:.4rem .75rem .6rem; }
      .manual-nav-item { display:flex; align-items:center; gap:.6rem; padding:.55rem .75rem; border-radius:8px; cursor:pointer; font-size:.82rem; color:var(--text2); transition:all .15s; margin:.1rem 0; }
      .manual-nav-item:hover { background:var(--bg3); color:var(--text1); }
      .manual-nav-item.active { background:var(--acc)18; color:var(--acc); font-weight:600; }
      .manual-content { min-width:0; }
      .manual-content-header { margin-bottom:1.25rem; }
      .manual-content-header h2 { font-size:1.25rem; font-weight:800; margin:0 0 .25rem; display:flex; align-items:center; gap:.6rem; }
      .manual-section-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:1.25rem 1.5rem; margin-bottom:1rem; }
      .manual-sub-title { font-size:.92rem; font-weight:700; margin:0 0 .75rem; display:flex; align-items:center; gap:.6rem; color:var(--text1); }
      .manual-sub-num { width:22px; height:22px; background:var(--acc); color:#fff; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:.68rem; font-weight:800; flex-shrink:0; }
      .manual-sub-content { font-size:.84rem; line-height:1.7; color:var(--text2); }
      .manual-sub-content ul { padding-left:1.2rem; margin:.4rem 0; }
      .manual-sub-content li { margin:.25rem 0; }
      .manual-sub-content code { background:var(--bg3); padding:.1rem .4rem; border-radius:4px; font-size:.78rem; font-family:monospace; color:var(--acc); }
      .manual-sub-content strong { color:var(--text1); }
      .manual-table { width:100%; border-collapse:collapse; font-size:.8rem; margin:.5rem 0; }
      .manual-table th { background:var(--bg3); padding:.45rem .7rem; text-align:left; font-weight:700; font-size:.72rem; text-transform:uppercase; letter-spacing:.04em; color:var(--text3); border:1px solid var(--border); }
      .manual-table td { padding:.45rem .7rem; border:1px solid var(--border); vertical-align:top; }
      .manual-table tr:hover td { background:var(--bg3)55; }
      @media(max-width:768px) { .manual-layout { grid-template-columns:1fr; } .manual-sidebar { position:static; } }
    </style>

    <div class="manual-layout">
      <div class="manual-sidebar">
        <div class="manual-sidebar-title">Contents</div>
        ${sidebarLinks}
      </div>
      <div class="manual-content">
        <div class="manual-content-header">
          <h2><i class="fa-solid ${section.icon}" style="color:var(--acc)"></i> ${section.title}</h2>
          <div style="font-size:.78rem;color:var(--text3)">${section.subsections.length} topic${section.subsections.length !== 1 ? 's' : ''} in this section</div>
        </div>
        ${sectionHTML}
      </div>
    </div>
  `;
};

// Section navigation
window.setManualSection = (id) => {
  STATE._manualSection = id;
  window.go('manual');
};

// Print current section
window.printManualSection = () => {
  const content = document.querySelector('.manual-content');
  if (!content) return;
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>VIGOR Manual</title>
    <style>
      body { font-family: system-ui, sans-serif; color: #1e293b; padding: 2rem; max-width: 800px; margin: 0 auto; }
      h2 { border-bottom: 2px solid #0ea5e9; padding-bottom: .5rem; }
      h3 { color: #0ea5e9; margin-top: 1.5rem; }
      code { background: #f1f5f9; padding: .1rem .4rem; border-radius: 4px; font-size: .85rem; color: #0369a1; }
      table { width: 100%; border-collapse: collapse; margin: .75rem 0; }
      th, td { border: 1px solid #e2e8f0; padding: .45rem .7rem; text-align: left; }
      th { background: #f8fafc; font-weight: 700; font-size: .8rem; }
      ul { padding-left: 1.2rem; }
      li { margin: .25rem 0; }
      .manual-sub-num { display:none; }
      @media print { body { padding: 1rem; } }
    </style></head><body>
    ${content.innerHTML}
    </body></html>
  `);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};
